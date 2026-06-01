/**
 * Blog hero generator — Nano Banana (gemini-3-pro-image).
 *
 * Generates a photographic editorial hero for a blog post, resizes it to the
 * site's 1200x630 hero format, and writes BOTH:
 *   - public/blog/<slug>.webp  (on-site hero, what the BlogPost.coverImage references)
 *   - public/blog/<slug>.jpg   (sibling for /api/pin/blog — @vercel/og can't decode WebP)
 *
 * This is Stage 5 of the blog pipeline runbook. Reuses the same fresh-context
 * gemini call as scripts/pinterest-generate.ts (no long-chat contamination).
 *
 * Usage:
 *   npx tsx scripts/generate-blog-hero.ts --slug=best-blue-paint-colors --prompt="..."
 *   npx tsx scripts/generate-blog-hero.ts --slug=... --prompt="..." --force
 */
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image";
const OUTPUT_DIR = path.resolve(__dirname, "../public/blog");
const HERO_W = 1200;
const HERO_H = 630;

if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const slug = args.find((a) => a.startsWith("--slug="))?.replace("--slug=", "");
const prompt = args.find((a) => a.startsWith("--prompt="))?.replace("--prompt=", "");

if (!slug || !prompt) {
  console.error('Usage: --slug=<slug> --prompt="<image prompt>" [--force]');
  process.exit(1);
}

async function main() {
  const webpOut = path.join(OUTPUT_DIR, `${slug}.webp`);
  const jpgOut = path.join(OUTPUT_DIR, `${slug}.jpg`);
  if (fs.existsSync(webpOut) && !FORCE) {
    console.log(`⏭️  ${slug}.webp exists (use --force to overwrite)`);
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "16:9" },
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

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const raw = Buffer.from(img.data, "base64");

  // Resize/crop to the site's 1200x630 hero format, then write webp + jpg sibling.
  await sharp(raw).resize(HERO_W, HERO_H, { fit: "cover", position: "centre" }).webp({ quality: 90 }).toFile(webpOut);
  await sharp(raw).resize(HERO_W, HERO_H, { fit: "cover", position: "centre" }).jpeg({ quality: 85, progressive: true }).toFile(jpgOut);

  const kb = (fs.statSync(webpOut).size / 1024).toFixed(0);
  console.log(`✅ ${slug} → ${slug}.webp + ${slug}.jpg (${HERO_W}x${HERO_H}, webp ${kb}KB)`);
  console.log("Next: Claude QAs the hero, then commit.");
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
