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
