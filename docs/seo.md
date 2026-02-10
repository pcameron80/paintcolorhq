# SEO

## Rendering Strategy

Public pages use ISR (Incremental Static Regeneration) with `revalidate = 3600` (1 hour). The Supabase client uses `next: { revalidate: 3600 }` in its fetch config to match.

Pages that use the Header component (which calls `cookies()` for auth state) fall back to dynamic rendering on-demand but are still cached for the revalidation period.

Dashboard pages use `force-dynamic` and are excluded from search indexing.

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

### URL Coverage

The sitemap includes all public page types:

| URL Pattern | Priority | Change Frequency | lastmod |
|-------------|----------|-----------------|---------|
| `/` | 1.0 | weekly | - |
| `/brands` | 0.8 | weekly | - |
| `/brands/[slug]` | 0.8 | weekly | - |
| `/colors` | 0.8 | weekly | - |
| `/colors/family/[slug]` | 0.7 | weekly | - |
| `/search` | 0.7 | monthly | - |
| `/blog` | 0.7 | weekly | - |
| `/blog/[slug]` | 0.7 | monthly | post date |
| `/inspiration` | 0.7 | weekly | - |
| `/inspiration/[slug]` | 0.6 | weekly | - |
| `/compare` | 0.6 | monthly | - |
| `/colors/[brand]/[color]` | 0.6 | monthly | - |

### Pagination

The sitemap queries all 25,000+ color slugs from Supabase. Since Supabase has a 1000-row default limit, `getAllColorSlugs()` paginates in batches of 1000 using `.range()`.

Total sitemaps: ~5 (25,000+ colors + static pages + brand pages + family pages + blog + inspiration = ~25,100 URLs / 5000 per sitemap).

## Canonical URLs

Every public page has a canonical URL set via `alternates.canonical` in `generateMetadata()`:

```typescript
// Dynamic pages
alternates: { canonical: `https://paintcolorhq.com/colors/${brandSlug}/${colorSlug}` }

// Static pages
alternates: { canonical: "https://paintcolorhq.com/brands" }
```

This prevents duplicate content issues from query parameters (e.g., `?brand=` filters on family pages).

## Meta Tags

### Title & Description

Each page type has dynamic metadata via `generateMetadata()`:

| Page | Title Pattern | Description |
|------|--------------|-------------|
| Homepage | "Paint Color HQ - Paint Color Inspiration & Palettes" | Explore 25,000+ colors... |
| Color detail | "[Name] by [Brand] \| #[Hex]" | [Name] ([Number]) by [Brand]. Hex, RGB, LRV... |
| Brand | "[Brand] Paint Colors - Browse All [Count] Colors" | Browse all [count] [brand] paint colors... |
| Color family | "[Family] Paint Colors - All Brands" | Browse [family] paint colors from Sherwin-Williams... |
| Blog index | "Blog \| Paint Color HQ" | Expert guides on paint colors... |
| Blog post | "[Title] \| Paint Color HQ" | Post excerpt |
| Inspiration index | "Color Inspiration \| Paint Color HQ" | Browse curated color palettes... |
| Inspiration detail | "[Palette] Color Palette \| Paint Color HQ" | Palette description |
| Match | "[Brand] [Color] in [TargetBrand]" | Find the closest equivalent... |

### Open Graph

Every public page has OpenGraph metadata with `title`, `description`, and `url`. The root layout sets defaults:

- `og:type`: "website"
- `og:site_name`: "Paint Color HQ"
- `og:image`: `/og-image.webp` (1200x630)
- `metadataBase`: `https://paintcolorhq.com`

Blog posts additionally set:
- `og:type`: "article"
- `og:article:published_time`
- `og:article:tag`

### Twitter

Set via root layout: `twitter:card` = "summary_large_image"

## Structured Data (JSON-LD)

### Homepage - WebSite + SearchAction

```json
{
  "@type": "WebSite",
  "name": "Paint Color HQ",
  "url": "https://paintcolorhq.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://paintcolorhq.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

Enables the Google sitelinks search box.

### Color Detail - Product

```json
{
  "@type": "Product",
  "name": "[Color Name] Paint Color",
  "brand": { "@type": "Brand", "name": "[Brand Name]" },
  "color": "#hex",
  "description": "...",
  "sku": "[color_number]",
  "url": "https://paintcolorhq.com/colors/[brand]/[color]"
}
```

### Brand Detail - Organization

```json
{
  "@type": "Organization",
  "name": "[Brand Name]",
  "url": "[brand website]"
}
```

### Blog Index - Blog

```json
{
  "@type": "Blog",
  "name": "Paint Color HQ Blog",
  "url": "https://paintcolorhq.com/blog",
  "publisher": { "@type": "Organization", "name": "Paint Color HQ" },
  "blogPost": [{ "@type": "BlogPosting", "headline": "...", "datePublished": "..." }]
}
```

### Blog Post - BlogPosting

```json
{
  "@type": "BlogPosting",
  "headline": "[title]",
  "datePublished": "[date]",
  "url": "https://paintcolorhq.com/blog/[slug]",
  "keywords": "[tags]",
  "author": { "@type": "Organization", "name": "Paint Color HQ" },
  "publisher": { "@type": "Organization", "name": "Paint Color HQ" }
}
```

## robots.txt

Located at `public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /auth/
Disallow: /api/

Sitemap: https://paintcolorhq.com/sitemap.xml
```

Private routes (`/dashboard`, `/auth`) and API routes are blocked from crawlers.

### noindex on Private Pages

Dashboard pages set `robots: { index: false, follow: false }` in their metadata as a belt-and-suspenders approach alongside robots.txt.

## Internal Linking

- Color pages link to their brand page and color family page
- Brand pages link to individual color pages
- Color family pages link to individual color pages
- Cross-brand match results link to the matched color's page
- Footer contains links to top brands and color families
- Breadcrumb navigation on all detail pages
- Blog posts contain inline color swatches that link to the search page
- Blog posts link to brand pages, color family pages, and other blog posts
- Inspiration palettes link to individual color pages

## Google Search Console

Submit the sitemap at: `https://paintcolorhq.com/sitemap.xml`

This will index all ~25,100 URLs across the paginated sitemaps.

## Google Analytics

Google Analytics 4 (gtag.js) is installed in the root layout with measurement ID `G-056NR93JLK`. It loads on every page via a `<script>` tag in `<head>`.
