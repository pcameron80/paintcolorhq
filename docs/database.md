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
| is_discontinued | boolean | Default false |
| created_at | timestamptz | Auto-set |

**Unique constraint:** `(brand_id, slug)` - no duplicate slugs within a brand.

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
