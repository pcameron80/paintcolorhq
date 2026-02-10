# Routes & Pages

## All Routes

| Route | Type | Rendering | Description |
|-------|------|-----------|-------------|
| `/` | Page | Static | Homepage with brand/family browse and search CTA |
| `/brands` | Page | Dynamic | All brands listing with color counts |
| `/brands/[brandSlug]` | Page | Dynamic | Brand detail with all colors in a grid |
| `/colors` | Page | Dynamic | Color families index |
| `/colors/[brandSlug]/[colorSlug]` | Page | Dynamic | Individual color detail with cross-brand matches |
| `/colors/family/[familySlug]` | Page | Dynamic | Colors by family, filterable by brand |
| `/search` | Page | Static | Search page (client-side search component) |
| `/compare` | Page | Dynamic | Side-by-side color comparison (query params) |
| `/match/[src]/[color]-to-[target]` | Page | Dynamic | Cross-brand match detail page |
| `/api/search` | API | Dynamic | Search endpoint: `GET /api/search?q=query` |
| `/api/sitemap` | API | Dynamic | Sitemap index XML |
| `/api/sitemap/[id]` | API | Dynamic | Individual sitemap pages (5000 URLs each) |

## Page Details

### Homepage (`/`)
- Hero section with tagline and search bar link
- "Browse by Brand" section with top 10 brand cards
- "Browse by Color Family" with colored chips for all 15 families

### Brand Detail (`/brands/[brandSlug]`)
- Brand name, color count
- Color family filter chips
- Grid of all colors with swatches, names, and hex codes
- Each card links to the individual color page

### Color Detail (`/colors/[brandSlug]/[colorSlug]`)
**The most important page for SEO and user value.**
- Large color swatch
- Color specs: hex, RGB, LRV, color family
- Breadcrumb navigation
- "Closest Matches from Other Brands" section:
  - Grouped by brand
  - Top 3 matches per brand shown
  - Each match shows swatch, name, hex, Delta E score with label
  - Links to the matched color's own page

### Color Family (`/colors/family/[familySlug]`)
- All colors from all brands in that family
- Sorted by LRV (lightness, descending)
- Brand filter chips to narrow by brand
- 200 color limit per page

### Search (`/search`)
- Client-side search component (`search-results.tsx`)
- Calls `/api/search?q=...` with debounced input
- Supports color name, color number, and hex code search
- Results display as color cards

### Compare (`/compare`)
- URL params: `?color1=uuid&color2=uuid`
- Side-by-side swatches
- Specs comparison table
- Delta E distance between the two colors

### Match Page (`/match/[sourceBrandSlug]/[colorSlug]-to-[targetBrandSlug]`)
- Shows a source color and its closest match in a specific target brand
- Side-by-side display
- Delta E confidence score
- Disclaimer about digital vs physical matches

## Components

| Component | File | Props |
|-----------|------|-------|
| Header | `components/header.tsx` | None - sticky nav with brand/colors/search links |
| Footer | `components/footer.tsx` | None - brand links, family links, resources |
| ColorCard | `components/color-card.tsx` | name, hex, brandName, brandSlug, colorSlug, colorNumber |
| ColorSwatch | `components/color-swatch.tsx` | hex, size (sm/md/lg/xl) |

## TypeScript Types

Defined in `src/lib/types.ts`:

```typescript
Brand         // id, name, slug, website_url, logo_url, color_count, description
Color         // id, brand_id, name, slug, hex, rgb, lab, lrv, color_family...
ColorWithBrand    // Color + { brand: Brand }
CrossBrandMatch   // id, source_color_id, match_color_id, delta_e_score, rank
CrossBrandMatchWithColor  // CrossBrandMatch + { match_color: ColorWithBrand }
ColorFamily       // id, name, slug, description, display_order
```
