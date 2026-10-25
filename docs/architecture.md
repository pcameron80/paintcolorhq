# Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.4.2 |
| Runtime | React | 19.2.3 |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth (Google OAuth) | - |
| Styling | Tailwind CSS | 4 |
| Language | TypeScript | 5 |
| Hosting | Vercel | - |
| Scripts | tsx | 4.21 |

## Project Structure

```
paintcolorhq/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (metadata, fonts, GA)
│   │   ├── page.tsx            # Homepage (feature grid, SEO section)
│   │   ├── globals.css         # Tailwind global styles
│   │   ├── not-found.tsx       # Custom 404 page
│   │   ├── api/
│   │   │   ├── og/route.tsx           # Dynamic OG image generation (edge)
│   │   │   ├── search/route.ts       # GET /api/search?q=...
│   │   │   ├── sitemap/
│   │   │   │   ├── route.ts          # Sitemap index XML
│   │   │   │   └── [id]/route.ts     # Sitemap pages XML
│   │   │   ├── color-match/route.ts  # GET /api/color-match?hex=...
│   │   │   └── projects/             # Project CRUD API routes
│   │   │       └── [projectId]/
│   │   │           ├── route.ts      # Project operations
│   │   │           └── colors/route.ts # Add/remove project colors
│   │   ├── auth/
│   │   │   ├── login/page.tsx        # Login page
│   │   │   └── callback/route.ts     # OAuth callback
│   │   ├── brands/
│   │   │   ├── page.tsx              # All brands listing
│   │   │   └── [brandSlug]/page.tsx  # Brand detail
│   │   ├── colors/
│   │   │   ├── page.tsx              # Color families index
│   │   │   ├── [brandSlug]/
│   │   │   │   └── [colorSlug]/page.tsx  # Color detail + matches
│   │   │   └── family/
│   │   │       └── [familySlug]/page.tsx # Colors by family
│   │   ├── tools/
│   │   │   ├── page.tsx              # Tools hub
│   │   │   ├── paint-calculator/page.tsx  # Paint coverage calculator
│   │   │   ├── color-identifier/
│   │   │   │   ├── page.tsx          # Photo color identifier
│   │   │   │   └── identifier.tsx    # Client component
│   │   │   └── room-visualizer/
│   │   │       ├── page.tsx          # Room color visualizer
│   │   │       └── visualizer.tsx    # Client component
│   │   ├── search/
│   │   │   ├── page.tsx              # Search page
│   │   │   └── search-results.tsx    # Client component
│   │   ├── compare/page.tsx          # Color comparison
│   │   ├── match/
│   │   │   └── [sourceBrandSlug]/
│   │   │       └── [colorSlug]-to-[targetBrandSlug]/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx              # Blog index
│   │   │   └── [slug]/page.tsx       # Blog post
│   │   ├── inspiration/
│   │   │   ├── page.tsx              # Inspiration gallery
│   │   │   └── [slug]/page.tsx       # Palette detail
│   │   └── dashboard/
│   │       ├── page.tsx              # User's projects
│   │       └── [projectId]/page.tsx  # Project detail
│   ├── components/
│   │   ├── header.tsx          # Sticky nav (static server component)
│   │   ├── auth-button.tsx     # Client-side auth display (Sign in / UserMenu)
│   │   ├── footer.tsx          # Footer with links
│   │   ├── mobile-nav.tsx      # Mobile slide-out nav (client, self-manages auth)
│   │   ├── color-card.tsx      # Color grid card
│   │   ├── color-swatch.tsx    # Color swatch display
│   │   ├── hero-search.tsx     # Homepage hero section
│   │   ├── inspiration-section.tsx # Homepage featured palettes
│   │   ├── complementary-colors.tsx # Color harmonies
│   │   ├── curated-palettes.tsx # Room palette suggestions
│   │   ├── save-to-project.tsx # Save color to project
│   │   ├── share-button.tsx   # Share via Web Share API / clipboard
│   │   ├── brand-picker.tsx    # Brand filter dropdown
│   │   ├── user-menu.tsx       # Auth user dropdown
│   │   ├── add-palette-to-project.tsx # Save palette to project
│   │   ├── rename-project.tsx  # Inline project rename
│   │   ├── create-project-form.tsx # New project form
│   │   ├── delete-project-button.tsx # Delete project
│   │   └── remove-color-button.tsx # Remove color from project
│   └── lib/
│       ├── types.ts            # TypeScript interfaces
│       ├── supabase.ts         # Supabase client (public, ISR-compatible)
│       ├── supabase-server.ts  # Supabase server client (auth, cookies)
│       ├── queries.ts          # Database query functions
│       ├── project-queries.ts  # Project-specific queries
│       ├── blog-posts.tsx      # Blog post data + JSX content (24 posts)
│       ├── palettes.ts         # Curated inspiration palette data
│       ├── color-description.ts # Data-derived color meta, lede and per-brand matches (no templated prose)
│       ├── retailer-links.ts   # Brand-to-retailer URL mapping with override lookups
│       ├── retailer-overrides.ts # Auto-generated SW/Dunn-Edwards/Kilz/RAL not-found sets
│       └── official-urls/      # Per-color brand URLs from sitemaps (PPG, Valspar, Dutch Boy, Vista)
├── scripts/                    # Data pipeline scripts
│   ├── import-colors.ts        # Parse ColorNerd JSON
│   ├── seed-database.ts        # Upload colors to Supabase
│   ├── compute-matches.ts      # Calculate Delta E matches
│   ├── seed-matches.ts         # Upload matches to Supabase
│   ├── check-retailer-links.ts # Verify retailer URLs against brand websites
│   ├── generate-retailer-overrides.ts # Generate retailer-overrides.ts from check results
│   ├── generate-official-color-urls.ts # Build official-urls/*.json from brand sitemaps
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
│   ├── robots.txt              # SEO robots file
│   ├── og-image.webp           # OpenGraph default image
│   └── logo.png                # Site logo
├── docs/                       # Project documentation
├── next.config.ts              # Sitemap rewrites (/sitemap.xml, /sitemap/:id.xml)
├── package.json
└── .vercelignore               # Excludes data/ and scripts/ from deploy
```

## Design Decisions

### ISR (Incremental Static Regeneration)

Public pages use `revalidate = 3600` (1 hour) for ISR instead of `force-dynamic`. This allows Vercel to cache rendered HTML at the edge and only re-render when stale.

The Supabase client's fetch is configured with `next: { revalidate: 3600 }` to match:

```typescript
export const supabase = createClient(url, key, {
  global: {
    fetch: (url, init) =>
      fetch(url, { ...init, next: { revalidate: 3600 } }),
  },
});
```

The Header component is a static server component — it does **not** call `cookies()` or use any dynamic APIs. Auth state is handled client-side by `AuthButton` and `MobileNav` using `createSupabaseBrowserClient()`. This ensures the Header never forces pages into dynamic rendering.

### Three Supabase Clients

1. **`supabase.ts`** — Public client for read-only queries. Uses ISR-compatible fetch config. Used by `queries.ts` for all public data fetching.
2. **`supabase-server.ts`** — Auth-aware server client using `cookies()`. Used for dashboard/project operations and auth routes (login, callback, logout).
3. **`supabase-browser.ts`** — Browser client for client-side auth checks. Used by `AuthButton` and `MobileNav` to display auth state without forcing server-side dynamic rendering.

### Blog as TSX Functions

Blog posts are stored in `src/lib/blog-posts.tsx` as metadata + JSX content functions (not MDX or a CMS). This allows:
- Inline color swatches as React components
- Internal `<Link>` components to color/brand pages
- Tailwind styling with full control
- Static generation via `generateStaticParams()`
- No external dependencies

### Route Structure
Color family pages are at `/colors/family/[familySlug]` instead of `/colors/[familySlug]` to avoid a Next.js route conflict with `/colors/[brandSlug]/[colorSlug]`. Dynamic segments at the same path level must share parameter names.

### Data Pipeline Separation
Color data processing (import, matching) runs locally via `tsx` scripts, not in the web application. The 222MB match data file is generated locally and seeded to Supabase. This keeps the deployment small and fast.

### Inspiration Palettes
Curated palettes are defined in `src/lib/palettes.ts` as arrays of hex values. At render time, each hex is resolved to the closest real paint color using `findClosestColor()`. Brand filtering lets users see matches from a specific brand.

### Project Color Roles
When saving colors to projects, users assign roles (Walls, Trim, Accent, Pop). Colors are grouped by role in the project view, providing a structured palette planning experience.

### Ads and the Page CSP
Google AdSense was removed in October 2026 (the account was rejected), along with the Pinterest tag. Journey by Mediavine is the ad path. `AdSenseScript` in `src/components/adsense-script.tsx` renders nothing until its 25 imports are deleted.

The page CSP in `next.config.ts` restricts by scheme (`https:`, `data:`, `blob:`), not by host, because an ad stack loads scripts, frames, workers and beacons from hosts that change. The old host allowlist blocked 9 of 9 Journey components in a live probe. The scheme-based policy keeps `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and `frame-ancestors 'self'`. Only the `/embed` routes still use the host allowlist (`strictContentSecurityPolicy`), with `frame-ancestors *` so other sites can iframe the widget.
