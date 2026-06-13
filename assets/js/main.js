/* ============================================================
   happly clone — animation engine
   Faithful re-implementation of gethapply.com behaviour:
   Lenis smooth scroll · GSAP + ScrollTrigger · Swiper
   Media injected from the Pexels API (assets/js/media.js)
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);
const M = window.HAPPLY_MEDIA || {};
const qs = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- video / image element helpers ---------- */
function videoEl(media, { lazy = false, poster } = {}) {
  const v = document.createElement("video");
  v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = !lazy;
  v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
  if (poster) v.poster = poster;
  if (lazy) { v.dataset.src = media.mp4; v.preload = "none"; }
  else { v.src = media.mp4; v.preload = "auto"; }
  return v;
}
function imgEl(src, alt = "") {
  const i = document.createElement("img");
  i.src = src; i.alt = alt; i.loading = "lazy"; i.decoding = "async";
  return i;
}

/* ============================================================
   1. SMOOTH SCROLL (Lenis) + GSAP ticker sync
   ============================================================ */
let lenis;
function initLenis() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  lenis = new Lenis({
    duration: 0.9,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo.out — matches happly
    smoothWheel: true,
    wheelMultiplier: 1,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;

  // anchor smooth-scroll
  qsa('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const t = qs(id);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -80, duration: 1.1 });
    });
  });
}

/* ============================================================
   2. MEDIA INJECTION (from Pexels)
   ============================================================ */
function injectMedia() {
  // hero — feature video, poster fallback
  const heroBox = qs("[data-hero-media]");
  if (heroBox) {
    // no poster — avoids a still image flashing behind the video while it loads
    if (M.hero?.mp4) heroBox.appendChild(videoEl(M.hero));
    else if (M.heroPoster) heroBox.appendChild(imgEl(M.heroPoster.img, "rise"));
  }

  // showcase moods — lazy video (played when its panel is active)
  qsa("[data-mood-media]").forEach((box) => {
    const mood = box.dataset.moodMedia;
    const data = M[mood];
    if (!data) return;
    if (data.video?.mp4) {
      const v = videoEl(data.video, { lazy: true, poster: data.photo?.img });
      box.prepend(v);
    } else if (data.photo) {
      box.prepend(imgEl(data.photo.img, mood));
    }
  });

  // subscription bg video
  const subs = qs("[data-subs-media]");
  if (subs) {
    if (M.ctaSubs?.mp4) subs.appendChild(videoEl(M.ctaSubs, { poster: M.heroPoster?.img }));
    else if (M.community) subs.appendChild(imgEl(M.community.img, ""));
  }

  // feature cards
  qsa("[data-card-media]").forEach((c) => {
    const key = c.dataset.cardMedia;
    if (M.cards?.[key]) c.prepend(imgEl(M.cards[key].img, key));
  });

  // testimonial images
  const timg = qs("[data-testimonial-images]");
  const bulletBox = qs("[data-testimonial-bullets]");
  if (timg && M.testimonials?.length) {
    M.testimonials.forEach((p, i) => {
      const d = document.createElement("div");
      d.className = "b-testimonials__image" + (i === 0 ? " active" : "");
      d.appendChild(imgEl(p.img, p.alt));
      timg.appendChild(d);
      const b = document.createElement("button");
      b.className = "b-testimonials__bullet" + (i === 0 ? " active" : "");
      b.setAttribute("aria-label", "testimonial " + (i + 1));
      bulletBox.appendChild(b);
    });
  }

  // story beat images
  qsa("[data-story-img]").forEach((el) => {
    const i = +el.dataset.storyImg;
    const p = M.scatter && M.scatter[i];
    if (p) el.appendChild(imgEl(p.img, p.alt));
  });
}

/* lazy-play showcase videos only while their panel is on screen */
function lazyVideos() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.dataset.src && !v.src) v.src = v.dataset.src;
          v.play?.().catch(() => {});
        } else v.pause?.();
      });
    },
    { rootMargin: "200px" }
  );
  qsa("video[data-src]").forEach((v) => io.observe(v));
}

/* ============================================================
   3. HEADER — colour adaptation, announcement, logo, footer hide
   ============================================================ */
function initHeader() {
  const header = qs(".header");
  const announc = qs(".c-announc");
  const logo = qs(".header__logo");
  const headerH = header.offsetHeight;
  const announcH = announc.offsetHeight;

  // colour adapts to the section crossing the header line
  qsa("[data-c]").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top top+=" + headerH / 2,
      end: "bottom top+=" + headerH / 2,
      onEnter: () => (header.dataset.color = el.dataset.c),
      onEnterBack: () => (header.dataset.color = el.dataset.c),
    });
  });

  // announcement slides up; header docks to the top
  ScrollTrigger.create({
    start: announcH, end: announcH + 1,
    onEnter: () => { gsap.to(announc, { yPercent: -100, duration: 0.4, ease: "power2.out" }); gsap.to(header, { top: 0, duration: 0.4, ease: "power2.out" }); header.classList.add("anim"); },
    onLeaveBack: () => { gsap.to(announc, { yPercent: 0, duration: 0.4, ease: "power2.out" }); gsap.to(header, { top: announcH, duration: 0.4, ease: "power2.out" }); header.classList.remove("anim"); },
  });

  // logo subtly shrinks past the hero
  const firstSection = qs("main section");
  if (firstSection) {
    gsap.to(logo, {
      scale: 0.85,
      transformOrigin: "left center",
      ease: "none",
      scrollTrigger: { trigger: firstSection, start: "top top", end: "70% top", scrub: 0 },
    });
  }

  // hide header over the footer
  ScrollTrigger.create({
    trigger: ".footer",
    start: "top " + headerH,
    end: "top top",
    scrub: 0,
    animation: gsap.to(header, { yPercent: -130, ease: "none" }),
  });

  // burger (mobile) — simple toggle
  const burger = qs(".c-burger");
  burger?.addEventListener("click", () => document.documentElement.classList.toggle("menu-open"));
}

/* ============================================================
   4. HERO — parallax on the media
   ============================================================ */
function initHero() {
  const img = qs(".b-hero__image");
  if (!img) return;
  gsap.fromTo(
    img,
    { yPercent: -6 },
    { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".b-hero", start: "top top", end: "bottom top", scrub: true } }
  );
}

/* ============================================================
   5. SHOWCASE — sticky-stacked clip-path reveal
   (decoded from happly chunk 931)
   ============================================================ */
function initShowcase() {
  const block = qs(".b-showcase");
  if (!block) return;
  const items = qsa(".b-showcase__item", block);
  if (items.length < 2) return;

  // panels are absolutely stacked (later = on top). The block is PINNED while a
  // single scrubbed timeline runs the clip-path "wipe" between consecutive panels —
  // because every panel always fills the viewport, the reveal is gap-free.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: block,
      start: "top top",
      end: () => "+=" + (items.length - 1) * window.innerHeight,
      pin: true,
      scrub: 0.25,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  // every panel after the first starts fully hidden (clipped away from the top) so
  // only the active transition is ever visible — no future panels peeking through.
  items.forEach((item, i) => {
    if (i === 0) return;
    const topbar = qs(".b-showcase__item__topbar", item);
    gsap.set(item, { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(topbar, { y: window.innerHeight - topbar.offsetHeight }); // label parked low, rises in
  });

  items.forEach((item, i) => {
    if (i === items.length - 1) return;
    const next = items[i + 1];
    const topbar = qs(".b-showcase__item__topbar", next);

    // transition i (slot [i, i+1]): current wipes up, next reveals bottom-up, its label rises
    tl.to(item, { clipPath: "inset(0% 0% 100% 0%)", ease: "none", duration: 1 }, i)
      .fromTo(next, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", duration: 1 }, i)
      .to(topbar, { y: 0, ease: "none", duration: 1 }, i);
  });
}

/* ============================================================
   6. MARQUEE — scroll-driven horizontal heading
   ============================================================ */
function initMarquee() {
  const heading = qs(".b-marquee__heading");
  const span = qs(".b-marquee__heading span");
  if (!span) return;
  const w = span.offsetWidth;
  gsap.fromTo(
    span,
    { x: window.innerWidth },
    {
      x: -w,
      ease: "none",
      scrollTrigger: { trigger: heading, start: "top bottom", end: "bottom top", scrub: 0 },
    }
  );
}

/* ============================================================
   7. STORY — one continuous line draws on scroll, dot rides the tip
   (one-line-scrollytelling technique, manual dash math — no DrawSVG)
   ============================================================ */
function catmullRom(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

function initStory() {
  const section = qs(".b-story");
  if (!section) return;
  const svg = qs(".b-story__svg", section);
  const guide = qs("#story-guide", svg);
  const trail = qs("#story-trail", svg);
  const dot = qs("#story-dot", svg);
  const beats = qsa(".b-story__beat", section);
  let L = 0;

  function build() {
    const W = section.offsetWidth;
    const H = section.offsetHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const amp = Math.min(W * 0.16, 230);
    const sRect = section.getBoundingClientRect();
    const pts = [{ x: W / 2, y: Math.min(H * 0.05, 90) }];
    beats.forEach((b) => {
      const r = b.getBoundingClientRect();
      const y = r.top - sRect.top + r.height / 2;
      const x = b.dataset.side === "right" ? W / 2 + amp : W / 2 - amp;
      pts.push({ x, y });
    });
    pts.push({ x: W / 2, y: H - Math.min(H * 0.05, 90) });

    const d = catmullRom(pts);
    [guide, trail, dot].forEach((p) => p.setAttribute("d", d));
    L = trail.getTotalLength();
    trail.style.strokeDasharray = L;
    dot.style.strokeDasharray = `1 ${L + 10}`;
    setProgress(window._storyP || 0);
  }
  function setProgress(p) {
    window._storyP = p;
    trail.style.strokeDashoffset = L * (1 - p);
    dot.style.strokeDashoffset = -(L * p * 0.999);
  }

  build();
  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: 1.2,
    onUpdate: (self) => setProgress(self.progress),
    invalidateOnRefresh: true,
  });
  ScrollTrigger.addEventListener("refreshInit", build);

  // beat + climax reveals
  beats.forEach((b) =>
    gsap.from(b, { autoAlpha: 0, y: 60, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: b, start: "top 78%", toggleActions: "play none none reverse" } })
  );
}

/* ============================================================
   8. TESTIMONIALS — auto-rotate, image expands from centre
   (decoded from happly chunk 301)
   ============================================================ */
class Testimonials {
  constructor(block) {
    this.block = block;
    this.items = qsa(".b-testimonials__item", block);
    this.images = qsa(".b-testimonials__image", block);
    this.bullets = qsa(".b-testimonials__bullet", block);
    this.dur = 7;
    this.curr = 0;
    this.prev = null;
    this.tween = null;
    this.count = this.items.length;
    if (!this.count) return;
    this.bindBullets();
    this.render();
    this.scrollPause();
  }
  bindBullets() {
    this.bullets.forEach((b, i) => b.addEventListener("click", () => {
      this.resetBullet(this.bullets[this.curr]);
      this.prev = this.curr; this.curr = i; this.render();
    }));
  }
  render() {
    this.items.forEach((e) => e.classList.remove("active"));
    this.images.forEach((e) => e.classList.remove("active"));
    this.bullets.forEach((e) => e.classList.remove("active"));
    this.items[this.curr].classList.add("active");
    this.images[this.curr].classList.add("active");
    this.bullets[this.curr].classList.add("active");

    // image expands from centre — width 0→100vw, scale 2→1
    gsap.fromTo(
      this.images[this.curr],
      { width: 0, scale: 2 },
      { width: "100vw", scale: 1, duration: 1.4, ease: "expo.inOut" }
    );

    // bullet progress fill, then advance
    const b = this.bullets[this.curr];
    this.tween?.kill();
    this.tween = gsap.fromTo(
      b,
      { "--width": "0%" },
      {
        "--width": "100%", duration: this.dur, ease: "none",
        onComplete: () => {
          this.resetBullet(b);
          this.prev = this.curr;
          this.curr = gsap.utils.wrap(0, this.count, this.curr + 1);
          this.render();
        },
      }
    );
  }
  resetBullet(b) {
    gsap.set(b, { "--width": "0%" });
  }
  scrollPause() {
    ScrollTrigger.create({
      trigger: this.block,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => this.tween?.play(),
      onEnterBack: () => this.tween?.play(),
      onLeave: () => this.tween?.pause(),
      onLeaveBack: () => this.tween?.pause(),
    });
  }
}

/* ============================================================
   9. REVEALS — fade-up on enter (batched)
   ============================================================ */
function initReveals() {
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    onEnter: (els) =>
      gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true }),
  });
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
  injectMedia();
  initLenis();
  initHeader();
  initHero();
  initShowcase();
  initMarquee();
  initStory();
  initReveals();
  lazyVideos();
  const t = qs(".b-testimonials");
  if (t) new Testimonials(t);

  // recalc once fonts + first images settle
  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
