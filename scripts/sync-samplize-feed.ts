/**
 * sync-samplize-feed.ts
 *
 * Authoritative source for Samplize availability. Pulls the Samplize product feed
 * from CJ's Product Search API (advertiser 6366250 = "Samplize") and writes, for
 * every SW/BM/F&B color:
 *   - colors.samplize_available  true if Samplize stocks it, else false
 *   - colors.samplize_handle     exact samplize.com handle IFF it differs from the
 *                                default `<slug>-12x12` (accent/special-char colors)
 *
 * This supersedes the URL-crawl in check-samplize-availability.ts: the feed is the
 * catalog itself, so it's exact (no guessing, no 404s) and recovers colors whose
 * name has accented chars where our slug differs from Samplize's handle.
 *
 * Matching: by our slug == feed handle minus `-12x12` (the common case), with a
 * (brand, color_number) fallback that catches the accent/spelling mismatches.
 *
 * Auth: CJ_PERSONAL_ACCESS_TOKEN in .env.local (a credential — never commit).
 *
 * Usage:
 *   npm run sync-samplize                 # full sync
 *   tsx scripts/sync-samplize-feed.ts --dry-run
 *
 * Re-run on a schedule / after color imports to track catalog changes.
 */
import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { global: { fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }) } }
);

const CJ_ENDPOINT = "https://ads.api.cj.com/query";
const CJ_TOKEN = process.env.CJ_PERSONAL_ACCESS_TOKEN!;
const COMPANY_ID = "7980245"; // our publisher company id
const SAMPLIZE_ADVERTISER_ID = "6366250"; // advertiser "Samplize" (samplize.com feed)
const PAGE = 5000; // CJ offset-pagination: offset+limit must stay within the first 10,000 records

const BRAND_MAP: Record<string, string> = {
  "sherwin-williams": "sherwin-williams",
  "benjamin moore": "benjamin-moore",
  "farrow & ball": "farrow-ball",
  "farrow and ball": "farrow-ball",
};
const dryRun = process.argv.includes("--dry-run");

const normCode = (s: string | null | undefined) => (s ?? "").toUpperCase().replace(/\s+/g, "").trim();
// Code-match key. Two formatting gaps to bridge so we don't miss stocked colors:
//  - dual codes (BM Cloud White is OC-130 to us, "967" on Samplize) → handled via
//    alternate_numbers in the matcher.
//  - leading-zero padding (SW historic "Acanthus" is "29" to us, "0029" on Samplize)
//    → collapse leading zeros on pure-numeric codes here.
const codeKey = (s: string | null | undefined) => {
  const c = normCode(s);
  return /^\d+$/.test(c) ? String(parseInt(c, 10)) : c;
};

interface FeedEntry { handle: string; brandSlug: string; code: string }

async function cjQuery(offset: number, limit: number) {
  const query = `{ products(companyId:"${COMPANY_ID}", partnerIds:["${SAMPLIZE_ADVERTISER_ID}"], limit:${limit}, offset:${offset}){ totalCount count resultList{ brand title link } } }`;
  const res = await fetch(CJ_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${CJ_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error("CJ API error: " + JSON.stringify(json.errors));
  return json.data.products as { totalCount: number; count: number; resultList: Array<{ brand: string; title: string; link: string }> };
}

/**
 * Pull the whole feed into a unique-handle map. CJ's `products` query has NO
 * stable sort, so a single offset pass surfaces a shifting subset and misses
 * records. We repeat the full pass and union the results until the unique-handle
 * count plateaus (loop-until-dry: 3 consecutive passes that add nothing).
 */
async function fetchFeed(): Promise<FeedEntry[]> {
  const byHandle = new Map<string, FeedEntry>();
  const MAX_PASSES = 25;
  let dryStreak = 0;
  for (let pass = 1; pass <= MAX_PASSES && dryStreak < 3; pass++) {
    const before = byHandle.size;
    let offset = 1;
    let total = Infinity;
    while (offset <= total) {
      // offset-pagination is bounded to the first 10,000 records; size the last
      // page so offset+limit never exceeds that window.
      const limit = total === Infinity ? PAGE : Math.min(PAGE, total - offset + 1);
      const page = await cjQuery(offset, limit);
      total = page.totalCount;
      for (const p of page.resultList) {
        const m = p.link.match(/\/products\/([^?#]+)/);
        if (!m) continue;
        const handle = m[1];
        if (byHandle.has(handle)) continue;
        const brandSlug = BRAND_MAP[(p.brand ?? "").toLowerCase().trim()];
        if (!brandSlug) continue; // non-paint or unmapped brand — skip
        // color code = the parenthesised token that contains a digit, e.g. (HC-111), (7029)
        const codes = [...p.title.matchAll(/\(([^)]+)\)/g)].map((x) => x[1]).filter((c) => /\d/.test(c));
        byHandle.set(handle, { handle, brandSlug, code: codeKey(codes[codes.length - 1] ?? "") });
      }
      if (page.count < PAGE) break;
      offset += PAGE;
    }
    const added = byHandle.size - before;
    dryStreak = added === 0 ? dryStreak + 1 : 0;
    console.log(`  pass ${pass}: ${byHandle.size} unique handles (+${added})`);
  }
  return [...byHandle.values()];
}

/** All SW/BM/F&B colors (paginated; range needs order — see memory). */
async function fetchColors() {
  const { data: brands, error: bErr } = await supabase
    .from("brands").select("id, slug").in("slug", ["sherwin-williams", "benjamin-moore", "farrow-ball"]);
  if (bErr) throw bErr;
  const slugById = new Map((brands ?? []).map((b) => [b.id as string, b.slug as string]));
  const brandIds = (brands ?? []).map((b) => b.id as string);
  const rows: Array<{ id: string; slug: string; code: string; altCodes: string[]; brandSlug: string; crawlAvailable: boolean | null }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("colors").select("id, slug, color_number, alternate_numbers, brand_id, samplize_available")
      .in("brand_id", brandIds).order("id", { ascending: true }).range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const c of data) rows.push({
      id: c.id as string, slug: c.slug as string,
      code: codeKey(c.color_number as string),
      // BM (and some others) carry dual codes — e.g. Cloud White is OC-130 to us but
      // "967" on Samplize. Match against the alternates too or we miss flagship colors.
      altCodes: ((c.alternate_numbers as string[] | null) ?? []).map(codeKey).filter(Boolean),
      brandSlug: slugById.get(c.brand_id as string)!,
      crawlAvailable: (c.samplize_available as boolean | null),
    });
    if (data.length < 1000) break;
  }
  return rows;
}

async function batchUpdate(ids: string[], patch: Record<string, unknown>) {
  for (let i = 0; i < ids.length; i += 500) {
    const { error } = await supabase.from("colors").update(patch).in("id", ids.slice(i, i + 500));
    if (error) throw error;
  }
}

async function main() {
  if (!CJ_TOKEN) throw new Error("CJ_PERSONAL_ACCESS_TOKEN missing from .env.local");
  console.log("Pulling Samplize feed (advertiser 6366250)...");
  const feed = await fetchFeed();
  const bySlug = new Map<string, string>();           // colorSlug -> handle
  const byBrandCode = new Map<string, string>();      // brandSlug|code -> handle
  for (const e of feed) {
    bySlug.set(e.handle.replace(/-12x12$/, ""), e.handle);
    if (e.code) byBrandCode.set(`${e.brandSlug}|${e.code}`, e.handle);
  }
  console.log(`Feed: ${feed.length} unique products. Matching against our colors...`);

  const colors = await fetchColors();

  // Reverse coverage: which Samplize colors have NO PaintColorHQ page (per brand)?
  const pchqSlugSet = new Set(colors.map((c) => c.slug));
  const pchqBrandCode = new Set<string>();
  for (const c of colors) { for (const code of [c.code, ...c.altCodes]) if (code) pchqBrandCode.add(`${c.brandSlug}|${code}`); }
  const perBrand: Record<string, { feed: number; matched: number; pchq: number }> = {};
  for (const c of colors) { perBrand[c.brandSlug] ??= { feed: 0, matched: 0, pchq: 0 }; perBrand[c.brandSlug].pchq++; }
  for (const e of feed) {
    perBrand[e.brandSlug] ??= { feed: 0, matched: 0, pchq: 0 };
    perBrand[e.brandSlug].feed++;
    const slug = e.handle.replace(/-12x12$/, "");
    if (pchqSlugSet.has(slug) || (e.code && pchqBrandCode.has(`${e.brandSlug}|${e.code}`))) perBrand[e.brandSlug].matched++;
  }
  console.log("\n=== Catalog coverage (Samplize feed vs our colors) ===");
  for (const [b, s] of Object.entries(perBrand)) {
    console.log(`  ${b.padEnd(18)} Samplize ${s.feed} · we link ${s.matched} · Samplize-only (no PCHQ page) ${s.feed - s.matched} · our colors ${s.pchq}`);
  }

  // Additive UNION. The crawl (migration 007) already confirmed which
  // `<slug>-12x12` URLs resolve live on samplize.com. This CJ feed is a ~2-week
  // Google-Shopping subset, so it is NOT a superset — we only ADD recoveries:
  // colors the crawl marked unavailable that the feed proves are stocked, using
  // the feed's exact handle (often `-9x1475` or an accent-corrected slug). We
  // never flip a crawl-confirmed color to false on the basis of this feed.
  const recoveryDefault: string[] = [];                            // crawl-miss, feed-has, default handle works
  const recoveryOverride: Array<{ id: string; handle: string }> = []; // crawl-miss, feed-has, needs exact handle
  let alreadyTrue = 0, stillFalse = 0;
  const matchHandle = (c: { slug: string; code: string; altCodes: string[]; brandSlug: string }) => {
    const bySlugHit = bySlug.get(c.slug);
    if (bySlugHit) return bySlugHit;
    for (const code of [c.code, ...c.altCodes]) {
      if (!code) continue;
      const h = byBrandCode.get(`${c.brandSlug}|${code}`);
      if (h) return h;
    }
    return undefined;
  };
  for (const c of colors) {
    const handle = matchHandle(c);
    if (c.crawlAvailable === true) { alreadyTrue++; continue; }     // keep the working -12x12 link untouched
    if (!handle) { stillFalse++; continue; }                        // not in feed either → leave unavailable
    if (handle === `${c.slug}-12x12`) recoveryDefault.push(c.id);
    else recoveryOverride.push({ id: c.id, handle });
  }
  const recovered = recoveryDefault.length + recoveryOverride.length;

  console.log("\n=== Union (additive recovery over the crawl) ===");
  console.log(`  crawl-confirmed available (kept):  ${alreadyTrue}`);
  console.log(`  recovered by feed (now available): ${recovered}`);
  console.log(`    └─ needing exact-handle override: ${recoveryOverride.length}`);
  console.log(`  still unavailable (not in feed):   ${stillFalse}`);
  console.log(`  → total available after sync:      ${alreadyTrue + recovered} / ${colors.length}`);
  if (recoveryOverride.length) console.log("  sample overrides:", recoveryOverride.slice(0, 10).map((o) => o.handle).join(", "));

  if (dryRun) { console.log("\n(dry run — no DB writes)"); return; }

  console.log("\nWriting recoveries to DB (crawl-confirmed rows untouched)...");
  await batchUpdate(recoveryDefault, { samplize_available: true, samplize_handle: null });
  for (const o of recoveryOverride) {
    const { error } = await supabase.from("colors").update({ samplize_available: true, samplize_handle: o.handle }).eq("id", o.id);
    if (error) throw error;
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
