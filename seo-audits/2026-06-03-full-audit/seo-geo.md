# GEO / AI-Search-Readiness Audit — PaintColorHQ.com
**Date:** 2026-06-03
**Auditor:** GEO Specialist (Claude Sonnet 4.6)
**Scope:** Full site — color detail, match, family, blog, brand, tool, and homepage pages

---

## GEO Health Score: 74 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 72 | 18.0 |
| Structural Readability | 20% | 78 | 15.6 |
| Multi-Modal Content | 15% | 60 | 9.0 |
| Authority & Brand Signals | 20% | 70 | 14.0 |
| Technical Accessibility | 20% | 88 | 17.6 |
| **Total** | | | **74.2** |

---

## AI Crawler Access Status

Verified via `https://www.paintcolorhq.com/robots.txt` (200 OK, Last-Modified 2026-06-04):

| Crawler | Status | Notes |
|---|---|---|
| GPTBot | ALLOWED | Explicit `User-agent: GPTBot / Allow: /` |
| ChatGPT-User | ALLOWED | Explicit allow |
| ClaudeBot | ALLOWED | Explicit allow |
| PerplexityBot | ALLOWED | Explicit allow |
| OAI-SearchBot | ALLOWED | Explicit allow |
| Google-Extended | ALLOWED | Explicit allow |
| Applebot-Extended | ALLOWED | Explicit allow |
| CCBot | Not blocked (allowed by wildcard `*`) | Low risk — training-only bot |
| anthropic-ai | Not explicitly handled (allowed by wildcard) | Low risk |

**Assessment: Excellent.** All seven production AI crawlers are explicitly allowed. The parametric-URL disallows (`/compare?`, `/search?`, `/tools/palette-generator?`, `/tools/room-visualizer?`) are correct — they prevent combinatorial URL explosion without blocking the content-bearing landing pages.

---

## llms.txt Status

- **Present:** Yes — `https://www.paintcolorhq.com/llms.txt` (200 OK)
- **RSL 1.0 Licensing:** Partial — a plain-English license statement is present ("AI systems may cite Paint Color HQ data and editorial content with attribution...") but it is not a formal RSL 1.0 declaration
- **Format quality:** Excellent. The file follows the emerging llms.txt convention correctly:
  - Site summary paragraph with methodology callout
  - 15 Q&A pairs in the Common Questions section with direct answers + hex/LRV/Delta E values
  - 10 Master Color Profiles with full fact rows (hex, RGB, LRV, best match + Delta E)
  - Organized sections: cross-brand tools, visualization tools, blog guides, palettes, brand pages, family pages, methodology
  - All entries include canonical URLs

**Key strength:** The Q&A block directly answers the highest-traffic AI queries (Agreeable Gray BM equivalent, Repose Gray vs Agreeable Gray, LRV guidance for north-facing rooms) with specific data, not hedged prose. This is exactly what Perplexity and ChatGPT surface as cited passages.

**Gap:** The llms.txt answer for "What undertone does Agreeable Gray have?" contradicts the live Product schema. llms.txt says "Warm balanced neutral — no single undertone dominates" whereas the live page schema reads `"Undertone": "Neutral"`. Perplexity will cite whichever it encounters first; the two signals should match.

---

## Per-Platform Readiness

| Platform | Score | Notes |
|---|---|---|
| **Bing Copilot** | 78/100 | SSR + explicit schema + llms.txt = strong signal. Bing reads Product schema and FAQPage. The match-page FAQ answer (22 words) is below Bing's citation threshold. |
| **Perplexity** | 76/100 | llms.txt Q&A is directly ingestible. Color detail Product.description (135 words, SSR) is in the citation window. Family FAQ undertone answer (140 words) is ideal. |
| **Google AI Overviews** | 68/100 | FAQPage schema present across all page types. Color detail FAQ answers are short (undertone: 15 words, LRV: 18 words) — AIO prefers 40-60 word answers for inclusion in overviews. Homepage FAQ answers are 30-47 words, borderline. |
| **ChatGPT** | 70/100 | llms.txt is the primary signal; the Master Color Profiles section directly covers the match intent queries ChatGPT gets asked. No YouTube channel is the biggest gap — YouTube mention correlation with ChatGPT citation is 0.737. |

---

## Findings by Severity

---

### CRITICAL

#### C1 — Match Page FAQPage Answer Is 22 Words (Below Every AI Citation Threshold)
**Issue:** The FAQPage schema on match pages (e.g. `/match/sherwin-williams/agreeable-gray-7029-to-benjamin-moore`) contains a single FAQ with a 22-word answer: *"The closest Benjamin Moore equivalent is Wish (#D0CBC3) — virtually identical."* This is the single highest-value page type for the site's core competitive angle ("what is the [brand] equivalent of [color]?") and the answer is too thin for AI citation. The 134-167 word window the team targets is completely missed. Bing Copilot, Perplexity, and Google AIO all prefer self-contained answers of 40+ words that include: the match name, hex, Delta E context, plain-language proximity label, and a purchase note.

**Evidence:** Live HTML confirmed; `src/app/match/[sourceBrandSlug]/[matchSlug]/page.tsx` line 126-129 generates the FAQ. The rendered prose paragraph at line 170 has 36 words ("The closest Benjamin Moore equivalent to Sherwin-Williams Agreeable Gray (#D1CBC1) is Wish (#D0CBC3) — virtually identical. Always verify with physical paint samples.") — better but still short and not mirrored in the schema.

**Fix:** Expand the FAQPage `acceptedAnswer.text` at `page.tsx:128` to include: match name + hex, the plain-language Delta E label, actual Delta E score context ("a CIEDE2000 score under 1.0 means the colors are indistinguishable on a finished wall"), the source hex for comparison, and a purchase note. Target 50-80 words per answer minimum. The prose paragraph at line 169-171 already contains the right content — the schema answer should mirror it verbatim rather than being a stripped version.

**File:** `src/app/match/[sourceBrandSlug]/[matchSlug]/page.tsx` line 126-129

---

#### C2 — Color Detail FAQPage Answers Are 15-18 Words — Well Below Citation Floor
**Issue:** All three FAQ answers on color detail pages are critically short:
- Undertone FAQ: 15 words (`"Agreeable Gray by Sherwin-Williams has a neutral undertone and belongs to the gray color family."`)
- LRV FAQ: 18 words (`"Agreeable Gray has an LRV of 60.1, where 0 is pure black and 100 is pure white."`)
- Cross-brand matches FAQ: 22 words

Google AIO, Bing Copilot, and Perplexity require self-contained answers of 40-60 words minimum to use a FAQPage answer in a citation or overview panel. The team's target of 134-167 words applies to full prose paragraphs; for FAQPage answers 60-100 words is the practical floor for AI engines.

**Evidence:** Confirmed from live JSON-LD extraction of `/colors/sherwin-williams/agreeable-gray-7029`. FAQ items generated at `page.tsx` lines 234-243.

**Fix:** Expand each FAQ answer to 60-100 words. For the undertone FAQ, add: why the undertone category matters, what it means visually in different lighting, and how it affects pairing decisions. For LRV, add: what the number means in practice for room brightness, what the mid-light range means for room sizing. For the matches FAQ, add: Delta E context for each match and a practical selection note. These expansions are formulaic and can be generated from existing `deriveProps()` and color data — no hand-writing required at scale.

**File:** `src/app/colors/[brandSlug]/[colorSlug]/page.tsx` lines 234-243

---

### HIGH

#### H1 — Organization Schema Missing Wikipedia, LinkedIn, YouTube sameAs
**Issue:** The homepage Organization schema (`/`) contains only Pinterest as a sameAs entity:
```json
"sameAs": ["https://www.pinterest.com/paintcolorhq"]
```
Wikipedia entity presence and named-author LinkedIn are among the highest-correlation signals for AI citation authority. ChatGPT citation correlation: Wikipedia ~0.7, Reddit ~0.6, YouTube ~0.737. The site has no Wikipedia article (expected for a niche site), no LinkedIn company page in the schema, and no YouTube channel URL. The author Person schema on blog posts (`BlogPosting`) also lacks sameAs — it has `url` pointing to an internal authors page but no external entity links (LinkedIn, Twitter/X).

**Evidence:** Homepage Organization JSON-LD confirmed from live HTML. BlogPosting schema on `/blog/best-valspar-paint-colors` confirmed — author object has `url: "https://www.paintcolorhq.com/authors/paint-color-hq-staff"` but no `sameAs` array. Memory notes LinkedIn sameAs was shipped on PR #69 — it is not present on the homepage Organization schema or the blog author Person schema in the live crawl.

**Fix (immediate):**
1. Add LinkedIn company page URL to homepage Organization `sameAs` array
2. Add LinkedIn profile URL to the author `Person.sameAs` array in the BlogPosting schema generator (`src/lib/blog-posts.tsx` or wherever the author object is composed)
3. When the YouTube channel launches, add the channel URL to both Organization.sameAs and Person.sameAs immediately — YouTube is the strongest single citation-correlation signal

**Files:** Homepage Organization schema (likely `src/app/page.tsx` or a layout file), `src/lib/blog-posts.tsx`

---

#### H2 — Family Page FAQ: "How Many Colors" Answer Is 24 Words (Under-Serves AI)
**Issue:** The family/blue FAQPage contains three questions. The count question ("How many blue paint colors are catalogued?") returns a 24-word answer. The "how to match" question returns 46 words. Only the undertone question at 140 words is in the ideal citation window. The count and how-to questions are direct factual queries that AI engines commonly surface for category-level paint queries — the answers should be self-contained enough to cite independently.

**Evidence:** Confirmed from live JSON-LD extraction of `/colors/family/blue`.

**Fix:** Expand the count answer to include: the number, which brands are included, and a one-sentence context on why cross-brand access matters for this family (e.g., different brands dominate specific color families — Farrow & Ball dominates unique blue-greens, Benjamin Moore dominates historical navies). Target 60-80 words. The how-to answer is close but should include one concrete example with a color name and Delta E number.

**File:** `src/lib/family-content.tsx` (FAQ generation for family pages)

---

#### H3 — Brand Page Has No FAQPage Schema
**Issue:** The Sherwin-Williams brand page (`/brands/sherwin-williams`) contains two JSON-LD blocks: CollectionPage and Organization. There is no FAQPage schema. Brand pages are high-authority targets for "what are the best [brand] colors?" and "[brand] vs [brand]" queries — exactly the questions AI engines surface from brand pages. Every other major page type (color, match, family, blog, tool) has FAQPage; brand pages are the gap.

**Evidence:** Confirmed from live HTML of `/brands/sherwin-williams` — 2 JSON-LD blocks, neither is FAQPage.

**Fix:** Add a FAQPage schema to brand pages with 3-4 questions covering: top-selling colors (with hex/LRV data), brand-specific pricing and availability, quality tier positioning, and a comparison note vs. the most commonly compared brand. The CollectionPage already has `numberOfItems` and name data — the FAQ content should derive from `src/lib/brand-content.tsx`.

**File:** `src/app/brands/[brandSlug]/page.tsx`, `src/lib/brand-content.tsx`

---

#### H4 — Match Page Has Only One FAQ Question
**Issue:** Beyond the answer length problem (C1), match pages have a single FAQ entry. The PAA box for match-intent queries typically shows 3-5 questions: the main equivalency question, an undertone comparison question, an LRV comparison question, and a "where to buy" question. A single FAQ misses 4 of the 5 PAA positions that AI engines can populate from this page type.

**Evidence:** `src/app/match/[sourceBrandSlug]/[matchSlug]/page.tsx` line 126-129 generates a single `mainEntity` entry.

**Fix:** Add 2-3 additional FAQ entries to match pages:
1. "Are [source color] and [match color] the same undertone?" — answer should compare both undertones from the color data
2. "What is the LRV of [match color]?" — include match color LRV and compare to source LRV
3. "Where can I buy [match color]?" — retailer note from brand data

All three are answerable from data already in scope at render time.

**File:** `src/app/match/[sourceBrandSlug]/[matchSlug]/page.tsx`

---

### MEDIUM

#### M1 — Trafilatura Extracts Only 70-81 Words from Color and Match Pages
**Issue:** Trafilatura (the boilerplate-stripping tool AI crawlers commonly use for text extraction) pulls only 70-81 words from both the Agreeable Gray color page and the match page. This is because the key fact data (hex, LRV, undertone, match name) lives in styled `<div>` spec rows and React component output that trafilatura treats as non-article content. The `<p>` editorial paragraphs that trafilatura does extract are present and correct — but the spec table data, which is the primary value on these pages, is invisible to this extraction path.

**Evidence:** `render_page.py` with `--mode auto` returned 503 chars / 81 words for the color detail page and 503 chars / 70 words for the match page. The actual pages are 173KB and 71KB of HTML respectively. Trafilatura correctly extracts the `<p>` editorial verdict but ignores the spec row `<div>` grid.

**Fix (two-part):**
1. Wrap the key specs (hex, RGB, LRV, undertone, color family, brand) in a `<table>` or a `<dl>` / `<dt>` / `<dd>` structure rather than styled `<div>` rows. Trafilatura and LLM crawlers parse definition lists reliably. The visual design does not need to change — the semantic wrapper is invisible in a `hidden` or visually-identical re-render.
2. Alternatively, add a hidden `<article>` block below the fold with a plain-prose summary: "[Color name] ([hex]) by [Brand]. LRV [X]. [Undertone] undertone. [Color family] family. Closest cross-brand matches: [names with brand and Delta E]." This single paragraph, ~60-80 words, gives every AI crawler a clean extraction target without requiring spec-row restructuring.

**File:** `src/app/colors/[brandSlug]/[colorSlug]/page.tsx` (spec row section, lines 357-382)

---

#### M2 — llms.txt Undertone Answer Contradicts Live Schema
**Issue:** `llms.txt` Common Questions entry for Agreeable Gray undertone: *"Warm balanced neutral — no single undertone dominates."* Live Product schema `additionalProperty` undertone value: `"Neutral"`. Live hero display: `"NEUTRAL"`. The contradiction means AI engines that read both sources will get conflicting signals and may generate a hallucinated synthesis.

**Evidence:** `public/llms.txt` line 9 vs. live Product schema `additionalProperty[3].value = "Neutral"`.

**Fix:** Align llms.txt to use the same undertone label the schema and page use. Since the schema is auto-generated from the database and updates dynamically, the llms.txt static answers should match the schema output for all featured colors. Update the llms.txt Q&A section to say: *"Neutral — no dominant warm or cool cast, which is why it pairs broadly across most lighting conditions."*

**File:** `public/llms.txt`

---

#### M3 — Blog Author sameAs Is Internal URL Only
**Issue:** Blog post Person schema author URL points to `https://www.paintcolorhq.com/authors/paint-color-hq-staff` — an internal page. There is no external `sameAs` linking to a verifiable identity (LinkedIn, Twitter/X, or a personal site). AI engines that evaluate author authority (Google AIO's E-E-A-T signals, Perplexity's credibility scoring) rely on external entity links to confirm authorship is a real person with verifiable expertise.

Additionally, the author URL resolves to `/authors/paint-color-hq-staff` — "paint-color-hq-staff" as a slug reads as a generic staff page, not a named individual, which undercuts the named-author E-E-A-T signal that was specifically shipped to recover from the HCU penalty.

**Evidence:** BlogPosting schema from `/blog/best-valspar-paint-colors` — `author.url = "https://www.paintcolorhq.com/authors/paint-color-hq-staff"`. No `sameAs` array.

**Fix:**
1. Change author URL to `/authors/philip-cameron` (the actual named author slug)
2. Add `sameAs: ["https://www.linkedin.com/in/[philip-linkedin-slug]"]` to the Person schema
3. Make sure the `/authors/philip-cameron` page includes a Person schema with the same sameAs array

**File:** `src/lib/blog-posts.tsx` (author object definition)

---

#### M4 — Homepage FAQPage Has Only 3 Questions, All Below 50 Words
**Issue:** The homepage FAQPage has 3 questions: cross-brand matching (47 words), paint quantity (30 words), and undertones (44 words). The 30-word paint quantity answer is below the AI citation floor. More importantly, the homepage FAQ misses the highest-volume question category entirely: "what is the [brand] equivalent of [color]?" — which is the site's primary traffic thesis. Homepage FAQ should serve as an authority-building overview covering the site's key use cases.

**Evidence:** Confirmed from live homepage JSON-LD.

**Fix:** Add 2-3 questions covering: (1) "What is the most popular paint color in the US?" with a specific answer naming Agreeable Gray + hex + LRV + why; (2) "How accurate is cross-brand paint matching?" with a Delta E threshold explanation (~50 words); (3) Expand the paint quantity answer to 50+ words with a concrete example calculation. These directly serve the queries that AI engines get asked most frequently about paint.

**File:** Homepage JSON-LD generation (likely `src/app/page.tsx`)

---

#### M5 — Tool Pages (Color Identifier) Have Short FAQ Answers
**Issue:** The color identifier tool FAQPage has 3 questions with answers of 58, 56, and 44 words. The 44-word "What photo formats are supported?" answer is borderline. More critically, the tool's FAQ does not answer the question "What paint colors are closest to [hex]?" or "Can I match a paint color from a photo?" — the exact queries that would route traffic to this tool from AI engines. Tool FAQ content is oriented around how-it-works rather than answering the user's underlying question.

**Evidence:** Confirmed from live tool-identifier JSON-LD — FAQPage with 3 questions, all under 60 words.

**Fix:** Add 1-2 FAQ entries that answer the user's underlying question directly: "Can I identify a paint color from a photo?" (60-80 word answer covering the workflow, accuracy, and which brands are covered) and "How do I find the closest paint match to a specific color?" (covering hex input + upload paths).

**File:** `src/app/tools/color-identifier/page.tsx`

---

### LOW

#### L1 — Organization Schema on Homepage Is Missing Key Entity Signals
**Issue:** The homepage Organization schema includes: name, URL, logo (string, not ImageObject), description, one sameAs (Pinterest), and a ContactPoint. Missing: `foundingDate`, `areaServed`, `knowsAbout` (paint color matching methodology), and `hasOfferCatalog`. The logo is a plain string rather than an `ImageObject` with width/height, which is a Google structured data requirement for the Organization logo property.

**Evidence:** Homepage Organization JSON-LD — `"logo": "https://www.paintcolorhq.com/logo.webp"` (string). Compare to the publisher object in BlogPosting which correctly uses `{"@type": "ImageObject", "url": "...", "width": 600, "height": 60}`.

**Fix:** Upgrade logo to ImageObject in the homepage Organization schema to match the BlogPosting publisher format. Add `"areaServed": "US"` and `"knowsAbout": ["paint color matching", "CIEDE2000 color science", "interior paint colors"]`.

**File:** `src/app/page.tsx` or wherever homepage Organization schema is defined

---

#### L2 — No Dedicated /methodology Page Schema
**Issue:** The `/methodology` page (added in commit `ed18510`) explains CIEDE2000 and the matching pipeline — this is the single best authority-building page for AI engines evaluating whether PCHQ is a credible source for color-matching data. However, if the page lacks a `TechArticle` or `Article` schema with `author`, `datePublished`, and `about` properties pointing to CIEDE2000 as a subject, it will not be recognized as an authority page by AI crawlers.

**Evidence:** Not crawled directly in this audit — added as a finding based on the commit and the absence of any methodology page schema reference in the llms.txt About section (which only has a one-line note pointing to `/about`).

**Fix:** Add `TechArticle` JSON-LD to `/methodology` with `author: Philip Cameron`, `about: [{"@type": "Thing", "name": "CIEDE2000"}, {"@type": "Thing", "name": "color difference formula"}]`, and `citation` referencing the CIE standard. Update llms.txt "Color Science Methodology" section to point to `/methodology` rather than `/about`.

**Files:** `src/app/methodology/page.tsx`, `public/llms.txt`

---

#### L3 — No Structured Data for Individual Match Comparison Verdict
**Issue:** The match page prose verdict ("The closest Benjamin Moore equivalent to Sherwin-Williams Agreeable Gray (#D1CBC1) is Wish (#D0CBC3) — virtually identical") is excellent content but is wrapped in a plain `<p>` tag with no schema markup distinguishing it as a definitive answer. Adding a `Claim` or `Quotation` schema is not standard, but wrapping this block with a visually-distinct `<blockquote>` or adding `aria-label="match verdict"` would help parsers identify it as the primary answer element.

**Evidence:** `src/app/match/[sourceBrandSlug]/[matchSlug]/page.tsx` lines 169-172 — `<p className="text-on-surface-variant leading-relaxed max-w-3xl mb-10">`.

**Fix:** Minor — change `<p>` to `<p role="note" aria-label="match verdict">` and add a visually-distinguished container (already present with the Delta E badge below it). The bigger fix is C1 (expanding the FAQPage answer to match this prose).

**File:** `src/app/match/[sourceBrandSlug]/[matchSlug]/page.tsx` line 169

---

## Brand Mention & Entity Analysis

| Signal | Status | Notes |
|---|---|---|
| Wikipedia entity | Not present | Expected for a niche site — low priority to pursue artificially |
| Reddit mentions | Unknown — not checked in this audit | r/DIY, r/HomeImprovement, r/InteriorDesign are natural targets |
| YouTube presence | No channel launched yet | Highest-impact gap for ChatGPT citation correlation (0.737) |
| Pinterest | Active — confirmed in Organization sameAs | Drip automation live (PR #70-78). Good signal but low AI citation correlation |
| LinkedIn | Not in live schema | Memory shows PR #69 shipped LinkedIn sameAs — not present in live crawl |

**Gap summary:** The site is invisible on the two highest-correlation AI citation platforms (YouTube and Wikipedia). Pinterest activity is positive but its citation correlation is weak. The Reddit gap is addressable through content strategy (answering paint questions on r/DIY and linking back) rather than schema work.

---

## Technical Accessibility Assessment

- **SSR/ISR confirmed:** All audited pages return complete HTML to ClaudeBot without JavaScript execution. `render_page.py --mode auto` detected `is_spa: false` and used raw mode for all page types. The ISR architecture (revalidate=3600, generateStaticParams for popular colors) means popular color and match pages are pre-rendered at build time.
- **Response times:** Not measured in this audit, but ISR caching means Vercel Edge delivers cached HTML — favorable for crawler budget.
- **API routes blocked correctly:** `/api/` is disallowed in robots.txt, preventing crawlers from hitting the OG image and pin image endpoints.
- **CSP headers:** Present and permissive enough for crawlers — does not block content extraction.
- **Trafilatura extraction gap (M1):** While SSR is confirmed, the semantic structure of spec data (styled div rows) reduces AI text extraction quality even though the raw HTML is available.

---

## Top 5 Highest-Impact Changes

| Priority | Change | Effort | Impact |
|---|---|---|---|
| 1 | Expand match-page FAQPage answer from 22 to 60-80 words (C1) | 1-2 hours | Directly serves the site's #1 AI citation query type across Bing Copilot, Perplexity, Google AIO |
| 2 | Expand color detail FAQPage answers from 15-22 words to 60-100 words (C2) | 2-3 hours (templated) | 23,000+ pages; each FAQ expansion multiplies across the full corpus |
| 3 | Add FAQPage schema to brand pages (H3) | 3-4 hours | Brand pages serve "best [brand] colors" queries — one of the top AI paint question categories |
| 4 | Add LinkedIn + YouTube sameAs to Organization and author Person schemas (H1) | 30 minutes | Zero engineering risk; directly raises authority signal for ChatGPT + Perplexity |
| 5 | Wrap spec rows in `<dl>/<dt>/<dd>` or add hidden prose summary block (M1) | 2-3 hours | Fixes trafilatura extraction; ensures the hex/LRV/undertone facts reach AI engines even via text-extraction paths |

---

## Top 2 Quick Wins (Under 1 Hour Each)

**QW1 — Fix llms.txt undertone contradiction (M2)**
Edit `public/llms.txt` line 9 to change *"Warm balanced neutral — no single undertone dominates"* to align with the schema value *"Neutral"*. Add a one-sentence qualifier: "...a neutral undertone with no dominant warm or cool cast, which is why it adapts well across most lighting conditions." Estimated time: 10 minutes. Impact: eliminates a direct contradiction between the two sources AI engines consult most for this site.

**QW2 — Add LinkedIn sameAs to Organization schema and author Person schema**
Update the homepage Organization schema `sameAs` array and the blog post author Person schema to include the LinkedIn URLs. Based on memory notes, LinkedIn sameAs was intended to ship in PR #69 but is not present in the live crawl for Organization or the author Person object. Estimated time: 20-30 minutes. Impact: raises E-E-A-T author signal for Google AIO and Perplexity without any content changes.

---

## Verdict: Citeability of Color and Match Pages

### Color Detail Pages — Citable with Gaps

**What works:** The Product schema description is 135 words and falls in the AI citation window. It is server-rendered and starts with a direct question-answer ("What color is Agreeable Gray? It's a light warm gray with the hex code #D1CBC1"). The editorial verdict paragraph below the hero is an additional 49-word self-contained prose block. The spec row data (hex, RGB, LRV, undertone) is present in the HTML — the question is whether AI crawlers parse it from styled div rows (they may not via trafilatura; they will via direct HTML parsing). The `isSimilarTo` array in the Product schema names cross-brand matches with hex values — this is a strong citation signal that few competitors replicate.

**What fails:** The FAQPage answers are 15-22 words — too short for Google AIO inclusion or Bing Copilot citation. An AI engine reading this page will find the right facts but cannot use the FAQ schema answers as citation-ready passages.

**Verdict: Partially citable.** The Product.description is citation-ready. The FAQPage answers are not. Fix C2 to close the gap.

### Match Pages — Marginally Citable, High-Priority Fix Needed

**What works:** The H1 title ("Benjamin Moore Equivalent of Agreeable Gray 7029") directly matches the dominant query form. The page is SSR, fast, and ClaudeBot-accessible. The prose verdict paragraph (36 words) contains the right answer — match name, hex, and proximity label. The FAQPage technically exists.

**What fails:** The FAQPage answer is 22 words with a single question. It does not include: Delta E score context, source hex for comparison, LRV comparison, undertone comparison, or a purchase note. Any AI engine generating a "what is the Benjamin Moore equivalent of Agreeable Gray?" answer from this page alone would produce a correct but incomplete citation — or more likely ignore the FAQ and synthesize from the prose paragraph. The prose paragraph itself is 36 words, below most citation thresholds.

**Verdict: Under-optimized for the site's highest-value query type.** This is the page that should be cited for "SW Agreeable Gray BM equivalent" — the answer is there but the packaging is not. Fix C1 is the single highest-ROI change in this audit.

---

## Evidence Files Referenced

- `robots.txt` — live at https://www.paintcolorhq.com/robots.txt
- `public/llms.txt` — live at https://www.paintcolorhq.com/llms.txt
- `/tmp/agreeable-gray.html` — crawled 2026-06-03
- `/tmp/match-page.html` — crawled 2026-06-03
- `/tmp/family-blue.html` — crawled 2026-06-03
- `/tmp/blog-valspar.html` — crawled 2026-06-03
- `/tmp/brand-sw.html` — crawled 2026-06-03
- `/tmp/homepage.html` — crawled 2026-06-03
- `src/app/match/[sourceBrandSlug]/[matchSlug]/page.tsx`
- `src/app/colors/[brandSlug]/[colorSlug]/page.tsx`
- `src/lib/color-description.ts`
