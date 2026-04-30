/**
 * Scrape Behr manufacturer-published LRVs and update DB rows
 * where the delta exceeds the threshold.
 *
 * Behr renders the color detail page client-side, so we route through
 * crawl4ai on tower.local (which uses a real browser). The LRV appears
 * in the rendered markdown as: **LRV** 14
 *
 * Uses the same JSON cache + concurrency model as scrape-bm-lrv.ts.
 *
 * Usage:
 *   tsx scripts/scrape-behr-lrv.ts                 # dry run
 *   tsx scripts/scrape-behr-lrv.ts --apply         # apply at default threshold 2
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

const APPLY = process.argv.includes("--apply");
const thresholdArg = process.argv.find((a) => a.startsWith("--threshold="));
const THRESHOLD = thresholdArg ? parseFloat(thresholdArg.split("=")[1]) : 2.0;
const CONCURRENCY = 4;
const REQUEST_DELAY_MS = 100;
const CRAWL4AI_URL = "http://192.168.2.110:11235/md";

const CACHE_PATH = path.resolve(__dirname, "data/behr-lrv-cache.json");
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

interface BehrRow {
  id: string;
  slug: string;
  color_number: string;
  hex: string;
  lrv: number | null;
}

function buildUrl(row: BehrRow): string | null {
  if (!row.color_number) return null;
  // Behr URL format: /consumer/ColorDetailView/{COLOR_NUMBER}
  // DB has color_number already in the right format (e.g. "N430-6A").
  // Some entries may have trailing whitespace or odd casing — normalize.
  const num = row.color_number.trim().toUpperCase();
  return `https://www.behr.com/consumer/ColorDetailView/${num}`;
}

async function fetchBehrLrv(row: BehrRow): Promise<number | null> {
  const url = buildUrl(row);
  if (!url) return null;
  try {
    const res = await fetch(CRAWL4AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, f: "raw" }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { markdown?: string };
    const md = data.markdown ?? "";
    const match = md.match(/\*\*LRV\*\*\s+([0-9.]+)/);
    if (!match) return null;
    const lrv = parseFloat(match[1]);
    return Math.round(lrv * 10) / 10;
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}, threshold: ${THRESHOLD}, concurrency: ${CONCURRENCY}\n`);

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", "behr")
    .single();
  if (!brand) {
    console.error("Behr brand not found");
    process.exit(1);
  }

  let rows: BehrRow[] = [];
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
    rows = rows.concat(data as BehrRow[]);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Behr colors in DB: ${rows.length}\n`);

  const cache = loadCache();
  const cacheStartSize = Object.keys(cache).length;
  console.log(`Cache loaded: ${cacheStartSize} previously-scraped colors\n`);

  const results: { row: BehrRow; behrLrv: number | null }[] = [];
  const toScrape = rows.filter((r) => !cache[r.slug]);
  for (const row of rows) {
    if (cache[row.slug]) results.push({ row, behrLrv: cache[row.slug].lrv });
  }
  console.log(`Need to scrape: ${toScrape.length} (${rows.length - toScrape.length} cached)\n`);

  let processed = 0;
  let lastTick = Date.now();
  let hits = 0;
  let misses = 0;
  let writesSinceFlush = 0;

  async function processOne(row: BehrRow) {
    const behrLrv = await fetchBehrLrv(row);
    results.push({ row, behrLrv });
    cache[row.slug] = { lrv: behrLrv, scrapedAt: new Date().toISOString() };
    processed++;
    writesSinceFlush++;
    if (behrLrv !== null) hits++;
    else misses++;
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

  const updates: { id: string; oldLrv: number | null; newLrv: number; slug: string; delta: number }[] = [];
  let unchanged = 0;
  let unscraped = 0;
  for (const { row, behrLrv } of results) {
    if (behrLrv == null) {
      unscraped++;
      continue;
    }
    const oldLrv = row.lrv;
    if (oldLrv == null) {
      updates.push({ id: row.id, oldLrv, newLrv: behrLrv, slug: row.slug, delta: behrLrv });
      continue;
    }
    const delta = Math.round((behrLrv - oldLrv) * 10) / 10;
    if (Math.abs(delta) < THRESHOLD) {
      unchanged++;
      continue;
    }
    updates.push({ id: row.id, oldLrv, newLrv: behrLrv, slug: row.slug, delta });
  }

  console.log(`Scrape results:`);
  console.log(`  Successfully scraped:    ${hits + (rows.length - toScrape.length)}`);
  console.log(`  No LRV / 404:            ${misses}`);
  console.log(`  Within threshold:        ${unchanged}`);
  console.log(`  Would update:            ${updates.length}\n`);

  updates.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  console.log("Top 20 deltas:");
  console.log("  slug                                          old → new   Δ");
  for (const u of updates.slice(0, 20)) {
    console.log(`  ${u.slug.padEnd(46)} ${String(u.oldLrv).padStart(5)} → ${String(u.newLrv).padStart(5)}  ${u.delta > 0 ? "+" : ""}${u.delta}`);
  }

  if (!APPLY) {
    console.log(`\nDRY RUN — re-run with --apply to update ${updates.length} rows.`);
    return;
  }

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
  }
  console.log(`  Applied ${applied}/${updates.length}  (errors: ${errs})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
