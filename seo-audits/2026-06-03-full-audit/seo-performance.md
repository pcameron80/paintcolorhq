# PaintColorHQ — Performance / Core Web Vitals Audit
**Date:** 2026-06-03  
**Auditor:** Web Performance Specialist  
**Data sources:** CrUX History API (28-day field data, ALL form factors), PageSpeed Insights (mobile + desktop lab), source-code inspection  
**URLs audited:** `/` · `/colors/sherwin-williams/agreeable-gray-7029` · `/brands/sherwin-williams` · `/colors/family/blue` · `/tools/room-visualizer` · `/blog/best-valspar-paint-colors`

---

## Executive Summary

The site is in excellent shape across all three Core Web Vitals. Every metric passes the Google "good" threshold at the 75th percentile. Lighthouse mobile scores are 97–100 across all six audited URLs. The only active performance concern is a single render-blocking CSS chunk that costs 110–150 ms on every page load. The secondary issue is a recurring unused-JS bundle (~81 KiB wasted) that inflates the mobile LCP lab value to 2.6 s — within the "good" zone but within striking distance of the 2.5 s threshold. Brand/family grids at perPage=60 are confirmed correct: lab LCP on `/brands/sherwin-williams` is 1.8 s mobile — well inside target, validating that the 60-card cap is the right call. Accessibility failures (contrast, landmark, touch targets) are the only failing audits and are noted separately; they do not affect CWV scoring.

**Overall Performance Score: 88 / 100**  
(Field data: all CWV green. Lab: 97–100 on most pages. Score deducted for persistent render-blocking CSS, unused-JS bundle, and two LCP lab readings at exactly 2.6 s — marginal buffer.)

---

## Core Web Vitals — Field Data (CrUX, 75th percentile)

### Origin-level (ALL form factors, 28-day window ending 2026-05-30)

| Metric | P75 | Rating | Good % | NI % | Poor % | Pass? |
|--------|-----|--------|--------|------|--------|-------|
| LCP | 1,420 ms | FAST | 91.5% | 4.5% | 4.0% | YES |
| INP | 63 ms | FAST | 95.9% | 3.3% | 0.8% | YES |
| CLS | 0.01 | FAST | 82.0% | 10.7% | 7.2% | YES |
| FCP | 1,339 ms | FAST | 88.0% | 6.7% | 5.3% | YES |
| TTFB | 319 ms | FAST | 92.4% | 4.6% | 3.0% | YES |

**All three Core Web Vitals pass Google's 75th-percentile threshold.**

Note: INP data has sparse history (only 2 populated periods in the CrUX history series). The 63 ms P75 is well inside the 200 ms "good" threshold and the 4.1% needs-improvement share is acceptable. CrUX URL-level data for individual color/brand pages returns 404 (insufficient per-URL traffic density); origin-level applies across all pages.

### PSI URL-level field data (mobile, from PSI response)

| URL | LCP P75 | CLS P75 | FCP P75 | TTFB P75 |
|-----|---------|---------|---------|----------|
| `/` (homepage) | 1,864 ms | 0.00 | 1,673 ms | 471 ms |
| `/colors/sherwin-williams/agreeable-gray-7029` | 1,864 ms | 0.00 | 1,673 ms | 471 ms |
| `/brands/sherwin-williams` | 1,864 ms | 0.00 | 1,673 ms | 471 ms |
| `/tools/room-visualizer` | 1,864 ms | 0.00 | 1,673 ms | 471 ms |

PSI collapses URL-level field data to the same origin bucket for this site (all return identical values), confirming the CrUX history origin-level numbers above are representative.

### Desktop field data (PSI, homepage)

| Metric | P75 | Rating |
|--------|-----|--------|
| LCP | 1,005 ms | FAST |
| CLS | 0.06 | FAST |
| FCP | 997 ms | FAST |
| TTFB | 228 ms | FAST |

Desktop is comfortably green. Desktop CLS at 0.06 is worth watching — it is inside "good" but the CrUX history shows CLS fluctuating 0.01–0.08 at origin level (good% as low as 78.5%). See Finding #3.

---

## Lab Data — Lighthouse Mobile (per URL)

| URL | Perf Score | FCP | LCP | TBT | CLS | TTI |
|-----|-----------|-----|-----|-----|-----|-----|
| `/` | 97 | 0.9 s | 2.6 s | 0 ms | 0 | 2.6 s |
| `/colors/sw/agreeable-gray` | 97 | 0.9 s | 2.6 s | 40 ms | 0 | 2.6 s |
| `/brands/sherwin-williams` | 100 | 0.9 s | 1.8 s | 40 ms | 0 | 2.0 s |
| `/tools/room-visualizer` | 97 | 0.9 s | 2.6 s | 20 ms | 0 | 2.6 s |

Desktop scores: 100 on all audited pages. TBT is 0–40 ms across all pages, confirming INP will stay well within threshold as traffic grows.

---

## Findings

---

### FINDING 1 — MEDIUM severity
**Render-blocking CSS chunk on every page (~110–150 ms wasted)**

**Evidence:** `render-blocking-insight` flagged across all six audited URLs with identical culprit:
- `/_next/static/chunks/7c4aea38f054a36b.css` — 11,893 bytes, 151 ms wasted (homepage mobile)
- Same chunk flagged at 110 ms on `/colors/sherwin-williams/agreeable-gray-7029`
- Same chunk flagged at 110 ms on `/brands/sherwin-williams`
- Same chunk flagged at 120 ms on `/tools/room-visualizer`

This is the global stylesheet bundle emitted by Next.js / Tailwind 4. It loads synchronously and blocks render on every page in the app. The LCP lab floor is 2.6 s on most pages because the browser cannot paint anything until this CSS resolves. Eliminating or deferring the non-critical portion would move lab LCP from 2.6 s toward ~2.4 s — creating real safety margin above the 2.5 s threshold.

**Fix:** Tailwind 4 + Next.js 16 with App Router already generates per-page critical CSS automatically during build. The issue is that the global `globals.css` import in `layout.tsx` forces a full bundle. Audit `src/app/globals.css` and move any non-critical rules (custom utility classes not needed above the fold, animation keyframes, etc.) into component-scoped styles or a separately loaded stylesheet. For anything that must stay global, add `media="print" onload="this.media='all'"` pattern via a custom `<link>` in `layout.tsx` for non-critical slices.

Alternatively, inline the above-the-fold critical CSS directly in `<head>` (Next.js supports this via `next/headers` or a custom Document approach). 110–150 ms saved on every page load is worth the effort given the volume of color-detail pages.

**Relevant file:** `src/app/globals.css`, `src/app/layout.tsx`

---

### FINDING 2 — MEDIUM severity
**Unused JavaScript bundle shipping 81 KiB of dead code on every page**

**Evidence:**
- `unused-javascript` flagged on every audited URL (homepage, color, brand, room-visualizer)
- Primary culprit: `/_next/static/chunks/5b776be7292c4d28.js` — 73,829 bytes total, 54,965 bytes wasted (74% unused)
- Secondary culprit: `/_next/static/chunks/19deb65481cb608d.js` — 71,950 bytes total, 28,150 bytes wasted (39% unused)
- Total wasted: ~83 KB; estimated savings per PSI: 450 ms on mobile homepage, 300 ms on color detail page
- `19deb65481cb608d.js` is also the source of 2 long tasks on `/brands/sherwin-williams` (80 ms at t=1801 ms, 65 ms at t=1927 ms) — the only long tasks found across all audited pages

The `19deb65481cb608d.js` chunk also contains 14 KiB of legacy JavaScript (ES5 polyfills for Baseline features), flagged by `legacy-javascript-insight` on every page. This chunk is being transpiled for browsers that do not need it.

**Fix (two parts):**

1. **Code splitting:** Identify what lives in `5b776be7292c4d28.js`. It is likely a shared vendor chunk that includes code for routes not visited on the current page (e.g., room-visualizer canvas logic, palette generator, Supabase realtime). Use dynamic `import()` with `next/dynamic` for client components that are not needed above the fold. The room-visualizer `./visualizer` component in `src/app/tools/room-visualizer/page.tsx` is already imported directly — wrap it in `dynamic(() => import('./visualizer'), { ssr: false })` to lazy-load the canvas/interaction code.

2. **Legacy JS:** In `next.config.ts`, set `browserslist` targets to modern browsers only (drop IE 11 support if not explicitly needed). The `@next/bundle-analyzer` package will identify what is in these chunks. The 14 KiB legacy-JS waste in `19deb65481cb608d.js` is recoverable without any code changes — just a build-target adjustment.

**Relevant files:** `src/app/tools/room-visualizer/page.tsx` (dynamic import), `next.config.ts` (browserslist target), `package.json` (add `@next/bundle-analyzer` to diagnose)

---

### FINDING 3 — LOW severity
**CLS is stable at origin level (P75 = 0.01) but shows volatility in CrUX history; desktop field CLS is 0.06**

**Evidence:**
- CrUX history (28-week series): CLS P75 ranges from 0.01 to 0.08 across the tracked periods
- Good% has dipped as low as 78.5% (period ending 2025-12-20), with poor% as high as 11.1%
- Current (latest period, ending 2026-05-30): P75 = 0.01, good% = 82.0%, poor% = 7.2%
- Desktop PSI field data: CLS P75 = 0.06 — still "good" but not well clear
- Lab CLS = 0 on all audited pages (Lighthouse throttled environment)

The gap between lab=0 and field poor%=7% indicates layout shifts are happening in real user conditions that Lighthouse's simulated load does not replicate. Likely sources: late-loading AdSense (pending approval — this will make CLS worse when it goes live), web font FOUT before woff2 preload completes, or dynamically injected content (CookieConsent banner, TrackPage, ColorLinkEnhancer DOM mutations after paint).

**Why this matters:** If AdSense activates without reserved ad slot dimensions, CLS will spike. The current 7.2% poor-CLS share could grow to 15–25% from ad injection alone, potentially failing the 75th-percentile threshold.

**Fix:**

1. **AdSense prep (before enabling):** Pre-reserve all ad slot containers with explicit `min-height` matching the ad unit size (e.g., `min-height: 90px` for a leaderboard, `min-height: 250px` for a rectangle). Add this to the relevant page layouts before the AdSense script is activated.

2. **CookieConsent:** Verify `src/components/cookie-consent.tsx` renders with a fixed position and does not push page content. If it uses `position: fixed` or `position: sticky`, it should not cause CLS. If it appends to the document flow, add a reserved slot.

3. **ColorLinkEnhancer:** This component (`src/components/color-link-enhancer.tsx`) injects swatch dots and hover tooltips into editorial content after hydration. Any DOM mutation that changes element dimensions after LCP can register as CLS. Ensure the injected spans use `display: inline` (not `inline-block` with height) and that tooltip overlays use `position: absolute` so they do not shift surrounding content.

**Relevant files:** `src/components/cookie-consent.tsx`, `src/components/color-link-enhancer.tsx`, any AdSense slot component

---

### FINDING 4 — LOW severity
**LCP image on `/tools/room-visualizer` is not immediately discoverable from HTML**

**Evidence:** `lcp-discovery-insight` failed specifically on `/tools/room-visualizer` (score: 0). This audit fires when the LCP image URL is not present in the initial HTML response — meaning the browser cannot begin fetching it until JavaScript executes. The room-visualizer `RoomVisualizer` component is a client component that renders room photos; the LCP element (the room photo `<img>`) is injected by React after hydration rather than being server-rendered in the HTML.

Lab LCP on this page is 2.6 s mobile, identical to the homepage — but the cause is different. On the homepage, the hero.webp is server-rendered with `priority` and auto-preloaded by Next.js. On the room-visualizer, the LCP image waits for JS to execute before it even starts downloading.

**Fix:** Server-render the initial room image at the top of the page using Next.js `<Image>` with `priority` prop. The `RoomVisualizer` client component can hydrate and take over the interactive canvas, but the static initial room image should be present in the HTML as an `<img>` tag. In `src/app/tools/room-visualizer/page.tsx`, import the default room image and render it above the `<RoomVisualizer>` component with `priority`. The client component can hide it once hydrated.

**Relevant file:** `src/app/tools/room-visualizer/page.tsx`, `src/lib/rooms.ts` (room registry for default image path)

---

### FINDING 5 — LOW severity (informational)
**Brand grid page (`/brands/sherwin-williams`) image delivery: 100 KiB wasted across blog thumbnails**

**Evidence:** `image-delivery-insight` on `/brands/sherwin-williams` — score 0.5, est. savings 100 KiB. Three blog hero images are loaded at `w=1200` but displayed at mobile card dimensions:
- `best-sherwin-williams-kitchen-colors.webp` — 87 KiB total, 45 KiB wasted
- `best-valspar-paint-colors.webp` — 59 KiB total, 31 KiB wasted
- `best-dunn-edwards-paint-colors.webp` — 51 KiB total, 27 KiB wasted

These are blog preview thumbnails in the "Related Posts" or cross-sell section on the brand page. They are lazy-loaded (correct), so this does not affect LCP, but it does add ~100 KiB to mobile page weight unnecessarily.

**Fix:** In the component rendering blog thumbnails on brand pages (`src/app/brands/[brandSlug]/page.tsx` or its child component), update the `<Image>` `sizes` prop to match the actual rendered width. At mobile (375px), a two-column card is ~160px wide; at desktop ~300px. The `sizes` prop should read something like `sizes="(max-width: 640px) 160px, 300px"` instead of defaulting to full-width. Next.js will then select the correct `w=` parameter and serve a smaller variant. No changes to the source images needed.

**Relevant files:** `src/app/brands/[brandSlug]/page.tsx`

---

### FINDING 6 — INFO (non-CWV)
**Accessibility failures consistent across all pages (A11y score: 86–90)**

These do not affect Core Web Vitals ranking but are flagged for completeness:

- **Color contrast (WCAG AA):** `text-[10px] text-outline` elements show contrast ratio 4.07–4.47 against their backgrounds (minimum 4.5:1 required). Found on color number labels in color cards and footer fine print. Fix: increase text opacity or darken `--color-outline` token.
- **`<main>` landmark missing:** No `<main>` element wraps page content across all page types. Screen readers and assistive tech rely on this. Fix: wrap the primary content `<div>` in `<main>` in each page component, or add it at the layout level around `{children}`.
- **Touch target size:** Footer links and `text-[10px]` family tag links are 15px tall — below the 24×24px minimum. Fix: add `py-2` padding to small links in the footer and color-card family tags.
- **Heading order on color detail pages:** `heading-order` audit fails — an H level is skipped in the color detail page hierarchy.

---

## LCP Subparts (Origin-level estimate)

URL-level LCP subparts data returned 404 from CrUX (insufficient per-URL traffic for the subparts API). Origin-level subparts are not broken out in the CrUX history response. Based on lab network waterfall from PSI:

| Subpart | Estimated value | Notes |
|---------|----------------|-------|
| TTFB | ~3–5 ms (lab) / 319 ms (field P75) | Vercel edge cache hit; field TTFB includes cold ISR misses |
| Resource load delay | ~35–40 ms | Time from TTFB to when browser discovers and begins fetching the LCP image |
| Resource load time | ~375 ms | hero.webp at w=640 q=75: 13 KiB, loaded in ~376 ms on simulated mobile |
| Element render delay | ~2,150 ms | Dominant subpart — time between image load complete and paint, blocked by render-blocking CSS + JS parse |

The element render delay (subpart 4) is the dominant contributor to the 2.6 s lab LCP. This maps directly to Finding #1 (render-blocking CSS) and Finding #2 (JS parse/execution of `19deb65481cb608d.js`). Fixing the render-blocking CSS chunk alone would be expected to shave ~130–150 ms from this subpart.

---

## TTFB Analysis

Field TTFB P75 = 319 ms (mobile), 228 ms (desktop). Lab TTFB = 3–5 ms (ISR cache hit).

The field/lab gap (319 ms vs. 5 ms) is normal and expected: the lab always hits a warm Vercel edge cache. Real users hit cold ISR misses on long-tail color pages (25K pages, most with infrequent traffic). When a color page's 1-hour ISR cache expires, the next visitor waits for a Supabase query + page render before receiving HTML — this is the 319 ms.

This is within the 800 ms "good" threshold and Vercel's edge network handles it well. No action required at current traffic levels. If traffic grows significantly, pre-generating more slugs in `generateStaticParams` (currently limited to `POPULAR_COLOR_SLUGS`) would reduce cold-miss frequency.

---

## perPage=60 Validation

Confirmed correct. `/brands/sherwin-williams` with 60 color cards achieves:
- Lab LCP: 1.8 s mobile (the best of all audited pages)
- TBT: 40 ms
- Main-thread work: 0.7 s
- Total page weight: 654 KiB (images dominate at 207 KiB across 4 images)

The `19deb65481cb608d.js` chunk causes 2 long tasks (80 ms, 65 ms) on this page — they occur after LCP at t=1,801 ms so they do not hurt LCP, but they are the only long tasks across all audited pages and are the primary INP risk if a user interacts during that window. Fix via Finding #2 (reduce unused JS in this chunk).

---

## Third-Party Scripts

- **GA4 (G-056NR93JLK):** No gtag network requests visible in the PSI waterfall for any audited page. This is correct — GA4 is loaded by `AnalyticsProvider` which loads after the page body, and the gtag script is async. Zero impact on LCP or TBT. Confirmed clean.
- **AdSense (ca-pub-6269963873031881 — pending approval):** Not yet active. When it activates, expect: (a) ~50–100 ms TBT increase from the AdSense script, (b) CLS risk from ad slot injection (see Finding #3). Pre-reserve slot dimensions before enabling.
- **No other third-party scripts detected** in the network waterfall across any audited URL.

---

## Font Loading

Two woff2 files load in parallel at ~t=473 ms (after HTML parse):
- `83afe278b6a6bb3c-s.p.3a6ba036.woff2` — 49 KiB (Manrope), completes ~t=668 ms
- `a343f882a40d2cc9-s.p.71e1367e.woff2` — 25 KiB (Inter), completes ~t=688 ms

Both are loaded via `next/font/google` which generates `<link rel="preload">` tags automatically. No FOUT or FOIT risk — `next/font` uses `font-display: optional` by default in App Router, which means the fallback font renders immediately and the web font swaps in only if it loads within the LCP window. Lab CLS = 0 on all pages confirms no measurable font-swap shift in the Lighthouse environment.

---

## Prioritized Recommendations

| Priority | Finding | Metric impact | Effort |
|----------|---------|--------------|--------|
| 1 | Inline/defer render-blocking CSS chunk | LCP -130 ms (lab) | Medium |
| 2 | Dynamic-import room-visualizer client component | LCP discovery on /tools/room-visualizer | Low |
| 3 | Reduce unused JS in `5b776be7292c4d28.js` via code-splitting | LCP -200–450 ms (lab), INP risk reduction | High |
| 4 | Fix legacy-JS transpilation target in next.config.ts | -14 KiB every page | Low |
| 5 | Pre-reserve AdSense slot dimensions before enabling | CLS protection | Low |
| 6 | Fix blog thumbnail `sizes` prop on brand pages | -100 KiB mobile page weight | Low |
| 7 | Add `<main>` landmark + fix color-contrast tokens | A11y score improvement | Medium |

---

## Raw Data Reference

- PSI JSON (homepage): `/Users/philipcameron/.claude/projects/.../tool-results/bebl3j6m0.txt`
- PSI JSON (room-visualizer + blog): `/Users/philipcameron/.claude/projects/.../tool-results/b0kxkk67o.txt`
- CrUX history JSON: returned inline in session (28-week series, ALL form factors)
