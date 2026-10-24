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

**Output:** `data/colors-processed.json` (22,807 colors at the original ColorNerd import)

**Do not re-run this against the live database.** The DB has drifted far past the ColorNerd files (brand API imports, LRV scrapes, dedupe, retirements). `import-colors` plus `seed-db` re-adds MPC, which was retired, and loses every correction made in the DB since. Use `export-db-colors` instead (see Re-Running the Pipeline).

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

**Output:** `data/cross-brand-matches.json` (1,603,200 match records as of 2026-10-24: 26,720 colors x 12 other brands x 5)

**Performance:** about 2 to 3 minutes for 26,720 colors across 13 brands.

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

As of 2026-10-24 (live `brands.color_count`, 13 brands):

| Brand | Colors |
|-------|--------|
| Behr | 5,789 |
| Benjamin Moore | 3,903 |
| PPG | 3,261 |
| Vista Paint | 2,984 |
| Valspar | 2,358 |
| Dunn-Edwards | 2,230 |
| Sherwin-Williams | 1,950 |
| Hirshfield's | 1,469 |
| Dutch Boy | 1,441 |
| Kilz | 827 |
| RAL | 213 |
| Farrow & Ball | 167 |
| Colorhouse | 128 |
| **Total** | **26,720** |

## Color Family Distribution

From the original 22,807-color import; not updated since.

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

To recompute matches after color data changes in the DB (hex, Lab, new or retired colors):

```bash
# 1. Export what is live in the DB (not import-colors, see Step 1)
npm run export-db-colors

# 2. Compute all cross-brand matches locally
npm run compute-matches

# 3. Philip: TRUNCATE cross_brand_matches in the Supabase SQL editor.
#    seed-matches' batched delete can hit a statement timeout on 1.6M rows,
#    and it aborts if the table is not empty afterwards.

# 4. Seed matches (about 5 minutes for 1.6M rows)
npm run seed-matches
```

Then:

5. **Do not deploy while seed-matches runs.** `build-match-data` fails the build when the table is mid-reseed (see below), so the previous deployment stays live, but a merge to main during the window is a wasted build.
6. Verify the table: `cross_brand_matches` must equal colors x (brands - 1) x 5, which is colors x 60 with 13 brands (26,720 x 60 = 1,603,200).
7. Redeploy. The prebuild regenerates `/match-data` (about 20 seconds on a cache miss, measured 2026-10-24).
8. Allow 24 h for `/match-data` to reach rendered pages: `getCrossBrandMatches` fetches the files with `revalidate: 86400`.
9. Run `npm run audit-colors`.

All scripts use `dotenv` to load `.env.local` for Supabase credentials.

## Match Data Build (`scripts/build-match-data.ts`)

Runs as the `prebuild` hook and writes `public/match-data/<colorId>.json` (top 50 matches by Delta E) for every color.

- **Cache key.** A content fingerprint (v3): color count, max `content_updated_at`, an md5 over every color's id, name, slug, hex, number, availability and brand, an md5 of the brands, the match count and an md5 of the script. Any in-place correction misses the cache and regenerates. The files and the key live in `.next/cache/match-data/` only. The key is never copied to `public/`.
- **Integrity gate.** Before generating: `cross_brand_matches` must equal colors x (brands - 1) x 5. After generating: one file per color, each with at least 50 matches, and every row read. On any failure the build exits 1 before writing the cache key.
- **Paging.** Matches are fetched 16 source colors per request (`.in()`, ordered by source, Delta E, rank and match id), 8 requests at a time. Delta E is rounded to 2 decimals, so ties are common; rank breaks them the way compute-matches ranked the unrounded score, and the order is deterministic from build to build. No OFFSET paging.
- **Frozen sources.** `scripts/data/frozen-match-sources.json` lists colors whose match file must not change while a test runs (`{id, key, until, reason}`). Until `until` (exclusive, UTC), the build serves the committed snapshot in `scripts/data/frozen-match/<id>.json` instead of the regenerated file. The snapshot is applied after the cache, so editing the list never forces a regeneration. Capture snapshots with `npx tsx scripts/snapshot-frozen-match.ts` (reads production, keeps existing snapshots unless `--force`; `--check` compares). A frozen entry without a snapshot fails the build.
- `npm run build-match-data -- --force` ignores the cache.

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

**Supported brands:** `valspar`, `ppg`, `sherwin-williams`, `dutch-boy`, `dunn-edwards`, `kilz`, `ral`. Colorhouse was removed on 2026-10-24 because its store domain was hijacked; Colorhouse color pages have no brand link.

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

Output lands in `data/brand-scans/<YYYY-MM-DD>/` (gitignored): `REPORT.md`,
`summary.json`, and per brand `-live`, `-missing`, `-not-live` and
`-hex-changed` JSON files.

- **Missing**: in the live palette, no DB row by code or alternate number. A
  `dbCodeForName` field means the same name exists under another code, which
  usually means a renumber or dual number, not a new color.
- **Not live**: active DB rows the brand no longer lists. Candidates for
  `is_archived`, never deletion; the URLs keep ranking.
- **Hex changed**: same code, swatch differs by CIEDE2000 2 or more.

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
