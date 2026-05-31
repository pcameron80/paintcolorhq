/**
 * Pinterest image generator — Nano Banana (gemini-3-pro-image).
 *
 * Generates each pin image from its prompt in batch-may26.ts at a 2:3 vertical
 * aspect ratio and saves it into IMAGE_DIR using the batch's image filename.
 *
 * Each call is its own fresh API context — which structurally eliminates the
 * long-chat context-contamination failure mode you get in the web app.
 *
 * Workflow: run this, then have Claude read the PNGs and QA the swatch text
 * against the spec. Regenerate any that fail with --only=<ids> --force until
 * they pass. Each generation costs cents, so retries are cheap.
 *
 * Usage:
 *   npx tsx scripts/pinterest-generate.ts --only=3        # generate pin 3
 *   npx tsx scripts/pinterest-generate.ts --only=3 --force # overwrite existing
 *   npx tsx scripts/pinterest-generate.ts                 # all missing images
 *   npx tsx scripts/pinterest-generate.ts --force         # regenerate everything
 */
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { QUEUE, IMAGE_DIR, type PinSpec } from "./pinterest/queue.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image";

if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlyKeys = onlyArg ? new Set(onlyArg.replace("--only=", "").split(",")) : null;

async function generate(pin: PinSpec) {
  const out = path.join(IMAGE_DIR, pin.image);
  if (fs.existsSync(out) && !FORCE && !onlyKeys) {
    console.log(`⏭️  ${pin.key} ${pin.name} — exists (use --force to overwrite)`);
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: pin.prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "2:3" },
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: any) => p.inlineData)?.inlineData;
  if (!img) {
    const text = parts.find((p: any) => p.text)?.text;
    throw new Error(`No image returned${text ? ` — model said: ${text.slice(0, 200)}` : ""}`);
  }
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  fs.writeFileSync(out, Buffer.from(img.data, "base64"));
  const mb = (Buffer.from(img.data, "base64").length / 1024 / 1024).toFixed(1);
  console.log(`✅ ${pin.key} ${pin.name} → ${pin.image} (${img.mimeType}, ${mb}MB)`);
}

async function main() {
  const targets = QUEUE.filter((p) => (onlyKeys ? onlyKeys.has(p.key) : true));
  console.log(`Generating ${targets.length} image(s) with ${MODEL} at 2:3\n`);
  for (const pin of targets) {
    try {
      await generate(pin);
    } catch (e) {
      console.error(`❌ ${pin.key} ${pin.name}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log("\nDone. Next: have Claude QA the images, then publish.");
}

main();
