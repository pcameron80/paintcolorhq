# PaintColorHQ Blog Pipeline — Runbook

Repeatable process for producing one authoritative blog post. Semi-automated:
reuses the `researcher`, `content-writer`, and `seo-preflight` skills + the
`gemini-3-pro-image` image pipeline + the 23K-color DB. **Never auto-publishes** —
every post ships as a PR for human review and merge.

**Core principle:** accuracy lives in *source-grounding + automated verification*,
NOT in the human reviewer (Philip isn't a paint expert). Philip's review = voice,
usefulness, topic fit, images. Claude's job = make every factual claim traceable
to the DB or a crawled primary source, and cut anything that isn't.

**Author:** Philip Cameron (honest framing — never invent paint/design credentials).
**Cadence:** ~2 posts/week. **Source of topics:** `2026-06-01-blog-topical-plan.md`
(work tier order).

---

## Stage 1 — Research (firecrawl/crawl4ai + DB)
1. Pick the next topic from the topical plan.
2. **SERP + primary sources** (firecrawl/crawl4ai): crawl the live SERP for the
   target query (what ranks, "people also ask", angles to beat) and the relevant
   **official brand pages** for any factual claims (codes, COTY, brand facts).
3. **DB pull** (the moat): for every color the post will name, fetch exact data —
   `getColorBySlug(brand, slug)` → hex, LRV, undertone, color_family, color_number;
   plus **cross-brand matches** (the closest match in each other brand + Delta-E).
   This is what makes the post uniquely data-backed.
4. Output a **research brief**: validated facts (each with its source), the angle,
   an outline, and a verified color-data table the writer pulls from.

## Stage 2 — Draft (content-writer skill, Philip's voice)
- Write from the brief, in voice (`~/Documents/CoWork-OS/ABOUT ME/voice-profile.md`
  + `writing-rules.md`); clear the four non-negotiables (useful/specific/evergreen/
  monetizable).
- Use the DB data inline (exact LRV, undertone) and **include the cross-brand
  matches** wherever colors are named — the differentiator competitors can't copy.
- Add a short **FAQ** (FAQPage-eligible JSON for AI engines) and **internal links**:
  color pages, the relevant **brand page**, `/compare`, and related posts.
- Every factual claim must be traceable to the brief.

## Stage 3 — Fact-verify (automated, adversarial)
Re-check the draft against sources, independent of the writer:
- Every color code / LRV / undertone / family → matches the DB exactly.
- "warmer/cooler/lighter than", COTY years, brand facts → matches a crawled source.
- Every internal link resolves (color slugs exist, pages return 200).
- **Cut or soften any claim that can't be verified.** Flag residual uncertainty.

## Stage 4 — Voice + slop QA
- Read against voice-profile + the four non-negotiables; kill AI-tells.
- Run **`seo-preflight`** (banned phrases, title/meta length + keyword, headings,
  schema, link rel/integrity, anchor quality). Fix CRITICALs before proceeding.

## Stage 5 — Images (gemini-3-pro-image)
- **Hero/cover** (~16:9): save to `public/blog/<slug>.webp` (gemini returns JPEG;
  convert via the existing `scripts/convert-blog-covers-to-jpg.mjs` pattern or save
  as the format the BlogPost references).
- **Matching Pinterest pin** (2:3, 1000×1500): save to `~/Desktop/Pinterest pins/`
  and set the post's `pinImage` (or let `/api/pin/blog` auto-generate from the cover).
- QA the images (read them) like we do for pins.

## Stage 6 — Insert the post
Add a `BlogPost` object to `src/lib/blog-posts.tsx` (newest first):
`slug, title, date, author: "Philip Cameron", excerpt, coverColor (hex),
coverImage, pinImage?, tags[], faq?[], content: () => (JSX)`. The post then
auto-appears in the sitemap, related-posts, and the Pinterest **guide** drip lane.

## Stage 7 — PR + human gate
- Branch, commit, push, open PR. **`seo-preflight` is the deploy gate.**
- Philip reviews **voice / usefulness / topic fit / images** — NOT paint facts
  (those are verified in Stage 3).
- Merge → post is live + becomes a Pinterest guide pin on the next drip.

---

## Parallel quick win (separate from posts)
Optimize `/brands/[slug]` pages for **"[brand] color chart"** + **"all [brand]
colors"** (top branded-lookup queries they rank for but don't target).

## Automation notes
- A small helper (`scripts/blog/research-colors.ts`) can dump the Stage-1 DB color
  table (hex/LRV/undertone + cross-brand matches) for a list of slugs — build it
  when first useful; it operationalizes both the data-moat and Stage-3 verification.
- Per-post work runs inline with Claude; the human gate is the PR. Two posts/week.
