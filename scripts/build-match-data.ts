/**
 * Pre-compute cross_brand_matches into per-color JSON files.
 *
 * The color detail page calls getCrossBrandMatches(colorId) on every
 * render. Even after narrowing the SELECT, this is the dominant remaining
 * Supabase egress driver — 25k color pages × ~12 KB per response = ~300 MB
 * just from cold-cache renders.
 *
 * This script writes one JSON file per source color to
 * public/match-data/{colorId}.json, which the page reads via fs.readFile
 * at render time. Match data only changes when scripts/compute-matches.ts
 * re-runs (rare), so static files are perfectly suited.
 *
 * Strategy: split into two cheap queries instead of one nested JOIN.
 *   1. Pull all colors with brand info (~25k rows) → build colors map
 *   2. Stream cross_brand_matches in batches (~1.5M rows, no JOIN)
 *   3. Group by source_color_id, look up match colors from map
 *   4. Write top-50-by-delta-e JSON files as we complete each group
 *
 * The naive "single query with embedded JOIN" approach paginates 30x
 * slower because PostgREST has to materialize the JOIN for every batch.
 *
 * Usage: tsx scripts/build-match-data.ts
 *   Run automatically as a `prebuild` hook before `next build`.
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  global: { fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }) },
});

const OUT_DIR = path.resolve(__dirname, "../public/match-data");
const TOP_N_PER_COLOR = 50;
const MATCH_BATCH_SIZE = 1000; // PostgREST default cap is 1000 rows/request

interface ColorRow {
  id: string;
  name: string;
  slug: string;
  hex: string;
  brand_id: string;
}
interface BrandRow {
  id: string;
  name: string;
  slug: string;
}
interface MatchRow {
  source_color_id: string;
  match_color_id: string;
  delta_e_score: number;
}
interface OutputMatch {
  id: string;
  delta_e_score: number;
  match_color: {
    id: string;
    name: string;
    slug: string;
    hex: string;
    brand: { name: string; slug: string };
  };
}

async function main() {
  console.log(`Output dir: ${OUT_DIR}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Load brands map
  console.log("\n[1/3] Loading brands...");
  const { data: brandsData, error: brandsErr } = await supabase
    .from("brands")
    .select("id, name, slug");
  if (brandsErr) {
    console.error("Brands error:", brandsErr.message);
    process.exit(1);
  }
  const brandsById = new Map<string, BrandRow>();
  for (const b of (brandsData ?? []) as BrandRow[]) brandsById.set(b.id, b);
  console.log(`  ${brandsById.size} brands loaded`);

  // 2. Load colors map (paginated — 23k+ rows). Order by id for stable
  // pagination. Always advance `from` by exactly the number of rows
  // returned — Supabase sometimes returns < 1000 mid-stream (likely
  // resource limits server-side) and using a fixed step would skip
  // rows. Loop until a request returns zero rows.
  console.log("\n[2/3] Loading colors...");
  const colorsById = new Map<string, ColorRow>();
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("colors")
      .select("id, name, slug, hex, brand_id")
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) {
      console.error("Colors error:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    for (const c of data as ColorRow[]) colorsById.set(c.id, c);
    process.stdout.write(`\r  ${colorsById.size} colors loaded`);
    from += data.length;
  }
  process.stdout.write(`\r  ${colorsById.size} colors loaded\n`);

  // 3. Stream cross_brand_matches, group + write incrementally
  console.log("\n[3/3] Streaming matches and writing files...");
  // Order by source_color_id so we can detect group boundaries and write
  // each color's file as soon as its group ends.
  let matchOffset = 0;
  let totalMatches = 0;
  let currentSourceId: string | null = null;
  let currentMatches: MatchRow[] = [];
  let filesWritten = 0;
  let droppedNoColor = 0;
  let droppedNoBrand = 0;

  function flushCurrentGroup() {
    if (!currentSourceId || currentMatches.length === 0) return;
    // Sort by delta_e_score ascending and take top N
    currentMatches.sort((a, b) => a.delta_e_score - b.delta_e_score);
    const top = currentMatches.slice(0, TOP_N_PER_COLOR);
    const payload: OutputMatch[] = [];
    for (const m of top) {
      const color = colorsById.get(m.match_color_id);
      if (!color) {
        droppedNoColor++;
        continue;
      }
      const brand = brandsById.get(color.brand_id);
      if (!brand) {
        droppedNoBrand++;
        continue;
      }
      payload.push({
        id: `${m.source_color_id}:${m.match_color_id}`,
        delta_e_score: m.delta_e_score,
        match_color: {
          id: color.id,
          name: color.name,
          slug: color.slug,
          hex: color.hex,
          brand: { name: brand.name, slug: brand.slug },
        },
      });
    }
    if (payload.length > 0) {
      fs.writeFileSync(
        path.join(OUT_DIR, `${currentSourceId}.json`),
        JSON.stringify(payload),
      );
      filesWritten++;
    }
    currentMatches = [];
  }

  while (true) {
    const { data, error } = await supabase
      .from("cross_brand_matches")
      .select("source_color_id, match_color_id, delta_e_score")
      .order("source_color_id", { ascending: true })
      .range(matchOffset, matchOffset + MATCH_BATCH_SIZE - 1);
    if (error) {
      console.error("\nMatches error:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    totalMatches += data.length;

    for (const row of data as MatchRow[]) {
      if (row.source_color_id !== currentSourceId) {
        // Boundary — flush previous group
        flushCurrentGroup();
        currentSourceId = row.source_color_id;
      }
      currentMatches.push(row);
    }

    process.stdout.write(
      `\r  Read ${totalMatches} matches, wrote ${filesWritten} files`,
    );
    if (data.length === 0) break;
    matchOffset += data.length;
  }
  // Flush last group
  flushCurrentGroup();

  process.stdout.write(
    `\r  Read ${totalMatches} matches, wrote ${filesWritten} files\n`,
  );
  if (droppedNoColor > 0)
    console.log(`  (dropped ${droppedNoColor} matches with missing color)`);
  if (droppedNoBrand > 0)
    console.log(`  (dropped ${droppedNoBrand} matches with missing brand)`);

  // Size summary
  const files = fs.readdirSync(OUT_DIR);
  let totalBytes = 0;
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    totalBytes += fs.statSync(path.join(OUT_DIR, f)).size;
  }
  console.log(
    `\nTotal: ${files.length} files, ${(totalBytes / (1024 * 1024)).toFixed(1)} MB on disk`,
  );
  if (files.length > 0) {
    console.log(
      `Avg per color: ${(totalBytes / files.length / 1024).toFixed(1)} KB`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
