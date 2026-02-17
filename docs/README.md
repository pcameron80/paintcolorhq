# Paint Color HQ - Documentation

## Overview

Paint Color HQ is a complete paint color toolkit. Users can browse 25,000+ paint colors from 14 brands, find equivalent colors across brands using the CIEDE2000 Delta E algorithm, visualize colors in a room scene, identify paint colors from photos, calculate paint coverage, compare colors side by side, explore curated inspiration palettes, filter by undertone, read blog content about paint colors, and save colors to projects.

**Live site:** https://www.paintcolorhq.com

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | Tech stack, project structure, and design decisions |
| [Database](./database.md) | Schema, tables, indexes, RLS policies, and queries |
| [Data Pipeline](./data-pipeline.md) | Color import, processing, and seeding scripts |
| [Color Matching](./color-matching.md) | CIEDE2000 Delta E algorithm and cross-brand matching |
| [Routes & Pages](./routes.md) | All page types, URLs, and their functionality |
| [SEO](./seo.md) | Sitemaps, meta tags, structured data, canonical URLs, robots.txt |
| [Deployment](./deployment.md) | Vercel setup, environment variables, deploy workflow |
| [Monetization](./monetization.md) | Google AdSense, Google Analytics integration |
| [Development Guide](./development.md) | Local setup, running scripts, common tasks |

## Key Stats

- **25,000+ colors** across 14 paint brands
- **1,482,455 cross-brand matches** pre-computed
- **Top 5 matches per brand** for every color using CIEDE2000
- **14 brands**: Behr, Benjamin Moore, Sherwin-Williams, PPG, Dunn-Edwards, Valspar, Farrow & Ball, and more
- **15 color families**: Red, Orange, Yellow, Green, Blue, Purple, Pink, White, Off-White, Black, Gray, Brown, Beige, Tan, Neutral
- **18 curated inspiration palettes** mapped to real paint colors
- **25 SEO blog posts** covering color trends, brand comparisons, and guides
- **Verified retailer links** for 5,381 colors across Valspar, PPG, and Sherwin-Williams

## Features

- **Cross-brand matching**: Find equivalent colors across brands using Delta E 2000
- **Room Color Visualizer**: Preview paint colors on walls, accent wall, trim, and floor in a realistic room scene
- **Photo Color Identifier**: Upload a photo, click any spot, and find matching paint colors from every brand
- **Paint Calculator**: Enter room dimensions, doors, and windows to calculate gallons needed
- **Undertone Analysis**: Every color tagged warm, cool, or neutral with filter support
- **Color detail pages**: Hex, RGB, LRV, color family, complementary/analogous/triadic harmonies, similar colors from the same brand, verified retailer purchase links (direct product pages where possible)
- **Dynamic OG images**: Auto-generated social sharing images for each color page showing the color swatch, name, and brand
- **Inspiration palettes**: 18 curated palettes (Modern Farmhouse, Coastal Retreat, etc.) with brand filtering
- **Blog**: 25 articles on paint color topics with inline swatches and internal links to tools
- **Projects (auth)**: Save colors to named projects, organized by role (Walls/Trim/Accent/Pop)
- **Search**: Find colors by name, number, or hex code
- **Compare**: Side-by-side color comparison with Delta E score
- **Share**: Web Share API button with clipboard fallback on color pages
- **Pagination**: Brand and color family pages paginate at 200 colors per page
