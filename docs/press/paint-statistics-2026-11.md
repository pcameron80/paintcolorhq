# Press kit: Paint color statistics, November 2026

Page: https://www.paintcolorhq.com/paint-color-statistics
Data download: https://www.paintcolorhq.com/data/paint-color-statistics-by-brand.csv
Contact: Philip Cameron, founder, Paint Color HQ (philip@paintcolorhq.com)

Nothing in this file has been sent. Every pitch below is a draft for Philip to approve, edit or drop. Check the outreach send log before using any of them.

All figures come from two reproducible scripts in this repo: `scripts/study-palette-stats.ts` (run 2026-10-31, writes `src/data/palette-stats-study.json`) and `scripts/study-duplication.ts` (run 2026-10-24, writes `src/data/duplication-study.json`). If either is re-run, re-check every number here against the JSON before sending.

## Five headline stats

1. **51.6% of paint colors named "White" are not that white.** Of the 225 current colors whose name ends in "White" at Benjamin Moore, Behr, Sherwin-Williams and Dutch Boy, 116 have a published LRV below 80; at Sherwin-Williams it is 48 of 62 (77.4%).
   Context: LRV is the share of light a color reflects, and 80 is the line we use between a white and an off-white, so a shopper picking by name often gets an off-white.

2. **The median paint color named gray has an LRV of 40.6.** 227 of 335 current gray or grey colors (67.8%) sit below LRV 50, the middle of the 0 to 100 scale, and the middle 80% of them run from LRV 17 to 63.
   Context: "gray" covers everything from charcoal to a pale silver, so the name tells a buyer almost nothing about how dark a room will feel.

3. **Colors of the Year have gotten darker.** The 11 picks Benjamin Moore, Behr and Sherwin-Williams made for 2024 through 2027 average a published LRV of 25.0, against 46.6 for their six picks for 2022 and 2023, and 8 of the 11 sit below LRV 25.
   Context: Behr went from Blank Canvas (LRV 84) for 2023 to Cracked Pepper (LRV 8) for 2024, though 2027 is lighter than 2025 because of Sherwin-Williams' Celery (LRV 71.3).

4. **Sherwin-Williams sells the darkest palette of the four brands that publish LRV.** Its median current color has an LRV of 38.7, against 46 for Behr, and only 3.0% of its current colors reach LRV 80, against 12.6% of Behr's.
   Context: the four-brand median is 43.5, so Sherwin-Williams sits 4.8 points darker than the market and Behr 2.5 points lighter.

5. **One in eight paint colors is a near-white neutral.** Of 23,801 colors we could verify against each brand's own palette, 3,053 (12.8%) are near-white neutrals, and colors with a yellow, cream or gold hue outnumber purples 5.7 to 1 (5,381 to 942).
   Context: this is the most crowded spot on the color wheel, which is one reason 69.7% of all 26,720 colors we track have a nearly identical twin at another brand.

## Summary (120 words)

Paint Color HQ measured 26,720 named paint colors from 13 brands. Using only manufacturer-published Light Reflectance Values (LRV) from Benjamin Moore, Behr, Sherwin-Williams and Dutch Boy, the study finds that 51.6% of current colors named "White" reflect less than 80% of light, and the median color named gray has an LRV of 40.6. The Colors of the Year that Benjamin Moore, Behr and Sherwin-Williams picked for 2024 through 2027 average an LRV of 25, down from 46.6 for 2022 and 2023. Sherwin-Williams has the darkest current palette of the four brands, at a median LRV of 38.7. One in eight colors is a near-white neutral, and 69.7% of all colors have a nearly identical twin at a competing brand.

## Method note

- **Which colors count.** The LRV, Color of the Year, hue and retirement figures use only colors that match the manufacturer's own current palette (scan of 2026-10-11): same code, same name, and a stored swatch within CIEDE2000 2 of the brand's swatch. Each manufacturer code counts once. That leaves 23,801 of 26,720 rows. RAL is not studied (an industrial standard, and 198 of our 213 RAL swatches are 2+ off RAL's own). Rows with no current manufacturer listing (1,881, mostly legacy Kilz, Valspar and Behr rows, plus all 128 Colorhouse rows), 69 whose name no longer matches, and 113 repeat rows of a code already counted are left out.
- **Audit exclusions.** 515 rows flagged by the 2026-10-31 data audit are excluded from every figure (ids in `scripts/lib/study-exclusions.json`): 193 Behr twin rows that disagree with Behr's feed, 117 Behr rows with a stale hex, 53 names that differ from the manufacturer's only in punctuation, 66 Vista legacy duplicates, 12 mispaired Vista rows, 23 Behr legacy-code duplicates, 4 Benjamin Moore alias rows and 101 Dutch Boy rows with foreign codes. Some rows carry more than one flag.
- **LRV.** Manufacturer-published values only, read from each brand's own feed: Benjamin Moore, Behr, Sherwin-Williams and Dutch Boy. Dunn-Edwards, Hirshfield's, Vista Paint and PPG publish LRV, but the values we store for them are computed from the hex (Dunn-Edwards whites run about 7 points high), so they are left out rather than estimated. Valspar, Kilz, Farrow & Ball and Colorhouse publish none in our sources. Current colors only, except the retired comparison.
- **Names, not labels.** "White" means the name ends in White or Whites (so White Oak and White Truffle do not count). Gray, beige and the other words match anywhere in the name. Stored color-family and undertone labels are not used, because the audit found both need correcting.
- **Color of the Year.** Benjamin Moore, Behr and Sherwin-Williams picks for 2022 to 2027, each checked against the brand's announcement or archive (`src/data/coty-history.ts` and `src/lib/color-of-the-year.ts`). Sherwin-Williams named a nine-color capsule for 2025, so 2025 has two picks. The split at 2023/2024 is ours; the per-year averages are 47.6, 45.5, 27.5, 13.9, 21.6 and 33.5, and a writer can quote those instead.
- **Hue and lightness** come from CIELAB values of each brand's published swatch hex. Near-neutral is chroma under 10. These are screen colors, not measured paint samples.
- **Duplication** (69.7%, 18,616 of 26,720) is the separate 2026-10-24 study: a color's rank-1 match at another brand scores CIEDE2000 under 1.0. Matches are digital; anyone swapping one brand's color for another should confirm with a physical sample.

## Images and charts

All charts are server-rendered on the page, so they can be linked by anchor or captured as screenshots. There are no standalone image files yet; if an outlet asks for one, screenshot the chart at 2x and send it with the alt text below.

| Chart | Where | Alt text |
|---|---|---|
| Share of colors named "White" below LRV 80, by brand (bar chart) | /paint-color-statistics#whites | Sherwin-Williams 77.4%, Benjamin Moore 54.3%, Dutch Boy 41.2%, Behr 30.3% of colors named White have a published LRV below 80. |
| The darkest colors sold as a white (table with swatches) | /paint-color-statistics#whites | Behr Alice White LRV 60, Sherwin-Williams Individual White 62, Dutch Boy Elemental White 63, Benjamin Moore Berber White 63.2 and Bruton White 63.3. |
| Median LRV by a word in the color's name (bar chart) | /paint-color-statistics (section "How light is a color called gray?") | Median published LRV: White 79.4, Cream 75, Beige 55.3, Khaki 48, Gray 40.6, Green 36.9, Sage 36, Taupe 33.8, Blue 33.1, Navy 7, Black 6. |
| Median LRV of each brand's current palette (bar chart with market line) | /paint-color-statistics (section "Which brands sell the lightest and darkest palettes?") | Behr 46, Benjamin Moore 44.3, Dutch Boy 44, Sherwin-Williams 38.7; four-brand median 43.5. |
| Published LRV of each Color of the Year pick, 2022 to 2027 (table with swatches and bars) | /paint-color-statistics#color-of-the-year | Year averages for Benjamin Moore, Behr and Sherwin-Williams picks: 2022 47.6, 2023 45.5, 2024 27.5, 2025 13.9, 2026 21.6, 2027 33.5. |
| Colors by hue and lightness (heat map) | /paint-color-statistics#crowding | The most crowded cell is very light near-neutrals, 3,053 colors; very dark yellows hold 1. |
| Retired colors (table) | /paint-color-statistics (section "How many colors are retired but still sold?") | Behr: 2,531 of 5,087 listed colors retired, median LRV 36 against 46 for current colors. |
| Earlier: the most duplicated paint color | /blog/most-duplicated-paint-color | Existing study chart; keep the Flurry wording rule ("11 other paint brands plus the RAL color standard" in outreach). |

## Target outlets and draft pitches

Outlets already contacted in outreach round 1 are left off this list; the send log of record is the local, gitignored `reports/competitor-gap-2026-10/outreach.md`. Check it before sending any of these. Find each writer's current address before sending; none were looked up for this file. Follow the outreach ladder: email or the outlet's tip form, never a cold call.

Timing: the Color of the Year pitches (1 to 8) land best before Pantone's announcement in early December 2026. The LRV pitches (9 to 20) are evergreen.

### 1. Young House Love: John Petersik
Fit: [Every 2027 Color Of The Year (So Far!)](https://www.younghouselove.com/2027-color-of-the-year/), Aug 24, 2026, which notes that 2025 ran darker than 2024.

> Your 2027 tracker said 2025 was darker than 2024, and the published numbers back that up: the Benjamin Moore, Behr and Sherwin-Williams picks for 2024 through 2027 average an LRV of 25, against 46.6 for 2022 and 2023. The year-by-year averages and every pick's LRV are in one table at paintcolorhq.com/paint-color-statistics, with a CSV if you want to chart it yourself. Happy to send anything else you need for the tracker update.
>
> Philip Cameron, founder, Paint Color HQ

### 2. Homes & Gardens: Eleanor Richardson
Fit: [Every Color of the Year We Know So Far: the 2027 shades](https://www.homesandgardens.com/decor/paint/colors-of-the-year-2027).

> Your 2027 roundup covers the picks; I have one number that sits behind them. The 11 Colors of the Year Benjamin Moore, Behr and Sherwin-Williams named for 2024 through 2027 average a published LRV of 25, down from 46.6 for their 2022 and 2023 picks, and 8 of the 11 are below LRV 25. The full table, with each pick's LRV and swatch, is at paintcolorhq.com/paint-color-statistics#color-of-the-year and is free to cite.
>
> Philip Cameron, founder, Paint Color HQ

### 3. Midwest Design: Amanda Christensen
Fit: [The 2027 Color of the Year Announcements, Thus Far](https://www.midwestdesignmag.com/featured/the-2027-color-of-the-year-announcements-thus-far/), Oct 28, 2026.

> Thanks for keeping a running list of the 2027 picks. If a follow-up is useful, I measured how light they are: Behr went from Blank Canvas at LRV 84 for 2023 to Cracked Pepper at LRV 8 for 2024, and its picks have stayed at LRV 14 or below since. Every pick from 2022 to 2027 for Benjamin Moore, Behr and Sherwin-Williams, with its published LRV, is at paintcolorhq.com/paint-color-statistics.
>
> Philip Cameron, founder, Paint Color HQ

### 4. Multifamily Executive: Christine Serlin
Fit: [What the 2027 Colors of the Year Say About Design Trends](https://www.multifamilyexecutive.com/design-trends/what-2027-colors-year-say-about-design-trends), Oct 15, 2026.

> For property teams choosing a unit color, the darker Color of the Year trend has a practical cost: the 2024 to 2027 picks from Benjamin Moore, Behr and Sherwin-Williams average an LRV of 25, so they reflect about a quarter of the light that hits them. We also found that 51.6% of colors sold with "White" in the name reflect less than 80% of light, which matters when a spec just says "white". The data is free to cite at paintcolorhq.com/paint-color-statistics.
>
> Philip Cameron, founder, Paint Color HQ

### 5. Pro Builder: Catherine Sweeney
Fit: [Roundup: Color of the Year Picks Reflect Trend Toward Warm Neutrals](https://www.probuilder.com/design/article/55405899/roundup-color-of-the-year-picks-reflect-trend-toward-warm-neutrals), Oct 6, 2026.

> Your roundup called out the move to warm neutrals, and the palettes themselves lean the same way: of 23,801 colors we checked against each brand's own list, yellow, cream and gold hues outnumber purples 5.7 to 1. Separately, the Benjamin Moore, Behr and Sherwin-Williams Colors of the Year for 2024 through 2027 average an LRV of 25, against 46.6 for 2022 and 2023. Both are at paintcolorhq.com/paint-color-statistics with a downloadable per-brand table.
>
> Philip Cameron, founder, Paint Color HQ

### 6. Drew & Jonathan: Bree Pulver O'Hagan
Fit: [Every 2027 Color of the Year Announced So Far](https://www.drewandjonathan.com/design-and-decor/color-of-the-year-2027-ideas-inspiration/), Oct 9, 2026.

> Readers looking at your 2027 list may want to know how dark each pick will feel in a room. I pulled the published LRV for every Benjamin Moore, Behr and Sherwin-Williams pick since 2022: Celery is the light one at 71.3, while Behr's Grounded is 9 and Benjamin Moore's Webster Green is 20.2. The table is at paintcolorhq.com/paint-color-statistics#color-of-the-year if it helps a follow-up piece.
>
> Philip Cameron, founder, Paint Color HQ

### 7. Hunker: Erika Dale
Fit: [Sherwin-Williams' 2027 Color Of The Year Brings A Fresh, Whimsical Calm](https://www.hunker.com/2257361/sherwin-williams-color-of-the-year-2027-celery-paint/), Sept 15, 2026.

> Celery breaks a pattern: at a published LRV of 71.3, it is the lightest Color of the Year Benjamin Moore, Behr or Sherwin-Williams has named since Behr's Blank Canvas for 2023. The other 10 picks for 2024 through 2027 average an LRV of about 20. The full list is at paintcolorhq.com/paint-color-statistics if you want the numbers for a follow-up.
>
> Philip Cameron, founder, Paint Color HQ

Check before sending: the "about 20" figure is the mean of the 10 non-Celery picks for 2024 to 2027 (8, 17, 57.4, 8, 19.7, 14, 10.2, 40.5, 9, 20.2 gives 20.4). Recompute if the JSON changes.

### 8. Axios: home and lifestyle desk (byline to confirm)
Fit: [The wall colors primed to take over next year](https://www.axios.com/2026/09/27/paint-color-trends-2027), Sept 27, 2026, which reported Behr's sales claim for Hidden Gem.

> Axios covered the 2027 picks in September; here is a number that tracks them over time. The Benjamin Moore, Behr and Sherwin-Williams Colors of the Year for 2024 through 2027 average a published LRV of 25, against 46.6 for 2022 and 2023, so the picks now reflect about half as much light. The method, the per-pick table and a CSV are at paintcolorhq.com/paint-color-statistics.
>
> Philip Cameron, founder, Paint Color HQ

### 9. Hardware Retailing: Annie Dameworth
Fit: [Behr Names 2027 Color of the Year, Marks 10th Anniversary With Donation](https://hardwareretailing.com/?p=96443), Aug 26, 2026.

> A number your retail readers may find useful: of the 5,087 Behr colors we matched to Behr's own site, 2,531 (49.8%) are retired, and in our spot check of 10, Behr's pages said every one can still be bought at The Home Depot. That is a lot of customer requests for colors that are not on the fan deck. The per-brand counts are at paintcolorhq.com/paint-color-statistics, free to cite.
>
> Philip Cameron, founder, Paint Color HQ

### 10. WATE 6 (Knoxville): Carlos Mathis
Fit: [Vegetable-named hue picked as 2027 Sherwin-Williams Color of the Year](https://www.wate.com/news/vegetable-named-hue-picked-as-2027-sherwin-williams-color-of-the-year/amp/).

> I run Paint Color HQ from Clinton, and I measured the paint industry's Colors of the Year after your Celery story. Celery, at a published LRV of 71.3, is the lightest pick from Benjamin Moore, Behr or Sherwin-Williams since 2023; the other picks for 2024 through 2027 average about 20. I would be glad to talk through the numbers for a local follow-up, and they are all at paintcolorhq.com/paint-color-statistics.
>
> Philip Cameron, founder, Paint Color HQ

### 11. Bob Vila: Theresa Clement
Fit: [2026 Color of the Year Announcements Have This In Common](https://www.bobvila.com/interior/2026-colors-of-the-year).

> Your 2026 piece looked for what the picks had in common; the published LRVs give one answer. The 2026 picks from Benjamin Moore, Behr and Sherwin-Williams average an LRV of 21.6, and their picks for 2024 through 2027 average 25, against 46.6 for 2022 and 2023. The full table, with a CSV, is at paintcolorhq.com/paint-color-statistics if you update the piece for 2027.
>
> Philip Cameron, founder, Paint Color HQ

### 12. TODAY: Becca Wood
Fit: [Here is every 2025 Color of the Year we know so far](https://www.today.com/today/amp/rcna166465), Oct 22, 2024.

> If you are building the 2027 version of your Color of the Year list, here is a data point to go with it. The picks Benjamin Moore, Behr and Sherwin-Williams made for 2024 through 2027 average a published LRV of 25, down from 46.6 for their 2022 and 2023 picks, so the trend has run dark. Each pick's LRV is at paintcolorhq.com/paint-color-statistics, free to cite.
>
> Philip Cameron, founder, Paint Color HQ

### 13. Livingetc: Lilith Hudson
Fit: [What Are the Most Popular Sherwin-Williams Paint Colors?](https://livingetc.com/advice/most-popular-sherwin-williams-colors)

> Your piece on Sherwin-Williams' best sellers leans on its whites, and the published numbers show how varied they are. 48 of the 62 current Sherwin-Williams colors whose name ends in "White" (77.4%) have a published LRV below 80, the highest share of the four brands we measured, and Sherwin-Williams has the darkest current palette overall, at a median LRV of 38.7. The data is at paintcolorhq.com/paint-color-statistics#whites.
>
> Philip Cameron, founder, Paint Color HQ

### 14. Love Remodeled: Lauren
Fit: [LRV (Light Reflectance Value) Explained](https://www.loveremodeled.com/light-reflectance-value/), Nov 3, 2025.

> Your LRV explainer is one of the clearer ones, and I have data that could extend it. Across Benjamin Moore, Behr, Sherwin-Williams and Dutch Boy, 116 of 225 current colors named "White" have a published LRV below 80, and the median color named gray sits at 40.6. Both are at paintcolorhq.com/paint-color-statistics with the method, if a link or a chart would help your readers.
>
> Philip Cameron, founder, Paint Color HQ

### 15. Porch Daydreamer: Tracey Amadio
Fit: [2027 Sherwin-Williams Paint Colors: The Best Colors + What I'd Skip](https://porchdaydreamer.com/2027-sherwin-williams-paint-colors/)

> You write about Sherwin-Williams colors in depth, so this may be useful: Sherwin-Williams has the darkest current palette of the four brands that publish LRV, at a median of 38.7 against 46 for Behr. Only 3.0% of its current colors reach LRV 80, and 48 of its 62 "Whites" fall below that line. The numbers are at paintcolorhq.com/paint-color-statistics if you want to cite them.
>
> Philip Cameron, founder, Paint Color HQ

### 16. PCI Magazine (Paint & Coatings Industry): editors
Fit: [Behr Names Its 2027 Color of the Year](https://www.pcimag.com/articles/115111-behr-names-its-2027-color-of-the-year), Aug 30, 2026.

> PCI covers each Color of the Year as it lands; we tracked how light they have been. The 11 Benjamin Moore, Behr and Sherwin-Williams picks for 2024 through 2027 average a published LRV of 25, against 46.6 for 2022 and 2023, and the study also measures how palettes crowd the color wheel across 23,801 verified colors. The method and a per-brand CSV are at paintcolorhq.com/paint-color-statistics.
>
> Philip Cameron, founder, Paint Color HQ

### 17. Builder: design desk (byline to confirm)
Fit: [Benjamin Moore Crowns 'Webster Green' Its 2027 Color of the Year](https://www.builderonline.com/design/interior-finish/benjamin-moore-crowns-webster-green-its-2027-color-of-the-year/)

> Webster Green, at a published LRV of 20.2, keeps a run going: every Benjamin Moore Color of the Year since 2023 has an LRV under 23. Across Benjamin Moore, Behr and Sherwin-Williams, the 2024 to 2027 picks average 25, against 46.6 for 2022 and 2023, which matters for builders choosing model-home colors. The table is at paintcolorhq.com/paint-color-statistics, free to cite.
>
> Philip Cameron, founder, Paint Color HQ

Check before sending: Benjamin Moore picks 2023 to 2027 are 22.7, 17, 19.7, 10.2 and 20.2.

### 18. Coatings World: David Savastano
Fit: [Behr selects Blank Canvas as its 2023 Color of the Year](https://www.coatingsworld.com/contents/view_online-exclusives/2022-12-06/behr-selects-blank-canvas-as-its-2023-color-of-the-year), Dec 6, 2022.

> You covered Behr's Blank Canvas for 2023; it turns out to mark the end of an era. At a published LRV of 84, it was followed by Cracked Pepper at 8, and Behr's picks have stayed at LRV 14 or below since. The Benjamin Moore, Behr and Sherwin-Williams picks for 2024 through 2027 average 25, and the full table is at paintcolorhq.com/paint-color-statistics.
>
> Philip Cameron, founder, Paint Color HQ

### 19. Kitchen & Bath Business: editors (byline to confirm)
Fit: [Behr Announces 2024 Color of the Year: Cracked Pepper](https://kbbonline.com/?p=93676)

> Cracked Pepper was a turning point in the numbers: at a published LRV of 8, it followed Behr's Blank Canvas at 84, and the Benjamin Moore, Behr and Sherwin-Williams picks since then average an LRV of 25. For kitchen and bath designers, we also found 51.6% of colors named "White" reflect less than 80% of light. Both are at paintcolorhq.com/paint-color-statistics with a downloadable table.
>
> Philip Cameron, founder, Paint Color HQ

### 20. The Nordroom: editor (byline to confirm)
Fit: [The 2027 Color of the Year Prediction: A Shift Toward More Expressive Colors?](https://www.thenordroom.com/2027-color-of-the-year/), Mar 15, 2026.

> Your March prediction asked whether 2027 would move toward more expressive color; the published LRVs show a mixed answer. Benjamin Moore's Webster Green (20.2) and Behr's Grounded (9) continue the dark run, while Sherwin-Williams' Celery (71.3) is the lightest pick from those three brands since 2023. The full 2022 to 2027 table is at paintcolorhq.com/paint-color-statistics if you revisit the piece.
>
> Philip Cameron, founder, Paint Color HQ
