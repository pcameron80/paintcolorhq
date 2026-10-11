# Database

## Overview

Paint Color HQ uses Supabase (PostgreSQL) hosted at `dziefzmkcbpeorjawsgg.supabase.co`.

Migration file: `supabase/migrations/001_initial_schema.sql`

## Tables

### `brands`

Paint brand metadata.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| name | text | Unique, e.g. "Sherwin-Williams" |
| slug | text | Unique, e.g. "sherwin-williams" |
| website_url | text | Optional brand website |
| logo_url | text | Optional logo URL |
| color_count | int | Number of colors (updated by seed script) |
| description | text | Optional description |
| created_at | timestamptz | Auto-set |

### `colors`

Individual paint colors with color science data.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| brand_id | uuid | FK to brands |
| name | text | e.g. "Agreeable Gray" |
| slug | text | e.g. "agreeable-gray-7029" |
| color_number | text | e.g. "7029" |
| hex | text | e.g. "#D1CBC1" |
| rgb_r, rgb_g, rgb_b | int | RGB values 0-255 |
| lab_l, lab_a, lab_b_val | numeric | CIELAB values for Delta E |
| lrv | numeric | Light Reflectance Value 0-100 |
| color_family | text | e.g. "gray", "blue" |
| collections | jsonb | Array of collection names |
| undertone | text | Optional: warm/cool/neutral |
| is_discontinued | boolean | Legacy, unused; availability supersedes it |
| alternate_numbers | text[] | Other codes for the same color (BM dual numbers, legacy codes) |
| availability | text | `current` / `retired` / `discontinued` (migration 012). Retired = the brand retired it but it can still be mixed by code; stays a match target. Discontinued = positive evidence it cannot be bought; excluded as a match target |
| availability_source | text | What evidence set the state (feed flag, retailer spot check) |
| availability_checked_on | date | When that evidence was checked |
| last_seen_live_on | date | Last palette scan that found the color in the brand's live palette; internal only |
| is_archived | boolean | GENERATED: `availability = 'discontinued'`. Read-only; write `availability` instead |
| created_at | timestamptz | Auto-set |

**Unique constraint:** `(brand_id, slug)` - no duplicate slugs within a brand.

**Dropped column:** `description_extended` (templated boilerplate with wrong LRV values) was dropped by `supabase/migrations/011_drop_description_extended.sql` on 2026-10-11. Backup of the 21,858 non-null rows (id, slug, brand_id, description_extended): `scripts/backups/description-extended-2026-10-11.json` in the main checkout (gitignored; produced by `scripts/backup-description-extended.ts`).

### `cross_brand_matches`

Pre-computed color matches between brands.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| source_color_id | uuid | FK to colors (CASCADE delete) |
| match_color_id | uuid | FK to colors (CASCADE delete) |
| delta_e_score | numeric | CIEDE2000 distance (lower = closer) |
| rank | int | 1-5 within each target brand |

**Unique constraint:** `(source_color_id, match_color_id)`

### `color_families`

Reference table for color categories.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Unique, e.g. "Gray" |
| slug | text | Unique, e.g. "gray" |
| description | text | Optional |
| display_order | int | Sort order (1-15) |

Pre-seeded with 15 families: Red, Orange, Yellow, Green, Blue, Purple, Pink, White, Off-White, Black, Gray, Brown, Beige, Tan, Neutral.

### `api_referrers`

External pages that use the free color-match API, the MCP tool or the embed widget, and whether they credit us. Free use requires a visible link to https://www.paintcolorhq.com. Migration: `supabase/migrations/013_api_referrers.sql`.

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Identity primary key |
| kind | text | `api`, `embed` or `mcp` (CHECK) |
| referrer_url | text | Normalized page URL: scheme, host, path; no query, fragment or credentials; max 500 chars |
| referrer_host | text | Lowercase hostname |
| first_seen | timestamptz | Default now() |
| last_seen | timestamptz | Updated on every logged hit |
| hits | bigint | Default 1, incremented per logged hit |
| last_checked | timestamptz | Null until `scripts/check-attribution.ts --write` runs |
| has_credit | boolean | Null = unchecked or unreachable |
| check_note | text | Checker's reason, e.g. "link found", "unreachable: HTTP 403" |

**Unique constraint:** `(kind, referrer_url)`

**Access:** RLS enabled with no policies; anon and authenticated have no table privileges. Writes go through `log_api_referrer(p_kind, p_url, p_host)`, a SECURITY DEFINER upsert (insert, or `hits + 1` and `last_seen = now()`) executable by `service_role` only.

**Writers:** `src/lib/referrer-log.ts`, called inside `after()` (never blocks or fails a response) from:
- `/api/color-match` (free tier only, `kind = 'api'`): Referer, Origin as fallback.
- `/api/mcp` tool calls (`kind = 'mcp'`): Referer, Origin as fallback.
- `/api/embed-event`, the widget's load beacon (`kind = 'embed'`): the parent page URL the widget reports. `/embed/match` itself is a static CDN page, so no server code sees its Referer.

Our own hosts (`paintcolorhq.com`, `*.vercel.app`), localhost and private/LAN addresses are dropped (`src/lib/attribution.ts`).

**Blind spots:**
- Server-to-server API and MCP calls send no Referer or Origin and cannot be attributed. Most MCP clients fall here.
- Browsers send only the origin on most cross-origin requests, so many rows are a site root, not the page that uses us.
- The free API response is edge-cached for 24h, so only cache misses reach the function and get logged. `hits` undercounts.

**Reader:** `npm run check-attribution` (dry run, rows unchecked for 7 days), `-- --all` for every row, `-- --write` to save `last_checked`, `has_credit`, `check_note`. It fetches static HTML only, so a link injected by JavaScript is missed: treat "no" as "check by hand".

## Indexes

| Index | Table | Columns | Type |
|-------|-------|---------|------|
| idx_brands_slug | brands | slug | B-tree |
| idx_colors_brand_id | colors | brand_id | B-tree |
| idx_colors_hex | colors | hex | B-tree |
| idx_colors_color_family | colors | color_family | B-tree |
| idx_colors_slug | colors | slug | B-tree |
| idx_colors_brand_id_slug | colors | (brand_id, slug) | B-tree composite |
| idx_colors_name_fts | colors | to_tsvector(name) | GIN full-text |
| idx_cross_brand_matches_source | cross_brand_matches | source_color_id | B-tree |
| idx_cross_brand_matches_match | cross_brand_matches | match_color_id | B-tree |
| idx_cross_brand_matches_source_rank | cross_brand_matches | (source_color_id, rank) | B-tree composite |

## Row Level Security

All 4 tables have RLS enabled with public SELECT policies:

```sql
CREATE POLICY "Public read access" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read access" ON colors FOR SELECT USING (true);
CREATE POLICY "Public read access" ON cross_brand_matches FOR SELECT USING (true);
CREATE POLICY "Public read access" ON color_families FOR SELECT USING (true);
```

Write operations require the `service_role` key (used only in seed scripts).

## Query Functions

All queries are in `src/lib/queries.ts`:

| Function | Description |
|----------|-------------|
| `getAllBrands()` | All brands sorted by color count |
| `getBrandBySlug(slug)` | Single brand by URL slug |
| `getColorsByBrand(brandId, opts?)` | Colors for a brand, filterable by family/undertone, supports pagination via limit/offset |
| `getColorsByBrandCount(brandId, opts?)` | Count of colors for a brand (for pagination) |
| `getColorBySlug(brandSlug, colorSlug)` | Single color with brand data |
| `getCrossBrandMatches(colorId)` | All matches for a color, sorted by Delta E |
| `searchColors(query, limit?)` | Search by name, number, or hex code |
| `getColorsByFamily(familySlug, opts?)` | Colors in a family, sorted alphabetically, supports pagination via limit/offset |
| `getColorsByFamilyCount(familySlug, opts?)` | Count of colors in a family (for pagination) |
| `getSimilarColorsFromSameBrand(color, limit?)` | Find visually similar colors from the same brand using RGB proximity (±25 range, Euclidean distance sort) |
| `getAllColorFamilies()` | All families sorted by display order |
| `getColorById(id)` | Single color by UUID |
| `getAllColorSlugs()` | All brand/color slug pairs (for sitemaps, paginated) |

### Supabase 1000-Row Limit

Supabase's default `max_rows` is 1000. `getAllColorSlugs()` paginates in batches of 1000 using `.range()` to fetch all 22,807 colors for sitemap generation.
