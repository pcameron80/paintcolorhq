# Routes & Pages

## All Routes

| Route | Type | Rendering | Description |
|-------|------|-----------|-------------|
| `/` | Page | ISR (1h) | Homepage with hero search, 6-card feature grid, inspiration, brand/family browse |
| `/brands` | Page | ISR (1h) | All brands listing with color counts |
| `/brands/[brandSlug]` | Page | ISR (1h) | Brand detail with all colors in a grid |
| `/colors` | Page | ISR (1h) | Color families index |
| `/colors/[brandSlug]/[colorSlug]` | Page | ISR (1h) | Individual color detail with cross-brand matches |
| `/colors/family/[familySlug]` | Page | ISR (1h) | Colors by family, filterable by brand |
| `/search` | Page | Static | Search page (client-side search component) |
| `/compare` | Page | Static | Side-by-side color comparison (query params) |
| `/match/[src]/[color]-to-[target]` | Page | ISR (1h) | Cross-brand match detail page |
| `/blog` | Page | Static | Blog index with post cards |
| `/blog/[slug]` | Page | SSG | Individual blog post (24 posts) |
| `/inspiration` | Page | ISR (1h) | Curated palette gallery |
| `/inspiration/[slug]` | Page | ISR (1h) | Palette detail with brand filtering |
| `/dashboard` | Page | Dynamic | User's projects list (auth required) |
| `/dashboard/[projectId]` | Page | Dynamic | Project detail with saved colors (auth required) |
| `/auth/login` | Page | Static | Login page |
| `/tools` | Page | Static | Tools hub listing all 3 tools |
| `/tools/paint-calculator` | Page | Static | Paint coverage calculator with HowTo JSON-LD |
| `/tools/color-identifier` | Page | Static | Photo-based color identification with HowTo JSON-LD |
| `/tools/room-visualizer` | Page | Dynamic | Interactive room color preview with HowTo JSON-LD |
| `/auth/callback` | Route | Dynamic | OAuth callback handler |
| `/api/og` | API | Edge | Dynamic OG image generation (1200x630 PNG) |
| `/api/search` | API | Dynamic | Search endpoint: `GET /api/search?q=query` |
| `/api/color-match` | API | Dynamic | Color matching endpoint: `GET /api/color-match?hex=...` |
| `/api/sitemap` | API | Dynamic | Sitemap index XML |
| `/api/sitemap/[id]` | API | Dynamic | Individual sitemap pages (5000 URLs each) |
| `/api/projects/[projectId]` | API | Dynamic | Project CRUD operations |
| `/api/projects/[projectId]/colors` | API | Dynamic | Add/remove colors from projects |

## Page Details

### Homepage (`/`)
- Hero section with tagline and search bar
- 6-card feature grid: Cross-Brand Matching, Room Visualizer, Photo Identifier, Paint Calculator, Undertone Analysis, Inspiration Palettes
- Curated inspiration palette section
- "Browse by Brand" section with top 10 brand cards
- "Browse by Color Family" with colored chips for all 15 families
- "Why Use Paint Color HQ?" SEO section covering all 5 major capabilities
- WebSite JSON-LD schema with SearchAction

### Color Detail (`/colors/[brandSlug]/[colorSlug]`)
**The most important page for SEO and user value.**
- Large color swatch
- Color specs: hex, RGB, LRV, undertone, color family
- Action buttons: "Save to Project" (auth required), "Generate Palette" (links to palette tool with hex pre-filled), "Share" (Web Share API with clipboard fallback)
- Retailer "Buy at" links (Home Depot for Behr/PPG/Glidden, Lowe's for Sherwin-Williams/Valspar, brand websites for Benjamin Moore/Farrow & Ball/Dunn-Edwards)
- Breadcrumb navigation
- Algorithmic color description (2-4 sentences)
- Complementary, analogous, triadic, and split-complementary color harmonies (resolved to real paint colors)
- Curated room palettes based on the color
- "Closest Matches from Other Brands" section:
  - Grouped by brand
  - Top 3 matches per brand shown
  - Each match shows swatch, name, hex, Delta E score with label
  - Links to the matched color's own page
- "Similar [Brand] Colors" section: 6 visually similar colors from the same brand using RGB proximity matching
- Dynamic OG image via `/api/og` endpoint showing color swatch, name, and brand
- WebPage + BreadcrumbList JSON-LD schema

### Brand Detail (`/brands/[brandSlug]`)
- Brand name, color count
- Color family filter chips
- Undertone filter chips (warm/cool/neutral)
- Paginated grid of colors (200 per page) sorted alphabetically
- Each card links to the individual color page
- Previous/Next and numbered page navigation
- `generateStaticParams` pre-renders all 14 brand pages
- Organization JSON-LD schema

### Color Family (`/colors/family/[familySlug]`)
- All colors from all brands in that family
- Sorted alphabetically by name
- Brand filter chips to narrow by brand
- Undertone filter chips (warm/cool/neutral)
- Paginated at 200 colors per page with Previous/Next and numbered page navigation
- `generateStaticParams` pre-renders all 15 family pages

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
- 24 posts statically generated via `generateStaticParams()`
- Cover color hero bar (or optional cover image)
- Article content with inline color swatches, internal links to color pages, brand pages, and tool pages
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

### Tools Hub (`/tools`)
- Grid of 3 tool cards: Paint Calculator, Photo Color Identifier, Room Color Visualizer
- Each card links to the tool page

### Paint Calculator (`/tools/paint-calculator`)
- Room dimension inputs (length, width, height)
- Door and window deductions
- Instant gallon estimate with coat multiplier
- "How We Calculate Paint Coverage" explainer
- HowTo JSON-LD schema (5 steps)

### Photo Color Identifier (`/tools/color-identifier`)
- Upload a photo from device or camera
- Click any spot to sample the pixel color
- Matches against 25,000+ colors using Delta E 2000
- "How It Works" section (3 steps)
- HowTo JSON-LD schema (3 steps)

### Room Color Visualizer (`/tools/room-visualizer`)
- Interactive room scene with clickable regions (walls, accent wall, trim, floor)
- Color picker with hex input
- "Find paint matches" links to closest real paint colors
- URL parameter support for sharing color combinations (e.g. `?walls=D6D0C4&trim=FFFFFF&accent=5B7FA5`)
- Used by inspiration palette pages via "Visualize in Room" links
- "How to Use" section (3 steps)
- HowTo JSON-LD schema (3 steps)

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
| Footer | `components/footer.tsx` | Brand links, family links, resources (tools, blog, inspiration), "Your complete paint color toolkit" tagline |
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
| ShareButton | `components/share-button.tsx` | Share via Web Share API or copy link to clipboard |
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
