// Generates ultra-realistic team portraits via the Replicate API (Flux 1.1 Pro).
// Run: REPLICATE_API_TOKEN=xxxx node generate-team.mjs
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) { console.error("Set REPLICATE_API_TOKEN"); process.exit(1); }
const MODEL = "black-forest-labs/flux-1.1-pro";
mkdirSync(new URL("./assets/media/team/", import.meta.url), { recursive: true });

const STYLE =
  "warm genuine smile, looking directly at camera, soft natural window light, " +
  "modern bright UK community centre softly blurred in the background, shot on 85mm lens, " +
  "shallow depth of field, photorealistic, ultra realistic, high detail, editorial corporate headshot";

const team = [
  { slug: "amara-okafor",     desc: "a confident Black British woman in her late 30s with natural afro hair, wearing a smart mustard blazer" },
  { slug: "daniel-whitfield", desc: "a friendly white British man in his early 40s with a short trimmed beard, wearing a casual rolled-sleeve denim shirt" },
  { slug: "priya-sharma",     desc: "a warm British South Asian woman in her 30s with shoulder-length dark hair, wearing a smart-casual knit jumper" },
  { slug: "marcus-bennett",   desc: "an approachable mixed-race British man in his 30s wearing clear glasses and a casual button shirt" },
  { slug: "leah-thompson",    desc: "a cheerful white British woman in her late 20s with light brown hair, wearing a casual jumper" },
  { slug: "jamal-rahman",     desc: "a young British Asian man in his early 20s with short dark hair, wearing a casual hoodie, youthful and hopeful" },
];

async function generate(member) {
  const prompt = `Ultra realistic professional headshot photograph of ${member.desc}, ${STYLE}`;
  let res, pred;
  for (let attempt = 0; attempt < 8; attempt++) {
    res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait" },
      body: JSON.stringify({ input: { prompt, aspect_ratio: "3:4", output_format: "webp", output_quality: 90, safety_tolerance: 2, prompt_upsampling: true } }),
    });
    if (res.status === 429) { console.log(`  …rate-limited, waiting 30s (${member.slug})`); await sleep(30000); continue; }
    break;
  }
  pred = await res.json();
  if (!res.ok) throw new Error(`${member.slug}: ${res.status} ${JSON.stringify(pred).slice(0, 200)}`);

  // poll if not finished (Prefer:wait usually returns terminal)
  while (pred.status && !["succeeded", "failed", "canceled"].includes(pred.status)) {
    await new Promise((r) => setTimeout(r, 2000));
    const p = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
    pred = await p.json();
  }
  if (pred.status !== "succeeded") throw new Error(`${member.slug}: ${pred.status} ${JSON.stringify(pred.error)}`);

  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  const img = await fetch(url);
  const buf = Buffer.from(await img.arrayBuffer());
  const path = new URL(`./assets/media/team/${member.slug}.webp`, import.meta.url);
  writeFileSync(path, buf);
  console.log(`✓ ${member.slug} (${(buf.length / 1024).toFixed(0)} KB)`);
}

for (const m of team) {
  if (existsSync(new URL(`./assets/media/team/${m.slug}.webp`, import.meta.url))) { console.log("skip (exists)", m.slug); continue; }
  try { await generate(m); } catch (e) { console.error("✗", e.message); }
  await sleep(12000); // stay within the reduced rate limit
}
console.log("done");
