# SEO

## Sitemaps

### Architecture

Next.js's built-in `generateSitemaps()` has a known bug where it doesn't produce a sitemap index at `/sitemap.xml` (see [vercel/next.js#77304](https://github.com/vercel/next.js/issues/77304)). We use an API route workaround:

1. **Sitemap index**: `GET /api/sitemap` generates `<sitemapindex>` XML
2. **Sitemap pages**: `GET /api/sitemap/[id]` generates `<urlset>` XML with up to 5000 URLs each
3. **Rewrite**: `next.config.ts` rewrites `/sitemap.xml` to `/api/sitemap`

```typescript
// next.config.ts
async rewrites() {
  return [{ source: "/sitemap.xml", destination: "/api/sitemap" }];
}
```

### URL Priorities

| URL Pattern | Priority | Change Frequency |
|-------------|----------|-----------------|
| `/` | 1.0 | weekly |
| `/brands`, `/brands/[slug]` | 0.8 | weekly |
| `/colors` | 0.8 | weekly |
| `/colors/family/[slug]` | 0.7 | weekly |
| `/search` | 0.7 | monthly |
| `/compare` | 0.6 | monthly |
| `/colors/[brand]/[color]` | 0.6 | monthly |

### Pagination

The sitemap queries all 22,807 color slugs from Supabase. Since Supabase has a 1000-row default limit, `getAllColorSlugs()` paginates in batches of 1000 using `.range()`.

Total sitemaps: ~5 (22,807 colors + static pages + brand pages + family pages = ~22,840 URLs / 5000 per sitemap).

## Meta Tags

Each page type has dynamic metadata via `generateMetadata()`:

| Page | Title Pattern | Description |
|------|--------------|-------------|
| Homepage | "Paint Color HQ - Cross-Brand Paint Color Matching" | Browse 25,000+ colors... |
| Color detail | "[Name] by [Brand] \| #[Hex] \| Paint Color HQ" | [Name] ([Number]) by [Brand]. Hex [hex], RGB [...], LRV [lrv]... |
| Brand | "[Brand] Paint Colors - Browse All [Count] Colors" | Browse all [count] [brand] paint colors... |
| Color family | "[Family] Paint Colors - All Brands" | Browse [family] paint colors from Sherwin-Williams... |

### Open Graph

Set via the root layout metadata:
- `og:type`: "website"
- `og:site_name`: "Paint Color HQ"
- `metadataBase`: `https://paintcolorhq.com`

## robots.txt

Located at `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://paintcolorhq.com/sitemap.xml
```

## Internal Linking

- Color pages link to their brand page and color family page
- Brand pages link to individual color pages
- Color family pages link to individual color pages
- Cross-brand match results link to the matched color's page
- Footer contains links to top brands and color families
- Breadcrumb navigation on all detail pages

## Google Search Console

Submit the sitemap at: `https://paintcolorhq.com/sitemap.xml`

This will index all ~22,840 URLs across the 5 paginated sitemaps.
