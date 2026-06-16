# Backlink Profile Audit — paintcolorhq.com
**Date:** 2026-06-03
**Tier:** 1 (Moz API + Common Crawl + Verification Crawler)
**Auditor:** SEO Backlink Specialist (claude-seo 2.0.0)

---

## Data Sources & Freshness

| Source | Status | Confidence | Freshness |
|--------|--------|------------|-----------|
| Moz Link Explorer API | Available | 0.85 | ~3 days (last crawl: 2026-05-31) |
| Common Crawl Web Graph | Available (below ranking threshold) | 0.50 | Quarterly (cc-main-2026-jan-feb-mar) |
| Bing Webmaster API | Not configured | — | — |
| DataForSEO | Not configured | — | — |

**Note:** With 5/7 scoring factors having data and velocity/geo factors unavailable, a numeric Backlink Health Score is not produced. Reporting INSUFFICIENT DATA per protocol. Upgrade path: add Bing Webmaster API key (free) for Tier 2, or DataForSEO credentials for Tier 3.

---

## Domain Authority & Core Metrics

| Metric | Value | Rating | Source |
|--------|-------|--------|--------|
| Domain Authority (DA) | 2/100 | WARN | Moz API (confidence: 0.85) |
| Page Authority — Homepage | 13/100 | WARN | Moz API (confidence: 0.85) |
| Spam Score | 8/17 | WARN | Moz API (confidence: 0.85) |
| Total Inbound Links | 12 | — | Moz API (confidence: 0.85) |
| External Links | 12 | — | Moz API (confidence: 0.85) |
| Referring Root Domains | 6 | WARN | Moz API (confidence: 0.85) |
| Follow Links (root domain) | 2 | WARN | Moz API (confidence: 0.85) |
| Nofollow Links (root domain) | 10 | INFO | Moz API (confidence: 0.85) |
| CC PageRank | Not ranked | WARN | Common Crawl (confidence: 0.50) |
| CC Harmonic Centrality | Not ranked | WARN | Common Crawl (confidence: 0.50) |

**Context:** DA 2 is expected for a site ~2 years old with no active link-building. Moz DA is a logarithmic scale — moving from 2 to 10 requires substantially fewer quality links than moving from 40 to 50. The immediate concern is not the low DA itself, but the composition of the 6 referring domains (see below).

**Spam Score of 8/17** sits in Moz's moderate-risk band (Moz flags 8+ as elevated). Given the referring domain makeup, this is consistent with link-farm traffic rather than a manual penalty signal. Worth monitoring.

---

## Referring Domain Analysis

| Domain | DA | Spam Score | Links | Classification | Risk |
|--------|-----|-----------|-------|----------------|------|
| urls-shortener.eu | 15 | 6/17 | 2 | URL shortener farm | HIGH |
| shortenurls.eu | 15 | 7/17 | 2 | URL shortener farm | HIGH |
| optimizeflow.top | 14 | 7/17 | 2 | .top TLD link farm | HIGH |
| atomizelink.icu | 10 | 4/17 | 2 | .icu TLD link manipulator | MEDIUM |
| anchorurl.cloud | 9 | 6/17 | 2 | .cloud URL redirect farm | HIGH |
| pcameron.co | 1 | -1 (clean) | 2 | Owner personal domain | CLEAN |

**Source:** Moz API (confidence: 0.85)

**Summary:** 5 of 6 referring domains (83%) show URL-shortener or link-farm patterns. These are not editorial links — they are redirect/manipulation artifacts, likely from someone sharing or testing PCHQ URLs through redirect services. They contribute no meaningful authority and actively pull the spam score upward. The one clean link is the owner's personal domain (pcameron.co), which is a self-referential link with DA 1.

**Practical impact on HCU recovery:** Google does not penalize for links you don't build, and these shortener farms are unlikely to constitute a manual action trigger. However, the spam score elevation is a noise floor that suppresses DA growth. These links are candidates for disavow if you want to clean the profile proactively (low-priority — see recommendations).

---

## Anchor Text Distribution

| Anchor Text | Links | Linking Domains | Category |
|-------------|-------|-----------------|----------|
| "paintcolorhq.com →" | 1 | 1 | Branded URL |

**Source:** Moz API (confidence: 0.85)

**Verdict: PASS (trivially).** Only 1 anchor text is observable by Moz. It is a branded URL variant with an arrow character — consistent with a redirect service passing a naked URL. There is no exact-match keyword stuffing or over-optimization present. As the profile grows, the target distribution should be: ~40-50% branded ("PaintColorHQ", "paintcolorhq.com"), ~30-40% generic/navigational ("here", "this tool", "paint color matcher"), ~10-20% partial-match ("paint color matching tool"), and <5% exact-match keywords. Currently the profile is too thin to assess over-optimization risk.

---

## Top Linked Pages

| Page | Page Authority | Inbound Links | Linking Domains |
|------|--------------|---------------|-----------------|
| paintcolorhq.com/ (homepage) | 13 | 6 | 6 |
| All other crawled pages | 7 (uniform) | 0 | 0 |

**Source:** Moz API — top_pages endpoint (confidence: 0.85)

All link equity is concentrated on the homepage. No interior pages (color detail, match, blog, brand) have received external links. The PA 7 shown on interior pages is Moz's baseline floor estimate, not earned authority — these pages have zero linking domains.

**Notable crawled pages with PA 7 (no external links):**
- `/tools/palette-generator` (multiple hex-param variants) — tool pages being crawled
- `/match/ral/mouse-grey-7005-to-*` — match pages indexed but not linked
- `/colors/family/purple?brand=farrow-ball` — faceted family pages (note: `?brand=` query param is being crawled; confirm noindex/canonical handling on filtered pages)
- `/compare?color1=<uuid>` — compare tool with UUID params (confirm noindex on these)

---

## Follow / Nofollow Ratio

| Link Type | Count (root domain level) | % |
|-----------|--------------------------|---|
| Follow | 2 | 17% |
| Nofollow | 10 | 83% |

**Source:** Moz API (confidence: 0.85)

An 83% nofollow rate is consistent with the shortener-farm origin of most links (many redirect/shortener services use nofollow). The 2 follow links presumably originate from pcameron.co and one other source. As organic links accrue, this ratio should naturally improve. A healthy profile for a content/tool site typically runs 60-70% follow.

---

## Competitor Comparison — matchmypaintcolor.com

| Metric | paintcolorhq.com | matchmypaintcolor.com | Gap |
|--------|-----------------|----------------------|-----|
| Moz DA | 2 | Unavailable (Moz API tier) | — |
| CC In Rankings | No (below threshold) | Yes | Significant |
| CC PageRank | Not ranked | 7.76e-09 (rank ~7.7M) | Behind |
| CC Harmonic Centrality | Not ranked | 14,133,483 (rank ~7.0M) | Behind |
| CC Hosts Linking | Not ranked | 2 | Behind |

**Source:** Common Crawl cc-main-2026-jan-feb-mar (confidence: 0.50)

matchmypaintcolor.com has a measurable PageRank and harmonic centrality in the Common Crawl web graph, meaning it has enough cross-site link equity to appear in CC rankings. paintcolorhq.com does not meet the threshold. The competitor is ahead in web-graph authority — though CC Q1 2026 data is quarterly, so it reflects the state as of March 2026.

**Important caveat:** CC confidence is 0.50. These are domain-level graph metrics only, not the same as DA or verified backlink counts. Use as directional gap signal only.

---

## Issues — Severity Tagged

### CRITICAL
None identified.

### HIGH

**H1 — Link Profile Dominated by Link-Farm / Shortener Domains**
- 5/6 referring domains are URL-shortener farms or .top/.icu/.cloud link manipulators
- These domains inflate the spam score and contribute zero real authority
- They do not constitute a manual action risk (not built intentionally), but they are dead weight
- Action: Create a disavow file with these 5 domains and submit via Google Search Console. This is low-urgency for HCU recovery but is good hygiene to lower spam score over time.

**H2 — Zero Editorial Links to Any Interior Page**
- No color detail pages, match pages, blog posts, brand pages, or tool pages have a single external linking domain
- All 6 referring domains point exclusively to the homepage
- This is the primary DA growth bottleneck and the primary gap vs the competitor
- Action: See link-acquisition recommendations below.

### MEDIUM

**M1 — Follow/Nofollow Ratio Skewed by Farm Links**
- 83% nofollow is an artificial suppression of link equity
- Resolves partially if the 5 farm domains are disavowed or de-indexed
- Action: Disavow + natural link acquisition will correct this over time. No active fix required beyond recommendations.

**M2 — Crawled Query-Param URLs Appearing in Moz Top Pages**
- Moz top_pages returns `/compare?color1=<uuid>`, `/colors/family/purple?brand=farrow-ball`, `/tools/palette-generator?hex=%23...` variants
- If these lack canonical or noindex tags, they may dilute crawl budget and fragment signals
- Cross-reference with `/seo technical paintcolorhq.com` for full crawlability analysis

**M3 — CC PageRank Below Threshold**
- paintcolorhq.com does not appear in CC's web graph rankings (Q1 2026)
- matchmypaintcolor.com does appear — this represents a meaningful web-graph authority gap
- Resolves naturally as legitimate links accumulate

### LOW

**L1 — Only 1 Anchor Text Observable**
- Profile is too thin for anchor-text over-optimization analysis
- No risk now, but track as the profile grows to avoid exact-match creep
- Target: 40-50% branded, 30-40% generic/navigational, <5% exact-match keywords

**L2 — Self-Link from pcameron.co is the Only Clean Referring Domain**
- DA 1 personal domain provides negligible authority transfer
- Not a risk, but it means 0 legitimate third-party editorial links currently exist
- Action: See link-acquisition recommendations.

---

## HCU Recovery Context

Google's Helpful Content penalty (March 2026, ~90% impression drop, per memory) was triggered by AI-template content, not by the backlink profile. The link profile is largely irrelevant to the HCU penalty mechanism — HCU is a site-wide classifier based on content quality signals, not link patterns.

**What a clean link profile contributes to HCU recovery:**
1. It provides no negative signal — the shortener-farm links are not evidence of manipulation (they are passive) and are unlikely to compound the HCU suppression.
2. Once the HCU classifier re-evaluates the site positively (driven by content improvements, not links), a growing link profile helps the site rank for competitive terms where authority matters.
3. Organic, editorial links from relevant design/home decor/DIY sources are a positive long-term trust signal — they reinforce E-E-A-T by showing that real humans and real sites find the tool useful.

**What the link profile does NOT do:**
- Links cannot override or accelerate the HCU classifier re-evaluation. That is determined by content quality assessment cycles.
- Disavowing the farm links will not measurably speed up HCU recovery.

---

## Link-Acquisition Recommendations (Solo Operator, Prioritized)

### Recommendation 1 — Niche Community Sharing (HIGH impact, LOW effort)
**Target:** Reddit (r/malelivingspace, r/femalelivingspace, r/DIY, r/HomeImprovement, r/interiordesign), home decor Discord servers, Facebook Groups
**Tactic:** Participate genuinely. When someone asks "does anyone know if BM Revere Pewter matches SW Accessible Beige?", link to the actual match page. Tool pages (palette generator, room visualizer) are share-worthy content — they solve a real problem in the moment.
**Why it works:** These links are editorial, come from DA 40-90 domains (Reddit), and are the exact use-case signal Google needs to see — real people, real communities, organic tool utility.
**Effort:** 30-60 min/week. You already have Reddit presence started.

### Recommendation 2 — Interior Design Blogger Outreach for Tool Embeds / Citations (HIGH impact, MEDIUM effort)
**Target:** Design bloggers and home-reno YouTubers who write posts like "Sherwin-Williams vs Benjamin Moore" or "best white paint colors"
**Tactic:** Identify 10-20 posts ranking for terms like "SW Agreeable Gray equivalent Benjamin Moore" or "Behr vs Sherwin Williams gray". Email the author: "Your readers might find this useful — we have the CIEDE2000 cross-brand match for exactly that color: [URL]." No ask, just add value.
**Expected conversion:** 1-3 links per 20 outreach emails is realistic for a genuinely useful tool.
**Why it works:** A single DA 40+ editorial link from a relevant home decor blog is worth more than 100 shortener-farm links. This is the single highest-leverage link type for a recovering-HCU site.
**Effort:** 2-3 hours to build the prospect list, 1-2 hours/week sending.

### Recommendation 3 — Structured Resource Page Submissions (MEDIUM impact, LOW effort)
**Target:** Interior design school resource pages, paint brand community pages, home improvement wiki-style sites (The Spruce, Bob Vila, Family Handyman resource directories)
**Tactic:** Find "tools" or "resources" pages at these sites. Submit paintcolorhq.com as a free cross-brand color matcher. Focus on sites where the resource page is editorially maintained (not automated directories).
**Why it works:** Resource page links are followed, topically relevant, and editorially placed. They are one of the cleanest link types for HCU recovery context.
**Effort:** 3-4 hours to identify pages + write submissions. Recurring effort is low.

---

## Optional: Disavow File

If you want to proactively lower the spam score, create a disavow file with these 5 domains:

```
# paintcolorhq.com disavow — 2026-06-03
# URL shortener farms and link manipulators — not built intentionally
domain:urls-shortener.eu
domain:shortenurls.eu
domain:optimizeflow.top
domain:atomizelink.icu
domain:anchorurl.cloud
```

Submit via Google Search Console > Disavow Links tool. This is LOW priority — it will not accelerate HCU recovery, but it cleans the spam score over the next Moz crawl cycle.

---

## Cross-Skill Handoffs

- For toxic link pattern deep-analysis beyond Moz Spam Score: load `references/backlink-quality.md`
- For crawlability of query-param URLs flagged in M2: run `/seo technical paintcolorhq.com`
- For E-E-A-T and content quality signals relevant to HCU: run `/seo content paintcolorhq.com`
- For competitor gap analysis (backlink sources, anchor text): add Bing Webmaster API key (free) to reach Tier 2

---

## Upgrade Path

| Tier | What You Get | Cost |
|------|-------------|------|
| Current (Tier 1) | Moz DA/PA/Spam + referring domains + anchors | Moz subscription |
| Tier 2 | + Bing near-realtime link data + competitor comparison | Free — get key at bing.com/webmasters |
| Tier 3 | + DataForSEO link velocity, geo, full anchor corpus | Paid — see `./extensions/dataforseo/install.sh` |

Tier 2 (Bing) is the most actionable immediate upgrade — it would enable direct competitor comparison with matchmypaintcolor.com and near-realtime link monitoring.
