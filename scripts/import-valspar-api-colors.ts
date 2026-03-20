/**
 * Import missing Valspar colors from the official SW Prism API.
 *
 * The API at api.valspar.com/prism/v1/colors/valspar returns all SW
 * colors with name, color number, hex, RGB, LRV, Lab values, and color family.
 *
 * Usage: npx tsx scripts/import-valspar-api-colors.ts [--dry-run]
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SwApiColor {
  colorNumber: string;
  name: string;
  hex: string;
  red: number;
  green: number;
  blue: number;
  lrv: number;
  lab: { L: number; A: number; B: number };
  colorFamilyNames: string[];
  archived: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSlug(name: string, colorNumber: string): string {
  let base = name
    .toLowerCase()
    .replace(/[''"]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const labelSlug = colorNumber
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base}-${labelSlug}`;
}

function mapColorFamily(families: string[]): string {
  if (!families || families.length === 0) return "neutral";

  const family = families[0].toLowerCase();
  const map: Record<string, string> = {
    red: "red",
    orange: "orange",
    yellow: "yellow",
    green: "green",
    blue: "blue",
    purple: "purple",
    neutral: "neutral",
    white: "white",
  };

  return map[family] ?? "neutral";
}

function calculateLrv(r: number, g: number, b: number): number {
  const linearize = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  ) * 100;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== IMPORTING ===");

  // 1. Fetch from Valspar API
  console.log("\nFetching colors from SW Prism API...");
  const res = await fetch(
    "https://api.valspar.com/prism/v1/colors/valspar?lng=en-US&_corev=7.10.0"
  );
  if (!res.ok) {
    console.error("Failed to fetch Valspar API:", res.status, res.statusText);
    process.exit(1);
  }

  const apiColors: SwApiColor[] = await res.json();
  const activeColors = apiColors.filter((c) => !c.archived);
  console.log(`  Total from API: ${apiColors.length}`);
  console.log(`  Active (non-archived): ${activeColors.length}`);

  // 2. Get existing SW colors from DB
  console.log("\nFetching existing SW colors from DB...");
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", "valspar")
    .single();

  if (!brand) {
    console.error("Valspar brand not found in DB");
    process.exit(1);
  }

  let dbColors: { name: string; color_number: string | null; slug: string }[] = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from("colors")
      .select("name, color_number, slug")
      .eq("brand_id", brand.id)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    dbColors = dbColors.concat(data);
    offset += 1000;
  }

  const dbNumbers = new Set(dbColors.map((c) => c.color_number).filter(Boolean));
  const dbNames = new Set(dbColors.map((c) => c.name.toLowerCase()));
  const dbSlugs = new Set(dbColors.map((c) => c.slug));

  console.log(`  Existing DB colors: ${dbColors.length}`);

  // 3. Find missing colors
  const missing = activeColors.filter((c) => {
    return (
      !dbNumbers.has(c.colorNumber) &&
      !dbNumbers.has("" + c.colorNumber) &&
      !dbNames.has(c.name.toLowerCase())
    );
  });

  console.log(`\nMissing colors: ${missing.length}`);

  if (missing.length === 0) {
    console.log("No missing colors to import!");
    return;
  }

  // 4. Prepare rows
  const rows = missing.map((c) => {
    let slug = makeSlug(c.name, c.colorNumber);

    // Ensure unique slug
    let finalSlug = slug;
    let suffix = 2;
    while (dbSlugs.has(finalSlug)) {
      finalSlug = `${slug}-${suffix}`;
      suffix++;
    }
    dbSlugs.add(finalSlug);

    // Use API LRV if available, otherwise compute
    const lrv = c.lrv ?? Math.round(calculateLrv(c.red, c.green, c.blue) * 100) / 100;

    return {
      brand_id: brand.id,
      name: c.name.trim(),
      slug: finalSlug,
      color_number: c.colorNumber,
      hex: c.hex.startsWith("#") ? c.hex : `#${c.hex}`,
      rgb_r: c.red,
      rgb_g: c.green,
      rgb_b: c.blue,
      lab_l: Math.round(c.lab.L * 100) / 100,
      lab_a: Math.round(c.lab.A * 100) / 100,
      lab_b_val: Math.round(c.lab.B * 100) / 100,
      lrv: Math.round(lrv * 100) / 100,
      color_family: mapColorFamily(c.colorFamilyNames),
    };
  });

  // 5. Show sample
  console.log("\nSample rows to insert:");
  rows.slice(0, 5).forEach((r) => {
    console.log(`  ${r.color_number} ${r.name} ${r.hex} (LRV: ${r.lrv}, family: ${r.color_family})`);
  });

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would insert ${rows.length} colors. Run without --dry-run to execute.`);
    return;
  }

  // 6. Insert in batches
  console.log(`\nInserting ${rows.length} colors...`);
  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error, data } = await supabase
      .from("colors")
      .upsert(batch, { onConflict: "brand_id,slug", ignoreDuplicates: true })
      .select("id");

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
    } else {
      inserted += data?.length ?? batch.length;
      console.log(
        `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rows.length / BATCH_SIZE)}: ${batch.length} rows`
      );
    }
  }

  console.log(`\nDone! Inserted ${inserted} new Valspar colors.`);
  console.log(
    "\nNext steps:\n" +
      "  1. Run: npx tsx scripts/compute-matches.ts (to compute cross-brand matches for new colors)\n" +
      "  2. Run: npx tsx scripts/seed-matches.ts (to seed match data to DB)\n" +
      "  3. Run: npx tsx scripts/populate-undertones.ts (to classify undertones)"
  );
}

main().catch(console.error);
