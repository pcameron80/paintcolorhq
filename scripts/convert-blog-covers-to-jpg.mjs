/**
 * One-time conversion: blog cover WebPs → JPG siblings.
 *
 * @vercel/og (used by our /api/pin/blog route) does not decode WebP.
 * Site continues to serve WebP for the blog hero (smaller, faster);
 * pin generation reads from the JPG siblings instead.
 *
 *   node scripts/convert-blog-covers-to-jpg.mjs
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const dir = "public/blog";
const files = readdirSync(dir).filter((f) => f.endsWith(".webp"));
console.log(`Found ${files.length} WebP files in ${dir}`);

let converted = 0;
let skipped = 0;
for (const file of files) {
  const webpPath = join(dir, file);
  const jpgPath = webpPath.replace(/\.webp$/, ".jpg");
  try {
    statSync(jpgPath);
    skipped++;
    continue; // sibling already exists
  } catch {
    // doesn't exist, convert
  }
  try {
    await sharp(webpPath).jpeg({ quality: 85, progressive: true }).toFile(jpgPath);
    console.log(`  ✓ ${file} → ${file.replace(/\.webp$/, ".jpg")}`);
    converted++;
  } catch (err) {
    console.error(`  ✗ ${file}: ${err instanceof Error ? err.message : err}`);
  }
}
console.log(`\nConverted: ${converted}, skipped (already exist): ${skipped}`);
