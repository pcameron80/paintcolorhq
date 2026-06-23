# Color Page Structured-Depth — Design Spec

**Date:** 2026-06-23
**Status:** Approved (brainstorming) → ready for implementation plan
**Owner:** Philip Cameron

## Problem

AdSense rejected the site again for "thin content," and the same root cause is driving the
Helpful Content (HCU) demotion: ~26K color pages read as **thin / near-duplicate programmatic
content**. Evidence gathered 2026-06-23:

- Two different colors (Agreeable Gray vs Repose Gray) share **68% of their sentences** as
  templates with only the values swapped.
- The flagship page (Agreeable Gray) is **"Crawled – currently not indexed"** in GSC
  (last crawl 2026-05-07, fetch successful, robots allowed, canonical correct) — i.e. Google
  evaluated it and declined on quality grounds. AdSense reached the same verdict.
- The site is **bimodal**: ~153 colors have a curated, hand-quality "More about" editorial
  block (`src/lib/color-editorial.tsx`); the other ~25,850 have only the templated generator
  output. AdSense/HCU judge the site by its thin bulk.
- The pages are **not data-thin** — an obscure color (Bay Fog) already shows cross-brand matches
  across 8 brands, recommended pairings, technical profile, and FAQ (~1,200 words). There are
  **23,423 precomputed match-data files**. The unique *data* exists; the **presentation and prose
  are templated and near-identical** across colors.

## Constraints

- **No LLM-generated prose at scale.** This is exactly what triggered the 2026-03-03 HCU penalty
  ("AI-generated template content"). Hard no-go.
- **Cannot hand-write 26K editorial blocks.** The proven differentiator (curated "More about")
  does not scale by hand.
- **Delta E is never shown as a raw number** — plain language only ("Nearly identical" / "Very
  similar" / "Visible difference"). (Project rule.)
- Match-page route quirk and other gotchas in `CLAUDE.md` still apply.

## Goal / the bet

Make each color page genuinely unique and useful through its real, per-color **data** rather than
prose, so it reads as a substantive cross-brand reference instead of a near-duplicate template —
earning indexation and (downstream) AdSense eligibility. The centerpiece is the cross-brand
equivalence the site uniquely owns.

**This is a bet, not a certainty:** 26K identical *layouts* may still read as templated to Google.
The plan therefore validates on a small canary set before any wide commitment (see Validation).

## Approach — structured-data-first, minimal prose

Five changes to the color-page template (`src/app/colors/[brandSlug]/[colorSlug]/page.tsx` and
the data it pulls). All affect every color via one template; the per-color *data* is what differs.

### 1. "[Color] in every brand" equivalence matrix (new centerpiece)
Replace the short, mixed "Colors Similar to X" list with a complete, organized matrix: for each
of the ~13 brands that has a reasonable match, show the **single closest equivalent** as a visual
row — rendered swatch chip + name + code + plain-language closeness. Sorted best-first. Each row
links to that color's page (internal-link equity + crawl paths). Genuinely unique per color, maps
to the #1 query type (cross-brand matching), and *visual* — a strong anti-duplicate signal.

### 2. Side-by-side visual compare (top 2–3 matches)
Render the source color and its nearest equivalent(s) adjacent and large, answering "do these
actually match?" visually. Plain-language closeness label; no raw Delta E.

### 3. Coordinating palette, rendered
Render the existing pairing data as actual swatch chips (a mini palette), not prose. Keep/feed the
existing room-preview where present.

### 4. Same-brand collection context
"Lighter in this line: X / darker: Y," plus the collection/family the color belongs to, computed
from the brand catalog. Unique per color; adds internal links.

### 5. Trim the generic prose HARD
Remove the generic templated paragraphs (LRV-range sentence, lighting paragraph, generic pairing
sentence) produced by the templated path in `src/lib/color-description.ts`. Replace with a single
short **data-derived fact line** (hex, LRV, undertone, family — already unique values). Let the
structured sections carry the page.
- Keep the **153 curated "More about" blocks** (`color-editorial.tsx`) — those are genuine, not
  generic.
- Keep **FAQ**, but answers concise and data-derived.

## Out of scope (explicitly)

- LLM-generated editorial (penalty risk).
- Removing or weakening the existing `shouldIndex` gate (`dataQualityScore`, code-only-name,
  variant-slug exclusions in `generateMetadata`). It stays.
- Rewriting / expanding the 153 curated editorial blocks.
- Noindexing the long tail (the user chose depth over noindex; revisit only if the canary fails).

## Validation plan (de-risk before scale)

Because the template change is global the moment it ships, "scale" here means *trusting* it, not
re-deploying. Steps:

1. Ship the template changes behind the normal `seo-preflight` / `seo-drift` gate.
2. Choose a **canary set (~15 colors)** spanning popular (Agreeable Gray, Repose Gray) and
   long-tail (Bay Fog, etc.).
3. Request indexing on the canaries in GSC (Google hasn't re-crawled the flagship since 2026-05-07,
   so a re-crawl is overdue regardless).
4. Wait ~2–4 weeks. **Measure:** do canaries flip from "Crawled – currently not indexed" to
   "Indexed"? Track impressions on those URLs.
5. **Decision gate:** if canaries index → the bet holds, no further action (already live for all).
   If they don't → the structured-data approach alone is insufficient; reconsider tiering /
   selective noindex (the rejected option B) with this evidence in hand.

## Success criteria

- Two similar colors share **< ~40%** templated sentences (down from 68%) after the prose trim +
  structured sections.
- Each page renders the cross-brand matrix, ≥1 visual side-by-side, a rendered pairing palette, and
  collection context — all from real per-color data.
- Canary pages re-crawled and **indexed** within ~4 weeks (primary outcome signal).
- No regression flagged by `seo-preflight` / `seo-drift`.

## Files in scope

- `src/app/colors/[brandSlug]/[colorSlug]/page.tsx` — section restructure (matrix, side-by-side,
  rendered palette, collection context; remove generic prose render).
- `src/lib/color-description.ts` — trim generic prose generation to a short data-derived fact line.
- New presentational components (likely `src/components/`) — equivalence matrix, side-by-side
  compare, palette chips, collection context. Each: one purpose, props-driven, independently
  testable.
- Match/sibling data access in `src/lib/queries.ts` (nearest-per-brand selection; same-line
  lighter/darker) — reuse existing match data / `cross_brand_matches`; no new pipeline if avoidable.
- Untouched: `color-editorial.tsx` (curated blocks), the `shouldIndex` gate.

## Open implementation questions (for the plan, not blockers)

- Exact "nearest per brand" selection from the precomputed match data (dedupe, threshold for
  "no reasonable match in brand X").
- Where same-line lighter/darker comes from (brand catalog query vs precompute).
- Whether the rendered palette reuses `/api/pin/palette`-style chips or inline CSS swatches.
