# PaintColorHQ Blog Compliance Audit — 2026-03-16

## Requirements Checked

| Req | Minimum | Description |
|-----|---------|-------------|
| Colors | 5 | Named colors with Swatch links to `/colors/{brand}/{slug}-{code}` |
| Families | 2 | Color family links (`/colors/family/{color}`) |
| Brands | 1 | Brand page links (`/brands/{brand}`) |
| Tools | 2 | Tool links (room-visualizer, compare, search, paint-calculator, palette-generator, color-identifier) |
| Cross-links | 1 | Blog cross-links to another post |
| Words | ~1,000+ | Approximate word count (estimated from content length) |

---

## Audit Results

| # | Slug | Title | Colors | Families | Brands | Tools | Cross-links | Est. Words | Result | Issues |
|---|------|-------|--------|----------|--------|-------|-------------|------------|--------|--------|
| 1 | `2026-colors-of-the-year-every-brand-compared` | 2026 Colors of the Year: Every Major Brand Compared | 5/5 | 1/2 | 1/1 | 3/2 | 1/1 | ~850 | **FAIL** | Only 1 family link (green). Under 1,000 words. |
| 2 | `2025-colors-of-the-year-every-brand-compared` | 2025 Colors of the Year: Every Major Brand Compared | 5/5 | 1/2 | 1/1 | 3/2 | 0/1 | ~750 | **FAIL** | Only 1 family link (red). No blog cross-links. Under 1,000 words. |
| 3 | `best-sherwin-williams-alternatives-to-benjamin-moore` | Best SW Alternatives to BM's Most Popular Colors | 11/5 | 2/2 | 1/1 | 3/2 | 0/1 | ~850 | **FAIL** | No blog cross-links. Under 1,000 words. |
| 4 | `best-kitchen-paint-colors-2025` | The 15 Best Kitchen Paint Colors for 2025 | 15/5 | 3/2 | 0/1 | 2/2 | 1/1 | ~1,100 | **FAIL** | No brand page links (brands are mentioned but no `/brands/{brand}` link). |
| 5 | `behr-vs-sherwin-williams-vs-benjamin-moore` | Behr vs SW vs BM: Which Paint Brand Is Best? | 0/5 | 0/2 | 3/1 | 3/2 | 0/1 | ~1,000 | **FAIL** | Zero Swatch color links. Zero family links. No blog cross-links. |
| 6 | `calming-bedroom-paint-colors` | 10 Calming Bedroom Colors Designers Love | 10/5 | 2/2 | 0/1 | 1/2 | 1/1 | ~900 | **FAIL** | No brand page links. Only 1 tool link (room-visualizer). Under 1,000 words. |
| 7 | `warm-vs-cool-paint-colors` | Warm vs Cool Paint Colors: How to Choose | 8/5 | 2/2 | 0/1 | 3/2 | 0/1 | ~950 | **FAIL** | No brand page links. No blog cross-links. Under 1,000 words. |
| 8 | `most-popular-paint-colors-2025` | The Most Popular Paint Colors of 2025 | 10/5 | 1/2 | 0/1 | 3/2 | 4/1 | ~1,050 | **FAIL** | Only 1 family link (green). No brand page links. |
| 9 | `best-exterior-paint-colors` | Best Exterior Paint Colors to Boost Curb Appeal | 14/5 | 2/2 | 0/1 | 3/2 | 1/1 | ~1,400 | **FAIL** | No brand page links. |
| 10 | `sherwin-williams-vs-benjamin-moore` | SW vs BM: The Complete Comparison | 0/5 | 0/2 | 2/1 | 3/2 | 1/1 | ~1,100 | **FAIL** | Zero Swatch color links. Zero family links. |
| 11 | `benjamin-moore-most-popular-whites` | BM's Most Popular White Paint Colors Ranked | 5/5 | 0/2 | 1/1 | 2/2 | 1/1 | ~1,050 | **FAIL** | Zero family links. |
| 12 | `paint-sheen-guide` | Paint Sheen Guide: Flat vs Eggshell vs Satin vs Semi-Gloss | 0/5 | 0/2 | 0/1 | 1/2 | 4/1 | ~1,000 | **FAIL** | Non-color educational post but still: zero Swatch links, zero family links, zero brand links. Only 1 tool (paint-calculator). |
| 13 | `how-to-test-paint-samples` | How to Test Paint Samples the Right Way | 0/5 | 0/2 | 0/1 | 4/2 | 1/1 | ~1,050 | **FAIL** | Non-color educational post but still: zero Swatch links, zero family links, zero brand links. |
| 14 | `color-theory-for-home-decorators` | Color Theory for Home Decorators: A Practical Guide | 7/5 | 2/2 | 0/1 | 3/2 | 1/1 | ~1,100 | **FAIL** | No brand page links. |
| 15 | `best-paint-colors-north-facing-rooms` | Best Paint Colors for North-Facing Rooms | 12/5 | 5/2 | 0/1 | 3/2 | 0/1 | ~1,200 | **FAIL** | No brand page links. No blog cross-links. |
| 16 | `best-paint-colors-east-facing-rooms` | Best Paint Colors for East-Facing Rooms | 12/5 | 4/2 | 0/1 | 2/2 | 0/1 | ~1,200 | **FAIL** | No brand page links. No blog cross-links. |
| 17 | `paint-color-trends-2026` | Paint Color Trends 2026: What Designers Are Predicting | 5/5 | 5/2 | 0/1 | 2/2 | 4/1 | ~1,100 | **FAIL** | No brand page links. |
| 18 | `best-living-room-paint-colors` | Best Living Room Paint Colors for Every Style | 14/5 | 3/2 | 0/1 | 1/2 | 2/1 | ~1,300 | **FAIL** | No brand page links. Only 1 tool link (room-visualizer). |

---

## Summary

**Total posts audited:** 18
**Passing:** 0
**Failing:** 18

### Most Common Failures

| Issue | Count | Posts Affected |
|-------|-------|----------------|
| Missing brand page links (`/brands/{brand}`) | 14 | 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18 + posts 10, 5 have brands but no colors |
| Missing blog cross-links | 6 | 2, 3, 5, 7, 15, 16 |
| Insufficient family links (< 2) | 6 | 1, 2, 5, 8, 10, 11 |
| Insufficient tool links (< 2) | 3 | 6, 12, 18 |
| Zero Swatch color links | 4 | 5, 10, 12, 13 |
| Under 1,000 estimated words | 6 | 1, 2, 3, 6, 7 (borderline: 5, 12) |

### Issue Breakdown by Priority

**Priority 1 — Zero colors (violates core requirement for color-related posts):**
- `behr-vs-sherwin-williams-vs-benjamin-moore` — brand comparison with zero color Swatches
- `sherwin-williams-vs-benjamin-moore` — brand comparison with zero color Swatches
- `paint-sheen-guide` — educational/technique post (non-color; may apply relaxed rules)
- `how-to-test-paint-samples` — educational/technique post (non-color; may apply relaxed rules)

**Priority 2 — Missing brand page links (most pervasive issue):**
14 of 18 posts lack any `/brands/{brand}` link. This is the single most common failure. Posts mention brands like Sherwin-Williams and Benjamin Moore in Swatch components but never link to the brand landing page.

**Priority 3 — Missing blog cross-links:**
6 posts have no cross-links to other blog posts. These are missed internal linking opportunities.

**Priority 4 — Insufficient family links:**
6 posts have 0 or 1 color family links (need minimum 2).

**Priority 5 — Under ~1,000 words:**
Posts 1, 2, 3, 6, and 7 are estimated under 1,000 words. Posts 5 and 12 are borderline.

---

## Detailed Notes per Post

### 1. `2026-colors-of-the-year-every-brand-compared`
- **Colors (5/5):** Universal Khaki, Silhouette, Hidden Gem, Warm Mahogany, Warm Eucalyptus
- **Families (1/2):** green only — NEEDS 1 more (e.g., brown, beige, or gray)
- **Brands (1/1):** /brands/benjamin-moore
- **Tools (3/2):** search, compare, room-visualizer
- **Cross-links (1/1):** 2025-colors-of-the-year-every-brand-compared
- **Words:** ~850 — short

### 2. `2025-colors-of-the-year-every-brand-compared`
- **Colors (5/5):** Grounded, Cinnamon Slate, Rumors, Purple Basil, Encore
- **Families (1/2):** red only — NEEDS 1 more
- **Brands (1/1):** /brands/benjamin-moore
- **Tools (3/2):** search, compare, room-visualizer
- **Cross-links (0/1):** NONE — should link to 2026 COTY or another post
- **Words:** ~750 — short

### 3. `best-sherwin-williams-alternatives-to-benjamin-moore`
- **Colors (11/5):** Revere Pewter, Accessible Beige, Simply White, Extra White, Pure White, Hale Navy, Naval, Charcoal Blue, Edgecomb Gray, Agreeable Gray, Chantilly Lace, High Reflective White
- **Families (2/2):** white, gray
- **Brands (1/1):** /brands (generic brands page link)
- **Tools (3/2):** search, room-visualizer, (search used as cross-brand matching reference)
- **Cross-links (0/1):** NONE — should link to SW vs BM comparison or another post
- **Words:** ~850 — short

### 4. `best-kitchen-paint-colors-2025`
- **Colors (15/5):** Chantilly Lace, Pure White, White Dove, Essex Green, Pewter Green, Tarrytown Green, Edgecomb Gray, Accessible Beige, Shiitake, Naval, Wrought Iron, Grounded, Boothbay Gray, Sleepy Blue
- **Families (3/2):** white, green, blue
- **Brands (0/1):** NONE — no `/brands/{brand}` links
- **Tools (2/2):** room-visualizer, paint-calculator
- **Cross-links (1/1):** 2025-colors-of-the-year-every-brand-compared
- **Words:** ~1,100

### 5. `behr-vs-sherwin-williams-vs-benjamin-moore`
- **Colors (0/5):** ZERO Swatch components
- **Families (0/2):** ZERO family links
- **Brands (3/1):** /brands/behr, /brands/sherwin-williams, /brands/benjamin-moore
- **Tools (3/2):** search, compare, palette-generator
- **Cross-links (0/1):** NONE
- **Words:** ~1,000 (borderline)

### 6. `calming-bedroom-paint-colors`
- **Colors (10/5):** Quiet Moments, Silver Mist, Sleepy Blue, Saybrook Sage, Softened Green, Edgecomb Gray, Shoji White, Balboa Mist, Silver Peony
- **Families (2/2):** blue, green
- **Brands (0/1):** NONE
- **Tools (1/2):** room-visualizer only — NEEDS 1 more
- **Cross-links (1/1):** understanding-paint-color-undertones
- **Words:** ~900

### 7. `warm-vs-cool-paint-colors`
- **Colors (8/5):** Edgecomb Gray, Stonington Gray, Shoji White, Accessible Beige, White Dove, Quiet Moments, Snowbound, Accessible Beige (duplicate)
- **Families (2/2):** blue, green
- **Brands (0/1):** NONE
- **Tools (3/2):** palette-generator, compare, (inspiration is not a tool)
- **Cross-links (0/1):** NONE — links to /inspiration but no blog cross-link
- **Words:** ~950

### 8. `most-popular-paint-colors-2025`
- **Colors (10/5):** Agreeable Gray, White Dove, Edgecomb Gray, Pewter Green, Pure White, Saybrook Sage, Essex Green, Restful, Naval, Hale Navy
- **Families (1/2):** green only — NEEDS 1 more
- **Brands (0/1):** NONE
- **Tools (3/2):** search, room-visualizer, palette-generator
- **Cross-links (4/1):** best-white-paint-colors-guide, best-kitchen-paint-colors-2025, 2025-colors-of-the-year, warm-vs-cool
- **Words:** ~1,050

### 9. `best-exterior-paint-colors`
- **Colors (14/5):** White Dove, Chantilly Lace, Pure White, Wrought Iron, Essex Green, Naval (x2), Agreeable Gray, Mega Greige, Rumors, Grounded, Wrought Iron (x2)
- **Families (2/2):** white, gray
- **Brands (0/1):** NONE
- **Tools (3/2):** palette-generator, paint-calculator, search
- **Cross-links (1/1):** 2025-colors-of-the-year-every-brand-compared
- **Words:** ~1,400

### 10. `sherwin-williams-vs-benjamin-moore`
- **Colors (0/5):** ZERO Swatch components — entirely text-based comparison
- **Families (0/2):** ZERO family links
- **Brands (2/1):** /brands/sherwin-williams, /brands/benjamin-moore
- **Tools (3/2):** search, compare, palette-generator
- **Cross-links (1/1):** best-sherwin-williams-alternatives-to-benjamin-moore
- **Words:** ~1,100

### 11. `benjamin-moore-most-popular-whites`
- **Colors (5/5):** White Dove, Chantilly Lace, Simply White, Decorator's White, Pale Oak
- **Families (0/2):** ZERO family links — NEEDS at least 2 (e.g., white, beige)
- **Brands (1/1):** /brands/benjamin-moore
- **Tools (2/2):** compare, room-visualizer
- **Cross-links (1/1):** best-white-paint-colors-guide
- **Words:** ~1,050

### 12. `paint-sheen-guide`
- **Colors (0/5):** ZERO — educational/technique post (non-color)
- **Families (0/2):** ZERO
- **Brands (0/1):** ZERO
- **Tools (1/2):** paint-calculator only — NEEDS 1 more
- **Cross-links (4/1):** best-kitchen-paint-colors-2025, calming-bedroom-paint-colors, best-bathroom-paint-colors, best-living-room-paint-colors
- **Words:** ~1,000 (borderline)
- **Note:** Non-color post — per relaxed rules, no forced color swatches needed, but still needs tool links + blog cross-links + brand link.

### 13. `how-to-test-paint-samples`
- **Colors (0/5):** ZERO — educational/technique post (non-color)
- **Families (0/2):** ZERO
- **Brands (0/1):** ZERO
- **Tools (4/2):** search, room-visualizer, color-identifier, paint-calculator
- **Cross-links (1/1):** understanding-paint-color-undertones
- **Words:** ~1,050
- **Note:** Non-color post — per relaxed rules, no forced color swatches needed, but still needs brand link.

### 14. `color-theory-for-home-decorators`
- **Colors (7/5):** Naval, Wholesome, Saybrook Sage, Quiet Moments, Silver Mist, Bright Blue (no link), Quiet Moments (dup)
- **Families (2/2):** green, blue
- **Brands (0/1):** NONE
- **Tools (3/2):** search (x2), palette-generator, room-visualizer
- **Cross-links (1/1):** warm-vs-cool-paint-colors
- **Words:** ~1,100

### 15. `best-paint-colors-north-facing-rooms`
- **Colors (12/5):** White Dove, Pure White, Alabaster, Edgecomb Gray, Accessible Beige, Shoji White, Hawthorne Yellow, Ivoire, Pale Oak, Dimity
- **Families (5/2):** white, beige, yellow, pink, (search/compare used as LRV reference)
- **Brands (0/1):** NONE
- **Tools (3/2):** search, compare, room-visualizer
- **Cross-links (0/1):** NONE
- **Words:** ~1,200

### 16. `best-paint-colors-east-facing-rooms`
- **Colors (12/5):** Balboa Mist, Agreeable Gray, Edgecomb Gray, Saybrook Sage, Softened Green, Crystalline, White Dove, Alabaster, Quiet Moments, Sleepy Blue
- **Families (4/2):** beige, green, white, blue
- **Brands (0/1):** NONE
- **Tools (2/2):** compare, room-visualizer
- **Cross-links (0/1):** NONE
- **Words:** ~1,200

### 17. `paint-color-trends-2026`
- **Colors (5/5):** Hidden Gem, Warm Eucalyptus, Universal Khaki, Silhouette, Warm Mahogany
- **Families (5/2):** green, brown, beige, purple, yellow
- **Brands (0/1):** NONE
- **Tools (2/2):** room-visualizer, palette-generator
- **Cross-links (4/1):** 2026-colors-of-the-year, warm-vs-cool, most-popular-colors-2025, 2025-colors-of-the-year
- **Words:** ~1,100

### 18. `best-living-room-paint-colors`
- **Colors (14/5):** Chantilly Lace, Decorator's White, Snowbound, Edgecomb Gray, Agreeable Gray, Balboa Mist, White Dove, Shoji White, Essex Green, Hale Navy, Cinnamon Slate, Boothbay Gray, Safari Beige
- **Families (3/2):** white, beige (x2), blue
- **Brands (0/1):** NONE
- **Tools (1/2):** room-visualizer only — NEEDS 1 more
- **Cross-links (2/1):** 2025-colors-of-the-year, warm-vs-cool-paint-colors
- **Words:** ~1,300

---

## Recommended Fixes (Quick Wins)

### Add brand page links to 14 posts
Most posts mention Sherwin-Williams and Benjamin Moore by name but never link to `/brands/sherwin-williams` or `/brands/benjamin-moore`. Adding one brand link per post is a simple fix.

**Posts needing brand links:** 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18

### Add blog cross-links to 6 posts
**Posts needing cross-links:** 2, 3, 5, 7, 15, 16

### Add a second family link to 6 posts
**Posts needing family links:** 1, 2, 5, 8, 10, 11

### Add second tool link to 3 posts
**Posts needing a second tool:** 6 (add compare, search, or paint-calculator), 12 (add room-visualizer or search), 18 (add compare, search, paint-calculator, or palette-generator)

### Add color Swatches to brand comparison posts
Posts 5 (`behr-vs-sw-vs-bm`) and 10 (`sw-vs-bm`) are brand comparison posts with zero color examples. Adding representative Swatch links would significantly improve both SEO and user experience.

### Expand short posts
Posts 1, 2, 3, 6, 7 are estimated under 1,000 words. Adding a paragraph or two with additional context, color examples, or tips would bring them up to target.
