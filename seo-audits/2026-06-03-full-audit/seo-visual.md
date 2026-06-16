# PaintColorHQ Visual / Mobile / Above-the-Fold Audit
**Date:** 2026-06-03  
**Auditor:** Visual Analysis specialist (Claude Code, Sonnet 4.6)  
**Scope:** 7 representative URLs, desktop (1920x1080) + mobile (375x812)  
**Overall score: 72 / 100**

---

## Screenshot Index

All files at `screenshots/` relative to this document.

| Page | Desktop | Mobile |
|---|---|---|
| Homepage | `homepage_desktop.png` | `homepage_mobile.png` |
| Color detail (Agreeable Gray) | `color-detail_desktop.png` | `color-detail_mobile.png` |
| Brand (Sherwin-Williams) | `brand_desktop.png` | `brand_mobile.png` |
| Family (Blue) | `family-blue_desktop.png` | `family-blue_mobile.png` |
| Room Visualizer | `room-viz_desktop.png` | `room-viz_mobile.png` |
| Blog (Best Valspar) | `blog-valspar_desktop.png` | `blog-valspar_mobile.png` |
| Compare | `compare_desktop.png` | `compare_mobile.png` |

---

## Page-by-Page Findings

### 1. Homepage (`/`)

**Above-the-fold verdict — desktop:** Good. H1 "Find a Paint Color You Love in *Any Brand*." is large and dominant, trust bar ("23,000+ COLORS · 14 BRANDS · 100% FREE") lands just above the headline, two CTAs ("Find a Color →" + "Build a Palette") are visible, and the hero room image with color-chip overlay is visible to the right. The discover-first flow is readable immediately. Cookie banner sits in the lower-right and does not obscure the headline or CTAs.

**Above-the-fold verdict — mobile:** Very good. H1 fills the screen width at a large, legible size. Trust bar is visible. The subtitle ("Browse 23,000+ shades across 14 brands, preview your favorites on a real wall, then find that exact color in the brand you can actually buy.") explicitly narrates the discover → preview → buy flow in a single sentence. Both CTA buttons are large, full-width, and clearly tappable. Hero image begins to peek at the bottom edge — appropriate curiosity hook.

**Cookie banner:** On mobile the cookie consent banner overlays the bottom ~30% of the viewport, pushing "Build a Palette" partially behind it and cutting off the top edge of the hero image. Until dismissed, the secondary CTA is obscured.

**Issues:**

| Severity | Issue | Fix |
|---|---|---|
| Medium | Cookie banner overlaps secondary CTA on mobile before dismissal. "Build a Palette" button is partially obscured. | Reduce banner height, or reposition to a top bar on mobile. Alternatively ensure banner z-index does not cover interactive CTAs. |
| Low | Desktop hero image feels small at 1920px — the room photo and color-chip mockup occupy only the right ~35% of the viewport at small scale. The visual "preview on a real wall" payoff is undersold above the fold. | Consider making the hero image taller / more prominent on desktop, or use a wider hero layout. |
| Low | The italic blue "in Any Brand." in the H1 uses a stylistic font shift. At desktop scale this reads as designed. On mobile, the font rendering is clean, but ensure fallback stacks render the italic correctly on Android Chrome (potential FOIT if font is slow). | Preload the Manrope italic variant or include it in the critical CSS. |

---

### 2. Color Detail — Agreeable Gray 7029 (`/colors/sherwin-williams/agreeable-gray-7029`)

**Above-the-fold verdict — desktop:** Solid. The color name "Agreeable Gray" is the dominant element (correct). LRV (60%) and undertone (NEUTRAL) are visible as key data points. Action buttons (Save to Project, Share, Save) are present. Editorial summary paragraph begins below the fold, which is fine — the data points are the primary query response. No brand name or number shown in the hero (only visible in breadcrumb "REF. #D1CBC1 · 7029" in small caps).

**Above-the-fold verdict — mobile:** Good. Color name is very large and immediately visible against the warm greige hero swatch. LRV and undertone are visible. Action buttons are full-width. Cookie banner obscures the beginning of the editorial paragraph, but the core data is visible.

**Issues:**

| Severity | Issue | Fix |
|---|---|---|
| Medium | Brand name "Sherwin-Williams" is not visible above the fold on mobile — only the color name and ref number appear in the hero. A user arriving from a generic search for "agreeable gray paint color" gets no immediate brand attribution above the fold. | Add a small brand badge or sub-label just below the color name (e.g., "by Sherwin-Williams") in the hero section. |
| Low | The cookie banner on mobile cuts off the editorial paragraph mid-sentence ("Agreeable Gray works as a warm neutral anchor — pairs cleanly with most existing palettes and reads forgiving across lighting conditions. At"). The editorial content is a key GEO signal and should be fully visible without requiring banner dismissal. | Same fix as homepage: reduce banner footprint on mobile. |
| Low | Desktop: The color swatch is the full-page background (greige gradient) rather than a distinct bounded swatch. This is a design choice but visually the page can look empty/minimal at first glance. No color grid or "similar colors" teaser is visible above the fold. | Consider a small color chip + hex/number badge in the upper left corner of the hero to make the page identity immediately scannable. |

---

### 3. Brand Page — Sherwin-Williams (`/brands/sherwin-williams`)

**Above-the-fold verdict — desktop:** Good. H1 "Sherwin-Williams Color Chart" is clear and on-intent (matches the "sherwin williams color chart" query type). Meta bar "1,527 COLORS · EST. 1866 · CLEVELAND, OHIO, USA" adds authority. Two CTAs ("Explore Colors" + "Visit Sherwin-Williams →") are present. The brand editorial content (About section) begins to load just below the fold, partially visible. Cookie banner is in the lower right and does not block any CTAs.

**Above-the-fold verdict — mobile:** Very good. H1 breaks across three lines ("Sherwin- / Williams Color / Chart") but remains fully readable and dominant. Subtitle ("Find Sherwin-Williams colors with instant matches to Benjamin Moore, Behr, and 11 other brands") immediately communicates the matching value prop — this is the right intent match for brand-chart searchers. Both CTAs are visible and large. Cookie banner sits at the very bottom and does not obstruct CTAs on this page.

**Issues:**

| Severity | Issue | Fix |
|---|---|---|
| Low | No color swatches are visible above the fold on either desktop or mobile — the page opens on header + text. The color grid (the reason people visit) requires significant scrolling. | Add a 3–4 color preview strip (representative SW colors) just below the CTAs as a visual teaser. This also gives Google a color-rich above-the-fold signal. |
| Low | Desktop: "About Sherwin-Williams" editorial section loads immediately below the hero at desktop, meaning the prose text (not the color grid) is the second thing users see. Users arriving to browse colors will scroll past a wall of text before reaching the grid. | Reorder desktop layout: hero → color grid → editorial. On brand pages the grid is the primary content. |

---

### 4. Family Page — Blue (`/colors/family/blue`)

**Above-the-fold verdict — desktop:** Good. H1 "Blue Paint Colors" is correct and on-intent. Color count ("3,542 blue paint colors across 14 brands including Sherwin-Williams, Benjamin Moore, and Behr.") is prominent and adds specificity. Blue color swatch square is displayed prominently next to the H1. The editorial content block begins just below — at 1080px desktop the full editorial paragraphs and the "Blue Color Library" section header are visible. Color grid starts to appear at the very bottom edge of the viewport. Brand filter chips are also visible.

**Above-the-fold verdict — mobile:** Mixed. H1 and subtitle are clear and visible. But a large blank/white gap appears between the subtitle and the editorial paragraph — a roughly 200px empty zone on mobile. This is visually jarring and creates an impression of a broken layout or slow-loading content. Cookie banner then overlaps the editorial text.

**Issues:**

| Severity | Issue | Fix |
|---|---|---|
| High | Large blank whitespace gap on mobile between the hero subtitle and the editorial section. Approximately 200px of empty space before the text begins. Appears to be excessive padding or a margin on the editorial container. | Inspect the editorial section's top margin/padding on mobile breakpoints and reduce to ~24–32px. |
| Medium | On mobile the color grid (the primary content) is never visible above the fold — users see header, text, and cookie banner. No swatch is visible until after scrolling and dismissing the banner. | Reduce the gap issue (above) so the grid can begin showing at ~700px depth; or add a mini swatch preview strip below the hero subtitle. |
| Low | Cookie banner covers the editorial text on mobile, reducing GEO signal legibility for first-party analysis and potentially for crawlers that capture rendered state. | Consistent cookie banner fix. |

---

### 5. Room Visualizer (`/tools/room-visualizer`)

**Above-the-fold verdict — desktop:** Functional but minimal. H1 "Room Color Visualizer" is correct. Subtitle explains the tool. The real-photo room image (living room with blue walls and white trim) fills the viewport below the header and is visually striking. However: no color picker, no region selector, and no instructions are visible above the fold — the interactive controls appear to be below the fold or hidden until interaction. At first glance, the page looks like a static image landing page rather than an interactive tool. Cookie banner overlaps the room image but does not block the H1.

**Above-the-fold verdict — mobile:** Mostly good. H1 and subtitle are readable, room photo loads and is the hero element. Same issue: no interactive UI visible above the fold. Users do not see a color picker or region selector until they scroll — high abandonment risk for a tool.

**Issues:**

| Severity | Issue | Fix |
|---|---|---|
| High | No interactive affordance is visible above the fold on desktop or mobile. The tool's core UI (color picker, region selector, apply button) is below the photo. First-time users have no visual cue that they can interact with the image. | Overlay a minimal "Click a region to begin" prompt badge on the room photo, or surface the color picker as a floating panel visible above the fold alongside the image. |
| Medium | On desktop, the room photo is very tall and pushes all controls below the fold at 1080px viewport height. The photo takes ~70% of the vertical space after the header. | Cap the photo height at `max-h-[50vh]` or `max-h-[55vh]` on desktop to keep controls visible without scrolling. |
| Low | The page is labeled "TOOL" in a small pill above the H1 (visible on mobile). This pill is too subtle — users arriving from search may not immediately understand this is an interactive tool vs. an article. | Not critical; acceptable with the H1 clarity, but the pill's styling could be bolder. |

---

### 6. Blog — Best Valspar Paint Colors (`/blog/best-valspar-paint-colors`)

**Above-the-fold verdict — desktop:** Good. Large hero image (white/neutral living room) sets the tone. H1 "The Best Valspar Paint Colors for Every Room (2026)" is fully visible, date and author ("May 31, 2026 — Philip Cameron") are present. Tags (GUIDE, VALSPAR, BRAND) are visible. The first sentence of body text is visible and begins immediately — "The best Valspar paint color for most homes is Heritage Gray (7501-24, LRV 60) — a warm greige...". Cookie banner in lower right doesn't block content. Named author adds E-E-A-T signal.

**Above-the-fold verdict — mobile:** Partially good. Hero image is present. H1 is large and fully visible. Tags and author/date metadata are shown. Body text does not appear above the fold (cookie banner takes the bottom portion). However the H1 and hero image are sufficient for intent confirmation.

**Issues:**

| Severity | Issue | Fix |
|---|---|---|
| Low | On mobile, the body text does not appear above the fold — users see the title and hero but cannot confirm the article answers their query without scrolling (made worse by the cookie banner). | Reduce hero image height on mobile from full-bleed to ~35–40vh, so the first paragraph is visible above the fold. |
| Low | Desktop hero image is cropped to a narrow strip (appears to be maybe 180px tall at 1920px width). The image-to-text ratio feels unbalanced at desktop. | Increase hero image height on desktop or use a side-by-side layout (image left, title/meta right) to give the hero image more visual presence. |
| Low | "Jump to section 00" link appears below the title on desktop. The numbering ("00") looks like a placeholder or development artifact — confirm this is intentional copy. | Verify this is correct anchor copy. If it's a section ID artifact, replace with meaningful section name (e.g., "Jump to Top Picks"). |

---

### 7. Compare (`/compare`)

**Above-the-fold verdict — desktop:** Functional. H1 "Compare Colors" is visible. Subtitle explains the Delta E utility. Both Color 1 and Color 2 search fields are visible above the fold and immediately usable. Educational "Reading the comparison" content begins to show. Clean and purposeful. Cookie banner in lower right corner doesn't interfere.

**Above-the-fold verdict — mobile:** Very good. H1 is large and dominant. Subtitle includes "Delta E similarity scores" — this is correct intent match for comparison-query visitors. Both search inputs are fully visible with placeholder text. Cookie banner takes up the bottom ~30% of the viewport but the inputs are still accessible above it. Tap targets on the input fields appear to meet the 48px minimum.

**Issues:**

| Severity | Issue | Fix |
|---|---|---|
| Low | The compare page subtitle mentions "Delta E similarity scores" explicitly. Per the CLAUDE.md convention, Delta E should be displayed as plain language in the UI, not raw scores. The subtitle appears to be an exception (it names the methodology, not a result). Confirm this is intentional. | If Delta E scores are exposed in results, convert to plain language ("Nearly identical", "Very similar", etc.) per convention. The subtitle reference to the methodology is likely fine. |
| Low | On mobile, excessive vertical whitespace (~120px) between the subtitle and the Color 1 label. Empty zone before the inputs. | Reduce padding between the subtitle and the first input field on mobile. |

---

## Cross-Cutting Issues

### Cookie Banner (All Pages, Medium)

The cookie consent banner is persistent across all pages and on mobile occupies 25–35% of the viewport height. On the homepage it partially covers the secondary CTA; on family/blue and color-detail it covers editorial content; on the blog it covers the start of the article body. This is the single highest-impact mobile UX fix available — it costs no ranking but creates measurable friction at first-visit.

**Fix:** Reduce mobile banner height. Consider a compact single-line banner style ("We use cookies. [Accept] [Decline]") pinned to the bottom with no padding, similar to what many EU-compliant sites use. Target max 64px height on mobile.

### Navigation — Mobile (Low)

All pages show the hamburger menu (three-line icon) on mobile — navigation is accessible. The hamburger tap target appears adequately sized. No horizontal scroll was detected on any page. Base font size is large enough throughout (16px+ equivalent).

### Font Rendering (Low)

Manrope renders well on all pages across both viewports. The italic variant in the homepage H1 ("in Any Brand.") renders cleanly. No FOIT or FOUT artifacts are visible in the screenshot captures.

### Layout / Overflow (None detected)

No horizontal overflow or element clipping was observed on any page at either viewport. The Atelier design system appears stable across breakpoints.

---

## Summary Scores by Page

| Page | Desktop ATF | Mobile ATF | Mobile Responsiveness | Issues |
|---|---|---|---|---|
| Homepage | 85 | 82 | 90 | Cookie banner covers secondary CTA |
| Color detail | 78 | 75 | 85 | No brand label above fold on mobile |
| Brand (SW) | 80 | 88 | 85 | No color swatches above fold |
| Family (Blue) | 82 | 62 | 72 | Large blank gap on mobile; no grid above fold |
| Room Visualizer | 65 | 68 | 70 | No interactive UI visible above fold |
| Blog | 85 | 72 | 78 | Body text below fold on mobile |
| Compare | 88 | 80 | 85 | Minor whitespace; Delta E label check |

**Overall: 72 / 100**

---

## Top 3 Findings

**1. Room Visualizer — no interactive affordance above the fold (High)**  
Both desktop and mobile show a static photo with zero visible controls. Users cannot tell the page is interactive. This is the most likely cause of tool abandonment before first interaction. Fix: overlay a region-select prompt on the photo, or cap the photo height so the picker is visible without scrolling.

**2. Family page — ~200px blank gap on mobile (High)**  
The blue family page has a large empty zone between the subtitle and the editorial section on mobile. It looks like a broken layout. This is easily fixed with a padding/margin reduction and would immediately improve perceived quality on family pages (15 pages affected).

**3. Cookie banner height on mobile (Medium, all pages)**  
The banner occupies 25–35% of the mobile viewport across all 7 pages audited, regularly covering CTAs or body content. Single fix that applies sitewide.

---

## Top 2 Quick Wins

**Quick win 1: Reduce cookie banner height on mobile.**  
One CSS change, sitewide impact across all 14 brand pages, 15 family pages, all tool pages, all blog posts. Target: max 64px, compact single-line layout.

**Quick win 2: Cap Room Visualizer photo height on desktop.**  
One `max-h-[50vh]` or equivalent change on the photo container makes the interactive controls visible without scrolling and converts the tool from "looks like a landing page" to "clearly interactive." No logic change required.

---

## Verdict: Discover-First Homepage Above the Fold on Mobile

**Verdict: Pass — with one condition.**

The mobile above-the-fold experience on the homepage correctly delivers the discover-first flow. The trust bar, H1, subtitle ("Browse 23,000+ shades across 14 brands, preview your favorites on a real wall, then find that exact color in the brand you can actually buy."), and primary CTA are all visible and clearly sequenced. A first-time mobile visitor immediately understands: this is a color discovery tool, it spans 14 brands, they can preview on a wall, and they can buy the matched color. The flow — discover → preview → find in your brand — is communicated in one sentence above the fold.

The one condition: the cookie banner partially obscures the secondary "Build a Palette" CTA. The primary CTA ("Find a Color →") remains fully visible. For users who land on the homepage with palette-building intent rather than search intent, the secondary CTA is the relevant entry point and it is not reliably visible until the banner is dismissed. This is not a blocking issue but it reduces the discover-first presentation slightly.

The hero image (room photo + color-chip overlay) is peeking at the bottom edge of the mobile viewport — this is appropriate as a curiosity hook to encourage scrolling. It does not need to be fully visible above the fold.
