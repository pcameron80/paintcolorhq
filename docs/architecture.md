# Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
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
│   │   ├── layout.tsx          # Root layout (metadata, fonts, GA, AdSense)
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
│   │   ├── header.tsx          # Sticky nav with auth state
│   │   ├── footer.tsx          # Footer with links
│   │   ├── mobile-nav.tsx      # Mobile slide-out nav
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
│       ├── color-description.ts # Algorithmic SEO descriptions for color pages
│       └── retailer-links.ts   # Brand-to-retailer URL mapping
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

**Note**: Pages that use the Header component (which calls `cookies()` for auth state) fall back to dynamic rendering on-demand but are still cached for the revalidation period. This is expected behavior.

### Two Supabase Clients

1. **`supabase.ts`** — Public client for read-only queries. Uses ISR-compatible fetch config. Used by `queries.ts` for all public data fetching.
2. **`supabase-server.ts`** — Auth-aware server client using `cookies()`. Used for auth checks in the Header and for dashboard/project operations.

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
