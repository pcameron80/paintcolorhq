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
git push origin main
# Vercel automatically builds and deploys
```

SSH key (ed25519) is configured for pushes to `git@github.com:pcameron80/paintcolorhq.git`.

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
├ ○ /                                    # ISR (revalidate: 3600)
├ ○ /_not-found                          # Static
├ ƒ /api/search                          # Dynamic
├ ƒ /api/sitemap                         # Dynamic
├ ƒ /api/sitemap/[id]                    # Dynamic
├ ƒ /api/projects/[projectId]            # Dynamic
├ ƒ /api/projects/[projectId]/colors     # Dynamic
├ ○ /auth/login                          # Static
├ ƒ /auth/callback                       # Dynamic
├ ○ /blog                                # Static
├ ○ /blog/[slug]                         # SSG (10 posts)
├ ○ /brands                              # ISR (revalidate: 3600)
├ ○ /brands/[brandSlug]                  # ISR (revalidate: 3600)
├ ○ /colors                              # ISR (revalidate: 3600)
├ ○ /colors/[brandSlug]/[colorSlug]      # ISR (revalidate: 3600)
├ ○ /colors/family/[familySlug]          # ISR (revalidate: 3600)
├ ○ /compare                             # Static
├ ƒ /dashboard                           # Dynamic (auth required)
├ ƒ /dashboard/[projectId]               # Dynamic (auth required)
├ ○ /inspiration                         # ISR (revalidate: 3600)
├ ○ /inspiration/[slug]                  # ISR (revalidate: 3600)
├ ○ /match/[...]/[...]-to-[...]         # ISR (revalidate: 3600)
└ ○ /search                              # Static

○ = Static / ISR    ƒ = Dynamic (server-rendered on demand)
```

## GitHub Repository

- **Repo**: `pcameron80/paintcolorhq`
- **Branch**: `main`
- **Connected**: Vercel GitHub integration auto-deploys on push

## Supabase

- **Project**: `dziefzmkcbpeorjawsgg.supabase.co`
- **Region**: (set during project creation)
- **RLS**: Enabled on all tables with public read access

## Analytics & Monetization

- **Google Analytics 4**: Measurement ID `G-056NR93JLK` (loaded in root layout)
- **Google AdSense**: Publisher ID `ca-pub-6269963973031881` (loaded in root layout)
