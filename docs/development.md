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

## Known Gotchas

1. **Supabase 1000-row limit**: Default `max_rows` is 1000. Always paginate when querying more than 1000 rows (see `getAllColorSlugs()` in `queries.ts`).

2. **Next.js fetch cache**: Next.js caches `fetch()` responses, breaking Supabase pagination. The Supabase client uses `cache: 'no-store'` to disable this.

3. **Route conflicts**: Dynamic segments at the same path level must share parameter names. Color family pages are at `/colors/family/[familySlug]` to avoid conflicting with `/colors/[brandSlug]/[colorSlug]`.

4. **AdSense script**: Must use a raw `<script>` tag, not Next.js `<Script>` component, for crawler verification to work.

5. **Large data files**: `data/cross-brand-matches.json` is 222MB. It's gitignored and excluded from Vercel deploys via `.vercelignore`.

## Project Dependencies

### Production
- `next` 16.1.6 - React framework
- `react` / `react-dom` 19.2.3 - UI library
- `@supabase/supabase-js` 2.95.3 - Database client

### Development
- `typescript` 5 - Type safety
- `tailwindcss` 4 + `@tailwindcss/postcss` - Styling
- `tsx` 4.21 - TypeScript script runner
- `dotenv` 17.2.4 - Environment variable loading for scripts
- `eslint` 9 + `eslint-config-next` - Linting
