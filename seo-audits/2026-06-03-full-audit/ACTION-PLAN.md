# PaintColorHQ — SEO Action Plan
**Date:** 2026-06-03 · Derived from the 11-specialist v2.0.0 audit + orchestrator verification.

## The one thing to internalize
Google has **de-crawled ~23,000 color pages (0% indexed)** and the **HCU demotion is worsening** (impressions −58%). It is **not a technical block** (verified). It is **thin/near-duplicate programmatic content** at scale. Bing is carrying the site. Almost every fix below ladders up to: *make the color-page system genuinely unique + extractable + citable, stop new thin pages entering the index, and keep feeding the blog (the only layer Google still crawls).*

Effort key: 🟢 ≤30 min · 🟡 1–4 hr · 🟠 1–3 days · 🔴 multi-day/data work.

---

## CRITICAL — HCU recovery (do first; this is the whole game)

| # | Action | Effort | File(s) |
|---|---|---|---|
| C1 | **Diversify color-page descriptions.** Add a guaranteed-unique sentence slot (brand + number + catalog position); split achromatic LRV branches 3→6 so grays/whites/beiges stop sharing identical body paragraphs. | 🟠 | `src/lib/color-description.ts` |
| C2 | **`noindex` `/compare?` parametric pages.** Dynamic `generateMetadata` → `robots:{index:false,follow:true}` when params present (mirror `/search`). | 🟢 | `src/app/compare/page.tsx` |
| C3 | **Expand FAQ answers to 60–80 words** on color + match templates (Delta E + LRV + purchase note). One template edit propagates to 23K + match pages → unlocks AI citation on the two highest-value page types. | 🟡 | color `page.tsx` ~234–243; match template |
| C4 | **GSC sanity check.** Run a live URL test on a color page to be 100% certain no per-route surprise (protocol evidence says none). Then request indexing on 3–5 of the strongest, newly-diversified color pages as canaries. | 🟢 | GSC |

## HIGH — fix within ~1 week

| # | Action | Effort | File(s) |
|---|---|---|---|
| H1 | **`<div>`→`<article>`** on family/brand/match/homepage editorial — lifts extractor/AI-visible content from ~76 → 400+ words on 29+ pages. Add a 100–150-word inline methodology block to match pages. | 🟡 | `family-content.tsx`, `brand-content.tsx`, match template |
| H2 | **Author E-E-A-T.** BlogPosting author `url` `/authors/paint-color-hq-staff` → `/about`; add LinkedIn `sameAs` to author Person **and** Organization (confirmed NOT live despite PR #69). | 🟢 | `src/app/blog/[slug]/page.tsx`, homepage Organization |
| H3 | **Fix orphan match listings.** Replace the brand page's hardcoded 4-target list with `MAJOR_MATCH_BRANDS.filter(b => b !== brandSlug)` — fixes orphans for all 7 brands at once. | 🟢 | brand page template |
| H4 | **Match-listing search input.** Add a color-search autocomplete as the first above-the-fold element, routing to existing individual match URLs (kills the dead-end). | 🟡 | match-listing template |
| H5 | **Brand-page browse UX.** Add search + family-filter pills + total-count signal above the color grid. | 🟠 | brand page template |
| H6 | **Match-listing `CollectionPage + ItemList` schema** (currently only BreadcrumbList). Block ready in `seo-schema.md`. | 🟢 | match-listing template |
| H7 | **Color-page review depth.** Expand the editorial verdict to 5–7 sentences (undertone under LED/incandescent/north light, one pairing, one "avoid if") + one CSS-overlay room image. Matches the review-style SERP that drives 75% of demand. | 🟠 | color `page.tsx`, `color-description.ts` |

## MEDIUM — within ~1 month

| # | Action | Effort | File(s) |
|---|---|---|---|
| M1 | **Cookie banner** ≤64px on mobile — stops it covering CTAs + GEO editorial sitewide. | 🟢 | cookie banner component |
| M2 | **Family page ~200px mobile blank gap** — reduce editorial container top margin at mobile breakpoints (all 15 pages). | 🟢 | family template / CSS |
| M3 | **Color-page loading-skeleton CLS** — match `loading.tsx` reserved height to real hero min-height (preventive before AdSense). | 🟢 | `colors/[brandSlug]/[colorSlug]/loading.tsx` |
| M4 | **Product `image`** — wire the existing `/api/og` URL into the Product schema block (23K pages). | 🟢 | color `page.tsx` |
| M5 | **Brand-page FAQPage schema** ("best [brand] colors" / "[brand] vs [brand]"). | 🟡 | brand template |
| M6 | **Sitemap freshness:** add per-color `updated_at` (or stopgap per-brand import date) so lastmod isn't uniform; inject `SITE_BUILD_DATE` as a build-time env var so it doesn't reset on ISR; add `<lastmod>` to index children. | 🟡 | `api/sitemap/route.ts`, Supabase, `next.config.ts` |
| M7 | **Reciprocal blog↔family links** (/blue↔best-blue, /white↔best-white-guide); reorder Behr brand "Insights" to lead with the general round-up. | 🟡 | `family-content.tsx`, `brand-content.tsx` |
| M8 | **llms.txt contradiction** — Agreeable Gray "Warm balanced neutral" → match schema "Neutral". | 🟢 | `public/llms.txt` |
| M9 | **Homepage converter entry point** — compact secondary "find the cross-brand equivalent of any color" search below the discover hero (serves the converter-query segment without dismantling discover-first). | 🟡 | `src/app/page.tsx` |
| M10 | **Perf hygiene** — dynamic-import room-visualizer client component; browserslist target (drops 14 KiB ES5 polyfills); defer non-critical CSS; preconnect GTM/GA/AdSense. | 🟡 | `tools/room-visualizer/page.tsx`, `next.config.ts`, `layout.tsx` |

## LOW — backlog

| # | Action | Effort |
|---|---|---|
| L1 | Write **Sherwin-Williams** + **Benjamin Moore** general round-up posts (the two biggest brands, no round-up yet — highest-volume unwritten posts). | 🟠 |
| L2 | Remove redundant `X-Frame-Options` (CSP `frame-ancestors` supersedes). | 🟢 |
| L3 | Color Identifier title/intro: lead with "14 brands / any brand" differentiator. | 🟢 |
| L4 | Optional disavow of 5 shortener-farm referring domains (low priority; not a penalty risk). | 🟢 |
| L5 | Link acquisition (solo): Reddit/DIY answers w/ specific match URLs; "[brand] vs [brand]" blogger outreach; resource-page submissions. | 🟠 ongoing |
| L6 | Retrieve GA4 numeric property ID (unblocks organic analysis); add free Bing Webmaster API key (competitor backlink comparison). | 🟢 |

---

## Suggested first PR (highest impact / lowest risk — all 🟢, one branch)
C2 (`/compare?` noindex) · H2 (author URL + LinkedIn sameAs) · H3 (brand-page match loop) · M1 (cookie banner) · M8 (llms.txt fix). All small, independent, pre-deploy-gated by `seo-preflight`. Then tackle C1 + H1 (the content-system fixes that actually move HCU recovery) as a focused second effort.

## What's already shipped (don't redo)
- IndexNow blog submitter — PR #90 (today); key file live (200).
- Brand "Color Chart" titles/H1 — PR #88 (live).
- Discover-first homepage — PR #89 (live, passes mobile).
