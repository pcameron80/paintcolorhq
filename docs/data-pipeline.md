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
Step 5: check-retailer-links     Probe brand URLs for each color -> retailer-links-{brand}.json
Step 6: generate-retailer-overrides  Convert JSON results -> src/lib/retailer-overrides.ts
```

### Step 5: Check Retailer Links

**Script:** `scripts/check-retailer-links.ts`

**Usage:** `npx tsx scripts/check-retailer-links.ts <brand-slug> <delay-ms>`

Fetches all colors for a brand from Supabase (with pagination for >1000 rows), builds the expected URL using our family guess mapping, then sends a HEAD request. If the guess fails (non-200), it probes all other family categories for that brand's website.

**Output:** `scripts/retailer-links-{brand}.json` containing:
- `overrides[]` — Colors where a different family was found (`slug`, `colorNumber`, `ourFamily`, `correctFamily`)
- `notFound[]` — Colors not found under any family on the brand's website
- `checked` / `passed` — Summary counts

**Supported brands:** `valspar`, `ppg`, `sherwin-williams`

**Brand website family categories:**
- **Valspar** (13): pink, red, orange, yellow, green, teal, blue, white, gray, black, brown, neutral, purple
- **PPG** (15): reds, oranges, yellows, greens, blues, purples, pinks, browns, neutrals, whites, blacks, grays, beiges, aquas, metallics
- **Sherwin-Williams** (8): red, orange, yellow, green, blue, purple, neutral, white-and-pastel

### Step 6: Generate Retailer Overrides

**Script:** `scripts/generate-retailer-overrides.ts`

**Usage:** `npx tsx scripts/generate-retailer-overrides.ts`

Reads all `retailer-links-{brand}.json` files and generates `src/lib/retailer-overrides.ts` with:
- `{BRAND}_OVERRIDES: Record<string, string>` — Maps color number to correct website family
- `{BRAND}_NOT_FOUND: Set<string>` — Color numbers not found on the website (direct link is skipped)

These are imported by `src/lib/retailer-links.ts` and checked before falling back to the default family guess.

## Published LRVs and names

Most LRVs in `colors` were computed from hex at import (migration 004). Four brands publish LRV in the feeds the palette drift scan pulls: Benjamin Moore, Behr, Sherwin-Williams and Dutch Boy. The scan output is the source for both scripts below. Run them after `scan-brand-palettes` and after `apply-hex-corrections.ts`, names first:

```bash
# 1. Names mangled at import: "Strand of Pearlsreg", "Jalapeo Pepper", CC/CSP names cut to one word
npx tsx scripts/apply-published-names.ts --scan-dir=data/brand-scans/<date>            # dry run
npx tsx scripts/apply-published-names.ts --scan-dir=data/brand-scans/<date> --apply

# 2. LRV, so rows whose names were just fixed pass the name guard
npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/<date> --brand=benjamin-moore,behr
npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/<date> --brand=benjamin-moore,behr --apply
```

Both write a JSON backup to `scripts/data/backups/` before any write and take `--revert=<backup>`. Writes are conditional on the value read, so a concurrent edit is skipped, not overwritten.

- **LRV:** matches on `color_number`, then `alternate_numbers`. It skips rows listed in `<brand>-hex-changed.json` (owned by `apply-hex-corrections.ts`), rows whose name does not match the feed, feed LRVs of 0, and Benjamin Moore `PM-` codes. The BM API gives premixed `PM-` codes their own LRV, which disagrees with BM's color pages (PM-1 Super White: feed 89.1, page 87.36). LRV does not feed Delta E, so matches need no recompute. Sherwin-Williams and Dutch Boy were left at their computed values on 2026-10-11: they differ from the feed by less than 1 point on all but 13 rows, and Dutch Boy publishes whole numbers.
- **Names:** fixes only names that lost characters at import. Manufacturer renames (BM's "Gypsy Love" is now "Fascinator Rose") need `--renames`. When you apply renames, add each true former name to `src/lib/former-names.ts`; the color page then shows "Previously listed as ..." and adds it to the meta description, so the old name still finds the page. `SKIP_RENAME` in the script holds feed misspellings that must never be written. A code whose swatch disagrees with ours (CIEDE2000 > 5) is never written. Slugs are never changed.
- **Blog copy prints LRVs.** After an LRV change, grep `src/lib/blog-posts.tsx` for the colors that moved and recompute any gap, range or ordering claim built on them.

`scrape-bm-lrv.ts` and `scrape-behr-lrv.ts` are superseded. They only overwrote differences of 2 or more, which left about 1,250 BM rows 1 to 2 points off (Hale Navy HC-154 held 7.1; BM publishes 8.36). They also depend on the NAS crawl4ai server, which now requires `CRAWL4AI_TOKEN`.
