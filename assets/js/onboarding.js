/* ============================================================
   rise — "get involved" onboarding flow
   Step state machine + GSAP transitions + Pexels media (media.js)
   ============================================================ */
const OB = window.RISE_OB_MEDIA || {}; // dedicated media — never repeats the homepage
const qs = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const STEPS = ["path", "about", "tailor", "done"];
let idx = 0;
let busy = false;

const state = { path: null, name: "", email: "", city: "", interests: new Set(), avail: null };

const PATHS = {
  mentor:    { title: "become a mentor", media: "mentor" },
  volunteer: { title: "volunteer",       media: "volunteer" },
  fundraise: { title: "fundraise",       media: "fundraise" },
  partner:   { title: "partner with us", media: "partner" },
};

const TAILOR = {
  mentor:    { eyebrow: "your strengths",   title: "what could you share with a young person?", lead: "pick what feels like you — we'll match you to someone who'd value it." },
  volunteer: { eyebrow: "your interests",   title: "where would you love to help?",             lead: "choose anything that sounds like you — it helps us place you well." },
  fundraise: { eyebrow: "your idea",        title: "what gets you fired up?",                   lead: "pick a few themes and we'll send ideas and a fundraising kit to match." },
  partner:   { eyebrow: "your focus",       title: "what does your organisation care about?",   lead: "tell us your focus areas so we can find the right way to work together." },
};

const CAPS = {
  path:   "join thousands giving their time and skills to young people.",
  about:  "your details stay private — we only use them to get you started.",
  tailor: "tell us what you love, and we'll match you brilliantly.",
  done:   "welcome to the movement — a young person's story is about to change.",
};

/* ---------- media ---------- */
function mediaEl(data) {
  const box = qs("[data-ob-media]");
  box.innerHTML = "";
  if (!data) return;
  if (data.mp4) {
    const v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    if (data.poster) v.poster = data.poster;
    v.src = data.mp4;
    box.appendChild(v);
  } else if (data.img) {
    const i = document.createElement("img");
    i.src = data.img; i.alt = ""; i.decoding = "async";
    box.appendChild(i);
  }
}
function setMedia(key) {
  // pull from the dedicated onboarding media set (distinct from the homepage)
  const desc = (key && OB.paths && OB.paths[key]) ? OB.paths[key] : OB.default;
  mediaEl(desc);
}

/* ---------- render ---------- */
function afterRender() {
  const step = STEPS[idx];
  qs("[data-count]").textContent = `0${idx + 1} / 0${STEPS.length}`;
  qs("[data-progress]").style.width = (idx / (STEPS.length - 1)) * 100 + "%";

  // caption + media
  qs("[data-cap]").textContent = CAPS[step];
  if (step === "path") setMedia(state.path); // null until chosen → hero
  else setMedia(state.path);

  // nav
  const nav = qs("[data-nav]");
  const back = qs("[data-back]");
  const next = qs("[data-next]");
  if (step === "done") {
    nav.style.display = "none";
  } else {
    nav.style.display = "flex";
    back.style.visibility = idx === 0 ? "hidden" : "visible";
    next.textContent = step === "tailor" ? "finish" : "continue";
  }

  // tailor copy per chosen path
  if (step === "tailor" && state.path) {
    const t = TAILOR[state.path];
    qs("[data-tailor-eyebrow]").textContent = t.eyebrow;
    qs("[data-tailor-title]").textContent = t.title;
    qs("[data-tailor-lead]").textContent = t.lead;
  }

  // done summary
  if (step === "done") {
    qs("[data-done-title]").textContent = `welcome to the movement${state.name ? ", " + state.name.toLowerCase() : ""}.`;
    const rows = [
      ["your path", state.path ? PATHS[state.path].title : "—"],
      ["interests", state.interests.size ? [...state.interests].join(", ") : "—"],
      ["availability", state.avail ? state.avail.replace(/-/g, " ") : "—"],
      ["we'll email", state.email || "—"],
    ];
    qs("[data-summary]").innerHTML = rows
      .map((r) => `<div class="ob__summary__row"><span>${r[0]}</span><span>${r[1]}</span></div>`)
      .join("");
  }
}

function showStep(target, dir) {
  if (busy || target === idx) return;
  const curEl = qsa(".ob__step")[idx];
  const nextEl = qsa(".ob__step")[target];
  const finish = () => {
    curEl.classList.remove("is-active");
    nextEl.classList.add("is-active");
    idx = target;
    afterRender();
    busy = false;
  };
  if (reduce) { finish(); if (!reduce) {} return; }
  busy = true;
  gsap.to(curEl, { autoAlpha: 0, x: -28 * dir, duration: 0.28, ease: "power2.in", onComplete: () => {
    curEl.classList.remove("is-active");
    gsap.set(curEl, { clearProps: "all" });
    nextEl.classList.add("is-active");
    idx = target;
    afterRender();
    gsap.fromTo(nextEl, { autoAlpha: 0, x: 28 * dir }, { autoAlpha: 1, x: 0, duration: 0.42, ease: "power3.out", onComplete: () => {
      gsap.set(nextEl, { clearProps: "all" });
      busy = false;
    }});
  }});
}

/* ---------- validation ---------- */
function note(msg) {
  const n = qs("[data-note]");
  n.textContent = msg;
  n.classList.add("show");
  setTimeout(() => n.classList.remove("show"), 2600);
}
function validate() {
  const step = STEPS[idx];
  if (step === "path") {
    if (!state.path) { note("pick a way to get involved to continue"); return false; }
  }
  if (step === "about") {
    const nameF = qs('[data-field="name"]');
    const emailF = qs('[data-field="email"]');
    const cityF = qs('[data-field="city"]');
    state.name = qs("input", nameF).value.trim();
    state.email = qs("input", emailF).value.trim();
    state.city = qs("input", cityF).value.trim();
    let ok = true;
    if (!state.name) { nameF.classList.add("error"); ok = false; } else nameF.classList.remove("error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) { emailF.classList.add("error"); ok = false; } else emailF.classList.remove("error");
    return ok;
  }
  return true;
}

/* ---------- events ---------- */
function bind() {
  // path cards
  qsa(".ob__path").forEach((card) => {
    card.addEventListener("click", () => {
      state.path = card.dataset.path;
      qsa(".ob__path").forEach((c) => c.classList.toggle("is-selected", c === card));
      setMedia(state.path); // live media swap on selection
    });
  });

  // chips (multi)
  qsa("[data-chips] .ob__chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const k = chip.dataset.chip;
      if (state.interests.has(k)) { state.interests.delete(k); chip.classList.remove("is-on"); }
      else { state.interests.add(k); chip.classList.add("is-on"); }
    });
  });

  // availability (single)
  qsa("[data-avail] button").forEach((b) => {
    b.addEventListener("click", () => {
      state.avail = b.dataset.availOpt;
      qsa("[data-avail] button").forEach((x) => x.classList.toggle("is-on", x === b));
    });
  });

  qs("[data-next]").addEventListener("click", () => { if (validate()) showStep(idx + 1, 1); });
  qs("[data-back]").addEventListener("click", () => showStep(idx - 1, -1));

  // enter key advances
  qsa(".ob__field input").forEach((inp) =>
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); if (validate()) showStep(idx + 1, 1); } })
  );
}

/* ---------- boot ---------- */
function boot() {
  bind();
  // deep-link: get-involved.html?path=mentor
  const param = new URLSearchParams(location.search).get("path");
  if (param && PATHS[param]) {
    state.path = param;
    const card = qs(`.ob__path[data-path="${param}"]`);
    card?.classList.add("is-selected");
  }
  afterRender();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
