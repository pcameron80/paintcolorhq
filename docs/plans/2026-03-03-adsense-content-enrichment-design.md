# AdSense Content Enrichment Design

**Date:** 2026-03-03
**Goal:** Address Google AdSense "low value content" rejection by enriching thin pages with unique, useful prose content.

## Problem

Google rejected the site for "low value content." While strong pages exist (FAQ, About, Blog, color detail pages with generated descriptions), several page types are thin:

- **Match pages** (~thousands) — just two color swatches + Delta E score, no prose
- **Search page** (1) — heading + one sentence + search box
- **Compare page** (1) — heading + one sentence + empty state
- **Inspiration detail pages** (18) — palette name + ~10 word description + swatches

## Approach

Hybrid: deterministic template generators for high-volume pages (match, inspiration), handwritten static content for single pages (search, compare). All generators follow the existing `color-description.ts` pattern using `hashStr`/`pick` for deterministic variety.

## 1. Match Pages — `src/lib/match-description.ts`

New generator function: `generateMatchDescription(sourceColor, targetBrand, bestMatch, deltaE)`

Generates ~200 words structured as:
1. **Opening** — "Looking for {Brand}'s {Color} in {TargetBrand}? {Match} is the closest equivalent..." (varies by Delta E quality)
2. **Match quality** — practical explanation of what the Delta E score means
3. **Color comparison** — undertone and lightness comparison between source and match
4. **Sampling advice** — always test physical samples, finishes differ, lighting matters
5. **Cross-brand context** — why people switch brands (availability, price, regional preference)

**Page changes:** `src/app/match/[sourceBrandSlug]/[colorSlug]-to-[targetBrandSlug]/page.tsx`
- Import and call generator
- Render paragraph between swatches and "Other Close Matches"

## 2. Search Page — static content in `src/app/search/page.tsx`

Add ~300 words of handwritten content below the search results:

- **"How to Search for Paint Colors"** (H2) — tips for searching by name, number, hex code
- **"What You'll Find"** — what each color page includes (values, matches, harmonies, palettes)
- Internal links to `/brands`, `/colors`, `/tools/color-identifier`

## 3. Compare Page — static + dynamic in `src/app/compare/page.tsx`

**Empty state:** Replace minimal text with ~250 words:
- **"How to Compare Paint Colors"** — what to look for (LRV, undertone, lighting)
- **"Understanding the Numbers"** — brief guide to hex, RGB, LRV
- Links to `/search` and `/tools/color-identifier`

**Loaded state:** Add dynamic comparison sentence below data (LRV difference, which reflects more light).

## 4. Inspiration Pages — `src/lib/palette-description.ts`

New generator: `generatePaletteDescription(palette)`

Analyzes palette colors' overall mood (temperature, lightness distribution) and generates ~150-200 words:
1. **Mood/atmosphere** — what feeling this palette creates
2. **Room suggestions** — where it works best
3. **Role usage guide** — walls vs. trim vs. accent vs. pop
4. **Design style fit** — which interior styles it complements

**Page changes:** `src/app/inspiration/[slug]/page.tsx`
- Replace one-line description with expanded generated paragraph

## Files to Create
- `src/lib/match-description.ts`
- `src/lib/palette-description.ts`

## Files to Modify
- `src/app/match/[sourceBrandSlug]/[colorSlug]-to-[targetBrandSlug]/page.tsx`
- `src/app/search/page.tsx`
- `src/app/compare/page.tsx`
- `src/app/inspiration/[slug]/page.tsx`

## Not in Scope
- Color detail pages (already have good generated descriptions)
- Brand pages (already have unique brand intros)
- Color family pages (already have unique family content)
- Blog, FAQ, About (already strong)
