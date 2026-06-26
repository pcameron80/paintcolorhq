/**
 * check-samplize-availability.ts
 *
 * Samplize stocks peel-and-stick samples for only Sherwin-Williams, Benjamin
 * Moore, and Farrow & Ball — and its catalog is NOT a superset of ours. The
 * color-page affiliate CTA deep-links to
 *   https://samplize.com/products/<colorSlug>-12x12
 * so for colors Samplize doesn't carry, that link 404s. This script checks every
 * SW/BM/F&B color against the live Samplize site and writes the result to
 * colors.samplize_available, which gates the CTA (see migration 007).
 *
 * 200            -> samplize_available = true
 * 404 / 410      -> samplize_available = false
 * error/timeout  -> left unchanged (NULL stays NULL; re-run to retry)
 *
 * Usage:
 *   npm run check-samplize           # full run (~6k colors)
 *   tsx scripts/check-samplize-availability.ts --limit 30   # smoke test
 *   tsx scripts/check-samplize-availability.ts --brand sherwin-williams
 *
 * Re-run after any color import that touches SW/BM/F&B.
 */
import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey, {
  global: { fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }) },
});

// The only brands Samplize stocks (slug must match the brands table + affiliate.ts).
const SAMPLIZE_BRAND_SLUGS = ["sherwin-williams", "benjamin-moore", "farrow-ball"];

const CONCURRENCY = 8;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 15_000;

// CLI args
const args = process.argv.slice(2);
const getArg = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const limitArg = getArg("--limit");
const limit = limitArg ? parseInt(limitArg, 10) : undefined;
const brandArg = getArg("--brand");
const brandSlugs = brandArg ? [brandArg] : SAMPLIZE_BRAND_SLUGS;

type Row = { id: string; slug: string; brandSlug: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET the product URL; return 'available' | 'missing' | 'error'. */
async function probe(slug: string): Promise<"available" | "missing" | "error"> {
  const url = `https://samplize.com/products/${slug}-12x12`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "PaintColorHQ-availability-check/1.0 (+https://www.paintcolorhq.com)" },
      });
      clearTimeout(timer);
      if (res.status === 200) return "available";
      if (res.status === 404 || res.status === 410) return "missing";
      // 429 / 5xx -> back off and retry
      if (attempt < MAX_RETRIES) await sleep(1000 * attempt);
    } catch {
      clearTimeout(timer);
      if (attempt < MAX_RETRIES) await sleep(1000 * attempt);
    }
  }
  return "error";
}

/** Fetch all target colors, paginated (range needs order — see memory). */
async function fetchColors(): Promise<Row[]> {
  const { data: brands, error: bErr } = await supabase
    .from("brands")
    .select("id, slug")
    .in("slug", brandSlugs);
  if (bErr) throw bErr;
  const brandById = new Map((brands ?? []).map((b) => [b.id as string, b.slug as string]));
  const brandIds = (brands ?? []).map((b) => b.id as string);

  const rows: Row[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("colors")
      .select("id, slug, brand_id")
      .in("brand_id", brandIds)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const c of data) {
      rows.push({ id: c.id as string, slug: c.slug as string, brandSlug: brandById.get(c.brand_id as string)! });
    }
    if (data.length < PAGE) break;
    if (limit && rows.length >= limit) break;
  }
  return limit ? rows.slice(0, limit) : rows;
}

/** Update samplize_available for a set of ids in chunks. */
async function setAvailability(ids: string[], value: boolean) {
  const CHUNK = 500;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { error } = await supabase.from("colors").update({ samplize_available: value }).in("id", chunk);
    if (error) throw error;
  }
}

async function main() {
  console.log(`Fetching colors for: ${brandSlugs.join(", ")}${limit ? ` (limit ${limit})` : ""}`);
  const rows = await fetchColors();
  console.log(`Checking ${rows.length} colors against samplize.com (concurrency ${CONCURRENCY})...\n`);

  const available: string[] = [];
  const missing: string[] = [];
  let errored = 0;
  const perBrand: Record<string, { available: number; missing: number; error: number }> = {};
  for (const b of brandSlugs) perBrand[b] = { available: 0, missing: 0, error: 0 };

  let done = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      const result = await probe(row.slug);
      if (result === "available") { available.push(row.id); perBrand[row.brandSlug].available++; }
      else if (result === "missing") { missing.push(row.id); perBrand[row.brandSlug].missing++; }
      else { errored++; perBrand[row.brandSlug].error++; }
      done++;
      if (done % 250 === 0 || done === rows.length) {
        console.log(`  ${done}/${rows.length}  (ok ${available.length} / 404 ${missing.length} / err ${errored})`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(`\nWriting results to DB: ${available.length} available, ${missing.length} missing...`);
  await setAvailability(available, true);
  await setAvailability(missing, false);

  console.log("\n=== Per-brand summary ===");
  for (const b of brandSlugs) {
    const s = perBrand[b];
    const total = s.available + s.missing + s.error;
    const pct = total ? Math.round((s.available / total) * 100) : 0;
    console.log(`  ${b.padEnd(18)} available ${s.available}/${total} (${pct}%)  · 404 ${s.missing}  · err ${s.error}`);
  }
  if (errored > 0) console.log(`\n⚠️  ${errored} colors errored (left unchanged / NULL). Re-run to retry those.`);
  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
