# Monetization & Analytics

## Google Analytics

Google Analytics 4 is installed via gtag.js in the root layout (`src/app/layout.tsx`).

- **Measurement ID**: `G-056NR93JLK`
- **Script**: Loaded via `<script>` tag in `<head>`
- **Scope**: All pages (site-wide)

## Google AdSense

### Setup

AdSense publisher ID: `ca-pub-6269963973031881`

The AdSense script is loaded globally via a raw `<script>` tag in `src/app/layout.tsx`:

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6269963973031881"
  crossOrigin="anonymous"
/>
```

**Important**: This uses a raw HTML `<script>` tag, NOT the Next.js `<Script>` component. The `<Script>` component with `beforeInteractive` only adds a `<link rel="preload">` which the AdSense crawler cannot verify. The raw tag ensures the script appears in the initial HTML for crawler verification.

### Ad Placement Strategy

Recommended ad units and placements by page type:

#### Color Detail Pages (`/colors/[brand]/[color]`)
These are the highest-value pages (25,000+ unique URLs, high search intent).

| Position | Ad Unit | Reasoning |
|----------|---------|-----------|
| Between color specs and matches section | Display Ad | Natural content break, above the fold |
| Bottom of page, above footer | Multiplex Ad | Users browse extensively; "related content" style drives pageviews |

#### Brand & Family Grid Pages (`/brands/[slug]`, `/colors/family/[slug]`)
Grid layouts with many color cards.

| Position | Ad Unit | Reasoning |
|----------|---------|-----------|
| Mixed into color grid (every 8-12 cards) | In-feed Ad | Blends naturally with the card grid layout |

#### Homepage (`/`)
| Position | Ad Unit | Reasoning |
|----------|---------|-----------|
| Below hero section, above brand cards | Display Ad | High visibility without disrupting core UX |

#### Search Results (`/search`)
| Position | Ad Unit | Reasoning |
|----------|---------|-----------|
| Mixed into results | In-feed Ad | Natural fit with result cards |

### Implementation Notes

To add ad units, create a reusable `<AdUnit>` component:

```typescript
// src/components/ad-unit.tsx
"use client";

import { useEffect } from "react";

export function AdUnit({ slot, format = "auto" }: { slot: string; format?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-6269963973031881"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
```

Each ad placement needs a unique `slot` ID from the AdSense dashboard.

### Revenue Projections

Home improvement display ad RPMs are typically $15-25+. Based on competitor data:

| Monthly Pageviews | Est. Monthly Revenue |
|-------------------|---------------------|
| 10,000 | $150-250 |
| 50,000 | $750-1,250 |
| 100,000 | $1,500-2,500 |
| 500,000 | $7,500-12,500 |

### Future Monetization

1. **Raptive** (formerly AdThrive): Apply at 25K pageviews/month for higher RPMs
2. **Affiliate links**: Home Depot, Lowe's, direct brand sites for paint purchases
3. **Premium features**: If traffic warrants (color palette builder, room visualizer)
