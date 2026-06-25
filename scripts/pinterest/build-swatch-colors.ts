// Generator → swatch-colors.json (the swatch lane's color data).
// Reads its seed list from swatch-seeds.json ({brandSlug, slug} pairs, the
// curated wishlist), verifies each against the DB, and writes the enriched
// catalog (hex/lrv/family). DB misses (archived/renamed colors) are skipped, so
// swatch-colors.json is a subset of the seeds. Restock = append demand-ranked
// {brandSlug, slug} to swatch-seeds.json (e.g. from GA4 top color pages) and
// re-run; commit the regenerated JSON. No code edit needed.
//
//   npx tsx scripts/pinterest/build-swatch-colors.ts
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as dotenv from "dotenv";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const PRIORITY: Array<{ brandSlug: string; slug: string }> = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "swatch-seeds.json"), "utf8"),
);

(async () => {
  const { getColorBySlug } = await import("../../src/lib/queries.ts");
  const out: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  for (const { brandSlug, slug } of PRIORITY) {
    const dedup = `${brandSlug}/${slug}`;
    if (seen.has(dedup)) continue;
    seen.add(dedup);
    const c = await getColorBySlug(brandSlug, slug);
    if (!c) { console.warn("MISS", dedup); continue; }
    out.push({
      brandSlug, slug,
      brandName: c.brand?.name ?? "",
      name: c.name,
      hex: c.hex,
      code: c.color_number ?? null,
      lrv: c.lrv ?? null,
      family: c.color_family ?? null,
    });
  }
  fs.writeFileSync(path.resolve(__dirname, "swatch-colors.json"), JSON.stringify(out, null, 2) + "\n");
  console.log("wrote", out.length, "swatch colors");
})();
