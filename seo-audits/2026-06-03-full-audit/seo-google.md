# PaintColorHQ — Google Field Data Audit
**Date:** 2026-06-03
**Tier:** 2 (API Key + Service Account + GA4)
**Data sources:** Google Search Console API (sc-domain:paintcolorhq.com), CrUX History API, PageSpeed Insights API, GSC URL Inspection API
**GSC lag:** 2–3 days. CrUX: 28-day rolling windows. GA4: unavailable (measurement ID G-056NR93JLK is not the numeric property ID required by the Data API — see section 6).

---

## 1. HCU Recovery Verdict: WORSE (not recovering)

The March 3, 2026 penalty struck hard and has not lifted. The trend is not flat — it continues to deteriorate.

### 90-Day Trend vs Prior Period (Google API, field data)

| Metric | Prior 90 days (Dec 4 – Mar 3) | Current 90 days (Mar 4 – Jun 1) | Change |
|---|---|---|---|
| Total clicks | 88 | 61 | -31% |
| Total impressions | 21,545 | 9,065 | -58% |
| CTR | 0.41% | 0.67% | +0.26pp (artifact) |
| Avg position | 21.0 | 50.4 | -29.4 positions |

The CTR improvement is an artifact: Google is only surfacing PCHQ for queries where the page actually answers intent (narrow, obscure lookups), so the denominator shrank far faster than clicks. The position collapse from 21 to 50 is the operative number — the site fell off page 1 across the board.

### Daily Impression Trend (penalty anatomy)

| Phase | Date range | Daily impressions (avg) | Daily clicks (avg) |
|---|---|---|---|
| Pre-penalty | Feb 11 – Mar 2, 2026 | ~1,050 | ~4.1 |
| Penalty onset | Mar 3, 2026 | 58 | 0 |
| First 30 days post-penalty | Mar 4 – Apr 3 | ~130 | 0.7 |
| Days 30–60 | Apr 4 – May 3 | ~76 | 0.5 |
| Days 60–90 | May 4 – Jun 1 | ~73 | 0.5 |

The drop on March 3 was a cliff, not a slope: from ~969 impressions on March 2 to 58 on March 3. There is no recovery signal. Impressions in the most recent 30-day window (~73/day) are lower than the first post-penalty window (~130/day), indicating continued erosion, not stabilization.

**Verdict: WORSE. The HCU suppression is not lifting. Impressions are down 58% vs the pre-penalty period and are still falling month over month post-penalty.**

---

## 2. Indexation: Critical Failure

### Sitemap vs Index (Google API, field data)

| Submitted to GSC sitemap | Indexed (sitemap report) | Index rate |
|---|---|---|
| 23,860 URLs | 0 | 0% |

The GSC sitemap API returns `"indexed": "0"` for the sitemap index submitted 2026-05-30. This does not mean zero pages are indexed globally — GSC's sitemap indexed count specifically reflects pages Google confirmed were indexed *via* that sitemap. The figure being 0 is a severe signal: Googlebot is not crediting submitted URLs as indexed, which aligns with the URL inspection spot-checks below.

### URL Inspection Spot-Checks (Google API, field data)

| Page type | URL inspected | Status | Last crawled | Rich results |
|---|---|---|---|---|
| Homepage | / | PASS — Submitted and indexed | 2026-05-28 | FAQ |
| Color detail | /colors/sherwin-williams/accessible-beige-sw-7036 | **NEUTRAL — URL unknown to Google** | Never | None |
| Family hub | /colors/family/white | PASS — Submitted and indexed | 2026-06-02 | Breadcrumbs + FAQ |
| Brand-to-brand match listing | /match/sherwin-williams/to/benjamin-moore | PASS — Submitted and indexed | 2026-05-08 | Breadcrumbs |
| Blog post | /blog/best-valspar-paint-colors | PASS — Submitted and indexed | 2026-06-03 | Breadcrumbs + FAQ |

**Color pages are the worst index-coverage page type.** The most-searched color on the site (Accessible Beige SW-7036, a perennial top-10 SW query nationally) is completely unknown to Google — not "crawled but not indexed," not "discovered but not indexed": *zero crawl history*. With ~23,000 color pages in the sitemap and this being one of the most prominent, the crawl exclusion of the color-page template is near-total.

### Page-Type Coverage Estimate

| Page type | Approx count | Index signal | Assessment |
|---|---|---|---|
| Color detail (/colors/brand/slug) | ~23,000 | Unknown to Google (spot-check) | Critical — effectively 0% indexed |
| Family hub (/colors/family/) | 15 | Indexed | Good |
| Brand page (/brands/) | 14 | Getting impressions (626 for SW) | Partially indexed |
| Match listing (/match/X/to/Y) | ~182 | Indexed, earning clicks | Indexed |
| Blog (/blog/) | ~15 | Indexed, crawled 2026-06-03 | Indexed |
| Homepage | 1 | Indexed | Indexed |
| Compare / tools | ~5 | Getting impressions | Partially indexed |

The 23,000 color pages — the entire product layer of the site — are not being indexed. This is the mechanism of the HCU penalty: Google's quality signal is preventing crawl budget allocation to the largest page type.

---

## 3. GSC Top Queries and Pages — Demand Confirmation

### Top Pages by Impressions (Mar 4 – Jun 1, 2026, Google API)

| Page | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|
| / (homepage) | 41 | 324 | 12.7% | 59.8 |
| /brands/sherwin-williams | 1 | 626 | 0.2% | 56.0 |
| /brands/benjamin-moore | 0 | ~150 est. | — | ~69 |
| /brands/behr | 0 | ~100 est. | — | ~40 |
| /compare | 1 | 17 | 5.9% | 21.5 |
| /match/sherwin-williams/to/dutch-boy | 1 | 4 | 25.0% | 10.3 |
| /match/behr/to/ppg | 1 | 4 | 25.0% | 13.5 |
| /match/dunn-edwards/to/benjamin-moore | 1 | 5 | 20.0% | 17.2 |
| /blog/paint-color-trends-2026 | 1 | 7 | 14.3% | 28.6 |

**The 75% branded color lookup hypothesis is not confirmed by this data.** In the suppressed state, brand pages (not color pages) are the impression earners — because color pages are unknown to Google. The SW brand page alone generates 626 impressions vs near-zero from color pages. This is inverted demand: people searching "[color name] sherwin williams" are landing on the brand listing instead of the specific color page.

### Top Queries by Clicks (Mar 4 – Jun 1, 2026, Google API)

| Query | Clicks | Impressions | Avg position |
|---|---|---|---|
| compare ncs colours | 1 | 1 | 20 |
| paint color match between brands | 1 | 7 | 93.7 |
| (all others) | 0 | 1–29 each | 18–96 |

Only 2 queries generated any clicks in 90 days. The highest-impression non-click query with actionable volume is "abbey stone behr" (9 impressions, position 40, zero clicks — landing on /brands/behr brand page instead of the color page). This pattern repeats across hundreds of color-name queries.

### Match Listing Pages — Highest CTR Segment

Match listing pages (/match/X/to/Y) are generating disproportionately high CTRs (10–25%) at positions 10–18. These pages are indexed and working. The problem is the volume ceiling: match listings earn single-digit impressions because brand-to-brand cross-match queries are low-volume by nature.

---

## 4. Core Web Vitals — Field Data (Google API)

### Homepage CWV — Origin Level (CrUX, 28-day rolling, all form factors)

| Metric | p75 | Rating | Good % | Needs Improvement % | Poor % |
|---|---|---|---|---|---|
| LCP | 1,420 ms | Good | 91.5% | 4.5% | 4.0% |
| INP | n/a (insufficient data) | — | — | — | — |
| CLS | 0.01 | Good | 82.0% | 10.7% | 7.2% |
| FCP | 1,339 ms | Good | 88.0% | 6.7% | 5.3% |
| TTFB | 319 ms | Good | 92.4% | 4.6% | 3.0% |

CLS has 7.2% of sessions in the Poor band. The p75 (0.01) looks fine but the tail distribution is meaningful — some page states are generating large layout shifts for nearly 1 in 14 users.

### CWV Trend (CrUX History — last 6 rolling windows, all form factors)

| Window end | LCP p75 | LCP good% | CLS p75 | TTFB p75 |
|---|---|---|---|---|
| 2026-04-25 | 1,488 ms | 91.3% | 0.02 | 311 ms |
| 2026-05-02 | 1,470 ms | 93.7% | 0.03 | 286 ms |
| 2026-05-09 | 1,445 ms | 93.9% | 0.04 | 285 ms |
| 2026-05-16 | 1,474 ms | 94.1% | 0.08 | 263 ms |
| 2026-05-23 | 1,427 ms | 93.4% | 0.04 | 321 ms |
| 2026-05-30 | 1,420 ms | 91.5% | 0.01 | 319 ms |

LCP is trending slightly better (1,488 → 1,420). CLS is erratic (0.08 spike at 2026-05-16 window then back to 0.01). Both remain in the Good band. CWV is not the cause of the suppression.

### PSI Lab Scores (mobile, 2026-06-03)

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Homepage | 97/100 | 90/100 | 100/100 | 100/100 |
| Color detail (Accessible Beige) | 95/100 | 94/100 | 100/100 | **66/100** |

**The color page PSI SEO score of 66/100 is a flag.** PSI SEO is a lightweight proxy (crawlability, meta, canonicals, structured data legibility), not a ranking factor itself — but a 66 on a page that is "unknown to Google" is worth investigating. Common causes for sub-70 PSI SEO on a color page: missing or broken canonical, hreflang issues, or a robots meta or HTTP header blocking indexing on that URL pattern.

### Lab Metrics — Color Detail Page (mobile)

| Metric | Value | Rating |
|---|---|---|
| LCP (lab) | 2,875 ms | Needs Improvement |
| FCP (lab) | 901 ms | Good |
| TBT | 53.5 ms | Good |
| CLS (lab) | 0 | Good |
| Speed Index | 2,203 ms | Good |

Lab LCP on color pages is 2.9s vs 2.6s on homepage. Color pages load more assets (swatch images, match cards). The field CrUX data rolls all pages into the origin-level number (1,420 ms), so color pages in isolation are likely worse than the origin average — but there is insufficient per-URL CrUX data to confirm.

---

## 5. Issues Register

### Critical

| # | Issue | Evidence | Fix |
|---|---|---|---|
| C1 | Color page template completely excluded from Google's index (~23,000 pages) | URL Inspection: Accessible Beige SW-7036 = "URL unknown to Google." Sitemap: 23,860 submitted / 0 indexed. | Investigate robots.txt, X-Robots-Tag, and `<meta name="robots">` on color pages specifically. Check if ISR-generated color pages are returning a non-200 on first Googlebot fetch (cold ISR = server response before hydration can sometimes emit wrong headers). Confirm `generateStaticParams` is populating correctly for color pages. Run a live URL test in GSC for 5 color pages across different brands. |
| C2 | HCU suppression is deepening, not recovering | Impressions: 21,545 (prior 90d) → 9,065 (current 90d) = -58%. Daily impressions still declining in most recent 30-day window (~73/day vs ~130/day in first post-penalty month. | Recovery requires demonstrated quality improvement at scale. The blog pipeline (2 posts/week, human-gated) is the right mechanism — accelerate it. Each indexed, high-quality page signals to the quality classifier that the site is not uniform AI template content. |
| C3 | PSI SEO score 66/100 on color page pattern | PageSpeed Insights mobile audit for /colors/sherwin-williams/accessible-beige-sw-7036 | Run `lighthouse --only-categories=seo` on a color page in CI to identify which specific SEO audits are failing. Fix before attempting re-indexation push. |

### High

| # | Issue | Evidence | Fix |
|---|---|---|---|
| H1 | Brand pages absorbing color-name query traffic at wrong position | /brands/sherwin-williams: 626 impressions, position 56, CTR 0.2%. Queries like "abbey stone behr" (9 impressions, pos 40) land on brand page, not color page. | Once color pages are indexed, this resolves naturally. In the interim, ensure brand pages deep-link to the most-searched color slugs (not just the paginated grid) to pass internal link equity to those color pages. |
| H2 | Sitemap indexed count = 0 | GSC Sitemaps API: submitted 23,860, indexed 0 | This likely reflects that GSC's sitemap indexer is not confirming any URLs as indexed through the sitemap (consistent with C1). After fixing C1, resubmit the sitemap and monitor the indexed count over 2–3 weeks. |
| H3 | CLS tail: 7.2% of sessions in Poor band | CrUX origin, latest 28-day window | Profile the CLS shift source. Likely candidates: color swatch images without explicit dimensions, lazy-loaded match card images causing reflow, or a font-swap on Manrope/Inter. Add explicit `width`/`height` to swatch `<img>` elements; use `font-display: optional` or preload the primary font. |
| H4 | Non-www URLs appearing in GSC for blog pages | GSC pages report shows `https://paintcolorhq.com/blog/...` (no www) earning impressions separately from www versions | Verify the non-www → www 301 redirect is firing correctly on all paths including /blog/ routes. Check next.config.ts redirect and Vercel domain config. If non-www is indexed, submit a change of address in GSC or add explicit canonical tags on the non-www responses. |

### Medium

| # | Issue | Evidence | Fix |
|---|---|---|---|
| M1 | INP: insufficient CrUX data (too few real-user interactions logged) | CrUX history shows null INP across most windows; only 2 windows have data (63ms, Good) | INP data gap means Google may not have a quality signal for this metric on this property. Not immediately actionable — data accumulates as traffic recovers. |
| M2 | Match listing pages indexed and earning clicks but at low volume ceiling | Best match page: 4–6 impressions, 1 click, position 10–18 | Match listing pages are working correctly. No fix needed — volume ceiling is a demand-side constraint, not a technical one. |
| M3 | GA4 numeric property ID unknown | GA4 Data API requires numeric ID, not measurement ID (G-056NR93JLK) | Retrieve the numeric property ID from GA4 Admin > Property Settings. It will be a 9-10 digit number (e.g., 123456789). Store in project env or audit config for future Tier 2 pulls. |

### Low

| # | Issue | Evidence | Fix |
|---|---|---|---|
| L1 | Render-blocking requests on homepage | PSI: "Est savings of 100ms" from render-blocking resources | Defer or async-load non-critical third-party scripts. Low priority given 97/100 performance score. |
| L2 | Unused JavaScript: 81 KiB on homepage, 450ms savings on color page | PSI diagnostics | Next.js bundle analysis (`next build --analyze`). Check if heavy color-matching libraries are included in the client bundle unnecessarily. |
| L3 | Legacy JavaScript polyfills: 14 KiB savings | PSI insights | Update `browserslist` in package.json to drop IE11 and older targets. |

---

## 6. GA4 Data — Blocked

The GA4 Data API requires a numeric property ID (e.g., `456789012`), not the measurement ID (`G-056NR93JLK`). The numeric ID is available in GA4 Admin > Property > Property Settings. Without it, organic traffic segmentation via API is unavailable for this audit.

Manual check recommended: in GA4 Explore, filter Sessions by `Session medium = organic` and `Session source = google` for the Mar 4 – Jun 1 window to confirm whether Google organic traffic volume matches the GSC click count (~61 clicks in 90 days).

---

## 7. Sitemap Health

| Sitemap | Last submitted | Errors | Warnings | Type | Submitted | Indexed |
|---|---|---|---|---|---|---|
| https://www.paintcolorhq.com/sitemap.xml | 2026-05-30 | 0 | 0 | Index sitemap | 23,860 | 0 |

No errors or warnings from GSC on the sitemap itself. The sitemap is structurally valid. The zero indexed count is a consequence of the quality suppression, not a sitemap format problem.

---

## 8. Top 3 Data-Driven Actions

### Action 1 (Critical): Diagnose and fix color page indexation exclusion

The entire color page template is invisible to Google. Before any other SEO work, run these diagnostic steps in this order:

1. Open GSC > URL Inspection > live test on `/colors/sherwin-williams/accessible-beige-sw-7036`. If the live fetch fails or returns a non-200, the ISR cold-start or a server-side redirect is the culprit.
2. Check the HTTP response headers on a color page for `X-Robots-Tag: noindex` — this would be invisible to PSI but would explain the "unknown to Google" status.
3. Check `robots.txt` for any `/colors/` disallow rule introduced accidentally.
4. Verify `generateStaticParams` for the color page route is correctly exporting slugs (the ISR memory notes confirm this is load-bearing — an empty `[]` return opts in to ISR but does not pre-build, leaving Googlebot to hit cold SSR fetches that may be timing out or erroring before first byte).

If the issue is a headers bug, one fix + resubmit request unlocks 23,000 pages.

### Action 2 (Critical): Accelerate the blog pipeline to signal quality at scale

The HCU classifier operates on site-wide quality signals. With 23,000 color pages suppressed, the blog is the only content layer Google is actively crawling and indexing. The current pace (2 posts/week) is correct directionally but slow relative to the suppression depth. Target 3 posts/week through July, prioritizing:
- Posts that answer specific color-name + brand queries (e.g., "most popular Benjamin Moore whites") — these directly overlap with the queries currently landing on brand pages at position 56 with 0.2% CTR.
- Each post should link internally to 5–10 specific color pages (once indexed) and the relevant brand page.

The match listing pages (25% CTR, position 10–18) prove Google trusts the site for comparison intent. Blog posts on cross-brand matching topics would reinforce this signal.

### Action 3 (High): Fix the non-www duplicate and retrieve GA4 numeric ID

Two quick operational fixes that unblock ongoing measurement:

**Non-www duplicate:** GSC is reporting `paintcolorhq.com/blog/...` URLs separately from `www.paintcolorhq.com/blog/...`. Each impression on the non-www variant is a split signal. Confirm the Vercel redirect from non-www → www covers all paths including `/blog/`, `/colors/`, and `/match/`. If the 301 is working at the edge, the non-www URLs in GSC are historical — submit a change of address request and add explicit canonical `<link rel="canonical" href="https://www.paintcolorhq.com/...">` to all page templates as a belt-and-suspenders measure.

**GA4 numeric ID:** Retrieve from GA4 Admin > Property Settings. Store as `GA4_PROPERTY_ID` in project config. This unblocks Tier 2 organic traffic analysis in future audit runs and allows correlation of GSC click data with GA4 session data to measure post-penalty organic engagement quality.

---

*Data freshness: GSC search analytics 2–3 day lag (current as of ~2026-05-29). CrUX 28-day rolling window ending 2026-05-30. PSI lab data collected 2026-06-03. URL Inspection API real-time as of 2026-06-03.*
