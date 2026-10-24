#!/usr/bin/env bash
# launchd entry point for the weekly Supabase snapshot (scripts/backup-db-snapshot.ts).
#
# This file is a TEMPLATE: install-backup-schedule.sh renders it into
# ~/Library/Application Support/PaintColorHQ/backup/run.sh with real paths.
# The job runs from its own detached worktree (backup/checkout/), moved to the
# latest origin/main before each run, so it never runs unmerged code and never
# depends on the branch the main checkout is on. Snapshots live in backup/db/,
# outside every checkout.
set -uo pipefail
REPO="__REPO__"
WT="__WT__"
DIR="__DIR__"
BRANCH="__BRANCH__"
LOG="$DIR/logs/db-backup.log"
mkdir -p "$DIR/logs"

notify() {
  osascript -e "display notification \"$1\" with title \"PaintColorHQ backup\" sound name \"Basso\"" 2>/dev/null || true
}

{
  echo "=== db-backup $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  if git -C "$REPO" fetch -q origin "$BRANCH"; then
    git -C "$WT" checkout -q -f --detach "origin/$BRANCH" ||
      echo "warn: checkout of origin/$BRANCH failed; using $(git -C "$WT" rev-parse --short HEAD)"
  else
    echo "warn: git fetch failed; using the existing checkout ($(git -C "$WT" rev-parse --short HEAD))"
  fi
} >> "$LOG" 2>&1

if [[ ! -e "$WT/.env.local" || ! -e "$WT/node_modules" ]]; then
  echo "=== db-backup: $WT is missing .env.local or node_modules; re-run scripts/backup/install-backup-schedule.sh" >> "$LOG"
  notify "DB backup failed: checkout missing .env.local or node_modules"
  exit 1
fi

cd "$WT" || exit 1
# PCHQ_BACKUP_EXTRA_ARGS lets a manual run add --force-fail to test this notice.
# shellcheck disable=SC2086
NODE_NO_WARNINGS=1 PCHQ_BACKUP_DIR="$DIR/db" PCHQ_REPO="$REPO" \
  npx tsx scripts/backup-db-snapshot.ts --apply ${PCHQ_BACKUP_EXTRA_ARGS:-} >> "$LOG" 2>&1
status=$?
if (( status != 0 )); then
  echo "=== db-backup exited $status" >> "$LOG"
  notify "Weekly DB backup FAILED (exit $status). See backup/logs/db-backup.log"
else
  date -u +%Y-%m-%dT%H:%M:%SZ > "$DIR/last-success"
fi
exit "$status"
