import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MatchRecord {
  source_color_id: string; // "brand_slug/color_slug"
  match_color_id: string;  // "brand_slug/color_slug"
  delta_e_score: number;
  rank: number;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const inputFile = path.resolve(
    __dirname,
    "../data/cross-brand-matches.json",
  );

  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    console.error("Run: npm run compute-matches");
    process.exit(1);
  }

  console.log("Loading match data...");
  const matches: MatchRecord[] = JSON.parse(
    fs.readFileSync(inputFile, "utf8"),
  );
  console.log(`Loaded ${matches.length} match records`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Step 1: Build lookup map from "brand_slug/color_slug" -> UUID
  console.log("Building color UUID lookup...");

  // Fetch all brands
  const { data: brands, error: brandErr } = await supabase
    .from("brands")
    .select("id, slug");
  if (brandErr) {
    console.error("Failed to fetch brands:", brandErr.message);
    process.exit(1);
  }

  const brandIdBySlug = new Map<string, string>();
  for (const b of brands!) {
    brandIdBySlug.set(b.slug, b.id);
  }
  console.log(`  ${brandIdBySlug.size} brands loaded`);

  // Fetch all colors with their brand_id and slug (paginated to handle >1000 rows)
  const colorUuidMap = new Map<string, string>(); // "brand_slug/color_slug" -> UUID

  // Invert brand map for lookups
  const brandSlugById = new Map<string, string>();
  for (const [slug, id] of brandIdBySlug) {
    brandSlugById.set(id, slug);
  }

  let offset = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data: colorPage, error: colorErr } = await supabase
      .from("colors")
      .select("id, slug, brand_id")
      .range(offset, offset + PAGE_SIZE - 1);

    if (colorErr) {
      console.error("Failed to fetch colors:", colorErr.message);
      process.exit(1);
    }

    if (!colorPage || colorPage.length === 0) break;

    for (const c of colorPage) {
      const brandSlug = brandSlugById.get(c.brand_id);
      if (brandSlug) {
        colorUuidMap.set(`${brandSlug}/${c.slug}`, c.id);
      }
    }

    offset += colorPage.length;
    if (colorPage.length < PAGE_SIZE) break;
  }

  console.log(`  ${colorUuidMap.size} color UUIDs loaded`);

  // Step 2: Resolve slug references to UUIDs
  console.log("Resolving match references...");
  let resolved = 0;
  let skipped = 0;

  const resolvedRows: {
    source_color_id: string;
    match_color_id: string;
    delta_e_score: number;
    rank: number;
  }[] = [];

  for (const m of matches) {
    const sourceUuid = colorUuidMap.get(m.source_color_id);
    const matchUuid = colorUuidMap.get(m.match_color_id);

    if (!sourceUuid || !matchUuid) {
      skipped++;
      if (skipped <= 10) {
        if (!sourceUuid)
          console.warn(`  Missing source: ${m.source_color_id}`);
        if (!matchUuid) console.warn(`  Missing match: ${m.match_color_id}`);
      }
      continue;
    }

    resolvedRows.push({
      source_color_id: sourceUuid,
      match_color_id: matchUuid,
      delta_e_score: m.delta_e_score,
      rank: m.rank,
    });
    resolved++;
  }

  console.log(`  Resolved: ${resolved}, Skipped: ${skipped}`);

  if (resolvedRows.length === 0) {
    console.error("No matches resolved. Check that colors are seeded first.");
    process.exit(1);
  }

  // Step 3: Clear existing matches
  console.log("Clearing existing cross_brand_matches...");
  const { error: deleteErr } = await supabase
    .from("cross_brand_matches")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows
  if (deleteErr) {
    console.error("Failed to clear matches:", deleteErr.message);
    process.exit(1);
  }

  // Step 4: Insert in batches
  const BATCH_SIZE = 500;
  let inserted = 0;

  console.log(
    `Inserting ${resolvedRows.length} matches in batches of ${BATCH_SIZE}...`,
  );

  for (let i = 0; i < resolvedRows.length; i += BATCH_SIZE) {
    const batch = resolvedRows.slice(i, i + BATCH_SIZE);
    const { error: insertErr } = await supabase
      .from("cross_brand_matches")
      .insert(batch);

    if (insertErr) {
      console.error(
        `Failed at batch starting at index ${i}:`,
        insertErr.message,
      );
      process.exit(1);
    }

    inserted += batch.length;
    if (inserted % 5000 === 0 || i + BATCH_SIZE >= resolvedRows.length) {
      console.log(`  ${inserted}/${resolvedRows.length} inserted`);
    }
  }

  console.log(`\nDone. Inserted ${inserted} cross-brand matches.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
