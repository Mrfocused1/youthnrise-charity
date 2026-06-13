#!/usr/bin/env python3
"""
Build the site logo from the supplied Youth n Rise artwork:
  1. add a WHITE plate behind the "Youth" text (the enclosed transparent area
     inside the yellow outline) so it matches the white plate behind "Rise".
  2. crop tight + add transparent padding so it isn't flush/cropped in the header.
Uses scipy.ndimage.binary_fill_holes (fills regions enclosed by the outline).
"""
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "assets/media/youth-n-rise-original.png"
OUT = "assets/media/youth-n-rise-logo.png"

im = Image.open(SRC).convert("RGBA")
arr = np.array(im)
alpha = arr[..., 3]

opaque = alpha > 40                       # the artwork (outline, letters, plates)
filled = ndimage.binary_fill_holes(opaque)  # opaque + any enclosed transparent holes
holes = filled & ~opaque                  # the enclosed gaps (inside the Youth outline, counters, etc.)

# only treat holes that are NOT a tiny speck — keeps it clean
holes = ndimage.binary_closing(holes, structure=np.ones((3, 3)))
# grow the white slightly so it tucks fully under the letter/outline edges (no seam)
white_mask = ndimage.binary_dilation(holes, iterations=3) & filled

# white layer behind everything, then the original artwork composited on top
white = np.zeros_like(arr)
white[white_mask] = [255, 255, 255, 255]
white_img = Image.fromarray(white, "RGBA")
result = Image.alpha_composite(white_img, im)

# tight crop to strong content, then uniform transparent padding
a = np.array(result)[..., 3]
ys, xs = np.where(a > 40)
minx, maxx, miny, maxy = xs.min(), xs.max(), ys.min(), ys.max()
content = result.crop((minx, miny, maxx + 1, maxy + 1))
cw, ch = content.size
pad_y, pad_x = round(ch * 0.14), round(ch * 0.10)
canvas = Image.new("RGBA", (cw + pad_x * 2, ch + pad_y * 2), (0, 0, 0, 0))
canvas.paste(content, (pad_x, pad_y), content)
canvas.save(OUT)
print("holes filled white:", int(holes.sum()), "px")
print("saved", OUT, canvas.size, "aspect", round(canvas.size[0] / canvas.size[1], 2))
