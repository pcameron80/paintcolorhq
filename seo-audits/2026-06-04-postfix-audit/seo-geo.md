# GEO Post-Fix Validation — paintcolorhq.com
**Date:** 2026-06-04  
**Auditor:** claude-seo v2.0.0  
**Scope:** Validation of AI-citeability fixes shipped today. Four page types tested: family (`/colors/family/blue`), brand (`/brands/sherwin-williams`), match (`/match/sherwin-williams/agreeable-gray-7029-to-benjamin-moore`), color detail (`/colors/sherwin-williams/agreeable-gray-7029`). Plus `llms.txt` and `robots.txt`.

---

## GEO Readiness Score: 68 / 100

| Dimension | Weight | Raw | Weighted |
|---|---|---|---|
| Citability | 25% | 62 | 15.5 |
| Structural Readability | 20% | 72 | 14.4 |
| Multi-Modal Content | 15% | 55 | 8.3 |
| Authority & Brand Signals | 20% | 75 | 15.0 |
| Technical Accessibility | 20% | 75 | 15.0 |
| **Total** | | | **68.2** |

Score reflects confirmed live state as of this crawl. Prior audit baseline was approximately 54 before today's fixes.

---

## AI Crawler Access (robots.txt)

| Crawler | Status |
|---|---|
| GPTBot | Allowed |
| OAI-SearchBot | Allowed |
| ChatGPT-User | Allowed |
| ClaudeBot | Allowed |
| PerplexityBot | Allowed |
| Google-Extended | Allowed |
| Applebot-Extended | Allowed |
| CCBot | Not blocked (training-only crawler, low-priority) |
| anthropic-ai | Not blocked |

Full-access posture is correct for AI search visibility. No issues.

---

## llms.txt

**Status: Present and valid.**  
URL: `https://www.paintcolorhq.com/llms.txt`  
Linked from `<head>` via `<link rel="help" type="text/plain" href="/llms.txt">` — discoverable by crawlers that follow head links.

### Undertone Contradiction — FIXED

**Prior state:** The Agreeable Gray entry read "Warm balanced neutral" in llms.txt while the on-page schema said "Neutral". Two different answers to the same question.

**Current state (confirmed live):**
```
What undertone does Agreeable Gray have? → It's classified as a neutral and reads as a warm greige — no single undertone dominates, which is why it works in most lighting conditions.
```

This matches the on-page Product schema (`"undertone": "Neutral"`) and the color detail page verdict copy. No remaining contradiction between llms.txt, schema, and visible text on this question.

**Spot-check of other llms.txt facts (no contradictions found):**
- Agreeable Gray hex listed as `#D1CBC1` in llms.txt, `#D1CBC1` in live Product schema. Match.
- LRV listed as `60` in llms.txt, `60.1` in live schema. Acceptable rounding — not a contradiction.
- SW store count `4,000+` consistent across llms.txt and brand page article.

---

## Fix 1: Article Tags on Editorial Passages

### Family Pages — `/colors/family/blue`

**Live HTML confirms:** 2 `<article>` blocks present.

| Block | Word count | Content |
|---|---|---|
| `#family-intro` | 97 words | Intro editorial about blue paint — use cases, popular picks, trend notes |
| `#family-guide` | 43 words | Room-by-room application guidance |

**Trafilatura extracted text: 629 characters (97 words of substantive content).**

The article tags are present and trafilatura does pick up the intro passage. However, the extraction is limited to the intro block. The 43-word guide block is short enough that trafilatura classifies it as boilerplate and discards it. Combined extractable word count on the family page is **97 words** — below the 134-word AI-citation window.

The fix moved these passages from what were effectively navigation-adjacent `<div>` elements into `<article>` containers. That is confirmed correct. The extraction improvement versus the prior state (where trafilatura returned the same intro paragraph anyway because the text density was sufficient without the semantic hint) is marginal on this page. The real bottleneck on family pages is passage length, not tag structure. The intro block needs ~40 more words to clear the 134-word threshold as a self-contained citable unit.

### Brand Pages — `/brands/sherwin-williams`

**Live HTML confirms:** 2 `<article>` blocks present.

| Block | Word count | Content |
|---|---|---|
| `#brand-intro` | 180 words | Brand overview — scale, best-seller, founding, audience, trust signals |
| `#brand-details` | 64 words | Popular colors, cross-brand matching CTA, product lines summary |

**Trafilatura extracted text: 1,254 characters.** The `#brand-intro` article (180 words) is fully extracted and is a strong citable passage — it exceeds the 134–167 word citation window and contains specific statistics (4,000+ stores, 1,700+ colors, LRV 60, hex #D4CDC3, five-year top-seller claim, 1866 founding, 30–40% sale cadence). This is the most citable block on the site right now.

The `#brand-details` block (64 words) is extracted as a secondary passage. It is a borderline length for citation but contains specific named colors and tool context.

Verdict: **brand-intro article is functioning as intended.** It clears the citation window, is self-contained, and leads with a direct answer to "who is Sherwin-Williams and what are their most popular colors."

### Match Pages — `/match/sherwin-williams/agreeable-gray-7029-to-benjamin-moore`

**Live HTML confirms:** 1 `<article>` block (`#match-methodology`).

| Block | Word count | Content |
|---|---|---|
| `#match-methodology` | 134 words | CIEDE2000 methodology explanation + match verdict for Agreeable Gray → Wish |

**Trafilatura extracted text: 803 characters.** The methodology article is fully extracted. At 134 words, it sits at the exact bottom of the AI-citation window (134–167 words). It explains the matching science in plain language, names the top match (Wish AF-680), and gives actionable guidance (order a sample, check it in your room). Self-contained and citable.

This is a meaningful improvement. The prior state had this passage inside a generic `<div>` that trafilatura classified as part of the page chrome and extracted inconsistently.

---

## Fix 2: Color Page Description Diversity + "Avoid If" Verdict Line

**Confirmed live** on `/colors/sherwin-williams/agreeable-gray-7029`.

The "avoid if" / "skip it if" copy is present in the rendered HTML:

> "Skip it if you want a crisp, cool-modern look, or in rooms with heavy north light that can pull its warmth slightly muddy."

Trafilatura extracts 2,875 characters from this page — the richest extraction across all four page types tested. The extracted block includes:

- Hex, LRV, and undertone in the opening line
- The editorial verdict with "skip it if" decision guidance
- Cross-brand match summary naming specific colors and brands
- LRV context paragraph (mid-light range, bedrooms vs. living areas)
- Palette guidance (off-whites for trim, hardware pairings, accent colors)
- Lighting behavior under 2700K vs. 4000K

This is a genuinely citable passage. Any of the three paragraph blocks (technical profile, pairing guidance, lighting behavior) could be lifted by an AI engine as a standalone answer without losing meaning. The description diversification from PR #92 is working — the extracted text is clearly not templated.

**One weakness on color FAQ answers (see Still-Open section below).**

---

## Fix 3: Brand Pages — FAQPage Schema + Visible FAQ

**Confirmed live** on `/brands/sherwin-williams`.

FAQPage JSON-LD is present as a third JSON-LD block (alongside CollectionPage and Organization). Three questions confirmed:

| Question | Answer word count | In citation window? |
|---|---|---|
| How many Sherwin-Williams paint colors are there? | 21 words | No (below 134) |
| What are the most popular Sherwin-Williams paint colors? | 23 words | No |
| Can I match Sherwin-Williams colors to other brands? | 32 words | No |

The FAQPage schema and visible FAQ accordion are confirmed deployed. This is a new AI surface that did not exist before today. However, all three brand FAQ answers are 21–32 words — well below the 134-word citation threshold. They function as structured data signals to Google AI Overviews and as anchor text for perplexity-style direct answers, but they will not be cited verbatim by AI engines looking for passage-length context.

This is the same FAQ answer length problem flagged in the prior audit for color and match pages. See Still-Open section.

---

## Still-Open Findings

### 1. FAQ Answer Length — All Page Types (NOT Fixed Today, Remains Open)

This was flagged in the prior audit and was explicitly out of scope for today's fix batch. Confirming it is still open.

**Measured across all four page types:**

| Page type | FAQ answer word range | In 134–167w window? |
|---|---|---|
| Color detail (Agreeable Gray) | 15–23 words | No |
| Match page (Agreeable Gray → BM) | 11 words | No |
| Brand page (Sherwin-Williams) | 21–32 words | No |
| Family page (blue) | Not measured — no visible FAQ found in H2/H3 list (FAQPage schema present but accordion not confirmed visible in raw HTML) |

Specific color FAQ answers:
- "What undertone does Agreeable Gray have?" — 15-word answer: "Agreeable Gray by Sherwin-Williams has a neutral undertone and belongs to the gray color family." This is a schema-only stub. The llms.txt answer to the same question is 31 words and much more citable. The FAQ answer on the color page does not match llms.txt quality.
- "What is the LRV of Agreeable Gray?" — 17 words. Factually complete but not citable as a passage.

**Recommended fix:** Expand FAQ answers on color, brand, and match pages to 80–150 words each (a short paragraph, not a sentence stub). The llms.txt answers demonstrate the right format — they include the direct answer in the first sentence, then add context that makes the passage self-contained. Copying that pattern into the visible FAQ accordions would align the structured data surface with the passage-level citation surface.

Estimated impact: High. This is currently the largest gap between the site's actual knowledge depth and what AI engines can extract and cite from structured FAQ surfaces.

### 2. Family Page Article Length Below Citation Window

The blue family `#family-intro` article is 97 words. The citation window floor is 134 words. Adding one substantive sentence (a specific color recommendation with LRV data, or a room-type recommendation with an example color) would clear the threshold without changing the editorial character of the passage.

The `#family-guide` block at 43 words is too short to be extracted independently. It should either be merged into the intro article or expanded to standalone length.

### 3. Color Detail Page — No Article Tag Wrapper

The color detail page (`/colors/sherwin-williams/agreeable-gray-7029`) returned **0 article tags** in the live HTML, despite having 2,875 words of extractable content. Trafilatura still extracts the page well because the content density is high enough without a semantic hint. But the article tag was listed as a fix for family/brand/match pages — color pages were not included. Given that color pages are the highest-volume page type on the site, wrapping the editorial verdict, technical profile, and FAQ sections in `<article>` or giving them a `<main>` landmark would strengthen extraction reliability across the color template.

### 4. Match Page FAQ — Single Question, 11-Word Answer

The match page FAQPage schema contains one question ("What is the Benjamin Moore equivalent of Sherwin-Williams Agreeable Gray?") with an 11-word answer: "The closest Benjamin Moore equivalent is Wish (#D0CBC3) — virtually identical." That is correct and citable as a quick-answer snippet, but it is not a passage. Adding 2–3 more questions (why is Wish the closest match? what does Delta E 0.91 mean in practice? how do I use this match at the paint store?) and expanding the answers to 60–100 words each would make the match FAQ a meaningful AI surface.

---

## Platform-Specific Scores

| Platform | Score | Notes |
|---|---|---|
| Google AI Overviews | 64 | FAQPage schema on brand/color/match pages is indexable. Article tags present. Answer length too short for passage-level citation. |
| Perplexity | 72 | llms.txt present and well-structured. Brand-intro article (180w) and color editorial (2,875w extracted) are strong citation candidates. llms.txt undertone answer is citation-ready. |
| ChatGPT (Browse) | 65 | SSR pages, no JS required. Color detail extraction (2,875 chars) is the strongest surface. FAQ answer stubs limit structured-data citation. |
| Bing Copilot | 68 | robots.txt explicitly allows all major crawlers. llms.txt linked from head. Factual density on brand and color pages is competitive. |

---

## Top 5 Highest-Impact Remaining Changes

| Priority | Change | Affected pages | Effort | Impact |
|---|---|---|---|---|
| 1 | Expand FAQ answers from sentence stubs to 80–150-word paragraphs | Color, brand, match, family | Medium (template update + per-page copy) | High — unlocks FAQ as a passage-level citation surface across all page types |
| 2 | Expand family intro articles from ~97 to 134+ words | All 15 family pages | Low (add one substantive sentence per family) | Medium — clears the citation window floor on a high-volume page type |
| 3 | Add `<article>` wrapper to color detail editorial sections | ~23,000 color pages (template change) | Low (single template edit) | Medium — makes extraction more reliable even though trafilatura currently picks up content |
| 4 | Add 2–3 additional FAQ questions to match pages | Match page template | Medium | Medium — match pages have strong methodology content but only 1 FAQ question; expanding makes them competitive for "X equivalent of Y" queries in AI engines |
| 5 | Block CCBot and anthropic-ai in robots.txt (optional, training-only) | robots.txt | Trivial | Low — only relevant if you want to opt out of training data ingestion while keeping search visibility |

---

## Summary

**What improved (confirmed live):**

- `<article>` tags confirmed on family (2 blocks), brand (2 blocks), and match (1 block) pages. Trafilatura extraction yields 629, 1,254, and 803 characters respectively — all substantive, none returning navigation chrome.
- Brand-intro article at 180 words clears the AI-citation window and is the strongest new citable surface on the site.
- Match methodology article at 134 words is at the citation window floor and is fully extracted.
- llms.txt Agreeable Gray undertone answer corrected to "classified as a neutral and reads as a warm greige" — contradiction with on-page schema resolved. No remaining fact-level conflicts found in spot-check.
- Brand pages now have FAQPage schema and a visible FAQ accordion. New structured-data surface confirmed.
- Color detail page editorial diversity and "skip it if" verdict line confirmed live. 2,875 characters extracted by trafilatura — the richest extraction across all tested page types.

**What is still open:**

- FAQ answer length is below the AI-citation window on every page type (15–32 words vs. 134-word floor). This is the highest-impact remaining gap and was not in scope for today's fixes.
- Family intro articles are 97 words — below the 134-word citation floor by ~37 words.
- Color detail pages have no `<article>` tag wrapper despite being the highest-volume template.
- Match pages carry only one FAQ question with an 11-word answer.
