/* ============================================================
   Youth n Rise — team page
   Lenis smooth scroll · GSAP + ScrollTrigger
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);
const qs = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      const id = a.getAttribute("href"); if (id.length < 2) return;
      const t = qs(id); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: -80, duration: 1.1 });
    });
  });
}

function initHeader() {
  const header = qs(".header"), announc = qs(".c-announc"), logo = qs(".header__logo");
  const headerH = header.offsetHeight, announcH = announc.offsetHeight;
  qsa("[data-c]").forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: "top top+=" + headerH / 2, end: "bottom top+=" + headerH / 2,
      onEnter: () => (header.dataset.color = el.dataset.c), onEnterBack: () => (header.dataset.color = el.dataset.c),
    });
  });
  ScrollTrigger.create({
    start: announcH, end: announcH + 1,
    onEnter: () => { gsap.to(announc, { yPercent: -100, duration: 0.4 }); gsap.to(header, { top: 0, duration: 0.4 }); header.classList.add("anim"); },
    onLeaveBack: () => { gsap.to(announc, { yPercent: 0, duration: 0.4 }); gsap.to(header, { top: announcH, duration: 0.4 }); header.classList.remove("anim"); },
  });
  gsap.to(logo, { scale: 0.85, transformOrigin: "left center", ease: "none",
    scrollTrigger: { trigger: ".tm-hero", start: "top top", end: "70% top", scrub: 0 } });
  ScrollTrigger.create({ trigger: ".footer", start: "top " + headerH, end: "top top", scrub: 0,
    animation: gsap.to(header, { yPercent: -130, ease: "none" }) });

  const burger = qs(".c-burger"), html = document.documentElement;
  burger?.addEventListener("click", () => html.classList.toggle("menu-open"));
  qsa(".mobile-menu a").forEach((a) => a.addEventListener("click", () => html.classList.remove("menu-open")));
  window.addEventListener("resize", () => { if (window.innerWidth > 1023) html.classList.remove("menu-open"); });
}

function initReveals() {
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true }),
  });
}

function initCarousel() {
  if (typeof Swiper === "undefined" || !qs(".tm-carousel")) return;
  new Swiper(".tm-carousel", {
    slidesPerView: 1.3,
    spaceBetween: 16,
    grabCursor: true,
    breakpoints: {
      560: { slidesPerView: 2.3, spaceBetween: 18 },
      900: { slidesPerView: 3.4, spaceBetween: 20 },
      1200: { slidesPerView: 4.4, spaceBetween: 22 },
    },
  });
}

function boot() {
  initLenis();
  initHeader();
  initReveals();
  initCarousel();
  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
