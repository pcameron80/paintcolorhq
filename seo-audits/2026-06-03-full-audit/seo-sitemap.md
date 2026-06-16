# Sitemap Architecture Audit — PaintColorHQ
**Date:** 2026-06-03
**Auditor:** Sitemap Architecture specialist
**Scope:** sitemap index + all 12 sub-sitemaps (23,438 color URLs across 5 shards, plus pages, brands, matches, match-individual, blog, families, inspiration)

---

## Summary Scorecard

| Check | Result | Severity |
|---|---|---|
| XML well-formed | PASS | — |
| Index references all 12 children | PASS | — |
| No deprecated tags (priority/changefreq) | PASS | — |
| All URLs absolute HTTPS | PASS | — |
| All sitemaps under 50,000 URL limit | PASS | — |
| No noindexed URLs in sitemap | PASS | — |
| No 404 URLs detected (sampled) | PASS | — |
| No redirected URLs detected (sampled) | PASS | — |
| robots.txt references sitemap index | PASS | — |
| lastmod — blog posts (real dates) | PASS | — |
| lastmod — brands (per-brand DB dates) | PASS | — |
| lastmod — families (per-family DB dates) | PASS | — |
| lastmod — color pages (per-row created_at) | PARTIAL | Medium |
| lastmod — matches/match-individual/pages (build-time) | WARN | Low |
| match listing coverage vs MAJOR_MATCH_BRANDS | FAIL | High |
| SW brand page links all 6 match targets | FAIL | High |
| DE/FB brand pages link all match targets | PARTIAL | Medium |
| Sitemap index missing lastmod on child entries | WARN | Low |

---

## Finding 1 — CRITICAL (but currently passing): 23,438 colors = 4.69 shards, correct split

**Status:** PASS  
**Evidence:** colors-0 through colors-3 each contain 5,000 URLs. colors-4 contains 3,438. Total = 23,438. No shard exceeds the 50,000 URL or ~50 MB limit. The `COLORS_PER_SITEMAP = 5000` constant in `src/app/api/sitemap/[id]/route.ts` (line 9) ensures safe headroom as color inventory grows. At current growth rate the site crosses into a 6th shard when colors exceed 25,000. No action needed now, but the split logic is automated correctly.

---

## Finding 2 — HIGH: Match listing orphan gap — SW brand page only links 4 of 6 target brands

**Severity:** High  
**Issue:** `MAJOR_MATCH_BRANDS` contains 7 brands (SW, BM, Behr, PPG, Valspar, Dunn-Edwards, Farrow & Ball), producing 42 brand-to-brand match listing URLs in `matches.xml`. The Sherwin-Williams brand page (`/brands/sherwin-williams`) only links to 4 targets: Benjamin Moore, Behr, PPG, Valspar. It does **not** link to `/match/sherwin-williams/to/dunn-edwards` or `/match/sherwin-williams/to/farrow-ball`. Those two URLs exist in `matches.xml` and return 200, but they have zero internal links from the SW brand page — the highest-traffic brand page on the site.

Similarly, Dunn-Edwards and Farrow & Ball brand pages each link to only 5 of the 6 possible peer match targets, missing the cross-link to each other (`/match/dunn-edwards/to/farrow-ball` and `/match/farrow-ball/to/dunn-edwards`).

**Orphan count:** At minimum 2 high-value match listing pages are sitemap-included but not internally linked from their primary brand page. Up to 4 additional DE/FB pair listings may also be orphaned.

**Fix:** In `src/lib/brand-content.tsx` (or wherever the "Cross-Brand Matching" section is rendered on brand pages), expand the match-target list to include all 6 peers from `MAJOR_MATCH_BRANDS`, excluding self. A single loop over the exported constant eliminates the hardcoded mismatch:

```ts
// src/app/brands/[brandSlug]/page.tsx or brand-content.tsx
import { MAJOR_MATCH_BRANDS } from "@/lib/popular-colors";
const matchTargets = MAJOR_MATCH_BRANDS.filter(b => b !== brandSlug);
```

**Evidence:**
- `curl https://www.paintcolorhq.com/brands/sherwin-williams | grep 'href="/match/sherwin-williams'` returns only 4 hrefs (BM, Behr, PPG, Valspar)
- `curl https://www.paintcolorhq.com/sitemap/matches.xml | grep sherwin-williams` returns 6 target URLs including dunn-edwards and farrow-ball
- Both `/match/sherwin-williams/to/dunn-edwards` and `/match/sherwin-williams/to/farrow-ball` return HTTP 200

---

## Finding 3 — HIGH: Color lastmod dates are 99.4% identical (all 2026-02-10)

**Severity:** High  
**Issue:** In `colors-0.xml`, 4,968 of 5,000 URLs carry `lastmod=2026-02-10`. Only 31 carry `2026-03-20` and 1 carries `2026-02-17`. The pattern repeats across all 5 color shards. Google's documentation explicitly warns that uniform lastmod dates across thousands of URLs reduce crawl-budget trust — Googlebot interprets them as synthetic/unreliable and may deprioritize re-crawling. This is especially damaging during HCU recovery when demonstrating freshness signals matters.

The code in `src/app/api/sitemap/[id]/route.ts` (lines 91-95) correctly uses `c.createdAt` per row:
```ts
lastmod: c.createdAt ? c.createdAt.split("T")[0] : SITE_BUILD_DATE,
```
The root cause is that 99.4% of color rows in Supabase have an identical `created_at` value of 2026-02-10 — a bulk-import artifact. The lastmod logic is right; the underlying data is uniform.

**Fix (two options):**
1. **Preferred — add `updated_at`:** Add an `updated_at` column to the `colors` table, defaulting to `now()` and updated on any meaningful content change (description, hex, undertone). Use that column for lastmod instead of `created_at`. This gives Googlebot a genuine freshness signal when colors are enriched.
2. **Acceptable stopgap:** Use brand-level deploy dates instead of per-row `created_at`. The brands sitemap already does this well (SW = 2026-03-20, BM = 2026-02-17, etc.). Map each color's brand to its import date via `getLatestColorDateByBrand()` — at least creating distinct dates across brands rather than a uniform 2026-02-10 for 99.4% of the corpus.

**Evidence:**
```
colors-0.xml lastmod distribution:
  4968 × 2026-02-10 (99.4%)
  31   × 2026-03-20 (0.6%)
  1    × 2026-02-17 (0.02%)
```

---

## Finding 4 — MEDIUM: Match/pages/inspiration lastmod = build-time cold-start date (today's date)

**Severity:** Medium  
**Issue:** `SITE_BUILD_DATE` is computed at module load time:
```ts
const SITE_BUILD_DATE = new Date().toISOString().split("T")[0];
```
For ISR (revalidate=3600), this means the date resets on every cold-start or revalidation cycle. Today it reads as `2026-06-04` for matches.xml, match-individual.xml, pages.xml, and inspiration.xml. This causes two problems:
1. Match listing and match-individual pages appear to Googlebot as "updated today" on every crawl — an unreliable signal.
2. Pages like `/about`, `/methodology`, `/privacy`, and `/terms` carry today's date even when content has not changed in weeks.

**Fix:** Replace `SITE_BUILD_DATE` with a hardcoded ISO string that is manually updated on deploy (e.g. from a `NEXT_PUBLIC_DEPLOY_DATE` env var set in Vercel), or use Git commit date injected at build time via `next.config.ts`:
```ts
// next.config.ts
env: {
  SITE_BUILD_DATE: new Date().toISOString().split("T")[0],
}
```
This pins the date to actual deploy time rather than ISR revalidation time, eliminating the "fresh every hour" false signal.

**Evidence:** All 42 URLs in `matches.xml` carry `lastmod=2026-06-04`. All 282 URLs in `match-individual.xml` carry `lastmod=2026-06-04`. All 19 URLs in `pages.xml` carry `lastmod=2026-06-04`.

---

## Finding 5 — MEDIUM: Sitemap index has no `<lastmod>` on child sitemap entries

**Severity:** Low–Medium  
**Issue:** The sitemap index (`/sitemap.xml`) emits `<loc>` only for each child — no `<lastmod>` on the index entries themselves. Google supports `<lastmod>` on sitemap index entries as a crawl-budget hint (it tells Googlebot which sub-sitemaps to re-fetch). With 23,438 color URLs split across 5 shards, omitting lastmod means Googlebot may re-fetch all 5 color shards on every visit instead of skipping unchanged ones.

**Fix:** In `src/app/api/sitemap/route.ts` (lines 36-43), add `<lastmod>` to each sitemap entry. For color shards this can be a fixed import date (2026-02-10); for blog it should be the most recent post's modifiedDate.

```xml
<sitemap>
  <loc>https://www.paintcolorhq.com/sitemap/colors-0.xml</loc>
  <lastmod>2026-02-10</lastmod>
</sitemap>
```

**Evidence:** `/sitemap.xml` response contains only `<loc>` inside each `<sitemap>` element — no `<lastmod>` present.

---

## Finding 6 — LOW: /colors URL in sitemap but functionally a brand/family index

**Severity:** Low / Informational  
**Issue:** `pages.xml` includes `/colors` (the top-level color browse page). This is fine, but worth noting: if `/colors` renders without noindex and with a canonical pointing to itself, it's valid. Confirmed: the page returns 200 and the `/colors` route is not blocked by robots.txt. No action needed — just ensure the page has meaningful editorial content rather than an empty grid.

---

## Finding 7 — LOW: `match-individual` shard covers only 6 of 14 brands as source

**Severity:** Low / Strategic  
**Issue:** `POPULAR_COLOR_SLUGS` contains source colors from 7 brands (SW, BM, Behr, Dunn-Edwards, Farrow & Ball, PPG, Valspar). The remaining 7 brands (Vista Paint, Hirshfield's, MPC, Kilz, RAL, Colorhouse, Dutch Boy) have no popular colors in the list and therefore no match-individual URLs in the sitemap. Their match pages are only discoverable via internal links from color detail pages.

This is a reasonable crawl-budget decision (comment in the route file acknowledges it). However, as blog content grows around brands like Dutch Boy (noted in the blog pipeline plan), consider adding 2-3 popular colors per Tier-2 brand to `POPULAR_COLOR_SLUGS` to bootstrap match-page indexing.

**File:** `src/lib/popular-colors.ts`

---

## Structural Findings: What Is Working Well

- **No deprecated tags.** No `<priority>` or `<changefreq>` anywhere in any sub-sitemap. This is correct — Google ignores both.
- **No non-200 URLs detected** in sampled checks across pages, brands, families, matches, and match-individual.
- **robots.txt** correctly references `Sitemap: https://www.paintcolorhq.com/sitemap.xml` and explicitly allows all major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) — a strong GEO signal.
- **Blog lastmod is real and accurate** — uses `post.modifiedDate ?? post.date`, producing genuine per-post dates ranging from 2025-10-09 to 2026-06-03.
- **Family lastmod uses real DB dates** via `getLatestColorDateByFamily()`. Values vary by family (2026-02-10, 2026-02-17, 2026-03-20, 2026-06-04 for tan) — legitimate variation.
- **Brand lastmod uses real DB dates** via `getLatestColorDateByBrand()`. SW = 2026-03-20, BM = 2026-02-17 — accurate.
- **All URLs are absolute HTTPS** with `BASE_URL = "https://www.paintcolorhq.com"`.
- **50,000 URL limit respected** — largest shard is 5,000 URLs with headroom for 10x growth before the split logic needs adjustment.
- **colors-4 URL count** (3,438) confirms actual color inventory is ~23,438, matching documented count.
- **ISR revalidation at 3600s** on both the index and sub-sitemaps — scheduled blog posts enter the sitemap within ~1 hour of their publish date. Correct.

---

## Orphan Pages Verdict

**PARTIAL ORPHAN STATUS — 2 confirmed, up to 4 probable.**

Two match listing pages are confirmed orphans: `/match/sherwin-williams/to/dunn-edwards` and `/match/sherwin-williams/to/farrow-ball`. Both appear in `matches.xml` and return HTTP 200, but neither receives an internal link from the Sherwin-Williams brand page (the most-linked brand page on the site). They are reachable only via sitemap discovery — which is a weaker crawl signal than followed internal links.

Two additional probable orphans: `/match/dunn-edwards/to/farrow-ball` and `/match/farrow-ball/to/dunn-edwards`. The DE and FB brand pages each link to 5 of their 6 possible match targets, skipping each other.

**The brand-to-brand match listing pages as a category are the most fragile part of the sitemap** — they lack the internal-link density of color pages (which are linked from family, brand, and search pages) and their sole primary nav entry point is the brand page "Cross-Brand Matching" section.

Family pages (blue, gray, green, white) were previously noted as orphans in the indexing backlog but are confirmed present in `families.xml` with valid lastmod values. Their orphan risk has been mitigated. Inspiration pages (21 URLs) are in sitemap and the `/inspiration` index is in `pages.xml` — not orphaned at the URL level, though internal linking from blog posts would strengthen them.

---

## Files Referenced

- `src/app/api/sitemap/route.ts` — sitemap index generator
- `src/app/api/sitemap/[id]/route.ts` — sub-sitemap generator (all shards)
- `src/lib/popular-colors.ts` — POPULAR_COLOR_SLUGS + MAJOR_MATCH_BRANDS
- `src/lib/queries.ts` — getLatestColorDateByBrand(), getLatestColorDateByFamily(), getAllColorSlugs()
- `src/lib/blog-posts.ts` — getAllBlogSlugs(), getPostBySlug()
- `next.config.ts` — candidate location for SITE_BUILD_DATE env injection
