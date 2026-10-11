#!/usr/bin/env bash
# launchd entry point for the social jobs (Pinterest/Facebook/Instagram drips,
# Pinterest weekly analytics).
#
# This file is a TEMPLATE: install-schedules.sh renders it into
# ~/Library/Application Support/PaintColorHQ/social/run.sh with real paths.
# Every job runs from one detached worktree ("checkout/" in that folder), moved
# to the latest origin/main before each run, so the jobs never depend on which
# branch the main checkout happens to be on and never run unmerged code.
# The ledgers they write live beside it (see scripts/social/ledger.ts), not in
# the worktree, so the reset below cannot discard them.
#
# Usage (from the plist): run.sh <job-name> <script path relative to the repo>
set -uo pipefail
REPO="__REPO__"
WT="__WT__"
DIR="__DIR__"
BRANCH="__BRANCH__"
JOB="${1:?job name}"
SCRIPT="${2:?script path}"
LOG="$DIR/logs/$JOB.log"
LOCK="$DIR/run.lock"
export PCHQ_SOCIAL_STATE_DIR="$DIR"
mkdir -p "$DIR/logs"

notify() {
  osascript -e "display notification \"$1\" with title \"PaintColorHQ\"" 2>/dev/null || true
}

# The jobs share one worktree, so take a lock before moving it: a checkout under
# a job that is still running would swap its code mid-run. Schedules are hours
# apart, so waiting is the rare case; a lock whose owner is gone is stale.
waited=0
until mkdir "$LOCK" 2>/dev/null; do
  owner="$(cat "$LOCK/pid" 2>/dev/null || true)"
  if [[ -n "$owner" ]] && ! kill -0 "$owner" 2>/dev/null; then
    rm -rf "$LOCK"
    continue
  fi
  if (( waited >= 1800 )); then
    echo "=== $JOB $(date -u +%Y-%m-%dT%H:%M:%SZ): gave up after 30 min waiting for $LOCK (pid ${owner:-?})" >> "$LOG"
    notify "$JOB skipped: another social job held the lock for 30 min"
    exit 1
  fi
  sleep 10
  waited=$((waited + 10))
done
echo $$ > "$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT

{
  if git -C "$REPO" fetch -q origin "$BRANCH"; then
    # -f: this worktree belongs to the jobs; any local edit in it is stray.
    git -C "$WT" checkout -q -f --detach "origin/$BRANCH" ||
      echo "warn: checkout of origin/$BRANCH failed; using $(git -C "$WT" rev-parse --short HEAD)"
  else
    echo "warn: git fetch failed; using the existing checkout ($(git -C "$WT" rev-parse --short HEAD))"
  fi
} >> "$LOG" 2>&1

if [[ ! -e "$WT/.env.local" || ! -e "$WT/node_modules" ]]; then
  echo "=== $JOB: $WT is missing .env.local or node_modules; re-run scripts/social/install-schedules.sh" >> "$LOG"
  notify "$JOB failed: checkout missing .env.local or node_modules"
  exit 1
fi
if [[ ! -f "$WT/$SCRIPT" ]]; then
  echo "=== $JOB: $SCRIPT not found at $(git -C "$WT" rev-parse --short HEAD)" >> "$LOG"
  notify "$JOB failed: $SCRIPT not found on origin/$BRANCH"
  exit 1
fi

/bin/bash "$WT/$SCRIPT" >> "$LOG" 2>&1
status=$?
if (( status != 0 )); then
  echo "=== $JOB exited $status" >> "$LOG"
  notify "$JOB failed (exit $status); see logs/$JOB.log"
fi
exit "$status"
