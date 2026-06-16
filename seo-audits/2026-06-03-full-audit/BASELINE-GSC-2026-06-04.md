# GSC Baseline — 2026-06-04 (post-#92 deploy)
**Property:** `sc-domain:paintcolorhq.com` (captures www + non-www) · **Source:** Google Search Console API
**Purpose:** before/after anchor for HCU-recovery measurement. The content-system fix (#92) deployed 2026-06-03; ISR propagates gradually. Re-run this exact query set in ~2 weeks (≈2026-06-18) and compare.

## Overall search performance (web)
| Window | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|
| Last 28d (2026-05-05 → 06-01) | 18 | 2,518 | 0.71% | 56.2 |
| Prior 28d (2026-04-07 → 05-04) | 17 | 2,243 | 0.76% | 49.1 |
| **MoM change** | **+1** | **+12%** | flat | **worse (−7 pos)** |

**Reading:** NOT free-falling month-over-month — impressions are flat-to-slightly-up at a low absolute floor (~90 impr/day). The audit's "−58%" was the 90-day cliff vs the pre-penalty baseline; the recent trend has stabilized. Avg position drifting worse (more impressions surfacing deeper in results).

## By page type — last 28d (pageFilter contains)
| Page type | Impressions | Clicks | Avg pos | Note |
|---|---|---|---|---|
| **/brands/** | **1,294 (51%)** | 0 | 57.2 | Biggest impression earner, ZERO clicks (page ~6). The #88 "[brand] color chart" work targets exactly this — highest-leverage recovery surface. |
| /colors/ (all) | 712 | 3 | 45.0 | Color detail ≈ 669 impr (712 − 43 family), pos ~44 |
| /colors/family/ | 43 | 0 | 61.2 | (subset of /colors/) |
| /match/ | 135 | 1 | **20.8** | Best position (page 2–3), lowest volume — high-intent |
| /blog/ | 288 | 1 | 70.0 | Being actively crawled (the layer Google still crawls) |
| homepage/tools/other | ~89 | ~13 | — | most of the clicks |

## Indexation — the headline metric to watch
- **Sitemap:** 23,860 submitted · **0 indexed** (GSC sitemap-coverage report, lastDownloaded 2026-05-30).
- **URL inspection — `/colors/sherwin-williams/agreeable-gray-7029`** (most-searched SW color, now diversified by #92):
  - `coverageState`: **"Crawled - currently not indexed"** ← *NOT* "unknown to Google" (the seo-google agent's claim was inaccurate for this URL)
  - `robotsTxtState`: ALLOWED · `indexingState`: INDEXING_ALLOWED · `pageFetchState`: SUCCESSFUL
  - google/user canonical: match (correct) · last crawl: 2026-05-07 (MOBILE)
- **Verdict (confirms orchestrator-verification):** no technical block — Google crawled it successfully and *chose not to index* it. Classic HCU thin-content quality demotion. The fix (#92 content diversity) targets exactly this; the recovery signal will be color URLs moving "Crawled - not indexed" → "Indexed" and the sitemap indexed-count rising off 0.

## What recovery looks like (compare on re-run ~2026-06-18)
1. Sitemap indexed count rises off **0**.
2. `agreeable-gray-7029` (+ other diversified colors) flips to **"Indexed"** on inspection / earns a fresh crawl date after 2026-06-03.
3. **/colors/** impressions climb (currently ~712/28d) and avg position improves off ~45.
4. **/brands/** (1,294 impr @ pos 57) is the single biggest near-term lever — watch for position improvement from the #88 color-chart titles.
