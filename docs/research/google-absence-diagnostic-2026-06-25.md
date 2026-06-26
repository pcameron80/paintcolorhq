# Google-absence diagnostic — PaintColorHQ (Task A)

**Date:** 2026-06-25 · **Method:** dead-URL audit + 20-URL GSC URL-Inspection sample + GSC search-performance (28d). Property `sc-domain:paintcolorhq.com`.

## VERDICT (one line): **GO — with a caveat.**
Google is **not** structurally suppressing the site as an unfixable thin-content dead end. It is *indexing the improved pages and ranking them low* — an authority/relevance problem, which is fixable. The 10–25× upside is real, **but the ranking half is gated on off-page authority (the site has ~none), so it's a months-long build, not a cheap flip.** Prioritize it as a parallel medium-term play; Bing/AI stays the near-term business.

---

## Step 1 — dead URLs ruled out
25 random sitemap URLs (15 color, 4 brand, 3 family, 3 blog), follow-redirect HTTP check: **25/25 → 200, 0% dead.** Dead URLs are not the blocker. (colors-0.xml = 5,000 URLs; brands 13; families 15; blog 35.)

## Step 2–3 — indexation sample (20 URLs)
**12 indexed / 20 = 60% indexed** — a dramatic shift from the 2026-06-03 audit's "~0% indexed (23K de-crawled)."

| Type | Indexed | Sample |
|---|---|---|
| Color detail | **4 / 10 (40%)** | ✅ Revere Pewter, Sea Salt, Bay Fog, PPG Dark As Night · ❌ Agreeable Gray, Alabaster, White Dove, Behr Cracked Pepper, Behr Imperial Gray, Valspar Dancing Rose |
| Brand overview | **4 / 4 (100%)** | ✅ Benjamin Moore, Dunn-Edwards, Valspar, Sherwin-Williams |
| Tools | **2 / 3 (67%)** | ✅ /tools/color-identifier, /compare · ❌ /match/sherwin-williams/to/benjamin-moore |
| Blog | **2 / 3 (67%)** | ✅ best-behr, best-white-guide · ❌ understanding-undertones |

**The decisive pattern — it's a CRAWL-recency story, not a quality-rejection story:**
- Every page **crawled AFTER the June 3–4 de-thinning + June structured-data fixes** is mostly **indexed** (Revere Pewter 6/6, Sea Salt 6/11, Dark As Night 6/5, all 4 brands 6/14–6/24, color-identifier 6/14, best-behr 6/13, best-white 6/5).
- Every "not indexed" page is either **"Discovered – not indexed" (never crawled** — Alabaster, Cracked Pepper, Imperial Gray) or **"Crawled – not indexed" with a STALE pre-fix crawl date** (Agreeable Gray 5/7, Dancing Rose 4/17, match 5/8, undertones 5/8). Only one (White Dove, crawled 6/7) was crawled post-fix and still held back.
- Net coverage states across the 8 non-indexed: **5 "Crawled – currently not indexed" (4 stale pre-fix), 3 "Discovered – currently not indexed."**

→ Google **changed its behavior** in response to the content fixes (0% → 60% indexed in ~3 weeks). The holdouts are overwhelmingly pages Google **hasn't re-crawled since the fixes**, not pages it crawled-and-rejected. That is the opposite of "won't index near-template pages."

## Step 4 — ranking: Google-vs-Bing position delta
Indexed pages **do surface in Google** (they get impressions), they just rank low for competitive terms:
- Google 28d: ~23 clicks, homepage pos **66**; impression-getting pages span **pos 1–9 (page 1 for niche/low-competition queries** — e.g. a Kilz color #1, a Vista color #1.5, /match/kilz/to/sherwin-williams #7) up to **pos 40–86 for competitive terms** (2026-COTY blog pos 86, BM-whites pos 49, best-behr-bedrooms pos 41).
- Bing (per handoff): ~**1,983 clicks**, the same class of pages (tools, brand/chart pages) rank **pos 1–4** and growing ~3× in 2 months.
- **Delta ≈ 40–60 positions** on the same indexed pages → an **authority/relevance gap, not an exclusion.** Bing already rewards the differentiation; Google indexes it but withholds rank pending authority/trust signals.

## Decision rule applied
- ❌ NOT "mostly not indexed" → so **not** the structural thin-content NO-GO.
- ✅ IS "indexed (and rising) but ranking pos 40–90" → the **authority/relevance problem, fixable = GO.**

## What this means for next steps (queued, not part of this task)
GO, so the follow-up is worth it — but choose the *cheap* levers first since ranking-lift is authority-gated:
1. **Accelerate indexation of the already-improved pages** (cheap, high-confidence): internal-linking depth so "Discovered/stale" pages get re-crawled; sitemap `lastmod` freshness; request-indexing a batch of strong canaries. This alone grows the indexed base toward the brand/tool pages' 100%.
2. **Lift indexed pages from pos ~50 → page 1** (slow, authority-gated): query-matched titles + internal anchor text + genuine off-page authority (the site's true gap — ~no backlinks). This is the months-long part; treat Google as a compounding parallel bet, not a near-term revenue lever.
3. Keep **Bing/AI-engine dominance + the B2B matching-API path** as the near-term business (that's where the ~2K clicks and the money are).
