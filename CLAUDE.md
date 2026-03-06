# PaintColorHQ

Paint color reference and matching website. Helps users explore paint colors across brands, find cross-brand matches, build palettes, and plan painting projects.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Email:** Resend
- **Deployment:** Vercel
- **Scripts:** tsx for running TypeScript scripts

## Project Structure

```
src/
  app/           # Next.js App Router pages and API routes
  components/    # Shared React components
  lib/           # Data queries, utilities, types, Supabase clients
scripts/         # Data pipeline scripts (import, seed, compute matches)
docs/            # Architecture and feature documentation
public/          # Static assets
supabase/        # Supabase config/migrations
```

## Key Files

- `src/lib/queries.ts` - Main database query functions
- `src/lib/types.ts` - TypeScript type definitions
- `src/lib/supabase.ts` - Supabase client (server-side, anon)
- `src/lib/supabase-server.ts` - Supabase server client (with cookies/auth)
- `src/lib/supabase-browser.ts` - Supabase browser client
- `src/lib/color-utils.ts` - Color conversion and distance calculations
- `src/lib/project-queries.ts` - User project/dashboard queries

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - ESLint
- `npm run import-colors` - Import color data from source files
- `npm run seed-db` - Seed database
- `npm run compute-matches` - Compute cross-brand color matches
- `npm run seed-matches` - Seed match data to DB
- `npm run populate-undertones` - Populate undertone data

## Key Routes

- `/colors/[brandSlug]/[colorSlug]` - Individual color page
- `/colors/family/[familySlug]` - Colors by family
- `/match/[sourceBrandSlug]/[colorSlug]-to-[targetBrandSlug]` - Cross-brand match
- `/compare` - Color comparison tool
- `/brands/[brandSlug]` - Brand page
- `/inspiration/[slug]` - Curated palette pages
- `/tools/*` - Interactive tools (palette generator, room visualizer, paint calculator, color identifier)
- `/dashboard/[projectId]` - User painting projects
- `/search` - Color search

## Database

Supabase PostgreSQL with tables for brands, colors, cross_brand_matches, and user projects. See `docs/database.md` for schema details.

## Environment Variables

Defined in `.env.local` (not committed). See `.env.local.example` for required keys. Includes Supabase URL/keys and Resend API key.

## Conventions

- Server components by default; client components only when needed (interactivity, hooks)
- Data fetching via `src/lib/queries.ts` using Supabase client
- SEO-focused: pages have generateMetadata, structured data, and sitemap generation
- Color matching uses Delta E (CIE2000) color difference algorithm
- Slugs are used for all public-facing URLs
