# Color of the Year newsjacking kit

When a paint brand names its next Color of the Year, the story has a short shelf
life: the first "here is the closest match in every brand" page to rank captures
the search and AI-citation traffic. This kit lets that page ship the **same day**
the color drops.

The moat is the dataset. A brand announces one hex; we already hold 26,000+
colors across 13 brands and the CIEDE2000 machinery to place that hex against all
of them. No competitor can answer "what's the Behr version of Sherwin-Williams'
new color?" faster than we can.

- **Generator:** `npm run coty -- --hex <HEX> --name "<Name>" --brand "<Brand>" [--number "<Code>"]`
  (script: `scripts/blog/coty-match.ts`)
- **Precedent post:** [/blog/2026-colors-of-the-year-every-brand-compared](https://www.paintcolorhq.com/blog/2026-colors-of-the-year-every-brand-compared)
  (an all-brands roundup — the per-brand pages this kit produces feed and link to it).

---

## Announcement calendar

Announcements cluster **late July through mid-October**, with Pantone (design
context, not a paint match target) landing in early December. The dates below are
the verified 2026-cycle announcements (made during 2025); treat them as the
window each brand tends to hit and **verify each season** — brands shift dates by
a few weeks year to year.

| Brand | Typical window | 2026-cycle date | 2026 color | Where it's announced |
|---|---|---|---|---|
| Behr | Late July | Jul 30, 2025 | Hidden Gem (N430-6A) | [behr.com/colorfullybehr](https://www.behr.com/colorfullybehr/) · [Home Depot newsroom](https://corporate.homedepot.com/news) |
| Valspar | Early August | Aug 7, 2025 | Warm Eucalyptus (8004-28F) | [valspar.com/colors/color-of-the-year](https://www.valspar.com/en/colors/color-of-the-year-2026) · PR Newswire |
| Dutch Boy | Mid August | Aug 19, 2025 | Melodious Ivory (313-2DB) | [dutchboy.com/press-room](https://www.dutchboy.com/en/press-room) |
| Sherwin-Williams | Late September | Sep 24, 2025 | Universal Khaki (SW 6150) | [sherwin-williams.com/color-of-the-year](https://www.sherwin-williams.com/en-us/color/color-of-the-year) |
| PPG | Early October | Oct 2, 2025 | Secret Safari (PPG1110-4) | [news.ppg.com](https://news.ppg.com) · [ppgpaints.com/coty](https://www.ppgpaints.com) |
| Dunn-Edwards | Early–mid October | Oct 9, 2025 | Midnight Garden (DE5657) | [dunnedwards.com/color-of-the-year](https://www.dunnedwards.com/colors/color-of-the-year/) |
| Benjamin Moore | Mid October | Oct 14, 2025 | Silhouette (AF-655) | [benjaminmoore.com/color-of-the-year](https://www.benjaminmoore.com/en-us/paint-colors/color-of-the-year) |
| Pantone (context only) | Early December | Dec 4, 2025 | Cloud Dancer | [pantone.com/color-of-the-year](https://www.pantone.com/color-of-the-year) |

**Farrow & Ball is the exception.** It does not name a single Color of the Year.
It releases a curated set of new colours (nine for 2026) plus a trend point of
view from its Colour Curator, usually in **September**. Only run the generator
against an F&B shade if it names a specific hero color; otherwise treat F&B as a
palette drop, not a match target. Watch [farrow-ball.com/new-colours](https://www.farrow-ball.com/collection/new-colours).

**Watch list for the 2027 cycle:** expect the same windows shifted into 2026 —
Behr around late July 2026, Valspar early August, Dutch Boy mid August, then SW /
PPG / Dunn-Edwards / Benjamin Moore across late September into October. Set a
reminder to check each brand's newsroom page weekly from mid-July on.

---

## Same-day runbook

The moment a brand posts its color, you need three facts from the press release:
the **name**, the **color code**, and the **hex**. If the release gives RGB but
not hex, convert it; if it gives neither, pull the hex from the color's own page
on the brand site.

1. **Generate the match table.**
   ```bash
   npm run coty -- --hex B8A992 --name "Universal Khaki" --brand "Sherwin-Williams" --number "SW 6150"
   ```
   (Hex works with or without `#`. `--number` is optional. The brand can be its
   name or slug.) The script prints three things: a ranked terminal table (sanity
   check the ΔE values look right — the announcing brand is skipped, every other
   brand gets its single closest color), a ready-to-paste JSX block, and this
   checklist.

2. **Create the blog post.** Add a new entry to `src/lib/blog-posts.tsx`:
   - `date`: **today** (a post dated today publishes immediately; future dates
     stay hidden until that day — see the blog-publish rules).
   - `author`: `"Philip Cameron"`.
   - Paste the generated JSX into `content()`. It already uses the `Swatch`
     component and the house table classes.
   - Fill `title`, `excerpt`, `tags`, and the **`faq`** field — the FAQ items emit
     FAQPage JSON-LD, which is what AI engines extract. Good FAQ questions here:
     "What is the closest [Brand] match to [Name]?", "What is the hex code for
     [Name]?", "What undertone does [Name] have?"
   - If the announced color already has a Paint Color HQ page, add its href to the
     reference row in the pasted table (the generator leaves it blank because a
     brand-new color usually has no page yet).
   - Link the post to and from [the all-brands roundup](https://www.paintcolorhq.com/blog/2026-colors-of-the-year-every-brand-compared).

3. **PR through the preview gate.** Open a PR, run `seo-preflight` and `seo-drift`
   (the pre-deploy gate for content/meta/schema changes), review the Vercel
   preview, then merge to `main`.

4. **Submit to IndexNow** (notifies Bing — our strongest channel — and Yandex).
   Preferred wrapper:
   ```bash
   npm run indexnow-blog -- --slug=<your-post-slug>
   ```
   Raw curl fallback (key hosted at `public/a28e7cd07d004d4b94cfcd6bc2129bda.txt`):
   ```bash
   curl -X POST "https://api.indexnow.org/indexnow" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d '{"host":"www.paintcolorhq.com","key":"a28e7cd07d004d4b94cfcd6bc2129bda","keyLocation":"https://www.paintcolorhq.com/a28e7cd07d004d4b94cfcd6bc2129bda.txt","urlList":["https://www.paintcolorhq.com/blog/<your-post-slug>"]}'
   ```

5. **Request indexing in Google Search Console.** Open the GSC UI → URL
   Inspection → paste the new URL → Request Indexing. (This is manual; the MCP
   token is read-only.)

6. **Add an llms.txt line** if the brand is a major one (SW, BM, Behr, PPG,
   Valspar, Dunn-Edwards, Dutch Boy). Under `## Common Questions This Site
   Answers` in `public/llms.txt`, add:
   ```
   - What is the [Brand] [year] Color of the Year? → [Name] [Code] — hex [HEX], closest cross-brand match [Match] ([Match brand]).
   ```
   The generator's checklist prints this line pre-filled.

7. **Pin it on Pinterest** via the existing drip (see the Pinterest automation
   pipeline in project memory). Cross-posting to Instagram and Facebook rides the
   same shared queue.

---

## Rules

- Plain English. No hype, no manufactured urgency. The story is the data, not
  adjectives.
- Delta E in the reader-facing table is paired with a plain-language label
  ("Nearly identical" / "Very similar" / "Visible difference"), the same
  convention as the color pages — the number alone is never the headline.
- Always tell the reader to confirm with a physical sample: formulas, sheens, and
  bases differ between brands even when the color target matches.
- Never publish a match you haven't eyeballed in the terminal table first. A bad
  hex in, or a color the brand later corrects, means a wrong table out.
