# Pinterest drip — runbook

Unattended daily posting to @paintcolorhq. A **launchd** agent runs `drip.sh`
once/day at 10:00 EDT, which calls `pinterest-publish.ts --daily`. That picks the
day's mix via `selectDailyMix` (per-type quotas in `DRIP_CONFIG`, queue.ts) and
posts to the matching board. The live job reads this **working tree**, so changes
take effect on the next run once they're on the checked-out branch.

## Pin types — what each one IS (don't conflate these)

| Type | Look | Source | Board | Image |
|---|---|---|---|---|
| **swatch** | Single color card | `swatch-colors.json` (← `build-swatch-colors.ts` ← `swatch-seeds.json`) | Paint Colors | programmatic `/api/pin` |
| **palette** | **Styled photoreal ROOM SCENE** (a real painted room + a swatch-data overlay) | curated `batch-*.ts` (Gemini images) | Color Palettes | **local PNG** in IMAGE_DIR |
| **guide** | Blog post cover | `sources/guides.ts` (auto, every indexable post) | Paint Color Guides | programmatic `/api/pin/blog` |
| **comparison** | Two colors side by side | curated `batch-*.ts` (Gemini) | Color Comparisons | local PNG |

> ⚠️ **"palette" / "scheme" pins = styled room scenes** (the Gemini batches), **NOT**
> the 5-bar swatch-stack cards. There *is* a `sources/palettes.ts` → `/api/pin/palette`
> programmatic 5-bar generator, but it is **intentionally NOT wired into QUEUE** —
> it was a misread of "multiple colors" and Philip doesn't want those. Kept only for
> possible future re-enable.

## Daily quota (`DRIP_CONFIG` in queue.ts)

`daily: swatch 2 + palette 1`, plus weekday extras: `guide` Mon/Thu, `comparison`
Wed/Sat. So every day carries a styled room-scene palette; swatches are the backbone.
`selectDailyMix` fills each type from **fresh** stock first, then **re-pins** the
oldest published pin once it's past the **35-day cooldown** — so the drip never goes
silent, but recycles only old content.

## Restocking a lane — the SOP

**swatch (cheap, data-only):** append demand-ranked `{brandSlug, slug}` to
`swatch-seeds.json` → `npx tsx scripts/pinterest/build-swatch-colors.ts` → commit
the regenerated `swatch-colors.json`. (Demand data: GA4 top `/colors/` pages, all
channels — Google color pages are HCU-suppressed.)

**palette / comparison (room scenes — Gemini, the bottleneck):**
1. **Lock the style first.** For any new look, generate ONE sample and confirm it's
   right *before* the batch. A wrong sample costs cents; a wrong batch costs an hour.
2. **DB-verify colors.** `getColorBySlug` for exact `hex/rgb/lrv/undertone` — the
   overlay swatch must match the DB (a wrong swatch caches on Pinterest **forever**).
3. **Write `batch-<name>.ts`** — `C` color constants + one PinSpec per scene using
   `buildPrompt(sceneText, [C.main, C.support])` (folds in the anti-Gemini-quirk
   rendering rules). `board: "Color Palettes"`, `image: "<Name>.png"`, link to the
   main color's `/colors/{brand}/{slug}`.
4. **Wire into `queue.ts`** — `import { BATCH as X }` + `...typed(X)` in QUEUE.
5. **Generate:** `npx tsx scripts/pinterest-generate.ts --only=<key>` for one, then
   the rest. `gemini-3-pro-image` @ 2:3, ~$0.04/img, saves to IMAGE_DIR (Desktop).
6. **QA EVERY image** — open each PNG and verify the swatch HEX/RGB/LRV against the
   DB and that the scene is on-brief. Regenerate failures: `--only=<key> --force`.
7. **Preview** (below) and eyeball the upcoming feed.
8. **Commit** `batch-*.ts` + `queue.ts`. **Images stay on the Desktop — NOT git.**

## Preview before it goes live

```
npx tsx scripts/pinterest-preview.ts --days=7      # or --days=14
open scripts/pinterest/preview.html
```

Forward-simulates the real `selectDailyMix` for the next N days and renders a contact
sheet of the **actual pins** (local room-scene PNGs + live `/api/pin` thumbnails) with
a type tally at the top. Use it to catch a wrong style / wrong mix / wrong type
**before** it posts — instead of discovering it on the live feed days later. (Playwright
can't load `file://`; open it in a real browser.)

## Config invariants (guarded by queue.test.ts)

- **`drip.sh` must call `--daily`**, never the v1 `--drip=` path (v1 has no type
  quota → the feed collapses to whatever lane is largest). 
- **The plist must have ONE `StartCalendarInterval` slot**, never an `<array>` —
  `--daily` posts the whole day's quota per run, so multiple slots = overpost.
- Keep them in sync: **`--daily` ⇔ single launchd slot.** A silent revert here once
  collapsed the feed to guides for a week; `npm run test:pinterest` now fails if it
  recurs.

## Key files

- `queue.ts` — QUEUE assembly + `selectDailyMix`/`DRIP_CONFIG` (pure, unit-tested)
- `drip.sh` + `*.plist.template` + `install-drip-schedule.sh` — the launchd agent
- `pinterest-publish.ts` — `--daily` (drip), `--dry-run`, `--only=`
- `pinterest-generate.ts` — Gemini image gen (`--only=`, `--force`)
- `pinterest-preview.ts` — the N-day contact-sheet preview
- `published.json` — **load-bearing** global publish log (gitignored); deleting it
  re-posts everything
- TCC: launchd needs Full Disk Access on `/bin/bash` AND node to read `~/Documents`
  (repo) + `~/Desktop` (images), else runs exit "Operation not permitted".
