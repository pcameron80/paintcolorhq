# Pinterest Drip Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish curated, pre-approved Pinterest pins on an unattended 2×/day schedule from the user's always-on Mac, selecting each pin by a variety rotation so the feed reads as human-curated.

**Architecture:** Generation + QA stay Claude-in-the-loop (unchanged). This plan builds only the *drip* half: a pure, tested selection layer (`queue.ts`), a `--drip` mode on the existing publisher, and a `launchd` job that runs it. State lives in a gitignored global `published.json`; secrets stay in `.env.local`.

**Tech Stack:** TypeScript run via `tsx`, Node built-in test runner (`node --import tsx --test`), Pinterest API v5 (already wrapped in `scripts/pinterest-publish.ts`), macOS `launchd`.

**Spec:** `docs/superpowers/specs/2026-05-30-pinterest-drip-schedule-design.md`

---

## File Structure

- `scripts/pinterest/batch-may26.ts` (MODIFY) — add `key`/`theme`/`format` to `PinSpec` + tag all 10 pins.
- `scripts/pinterest/queue.ts` (CREATE) — aggregate batches into `QUEUE`; pure selection functions (`unpublished`, `recentlyPublished`, `collisionScore`, `pickNext`, `selectForDrip`).
- `scripts/pinterest/queue.test.ts` (CREATE) — unit tests for the selection layer.
- `scripts/pinterest/published.json` (MIGRATE, gitignored) — global log keyed by `PinSpec.key`.
- `scripts/pinterest-publish.ts` (MODIFY) — operate on `QUEUE` + global log; add `--drip=N` (variety rotation) and empty-queue notification; `--only` now keys.
- `scripts/pinterest/drip.sh` (CREATE) — launchd wrapper: cd repo, run `--drip`, log.
- `scripts/pinterest/com.paintcolorhq.pinterest-drip.plist.template` (CREATE) — launchd schedule template.
- `scripts/pinterest/install-drip-schedule.sh` (CREATE) — render + load/unload the agent.
- `.gitignore` (MODIFY) — ignore `published*.json` + `drip.log`.
- `package.json` (MODIFY) — add `test:pinterest` script.

---

## Task 1: Extend PinSpec with key/theme/format and tag the may26 batch

**Files:**
- Modify: `scripts/pinterest/batch-may26.ts`

- [ ] **Step 1: Add the three fields to the `PinSpec` interface**

In `scripts/pinterest/batch-may26.ts`, add to the `interface PinSpec` (after `id`):

```ts
  /** Stable, globally-unique key across all batches (e.g. "may26-01"). */
  key: string;
  /** Variety axis — color/subject (e.g. "navy", "white", "sage"). */
  theme: string;
  /** Variety axis — scene/room type (e.g. "living-room", "kitchen", "exterior"). */
  format: string;
```

- [ ] **Step 2: Tag all 10 pins**

Add `key`, `theme`, `format` to each `BATCH` entry, using these exact values:

```
id 1  key "may26-01" theme "navy"        format "living-room"
id 2  key "may26-02" theme "warm-gray"   format "kitchen"
id 3  key "may26-03" theme "soft-black"  format "exterior"
id 4  key "may26-04" theme "white"       format "comparison"
id 5  key "may26-05" theme "sage"        format "bathroom"
id 6  key "may26-06" theme "navy"        format "kitchen"
id 7  key "may26-07" theme "pink"        format "nursery"
id 8  key "may26-08" theme "plum-brown"  format "dining-room"
id 9  key "may26-09" theme "green"       format "color-drench"
id 10 key "may26-10" theme "blue-green"  format "kitchen"
```

Example for entry 1 (place the fields right after `id: 1,`):

```ts
  {
    id: 1,
    key: "may26-01",
    theme: "navy",
    format: "living-room",
    name: "Hale Navy Living Room",
    // ...rest unchanged
```

- [ ] **Step 3: Verify it still type-checks and keys are unique**

Run:
```bash
npx tsx -e 'import { BATCH } from "./scripts/pinterest/batch-may26.ts"; const k=BATCH.map(p=>p.key); console.log("count",BATCH.length,"unique",new Set(k).size); console.log(BATCH.every(p=>p.theme&&p.format)?"all tagged":"MISSING TAG");'
```
Expected: `count 10 unique 10` and `all tagged`.

- [ ] **Step 4: Commit**

```bash
git add scripts/pinterest/batch-may26.ts
git commit -m "feat(pinterest): add key/theme/format variety tags to PinSpec + may26 batch"
```

---

## Task 2: Queue aggregation + variety selection (TDD)

**Files:**
- Create: `scripts/pinterest/queue.ts`
- Test: `scripts/pinterest/queue.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the test script to package.json**

In `package.json` `"scripts"`, add:
```json
    "test:pinterest": "node --import tsx --test scripts/pinterest/queue.test.ts",
```

- [ ] **Step 2: Write the failing test**

Create `scripts/pinterest/queue.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  unpublished,
  collisionScore,
  pickNext,
  selectForDrip,
  type PinSpec,
  type PublishedLog,
} from "./queue.ts";

// Minimal PinSpec stub — only the fields the selection layer reads.
function mk(key: string, theme: string, format: string, board: PinSpec["board"]): PinSpec {
  return { key, theme, format, board } as unknown as PinSpec;
}

const Q: PinSpec[] = [
  mk("a", "navy", "living-room", "Color Palettes"),
  mk("b", "navy", "kitchen", "Color Palettes"),
  mk("c", "sage", "bathroom", "Color Palettes"),
  mk("d", "white", "comparison", "Paint Color Guides"),
];

test("unpublished filters out keys present in the log", () => {
  const log: PublishedLog = { a: { pinId: "1", publishedAt: "2026-05-30T00:00:00Z" } };
  assert.deepEqual(unpublished(Q, log).map((p) => p.key), ["b", "c", "d"]);
});

test("collisionScore counts shared theme/format/board", () => {
  const recent = [mk("a", "navy", "living-room", "Color Palettes")];
  assert.equal(collisionScore(mk("x", "navy", "kitchen", "Color Palettes"), recent), 2); // theme+board
  assert.equal(collisionScore(mk("y", "white", "comparison", "Paint Color Guides"), recent), 0);
});

test("pickNext prefers lowest collision, tie-breaks by queue order", () => {
  const recent = [mk("a", "navy", "living-room", "Color Palettes")];
  // b collides (navy+board=2), c collides (board=1), d collides (0) -> pick d
  assert.equal(pickNext([Q[1], Q[2], Q[3]], recent)!.key, "d");
  // with no recent, all score 0 -> first in queue order
  assert.equal(pickNext([Q[1], Q[2], Q[3]], [])!.key, "b");
});

test("selectForDrip returns [] when everything is published", () => {
  const log: PublishedLog = Object.fromEntries(
    Q.map((p) => [p.key, { pinId: "x", publishedAt: "2026-05-30T00:00:00Z" }]),
  );
  assert.deepEqual(selectForDrip(Q, log, 2), []);
});

test("selectForDrip(N=2) does not pick two of the same theme back-to-back", () => {
  // Fresh log; a and b are both navy. Expect first pick a (queue order),
  // second pick should avoid navy -> c (sage), not b.
  const picks = selectForDrip(Q, {}, 2).map((p) => p.key);
  assert.equal(picks[0], "a");
  assert.notEqual(picks[1], "b");
  assert.equal(picks[1], "c");
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test:pinterest`
Expected: FAIL — `Cannot find module './queue.ts'` (file not created yet).

- [ ] **Step 4: Implement `queue.ts`**

Create `scripts/pinterest/queue.ts`:

```ts
// Aggregated, approved Pinterest pin queue + variety-rotation selection.
// Pure functions only — no I/O — so the drip logic is unit-testable.

import { BATCH as MAY26 } from "./batch-may26.ts";
export { BOARD_IDS, IMAGE_DIR } from "./batch-may26.ts";
export type { PinSpec, BoardName } from "./batch-may26.ts";
import type { PinSpec } from "./batch-may26.ts";

/** All approved batches, concatenated in intended publish order. */
export const QUEUE: PinSpec[] = [...MAY26];

export type PublishedLog = Record<string, { pinId: string; publishedAt: string }>;

export const LOOKBACK = 3;

/** Queue entries whose key is not yet in the published log, in queue order. */
export function unpublished(queue: PinSpec[], published: PublishedLog): PinSpec[] {
  return queue.filter((p) => !(p.key in published));
}

/** The most recently published specs (newest first), capped to `lookback`. */
export function recentlyPublished(
  queue: PinSpec[],
  published: PublishedLog,
  lookback: number,
): PinSpec[] {
  const byKey = new Map(queue.map((p) => [p.key, p]));
  return Object.entries(published)
    .filter(([key]) => byKey.has(key))
    .sort((a, b) => (a[1].publishedAt < b[1].publishedAt ? 1 : -1)) // newest first
    .slice(0, lookback)
    .map(([key]) => byKey.get(key)!);
}

/** How many of {theme, format, board} a candidate shares with the recent window. */
export function collisionScore(candidate: PinSpec, recent: PinSpec[]): number {
  const themes = new Set(recent.map((r) => r.theme));
  const formats = new Set(recent.map((r) => r.format));
  const boards = new Set(recent.map((r) => r.board));
  return (
    (themes.has(candidate.theme) ? 1 : 0) +
    (formats.has(candidate.format) ? 1 : 0) +
    (boards.has(candidate.board) ? 1 : 0)
  );
}

/** Lowest-collision candidate; ties keep the earliest (queue order). */
export function pickNext(candidates: PinSpec[], recent: PinSpec[]): PinSpec | null {
  if (candidates.length === 0) return null;
  let best = candidates[0];
  let bestScore = collisionScore(best, recent);
  for (const c of candidates.slice(1)) {
    const s = collisionScore(c, recent);
    if (s < bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}

/** Pick `count` unpublished pins via the variety rotation. */
export function selectForDrip(
  queue: PinSpec[],
  published: PublishedLog,
  count: number,
  lookback = LOOKBACK,
): PinSpec[] {
  const chosen: PinSpec[] = [];
  const prior = recentlyPublished(queue, published, lookback); // newest first
  let pool = unpublished(queue, published);
  for (let i = 0; i < count; i++) {
    // recent window = this run's picks (newest first) + prior, capped to lookback
    const window = [...chosen].reverse().concat(prior).slice(0, lookback);
    const next = pickNext(pool, window);
    if (!next) break;
    chosen.push(next);
    pool = pool.filter((p) => p.key !== next.key);
  }
  return chosen;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test:pinterest`
Expected: PASS — all 5 tests green.

- [ ] **Step 6: Commit**

```bash
git add scripts/pinterest/queue.ts scripts/pinterest/queue.test.ts package.json
git commit -m "feat(pinterest): queue aggregation + tested variety-rotation selection"
```

---

## Task 3: Migrate the published log to a global keyed file

**Files:**
- Create: `scripts/pinterest/published.json` (gitignored — generated, not committed)
- Modify: `.gitignore`

- [ ] **Step 1: Update .gitignore**

The current ignore pattern is `scripts/pinterest/published-*.json`, which does NOT match `published.json`. Replace that line (and add the log) so both are ignored:

```
# Pinterest runtime state (pin IDs + drip log; not secrets, but runtime-only)
scripts/pinterest/published*.json
scripts/pinterest/drip.log
```

- [ ] **Step 2: Migrate the existing log to keyed form**

Run (maps id `"1".."10"` → `"may26-01".."may26-10"`, preserving pinId/publishedAt):
```bash
cd /Users/philipcameron/Documents/GitHub/paintcolorhq
npx tsx -e '
import * as fs from "fs";
const dir = "scripts/pinterest";
const old = JSON.parse(fs.readFileSync(`${dir}/published-may26.json`, "utf8"));
const out: Record<string, unknown> = {};
for (const [id, v] of Object.entries(old)) out[`may26-${String(id).padStart(2, "0")}`] = v;
fs.writeFileSync(`${dir}/published.json`, JSON.stringify(out, null, 2) + "\n");
console.log("migrated keys:", Object.keys(out).join(", "));
'
```
Expected: `migrated keys: may26-01, may26-02, ... may26-10`.

- [ ] **Step 3: Verify the queue now reports zero unpublished**

Run:
```bash
npx tsx -e '
import { QUEUE, unpublished, type PublishedLog } from "./scripts/pinterest/queue.ts";
import * as fs from "fs";
const log: PublishedLog = JSON.parse(fs.readFileSync("scripts/pinterest/published.json","utf8"));
console.log("unpublished:", unpublished(QUEUE, log).length);
'
```
Expected: `unpublished: 0` (the may26 batch is fully live; the drip correctly starts empty until a new batch is stocked).

- [ ] **Step 4: Confirm both state files are gitignored**

Run: `git check-ignore scripts/pinterest/published.json scripts/pinterest/published-may26.json`
Expected: both paths echoed back.

- [ ] **Step 5: Commit the .gitignore change**

```bash
git add .gitignore
git commit -m "chore(pinterest): gitignore global published.json + drip.log"
```

---

## Task 4: Add `--drip` mode to the publisher (operate on the global queue)

**Files:**
- Modify: `scripts/pinterest-publish.ts`

- [ ] **Step 1: Repoint imports and the log path**

Replace the batch import line:
```ts
import { BATCH, BOARD_IDS, IMAGE_DIR, type PinSpec } from "./pinterest/batch-may26.ts";
```
with:
```ts
import {
  QUEUE,
  BOARD_IDS,
  IMAGE_DIR,
  selectForDrip,
  type PinSpec,
  type PublishedLog,
} from "./pinterest/queue.ts";
```

Change the log path constant:
```ts
const LOG_PATH = path.resolve(__dirname, "pinterest/published.json");
```

- [ ] **Step 2: Replace the CLI arg parsing block**

Replace the `--only` / `--dry-run` parsing with `--drip` support (keys, not ids):

```ts
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const dripArg = args.find((a) => a.startsWith("--drip="));
const DRIP = dripArg ? Math.max(1, parseInt(dripArg.replace("--drip=", ""), 10) || 1) : null;
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlyKeys = onlyArg ? new Set(onlyArg.replace("--only=", "").split(",")) : null;
```

- [ ] **Step 3: Type the log + use keys in the publish/skip logic**

Change `loadLog`'s return type to `PublishedLog`, and in `publishPin` key everything off `pin.key` instead of `pin.id`:

```ts
function loadLog(): PublishedLog {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, "utf8")); } catch { return {}; }
}
```
In `publishPin`, replace `log[pin.id]` lookups/writes with `log[pin.key]`, and the label with `` `#${pin.key} ${pin.name}` ``.

- [ ] **Step 4: Add the empty-queue notification helper**

Add near the top (after imports):
```ts
import { execFile } from "child_process";

function notify(message: string) {
  // macOS local notification — best-effort, never throws.
  execFile("osascript", ["-e", `display notification "${message.replace(/"/g, "'")}" with title "PaintColorHQ"`], () => {});
}
```

- [ ] **Step 5: Rewrite `main()` to support drip selection**

```ts
async function main() {
  const log = loadLog();
  let targets: PinSpec[];
  if (DRIP) {
    targets = selectForDrip(QUEUE, log, DRIP);
    if (targets.length === 0) {
      console.log("Drip: queue empty — nothing unpublished to post.");
      if (!DRY_RUN) notify("Pinterest queue empty — stock more with Claude.");
      return;
    }
  } else {
    targets = QUEUE.filter((p) => (onlyKeys ? onlyKeys.has(p.key) : true));
  }
  console.log(
    `${DRY_RUN ? "DRY RUN — " : ""}Publishing ${targets.length} pin(s)` +
      `${DRIP ? ` (drip, variety rotation)` : onlyKeys ? ` (--only=${[...onlyKeys].join(",")})` : ""}\n`,
  );
  for (const pin of targets) {
    try {
      await publishPin(pin, log);
    } catch (e) {
      console.error(`❌ ${pin.key} ${pin.name}: ${e instanceof Error ? e.message : e}`);
    }
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 2500));
  }
  console.log("\nDone.");
}
```

- [ ] **Step 6: Dry-run verify drip selection (queue currently empty)**

Run: `npx tsx scripts/pinterest-publish.ts --dry-run --drip=2`
Expected: `Drip: queue empty — nothing unpublished to post.` (correct — may26 is all published; no notification fires under `--dry-run`).

- [ ] **Step 7: Verify selection works against a stocked queue (temporary fixture)**

Temporarily remove one key from the log to simulate an unpublished pin, dry-run, then restore:
```bash
cp scripts/pinterest/published.json /tmp/pub.bak
npx tsx -e 'import * as fs from "fs";const p="scripts/pinterest/published.json";const d=JSON.parse(fs.readFileSync(p,"utf8"));delete d["may26-09"];fs.writeFileSync(p,JSON.stringify(d,null,2));'
npx tsx scripts/pinterest-publish.ts --dry-run --drip=1
cp /tmp/pub.bak scripts/pinterest/published.json
```
Expected: dry-run lists `#may26-09 Hidden Gem Mudroom` as the selected pin; log restored afterward.

- [ ] **Step 8: Commit**

```bash
git add scripts/pinterest-publish.ts
git commit -m "feat(pinterest): --drip variety mode on the global queue + empty-queue notify"
```

---

## Task 5: launchd wrapper script

**Files:**
- Create: `scripts/pinterest/drip.sh`

- [ ] **Step 1: Write the wrapper**

Create `scripts/pinterest/drip.sh`:
```bash
#!/usr/bin/env bash
# launchd entry point for the Pinterest drip. Resolves the repo root from its
# own location, then publishes one pin. Logs everything to drip.log.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
COUNT="${1:-1}"
echo "=== drip run $(date -u +%Y-%m-%dT%H:%M:%SZ) (count=$COUNT) ===" >> "$REPO/scripts/pinterest/drip.log"
npx tsx scripts/pinterest-publish.ts --drip="$COUNT" >> "$REPO/scripts/pinterest/drip.log" 2>&1
```

- [ ] **Step 2: Make it executable and smoke-test it**

Run:
```bash
chmod +x scripts/pinterest/drip.sh
./scripts/pinterest/drip.sh 1
tail -5 scripts/pinterest/drip.log
```
Expected: log shows the run header + `Drip: queue empty — nothing unpublished to post.` (queue is empty, so no live post — safe smoke test).

- [ ] **Step 3: Commit**

```bash
git add scripts/pinterest/drip.sh
git commit -m "feat(pinterest): launchd wrapper script for the drip"
```

---

## Task 6: launchd plist template + installer

**Files:**
- Create: `scripts/pinterest/com.paintcolorhq.pinterest-drip.plist.template`
- Create: `scripts/pinterest/install-drip-schedule.sh`

- [ ] **Step 1: Write the plist template**

Create `scripts/pinterest/com.paintcolorhq.pinterest-drip.plist.template`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>__LABEL__</string>
  <key>ProgramArguments</key>
  <array>
    <string>__DRIPSH__</string>
    <string>1</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>__NODE_DIR__:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
  </dict>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>13</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>21</integer><key>Minute</key><integer>0</integer></dict>
  </array>
  <key>StandardErrorPath</key><string>__REPO__/scripts/pinterest/drip.log</string>
  <key>RunAtLoad</key><false/>
</dict>
</plist>
```

- [ ] **Step 2: Write the installer**

Create `scripts/pinterest/install-drip-schedule.sh`:
```bash
#!/usr/bin/env bash
# Render the launchd plist with this machine's paths and (un)load it.
# Usage: ./install-drip-schedule.sh           # install
#        ./install-drip-schedule.sh uninstall # remove
set -euo pipefail
LABEL="com.paintcolorhq.pinterest-drip"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [[ "${1:-}" == "uninstall" ]]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Uninstalled $LABEL."
  exit 0
fi

DRIPSH="$REPO/scripts/pinterest/drip.sh"
NODE_DIR="$(dirname "$(command -v node)")"
chmod +x "$DRIPSH"
mkdir -p "$HOME/Library/LaunchAgents"
sed -e "s|__LABEL__|$LABEL|g" \
    -e "s|__DRIPSH__|$DRIPSH|g" \
    -e "s|__NODE_DIR__|$NODE_DIR|g" \
    -e "s|__REPO__|$REPO|g" \
    "$REPO/scripts/pinterest/com.paintcolorhq.pinterest-drip.plist.template" > "$PLIST"
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Installed $LABEL — drips 1 pin at 13:00 and 21:00 UTC (9am/5pm EDT)."
echo "Logs: $REPO/scripts/pinterest/drip.log"
echo "Uninstall: $DRIPSH ... -> ./scripts/pinterest/install-drip-schedule.sh uninstall"
```

- [ ] **Step 3: Make installer executable and commit (do NOT load yet — load is a verification step)**

```bash
chmod +x scripts/pinterest/install-drip-schedule.sh
git add scripts/pinterest/com.paintcolorhq.pinterest-drip.plist.template scripts/pinterest/install-drip-schedule.sh
git commit -m "feat(pinterest): launchd plist template + install/uninstall script"
```

---

## Task 7: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Install the launchd agent**

Run: `./scripts/pinterest/install-drip-schedule.sh`
Expected: "Installed com.paintcolorhq.pinterest-drip …".

- [ ] **Step 2: Confirm launchd registered it**

Run: `launchctl list | grep pinterest-drip`
Expected: a line containing `com.paintcolorhq.pinterest-drip`.

- [ ] **Step 3: Fire the scheduled job once via launchd (proves PATH/wrapper work)**

Run:
```bash
launchctl start com.paintcolorhq.pinterest-drip
sleep 5
tail -8 scripts/pinterest/drip.log
```
Expected: a fresh run header + `Drip: queue empty …` (queue empty = no live post; this proves launchd→wrapper→tsx→node all resolve correctly). Because the queue is empty, the empty-queue macOS notification should also appear.

- [ ] **Step 4: (Optional) live-publish rehearsal**

Only when a NEW approved batch has been stocked: `npx tsx scripts/pinterest-publish.ts --drip=1` should publish exactly one pin and append its key to `published.json`. Re-running should pick a *different* theme/format. Skip while the queue is empty.

- [ ] **Step 5: Final commit (docs/notes only, if any)**

No code change expected here; if verification surfaced a fix, commit it with a descriptive message.

---

## Notes / caveats (from spec)

- **DST:** plist fires at fixed UTC (13:00/21:00). During EST (winter) the local times shift to 8am/4pm. Acceptable; pin timing is not precision-critical.
- **Sleep:** launchd runs missed `StartCalendarInterval` jobs at next wake.
- **Token:** `pinterest-publish.ts` auto-refreshes on 401 and writes back to `.env.local`; the launchd job runs as the user, so refresh persists. If refresh fails, the run logs the error to `drip.log`.
- **Stocking:** the queue stays empty until a new curated batch is added to `queue.ts`. That is the Claude-in-the-loop generate→QA→approve step, out of scope for this plan.
