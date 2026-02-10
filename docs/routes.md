# Routes & Pages

## All Routes

| Route | Type | Rendering | Description |
|-------|------|-----------|-------------|
| `/` | Page | ISR (1h) | Homepage with hero search, inspiration, brand/family browse |
| `/brands` | Page | ISR (1h) | All brands listing with color counts |
| `/brands/[brandSlug]` | Page | ISR (1h) | Brand detail with all colors in a grid |
| `/colors` | Page | ISR (1h) | Color families index |
| `/colors/[brandSlug]/[colorSlug]` | Page | ISR (1h) | Individual color detail with cross-brand matches |
| `/colors/family/[familySlug]` | Page | ISR (1h) | Colors by family, filterable by brand |
| `/search` | Page | Static | Search page (client-side search component) |
| `/compare` | Page | Static | Side-by-side color comparison (query params) |
| `/match/[src]/[color]-to-[target]` | Page | ISR (1h) | Cross-brand match detail page |
| `/blog` | Page | Static | Blog index with post cards |
| `/blog/[slug]` | Page | SSG | Individual blog post |
| `/inspiration` | Page | ISR (1h) | Curated palette gallery |
| `/inspiration/[slug]` | Page | ISR (1h) | Palette detail with brand filtering |
| `/dashboard` | Page | Dynamic | User's projects list (auth required) |
| `/dashboard/[projectId]` | Page | Dynamic | Project detail with saved colors (auth required) |
| `/auth/login` | Page | Static | Login page |
| `/auth/callback` | Route | Dynamic | OAuth callback handler |
| `/api/search` | API | Dynamic | Search endpoint: `GET /api/search?q=query` |
| `/api/sitemap` | API | Dynamic | Sitemap index XML |
| `/api/sitemap/[id]` | API | Dynamic | Individual sitemap pages (5000 URLs each) |
| `/api/projects/[projectId]` | API | Dynamic | Project CRUD operations |
| `/api/projects/[projectId]/colors` | API | Dynamic | Add/remove colors from projects |

## Page Details

### Homepage (`/`)
- Hero section with tagline and search bar
- Curated inspiration palette section
- "Browse by Brand" section with top 10 brand cards
- "Browse by Color Family" with colored chips for all 15 families
- WebSite JSON-LD schema with SearchAction

### Brand Detail (`/brands/[brandSlug]`)
- Brand name, color count
- Color family filter chips
- Grid of all colors with swatches, names, and hex codes
- Each card links to the individual color page
- Organization JSON-LD schema

### Color Detail (`/colors/[brandSlug]/[colorSlug]`)
**The most important page for SEO and user value.**
- Large color swatch
- Color specs: hex, RGB, LRV, color family
- "Save to Project" button (auth required)
- Breadcrumb navigation
- Complementary, analogous, and triadic color harmonies (resolved to real paint colors)
- Curated room palettes based on the color
- "Closest Matches from Other Brands" section:
  - Grouped by brand
  - Top 3 matches per brand shown
  - Each match shows swatch, name, hex, Delta E score with label
  - Links to the matched color's own page
- Product JSON-LD schema

### Color Family (`/colors/family/[familySlug]`)
- All colors from all brands in that family
- Sorted by LRV (lightness, descending)
- Brand filter chips to narrow by brand
- 200 color limit per page

### Search (`/search`)
- Client-side search component (`search-results.tsx`)
- Calls `/api/search?q=...` with debounced input
- Supports color name, color number, and hex code search
- Results display as color cards

### Compare (`/compare`)
- URL params: `?color1=uuid&color2=uuid`
- Side-by-side swatches
- Specs comparison table
- Delta E distance between the two colors

### Match Page (`/match/[sourceBrandSlug]/[colorSlug]-to-[targetBrandSlug]`)
- Shows a source color and its closest match in a specific target brand
- Side-by-side display
- Delta E confidence score
- Disclaimer about digital vs physical matches

### Blog Index (`/blog`)
- Grid of post cards (newest first)
- Each card: cover color accent, title, formatted date, excerpt, tag pills
- Blog JSON-LD schema

### Blog Post (`/blog/[slug]`)
- Statically generated via `generateStaticParams()`
- Cover color hero bar
- Article content with inline color swatches, internal links
- Prev/Next post navigation
- BlogPosting JSON-LD schema

### Inspiration Gallery (`/inspiration`)
- Grid of 18 curated palette cards
- Each card shows 5 color swatches resolved to real paint colors

### Inspiration Detail (`/inspiration/[slug]`)
- Full palette with 5 colors
- Brand filter dropdown to match to a specific brand
- Each color shows swatch, closest paint match, Delta E score
- "Save to Project" integration
- Palette roles: Walls / Trim / Accent / Pop / Feature

### Dashboard (`/dashboard`)
- Requires authentication (redirects to login)
- List of user's projects with color strip previews
- Create project form
- Delete project button
- noindex/nofollow

### Project Detail (`/dashboard/[projectId]`)
- Requires authentication
- Breadcrumb: My Projects / [Name]
- Rename project inline
- Palette preview strip
- Colors grouped by role (Walls, Trim, Accent, Pop)
- Remove color button per color
- noindex/nofollow

## Components

| Component | File | Description |
|-----------|------|-------------|
| Header | `components/header.tsx` | Sticky nav with brand/colors/inspiration/blog/search links, auth state |
| Footer | `components/footer.tsx` | Brand links, family links, resources (blog, inspiration) |
| MobileNav | `components/mobile-nav.tsx` | Slide-out mobile navigation |
| ColorCard | `components/color-card.tsx` | Color grid card with swatch, name, hex |
| ColorSwatch | `components/color-swatch.tsx` | Color swatch circle (sm/md/lg/xl) |
| HeroSearch | `components/hero-search.tsx` | Homepage hero with search bar |
| InspirationSection | `components/inspiration-section.tsx` | Featured palettes on homepage |
| SaveToProject | `components/save-to-project.tsx` | Dropdown to save a color to a project |
| UserMenu | `components/user-menu.tsx` | Authenticated user dropdown menu |
| BrandPicker | `components/brand-picker.tsx` | Brand filter dropdown for inspiration pages |
| ComplementaryColors | `components/complementary-colors.tsx` | Color harmony display |
| CuratedPalettes | `components/curated-palettes.tsx` | Room palette suggestions |
| RenameProject | `components/rename-project.tsx` | Inline project rename |
| CreateProjectForm | `components/create-project-form.tsx` | New project creation |
| DeleteProjectButton | `components/delete-project-button.tsx` | Project deletion with confirmation |
| RemoveColorButton | `components/remove-color-button.tsx` | Remove color from project |
| AddPaletteToProject | `components/add-palette-to-project.tsx` | Save entire palette to project |

## TypeScript Types

Defined in `src/lib/types.ts`:

```typescript
Brand         // id, name, slug, website_url, logo_url, color_count, description
Color         // id, brand_id, name, slug, hex, rgb, lab, lrv, color_family...
ColorWithBrand    // Color + { brand: Brand }
CrossBrandMatch   // id, source_color_id, match_color_id, delta_e_score, rank
CrossBrandMatchWithColor  // CrossBrandMatch + { match_color: ColorWithBrand }
ColorFamily       // id, name, slug, description, display_order
```
