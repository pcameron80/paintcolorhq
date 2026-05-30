# Pinterest Drip Schedule — Design

**Date:** 2026-05-30
**Status:** Approved (design), pending implementation plan
**Scope:** Curated Pinterest pin publishing on an unattended local schedule.

## Goal

Publish curated, Claude-verified Nano Banana pins to Pinterest on a steady
cadence **without a Claude Code window open and without the user present** —
while keeping the human/Claude quality gate on every pin.

## Core principle: split the pipeline where judgment is needed

> **Generation + verification needs Claude. Publishing does not.**

- **STOCK** (periodic, local, *with Claude*): generate Nano Banana room-scene
  pins, Claude reads and QAs every swatch against spec, user approves. Output:
  finished image files + an approved queue entry. This is unchanged from the
  workflow used on 2026-05-30 for the may26 batch.
- **DRIP** (continuous, local, *no Claude*): a scheduled job publishes the next
  N already-approved, unpublished pins on a cadence. Pure code — no judgment, no
  window. Runs on the user's always-on Mac via `launchd`.

The user stocks the shelf with Claude occasionally; the schedule empties it
automatically.

## Constraints

- Runs on the user's Mac, which is on ~24/7 but often unattended.
- Secrets (`GEMINI_API_KEY`, Pinterest OAuth tokens) stay in untracked
  `.env.local` — never committed, never sent to a cloud env.
- Pin images are local files in `~/Desktop/Pinterest pins/`.
- Nothing publishes that Claude + the user have not already reviewed.

## Out of scope (explicitly)

- **Blog post schedule** — separate subsystem, separate future spec. Same
  stock→drip shape will apply (draft + Claude reads/QAs + approve → scheduled
  publish), but blog "publish" is a git commit/deploy, so it needs its own design.
  That spec will include **Nano Banana hero/cover image generation** for each
  post, reusing the `gemini-3-pro-image` pipeline so one run produces both the
  blog hero image and a matching Pinterest pin.
- **The programmatic Vercel cron** (`/api/cron/pinterest-seed`) — stays OFF.
  Curated room-scenes are the brand's edge; plain `/api/pin` swatch pins would
  dilute the boards. Left intact in the codebase, simply not scheduled. May be
  revisited later if raw volume is wanted.
- **Auto-generation without Claude QA** — rejected. The whole value is the
  verification step, which needs a vision-capable agent.

## Architecture

```
STOCK (with Claude, periodic)              DRIP (launchd, 2×/day, unattended)
─────────────────────────────             ──────────────────────────────────
generate → Claude QA → approve            launchd timer (9am + 5pm ET)
        │                                          │
        ▼                                          ▼
  image file in IMAGE_DIR              drip.sh  → npx tsx pinterest-publish.ts --drip=1
  + queue entry (PinSpec)                        │
        │                                        ├─ load QUEUE (all approved batches)
        ▼                                        ├─ skip keys in published.json
   scripts/pinterest/queue.ts                    ├─ publish next 1 unpublished → Pinterest API
                                                 ├─ append to published.json
                                                 └─ if queue empty → notify user "stock more"
```

### Components

**1. Approved queue — `scripts/pinterest/queue.ts`**
- Aggregates every approved batch array (starting with `batch-may26.ts`) into a
  single ordered `QUEUE: PinSpec[]` in intended publish order.
- `PinSpec` gains:
  - a stable, globally-unique `key: string` (e.g. `"may26-01"`) for the
    published-state lookup;
  - a `theme: string` variety tag (e.g. `"navy"`, `"warm-white"`, `"sage"`,
    `"exterior"`, `"coty-2026"`, `"comparison"`) used by the variety rotation.
  - (`board` already exists.) Both `board` and `theme` are assigned by Claude at
    **stock** time when each batch is built — there is no auto-assignment.
- New batches are added as new files and concatenated here. The queue file is
  the single source of "what is approved to publish."

**2. Published-state log — `scripts/pinterest/published.json`**
- Global, keyed by `PinSpec.key`: `{ [key]: { pinId, publishedAt } }`.
- Migrated from the existing `published-may26.json` (all 10 may26 keys marked
  published, so the drip starts with nothing unpublished — correct, since the
  may26 batch is already live).
- Gitignored (runtime state; pin IDs, not secrets).

**3. Drip publisher — extend `scripts/pinterest-publish.ts`**
- New mode `--drip=N`: publish N unpublished pins selected by the **variety
  rotation** (below), append results, exit. Reuses the existing publish path
  (base64 upload, content-type sniff, 401→refresh, board→ID mapping).
- Existing `--only` / `--dry-run` retained for manual use and stock-time testing
  (`--dry-run --drip=N` shows what *would* be selected, in order).
- If 0 unpublished entries remain, publish nothing and emit the empty-queue
  signal (component 5).

**Variety rotation (selection logic).** Instead of walking the queue linearly,
each pick maximizes variety so the feed reads as human-curated:
1. Candidates = unpublished entries in `QUEUE`.
2. Read the `theme` and `board` of the most recent publishes from
   `published.json` (look back over the last `LOOKBACK = 3` publishes).
3. Prefer a candidate whose `theme` is NOT in that recent window; among those,
   prefer one whose `board` differs from the immediately previous publish.
4. Tie-break by `QUEUE` order (deterministic — same state always yields the same
   choice; no `Math.random`, which keeps the script resumable/testable).
5. If every remaining candidate repeats a recent theme (small queue), relax the
   theme constraint and fall back to queue order.
For `--drip=N>1`, each pick within the run also counts toward "recent" so a
single run won't post two of the same theme either.

**4. Schedule — `launchd` + wrapper**
- `scripts/pinterest/drip.sh`: `cd` to the repo, run
  `npx tsx scripts/pinterest-publish.ts --drip=1`, append stdout/stderr to
  `scripts/pinterest/drip.log`. Wrapper isolates PATH/node-resolution (nvm-safe
  by resolving an absolute node) so the launchd context Just Works.
- `scripts/pinterest/com.paintcolorhq.pinterest-drip.plist` (template): a
  `StartCalendarInterval` agent firing at **13:00 and 21:00 UTC** (9am + 5pm ET
  during EDT) → `--drip=1` twice/day = 2 pins/day. launchd runs missed
  invocations on wake after sleep.
  - Note: the plist uses UTC; EDT↔EST means the local clock time shifts by an
    hour across DST. Acceptable (pin timing is not precision-critical); documented.
- `scripts/pinterest/install-drip-schedule.sh`: renders the plist with the real
  repo path + username into `~/Library/LaunchAgents/`, then `launchctl load`s it.
  A matching `uninstall` path (`launchctl unload` + remove) for teardown.
  The generated plist lives in `~/Library/LaunchAgents/` (outside the repo); the
  committed artifact is the template + installer.

**5. Empty-queue signal**
- When `--drip` finds nothing unpublished, fire a macOS notification via
  `osascript -e 'display notification "Pinterest queue empty — stock more with Claude" with title "PaintColorHQ"'`
  and log it. Local, no email dependency. (Optional future: Gmail draft.)

## Data flow (one drip run)

1. launchd fires `drip.sh` at the scheduled time.
2. Wrapper runs `pinterest-publish.ts --drip=1`.
3. Script loads `QUEUE` + `published.json`, computes unpublished, and picks 1 via
   the variety rotation (different theme/board from the last few publishes).
4. Reads the local image, base64-encodes, `POST /v5/pins` (401→refresh→retry).
5. Appends `{key: {pinId, publishedAt}}` to `published.json`.
6. If nothing was unpublished, fires the empty-queue notification instead.

## Token handling

- `pinterest-publish.ts` already auto-refreshes on 401 and writes the new
  `PINTEREST_ACCESS_TOKEN` / `PINTEREST_REFRESH_TOKEN` back to `.env.local`. The
  launchd job runs as the user and can write `.env.local`, so refresh persists
  across runs. Pinterest refresh tokens are long-lived (~1 year); if refresh ever
  fails, the empty-queue-style notification surfaces the error and the user
  re-runs `pinterest-auth.ts`.

## Error handling

- Per-pin failures are caught and logged; the run continues / exits without
  corrupting `published.json` (only successful publishes are recorded).
- Missing image file → logged error, pin skipped, not marked published (so it
  retries next run).
- Token refresh failure → logged, surfaced via notification; no crash loop.
- `drip.log` (gitignored) is the audit trail.

## Verification / testing

- `--dry-run --drip=1` to confirm selection logic without posting.
- Manual `--drip=1` once to confirm a real publish + `published.json` append.
- `launchctl start` the agent once to confirm the scheduled path + wrapper PATH.
- Confirm empty-queue notification fires when the queue is exhausted.

## Open follow-ups (not blocking)

- Blog drip schedule (separate spec).
- Optional Gmail-draft delivery of the empty-queue / error signals.
- DST handling if precise local times ever matter (currently fixed UTC).
