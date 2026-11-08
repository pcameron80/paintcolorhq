/**
 * Pre-compute cross_brand_matches into per-color JSON files.
 *
 * The color detail page calls getCrossBrandMatches(colorId) on every
 * render. Serving the result as a static file keeps that off Supabase:
 * 26k color pages x ~12 KB per response is ~300 MB of egress from
 * cold-cache renders alone.
 *
 * This script writes one JSON file per source color to
 * public/match-data/{colorId}.json, which the page fetches from the
 * static CDN at render time (src/lib/queries.ts getCrossBrandMatches).
 *
 * Steps:
 *   1. Load brands and all colors (keyset paged).
 *   2. Integrity gate: cross_brand_matches must hold exactly
 *      colors x (brands - 1) x 5 rows. A table mid-reseed fails the build
 *      instead of shipping 0 files (this happened 2026-10-11).
 *   3. Fingerprint the content the files are built from. On a match with the
 *      previous build's fingerprint, copy the cached files and skip to 6.
 *   4. Fetch matches 16 source colors per request (.in(), no OFFSET), a few
 *      requests in flight, and write the top 50 by Delta E per color
 *      (ties broken by rank, then match id).
 *   5. Integrity gate: one file per color, each with at least 50 matches.
 *      Only then is the cache marker written.
 *   6. Overlay frozen sources (scripts/data/frozen-match-sources.json) with
 *      their production snapshots while the entry's `until` is in the future.
 *
 * The cache marker lives in .next/cache only. It is never copied to public/.
 *
 * Usage: tsx scripts/build-match-data.ts
 *   Run automatically as a `prebuild` hook before `next build`.
 *   --force   ignore the cache and regenerate
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  activeFrozen,
  checkPayload,
  expectedMatchCount,
  loadFrozenList,
  matchCountError,
  snapshotPath,
  todayUtc,
} from "./lib/frozen-match";

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
// Vercel preserves .next/cache between builds. The generated files and the
// fingerprint they were built from live there so an unchanged dataset skips
// regeneration.
const CACHE_DIR = path.resolve(__dirname, "../.next/cache/match-data");
const CACHE_MARKER = path.join(CACHE_DIR, ".hash");
const HASH_VERSION = "v4";
const TOP_N_PER_COLOR = 50;
const MATCHES_PER_TARGET_BRAND = 5; // compute-matches.ts TOP_N
const PAGE_SIZE = 1000; // PostgREST max rows per request
const SOURCES_PER_REQUEST = 16; // 16 x 60 rows = 960, under the 1000-row cap
const CONCURRENCY = 8;
const MAX_ATTEMPTS = 4;

interface ColorRow {
  id: string;
  name: string;
  slug: string;
  hex: string;
  color_number: string | null;
  brand_id: string;
  availability: string | null;
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
  rank: number;
}
interface OutputMatch {
  id: string;
  delta_e_score: number;
  match_color: {
    id: string;
    name: string;
    slug: string;
    hex: string;
    availability: string;
    brand: { name: string; slug: string };
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fail(message: string): never {
  console.error(`\nERROR: ${message}`);
  console.error("No cache marker written. The previous deployment stays live.");
  process.exit(1);
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_ATTEMPTS) await sleep(500 * 2 ** (attempt - 1));
    }
  }
  throw new Error(`${label} failed after ${MAX_ATTEMPTS} attempts: ${String(lastErr)}`);
}

function md5(text: string): string {
  return createHash("md5").update(text).digest("hex");
}

function jsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
}

/** Copies only *.json, so the cache marker can never reach public/. */
function copyJsonFiles(src: string, dest: string): number {
  fs.mkdirSync(dest, { recursive: true });
  let copied = 0;
  for (const file of jsonFiles(src)) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
    copied++;
  }
  return copied;
}

function clearJsonFiles(dir: string) {
  for (const f of jsonFiles(dir)) fs.unlinkSync(path.join(dir, f));
}

async function loadBrands(): Promise<BrandRow[]> {
  const { data, error } = await supabase.from("brands").select("id, name, slug").order("id");
  if (error) fail(`brands: ${error.message}`);
  return (data ?? []) as BrandRow[];
}

/** Keyset pagination on id: no OFFSET, and a short page cannot skip rows. */
async function loadColors(): Promise<ColorRow[]> {
  const rows: ColorRow[] = [];
  let lastId: string | null = null;
  while (true) {
    const after: string | null = lastId;
    const data = await withRetry("colors page", async () => {
      let q = supabase
        .from("colors")
        .select("id, name, slug, hex, color_number, brand_id, availability")
        .order("id", { ascending: true })
        .limit(PAGE_SIZE);
      if (after) q = q.gt("id", after);
      const res = await q;
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []) as ColorRow[];
    });
    if (data.length === 0) break;
    rows.push(...data);
    lastId = data[data.length - 1].id;
    process.stdout.write(`\r  ${rows.length} colors loaded`);
  }
  process.stdout.write(`\r  ${rows.length} colors loaded\n`);
  return rows;
}

async function countRows(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error || count === null) fail(`${table} count: ${error?.message ?? "null count"}`);
  return count;
}

async function maxContentUpdatedAt(): Promise<string> {
  const { data, error } = await supabase
    .from("colors")
    .select("content_updated_at")
    .order("content_updated_at", { ascending: false })
    .limit(1);
  // Column added in migration 014. Without it the color md5 below still
  // covers every field the files contain.
  if (error) return "n/a";
  return String(data?.[0]?.content_updated_at ?? "none");
}

/**
 * First and last cross_brand_matches id. seed-matches inserts without an id,
 * so Postgres mints new UUIDs on every TRUNCATE + reseed and this pair
 * changes even when the row count and every color stay the same (a tie-order
 * fix, a compute-matches logic change, a Lab-only correction). Two ordered
 * limit-1 reads on the primary key.
 */
async function matchIdRange(): Promise<string> {
  const edge = async (ascending: boolean) => {
    const { data, error } = await supabase.from("cross_brand_matches").select("id").order("id", { ascending }).limit(1);
    if (error) fail(`cross_brand_matches id range: ${error.message}`);
    return String(data?.[0]?.id ?? "none");
  };
  return `${await edge(true)}..${await edge(false)}`;
}

/**
 * Content fingerprint of everything the generated files depend on. Any hex,
 * name, slug, number, availability or brand edit changes it, as does any
 * reseed of cross_brand_matches (matchIdRange) and any change to this
 * script. The v2 key was row counts only, so every in-place correction
 * shipped stale files; v3 missed reseeds that kept the row count (found in
 * the 2026-11 data audit).
 *
 * The frozen list and snapshots are deliberately not part of it: they are
 * applied after the cache (applyFrozen), so editing them never forces a
 * regeneration and an expired freeze never needs one.
 */
function fingerprint(colors: ColorRow[], brands: BrandRow[], matchCount: number, maxUpdated: string, matchIds: string): string {
  const colorText = colors
    .map((c) => [c.id, c.name, c.slug, c.hex, c.color_number ?? "", c.availability ?? "", c.brand_id].join("|"))
    .join("\n");
  const brandText = brands.map((b) => [b.id, b.name, b.slug].join("|")).join("\n");
  const scriptText = [__filename, path.resolve(__dirname, "lib/frozen-match.ts")]
    .map((f) => fs.readFileSync(f, "utf-8"))
    .join("\n");
  return [
    HASH_VERSION,
    `colors:${colors.length}`,
    `updated:${maxUpdated}`,
    `colorsmd5:${md5(colorText)}`,
    `brandsmd5:${md5(brandText)}`,
    `matches:${matchCount}`,
    `matchids:${md5(matchIds)}`,
    `script:${md5(scriptText)}`,
  ].join("|");
}

/** Writes snapshots over generated files for entries still frozen today. */
function applyFrozen(): void {
  const today = todayUtc();
  const active = activeFrozen(loadFrozenList(), today);
  if (active.length === 0) {
    console.log(`\nFrozen sources: none active on ${today}.`);
    return;
  }
  console.log(`\nFrozen sources: ${active.length} active on ${today}.`);
  for (const e of active) {
    const snap = snapshotPath(e.id);
    if (!fs.existsSync(snap))
      fail(`frozen source ${e.key} has no snapshot. Run: npx tsx scripts/snapshot-frozen-match.ts`);
    const out = path.join(OUT_DIR, `${e.id}.json`);
    if (!fs.existsSync(out)) fail(`frozen source ${e.key} (${e.id}) is not a current color`);
    const text = fs.readFileSync(snap, "utf-8");
    const problem = checkPayload(e.id, text, TOP_N_PER_COLOR);
    if (problem) fail(`frozen snapshot for ${e.key} is unusable: ${problem}`);
    fs.writeFileSync(out, text);
    if (fs.readFileSync(out, "utf-8") !== text) fail(`frozen file for ${e.key} does not equal its snapshot`);
    console.log(`  ${e.key}: snapshot served until ${e.until}`);
  }
}

async function main() {
  const started = Date.now();
  const force = process.argv.includes("--force");
  console.log(`Output dir: ${OUT_DIR}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Start clean: a retired color must not leave a stale file behind.
  clearJsonFiles(OUT_DIR);
  if (fs.existsSync(path.join(OUT_DIR, ".hash"))) fs.unlinkSync(path.join(OUT_DIR, ".hash"));

  console.log("\n[1/4] Loading brands and colors...");
  const brands = await loadBrands();
  const brandsById = new Map(brands.map((b) => [b.id, b]));
  const colors = await loadColors();
  const colorsById = new Map(colors.map((c) => [c.id, c]));
  const brandsWithColors = new Set(colors.map((c) => c.brand_id)).size;
  console.log(`  ${brands.length} brands (${brandsWithColors} with colors)`);

  const matchCount = await countRows("cross_brand_matches");
  const colorCount = await countRows("colors");
  if (colorCount !== colors.length) fail(`loaded ${colors.length} colors but the table holds ${colorCount}`);

  // Integrity gate, before anything is generated or served from cache.
  const expected = expectedMatchCount(colors.length, brandsWithColors, MATCHES_PER_TARGET_BRAND);
  console.log(`  cross_brand_matches: ${matchCount} (expected ${expected})`);
  const countProblem = matchCountError(matchCount, colors.length, brandsWithColors, MATCHES_PER_TARGET_BRAND);
  if (countProblem) fail(countProblem);

  console.log("\n[2/4] Checking build cache...");
  const currentHash = fingerprint(colors, brands, matchCount, await maxContentUpdatedAt(), await matchIdRange());
  if (!force && fs.existsSync(CACHE_MARKER)) {
    const savedHash = fs.readFileSync(CACHE_MARKER, "utf-8").trim();
    const cached = jsonFiles(CACHE_DIR).length;
    if (savedHash === currentHash && cached === colors.length) {
      console.log(`  Cache hit (${currentHash}). Copying ${cached} files...`);
      copyJsonFiles(CACHE_DIR, OUT_DIR);
      applyFrozen();
      console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
      return;
    }
    console.log(`  Cache miss (saved=${savedHash}, ${cached} files; current=${currentHash}).`);
  } else {
    console.log(force ? "  --force: regenerating." : `  No cache marker (current ${currentHash}).`);
  }

  console.log("\n[3/4] Fetching matches and writing files...");
  const sourceIds = colors.map((c) => c.id); // sorted by id
  const batches: string[][] = [];
  for (let i = 0; i < sourceIds.length; i += SOURCES_PER_REQUEST)
    batches.push(sourceIds.slice(i, i + SOURCES_PER_REQUEST));

  let totalMatches = 0;
  let filesWritten = 0;
  let droppedNoColor = 0;
  let droppedNoBrand = 0;
  const shortPayloads: string[] = [];

  function writeGroup(sourceId: string, rows: MatchRow[]) {
    // Delta E ascending. Scores are rounded to 2 decimals, so ties are
    // common: rank (compute-matches' order on the unrounded score within a
    // target brand) breaks them first, then match id for determinism.
    rows.sort(
      (a, b) =>
        a.delta_e_score - b.delta_e_score ||
        a.rank - b.rank ||
        (a.match_color_id < b.match_color_id ? -1 : a.match_color_id > b.match_color_id ? 1 : 0),
    );
    const payload: OutputMatch[] = [];
    for (const m of rows.slice(0, TOP_N_PER_COLOR)) {
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
          availability: color.availability ?? "current",
          brand: { name: brand.name, slug: brand.slug },
        },
      });
    }
    if (payload.length < TOP_N_PER_COLOR) shortPayloads.push(`${sourceId} (${payload.length})`);
    if (payload.length > 0) {
      fs.writeFileSync(path.join(OUT_DIR, `${sourceId}.json`), JSON.stringify(payload));
      filesWritten++;
    }
  }

  async function runBatch(ids: string[]) {
    const rows = await withRetry(`matches for batch starting ${ids[0]}`, async () => {
      const res = await supabase
        .from("cross_brand_matches")
        .select("source_color_id, match_color_id, delta_e_score, rank")
        .in("source_color_id", ids)
        .order("source_color_id", { ascending: true })
        .order("delta_e_score", { ascending: true })
        .order("rank", { ascending: true })
        .order("match_color_id", { ascending: true })
        .limit(PAGE_SIZE);
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []) as MatchRow[];
    });
    if (rows.length >= PAGE_SIZE)
      fail(`a ${ids.length}-source request hit the ${PAGE_SIZE}-row cap, so rows would be lost`);
    totalMatches += rows.length;
    const groups = new Map<string, MatchRow[]>();
    for (const r of rows) {
      const g = groups.get(r.source_color_id);
      if (g) g.push(r);
      else groups.set(r.source_color_id, [r]);
    }
    for (const id of ids) writeGroup(id, groups.get(id) ?? []);
  }

  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < batches.length) {
        const batch = batches[next++];
        await runBatch(batch);
        done++;
        if (done % 50 === 0 || done === batches.length)
          process.stdout.write(`\r  ${done}/${batches.length} requests, ${totalMatches} matches, ${filesWritten} files`);
      }
    }),
  );
  process.stdout.write("\n");
  if (droppedNoColor > 0) console.log(`  (dropped ${droppedNoColor} matches with missing color)`);
  if (droppedNoBrand > 0) console.log(`  (dropped ${droppedNoBrand} matches with missing brand)`);

  console.log("\n[4/4] Verifying output...");
  const onDisk = jsonFiles(OUT_DIR);
  let totalBytes = 0;
  for (const f of onDisk) totalBytes += fs.statSync(path.join(OUT_DIR, f)).size;
  console.log(
    `  ${onDisk.length} files, ${(totalBytes / (1024 * 1024)).toFixed(1)} MB, ` +
      `${totalMatches} matches read, ${((Date.now() - started) / 1000).toFixed(1)}s elapsed`,
  );
  if (totalMatches !== matchCount) fail(`read ${totalMatches} matches but the table held ${matchCount} at the start`);
  if (shortPayloads.length > 0)
    fail(
      `${shortPayloads.length} colors have fewer than ${TOP_N_PER_COLOR} matches, e.g. ` +
        shortPayloads.slice(0, 5).join(", "),
    );
  if (filesWritten !== colors.length || onDisk.length !== colors.length)
    fail(`wrote ${filesWritten} files (${onDisk.length} on disk) for ${colors.length} colors`);

  // Cache the generated files before the frozen overlay, then the marker last.
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (fs.existsSync(CACHE_MARKER)) fs.unlinkSync(CACHE_MARKER);
  clearJsonFiles(CACHE_DIR);
  const copied = copyJsonFiles(OUT_DIR, CACHE_DIR);
  fs.writeFileSync(CACHE_MARKER, currentHash);
  console.log(`  Cached ${copied} files with hash ${currentHash}.`);

  applyFrozen();
  console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
