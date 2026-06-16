# Orchestrator Verification Note — Color-Page Crawl/Index Question
**Date:** 2026-06-03
**Author:** Audit orchestrator (direct verification of the seo-google CRITICAL finding)

## Claim under test
`seo-google` reported: all ~23,000 color pages are "unknown to Google" (URL Inspection),
color-page indexation ≈ 0%, and hypothesized a **route-level technical crawl exclusion**
(X-Robots-Tag / robots.txt disallow / ISR error to Googlebot) — "one fix unlocks 23,000 pages."

## Direct verification (Googlebot UA against /colors/sherwin-williams/agreeable-gray-7029)
- HTTP status: **200** (served to Googlebot UA)
- `X-Robots-Tag` header: **absent** (no header-level noindex)
- `<meta name="robots">` noindex in rendered head: **absent**
- `<link rel="canonical">`: **present and self-referential** (correct)
- robots.txt: **no `/colors` disallow** (only /dashboard, /auth/, /api/, faceted params)
- cache-control: `public, max-age=0, must-revalidate` (normal ISR; not a crawl blocker)

## Verdict: NO technical crawl block exists.
The "one technical fix unlocks 23K pages" framing is **not supported**. The color-page template
is crawlable and indexable at the protocol level.

## Most-likely true cause
**HCU-driven crawl-budget starvation.** Under the March 3 Helpful-Content demotion, Google has
reduced crawl of the site's largest, thinnest, most-templated page type (the ~23K programmatic
color pages). Symptom = "unknown to Google"; cause = sitewide quality classification, not a header.
Corroborated by: seo-sxo (color pages read as data cards, not the review content that ranks for the
query class) and seo-content (thin/templated programmatic risk). seo-performance rules OUT CWV as a
cause (field data all-green: LCP 1.86s / INP 63ms / CLS 0 mobile).

## Implication for the action plan
The recovery lever is NOT a robots/header edit. It is:
1. Raise color-page content quality + uniqueness (depth, undertone-under-light, pairings, one image).
2. Consider selectively noindexing the thinnest color variants to concentrate quality signal.
3. Keep feeding the blog layer (the only layer Google is actively crawling) to lift the sitewide
   quality sample and earn crawl budget back.
4. Still verify in GSC with a live URL test (cheap) to be 100% certain no per-route surprise — but
   the protocol-level evidence above says the block is quality, not technology.

## Secondary note
seo-google flagged PSI SEO score 66/100 on a color page vs 100 on homepage. With noindex ruled out,
the 66 is likely from other Lighthouse SEO checks (meta description, descriptive link text, tap
targets, font legibility) — the seo-technical report should enumerate which. Not a crawl blocker.
