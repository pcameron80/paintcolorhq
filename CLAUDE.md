# PaintColorHQ

Paint color reference and matching website. Helps users explore paint colors across brands, find cross-brand matches, build palettes, and plan painting projects.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Email:** Resend
- **Deployment:** Vercel
- **Analytics:** GA4 (G-056NR93JLK) with custom event tracking
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
- `src/lib/analytics.ts` - GA4 event tracking functions + detectPageType()
- `src/lib/color-description.ts` - Auto-generated color page descriptions
- `src/lib/brand-content.tsx` - Brand-specific editorial content + subtitles
- `src/lib/family-content.tsx` - All 15 color family editorial content
- `src/lib/palettes.ts` - 18 curated inspiration palettes
- `src/lib/blog-posts.tsx` - Blog post definitions + getRelatedPosts()
- `src/lib/supabase.ts` - Supabase client (server-side, anon)
- `src/lib/supabase-server.ts` - Supabase server client (with cookies/auth)
- `src/lib/supabase-browser.ts` - Supabase browser client
- `src/lib/color-utils.ts` - Color conversion and distance calculations
- `src/lib/project-queries.ts` - User project/dashboard queries
- `src/components/analytics-provider.tsx` - Global scroll/time/click tracking
- `src/components/track-page.tsx` - Per-page enriched page view tracking
- `src/components/tracked-link.tsx` - CTA click tracking wrapper
- `src/components/tool-cross-sell.tsx` - Reusable cross-tool navigation grid

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

- `/colors/[brandSlug]/[colorSlug]` - Individual color page (Product schema)
- `/colors/family/[familySlug]` - Colors by family (CollectionPage schema)
- `/match/[sourceBrandSlug]/[matchSlug]` - Cross-brand match (parsed via regex)
- `/match/[sourceBrandSlug]/to/[targetBrandSlug]` - Brand-to-brand match listing
- `/compare` - Color comparison tool (Delta E verdict)
- `/brands/[brandSlug]` - Brand page (Organization schema)
- `/inspiration/[slug]` - Curated palette pages (CreativeWork schema)
- `/tools/*` - Interactive tools (palette generator, room visualizer, paint calculator, color identifier)
- `/dashboard/[projectId]` - User painting projects
- `/search` - Color search (noindex on ?q= params)
- `/blog/[slug]` - Blog posts (BlogPosting schema)

## Database

Supabase PostgreSQL with tables for brands, colors, cross_brand_matches, and user projects. See `docs/database.md` for schema details.

## Environment Variables

Defined in `.env.local` (not committed). See `.env.local.example` for required keys. Includes Supabase URL/keys and Resend API key.

## GA4 Custom Events

- `page_view_enriched` - Fired on every page via TrackPage with page_type, brand, family params
- `scroll_depth` - Custom 25/50/90% milestones (not GA4 built-in scroll)
- `time_on_page` - Dwell time buckets: 30s, 60s, 120s, 300s
- `color_swatch_click` - Color card clicks via event delegation
- `color_search` - Search queries with search_term + result_count
- `color_compare` - Compare tool usage (was color_search, renamed March 18)
- `tool_use` - Tool engagement: open/use/complete with tool_name
- `retailer_click` - Outbound retailer link clicks
- `cta_click` - CTA button clicks via TrackedLink component

## Conventions

- Server components by default; client components only when needed (interactivity, hooks)
- Data fetching via `src/lib/queries.ts` using Supabase client
- SEO-focused: pages have generateMetadata, structured data, and sitemap generation
- GEO-focused: citeable summary paragraphs, server-rendered key facts, FAQPage schema
- Color matching uses Delta E (CIE2000) color difference algorithm
- Delta E displayed as plain language ("Nearly identical" / "Very similar" / "Visible difference") — NOT raw numbers
- Slugs are used for all public-facing URLs
- Match page uses `[matchSlug]` single param parsed via regex (NOT compound `[a]-to-[b]` segments — Next.js 16 bug)
- Brand/family pages use perPage=60 (not 200)
- All tool pages include ToolCrossSell component and FAQPage schema
- AnalyticsProvider must load AFTER gtag scripts in layout.tsx (race condition fix)
