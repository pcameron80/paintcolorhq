# Monetization & Analytics

## Google Analytics

Google Analytics 4 is installed via gtag.js in the root layout (`src/app/layout.tsx`).

- **Measurement ID**: `G-056NR93JLK`
- **Script**: Loaded via `<script>` tag in `<head>`
- **Scope**: All pages (site-wide)

## Display Ads

### Status (October 2026)

- **Google AdSense is removed.** The account (`ca-pub-6269963973031881`) was rejected on 2026-06-14 and never re-applied. `AdSenseScript` in `src/components/adsense-script.tsx` renders nothing; the 25 pages that import it get cleaned up in a later PR. The loader had cost 205-375 KB per page on those templates and earned nothing.
- **The Pinterest tag is removed** from `src/components/cookie-consent.tsx`. Pinterest sent 0 GA4 sessions in October 2026. The Pinterest save button and pin images are unaffected; they need no script.
- **Journey by Mediavine is the ad path.** Its entry bar is 1,000 sessions/month. Journey must be the only ad provider on the page, which is a second reason the AdSense loader had to go.
- `public/ads.txt` still carries the AdSense line. Journey supplies its own ads.txt on install day.

### Content Security Policy

The page CSP in `next.config.ts` restricts by scheme (`https:`, `data:`, `blob:`) instead of by host. Journey's wrapper, Grow, GPT, Prebid, its bidders, video and a blob worker load from hosts that change, and the old host allowlist blocked 9 of 9 of them in a live probe. Listing only the wrapper host would let the page render while bids drop silently.

Do not reintroduce a host allowlist on pages that show ads. The `/embed` routes keep the strict allowlist (`strictContentSecurityPolicy`) because the widget runs on other sites and shows no ads.

### Ad Placement

Journey's script wrapper places the ad units, configured in the Mediavine dashboard, so there are no per-slot ad components in this repo. The wrapper script, ads.txt, the Mediavine privacy section and the consent prompt land in the Journey install-day change.

### Revenue Projections

Home improvement display ad RPMs are typically $15-25+. Based on competitor data:

| Monthly Pageviews | Est. Monthly Revenue |
|-------------------|---------------------|
| 10,000 | $150-250 |
| 50,000 | $750-1,250 |
| 100,000 | $1,500-2,500 |
| 500,000 | $7,500-12,500 |

## Retailer Links

Color detail pages show "Buy at" links that take users to retailer search pages for the paint color. Currently these are standard links (not affiliate links); affiliate tracking parameters can be added later.

### Brand-to-Retailer Mapping

| Retailer | Brands |
|----------|--------|
| Home Depot | Behr, PPG, Glidden |
| Lowe's | Sherwin-Williams, Valspar |
| Brand website | Benjamin Moore, Farrow & Ball, Dunn-Edwards |

Implementation: `src/lib/retailer-links.ts`

- Home Depot URLs: `homedepot.com/s/{brand} {color} paint`
- Lowe's URLs: `lowes.com/search?searchTerm={brand} {color} paint`
- Brand sites link to their official website

### Adding Affiliate Tracking

When affiliate programs are set up (e.g., Home Depot via Impact), update the URL templates in `src/lib/retailer-links.ts` to include tracking parameters. It's a single-file change.

**Note**: Lowe's affiliate program is currently creator/social-media focused and not a good fit for a website-only model.

### Future Monetization

1. **Raptive** (formerly AdThrive): Apply at 25K pageviews/month for higher RPMs
2. **Affiliate links**: Home Depot affiliate program via Impact is the best fit
3. **Premium features**: If traffic warrants (color palette builder, room visualizer)
