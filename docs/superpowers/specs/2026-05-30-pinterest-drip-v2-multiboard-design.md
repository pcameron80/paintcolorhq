# Pinterest Drip v2 — Multi-Board, Multi-Type — Design

**Date:** 2026-05-30
**Status:** Approved (design), pending implementation plan
**Extends:** `2026-05-30-pinterest-drip-schedule-design.md` (v1 — the launchd drip)

## Goal

Publish to **all four Pinterest boards** from **one local drip**, posting a daily
**mix of pin types** at a higher rate, with each type drawn from the right
source. Keep the human/Claude quality gate on *curated* content; let *programmatic*
content (swatches, guides) scale for free.

## What changes from v1

v1 drips one pool of curated, locally-generated room-scene pins via a single
variety rotation. v2 adds:

1. **Pin `type`** (swatch | palette | guide | comparison), each mapped to a board.
2. **Two image sources** — local files (curated) **and** `/api/pin*` URLs (programmatic).
3. **Per-type daily quotas** instead of one variety pool.
4. **Re-pin cooldown** so finite types cycle slowly without feeling repetitive.

## Types → boards → sources

| Type | Board (id) | Source | Image | Default cadence |
|---|---|---|---|---|
| **swatch** | Paint Colors (`...224`) | Color catalog, **GSC-prioritized** | `/api/pin` URL | 3 / day |
| **palette** | Color Palettes (`...225`) | Curated room scenes (existing batches) | local file | 1 / day |
| **guide** | Paint Color Guides (`...227`) | Blog posts (`getAllPosts`) | `/api/pin/blog` URL | 2 / week |
| **comparison** | Color Comparisons (`...226`) | Curated "Best X" pins | local file | 2 / week |

Boards now line up 1:1 with types. **Note:** existing comparison pins (Best Whites,
Best Greiges, Best Navy, Best Greens) currently sit on the *Paint Color Guides*
board — v2 **remaps them to Color Comparisons**, freeing Paint Color Guides for
blog/guide pins.

## Data model

`PinSpec` gains:
- `type: "swatch" | "palette" | "guide" | "comparison"`.
- `imageUrl?: string` — when present, publish via Pinterest `media_source`
  `source_type: "image_url"`; otherwise use the existing local-file `image_base64`
  path. (Curated pins keep `image`; programmatic pins set `imageUrl`.)

`board` stays explicit but must match the type's board (a sanity check can assert this).

## Sources

**Curated (local files)** — the existing `batch-may26.ts` / `batch-jun-restock*.ts`.
Each existing pin gains a `type` (`palette` for room scenes, `comparison` for the
"Best X" pins) and comparison pins' `board` switches to Color Comparisons.

**Swatch (programmatic)** — `scripts/pinterest/sources/swatches.ts` builds swatch
PinSpecs from a **priority color list**: reuse + expand `pinterest-queue.ts`
`TIER1_COLORS` (colors already earning GSC impressions), then widen to popular
colors. Each: `imageUrl = /api/pin?hex&name&brand&code&lrv&family`,
`link = /colors/<brand>/<slug>`, `key = swatch-<brand>-<slug>`, `board = Paint Colors`.
Color data (hex/lrv/family) pulled from the DB at build time, like the restock.

**Guide (programmatic)** — `scripts/pinterest/sources/guides.ts` builds guide
PinSpecs from `getAllPosts()` (skipping `noindex`): `imageUrl = /api/pin/blog?...`
(or the post's `pinImage`/cover), `link = /blog/<slug>`, `key = guide-<slug>`,
`board = Paint Color Guides`.

**Comparison** — curated only for now (the existing "Best X" pins). *Deferred:*
programmatic comparison pins from cross-brand **match pages** (needs a 2-color pin
image endpoint) — would give this board real scale later.

`QUEUE` = curated batches + swatch source + guide source, all typed.

## Selection: per-type quota + cooldown

Replace `selectForDrip` with `selectDailyMix(queue, published, quotas, cooldownDays)`:

1. Determine the day's `quotas` (per type) — see Cadence.
2. For each type with quota N:
   - `fresh` = queue pins of that type not in `published`.
   - If `fresh.length >= N`: take N via the existing variety rotation (within type).
   - Else: take all fresh, then fill the remainder by **re-pinning** the
     least-recently-published pins of that type whose last `publishedAt` is older
     than `cooldownDays` (default **35**). If none qualify, post fewer (and log it).
3. Swatches never need re-pin (23K pool); guides/palettes/comparisons cycle via cooldown.

Re-pinning updates `publishedAt` (and the Pinterest pin id) in `published.json`.
Deterministic; no RNG.

## Cadence (launchd)

A single daily `launchd` run invokes `--daily`. The script computes the day's
quota by weekday from a config block, e.g.:

```
every day:         swatch 3, palette 1
Mon, Thu:          + guide 1        (→ 2 guides/week)
Wed, Sat:          + comparison 1   (→ 2 comparisons/week)
```

≈ 4–6 pins/day. All quotas live in one config object for easy tuning (the user is
not strict on exact numbers). Weekday comes from the run date (`new Date()` — fine
in a tsx script). Spacing between posts within a run keeps clear of rate limits.

## Publisher changes

- `media_source`: if `pin.imageUrl` → `{ source_type: "image_url", url }`; else the
  existing local base64 path.
- `--daily` mode: compute quotas → `selectDailyMix` → publish, with cooldown-aware
  logging. Keep `--drip=N` / `--only` / `--dry-run` for manual use.

## Out of scope

- **Programmatic match-page comparison pins** (new 2-color endpoint) — follow-up.
- **Blog *creation* pipeline** — generating new posts is a separate subsystem; v2
  only *pins* existing blogs and auto-includes new ones as they're written.
- Polishing the `/api/pin` swatch design (RGB/undertone/CTA) — optional later.

## Verification

- Unit tests (node:test) for `selectDailyMix`: quota fill, cooldown re-pin
  eligibility, fresh-before-repin ordering, swatch-never-repeats.
- `--dry-run --daily` shows the day's selected mix per board.
- Confirm swatch/guide pins publish via `image_url` against a single live test pin
  on each board before enabling the schedule.
- Board-matches-type assertion across the whole queue.

## Migration / sequencing

1. Add `type` to existing batch pins; remap comparison pins to Color Comparisons.
2. Build swatch + guide sources; aggregate into `QUEUE`.
3. Add `selectDailyMix` + cooldown (TDD).
4. Add `image_url` support + `--daily` to the publisher.
5. New launchd plist/quotas (replaces the v1 `--drip=1`×2 schedule).
6. Test live: one swatch + one guide pin, then enable.
