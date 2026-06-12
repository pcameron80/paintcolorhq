/**
 * Export the colors table to data/colors-processed.json in the same shape
 * import-colors.ts produces, so compute-matches.ts can run against what is
 * actually live in the DB.
 *
 * Why: the DB has drifted past the colornerd-derived file — SW/Valspar API
 * imports, LRV scrapes, and the dedupe consolidation all touched the DB
 * directly. Recomputing matches from a stale colors-processed.json would
 * drop matches for every color added since it was last generated.
 *
 * Usage: tsx scripts/export-db-colors.ts   (npm run export-db-colors)
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const OUT_FILE = path.resolve(__dirname, "../data/colors-processed.json");

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: brands, error: brandErr } = await supabase
    .from("brands")
    .select("id, slug");
  if (brandErr || !brands) {
    console.error("Failed to fetch brands:", brandErr?.message);
    process.exit(1);
  }
  const brandSlugById = new Map<string, string>(
    brands.map((b) => [b.id, b.slug]),
  );

  console.log("Exporting colors from DB...");
  const out: Record<string, unknown>[] = [];
  const perBrand: Record<string, number> = {};
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("colors")
      .select(
        "name, slug, color_number, hex, rgb_r, rgb_g, rgb_b, lab_l, lab_a, lab_b_val, lrv, color_family, alternate_numbers, is_archived, brand_id",
      )
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) {
      console.error("Failed to fetch colors:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    for (const c of data) {
      const brand_slug = brandSlugById.get(c.brand_id);
      if (!brand_slug) continue;
      const { brand_id: _omit, ...rest } = c;
      out.push({ ...rest, brand_slug });
      perBrand[brand_slug] = (perBrand[brand_slug] ?? 0) + 1;
    }
    from += data.length;
    process.stdout.write(`\r  ${out.length} colors exported`);
  }
  process.stdout.write(`\r  ${out.length} colors exported\n`);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  console.log(`\nWritten to: ${OUT_FILE}`);
  for (const [brand, n] of Object.entries(perBrand).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${brand}: ${n}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
