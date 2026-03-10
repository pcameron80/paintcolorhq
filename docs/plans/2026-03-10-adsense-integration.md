# AdSense Integration Plan

**Status:** Pending AdSense approval. Implement when approved.

**Goal:** Add Google AdSense ads to the site with manual placement for controlled UX and minimal impact on Core Web Vitals.

**AdSense Publisher ID:** ca-pub-6269963973031881 (script already in layout.tsx)

---

## Approach

Manual placement (not Auto Ads) to control UX, prevent layout shift, and avoid SEO penalties.

## Component

Create a reusable `AdUnit` client component at `src/components/ad-unit.tsx`:
- Renders `<ins class="adsbygoogle">` tag
- Calls `adsbygoogle.push({})` via useEffect on mount
- Reserves space with fixed min-height to prevent CLS
- Props: `slot` (ad unit ID from AdSense), `format`, `className`

## Placements

Start with 4 placements across 3 page types:

| Page | Position | Notes |
|---|---|---|
| Color detail | After description, before Complementary Colors section | Natural content break, below the fold |
| Color detail | Between Cross-Brand Matches and Similar Colors sections | Deep scroll position, engaged users |
| Brand listing | Below color grid, above pagination | End of content, non-intrusive |
| Search results | After results grid | Doesn't interrupt search flow |

## Rules

- No ads above the fold
- Max 2-3 ads per page
- Fixed dimensions to prevent CLS (layout shift)
- No interstitials or sticky ads
- No ads on utility pages (/about, /contact, /privacy, /terms)
- Test CLS with Lighthouse before deploying
