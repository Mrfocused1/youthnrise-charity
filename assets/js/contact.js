/* ============================================================
   Youth n Rise — contact page
   Lenis smooth scroll · GSAP + ScrollTrigger · fresh Pexels media
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);
const CM = window.RISE_CONTACT_MEDIA || {};
const qs = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- media ---------- */
function videoEl(media) {
  const v = document.createElement("video");
  v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
  v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
  v.src = media.mp4;
  return v;
}
function imgEl(src, alt = "") {
  const i = document.createElement("img");
  i.src = src; i.alt = alt; i.decoding = "async";
  return i;
}
function injectMedia() {
  const hero = qs("[data-contact-hero]");
  if (hero) {
    if (CM.hero?.mp4) hero.appendChild(videoEl(CM.hero));
    else if (CM.hero?.img) hero.appendChild(imgEl(CM.hero.img, "Youth n Rise"));
  }
  const aside = qs("[data-contact-aside]");
  if (aside && CM.aside?.img) aside.appendChild(imgEl(CM.aside.img, CM.aside.alt || ""));
}

/* ---------- smooth scroll ---------- */
let lenis;
function initLenis() {
  if (reduce) return;
  lenis = new Lenis({ duration: 0.9, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;
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

/* ---------- header (colour adapt, announcement, logo, hide over footer) ---------- */
function initHeader() {
  const header = qs(".header");
  const announc = qs(".c-announc");
  const logo = qs(".header__logo");
  const headerH = header.offsetHeight;
  const announcH = announc.offsetHeight;

  qsa("[data-c]").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top top+=" + headerH / 2,
      end: "bottom top+=" + headerH / 2,
      onEnter: () => (header.dataset.color = el.dataset.c),
      onEnterBack: () => (header.dataset.color = el.dataset.c),
    });
  });

  ScrollTrigger.create({
    start: announcH, end: announcH + 1,
    onEnter: () => { gsap.to(announc, { yPercent: -100, duration: 0.4, ease: "power2.out" }); gsap.to(header, { top: 0, duration: 0.4, ease: "power2.out" }); header.classList.add("anim"); },
    onLeaveBack: () => { gsap.to(announc, { yPercent: 0, duration: 0.4, ease: "power2.out" }); gsap.to(header, { top: announcH, duration: 0.4, ease: "power2.out" }); header.classList.remove("anim"); },
  });

  gsap.to(logo, { scale: 0.85, transformOrigin: "left center", ease: "none",
    scrollTrigger: { trigger: ".cx-hero", start: "top top", end: "70% top", scrub: 0 } });

  ScrollTrigger.create({ trigger: ".footer", start: "top " + headerH, end: "top top", scrub: 0,
    animation: gsap.to(header, { yPercent: -130, ease: "none" }) });

  qs(".c-burger")?.addEventListener("click", () => document.documentElement.classList.toggle("menu-open"));
}

/* ---------- hero ---------- */
function initHero() {
  const img = qs(".b-hero__image");
  if (img) {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 14, ease: "none",
      scrollTrigger: { trigger: ".cx-hero", start: "top top", end: "bottom top", scrub: true } });
  }
  if (reduce) return;
  // entrance
  const tl = gsap.timeline({ delay: 0.15 });
  tl.from(".b-hero__eyebrow", { y: 24, autoAlpha: 0, duration: 0.7, ease: "power3.out" })
    .from(".b-hero__title", { y: 40, autoAlpha: 0, duration: 0.9, ease: "power3.out" }, "-=0.4")
    .from(".b-hero__sub", { y: 24, autoAlpha: 0, duration: 0.7, ease: "power3.out" }, "-=0.5")
    .from(".b-hero__scroll", { autoAlpha: 0, duration: 0.6 }, "-=0.3");
}

/* ---------- reveals ---------- */
function initReveals() {
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true }),
  });
}

/* ---------- form ---------- */
function initForm() {
  const form = qs(".cx-form");
  const success = qs(".cx-success");
  if (!form) return;

  const fields = {
    name: qs('[data-field="name"]'),
    email: qs('[data-field="email"]'),
    message: qs('[data-field="message"]'),
  };
  const val = (f) => qs("input,textarea", f).value.trim();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    if (!val(fields.name)) { fields.name.classList.add("error"); ok = false; } else fields.name.classList.remove("error");
    const email = val(fields.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fields.email.classList.add("error"); ok = false; } else fields.email.classList.remove("error");
    if (!val(fields.message)) { fields.message.classList.add("error"); ok = false; } else fields.message.classList.remove("error");
    if (!ok) return;

    const name = val(fields.name).split(" ")[0].toLowerCase();
    const t = qs("[data-success-title]");
    if (t) t.textContent = name ? `thank you, ${name}.` : "thank you.";

    // fade out the whole intro (eyebrow, heading, lead) and the form, then show success
    const toHide = qsa(".cx-form-wrap > *:not(.cx-success)");
    if (reduce) { toHide.forEach((el) => (el.style.display = "none")); success.hidden = false; ScrollTrigger.refresh(); return; }
    gsap.to(toHide, { autoAlpha: 0, y: -16, duration: 0.35, ease: "power2.in", onComplete: () => {
      toHide.forEach((el) => (el.style.display = "none"));
      success.hidden = false;
      gsap.fromTo(success, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" });
      ScrollTrigger.refresh();
    }});
  });

  // clear error on input
  qsa(".cx-field input, .cx-field textarea").forEach((i) =>
    i.addEventListener("input", () => i.closest(".cx-field").classList.remove("error")));
}

/* ---------- boot ---------- */
function boot() {
  injectMedia();
  initLenis();
  initHeader();
  initHero();
  initReveals();
  initForm();
  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
