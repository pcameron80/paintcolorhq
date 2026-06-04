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
   hex, LRV, undertone, color_family, color_number — plus **cross-brand matches**
   (the closest match in each other brand + Delta-E). This is what makes the post
   uniquely data-backed. Run:
   `npm run research-colors -- --topic="..." --colors="brand/slug,brand/slug" --out=docs/superpowers/content/research/<topic>.md`
   to produce the verified color table the writer drafts from.
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
- Every internal link resolves: run `npm run verify-links -- --file=<draft path>`.
  It confirms every color/family/brand/match link resolves against the DB and exits
  non-zero on any 404 risk.
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
- **Scheduling:** set the post's `date` to a future day to pre-stock it. It stays
  hidden from the live site, sitemap, and the pin drip until that date, then
  reveals itself (within ~1h, via ISR) — no second merge needed. Reviewable on the
  PR's Vercel preview by URL even while scheduled. See `src/lib/blog-publish.ts`.

## Stage 8 — Ping IndexNow (after the post is live)
- Once the post is **live** (merged with a current `date`, or the day a scheduled
  `date` reveals), run `npm run indexnow-blog` — it submits only blog posts that
  went live in the last 2 days to Bing/Yandex (use `--slug=<slug>` to target one,
  or `--days=N` for a wider window; `--dry` to preview).
- **Targeted on purpose.** This only ever pings a handful of NEW blog URLs. Do
  **not** resurrect the whole-sitemap `/api/cron/indexnow` daily submission — it
  floods the engines (killed for that reason). The script hard-caps at 25 URLs.

---

## Parallel quick win (separate from posts)
Optimize `/brands/[slug]` pages for **"[brand] color chart"** + **"all [brand]
colors"** (top branded-lookup queries they rank for but don't target).

## Automation notes
- Built: `npm run research-colors` (Stage 1 DB color table — hex/LRV/undertone +
  cross-brand matches) and `npm run verify-links` (Stage 3 link 404 gate). Pure
  cores unit-tested via `npm run test:blog`. The hero/pin step is
  `scripts/generate-blog-hero.ts` (Stage 5).
- Per-post work runs inline with Claude; the human gate is the PR. Two posts/week.
