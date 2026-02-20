# SEO

## Rendering Strategy

Public pages use ISR (Incremental Static Regeneration) with `revalidate = 3600` (1 hour). The Supabase client uses `next: { revalidate: 3600 }` in its fetch config to match.

The Header is a static server component that delegates auth display to client-side components (`AuthButton`, `MobileNav`). This means the Header does **not** call `cookies()` and does not force pages into dynamic rendering. All public pages benefit from full ISR caching.

Dashboard pages use `force-dynamic` and are excluded from search indexing.

## Sitemaps

### Architecture

Next.js's built-in `generateSitemaps()` has a known bug where it doesn't produce a sitemap index at `/sitemap.xml` (see [vercel/next.js#77304](https://github.com/vercel/next.js/issues/77304)). We use an API route workaround:

1. **Sitemap index**: `GET /api/sitemap` generates `<sitemapindex>` XML with child sitemap refs at `/sitemap/{id}.xml`
2. **Sitemap pages**: `GET /api/sitemap/[id]` generates `<urlset>` XML with up to 5000 URLs each
3. **Rewrites**: `next.config.ts` rewrites both the index and child sitemaps to avoid `/api/` paths (which are blocked by robots.txt)

```typescript
// next.config.ts
async rewrites() {
  return [
    { source: "/sitemap.xml", destination: "/api/sitemap" },
    { source: "/sitemap/:id.xml", destination: "/api/sitemap/:id" },
  ];
}
```

**Important**: Child sitemaps are served at `/sitemap/0.xml`, `/sitemap/1.xml`, etc. — NOT at `/api/sitemap/0`. This avoids the `Disallow: /api/` rule in robots.txt blocking Google from reading them.

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
| `/tools` | 0.7 | monthly | - |
| `/tools/paint-calculator` | 0.7 | monthly | - |
| `/tools/color-identifier` | 0.7 | monthly | - |
| `/tools/room-visualizer` | 0.7 | monthly | - |
| `/colors/[brand]/[color]` | 0.6 | monthly | - |

### Pagination

The sitemap queries all 25,000+ color slugs from Supabase. Since Supabase has a 1000-row default limit, `getAllColorSlugs()` paginates in batches of 1000 using `.range()`.

Total sitemaps: ~5 (25,000+ colors + static pages + brand pages + family pages + blog + inspiration = ~25,100 URLs / 5000 per sitemap).

## Canonical URLs

Every public page has a canonical URL set via `alternates.canonical` in `generateMetadata()`:

```typescript
// Dynamic pages
alternates: { canonical: `https://www.paintcolorhq.com/colors/${brandSlug}/${colorSlug}` }

// Static pages
alternates: { canonical: "https://www.paintcolorhq.com/brands" }
```

This prevents duplicate content issues from query parameters (e.g., `?brand=` filters on family pages).

## Meta Tags

### Title & Description

Each page type has dynamic metadata via `generateMetadata()`:

| Page | Title Pattern | Description |
|------|--------------|-------------|
| Homepage | "Paint Color HQ - Paint Color Inspiration & Palettes" | Explore 25,000+ colors, match across brands, visualize in a room... |
| Color detail | "[Name] by [Brand] \| #[Hex]" | Algorithmic description (see below) |
| Brand | "[Brand] Paint Colors - Browse All [Count] Colors" | Browse all [count] [brand] paint colors... |
| Color family | "[Family] Paint Colors - All Brands" | Browse [family] paint colors from Sherwin-Williams... |
| Blog index | "Blog \| Paint Color HQ" | Expert guides on paint colors... |
| Blog post | "[Title] \| Paint Color HQ" | Post excerpt |
| Inspiration index | "Color Inspiration \| Paint Color HQ" | Browse curated color palettes... |
| Inspiration detail | "[Palette] Color Palette \| Paint Color HQ" | Palette description |
| Match | "[Brand] [Color] in [TargetBrand]" | Find the closest equivalent... |
| Tools hub | "Paint Tools \| Paint Color HQ" | Free paint tools: room visualizer, photo identifier, calculator... |
| Paint Calculator | "Paint Calculator - How Much Paint Do I Need?" | Calculate exactly how many gallons... |
| Color Identifier | "Photo Color Identifier - Find Paint Colors from Photos" | Upload a photo and click any spot... |
| Room Visualizer | "Room Color Visualizer - Preview Paint Colors in a Room" | See how paint colors look in a room... |

### Open Graph

Every public page has OpenGraph metadata with `title`, `description`, and `url`. The root layout sets defaults:

- `og:type`: "website"
- `og:site_name`: "Paint Color HQ"
- `og:image`: `/og-image.webp` (1200x630)
- `metadataBase`: `https://www.paintcolorhq.com`

#### Dynamic OG Images for Color Pages

Color detail pages (`/colors/[brand]/[color]`), brand pages, and match pages use dynamic OG images generated by the `/api/og` edge API route:

```
/api/og?hex=%23D1CBC1&name=Agreeable%20Gray&brand=Sherwin-Williams
```

The endpoint generates a 1200x630 PNG with:
- Left half: full color swatch
- Right half: color name, brand, hex code, and "PaintColorHQ.com" branding
- Auto-contrast text (dark text on light colors, white text on dark colors)
- 24-hour edge cache (`Cache-Control: public, max-age=86400, s-maxage=86400`)

Implementation: `src/app/api/og/route.tsx` using `ImageResponse` from `next/og`.

Blog posts additionally set:
- `og:type`: "article"
- `og:article:published_time`
- `og:article:tag`
- `og:image`: cover image URL (when `coverImage` is set on the post)

### Twitter

Set via root layout: `twitter:card` = "summary_large_image"

## Algorithmic Color Descriptions

Each of the 25,000+ color pages gets a unique 2-4 sentence description generated at render time by `src/lib/color-description.ts`. Since pages use ISR, the description is computed once and cached for an hour. No database column or batch script is needed.

### How It Works

- **Deterministic hash**: `hashHex(hex)` produces a 32-bit integer (djb2). A `pick(items, hash, salt)` helper selects from template arrays — same hex always produces the same description (ISR-safe).
- **Derived properties**: Temperature (warm/cool/neutral), lightness (very light → dark), saturation (muted → vibrant), and undertone (golden/pink/green/blue/violet/balanced) are computed from LAB, HSL, and LRV data.
- **Achromatic handling**: When saturation < 8% (whites, grays, blacks), hue language is skipped and separate templates emphasize warmth/coolness, LRV, and versatility.

### Sentence Generators

1. **Character statement** (always) — What the color looks/feels like. 15 template frames with synonym pools.
2. **Room/usage suggestion** (always) — Contextual recommendation branching on lightness + saturation + temperature. Includes LRV data.
3. **Cross-brand match** (when matches with delta_e < 5 exist) — Mentions 1-2 closest matches. Inherently unique per color.
4. **Optional extra detail** (~40% of colors) — Extreme LRV commentary, coordination tips.

### Exports

- `generateColorDescription(color, matches)` — 2-4 sentences for the page body (rendered as a `<p>` between the color hero and ComplementaryColors)
- `generateMetaDescription(color)` — Single sentence, max 160 chars, for the `<meta name="description">` tag

### Example Output

> Agreeable Gray is a light, warm gray with subtle violet-brown undertones that give it a soft, approachable quality. With an LRV of 60, it reflects a comfortable amount of light, making it a versatile whole-home neutral for living rooms, bedrooms, and hallways. The closest match from Benjamin Moore is Revere Pewter, with only a slight difference visible side by side.

## Structured Data (JSON-LD)

### Homepage - WebSite + SearchAction

```json
{
  "@type": "WebSite",
  "name": "Paint Color HQ",
  "url": "https://www.paintcolorhq.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.paintcolorhq.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

Enables the Google sitelinks search box.

### Color Detail - WebPage + BreadcrumbList

Previously used `Product` schema, but Google requires `offers` (with pricing) or `review`/`aggregateRating` for Product — none of which apply to a reference site. Switched to `WebPage` with `BreadcrumbList` (which Google renders in search results) and an `about` block carrying the color data.

```json
{
  "@type": "WebPage",
  "name": "[Color Name] Paint Color",
  "description": "[algorithmic description]",
  "url": "https://www.paintcolorhq.com/colors/[brand]/[color]",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.paintcolorhq.com" },
      { "@type": "ListItem", "position": 2, "name": "[Brand Name]", "item": "https://www.paintcolorhq.com/brands/[brand]" },
      { "@type": "ListItem", "position": 3, "name": "[Color Name]" }
    ]
  },
  "about": {
    "@type": "Thing",
    "name": "[Color Name] ([Color Number])",
    "description": "[algorithmic description]",
    "brand": { "@type": "Brand", "name": "[Brand Name]" },
    "identifier": "[color_number]",
    "color": "#hex"
  }
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
  "url": "https://www.paintcolorhq.com/blog",
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
  "url": "https://www.paintcolorhq.com/blog/[slug]",
  "keywords": "[tags]",
  "author": { "@type": "Organization", "name": "Paint Color HQ" },
  "publisher": { "@type": "Organization", "name": "Paint Color HQ" }
}
```

### Paint Calculator - HowTo

```json
{
  "@type": "HowTo",
  "name": "Calculate How Much Paint You Need",
  "step": [
    { "@type": "HowToStep", "name": "Measure your room" },
    { "@type": "HowToStep", "name": "Calculate wall area" },
    { "@type": "HowToStep", "name": "Subtract doors and windows" },
    { "@type": "HowToStep", "name": "Account for coats" },
    { "@type": "HowToStep", "name": "Calculate gallons" }
  ]
}
```

### Photo Color Identifier - HowTo

```json
{
  "@type": "HowTo",
  "name": "Find Paint Colors from a Photo",
  "step": [
    { "@type": "HowToStep", "name": "Upload a photo" },
    { "@type": "HowToStep", "name": "Click a spot" },
    { "@type": "HowToStep", "name": "Get matches" }
  ]
}
```

### Room Visualizer - HowTo

```json
{
  "@type": "HowTo",
  "name": "Preview Paint Colors in a Room",
  "step": [
    { "@type": "HowToStep", "name": "Select a region" },
    { "@type": "HowToStep", "name": "Pick a color" },
    { "@type": "HowToStep", "name": "Find paint matches" }
  ]
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

Sitemap: https://www.paintcolorhq.com/sitemap.xml
```

Private routes (`/dashboard`, `/auth`) and API routes are blocked from crawlers. Sitemaps are served at `/sitemap.xml` and `/sitemap/{id}.xml` via rewrites, not at `/api/` paths, so they are accessible to crawlers.

### noindex on Private Pages

Dashboard pages set `robots: { index: false, follow: false }` in their metadata as a belt-and-suspenders approach alongside robots.txt.

## Internal Linking

- Color pages link to their brand page, color family page, and similar colors from the same brand
- Brand pages link to individual color pages (paginated)
- Color family pages link to individual color pages (paginated)
- Cross-brand match results link to the matched color's page
- Footer contains links to top brands and color families
- Breadcrumb navigation on all detail pages
- Blog posts contain inline color swatches that link to color detail pages
- Blog posts link to brand pages, color family pages, tool pages, and other blog posts
- Blog posts include contextual links to tools (room visualizer, paint calculator, color identifier, palette generator)
- Inspiration palettes link to individual color pages

## Google Search Console

- **Property**: `https://www.paintcolorhq.com/` (www is the canonical domain; non-www redirects via Vercel)
- **Sitemap**: `https://www.paintcolorhq.com/sitemap.xml`
- All canonical URLs, OG URLs, JSON-LD URLs, and sitemap URLs use `www.paintcolorhq.com` to match the GSC property

This will index all ~25,100 URLs across the paginated sitemaps (~5 child sitemaps at `/sitemap/0.xml` through `/sitemap/4.xml`).

## Blog Cover Images

Blog posts support optional cover images that replace the solid color bar on both the listing page and individual post pages.

### How It Works

The `BlogPost` interface in `src/lib/blog-posts.tsx` has an optional `coverImage` field:

```typescript
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverColor: string;    // hex — always required as fallback
  coverImage?: string;   // optional path, e.g. "/blog/my-post.webp"
  tags: string[];
  content: () => ReactNode;
}
```

When `coverImage` is set:
- **Blog listing** (`/blog`): Shows the image (h-40/h-48) instead of the solid color bar
- **Post page** (`/blog/[slug]`): Shows a full-width hero image (h-48/h-64/h-80) instead of the color bar
- **OpenGraph**: `og:image` is set to the full URL for social sharing previews
- **JSON-LD**: `image` field is added to the `BlogPosting` schema for Google rich results

When `coverImage` is not set, everything falls back to `coverColor` — no changes needed for existing posts.

### Adding Images to Posts

1. **Create/source the image**
   - Use Canva Pro or Adobe Stock
   - **Dimensions**: 1200x630px (standard OG size — works for both hero and social)
   - **Format**: WebP for best compression
   - Name the file after the post slug: `{slug}.webp`

2. **Save to `public/blog/`**
   ```
   public/blog/best-kitchen-paint-colors-2025.webp
   public/blog/calming-bedroom-paint-colors.webp
   ```

3. **Add the field to the post** in `src/lib/blog-posts.tsx`:
   ```typescript
   {
     slug: "best-kitchen-paint-colors-2025",
     title: "The 10 Best Kitchen Paint Colors for 2025",
     date: "2025-06-10",
     coverColor: "#5B8C5A",
     coverImage: "/blog/best-kitchen-paint-colors-2025.webp",  // ← add this
     // ...
   }
   ```

4. **Deploy** — the image is served by Next.js `<Image>` with automatic optimization

### All 25 Post Slugs (for image filenames)

| # | Filename |
|---|----------|
| 1 | `2026-colors-of-the-year-every-brand-compared.webp` |
| 2 | `2025-colors-of-the-year-every-brand-compared.webp` |
| 3 | `best-sherwin-williams-alternatives-to-benjamin-moore.webp` |
| 4 | `understanding-paint-color-undertones.webp` |
| 5 | `best-kitchen-paint-colors-2025.webp` |
| 6 | `behr-vs-sherwin-williams-vs-benjamin-moore.webp` |
| 7 | `calming-bedroom-paint-colors.webp` |
| 8 | `how-to-find-perfect-color-match-across-brands.webp` |
| 9 | `best-white-paint-colors-guide.webp` |
| 10 | `warm-vs-cool-paint-colors.webp` |
| 11 | `most-popular-paint-colors-2025.webp` |
| 12 | `best-bathroom-paint-colors.webp` |
| 13 | `best-living-room-paint-colors.webp` |
| 14 | `best-home-office-paint-colors.webp` |
| 15 | `best-exterior-paint-colors.webp` |
| 16 | `best-nursery-paint-colors.webp` |
| 17 | `best-dining-room-paint-colors.webp` |
| 18 | `best-sherwin-williams-kitchen-colors.webp` |
| 19 | `benjamin-moore-most-popular-whites.webp` |
| 20 | `best-behr-colors-for-bedrooms.webp` |
| 21 | `paint-color-trends-2026.webp` |
| 22 | `sherwin-williams-vs-benjamin-moore.webp` |
| 23 | `paint-sheen-guide.webp` |
| 24 | `how-to-test-paint-samples.webp` |
| 25 | `color-theory-for-home-decorators.webp` |

### Image Tips

- **Canva Pro**: Search for relevant room/paint photos, resize to 1200x630, export as WebP
- **Adobe Stock**: Download, crop to 1200x630 in Canva or any editor, export as WebP
- **File size**: Aim for under 200KB per image — WebP at 80% quality is usually sufficient
- **Alt text**: Automatically set to the post title via Next.js `<Image alt={post.title}>`
- You can add images incrementally — posts without `coverImage` keep working with color bars

## Google Analytics

Google Analytics 4 (gtag.js) is installed in the root layout with measurement ID `G-056NR93JLK`. It loads on every page via a `<script>` tag in `<head>`.
