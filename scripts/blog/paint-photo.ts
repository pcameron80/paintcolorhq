/**
 * Repaint the walls of a room photo in one paint color with Nano Banana
 * (gemini-3-pro-image), for blog and pitch images.
 *
 * Nano Banana relights the whole room, so it looks like a photograph, but it
 * does not hit an exact paint color. Every output must go through
 * scripts/blog/verify-paint-photo.py, which measures the wall color against
 * the published value and corrects it before anything is published.
 *
 * The room comes from scripts/generate-room.ts (--pass=base, then --pass=key
 * for the wall mask), with any --prompt; the base walls must be the plain
 * off-white BASE_RULES asks for, because the verifier uses them as a light probe.
 *
 * Usage:
 *   npx tsx scripts/blog/paint-photo.ts --base=room/base.png --out=room/pale-oak.png \
 *     --color="Benjamin Moore Pale Oak OC-20" --hex="#DDD9CE" [--lrv=68.6] [--keep-light]
 *
 * --lrv tells the model how light or dark the paint is; without it dark colors
 * came out too light (SW Pewter Green, LRV 11.8, read as about LRV 20).
 * --keep-light is for rooms whose light is the subject (golden morning sun):
 * asked for the color "under neutral light", the model removed the sunlight.
 *
 * Needs GEMINI_API_KEY in .env.local. About $0.15-0.25 per image.
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), quiet: true });

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const base = arg("base");
const out = arg("out");
const color = arg("color");
const hex = arg("hex");
const lrv = arg("lrv");
const keepLight = process.argv.includes("--keep-light");
if (!base || !out || !color || !/^#?[0-9a-fA-F]{6}$/.test(hex ?? "")) {
  console.error('Usage: --base=<png> --out=<png> --color="<brand name code>" --hex="#RRGGBB"');
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const instruction = [
  "Edit this exact photo. Keep the camera, composition, furniture, objects, trim, windows, ceiling, floor and lighting identical.",
  `Repaint only the walls in ${color} (hex ${hex!.startsWith("#") ? hex : `#${hex}`}), a matte interior wall paint, as a professional interior photographer would capture it on a real wall in this light:`,
  ...(lrv ? [`Its light reflectance value (LRV) is ${lrv} on a 0-100 scale, so the painted walls must be exactly that light or dark relative to the white trim.`] : []),
  keepLight
    ? "Keep the room's existing sunlight, its color, direction and warm patches exactly as they are in the photo; the paint must look the way this color looks in that same light."
    : "keep the natural light falloff, soft shadows and subtle bounce light from the room, but the wall color under neutral light must read as exactly this paint color, not lighter, darker, warmer or cooler.",
  "Trim, baseboards, crown molding and window frames stay white. Do not recolor anything else.",
].join(" ");

async function main() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType: "image/png", data: fs.readFileSync(base!).toString("base64") } }, { text: instruction }] }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9", imageSize: "1K" } },
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  const img = data?.candidates?.[0]?.content?.parts?.find((p: { inlineData?: unknown }) => p.inlineData)?.inlineData;
  if (!img) throw new Error("No image returned");
  fs.mkdirSync(path.dirname(out!), { recursive: true });
  fs.writeFileSync(out!, Buffer.from(img.data, "base64"));
  console.log(`✅ ${color} → ${out}`);
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
