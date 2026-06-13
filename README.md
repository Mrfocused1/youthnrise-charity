# rise — youth & community charity site

A charity website built on the **gethapply.com** layout & animation engine (decoded from the
original Shopify theme), repurposed from a product store into **"rise"**, a youth & community
charity (mentoring · learning · community). All imagery/video is **Pexels** media via your API key.

> The folder is still named `happly-clone` (it began as a study of gethapply.com), but the site
> is now a charity — no shop, no cart, no prices.

## Stack (matches the original)
- **GSAP + ScrollTrigger** — all scroll-driven animation
- **Lenis** — smooth scroll (expo easing, synced to the GSAP ticker)
- **Swiper** — carousels (loaded, ready)
- **Rethink Sans** — the exact font the original uses
- Plain HTML/CSS/JS, fluid `vw`-based `rem` scaling

## Sections & animations (`assets/js/main.js`)
| Section | Content | Effect |
|---|---|---|
| Header | nav + **donate** button (no cart) | colour adapts per section, announcement slides up, logo shrinks, hides over footer |
| Hero | "every young person deserves a fair start" | media parallax |
| **Programmes** (showcase) | mentor · learn · belong, with impact-stat chips | **pinned clip-path "wipe" reveal**, one panel at a time, gap-free |
| How we work (why) | led by young people · rooted in community · measured impact | fade-up reveals |
| CTA band | "change a young person's story" | reveal |
| Marquee | "every young person matters" | scroll-driven horizontal slide |
| Ways to help (cards) | become a mentor · give what you can | image zoom on hover |
| Monthly giving (subs) | regular giving perks | video background |
| **Stories** (testimonials) | mentee / mentor / member voices | auto-rotate, image **expands from centre**, progress bullets |
| Join the movement (scatter) | "be part of their story" | scattered photos **fly in from centre** |
| Footer | our work / get involved / about | giant "rise" wordmark |

## Contact page
`contact.html` (+ `contact.css` / `contact.js`) matches the site design with Lenis + GSAP
(hero entrance, parallax, scroll reveals, animated form → success state). Split form + contact
details + department cards + a CTA to the get-involved flow. Its media (`fetch-contact-media.mjs`
→ `contact-media.js`) is deduped against both the homepage and onboarding sets. Linked from the
nav and footer.

## Get-involved onboarding flow
`get-involved.html` (+ `onboarding.css` / `onboarding.js`) is a split-screen multi-step wizard
matching the rise design: **path → about you → tailor → done**, with GSAP step transitions,
inline validation, and a Pexels video/image on the right that swaps per chosen path. Deep-link a
path with `get-involved.html?path=mentor` (or `volunteer` / `fundraise` / `partner`). Every
"get involved", "become a mentor" and "volunteer" button on the homepage routes here.

## Pexels media
`fetch-media.mjs` curates charity-themed photos + video per section → `assets/js/media.js`.
Re-run anytime to refresh imagery:

```bash
node fetch-media.mjs      # uses the baked key, or PEXELS_KEY=... node fetch-media.mjs
```

`main.js` injects that media at load (hero/giving = video, programme panels = lazy video,
testimonials/cards/scatter = photos), so the key is **not** shipped in the page markup.

## Run

```bash
python3 -m http.server 8099
# open http://localhost:8099
```

A demo built on the gethapply.com layout; all media credited to Pexels.
