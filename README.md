# Paint Color HQ

Cross-brand paint color matching and tools. Explore 25,000+ paint colors from 14 brands, match colors across brands, visualize them in a room, identify colors from photos, and calculate coverage.

**Live:** [www.paintcolorhq.com](https://www.paintcolorhq.com)

## Features

- **Cross-Brand Color Matching** — Find equivalent colors across 14 major paint brands using the CIEDE2000 (Delta E 2000) color science algorithm
- **Room Color Visualizer** — Preview paint colors on walls, accent wall, trim, and floor in a realistic room scene
- **Photo Color Identifier** — Upload a photo, click any spot, and instantly find matching paint colors from every brand
- **Paint Calculator** — Enter room dimensions, doors, and windows to calculate exactly how many gallons you need
- **Undertone Analysis** — Every color tagged warm, cool, or neutral with filtering support
- **Inspiration Palettes** — Curated color schemes (Modern Farmhouse, Coastal Retreat, etc.) mapped to real paint colors
- **User Projects** — Save colors by room role (walls, trim, accent, pop) and organize selections

## Tech Stack

- **Framework:** Next.js 16 with Turbopack
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS

## Development

```bash
npm install
npm run dev
```

Requires a `.env.local` with Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Project Structure

```
src/
  app/
    page.tsx                    # Homepage (feature grid, inspiration, browse by brand/family)
    layout.tsx                  # Root layout with metadata, analytics
    colors/                     # Color browsing and detail pages
    brands/                     # Brand listing and per-brand pages
    tools/
      page.tsx                  # Tools hub
      paint-calculator/         # Paint coverage calculator
      color-identifier/         # Photo-based color identification
      room-visualizer/          # Interactive room color preview
    inspiration/                # Curated palette browsing
    match/                      # Cross-brand match pages (SEO)
    blog/                       # Blog posts
    search/                     # Color search
    compare/                    # Side-by-side color comparison
    api/
      sitemap/                  # Dynamic sitemap index + paginated child sitemaps
      color-match/              # Color matching API endpoint
  components/                   # Shared UI components
  lib/                          # Data queries, utilities, palette definitions
```

## SEO

- **Sitemap:** Dynamic sitemap index at `/sitemap.xml` with paginated child sitemaps at `/sitemap/{id}.xml` (rewrites from `/api/sitemap/`)
- **Canonical domain:** `www.paintcolorhq.com` (non-www redirects via Vercel)
- **Structured data:** JSON-LD on homepage (WebSite + SearchAction), color pages (WebPage + BreadcrumbList), blog (Blog + BlogPosting), tools (HowTo)
- **robots.txt:** Allows all except `/dashboard`, `/auth/`, `/api/`

## Brands

Sherwin-Williams, Benjamin Moore, Behr, PPG, Dunn-Edwards, Valspar, Farrow & Ball, Kilz, Vista Paint, Hirshfield's, Colorhouse, Dutch Boy, RAL, MPC
