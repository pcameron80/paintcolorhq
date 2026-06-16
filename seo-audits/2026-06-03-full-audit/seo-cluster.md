# PaintColorHQ — Semantic Topic Cluster Audit
**Date:** 2026-06-03
**Auditor:** Claude (Semantic Cluster Engine)
**Content-Architecture Score: 54 / 100**

---

## Executive Summary

The site has a strong programmatic foundation (23K+ color pages, 14 brand pages, 15 family pages, match listing pages) and a growing blog with 30 posts. The content-architecture score is held back by three structural problems: (1) the blog and the programmatic pages largely operate as parallel universes — brand round-up posts link down into programmatic pages, but those programmatic pages do not consistently link back up to the editorial content that gives them context; (2) several high-value family pages (/colors/family/gray, /colors/family/green, /colors/family/white) are almost entirely self-contained, receiving links from blog posts but returning no links to the blog; and (3) the highest-leverage pillar candidates — the brand pages — each surface only 2-3 blog posts in their "Insights" module, and those posts are not always the most relevant ones.

The cannibalization picture is mostly clean, but the Behr brand page vs the "best Behr paint colors" blog post is a real tension that needs a deliberate positioning split.

---

## 1. Site Content Inventory

### Programmatic Pages (pillar-tier candidates)

| Route pattern | Count | SEO function |
|---|---|---|
| /brands/[brandSlug] | 14 | Brand hub — "color chart" + "all [brand] colors" intent |
| /colors/family/[familySlug] | 15 | Family hub — "best [color] paint colors" intent |
| /match/[source]/to/[target] | ~28 | Brand-to-brand conversion — "X equivalent" intent |
| /colors/[brand]/[slug] | ~23,438 | Color detail — individual color lookup intent |
| /tools/* | 4 | Tool pages — functional/interactive intent |
| /inspiration/[slug] | 5 | Curated palettes — discovery/commercial intent |
| /compare | 1 | Compare tool — "[color A] vs [color B]" intent |

### Blog Posts — Full Inventory (30 posts)

**Brand round-ups (done)**
- best-behr-paint-colors (live 2026-06-10)
- best-ppg-paint-colors (live 2026-06-07)
- best-dunn-edwards-paint-colors (live 2026-06-03)
- best-valspar-paint-colors (live 2026-05-31)
- best-sherwin-williams-kitchen-colors
- best-behr-colors-for-bedrooms
- benjamin-moore-most-popular-whites
- best-sherwin-williams-alternatives-to-benjamin-moore
- sherwin-williams-vs-benjamin-moore
- behr-vs-sherwin-williams-vs-benjamin-moore

**Room-based posts**
- best-paint-colors-for-laundry-rooms
- best-kitchen-paint-colors-2025
- calming-bedroom-paint-colors
- best-bathroom-paint-colors
- best-living-room-paint-colors
- best-home-office-paint-colors (noindex)
- best-exterior-paint-colors
- best-nursery-paint-colors
- best-dining-room-paint-colors
- best-paint-colors-north-facing-rooms
- best-paint-colors-east-facing-rooms

**Color-family round-ups**
- best-blue-paint-colors
- best-white-paint-colors-guide
- most-popular-paint-colors-2025

**Trend / COTY**
- 2026-colors-of-the-year-every-brand-compared
- 2025-colors-of-the-year-every-brand-compared
- paint-color-trends-2026

**How-to / theory**
- understanding-paint-color-undertones
- warm-vs-cool-paint-colors
- paint-sheen-guide
- how-to-test-paint-samples
- color-theory-for-home-decorators
- how-to-find-perfect-color-match-across-brands

---

## 2. Topic Cluster Architecture

### Cluster 1 — Brand Discovery (Pillar: /brands/[slug], Spokes: brand round-up blog posts)

**Intent:** Primarily informational/commercial. Searchers want to know what colors a brand offers, which ones are worth buying, and how they compare to other brands.

**Pillar pages:** /brands/sherwin-williams, /brands/benjamin-moore, /brands/behr, /brands/valspar, /brands/ppg, /brands/dunn-edwards, /brands/dutch-boy (14 total)

**Spoke posts (existing):**
- /blog/best-valspar-paint-colors
- /blog/best-dunn-edwards-paint-colors
- /blog/best-ppg-paint-colors
- /blog/best-behr-paint-colors
- /blog/best-sherwin-williams-kitchen-colors
- /blog/best-behr-colors-for-bedrooms
- /blog/benjamin-moore-most-popular-whites
- /blog/behr-vs-sherwin-williams-vs-benjamin-moore
- /blog/sherwin-williams-vs-benjamin-moore
- /blog/best-sherwin-williams-alternatives-to-benjamin-moore

**Spoke posts (planned, not yet written):**
- Most Popular Sherwin-Williams Paint Colors, Ranked (Topical Plan T1 #1)
- Most Popular Benjamin Moore Paint Colors (Topical Plan T1 #2)
- Best Dutch Boy Paint Colors (Topical Plan T1 #7)
- Best Benjamin Moore Bedroom Paint Colors (Topical Plan T2 #8)
- Best Sherwin-Williams Bathroom Paint Colors (Topical Plan T2 #9)
- Best Behr Kitchen Paint Colors (Topical Plan T2 #10)
- Best Valspar Living Room Paint Colors (Topical Plan T2 #11)

**SERP overlap assessment:**
"best valspar paint colors" and /brands/valspar share clear intent overlap (both target users researching Valspar). The brand page targets head query "valspar paint colors" (color chart/browse intent) and "valspar color chart." The blog post targets "best valspar paint colors" (editorial/curated intent). These are complementary, not cannibalizing — see Section 4 for full verdict.

---

### Cluster 2 — Color Family Discovery (Pillar: /colors/family/[slug], Spokes: family round-up blog posts)

**Intent:** Informational/commercial. Users searching "best blue paint colors," "best gray paint colors," "best sage green paint colors."

**Pillar pages:** /colors/family/blue, /colors/family/gray, /colors/family/white, /colors/family/green, /colors/family/beige, /colors/family/tan, /colors/family/neutral (15 total)

**Spoke posts (existing):**
- /blog/best-blue-paint-colors → links TO /colors/family/blue, but /colors/family/blue does NOT link back
- /blog/best-white-paint-colors-guide → links TO /colors/family/white and /colors/family/off-white
- /blog/benjamin-moore-most-popular-whites → links to /colors/family/white and /colors/family/off-white

**Spoke posts (planned):**
- Best Sage Green Paint Colors (Topical Plan T3 #12)
- Best Greige Paint Colors (Topical Plan T3 #13)
- Best Gray Paint Colors for Every Room (Topical Plan T3 #14)
- Best Beige and Warm Neutral Paint Colors (Topical Plan T3 #15)
- Best Black Paint Colors (Topical Plan T3 #16)

**Critical gap:** /colors/family/gray links only to the undertones guide. It does not link to best-blue-paint-colors (relevant for gray-blues), it does not link to any room-based posts, and it will not link to the planned gray round-up post when that is written. This family page type receives editorial equity from blog posts but does not return it.

---

### Cluster 3 — Room-Based Discovery (Pillar: Room-intent blog posts, Spokes: brand+family+color pages)

**Intent:** Informational. Users searching "best kitchen paint colors," "best bathroom paint colors," "paint colors for north-facing rooms."

**Pillar posts (existing):**
- /blog/best-kitchen-paint-colors-2025
- /blog/best-bathroom-paint-colors
- /blog/calming-bedroom-paint-colors
- /blog/best-living-room-paint-colors
- /blog/best-dining-room-paint-colors
- /blog/best-paint-colors-for-laundry-rooms
- /blog/best-nursery-paint-colors
- /blog/best-exterior-paint-colors
- /blog/best-paint-colors-north-facing-rooms
- /blog/best-paint-colors-east-facing-rooms

**Structural note:** Room posts correctly link down to individual color detail pages, brand pages, family pages, and tools. This cluster is the best-architected of the three. The main gap is that brand×room posts (SW kitchen, Behr bedroom) are not cross-linked to the general room-round-up posts (best kitchen paint colors, best bedroom paint colors).

---

### Cluster 4 — Color Matching + Tools (Pillar: /compare, /match/[source]/to/[target], Spokes: how-to posts)

**Intent:** Transactional/informational. "Sherwin-williams equivalent," "paint color match," "agreeable gray behr equivalent."

**Pillar pages:** /match/*/to/*, /compare
**Spoke posts (existing):**
- /blog/how-to-find-perfect-color-match-across-brands
- /blog/best-sherwin-williams-alternatives-to-benjamin-moore
- /blog/sherwin-williams-vs-benjamin-moore

**Gap:** No post targets "agreeable gray equivalent" or "hale navy equivalent" — the individual color deep-dive format (Topical Plan T4 #17) will serve this. The /compare page itself has no editorial content linking it back into the blog cluster.

---

### Cluster 5 — Color Theory + How-To (Pillar: /blog/understanding-paint-color-undertones, Spokes: warm-cool, sheen, testing posts)

**Intent:** Informational/educational. Lower-volume but high-trust signals for HCU recovery.

**Pillar post:** /blog/understanding-paint-color-undertones
**Spoke posts:**
- /blog/warm-vs-cool-paint-colors
- /blog/paint-sheen-guide
- /blog/how-to-test-paint-samples
- /blog/color-theory-for-home-decorators

**Strength:** This cluster is well-formed. The undertones post is referenced from almost every brand round-up post's closing section ("our undertones guide walks through the test..."). Good spoke-to-pillar link discipline here.

---

## 3. Internal Link Matrix

### Legend
- M = Mandatory (implemented)
- G = Gap (should exist, does not)
- R = Recommended (spoke-spoke within cluster)
- O = Optional (cross-cluster)

### Brand Cluster Link Matrix

| From | To | Status | Notes |
|---|---|---|---|
| /blog/best-valspar-paint-colors | /brands/valspar | M — present | Implemented via "Lowe's" anchor |
| /blog/best-valspar-paint-colors | /colors/family/white | M — present | "white color family" link |
| /blog/best-valspar-paint-colors | /colors/family/blue | M — present | "blue color family" link |
| /blog/best-valspar-paint-colors | /colors/family/gray | M — present | "gray color family" link |
| /blog/best-valspar-paint-colors | /match/valspar/to/sherwin-williams | M — present | Closing CTA section |
| /blog/best-valspar-paint-colors | /compare | M — present | Closing CTA section |
| /brands/valspar | /blog/best-valspar-paint-colors | M — present | Featured in "Insights" |
| /blog/best-behr-paint-colors | /brands/behr | M — present | |
| /blog/best-behr-paint-colors | /match/behr/to/sherwin-williams | M — present | |
| /brands/behr | /blog/best-behr-paint-colors | **G** | Behr brand page "Insights" shows Behr bedroom post and nursery post, NOT the general Behr round-up. The general round-up is the most important Behr post and it is not surfaced on /brands/behr. |
| /brands/benjamin-moore | /blog/benjamin-moore-most-popular-whites | **G** | BM brand page Insights does not link to this post |
| /brands/sherwin-williams | /blog/best-sherwin-williams-kitchen-colors | M — present | |
| /brands/sherwin-williams | /blog/most-popular-sherwin-williams (not yet written) | **G** | Pillar post for this brand does not exist yet |
| /blog/best-behr-colors-for-bedrooms | /blog/best-behr-paint-colors | **G** | Same brand, overlapping scope — cross-link recommended |
| /blog/best-sherwin-williams-kitchen-colors | /blog/best-kitchen-paint-colors-2025 | **G** | Brand×room post should link to general room post |
| /blog/best-kitchen-paint-colors-2025 | /blog/best-sherwin-williams-kitchen-colors | **G** | General room post does not link to brand-specific room post |

### Family Cluster Link Matrix

| From | To | Status | Notes |
|---|---|---|---|
| /blog/best-blue-paint-colors | /colors/family/blue | M — present | |
| /colors/family/blue | /blog/best-blue-paint-colors | **G** | Family page links to bedroom/bathroom/office posts but NOT to the dedicated blue round-up |
| /colors/family/gray | /blog/best-blue-paint-colors | **G** | Gray-blues are a major sub-segment; gap |
| /colors/family/gray | /blog/understanding-paint-color-undertones | M — present | |
| /colors/family/gray | /blog/best-gray-paint-colors (not yet written) | **G** | Will need to be added when T3 gray post ships |
| /colors/family/white | /blog/best-white-paint-colors-guide | **G** | White family page does not link to the white round-up blog post |
| /colors/family/white | /blog/benjamin-moore-most-popular-whites | **G** | |
| /blog/best-white-paint-colors-guide | /colors/family/white | M — present | |
| /colors/family/green | /blog/best-sage-green-paint-colors (not yet written) | **G** | Will need to be added when T3 sage post ships |

### Cross-Cluster Links (high-value)

| From | To | Status | Notes |
|---|---|---|---|
| /blog/best-valspar-paint-colors | /blog/understanding-paint-color-undertones | M — present | Closing section |
| /blog/best-behr-paint-colors | /blog/understanding-paint-color-undertones | M — present | Closing section |
| /blog/best-blue-paint-colors | /blog/calming-bedroom-paint-colors | M — present | |
| /blog/best-paint-colors-for-laundry-rooms | /blog/calming-bedroom-paint-colors | M — present | Sleepy Blue reference |
| /blog/best-paint-colors-for-laundry-rooms | /blog/best-white-paint-colors-guide | M — present | |
| /blog/best-paint-colors-for-laundry-rooms | /blog/how-to-find-perfect-color-match-across-brands | M — present | Closing section |
| Room posts (all) | /tools/room-visualizer | M — present | Consistently linked |
| Room posts (all) | /tools/paint-calculator | M — present | Consistently linked |
| /blog/best-blue-paint-colors | /blog/best-paint-colors-north-facing-rooms | **G** | Blue in north-facing rooms is a specific sub-question; missing |
| /blog/calming-bedroom-paint-colors | /blog/best-blue-paint-colors | **G** | Bedroom blues are a major sub-segment |

---

## 4. Cannibalization Analysis

### Test: /brands/valspar vs /blog/best-valspar-paint-colors

**Verdict: Complement, not cannibalization.**

These two pages target materially different intents:

- /brands/valspar targets "valspar paint colors," "valspar color chart," and "all valspar colors" — browse/inventory intent. The page title is "Valspar Color Chart: All 1,766 Shades." It is a programmatic listing with 1,766 color swatches and cross-brand matches. Zero editorial curation.
- /blog/best-valspar-paint-colors targets "best valspar paint colors" — editorial/decision intent. The page curates 15 specific picks with LRV, undertone notes, and cross-brand equivalents. It adds curation that the programmatic page cannot provide.

SERP behavior confirms differentiation: "valspar paint colors" (high-volume browse intent) returns official brand pages and color-browser tools. "best valspar paint colors" returns editorial round-ups from interior design blogs. These are different SERP populations.

**Action:** Maintain both. The brand page should feature the blog round-up prominently in its Insights section (currently it does, correctly).

---

### Test: /brands/behr vs /blog/best-behr-paint-colors

**Verdict: Complement — but the brand page is currently featuring the WRONG blog post.**

The /brands/behr Insights section surfaces "12 Best Behr Paint Colors for Bedrooms" and a nursery post, not "The Best Behr Paint Colors for Every Room (2026)." The general round-up is the higher-authority, more on-topic companion for the brand page. The bedroom post belongs as a secondary link.

**Action (quick win):** Update /brands/behr Insights to feature /blog/best-behr-paint-colors as the primary article. Demote the bedroom post to position 2 or 3.

---

### Test: /brands/sherwin-williams vs /blog/best-sherwin-williams-kitchen-colors

**Verdict: Complement — but gap exists.**

The SW brand page correctly links to the SW kitchen post. However, a "most popular Sherwin-Williams paint colors" post (the highest-volume planned post) does not yet exist. When it ships, it will directly compete with /brands/sherwin-williams for "most popular sherwin williams colors" and "all sherwin williams colors." Mitigation: the brand page must add the round-up post to its Insights section the day the post ships, and the round-up post must open with a link to the brand page ("browse all 1,527 SW colors →"). This bidirectional structure signals complementarity to both Google and Bing.

---

### Test: /blog/best-white-paint-colors-guide vs /blog/benjamin-moore-most-popular-whites

**Verdict: Complementary with a framing gap.**

These posts target different angles: the whites guide is multi-brand/room-based, the BM whites post is brand-specific. SERP overlap is low because "best white paint colors" and "benjamin moore white paint colors" pull different audiences. However, neither post links to the other. Adding a reciprocal link ("For Benjamin Moore specifically, see our Benjamin Moore whites deep-dive →") resolves the gap and strengthens both.

---

### Test: /blog/best-blue-paint-colors vs /colors/family/blue

**Verdict: Complement — with a structural gap that weakens both.**

The /colors/family/blue page links to bedroom, bathroom, and home office posts. It does not link to /blog/best-blue-paint-colors, which is the most directly on-topic editorial companion it has. This is the clearest family-page→blog gap on the site. Every family page should link to its corresponding editorial round-up if one exists.

---

### Test: /blog/2026-colors-of-the-year-every-brand-compared vs /blog/paint-color-trends-2026

**Verdict: Overlap risk — acceptable with a clear title split.**

Both posts target trend-aware users. The COTY comparison is brand-by-brand specific (each brand's 2026 COTY color, side-by-side). The trends post is broader (design directions, forecasts). They share enough search proximity that they should cross-link and the titles must stay differentiated. Currently both posts exist without linking to each other — that is the only fix needed.

---

## 5. Internal Link Gaps — Priority Ranked

### P1 — Fix within existing pages (no new content needed)

**Gap 1: /brands/behr Insights module features the wrong Behr post.**
- Action: Swap position 1 from "12 Best Behr Paint Colors for Bedrooms" to "The Best Behr Paint Colors for Every Room (2026)"
- Impact: The general round-up is the highest-equity Behr blog post. It sits orphaned from the most obvious entry point.

**Gap 2: /colors/family/blue does not link to /blog/best-blue-paint-colors.**
- Action: Add a "Blue Color Guide" editorial callout or in-text link on the family page pointing to /blog/best-blue-paint-colors
- Impact: Best-blue is a well-linked post (links out to 5 brand pages, 4 match pages, all family pages) but receives zero equity from its natural hub, the family page.

**Gap 3: /colors/family/white does not link to /blog/best-white-paint-colors-guide or /blog/benjamin-moore-most-popular-whites.**
- Action: Add blog editorial links to the white family page
- Impact: Two high-quality white posts exist; neither receives a link from the most obvious referrer.

**Gap 4: /blog/best-white-paint-colors-guide and /blog/benjamin-moore-most-popular-whites do not cross-link.**
- Action: Add a contextual link in each post pointing to the other
- Impact: Resolves a spoke-spoke gap; both posts rank better when they share authority.

**Gap 5: /blog/best-kitchen-paint-colors-2025 and /blog/best-sherwin-williams-kitchen-colors do not link to each other.**
- Action: Add a reciprocal link between these two posts
- Impact: "Best kitchen paint colors" and "best SW kitchen colors" are adjacent queries; users who land on one are the same users who want the other.

**Gap 6: /blog/calming-bedroom-paint-colors does not link to /blog/best-blue-paint-colors.**
- Action: Add a contextual blue reference in the bedroom post pointing to the blue round-up
- Impact: Blue is the dominant color in calming bedroom posts; the blue round-up has more depth on brand selection.

**Gap 7: /blog/2026-colors-of-the-year-every-brand-compared and /blog/paint-color-trends-2026 do not cross-link.**
- Action: Reciprocal link
- Impact: These two trend posts are natural companions; users reading one will want the other.

**Gap 8: /brands/benjamin-moore Insights does not link to /blog/benjamin-moore-most-popular-whites.**
- Action: Update BM brand page Insights to include the BM whites post
- Impact: The BM brand page is a high-traffic programmatic page; it should surface the most relevant editorial content.

---

### P2 — Implement when planned posts ship

When these posts are written, the corresponding programmatic pages must be updated on the same day:

| New Post | Programmatic pages to update |
|---|---|
| Most Popular Sherwin-Williams Paint Colors | /brands/sherwin-williams Insights — add as P1 article |
| Most Popular Benjamin Moore Paint Colors | /brands/benjamin-moore Insights — add as P1 article |
| Best Gray Paint Colors | /colors/family/gray — add editorial link |
| Best Sage Green Paint Colors | /colors/family/green — add editorial link |
| Best Greige Paint Colors | /colors/family/tan or /colors/family/neutral — add editorial link |
| Best Beige and Warm Neutral Paint Colors | /colors/family/beige — add editorial link |
| Best Black Paint Colors | /colors/family/black — add editorial link |
| Agreeable Gray deep-dive | /colors/sherwin-williams/agreeable-gray-7029 — add editorial link |
| Dutch Boy round-up | /brands/dutch-boy Insights — add as P1 article |
| Best BM Bedroom Colors | /brands/benjamin-moore Insights (secondary slot) |
| Best SW Bathroom Colors | /brands/sherwin-williams Insights (secondary slot) |

---

## 6. Missing Spoke Topics with Proven Intent

Cross-referencing the topical plan against current coverage and SERP demand signals:

### Already in Topical Plan (confirming priority order)

**T1 — Most Popular Sherwin-Williams Paint Colors, Ranked** — highest leverage unwritten post on the site. /brands/sherwin-williams has 1,527 colors; users looking for the "best" or "most popular" SW colors currently hit the brand page with no editorial curation. Bing ranks SW's own top-50 page + interior design blogs for this query. PCHQ's data moat (cross-brand matches + exact LRV for every color) differentiates directly.

**T1 — Most Popular Benjamin Moore Paint Colors** — same pattern. BM brand page has 3,915 colors; "benjamin moore color chart" (367 monthly Bing clicks) lands users in an uncurated grid. A curated round-up with cross-brand matches is a clear gap vs competitors who cover BM.

**T1 — Best Dutch Boy Paint Colors** — Dutch Boy has 101 colors in the DB, high Bing volume (248), and zero competing blog coverage on PCHQ. The brand page exists but has no round-up post.

**T4 — Agreeable Gray deep-dive** — "agreeable gray" is one of the highest-searched individual paint color queries in the US. A post on SW 7029 with undertones, coordinating colors, LRV, and cross-brand equivalents (Valspar Heritage Gray is nearly identical — Delta E ~0 — which is a genuinely surprising fact that drives engagement) will draw from the color-detail page traffic and the "agreeable gray" informational SERP.

### Not Yet in Topical Plan (new recommendations)

**NEW: Agreeable Gray vs Repose Gray** — The SERP for this query is crowded with interior design blogs (Kylie M Interiors, PerfectlyGoodHome, Setting For Four) but none of them have the CIEDE2000 data to quantify the actual difference. PCHQ can show the exact Delta E between SW 7029 and SW 7015, explain why they look different in different light, and link to the compare tool for verification. This is a Tier 4 moat post — data no competitor can replicate. Target after the Agreeable Gray standalone post.

**NEW: Best Paint Colors for Cabinets** — "best paint colors for kitchen cabinets" and "white paint for cabinets" are high-volume transactional queries. Current coverage misses them (kitchen post covers walls/overall room, not cabinets specifically). Natural home: a standalone cabinet-colors post that links to BM Advance and SW Emerald (already referenced in the laundry room post for trim/cabinets), the compare tool, and the brand pages.

**NEW: Hale Navy: Undertones, Coordinating Colors & Matches** — Same T4 deep-dive template as Agreeable Gray. Hale Navy (BM HC-154) is the most-specified navy in the country; the PCHQ color page exists and the blog post references it repeatedly, but there is no standalone editorial post targeting the "hale navy" query.

---

## 7. Next 5 Highest-Leverage Posts

Ranked by (estimated Bing demand × content gap × moat strength):

| # | Post | Target query | Why now | Programmatic pages to link |
|---|---|---|---|---|
| 1 | Most Popular Sherwin-Williams Paint Colors, Ranked | "most popular sherwin williams colors" / "all sherwin williams colors" | Largest brand in the US, no SW general round-up exists, /brands/sherwin-williams currently has no editorial companion for browse-to-curated conversion. Bing data shows this is the top unmet demand. | /brands/sherwin-williams, /colors/family/white, /colors/family/gray, /colors/family/neutral, /match/sherwin-williams/to/*, /compare |
| 2 | Most Popular Benjamin Moore Paint Colors (+ how to read the color chart) | "benjamin moore color chart" / "most popular benjamin moore colors" | BM is the premium designer brand; 367 monthly Bing clicks for "benjamin moore color chart" with zero PCHQ editorial page targeting it. /brands/benjamin-moore has 3,915 colors and no curated round-up companion. | /brands/benjamin-moore, /blog/benjamin-moore-most-popular-whites, /colors/family/white, /match/benjamin-moore/to/*, /compare |
| 3 | Agreeable Gray (SW 7029): Undertones, Coordinating Colors & Cross-Brand Matches | "agreeable gray" / "agreeable gray undertones" | Highest-searched individual paint color in the US. PCHQ already has the color page at /colors/sherwin-williams/agreeable-gray-7029 and the Valspar post already calls Heritage Gray its "near-exact match." This is the single most data-differentiated post PCHQ can write — the Delta E comparison to Heritage Gray (Valspar), Collingwood (BM), and Accessible Beige (SW) is genuinely useful and unreplicable. | /colors/sherwin-williams/agreeable-gray-7029, /colors/valspar/heritage-gray-7007-24, /compare, /match/sherwin-williams/to/valspar, /colors/family/neutral |
| 4 | Best Gray Paint Colors for Every Room | "best gray paint colors" | Tier 3 post, unwritten, fills the most glaring family-page gap. /colors/family/gray exists and ranks for gray-related queries but has no editorial round-up companion. Undertones guide already anchors the cluster — a gray round-up strengthens it. | /colors/family/gray, /blog/understanding-paint-color-undertones, /blog/warm-vs-cool-paint-colors, /brands/sherwin-williams, /brands/benjamin-moore |
| 5 | Best Dutch Boy Paint Colors | "dutch boy paint" / "dutch boy paint colors" | 248 monthly Bing clicks, zero PCHQ blog coverage, 101 colors in the DB, brand page exists at /brands/dutch-boy with no editorial companion. Easiest unmet demand in the brand cluster to fill using the existing brand round-up template. | /brands/dutch-boy, /match/dutch-boy/to/sherwin-williams (if exists), /colors/family/*, /compare |

**Note on topical plan alignment:** All 5 are already in the topical plan (T1 #1, T1 #2, T4 #17, T3 #14, T1 #7). None of these are new discoveries from this audit that override the plan — the plan's priority ordering is confirmed as correct. The Agreeable Gray post is moved from T4 priority to #3 because the data angle (Heritage Gray Delta E ~0 story) is both uniquely ownable and already seeded in the Valspar round-up, making it a natural next step.

---

## 8. Pre-Delivery Validation Results

- [x] No two posts share the same primary keyword — confirmed, all 30 slugs target distinct queries
- [x] Brand round-ups have bidirectional links to brand pages — confirmed for Valspar, PPG, DE, Behr (partial — see Gap 1)
- [x] Family round-ups link to family pages — confirmed for blues and whites
- [ ] Family pages do not consistently link back to editorial round-ups — FAIL (Gaps 2, 3)
- [ ] Behr brand page surfaces wrong primary article in Insights — FAIL (Gap 1)
- [x] Brand×room posts link to brand pages — confirmed (SW kitchen → /brands/sherwin-williams)
- [ ] Brand×room posts do not cross-link to general room posts — FAIL (Gap 5)
- [x] How-to cluster has good pillar-spoke discipline — undertones post is well-linked from all brand round-ups
- [ ] Trend posts do not cross-link — FAIL (Gap 7)

---

## 9. Content-Architecture Score Breakdown

| Dimension | Score | Notes |
|---|---|---|
| Cluster definition (hub vs spoke clarity) | 14/20 | Brand and family clusters well-defined; room cluster pillar/spoke inversion acceptable. Loses points for missing SW/BM general round-ups. |
| Internal link coverage (blog→programmatic) | 12/20 | Brand round-ups link well into programmatic pages. Family pages receive links from blog but most do not return them. |
| Internal link coverage (programmatic→blog) | 8/20 | Brand pages surface 2-3 blog posts via Insights module, but module surfacing has errors (Behr shows wrong post). Family pages have only 1-2 blog links each, often not the most relevant. |
| Cannibalization risk | 16/20 | Generally clean — brand pages (browse) vs brand round-ups (curated) are differentiated. The BM whites posts have minor overlap but are manageable. |
| Coverage completeness vs demand | 4/20 | SW general round-up, BM general round-up, gray round-up, sage/greige/beige round-ups, Agreeable Gray deep-dive all unwritten. These are the highest-demand gaps. |

**Total: 54/100**

---

## 10. Quick Wins

### Quick Win 1 — Fix the Behr brand page Insights module (30-minute task)

Update /brands/behr so the "Behr in The Color Journal" Insights section surfaces "The Best Behr Paint Colors for Every Room (2026)" as the primary article. This is a single-file edit (brand-content.tsx or wherever the Insights articles are defined per brand).

Why this matters: /brands/behr is a high-traffic programmatic page and the most natural entry point for users considering Behr. The general round-up post covers all Behr categories (whites, greiges, grays, blues, statement colors) and is a better conversion companion than the bedroom-specific post currently in position 1. The round-up also links out to match pages and the compare tool, which the bedroom post does.

**Estimated effort:** 30 minutes. Single file edit. No new content.

### Quick Win 2 — Add blog editorial links to /colors/family/blue, /colors/family/white, and /colors/family/gray (90-minute task)

Add a "Color Guide" editorial block or contextual in-text link on each of these three family pages pointing to their corresponding blog round-up:

- /colors/family/blue → /blog/best-blue-paint-colors
- /colors/family/white → /blog/best-white-paint-colors-guide (and secondarily /blog/benjamin-moore-most-popular-whites)
- /colors/family/gray → /blog/understanding-paint-color-undertones (already present) + will need /blog/best-gray-paint-colors when written

The blue and white gaps exist today and can be fixed immediately. The blue gap is the most impactful: best-blue-paint-colors links to /colors/family/blue but receives nothing back. It is a well-constructed post (14 color picks across 6 brands, brand pages, match pages, all tools linked) sitting in a one-way equity drain.

**Estimated effort:** 60-90 minutes. Edits to family-content.tsx or equivalent. No new content.

---

*Audit file: /Users/philipcameron/Documents/GitHub/paintcolorhq/seo-audits/2026-06-03-full-audit/seo-cluster.md*
*Site: paintcolorhq.com — 30 blog posts, 14 brand pages, 15 family pages, ~23,438 color pages*
