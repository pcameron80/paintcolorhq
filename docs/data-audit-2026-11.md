# Data audit 2026-11: findings and runbook

The 2026-10-31 audit compared the colors table with each manufacturer's own feed and site. Twenty-four findings survived two independent checks each. This page lists them, what this branch changes, and the order Philip runs the writes in during the 2026-11-08 to 2026-11-14 window.

Nothing here has been applied. Every script below is a dry run unless `--apply` is passed, writes a JSON backup to `scripts/data/backups/` first, writes each row only if it still holds the value that was read, and can `--revert`.

Already fixed or decided before this audit (see the Brain's `projects/paintcolorhq/data-pipeline.md`) is not repeated: the 2026-10-11 hex corrections, BM and Behr published LRV, names pass, availability states and retired rows.

## What the branch changes

| Area | Change |
|---|---|
| Family classifier (`scripts/lib/color-math.ts`) | Rule (h) colored grays and neutrals, rule (i) teal-greens out of blue, rule (j) light reds to pink, a peach carve-out from the tan rule, muted plums and wines no longer filed as pink, `FAMILY_OVERRIDES` (Beetroot, Wild Poppy, Maritime Blue), SW teals stay blue. `refine-color-families.ts` uses `familyForRow`. |
| Undertone (`scripts/lib/undertone.ts`) | Sourced overrides only: SW Passive to Cool (Blue), 13 Farrow & Ball neutral-group colors. Repose Gray's unsourced green override removed. The audit's v2 classifier is not adopted. |
| Names (`apply-published-names.ts`, `lib/name-punctuation.ts`) | The "same letters" guard no longer hides punctuation, spacing and accent artifacts. Three new gated groups: `--punctuation`, `--word-joins`, `--accents`. Catalog casing is kept. |
| LRV (`apply-published-lrv.ts`, `lib/published-lrv-holds.ts`) | `LRV_HOLD_CODES`: 8 published values that pass the 10-point cap but are wrong. |
| Duplicates (`dedupe-colors.ts`, `lib/dedupe-rules.ts`, `scripts/data/explicit-duplicates.json`) | 84 hand-listed pairs with a guard on the loser's code, so a pair cannot run out of order. |
| Vista identities (`fix-vista-identities.ts`, `scripts/data/vista-identity-plan.json`) | New script for the 12 rows the June reconcile re-pointed. |
| RAL (`build-ral-corrections.ts`, `lib/ral-corrections.ts`, `scripts/data/ral-classic-reference.json`) | RAL's own swatches, gated against RAL's Lab values. |
| Sub-2 dE hex (`scripts/data/audit-2026-11/sub-threshold-hex/`) | Ready inputs for `apply-hex-corrections.ts`: 62 Behr rows, 1 BM row. |
| Match-data cache (`build-match-data.ts`) | Cache key v4 includes the `cross_brand_matches` id range, so every reseed regenerates `/match-data`. |

Tests: `npm test` (492 pass), `npx tsc --noEmit` clean, `npm run lint` 0 errors.

## Findings

Row counts are the confirmed scope after both checks. "Dry run" numbers were measured on 2026-10-31 against the live DB with this branch's code.

### Hex

**feed-behr-twins: 193 Behr rows.** Each is one of two rows holding the same Behr code, and the other row already matches behr.com's feed. 70 have the wrong swatch (2.2 to 10.0 dE; 36 at 5+), 122 say `current` where Behr marks the code archived, 28 have an LRV 1+ off. The 70 hold rank 1 for 252 colors of other brands, 235 of them labelled "Nearly identical" against the wrong swatch.
Fix: consolidate first, then correct. The existing dedupe rules (`behr-pad`, `same-code`) already group all 193: on the 2026-10-31 dump, 165 bad rows are losers and retire, and in 28 same-code pairs the base slug (the bad row) stays canonical because it keeps the original URL. A fresh Behr scan then lists those 28 in `behr-hex-changed.json`, and `apply-hex-corrections.ts` corrects them. Fixing hex before consolidating would show the same Behr color twice in adjacent ranks, so do not reverse the order.

**lrv-behr-stale-hex: 61 Behr rows.** Stored hex is 0.95 to 1.99 dE from Behr's swatch, under the scanner's 2 dE cutoff, and Behr's published LRV (already stored) matches Behr's hex, not ours. Mostly whites: Ivory Mist 750C-1, Swiss Coffee 12, Polar Bear 75, Cottage White 13. PR-W8 and YL-W9 from the audit's 63 are dropped: they are unpadded legacy twins of PR-W08 and YL-W09, so syncing them would create exact duplicates. Linen White 70 is added (1.26 dE, canonical for two merged legacy rows). Input: `scripts/data/audit-2026-11/sub-threshold-hex/behr-hex-changed.json` (62 rows). Recomputing these changes the closest match in 554 of 756 brand slots.

**feed-ral-hex: 198 of 213 RAL rows 2+ dE off RAL's own swatch** (187 off under both RAL references). All 213 are the 2020 colornerd values. RAL 9010 Pure White is stored #ffffff with LRV 100; RAL publishes #efeee5 and LRV 84. RAL rows hold the closest-RAL card on 26,507 pages.
Call made: use RAL's swatch hex from ral-farben.de, except where it is the worse value. `build-ral-corrections.ts` decides per row: 145 apply, 31 held because the swatch is more than 1 dE farther from RAL's Lab than our stored hex (saturated reds, oranges and greens near the sRGB edge, e.g. 8011: 0.8 stored vs 3.8 swatch), 23 effect colors held (pearl, luminous, metallic), 14 already within 2 dE. LRV comes from RAL's published LRV, else Y from RAL's Lab, never from the screen hex. A second LRV pass fixes 17 held or close rows at `--min-diff=1`. Held rows go to `ral-review.json` for a hand check. Not done: a live `ral` source in `palette-sources.ts`; the reference file is a one-time snapshot.

**identity-bm-alias-pairs-missed (hex part).** HC-186 Charleston Brown, the row kept in the merge below, stores #75533a; BM publishes #745239. Input: `sub-threshold-hex/benjamin-moore-hex-changed.json`.

### LRV

**feed-lrv-published-not-applied: 4,338 to 5,072 rows** (the checks differ on how many published values to trust). Dunn-Edwards, Vista and PPG store the LRV computed from hex; their published LRV differs by 1+ point. D-E whites run about 7 points high (Springtime Dew DE5553: 99 stored, 92 published). Already implemented by `apply-published-lrv.ts` on main; this is the command, not new code. Dry run at `--min-diff=1`: D-E 1,477, Vista 1,640, PPG 1,197.
Excluded: Sherwin-Williams and Dutch Boy (decided 2026-10-11 as within rounding). **Hirshfield's (738 rows) is a decision:** Hirshfield's own L* agrees with our stored value on 696 of them, while its LRV field disagrees, so its data contradicts itself.

**lrv-mp50-preflight: 8 rows.** Published values that pass the 10-point cap but are wrong: Vista 7152, 7329 and 7386 copy a neighbor's value; Vista AC124 is off its strip; Vista H0027 says 36 where Hirshfield's says 27.9 for the same color; PPG 1031-1 copies 1031-2 (the old PPG site said 60). PPG 1235-1 and Vista 8560 are medium and low confidence. All 8 are in `LRV_HOLD_CODES` and keep their computed LRV. Vista 8560 Brownstone's page also contradicts itself on RGB vs hex, so its hex needs a look. Check Vista 7328 City of Atlantis (46 vs Y 39.8) by hand before the Vista write. If PR #263 lands first, move `LRV_HOLD_CODES` into its `LRV_SKIP_CODES`.

### Names

**feed-names-punctuation: 69 rows** (audit said 53; the checks found 16 more). Same letters as the manufacturer's name, different punctuation: "Strawberryncream" for Strawberry 'n Cream, "Smoke Mirrors", "Natures Reflection", "St Johns Bay". The names script skipped every such pair as "curly vs straight quotes". Dry run with the new groups:

| Group | Flag | Rows | Examples |
|---|---|---:|---|
| punctuation | `--punctuation` | 62 | Bananappeal to Banan-Appeal, Bride to Be to Bride-to-Be |
| word-join | `--word-joins` | 9 | Tear Drop to Teardrop, Black Jack to Blackjack, Tea Green to Teagreen |
| accent | `--accents` | 10 | Cafe Noir to Café Noir, A la Mode to À la Mode, Behr Parisian Cafe to Parisian Cafè |

Casing follows the catalog ("Bride-to-Be", not the feed's "Bride-To-Be"); one-letter contractions follow the manufacturer ("Cup o' Java"). Accents the feed drops (Valspar Jalapeño) are kept. Slugs never change.

### Duplicates and identity

**identity-behr-legacy-code-duplicates: 23 rows** duplicating 11 live Behr colors: 18xx and W-x-xxx stock codes (Swiss Coffee 1812 and W-B-700 next to Swiss Coffee 12), OR-W9, BL-W14, BL-W15, UL250-10 and UL260-7. Behr's index lists only the stock number. Explicit pairs; canonical is the live row. PPU16-11 stays `retired` (the retire tool never copies availability).

**identity-vista-legacy-duplicates: 66 rows.** Colornerd C-/K- book rows for colors Vista sells under a new code, with darker, oversaturated swatches (median 4.5 dE). 56 are explicit pairs into the live row. The other 10 are handled by the identity fix below, because their twin is a mis-paired row.

**identity-vista-reconcile-mispaired: 12 rows.** The June reconcile's near-hex pass gave a live code to the wrong row: goldfinch-k-545 shows 7861 Under the Sun while under-the-sun-k-464 sits unmatched. `fix-vista-identities.ts` moves each live code, name, hex and LRV onto the same-name row (11 assigns), gives the re-pointed rows their own identity back (10 restores; historic colors take Hirshfield's hex, which still sells them), and changes plum-cake-1232's alternate to `C-1232`. Three restored rows (goldfinch-k-545, sporty-yellow-k-1203, woodland-fern-k-272) then retire into their live rows through explicit pairs; `dedupe-colors.ts` refuses those three until the fix has run. Dry run: 22 ops ready, 0 changed since the audit.

**identity-bm-alias-pairs-missed: 4 rows, 2 pairs.** 879 / OC-69 Opulence and PM-23 / HC-186 Charleston Brown are one color each on BM's site but one hex step apart, so the name+hex rule misses them. Explicit pairs; OC-69 and HC-186 kept. Move the `white-opulence-879` entry in `src/lib/former-names.ts` to `opulence-oc-69` after the retire, or the "previously listed as" line stops showing.

**identity-dutch-boy-foreign-codes: 101 rows, 30 firm.** Dutch Boy's palette uses only `###-#DB` and `###W`. 30 DCP- rows carry another palette's numbers and names (the same colors exist as Hirshfield's rows). The other 71 (VS-, D-, 74xx) are absent from Dutch Boy's current palette with no public trace. **Decision**, see below.

**feed-no-source: 2,151 rows** with no manufacturer source to check: 128 Colorhouse (site gone), 714 Kilz L*/R* codes, and about 1,309 legacy rows other brands no longer list. 42 BM AC- rows are excluded because `fetch-bm-aliases.ts` + `dedupe-colors.ts` already fold them; 7 Dunn-Edwards 2006 rows have live pages and published LRVs. **Decision**, see below. Do not keep the Kilz 714 out of the closest-Kilz slot: without them the median closest-Kilz distance rises from 2.4 to 4.75 dE.

### Labels

**labels-family-stale-vs-main.** With this branch, `refine-color-families.ts` changes **4,006 rows** (main alone: 3,110). The plan expected 1,000 to 2,500. Family is in color-page titles and meta, so expect about 4,000 title and meta changes. One head color (SW Natural Linen, orange to beige) waits for the freeze to end.

| Move | Rows |
|---|---:|
| orange to beige | 1,659 |
| red to pink | 585 |
| orange to off-white | 507 |
| neutral and gray to green | 418 |
| neutral and gray to purple | 262 |
| yellow to off-white | 212 |
| neutral and gray to blue | 129 |
| blue to green | 82 |
| gray and neutral to black | 65 |
| other | 87 |

**labels-family-colored-in-gray-neutral: 847 rows, 622 left by main.** New rule (h): a gray or neutral outside the warm-gray band (LCh hue 20-110) with C* 15+, or dark and saturated (L* < 50, C* 9+, C*/L* 0.3+), is re-filed by hue. Plums at hue 330-355 go to purple and dark wines at 355-20 to red, not pink (the checks found most of the 111 "pink" targets were Concord Grape, Divine Wine and the like). Pinned: Newburyport Blue HC-155 to blue, Clary Sage PPU11-07 to green; Hale Navy HC-154 stays below the cutoff.

**labels-family-light-red-is-pink: 572 rows, 387 left by main.** Rule (j): red with L* 72+ and hue under 30 or 340+ is pink. Corals at hue 30-35 (66 rows) stay red: BM tags some of them orange. **Decision** whether they go to pink.

**labels-family-planned-peach-to-beige: 130 rows.** Main's tan rule would move pale peaches (BM Fresh Peach 060, Valspar New Peach) to beige. Carve-out: orange at hue 55-70 with C* 18+ and L* 75+ stays orange. Darker tans at the same hue (Fox Hedge Tan, Cavern Clay) still go to beige, which matches BM, SW and Valspar. Moving the hue floor to 70 instead would have kept about 100 tans in orange.

**labels-family-teal-green-in-blue: 80 to 93 rows.** Rule (i): blue with LCh hue under 185 and C* over 10 is green (BM Erin Green 608). Dry run: 82. Sherwin-Williams is exempt: its own API files Cooled Blue, Rivulet, Thermal Spring and Poseidon as Blue. BM Maritime Blue 667 is pinned blue (BM's breadcrumb). Moving the HSL boundary instead would have re-filed 273 true teals.

**labels-family-brand-api-oddities: 2 rows.** SW Beetroot 9695 and Wild Poppy 9694 are filed orange; SW serves both under `/red-paint-colors/`. Pinned red in `FAMILY_OVERRIDES`. Valspar Frisky Whiskers stays purple: Valspar's own API says Purple. SW Full Bloom 9700 stays orange, as SW files it.

**labels-undertone-main-vs-published: 88 reference colors, 23 misses.** Main matches published undertones on 41% strict and 75% lenient. The audit's v2 classifier was **not adopted**: its held-out gain was 2 of 35 colors, its warm/cool/neutral agreement averaged -1.1 points over 300 splits, and it would turn 1,014 Neutral rows (including #FFFFFF) Cool (Blue) and move beiges and browns to Cool (Violet). Carried over: sourced overrides only (Passive, 13 F&B neutral-group colors). Not carried over: BM Revere Pewter to green and Balboa Mist to violet (BM's own pages say "a bridge between warm and cool tones" and "a slightly warm cast"), and F&B Elephant's Breath to violet (F&B: lilac with "a modern warmth").

**labels-undertone-fixtures-unsourced: 2 fixtures.** SW Passive was pinned Neutral against SW's "cool blue undertones"; now Cool (Blue) by override. The Repose Gray override to green cited SW calling it cool, but SW's color page says "soothing warmth" and no source names green; removed, so Repose Gray takes the Lab result, Warm (Golden). The test header now says which fixtures are manufacturer-sourced and which are colorimetric boundary guards; the boundary pins stay.

**labels-undertone-relabel-scope: 15,889 rows change** with this branch (main: 15,892), 15,879 outside the 13 head colors. MP-26's brief expected 8.7k to 10.7k; PR #239 already corrected that to about 15.7k, so update the Brain's full-review row, not the PR. 8,460 are Neutral to Warm (Golden). The `content_updated_at` trigger bumps lastmod on every changed page.

**labels-undertone-display-guard: 2,066 to 2,407 rows.** In the greige band (C* 3 to 10, hue about 75 to 100) the hex cannot say which sub-undertone designers name, and main's "(Golden)" matches the published primary on 6 of 25 reference colors, though "Warm" is right on 27 of 36. MP-70 plans to reduce the page guard to the null and C* 20+ rules. **Decision**, see below.

### Matches

**matches-stale-tie-order: 512 rank-1 slots** (972 lists). The stored lists still use the pre-2026-10-24 tie rule, so on an exact tie a not-live row ranks above its identical live twin (PPG Frank Lloyd Wright FLLW742 above Pine Ridge 1138-5). Swatches, scores and labels are right; only which code shows first is wrong. Fixed by the match recompute in the runbook; 181 of the 512 are Kilz, where "not live" means unverified.

**matches-match-data-cache-ignores-reseed: 0 rows today.** The `/match-data` cache key ignored match content, so a reseed that kept 1,603,200 rows would have re-served the old files without an error. Fixed: cache key v4 includes the first and last `cross_brand_matches` id, which change on every reseed. `docs/data-pipeline.md` corrected.

## Runbook

Run from the main checkout after this branch merges, in the 2026-11-08 to 2026-11-14 window, in this order. Every `--apply` writes a backup; note each backup path for the audit step at the end.

```bash
# 0. Fresh scans (the appliers skip rows edited since the scan). Vista is slow (~2,900 pages).
npm run scan-palettes -- --brand=behr,benjamin-moore,dunn-edwards,ppg,vista-paint --out-dir=data/brand-scans/2026-11-08
npx tsx scripts/build-ral-corrections.ts --out=data/brand-scans/ral-2026-11

# 1. Names. Dry run, read the groups, then apply. Add --word-joins / --accents only if decided (D3).
npx tsx scripts/apply-published-names.ts --scan-dir=data/brand-scans/2026-11-08 --brand=benjamin-moore,behr,dunn-edwards,ppg
npx tsx scripts/apply-published-names.ts --scan-dir=data/brand-scans/2026-11-08 --brand=benjamin-moore,behr,dunn-edwards,ppg --apply --punctuation

# 2. Identity and duplicates.
npx tsx scripts/fix-vista-identities.ts                 # dry run: expect 22 ready, 0 changed
npx tsx scripts/fix-vista-identities.ts --apply
npx tsx scripts/fetch-bm-aliases.ts                     # if data/bm-ac-aliases.json is missing
npx tsx scripts/dedupe-colors.ts --write-redirects      # plan; expect 0 explicit pairs refused
#    Commit and deploy src/data/color-redirects.json BEFORE retiring, so old URLs 301 at once.
npx tsx scripts/retire-bad-color-rows.ts --pairs=scripts/data/dedupe-plan-<date>.json          # dry run
npx tsx scripts/retire-bad-color-rows.ts --pairs=scripts/data/dedupe-plan-<date>.json --apply
#    Then move src/lib/former-names.ts "benjamin-moore/white-opulence-879" to "benjamin-moore/opulence-oc-69".

# 3. Hex. Rescan Behr so its hex-changed list reflects the retired rows (expect the 28 same-code canonicals).
npm run scan-palettes -- --brand=behr --out-dir=data/brand-scans/2026-11-08b
npx tsx scripts/apply-hex-corrections.ts --scan-dir=data/brand-scans/2026-11-08b --brand=behr
npx tsx scripts/apply-hex-corrections.ts --scan-dir=data/brand-scans/2026-11-08b --brand=behr --apply
npx tsx scripts/apply-hex-corrections.ts --scan-dir=scripts/data/audit-2026-11/sub-threshold-hex --brand=behr,benjamin-moore
npx tsx scripts/apply-hex-corrections.ts --scan-dir=scripts/data/audit-2026-11/sub-threshold-hex --brand=behr,benjamin-moore --apply
npx tsx scripts/apply-hex-corrections.ts --scan-dir=data/brand-scans/ral-2026-11 --brand=ral
npx tsx scripts/apply-hex-corrections.ts --scan-dir=data/brand-scans/ral-2026-11 --brand=ral --apply

# 4. LRV (no match recompute needed for this step). Hirshfield's only if decided (D1).
npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/2026-11-08 --brand=dunn-edwards
npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/2026-11-08 --brand=dunn-edwards --apply
npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/2026-11-08 --brand=vista-paint,ppg --min-diff=1
npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/2026-11-08 --brand=vista-paint,ppg --min-diff=1 --apply
npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/2026-11-08b --brand=behr --min-diff=0.5 --apply
npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/ral-2026-11 --brand=ral --min-diff=1 --apply
npx tsx scripts/apply-availability.ts --scan-dir=data/brand-scans/2026-11-08b      # Behr twins left 'current'; then --apply

# 5. Family labels (refuses --apply before 2026-11-04; head colors held until 2026-11-27).
npx tsx scripts/refine-color-families.ts                # dry run: expect about 4,006
npx tsx scripts/refine-color-families.ts --apply

# 6. Match recompute.
npm run export-db-colors
npm run compute-matches
#    Philip, in the Supabase SQL editor, with his OK: TRUNCATE cross_brand_matches;
npm run seed-matches
#    Check: SELECT count(*) FROM cross_brand_matches = colors x 60.
#    Redeploy. Cache key v4 regenerates /match-data on its own; a build from before
#    this branch needs Vercel's build cache unchecked or `npm run build-match-data -- --force`.

# 7. Content that quotes changed values (one run per backup from steps 3 to 5).
npm run audit-colors -- --changed=scripts/data/backups/hex-corrections-<ts>.json
npm run audit-colors -- --changed=scripts/data/backups/published-lrv-<ts>.json

# 8. Undertones, on or after 2026-11-28 (head-color page bodies are frozen until 2026-11-27;
#    the script refuses before 2026-11-04 and skips the 13 head colors until 2026-11-28).
npx tsx scripts/populate-undertones.ts                  # dry run: expect about 15,889 changes
npx tsx scripts/populate-undertones.ts --apply
#    Redeploy, then npm run audit-colors.
```

Notes:
- Step 2 must precede step 3. Correcting Behr twin hexes first would list the same Behr color twice in adjacent ranks.
- Step 5 and step 8 change titles, meta and lastmod on about 4,000 and 15,900 pages. Running them in one window is possible but makes any traffic change harder to read.
- PR #262 (names) and PR #263 (LRV source) touch `apply-published-names.ts` and `apply-published-lrv.ts`. Whichever merges second needs a rebase; keep `LRV_HOLD_CODES` and the punctuation groups.

## Decisions for Philip

| # | Decision | Recommendation |
|---|---|---|
| D1 | Hirshfield's published LRV (738 rows) | Hold. Its own L* backs our stored value on 696 of them. |
| D2 | Light corals at hue 30-35 (66 rows): pink or red | Leave red until BM's tags are checked; they are not orange either way. |
| D3 | Word joins (9) and accents (10) | Apply word joins (the manufacturer spells them that way); apply accents except Behr "Parisian Cafè", whose grave accent looks like a feed typo. |
| D4 | RAL: the 31 gamut-held and 23 effect rows | Review `ral-review.json`; leave effect colors as they are and say so on the RAL brand page. |
| D5 | Dutch Boy foreign codes (101) | Exclude the 30 DCP rows as match targets and 301 them to the Hirshfield's rows; do not mark the 71 VS-/D-/74xx rows discontinued, since nothing shows they cannot be bought. |
| D6 | Colorhouse (128) | Do the MP-80 retailer check before any state change; the site is gone and Home Depot lists one color as discontinued. |
| D7 | Kilz 714 and 1,309 legacy rows | Keep them as match targets; do not quote their hex or LRV in copy. |
| D8 | Undertone page guard in the greige band | Show the temperature only ("warm") for C* 3 to 10 at hue 75 to 100 unless a sourced override exists; keep Neutral below C* 3. Do not reduce the guard to the null and C* 20+ rules. |
| D9 | The 7 restored historic Vista rows (Madder, Amish Green and others) | Leave `current` until the availability rule's spot check; Hirshfield's still sells them. |
| D10 | Repose Gray now Warm (Golden) | Keep; SW's own wording is warm. Revert by restoring the override if you prefer the cool reading. |
