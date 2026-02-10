# Deployment

## Hosting

- **Platform**: Vercel
- **Team**: Philip Cameron's Projects
- **Framework**: Auto-detected as Next.js
- **Domain**: https://www.paintcolorhq.com

## Environment Variables

Set in Vercel project settings for all environments (production, preview, development):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |

The `SUPABASE_SERVICE_ROLE_KEY` is only needed locally for seed scripts and is NOT set in Vercel.

## Deploy Workflow

Vercel auto-deploys on every push to `main`:

```bash
git add <files>
git commit -m "message"
git push
# Vercel automatically builds and deploys
```

### Manual Deploy via CLI

```bash
npx vercel --prod
```

## .vercelignore

Excludes large data files from the upload:

```
data/
scripts/
```

The `data/` directory contains a 222MB match data file that would exceed Vercel's 100MB file size limit. Scripts are only needed locally.

## Build Output

```
Route (app)
├ ○ /                           # Static
├ ○ /_not-found                 # Static
├ ƒ /api/search                 # Dynamic
├ ƒ /api/sitemap                # Dynamic
├ ƒ /api/sitemap/[id]           # Dynamic
├ ƒ /brands                     # Dynamic
├ ƒ /brands/[brandSlug]         # Dynamic
├ ƒ /colors                     # Dynamic
├ ƒ /colors/[brandSlug]/[colorSlug]  # Dynamic
├ ƒ /colors/family/[familySlug]      # Dynamic
├ ƒ /compare                    # Dynamic
├ ƒ /match/[...]/[...]-to-[...]      # Dynamic
└ ○ /search                     # Static

○ = Static (prerendered)
ƒ = Dynamic (server-rendered on demand)
```

Build time: ~25 seconds on Vercel.

## GitHub Repository

- **Repo**: `pcameron80/paintcolorhq`
- **Branch**: `main`
- **Connected**: Vercel GitHub integration auto-deploys on push

## Supabase

- **Project**: `dziefzmkcbpeorjawsgg.supabase.co`
- **Region**: (set during project creation)
- **RLS**: Enabled on all tables with public read access
