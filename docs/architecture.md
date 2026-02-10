# Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | React | 19.2.3 |
| Database | Supabase (PostgreSQL) | - |
| Styling | Tailwind CSS | 4 |
| Language | TypeScript | 5 |
| Hosting | Vercel | - |
| Scripts | tsx | 4.21 |

## Project Structure

```
paintcolorhq/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (metadata, fonts, AdSense)
│   │   ├── page.tsx            # Homepage
│   │   ├── globals.css         # Tailwind global styles
│   │   ├── api/
│   │   │   ├── search/route.ts       # GET /api/search?q=...
│   │   │   └── sitemap/
│   │   │       ├── route.ts          # Sitemap index XML
│   │   │       └── [id]/route.ts     # Sitemap pages XML
│   │   ├── brands/
│   │   │   ├── page.tsx              # All brands listing
│   │   │   └── [brandSlug]/page.tsx  # Brand detail
│   │   ├── colors/
│   │   │   ├── page.tsx              # Color families index
│   │   │   ├── [brandSlug]/
│   │   │   │   └── [colorSlug]/page.tsx  # Color detail + matches
│   │   │   └── family/
│   │   │       └── [familySlug]/page.tsx # Colors by family
│   │   ├── search/
│   │   │   ├── page.tsx              # Search page
│   │   │   └── search-results.tsx    # Client component
│   │   ├── compare/page.tsx          # Color comparison
│   │   └── match/
│   │       └── [sourceBrandSlug]/
│   │           └── [colorSlug]-to-[targetBrandSlug]/page.tsx
│   ├── components/
│   │   ├── header.tsx          # Navigation header
│   │   ├── footer.tsx          # Footer with links
│   │   ├── color-card.tsx      # Color grid card
│   │   └── color-swatch.tsx    # Color swatch display
│   └── lib/
│       ├── types.ts            # TypeScript interfaces
│       ├── supabase.ts         # Supabase client
│       └── queries.ts          # Database query functions
├── scripts/                    # Data pipeline scripts
│   ├── import-colors.ts        # Parse ColorNerd JSON
│   ├── seed-database.ts        # Upload colors to Supabase
│   ├── compute-matches.ts      # Calculate Delta E matches
│   ├── seed-matches.ts         # Upload matches to Supabase
│   └── lib/
│       └── color-utils.ts      # Color math (RGB, Lab, Delta E)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
├── data/                       # Gitignored - local data files
│   ├── colornerd/              # Cloned ColorNerd repo
│   ├── colors-processed.json   # Processed color output
│   └── cross-brand-matches.json # Computed matches (222MB)
├── public/
│   └── robots.txt              # SEO robots file
├── next.config.ts              # Sitemap rewrite
├── package.json
└── .vercelignore               # Excludes data/ and scripts/ from deploy
```

## Design Decisions

### Server-Side Rendering
All data-driven pages use `dynamic = "force-dynamic"` for real-time Supabase queries. This avoids stale ISR cache issues and ensures fresh data.

### No-Cache Fetch Workaround
Next.js intercepts `fetch()` and caches responses, which breaks Supabase pagination (returns duplicate results). The Supabase client is created with a custom fetch that sets `cache: 'no-store'`:

```typescript
export const supabase = createClient(url, key, {
  global: {
    fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
  },
});
```

### Route Structure
Color family pages are at `/colors/family/[familySlug]` instead of `/colors/[familySlug]` to avoid a Next.js route conflict with `/colors/[brandSlug]/[colorSlug]`. Dynamic segments at the same path level must share parameter names.

### Data Pipeline Separation
Color data processing (import, matching) runs locally via `tsx` scripts, not in the web application. The 222MB match data file is generated locally and seeded to Supabase. This keeps the deployment small and fast.
