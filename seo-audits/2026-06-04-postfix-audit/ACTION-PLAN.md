# Post-Fix Action Plan — 2026-06-04

Today's 8 PRs verified live, no regressions. These are the **new/remaining** items this pass surfaced. None are urgent; the priority is still letting #92 prove out (June 18 check).

## HIGH (one real lever)
| # | Action | Effort | File |
|---|---|---|---|
| 1 | **Expand FAQ answers toward the AI-citation window.** Color/match/brand visible FAQ answers are 11–32 words; lift to ~40–80+ (mirror the llms.txt pattern). Turns each FAQ into a citation candidate across the highest-value page types. | 🟡 | color `page.tsx` faqItems, match template, brand `brandFaqs` |

## MEDIUM
| # | Action | Effort | File |
|---|---|---|---|
| 2 | Add one substantive sentence (specific color + LRV) to each family `intro` so the `<article>` clears the ~134-word citation floor (currently ~97). | 🟡 | `src/lib/family-content.tsx` |

## LOW (cleanups)
| # | Action | Effort |
|---|---|---|
| 3 | Reconcile brand color count: `brand.color_count` (1,527, displayed/FAQ) vs CollectionPage `numberOfItems` (1,731, live COUNT). Pick one source of truth. | 🟢 |
| 4 | color-identifier `<h1>` → add the "14 Brands" differentiator (title already has it). | 🟢 |
| 5 | Wrap color-detail editorial in `<article>` (~23K pages; semantic hint, extracts fine already). | 🟢 |
| 6 | Add `logo` to the per-brand `Organization` schema. | 🟢 |
| 7 | CI assertion that `SITE_BUILD_DATE` env is injected (guards the `?? new Date()` per-request fallback). | 🟢 |
| 8 | Homepage WebApplications → `@graph`-wrap (optional; valid as-is). | 🟢 |

## Not on this list (deliberately)
- Color-page review-depth + brand-page ordering: known structural items from 6/03, bigger content efforts, deferred until HCU recovery shows.
- Everything else from the 6/03 audit is shipped.
