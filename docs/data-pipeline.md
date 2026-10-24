# Data Pipeline

## Overview

The data pipeline transforms raw paint color data from the ColorNerd open-source dataset into a structured Supabase database with pre-computed cross-brand matches. It runs as a series of local TypeScript scripts.

## Pipeline Steps

```
Step 1: import-colors     Parse ColorNerd JSON -> colors-processed.json
Step 2: seed-db           Upload colors to Supabase
Step 3: compute-matches   Calculate Delta E matches -> cross-brand-matches.json
Step 4: seed-matches      Upload matches to Supabase
```

### Step 1: Import Colors (`npm run import-colors`)

**Script:** `scripts/import-colors.ts`

Reads the ColorNerd dataset from `data/colornerd/` and processes it into a normalized format.

**What it does:**
- Reads JSON files from each brand directory in the ColorNerd repo
- Normalizes brand names (e.g. maps "SherwinWilliams" to "Sherwin-Williams")
- Parses hex values (handles `#RRGGBB` and `rgb(R, G, B)` formats)
- Trims leading spaces in hex values (Farrow & Ball data quirk)
- Generates URL-safe slugs with color numbers (e.g. `agreeable-gray-7029`)
- Classifies color families using HSL-based algorithm
- Calculates LRV (Light Reflectance Value) from RGB
- Converts RGB to CIELAB color space for Delta E matching
- Deduplicates slugs within brands

**Output:** `data/colors-processed.json` (22,807 colors)

**Skipped brands:** Avery, DIC, HKS, IKEA, Kobra, Neenah, Toyo, Trumatch (non-paint brands)

### Step 2: Seed Database (`npm run seed-db`)

**Script:** `scripts/seed-database.ts`

Uploads processed colors to Supabase. Requires `.env.local` with Supabase credentials.

**What it does:**
- Reads `data/colors-processed.json`
- Upserts brands (creates if new, updates if existing)
- Inserts colors in batches of 500
- Updates `color_count` on each brand after insertion

### Step 3: Compute Matches (`npm run compute-matches`)

**Script:** `scripts/compute-matches.ts`

Calculates the closest color matches between all brands using CIEDE2000.

**What it does:**
- Reads `data/colors-processed.json`
- Groups colors by brand
- For each color, finds the top 5 closest matches from every other brand
- Uses sorted insertion with binary search for efficiency
- Pre-extracts Lab values into Float64Arrays for cache performance
- Processes one source brand at a time to bound memory
- Logs progress every 1000 colors with rate and ETA

**Output:** `data/cross-brand-matches.json` (222MB, 1,482,455 match records)

**Performance:** ~120 seconds for 22,807 colors across 14 brands.

### Step 4: Seed Matches (`npm run seed-matches`)

**Script:** `scripts/seed-matches.ts`

Uploads computed matches to Supabase. Requires `.env.local` with Supabase credentials.

**What it does:**
- Reads `data/cross-brand-matches.json`
- Fetches all brands and colors from Supabase (paginated for >1000 rows)
- Builds a lookup map: `brand_slug/color_slug` -> UUID
- Resolves all match references to UUIDs
- Clears existing `cross_brand_matches` table
- Inserts resolved matches in batches of 500

## Data Source

**ColorNerd:** https://github.com/jpederson/colornerd

An open-source dataset of paint color swatches in JSON/CSV format. Cloned to `data/colornerd/`.

## Color Counts by Brand

| Brand | Colors |
|-------|--------|
| Behr | 4,535 |
| Benjamin Moore | 3,919 |
| Vista Paint | 2,785 |
| PPG | 2,088 |
| Valspar | 1,766 |
| Dunn-Edwards | 1,696 |
| Sherwin-Williams | 1,527 |
| Hirshfield's | 1,469 |
| MPC | 1,419 |
| Kilz | 868 |
| RAL | 213 |
| Farrow & Ball | 132 |
| Colorhouse | 128 |
| Dutch Boy | 101 |
| **Total** | **22,807** |

## Color Family Distribution

| Family | Count | Family | Count |
|--------|-------|--------|-------|
| Orange | 4,241 | Pink | 933 |
| Gray | 3,808 | Beige | 608 |
| Blue | 3,173 | Off-White | 509 |
| Red | 2,349 | Purple | 262 |
| Green | 2,082 | White | 115 |
| Yellow | 2,007 | Black | 12 |
| Brown | 1,541 | | |
| Neutral | 1,167 | | |

## Re-Running the Pipeline

To refresh data (e.g. after adding new color sources):

```bash
# 1. Process colors from source data
npm run import-colors

# 2. Seed colors to Supabase
npm run seed-db

# 3. Compute all cross-brand matches (takes ~2 minutes)
npm run compute-matches

# 4. Seed matches to Supabase (takes ~5 minutes for 1.5M records)
npm run seed-matches
```

All scripts use `dotenv` to load `.env.local` for Supabase credentials.

## Retailer Link Verification

After the main pipeline, retailer links can be verified against brand websites. This is a separate process because it depends on external website availability and doesn't affect the core color data.

```
Step 4b: generate-official-color-urls  Brand sitemaps -> src/lib/official-urls/{brand}.json (quarterly)
Step 5: check-retailer-links     Probe brand URLs for each color -> retailer-links-{brand}.json
Step 6: generate-retailer-overrides  Convert JSON results -> src/lib/retailer-overrides.ts
```

### Step 4b: Official color URLs from brand sitemaps

**Script:** `scripts/generate-official-color-urls.ts [ppg|valspar|dutch-boy|vista-paint ...] [--dry-run]`

Reads our catalog from the public `/api/brand/<slug>/colors` endpoint and each brand's sitemap, and writes a `color_number -> path` map per brand. Codes join Valspar, Dutch Boy and Vista pages; a page is linked only when its URL name matches ours too (Vista's stock base `49-vista-white` shares its code with `49-auburn-wave`). PPG pages are keyed by name on pittsburghpaints.com, so repeated names are resolved by reading the code from each candidate page's `<title>`, one request per second. Each run refuses to write a map that covers under half the brand's colors. Run quarterly, then `check-retailer-links.ts --sample`.

### Step 5: Check Retailer Links

**Script:** `scripts/check-retailer-links.ts`

**Usage:** `npx tsx scripts/check-retailer-links.ts <brand-slug> <delay-ms>`

Fetches all colors for a brand from Supabase (with pagination for >1000 rows), builds the expected URL using our family guess mapping, then sends a HEAD request. If the guess fails (non-200), it probes all other family categories for that brand's website.

A URL passes only when it ends on a 2xx **and** on the host it was sent to (ignoring `www.`). A redirect to another site fails even when it ends in a 200, and the summary lists the hosts. Before this check, `colorhousepaint.store` 301'd every color to a gambling site and still passed 128/128 (found 2026-10-23).

Modes that need no database credentials, print only, and exit 1 on any failure:

- `--sample [per-brand=20] [delay-ms=1000] [site]`: up to N links per brand, built by `getRetailerLinks` from colors the site's public `/api/brand/<slug>/colors` returns.
- `--org [delay-ms=1000]`: every brand-page "Visit" link in `src/lib/brand-org-data.ts`.
- `--url <url> [url...]`: one-off checks.

Behr, Kilz, Benjamin Moore and the big-box search pages answer scripts with 403 or 503 while working in a browser, so those failures need a manual look.

**Output:** `scripts/retailer-links-{brand}.json` containing:
- `overrides[]` — Colors where a different family was found (`slug`, `colorNumber`, `ourFamily`, `correctFamily`)
- `notFound[]` — Colors not found under any family on the brand's website
- `checked` / `passed` — Summary counts

**Supported brands:** `sherwin-williams`, `dunn-edwards`, `kilz`, `ral`. Colorhouse was removed on 2026-10-24 because its store domain was hijacked; Colorhouse color pages have no brand link. PPG, Valspar, Dutch Boy and Vista moved to the sitemap maps (Step 4b) the same day.

**Brand website family categories:**
- **Sherwin-Williams** (8, from its sitemap): red, orange, yellow, green, blue, purple, neutral, white. SW serves a color under any of them; `white-and-pastel` now 404s.

### Step 6: Generate Retailer Overrides

**Script:** `scripts/generate-retailer-overrides.ts`

**Usage:** `npx tsx scripts/generate-retailer-overrides.ts`

Reads all `retailer-links-{brand}.json` files and generates `src/lib/retailer-overrides.ts` with:
- `{BRAND}_OVERRIDES: Record<string, string>` — Maps color number to correct website family
- `{BRAND}_NOT_FOUND: Set<string>` — Color numbers not found on the website (direct link is skipped)

These are imported by `src/lib/retailer-links.ts` and checked before falling back to the default family guess.

## Palette drift scan (new and changed colors)

Brands add colors every year, mostly between late July and mid October around
their Color of the Year launches. `npm run scan-palettes` pulls each brand's
live palette from the manufacturer and diffs it against the `colors` table.
It is read-only on both sides. Run it quarterly and once after the fall launch
season.

```bash
npm run scan-palettes                          # all brands (~25 min; Vista and Dunn-Edwards crawl page by page)
npm run scan-palettes -- --brand=behr,ppg      # subset; merges into the same day's report
```

Output lands in `data/brand-scans/<YYYY-MM-DD>/` (gitignored, resolved from the
working directory; `--out-dir=<dir>` overrides it): `REPORT.md`, `summary.json`,
and per brand `-live`, `-missing`, `-not-live`, `-hex-changed` and
`-duplicate-codes` JSON files. `--reuse-live=<dir>` re-diffs a saved
`<brand>-live.json` against the DB without crawling the brand site again
(Dunn-Edwards and Vista take minutes each).

- **Missing**: in the live palette, no DB row by code or alternate number. A
  `dbCodeForName` field means the same name exists under another code, which
  usually means a renumber or dual number, not a new color.
- **Not live**: active DB rows the brand no longer lists. Candidates for
  `is_archived`, never deletion; the URLs keep ranking.
- **Hex changed**: same code, swatch differs by CIEDE2000 2 or more. One entry
  per DB row: when two rows hold one code, each is compared on its own.
- **Duplicate codes**: codes held by two or more DB rows (Behr keeps "PR-W05"
  and "PR-W5" as two rows of one color), each row with its CIEDE2000 against the
  live swatch. Until 2026-10-24 the diff kept one row per code, so a wrong
  swatch on the second row was never reported; the first scan with the fix
  found 70 such Behr rows.

Codes are compared after each brand's `normalizeCode` in
`palette-sources.ts`: Sherwin-Williams drops "SW" and leading zeros, Farrow &
Ball drops "No.", PPG drops a "PPG" or "COL" prefix, and Behr drops the leading
zeros of every number after a letter ("PR-W05" and "PR-W5" are one code, so
Behr's not-live count fell from 572 to 306). PPG is read from
pittsburghpaints.com: ppgpaints.com/sitemap.xml became an HTML redirect page in
October 2026, which would have reported 0 colors.

Fetchers live in `scripts/lib/palette-sources.ts`, one per brand, and the
diff rules (with tests, `npm run test:palette-diff`) in
`scripts/lib/palette-diff.ts`. A fetcher that returns far fewer colors than
expected throws, so a broken source reports as failed rather than "0 missing".
Kilz needs `CRAWL4AI_TOKEN` in `.env.local` because Cloudflare blocks plain
fetch. Colorhouse (site gone) and RAL (fixed standard) are not scanned.

To import reviewed gaps:

```bash
tsx scripts/import-brand-scan.ts --brand=<slug> --scan-dir=data/brand-scans/<date>          # dry run
tsx scripts/import-brand-scan.ts --brand=<slug> --scan-dir=data/brand-scans/<date> --apply
npm run export-db-colors && npm run compute-matches && npm run seed-matches
```

## Published LRVs and names

Most LRVs in `colors` were computed from hex at import (migration 004). Eight brands publish LRV where the palette drift scan already reads: Benjamin Moore, Behr, Sherwin-Williams and Dutch Boy in their feeds; Dunn-Edwards ("Light Reflectance Value: LRV 84"), Vista Paint ("LRV: 74") and PPG (the "LRV:" label beside R/G/B) on each color page; Hirshfield's in the `LRV` field of its color-picker JSON. Colorhouse, RAL, Farrow & Ball, Valspar and Kilz carry no LRV in the scan. The scan output is the source for both scripts below. Run them after `scan-brand-palettes` and after `apply-hex-corrections.ts`, names first:

```bash
# 1. Names mangled at import: "Strand of Pearlsreg", "Jalapeo Pepper", CC/CSP names cut to one word
npx tsx scripts/apply-published-names.ts --scan-dir=data/brand-scans/<date>            # dry run
npx tsx scripts/apply-published-names.ts --scan-dir=data/brand-scans/<date> --apply

# 2. LRV, so rows whose names were just fixed pass the name guard
npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/<date> --brand=benjamin-moore,behr
npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/<date> --brand=benjamin-moore,behr --apply
```

Both write a JSON backup to `scripts/data/backups/` before any write and take `--revert=<backup>`. Writes are conditional on the value read, so a concurrent edit is skipped, not overwritten.

- **LRV:** matches on `color_number`, then `alternate_numbers`, both through the brand's `normalizeCode`, and updates every row that holds the code. A change under `--min-diff` (default 0.05) is skipped; one over `--max-delta` (default 10 points) is printed as an outlier for review and never written (PPG lists Botany Beige 15-27 at 87 and White Chip 15-06 at 71, which look swapped). The dry run prints a tally per code prefix (Dunn-Edwards DE, DEA, DET, DEW...), so a prefix whose values all move together stands out. It skips rows listed in `<brand>-hex-changed.json` (owned by `apply-hex-corrections.ts`), rows whose name does not match the feed, feed LRVs of 0, Benjamin Moore `PM-` codes, and Vista `R` codes (those pages print CIELAB L* under the LRV label: R132 Tannic Tea shows 32.7 for a color whose LRV is about 7). The BM API gives premixed `PM-` codes their own LRV, which disagrees with BM's color pages (PM-1 Super White: feed 89.1, page 87.36). LRV does not feed Delta E, so matches need no recompute. Sherwin-Williams and Dutch Boy were left at their computed values on 2026-10-11: they differ from the feed by less than 1 point on all but 13 rows, and Dutch Boy publishes whole numbers.
- **Names:** fixes only names that lost characters at import. Manufacturer renames (BM's "Gypsy Love" is now "Fascinator Rose") need `--renames`. When you apply renames, add each true former name to `src/lib/former-names.ts`; the color page then shows "Previously listed as ..." and adds it to the meta description, so the old name still finds the page. `SKIP_RENAME` in the script holds feed misspellings that must never be written, and `FEED_NAME_STYLE` restyles feed names that would read wrong in the catalog ("BEACH VIBES"). A code whose swatch disagrees with ours (CIEDE2000 > 5) is never written. Slugs are never changed. `--case` also writes capitalization fixes, but only two import artifacts: a word-final capital after an apostrophe ("Lion'S Roar") and an initialism title-cased at import ("Nypd"). Feeds title-case every word ("A Touch Of Gold"), so their casing is never copied whole, and `KEEP_STYLED` protects names styled on purpose (O'Reilly Green, O'Brien Orange, Cote D'Azur, Je M'Apelle Missy). `MANUAL` holds hand fixes for rows the feed cannot reach (Kilz needs crawl4ai) and runs for any brand passed in `--brand`. PPG codes match through `normalizePpgCode`; before 2026-10-24 none of its 37 renames matched.

### Quarterly runbook

Run in this order, each step as a dry run first; the `--apply` steps write to production and are run by Philip:

1. `npm run scan-palettes` (about 25 minutes). Read `REPORT.md`: a brand marked failed has a broken fetcher, not zero changes.
2. Review `<brand>-hex-changed.json` and `<brand>-duplicate-codes.json`, then `apply-hex-corrections.ts`.
3. `apply-published-names.ts` (add `--renames` and `--case` after reading the lists), then `apply-published-lrv.ts`.
4. `import-brand-scan.ts` for reviewed gaps, then `npm run export-db-colors && npm run compute-matches && npm run seed-matches`.
5. `npx tsx scripts/generate-official-color-urls.ts --dry-run`, then without `--dry-run`, and review the diff in `src/lib/official-urls/` (Step 4b above).
6. `npx tsx scripts/check-retailer-links.ts --sample`, then `npx tsx scripts/generate-retailer-overrides.ts` if overrides changed (Steps 5 and 6).
7. `npm run audit-colors` before anything that quotes color data ships.
- **Blog copy prints LRVs.** After an LRV change, run `npm run audit-colors` (below). It catches a printed LRV that no longer matches; gap, range and ordering claims built on the moved colors still need a read.

`scrape-bm-lrv.ts` and `scrape-behr-lrv.ts` are superseded. They only overwrote differences of 2 or more, which left about 1,250 BM rows 1 to 2 points off (Hale Navy HC-154 held 7.1; BM publishes 8.36). They also depend on the NAS crawl4ai server, which now requires `CRAWL4AI_TOKEN`.

## Content color-fact audit

Content files quote color data by hand: Swatch hexes, printed LRVs, "hex #..." in editorial, and match claims such as "Behr X is nearly identical". A swatch correction or an LRV update changes the DB underneath them without touching the copy. On 2026-10-11 the drift correction left about 70 such claims stale across the blog and editorial (PRs #200 and #202). Run the audit after any of `apply-hex-corrections.ts`, `apply-published-lrv.ts`, `compute-matches`, and before publishing a post:

```bash
npm run audit-colors
npm run audit-colors -- --changed=scripts/data/backups/hex-corrections-<ts>.json   # also list every mention of a corrected color
npm run audit-colors -- --files=docs/superpowers/content/drafts/<post>.tsx          # a draft
```

It reads every color from Supabase and checks the content files (`src/lib/blog-posts.tsx`, `color-editorial.tsx`, `brand-content.tsx`, `family-content.tsx`, `family-undertone-copy.ts`, `palettes.ts`, `src/app/not-found.tsx`):

- **error:** a `<Swatch hex>` that differs from the DB hex for its `href`; a `/colors/<brand>/<slug>` link not in the DB; the editorial opener "X is hex #..." disagreeing with its keyed color.
- **warn:** a printed LRV next to a Swatch or in the editorial opener that disagrees beyond display rounding; a match whose closeness label is wrong for CIEDE2000 on current hexes (labels from `src/lib/closeness.ts`); a match called "closest" or a "twin" when the brand has a color more than 1 ΔE nearer; banned closeness wording; links to archived colors.
- **info** (with `--changed`): every mention of a corrected color, because descriptive words ("pink-beige", "soft blue-gray") can't be checked by number and need a read.

It exits 1 on any error, so it can gate a deploy; `--strict` also fails on warnings. Matching runs on the copy's own words: a brand name followed by the full color name ("Behr Shy Green", "its SW match Simple Stone"), `/colors/` links, Swatches, and table cells under a "Closest <brand>" header. A color mentioned without its brand is not checked. Logic and tests: `scripts/blog/audit-color-facts-lib.ts`.

## Traffic measurement (Plausible and Bing)

These read analytics, not the color data, but they gate the numbers that go into planning:

- `scripts/analytics/` holds read-only ClickHouse queries against the self-hosted Plausible database on the NAS, run with `scripts/analytics/run-clickhouse.sh <file.sql> <start> <end>`. Run `heavy-hitters.sql` before recording any traffic baseline, then `plausible-engagement.sql` for raw, bot-filtered and sensitivity figures by landing type. The filter definition and a reference run are in `scripts/analytics/README.md`.
- `npm run bing-stats -- <command>` reads the Bing Webmaster API: `pages` / `queries` in whole weekly buckets (`--weeks`, `--from`, `--to`; top 100 pages a week only), `brands-did` for the SW/BM brand-title test against control brand pages, and `crawl`, `issues`, `feeds`, `url-info` and `links` for Bing's index view. Usage is in the header of `scripts/seo/bing-stats.ts`.
