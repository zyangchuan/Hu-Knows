#!/usr/bin/env node
// Batch-generate the 25 tile icons via the OpenAI Images API (gpt-image-1, the
// model behind ChatGPT image gen). Saves each to public/tiles/<id>.png.
//
//   cd frontend
//   export OPENAI_API_KEY=sk-...
//   node scripts/generate-tiles.mjs            # generate any missing tiles
//   node scripts/generate-tiles.mjs --force    # regenerate everything
//   QUALITY=high node scripts/generate-tiles.mjs A4 WE   # only some, high quality
//
// Then turn images on in the app:  NEXT_PUBLIC_TILE_IMAGES=1 npm run dev

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "tiles");

const API_KEY = process.env.OPENAI_API_KEY;
const QUALITY = process.env.QUALITY || "medium"; // low | medium | high | auto
const SIZE = process.env.SIZE || "1024x1024";
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);
const FORCE = process.argv.includes("--force");
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith("--"));

if (!API_KEY) {
  console.error("✗ Set OPENAI_API_KEY first:  export OPENAI_API_KEY=sk-...");
  process.exit(1);
}

const exists = (p) => access(p).then(() => true).catch(() => false);

async function genOne(id, prompt) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: "gpt-image-1", prompt, size: SIZE, quality: QUALITY, n: 1 }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image in response");
  await writeFile(join(OUT_DIR, `${id}.png`), Buffer.from(b64, "base64"));
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const { template, tiles } = JSON.parse(await readFile(join(__dirname, "tile-art.json"), "utf8"));

  let ids = Object.keys(tiles);
  if (ONLY.length) ids = ids.filter((id) => ONLY.includes(id));

  // Work out what actually needs generating.
  const todo = [];
  for (const id of ids) {
    if (!FORCE && (await exists(join(OUT_DIR, `${id}.png`)))) continue;
    todo.push(id);
  }
  if (!todo.length) {
    console.log("✓ Nothing to do — all requested tiles already exist (use --force to regenerate).");
    return;
  }
  console.log(`Generating ${todo.length} tile(s) [quality=${QUALITY}, size=${SIZE}, concurrency=${CONCURRENCY}]…`);

  let done = 0;
  const failures = [];
  const queue = [...todo];
  async function worker() {
    while (queue.length) {
      const id = queue.shift();
      const prompt = template.replace("{subject}", tiles[id].subject).replace("{color}", tiles[id].color);
      try {
        await genOne(id, prompt);
        console.log(`  ✓ ${id}  (${++done}/${todo.length})`);
      } catch (e) {
        failures.push(id);
        console.error(`  ✗ ${id}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));

  console.log(`\nDone: ${done} ok, ${failures.length} failed${failures.length ? " (" + failures.join(", ") + ")" : ""}.`);
  console.log("Turn them on with:  NEXT_PUBLIC_TILE_IMAGES=1 npm run dev");
  if (failures.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
