/**
 * Scrape Benjamin Moore manufacturer-published LRVs and update DB rows
 * where the delta exceeds the threshold.
 *
 * BM publishes LRV in a meta tag on each color detail page:
 *   <meta name="LRV Value" content="45.46"/>
 *
 * This is the spectrophotometric value used in their data sheets — slightly
 * different from gamma-corrected hex luminance for ~50% of colors.
 *
 * Usage:
 *   tsx scripts/scrape-bm-lrv.ts                 # dry run, full delta report
 *   tsx scripts/scrape-bm-lrv.ts --apply         # apply updates where |delta| >= 2
 *   tsx scripts/scrape-bm-lrv.ts --apply --threshold=1.5
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Cache scraped LRVs locally so rate-limit blips don't lose progress.
// Re-runs reuse cached values, only scrape rows missing from the cache.
const CACHE_PATH = path.resolve(__dirname, "data/bm-lrv-cache.json");
const CACHE_TTL_DAYS = 30;
type CacheEntry = { lrv: number | null; scrapedAt: string };
type Cache = Record<string, CacheEntry>;

function loadCache(): Cache {
  try {
    const raw = fs.readFileSync(CACHE_PATH, "utf8");
    const data = JSON.parse(raw) as Cache;
    const cutoff = Date.now() - CACHE_TTL_DAYS * 86400_000;
    const fresh: Cache = {};
    for (const [k, v] of Object.entries(data)) {
      if (new Date(v.scrapedAt).getTime() > cutoff) fresh[k] = v;
    }
    return fresh;
  } catch {
    return {};
  }
}

function saveCache(cache: Cache) {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  global: { fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }) },
});

const APPLY = process.argv.includes("--apply");
const thresholdArg = process.argv.find((a) => a.startsWith("--threshold="));
const THRESHOLD = thresholdArg ? parseFloat(thresholdArg.split("=")[1]) : 2.0;
const CONCURRENCY = 4;
const REQUEST_DELAY_MS = 100;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

interface BmRow {
  id: string;
  slug: string;
  color_number: string;
  hex: string;
  lrv: number | null;
}

function buildUrl(row: BmRow): string | null {
  if (!row.color_number) return null;
  const numSlug = row.color_number
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  // Strip the color_number suffix from the slug to get the name part.
  // Slug format: "{name-slug}-{number-slug}" where number-slug = numSlug.
  const suffix = `-${numSlug}`;
  if (!row.slug.endsWith(suffix)) return null;
  const nameSlug = row.slug.slice(0, -suffix.length);
  return `https://www.benjaminmoore.com/en-us/paint-colors/color/${numSlug}/${nameSlug}`;
}

async function fetchBmLrv(row: BmRow): Promise<number | null> {
  const url = buildUrl(row);
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/name="LRV Value" content="([0-9.]+)"/);
    if (!match) return null;
    const lrv = parseFloat(match[1]);
    return Math.round(lrv * 10) / 10;
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}, threshold: ${THRESHOLD}, concurrency: ${CONCURRENCY}\n`);

  // 1. Get BM brand id
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", "benjamin-moore")
    .single();
  if (!brand) {
    console.error("Benjamin Moore brand not found");
    process.exit(1);
  }

  // 2. Pull all BM colors
  let rows: BmRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("colors")
      .select("id, slug, color_number, hex, lrv")
      .eq("brand_id", brand.id)
      .order("slug", { ascending: true })
      .range(from, from + 999);
    if (error) {
      console.error("DB read error:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    rows = rows.concat(data as BmRow[]);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`BM colors in DB: ${rows.length}\n`);

  // 3. Load cache, scrape only missing rows
  const cache = loadCache();
  const cacheStartSize = Object.keys(cache).length;
  console.log(`Cache loaded: ${cacheStartSize} previously-scraped colors (TTL ${CACHE_TTL_DAYS}d)\n`);

  const results: { row: BmRow; bmLrv: number | null }[] = [];
  const toScrape = rows.filter((r) => !cache[r.slug]);
  // Resolve cached rows immediately
  for (const row of rows) {
    if (cache[row.slug]) results.push({ row, bmLrv: cache[row.slug].lrv });
  }
  console.log(`Need to scrape: ${toScrape.length} (${rows.length - toScrape.length} cached)\n`);

  let processed = 0;
  let lastTick = Date.now();
  let hits = 0;
  let misses = 0;
  let writesSinceFlush = 0;

  async function processOne(row: BmRow) {
    const bmLrv = await fetchBmLrv(row);
    results.push({ row, bmLrv });
    cache[row.slug] = { lrv: bmLrv, scrapedAt: new Date().toISOString() };
    processed++;
    writesSinceFlush++;
    if (bmLrv !== null) hits++;
    else misses++;
    // Flush cache every 100 scrapes so a crash doesn't lose progress
    if (writesSinceFlush >= 100) {
      saveCache(cache);
      writesSinceFlush = 0;
    }
    if (Date.now() - lastTick > 1000) {
      process.stdout.write(`\r  Scraped ${processed}/${toScrape.length}  (hits ${hits}, misses ${misses})`);
      lastTick = Date.now();
    }
    if (REQUEST_DELAY_MS > 0) await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
  }

  const queue = [...toScrape];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const r = queue.shift();
      if (!r) break;
      await processOne(r);
    }
  });
  await Promise.all(workers);
  saveCache(cache);
  process.stdout.write(`\r  Scraped ${processed}/${toScrape.length}  (hits ${hits}, misses ${misses})\n\n`);

  // 4. Compute deltas
  const updates: { id: string; oldLrv: number | null; newLrv: number; slug: string; delta: number }[] = [];
  let unchanged = 0;
  let unscraped = 0;
  for (const { row, bmLrv } of results) {
    if (bmLrv == null) {
      unscraped++;
      continue;
    }
    const oldLrv = row.lrv;
    if (oldLrv == null) {
      updates.push({ id: row.id, oldLrv, newLrv: bmLrv, slug: row.slug, delta: bmLrv });
      continue;
    }
    const delta = Math.round((bmLrv - oldLrv) * 10) / 10;
    if (Math.abs(delta) < THRESHOLD) {
      unchanged++;
      continue;
    }
    updates.push({ id: row.id, oldLrv, newLrv: bmLrv, slug: row.slug, delta });
  }

  console.log(`Scrape results:`);
  console.log(`  Successfully scraped:    ${hits}`);
  console.log(`  No LRV / 404:            ${misses}`);
  console.log(`  Within threshold:        ${unchanged}`);
  console.log(`  Would update:            ${updates.length}\n`);

  // 5. Sample of updates
  updates.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  console.log("Top 20 deltas:");
  console.log("  slug                                          old → new   Δ");
  for (const u of updates.slice(0, 20)) {
    console.log(`  ${u.slug.padEnd(46)} ${String(u.oldLrv).padStart(5)} → ${String(u.newLrv).padStart(5)}  ${u.delta > 0 ? "+" : ""}${u.delta}`);
  }

  if (!APPLY) {
    console.log(`\nDRY RUN — no changes written. Re-run with --apply to update ${updates.length} rows.`);
    return;
  }

  // 6. Apply updates
  console.log(`\nApplying ${updates.length} updates...`);
  let applied = 0;
  let errs = 0;
  for (const u of updates) {
    const { error } = await supabase.from("colors").update({ lrv: u.newLrv }).eq("id", u.id);
    if (error) {
      errs++;
      console.error(`  Error on ${u.slug}: ${error.message}`);
    } else {
      applied++;
    }
    if (applied % 50 === 0) process.stdout.write(`\r  Applied ${applied}/${updates.length}`);
  }
  process.stdout.write(`\r  Applied ${applied}/${updates.length}  (errors: ${errs})\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
