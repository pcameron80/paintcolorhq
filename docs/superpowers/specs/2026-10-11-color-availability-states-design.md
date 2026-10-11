# Color availability states

Status: draft for approval, 2026-10-11
Owner: palette-scan session (scripts/scan-brand-palettes.ts)

## Recommendation

Replace the single `is_archived` flag with three availability states, and fill
them only from evidence a brand or retailer publishes. Absence from a brand's
current palette changes nothing that users see. A color is removed from match
recommendations only when there is positive evidence that nobody can buy it.

## Why the current flag cannot be extended

`is_archived` (migration 006, June 2026) means two things at once:

1. The color appears on `/discontinued`.
2. The color is never recommended as a match (`compute-matches.ts` drops it
   as a target).

That was safe for the 244 rows it holds today: Sherwin-Williams' 220 historic
colors, 23 Farrow & Ball Archive colours and Behr Harbour QE-55. It breaks at
the scale the 2026-10-11 scan found:

- **Behr's own feed marks 2,549 colors archived**, of which 2,546 are active in
  our DB. That is 44% of our Behr catalog. But Behr "archived" does not mean
  unavailable: Harbour QE-55 is archived on behr.com and still tintable at Home
  Depot. Flagging all 2,546 would pull them out of every match list while
  people can still buy them.
- **"Not in the live palette" is weaker evidence still**: Valspar 762, Behr 572,
  Vista 103, Dutch Boy 101, Benjamin Moore 42, PPG 36. Kilz has about 714 rows
  with no live source at all. Some are discontinued; some, like Valspar's, look
  like an older palette that stores may still mix.
- **The two brands already flagged may also be mixable.** Farrow & Ball sells
  Archive colours to order. Sherwin-Williams' historic colors need a check.

So "the brand stopped showing it" and "you cannot buy it" have to be separate
states, because only the second should change match recommendations.

## The three states

| State | Meaning | Match target? | Shown on `/discontinued`? | Color page |
|---|---|---|---|---|
| **Current** | In the brand's current palette | Yes | No | No change |
| **Retired** | The brand has retired it from its palette, but it can still be mixed or ordered by code | Yes, labeled "Retired" | Yes, in a "Retired, still mixable" group | One factual line: retired by the brand, and how to still get it (for example, "Home Depot can tint it from code QE-55") |
| **Discontinued** | Positive evidence it cannot be bought | No | Yes, in a "Discontinued" group | One factual line plus the existing closest-match tables |

Rows absent from a brand's palette with no other evidence stay **Current**.
They are tracked internally (last date seen in the live feed) so a later scan
can confirm the pattern, but nothing about them changes on the site.

The page copy states only what the evidence supports. No invented retirement
dates, and no "discontinued" wording on a Retired color.

## Evidence rules

A state changes only with a recorded source:

- **Retired**: the brand's own feed or site marks it archived or retired
  (Behr's `archived` flag, Sherwin-Williams' `archived` flag, Farrow & Ball's
  Archive category), **and** a spot check confirms the brand's retailer can
  still mix or order it. One spot check per brand covers that brand's flag:
  10 random colors, all must pass.
- **Discontinued**: the brand or its retailer says the color cannot be made,
  for example a "no longer available" notice or a retailer that refuses the
  code. If a spot check for Retired fails, the failing colors go here and
  the brand's flag gets a second look.
- **Not listed**: recorded internally, no state change. If a color stays
  unlisted across two quarterly scans and a spot check shows it cannot be
  mixed, it moves to Discontinued.

Each row stores which source set its state and when, so any decision can be
traced and reversed.

## What it changes

**Data.** A new availability column, plus source and date columns. It is
backfilled from today's flag: the 244 archived rows start as Discontinued (no
behavior change) until their brand's spot check reclassifies them.
`is_archived` stays readable until the code moves over, then it is dropped.

**Scan.** `scan-palettes` already captures each brand's archived flag. It also
records "last seen live" for every row. A new apply step proposes state
changes as a dry run with counts, and applies them only after approval, the
same pattern as `apply-hex-corrections`.

**Matching.** Only Discontinued colors are excluded as targets. Retired
colors return to the match lists with a "Retired" label on the card. This
needs one more match recompute and a deploy.

**Pages.** The color page gets the one-line status above. `/discontinued`
gets two groups and brand-level pagination, since Behr alone would add about
2,500 entries. Hub title and meta change, so `seo-preflight` runs before
merge.

## Rollout

1. **Schema and code, no data change.** Ship the states with the 244 rows
   backfilled as Discontinued. The site behaves exactly as it does today.
2. **Spot checks.** Behr (Home Depot), Sherwin-Williams, Farrow & Ball. Each
   passing brand's flagged colors become Retired. Expected result: about
   2,500 Behr colors labeled Retired, and the 243 Sherwin-Williams and
   Farrow & Ball colors move from Discontinued to Retired, which puts them
   back in match lists.
3. **Recompute and deploy.** Match recompute (`TRUNCATE` path, with your OK),
   then a production deploy after a preview check.
4. **Quarterly.** Each scan proposes changes; nothing applies without
   approval.

Steps 1 and 2 are separate PRs so the spot-check results can be reviewed
before any color moves.

## Decisions needed from you

1. **Retired colors in match lists, labeled.** I recommend yes: they are
   buyable, and leaving them out hides valid answers.
2. **One `/discontinued` hub with two groups, or a separate `/retired` page.**
   I recommend one hub. People searching "discontinued" usually mean
   "retired"; a second page splits the same intent.
3. **Re-adding the 243 Sherwin-Williams and Farrow & Ball colors as match
   targets** if their spot checks pass. This changes existing match lists.
   I recommend yes, for the same reason as 1.

## Out of scope

- The Behr PPU11-07 duplicate and two other bogus rows (PR #199, owned by
  the BM LRV session).
- Behr same-code dual formats (`ppu11-7` vs `ppu11-07`), which belong to
  `dedupe-colors.ts`.
- Any row deletion. Unlisted colors keep their pages and URLs in every state.
