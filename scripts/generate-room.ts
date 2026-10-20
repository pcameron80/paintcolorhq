/**
 * Room scene generator for the visualizer — Nano Banana (gemini-3-pro-image).
 *
 * Two passes per room:
 *   1. base  — a photoreal 16:9 room with plain off-white matte walls, so the
 *              wall's light and shadow can later be reapplied to any paint color.
 *   2. key   — the base image sent back with an edit instruction that floods each
 *              paintable surface with a flat key color (main walls magenta, accent
 *              wall cyan, trim yellow, window frames green). scripts/build-room-masks.py diffs the two
 *              images to produce per-surface masks.
 *
 * Output goes to --out (default: room-src/<id>/) as base.png and key.png.
 *
 * Usage:
 *   npx tsx scripts/generate-room.ts --id=bedroom-1 --prompt="..." [--pass=base|key|both|window] [--out=dir]
 */
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

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
const arg = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const id = arg("id");
const prompt = arg("prompt");
const pass = arg("pass") ?? "both";
const outDir = path.resolve(arg("out") ?? path.resolve(__dirname, `../room-src/${id}`));

if (!id || ((pass === "base" || pass === "both") && !prompt)) {
  console.error('Usage: --id=<id> --prompt="<room description>" [--pass=base|key|both|window] [--out=dir]');
  process.exit(1);
}

/** Constraints every base scene needs for the shading-based renderer to work. */
const BASE_RULES = [
  "Photorealistic interior photograph, 16:9, shot at eye level with a wide lens, camera square to the main wall.",
  "All walls are painted a single uniform flat matte off-white (very light warm gray-white). No wallpaper, no tile, no paneling, no wainscoting on the walls.",
  "Trim (baseboards, door and window casings, crown molding) is a slightly brighter semi-gloss white.",
  "Large uninterrupted areas of visible wall. Keep wall art small and few.",
  "Soft natural daylight from a window, gentle realistic shadows and falloff across the walls.",
  "No people, no text, no logos, no watermark.",
].join(" ");

const KEY_INSTRUCTION = [
  "Edit this exact photo. Keep the camera, composition, furniture, objects, lighting and every pixel that is not a painted surface identical.",
  "Recolor only the painted surfaces with flat, fully saturated solid colors and no shading:",
  "the main painted walls → pure magenta #FF00FF;",
  "the single accent wall described below, if any → pure cyan #00FFFF;",
  "painted trim (baseboards, door and window casings, crown molding) → pure yellow #FFFF00;",
  "window frames (the sashes, frames and grilles of the windows themselves, not the casing around them) → pure green #00FF00. Never recolor the glass or the view through it. Do not add, remove or reshape any part of a window: no new grilles, muntins or dividers that are not already in the photo.",
  "Walls, trim and floors seen through a doorway or opening belong to another room: leave them exactly as they are.",
  "Do not recolor the ceiling, floor, glass, doors, cabinets, furniture, art or decor.",
].join(" ");

const WINDOW_INSTRUCTION = [
  "Edit this exact photo. Change nothing except the color of the window sashes, window frames and window grilles, which become flat pure green #00FF00.",
  "Trace them exactly as they are in the photo: same position, same thickness, and exactly the same grilles. If a window has no grilles, add none.",
  "Do not change the glass, the view through the glass, the window casing or trim around the window, blinds, shades, curtains, walls, mirrors or anything else.",
].join(" ");

async function generate(parts: object[], imageSize = "1K"): Promise<Buffer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "16:9", imageSize },
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  const out: { text?: string; inlineData?: { data: string } }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const img = out.find((p) => p.inlineData)?.inlineData;
  if (!img) {
    const text = out.find((p) => p.text)?.text;
    throw new Error(`No image returned${text ? ` — model said: ${text.slice(0, 200)}` : ""}`);
  }
  return Buffer.from(img.data, "base64");
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const basePath = path.join(outDir, "base.png");

  if (pass === "base" || pass === "both") {
    const buf = await generate([{ text: `${prompt} ${BASE_RULES}` }]);
    fs.writeFileSync(basePath, buf);
    console.log(`✅ base → ${basePath}`);
  }

  if (pass === "key" || pass === "both") {
    if (!fs.existsSync(basePath)) throw new Error(`No base image at ${basePath}`);
    const accent = arg("accent");
    const text = `${KEY_INSTRUCTION} Accent wall: ${accent ?? "none — there is no accent wall, use only magenta and yellow"}.`;
    const buf = await generate([
      { inlineData: { mimeType: "image/png", data: fs.readFileSync(basePath).toString("base64") } },
      { text },
    ], "1K"); // Same size as the base. A 2K key tested worse: it invented window grilles and drifted off fine detail.
    const keyPath = path.join(outDir, "key.png");
    fs.writeFileSync(keyPath, buf);
    console.log(`✅ key → ${keyPath}`);
  }

  // Optional third pass. Asked to recolor four surfaces at once, the edit often redraws
  // windows loosely (grilles dropped, moved or invented). A pass that touches only the
  // windows keeps them faithful; build-room-masks.py prefers key-window.png when present.
  if (pass === "window") {
    if (!fs.existsSync(basePath)) throw new Error(`No base image at ${basePath}`);
    const buf = await generate([
      { inlineData: { mimeType: "image/png", data: fs.readFileSync(basePath).toString("base64") } },
      { text: WINDOW_INSTRUCTION },
    ], "1K");
    const outPath = path.join(outDir, "key-window.png");
    fs.writeFileSync(outPath, buf);
    console.log(`✅ window key → ${outPath}`);
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
