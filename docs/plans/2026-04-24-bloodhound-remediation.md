# Bloodhound Remediation Plan — 2026-04-24

**Source crawl:** `1928fae9-1fed-49d2-8cfb-ce339cb5ea22` (paintcolorhq.com, started 2026-04-22 13:54 UTC, completed 18:42 UTC)
**Scope:** 141,012 URLs crawled. Health 88.

## Delta vs. Apr 14–15 crawl

| | Apr 14–15 | Apr 22 | Δ |
|---|---|---|---|
| Errors   | 59,407  | 4       | −59,403 |
| Warnings | 431,061 | 73,268  | −357,793 |
| Notices  | 79,000  | 70,801  | −8,199 |
| Health   | 86      | 88      | +2 |

The `htmlLimitedBots` fix (77e9fc2) plus title/H2 trimming wiped out the streaming-head error class and roughly half the warning volume. The remaining work is smaller, more targeted, and mostly falls into: (1) per-page template H2/title uniqueness, (2) faceted URL canonicalization, (3) a handful of one-off fixes, and (4) a handful of "accept & move on" decisions.

## Full issue inventory

### Errors (4)

| Issue | Count | URLs |
|---|---|---|
| `missing_h1` | 4 | `/colors/behr/snow-ballet-590e-2`, `/colors/behr/liberty-580d-6`, `/colors/behr/morning-zen-s380-2`, `/colors/ppg/eggplant-1247-7` |

Live curl of `snow-ballet-590e-2` shows the H1 *is* present. The `h2_missing` warning hits the same 4 pages with "H2-1 Length: 0, Occurrences: 0". These are almost certainly **transient crawl failures** (SF hit a cold ISR render window and timed out before the shell arrived). Treat as 4 one-off re-renders, not a code bug.

### Warnings (73,268)

| Issue | Count | Disposition |
|---|---|---|
| `security_missing_contentsecuritypolicy_header` | 38,990 | **Fix (low risk path): ship a `Content-Security-Policy-Report-Only` header.** Report-only can't break anything but satisfies the crawler check. Stepping up to enforced CSP is a separate follow-up. |
| `h2_multiple` | 26,080 | **Accept.** Every page has 4–8 H2s by design (Technical Profile / Palettes / Keep Exploring / FAQ / etc.). Not a defect. |
| `canonical_mismatch` | 3,960 | **Fix.** All faceted brand/family URLs (`/brands/behr?family=blue&undertone=cool&page=3` etc.). |
| `url_parameters` | 3,960 | **Resolves with canonical fix** — same URLs. |
| `url_internal_search` | 266 | **Fix.** Add `Disallow: /search?` to `robots.txt`. Search result URLs should never be crawled. |
| `h2_missing` | 4 | **Resolves with error fix** (same 4 pages). |
| `url_uppercase` | 4 | **Fix.** `/blog?tag=Design\|Guide\|Trends\|Tips` — change `TagFilter` to lowercase tag params; 301 uppercase → lowercase. |
| `response_codes_internal_blocked_by_robots.txt` | 1 | **Fix.** One internal link points to a URL we just disallowed (likely a tool URL with params). Find + remove the link. |
| `response_codes_external_no_response` | 1 | **Fix.** Dead external link. Replace or delete. |
| `response_codes_internal_redirection_(meta_refresh)` | 1 | **Fix.** Meta refresh somewhere — convert to a real 301. |
| `links_pages_without_internal_outlinks` | 1 | **Fix.** One orphan page — add a link out (likely a /tools/* or legacy page). |

### Notices (70,801)

| Issue | Count | Disposition |
|---|---|---|
| `h2_duplicate` | 26,014 | **Fix (template change).** SF flags this across pages — every color page reuses "Technical Profile / Suggested Color Palettes / Keep Exploring". Make H2s interpolate the page subject so they're unique per URL. |
| `thin_content` | 11,374 | **Accept for now.** Match pages are structurally light; per-page editorial is not economically feasible. Revisit after GSC recovery. |
| `noindex` | 11,118 | **Accept.** Intentional: niche brand pages + paginated listing pages. |
| `page_titles_over_561_pixels` | 8,461 | **Fix.** 4,818 /colors + 3,310 /match + 20 /blog + 4 /tools + 2 static. Most are match pages (already trimmed once — another pass needed). |
| `title_too_long` | 8,154 | **Resolves with above** — same URL set. |
| `h1_duplicate` | 3,600 | **Fix (template change).** Colors named identically across brands (e.g. "Ocean Tropic"). Suffix H1 with brand: `Ocean Tropic (Behr)`. |
| `content_readability_difficult` | 1,809 | **Accept.** All match pages. Content is inherently technical (LRV, Delta E, hex). |
| `content_readability_very_difficult` | 28 | **Accept.** Same. |
| `duplicate_title` | 99 | **Fix.** Color dedup-suffix pages (`-2`, `-3`) share the base page's title. Interpolate the suffix/number into title + description. |
| `duplicate_meta_description` | 99 | **Resolves with above.** |
| `meta_description_over_985_pixels` | 17 | **Fix.** Trim to ≤155 chars. |
| `meta_description_too_long` | 17 | **Resolves with above.** |
| `title_too_short` | 4 | **Fix.** `/tools`, `/blog`, `/contact`, `/brands` have one-word titles — expand. |
| `images_alt_text_over_100_characters` | 3 | **Fix.** 3 blog cover alts — shorten. |
| `images_missing_size` | 1 | **Fix.** `/room-preview.webp` (used in 23,431 inlinks) — add width/height attrs. |
| `oversized_image` | 1 | **Fix.** Same image is 1,042 KB. Re-export smaller. |
| `page_titles_below_200_pixels` | 1 | **Resolves with `title_too_short`.** |
| `links_internal_outlinks_with_no_anchor_text` | 1 | **Fix.** One link is image-only — add `aria-label` or visible text. |

## Phased plan

### Phase 1 — Quick wins (1 commit, <1 hour)

Low-risk, mechanical fixes that resolve ~300 issues immediately.

1. **`robots.txt`**: add `Disallow: /search?` (→ kills 266 `url_internal_search`).
2. **`TagFilter` (blog)**: slugify tag params to lowercase, add lowercase→lowercase redirect in `next.config.ts` for `?tag=Design|Guide|Trends|Tips` (→ kills 4 `url_uppercase` + 4 `canonical_mismatch` dupes).
3. **Static page titles**: rewrite metadata for
   - `/tools` → "Free Paint Color Tools — Visualizer, Calculator & More"
   - `/blog` → "Paint Color Blog — Guides, Trends & Color Theory"
   - `/contact` → "Contact Paint Color HQ"
   - `/brands` → "Paint Brands Directory — 14 Brands, 25,000+ Colors"
4. **Meta description trim**: find the 17 pages flagged `meta_description_too_long`, reduce to ≤155 chars.
5. **`/room-preview.webp`**: re-export at appropriate display resolution (target <150 KB), add `width`/`height` attrs to every consuming component.
6. **Blog cover alts**: shorten the 3 offenders to ≤100 chars.
7. **4 missing-H1 color pages**: trigger ISR revalidate for the 4 URLs so next crawl catches them warm.

### Phase 2 — Faceted URL canonicalization (1 commit)

Resolves 3,960 `canonical_mismatch` + 3,960 `url_parameters` = 7,920 warnings.

Brand and family pages accept `?family=`, `?undertone=`, `?page=` query params. All of these currently share a canonical pointing at the bare route, but filtered views have distinct content — SF flags this as a mismatch.

Options (pick one):

- **(A) Preferred:** add `robots.noindex` to brand/family routes when *any* filter query param is present (keep pagination indexable with rel=next/prev, or noindex everything after page 1). This is the cheapest fix and matches standard faceted-nav SEO guidance.
- **(B) Alt:** make canonicals self-referential when filter params are present. More index surface, more potential for thin-content/duplicate-content flags downstream.

Recommend (A) — faceted filters have never driven search traffic, and `noindex,follow` preserves crawl paths to the underlying colors.

Code touch: `src/app/brands/[brandSlug]/page.tsx`, `src/app/colors/family/[familySlug]/page.tsx`, their `generateMetadata` functions.

### Phase 3 — Template H2/H1/title uniqueness (1 commit)

Resolves ~60k notices (26,014 h2_duplicate + 8,461 page_titles_over_561 + 8,154 title_too_long + 3,600 h1_duplicate).

Two template changes:

1. **Color detail page H2s** — interpolate the color name:
   - "Technical Profile" → `{Name} Technical Profile`
   - "Suggested Color Palettes" → `Palettes Featuring {Name}`
   - "Closest Matches" → `Colors Similar to {Name}`
   - "Room Palettes" → `{Name} in Interior Palettes`
   - "Keep Exploring" → `Explore More {Brand} Colors`
   - "Frequently Asked Questions" → `{Name} FAQ`

2. **H1 brand disambiguation** on colors with duplicate names across brands: append ` ({Brand})` when a name collision exists. Requires a one-time query during build/ISR to flag names that collide across brands, or unconditional append — cheaper to just always append brand name to the H1 subtitle rather than conditional logic.

3. **Match page title** — currently likely "Closest Sherwin-Williams Match for Behr Americana 570D-5 | Paint Color HQ" (>60 chars). Shorten pattern to `{Source Name} ({Code}) to {Target Brand} — Match`.

4. **Color page dedup-suffix titles** — when slug ends in `-2`, `-3`, etc., include `"(v2)"` or the base hex in the title/description so they differ from the primary.

### Phase 4 — One-offs

- Find the single `links_pages_without_internal_outlinks` URL, add a cross-sell block.
- Find the single `response_codes_internal_redirection_(meta_refresh)` — replace with a `next.config.ts` redirect.
- Find the dead external link — replace or delete.
- Find the internal link to a robots-disallowed URL — remove link or unblock.
- Add `aria-label` to the single image-only internal link.

### Phase 5 — CSP report-only (optional)

Add a permissive `Content-Security-Policy-Report-Only` header in `next.config.ts` (or middleware). It can't break anything and satisfies the 38,990 `security_missing_contentsecuritypolicy_header` warnings. Enforced CSP is a separate project (requires auditing every external script: GA, AdSense, Vercel).

## What we're explicitly NOT fixing

| Issue | Count | Why |
|---|---|---|
| `h2_multiple` | 26,080 | Multi-H2 pages are modern template design, not a defect. |
| `noindex` | 11,118 | Intentional — niche brands + pagination. Documented. |
| `thin_content` | 11,374 | Match pages; not per-page editorially feasible. Structural, documented. |
| `content_readability_difficult` | 1,809 | Technical paint content. Intentional. |

## Verification

After each phase, re-run the crawl from the Bloodhound UI or via:
```sql
-- inside bloodhound-worker
from app.models import Crawl
from app.tasks.crawl_tasks import start_crawl
-- ... (see reference_bloodhound.md)
```

Target after all phases: <10 errors, <40k warnings (CSP will still be the dominant class unless Phase 5 ships), <15k notices.

## Decisions (2026-04-24)

1. **CSP:** ship `Content-Security-Policy-Report-Only`. Zero breakage risk, satisfies the 38,990 warnings, and the report endpoint gives us data to draft an enforced policy later.
2. **Match page title pattern:** `"{Source Name} {Code} to {Target Brand} — Closest Match"`. Drop the ` | Paint Color HQ` suffix on match pages to buy pixel budget — brand is already covered by OG/Twitter metadata.
3. **H1 brand suffix:** only on name collisions (e.g. "Ocean Tropic" shared by Behr + PPG). Always-append bloats 14k unique H1s for no win. Detect collisions via a one-time Supabase query cached in a module-level `Set<string>`.
