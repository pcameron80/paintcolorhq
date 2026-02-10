# Paint Color HQ - Documentation

## Overview

Paint Color HQ is a cross-brand paint color matching website. Users can browse 22,807+ paint colors from 14 brands, find equivalent colors across brands using the CIEDE2000 Delta E algorithm, and compare colors side by side.

**Live site:** https://www.paintcolorhq.com

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | Tech stack, project structure, and design decisions |
| [Database](./database.md) | Schema, tables, indexes, RLS policies, and queries |
| [Data Pipeline](./data-pipeline.md) | Color import, processing, and seeding scripts |
| [Color Matching](./color-matching.md) | CIEDE2000 Delta E algorithm and cross-brand matching |
| [Routes & Pages](./routes.md) | All page types, URLs, and their functionality |
| [SEO](./seo.md) | Sitemaps, meta tags, structured data, robots.txt |
| [Deployment](./deployment.md) | Vercel setup, environment variables, deploy workflow |
| [Monetization](./monetization.md) | Google AdSense integration and ad placement strategy |
| [Development Guide](./development.md) | Local setup, running scripts, common tasks |

## Key Stats

- **22,807 colors** across 14 paint brands
- **1,482,455 cross-brand matches** pre-computed
- **Top 5 matches per brand** for every color using CIEDE2000
- **14 brands**: Behr, Benjamin Moore, Sherwin-Williams, PPG, Dunn-Edwards, Valspar, Farrow & Ball, and more
- **15 color families**: Red, Orange, Yellow, Green, Blue, Purple, Pink, White, Off-White, Black, Gray, Brown, Beige, Tan, Neutral
