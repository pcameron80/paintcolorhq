# Development Guide

## Prerequisites

- Node.js 20+
- npm
- A Supabase project with the schema applied

## Local Setup

```bash
# Clone the repo
git clone https://github.com/pcameron80/paintcolorhq.git
cd paintcolorhq

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The `SUPABASE_SERVICE_ROLE_KEY` is only needed for running seed scripts.

## Running the Dev Server

```bash
npm run dev
```

Opens at http://localhost:3000 (Turbopack enabled by default in Next.js 16).

## Running the Data Pipeline

If setting up from scratch or refreshing data:

```bash
# 1. Clone the ColorNerd dataset (if not present)
git clone https://github.com/jpederson/colornerd.git data/colornerd

# 2. Process raw color data
npm run import-colors

# 3. Apply database schema
# Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor

# 4. Seed colors to database
npm run seed-db

# 5. Compute cross-brand matches (~2 minutes)
npm run compute-matches

# 6. Seed matches to database (~5 minutes)
npm run seed-matches
```

## npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start dev server with Turbopack |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint |
| `import-colors` | `tsx scripts/import-colors.ts` | Process ColorNerd data |
| `seed-db` | `tsx scripts/seed-database.ts` | Seed colors to Supabase |
| `compute-matches` | `tsx scripts/compute-matches.ts` | Calculate Delta E matches |
| `seed-matches` | `tsx scripts/seed-matches.ts` | Seed matches to Supabase |

## Common Tasks

### Adding a New Brand

1. Add the brand's color data to `data/colornerd/` in the expected JSON format
2. Update the brand mapping in `scripts/import-colors.ts`
3. Re-run the full pipeline:
   ```bash
   npm run import-colors
   npm run seed-db
   npm run compute-matches  # Recomputes ALL matches
   npm run seed-matches
   ```

### Adding a Blog Post

1. Edit `src/lib/blog-posts.tsx`
2. Add a new entry to the `posts` array with metadata and a `content()` JSX function
3. The post is automatically included in the blog index, sitemap, and static generation

### Adding an Inspiration Palette

1. Edit `src/lib/palettes.ts`
2. Add a new palette with name, slug, description, and 5 hex colors
3. Colors are automatically resolved to the closest real paint colors at render time

### Verifying / Refreshing Retailer Links

PPG, Valspar, Dutch Boy and Vista links come from each brand's own sitemap, not from guessing. Refresh them quarterly (about 5 minutes; PPG fetches about 150 pages at 1 request per second), review the diff in `src/lib/official-urls/`, then sample:

```bash
npx tsx scripts/generate-official-color-urls.ts            # all four, or name brands
npx tsx scripts/check-retailer-links.ts --sample 10 1000   # 200 + same path + name in <title>
```

The maps are keyed by our `color_number`. A color missing from a map has no page on the brand site (retired, or a code that names a different color there) and gets no official link. Farrow & Ball links are built from the name (`/us/paint/<name>`); Hirshfield's has no per-color pages, so it links to its color library.

Sherwin-Williams, Dunn-Edwards, Kilz and RAL still use the probe-and-override flow below. SW serves a color under any live family segment, so its link only has to name one of the eight in its sitemap (`white` replaced `white-and-pastel` in 2026).

```bash
# 1. Check all colors for a brand (probes each URL, tries all families on failure)
npx tsx scripts/check-retailer-links.ts sherwin-williams 150

# 2. Generate the TypeScript override file from all JSON results
npx tsx scripts/generate-retailer-overrides.ts
```

**How it works:**
- `check-retailer-links.ts` fetches every color from Supabase, builds a URL using our best-guess family mapping, then sends a HEAD request. If the guess fails (non-200), it tries all other families for that brand. Results are saved to `scripts/retailer-links-{brand}.json`.
- `generate-retailer-overrides.ts` reads those JSON files and generates `src/lib/retailer-overrides.ts` with `Record<string, string>` maps keyed by color number.
- Colors not found on any family are added to a `NOT_FOUND` set so the direct link is skipped (fallback to retailer search where available).

**Official-page coverage (2026-10-24, from the sitemaps):**

| Brand | Colors | Linked to the color's page | No page on the brand site |
|-------|--------|----------------------------|---------------------------|
| PPG (pittsburghpaints.com) | 3,261 | 3,185 | 76 |
| Valspar | 2,358 | 1,596 | 762 |
| Dutch Boy | 1,441 | 1,316 | 125 |
| Vista Paint | 2,984 | 2,881 | 103 |
| Farrow & Ball | 167 | 167 | 0 |

### Clearing the Build Cache

If pages show stale data after changes:

```bash
rm -rf .next
npm run dev
```

### Checking for Port Conflicts

If `npm run dev` starts on a different port, check for stale processes:

```bash
lsof -i :3000  # Check what's using port 3000
```

## Key Library Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Public Supabase client with ISR-compatible fetch |
| `src/lib/supabase-server.ts` | Auth-aware Supabase client using cookies |
| `src/lib/queries.ts` | All public database queries (brands, colors, families, matches) |
| `src/lib/project-queries.ts` | Auth-gated project queries |
| `src/lib/blog-posts.tsx` | Blog post data + JSX content functions |
| `src/lib/palettes.ts` | Curated inspiration palette definitions |
| `src/lib/retailer-links.ts` | Brand-to-retailer URL mapping with verified override lookups |
| `src/lib/retailer-overrides.ts` | Auto-generated SW, Dunn-Edwards, Kilz and RAL not-found sets (do not edit manually) |
| `src/lib/types.ts` | TypeScript interfaces for all data models |

## Known Gotchas

1. **Supabase 1000-row limit**: Default `max_rows` is 1000. Always paginate when querying more than 1000 rows (see `getAllColorSlugs()` in `queries.ts`).

2. **ISR + Supabase fetch**: The Supabase client must use `next: { revalidate: 3600 }` (not `cache: 'no-store'`) for pages with `revalidate` to build successfully. Using `no-store` causes a build error because it conflicts with static generation.

3. **Header uses cookies()**: The Header component calls `createSupabaseServerClient()` which uses `cookies()` for auth state. This causes all pages using the Header to fall back to dynamic rendering on-demand (not prerendered at build time). Pages are still cached via ISR for the revalidation period.

4. **Route conflicts**: Dynamic segments at the same path level must share parameter names. Color family pages are at `/colors/family/[familySlug]` to avoid conflicting with `/colors/[brandSlug]/[colorSlug]`.

5. **AdSense script**: Must use a raw `<script>` tag, not Next.js `<Script>` component, for crawler verification to work.

6. **Large data files**: `data/cross-brand-matches.json` is 222MB. It's gitignored and excluded from Vercel deploys via `.vercelignore`.

7. **Color slugs include numbers**: The import script generates slugs like `edgecomb-gray-hc-173` (includes color number), not just `edgecomb-gray`. Don't try to construct color URLs from just the color name.

8. **Dark mode CSS**: The default Next.js template includes a `prefers-color-scheme: dark` media query in `globals.css`. This was removed because the site is light-only. If regenerating styles, make sure dark mode CSS is not reintroduced.

9. **generateStaticParams and Supabase**: Do NOT add `generateStaticParams` to pages with thousands of entries (e.g., color detail pages with 25K+ URLs). The concurrent requests overwhelm Supabase during Vercel builds, causing 500 errors. Only use it for small page sets (brands: 14 pages, families: 15 pages, blog posts: 24 pages). ISR handles on-demand generation fine for high-volume routes.

10. **Behr duplicate colors**: The source data contained duplicates from zero-padded vs non-padded color numbers (e.g., PPU14-05 vs PPU14-5). These were cleaned via `scripts/fix-behr-dupes.ts`. If re-seeding, duplicates may recur.

## Project Dependencies

### Production
- `next` 16.1.6 - React framework
- `react` / `react-dom` 19.2.3 - UI library
- `@supabase/supabase-js` 2.95.3 - Database client
- `@supabase/ssr` - Server-side Supabase with cookie handling

### Development
- `typescript` 5 - Type safety
- `tailwindcss` 4 + `@tailwindcss/postcss` - Styling
- `tsx` 4.21 - TypeScript script runner
- `dotenv` 17.2.4 - Environment variable loading for scripts
- `eslint` 9 + `eslint-config-next` - Linting
