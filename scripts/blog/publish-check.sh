#!/usr/bin/env bash
# launchd entry point for the publish-day check (see publish-check.ts).
#
# This file is a TEMPLATE: install-publish-check.sh renders it into
# ~/Library/Application Support/PaintColorHQ/publish-check/run.sh with real
# paths. The job runs from its own detached worktree ("checkout/" in that
# folder), moved to the latest origin/main before every run, so it never
# depends on which branch the main checkout happens to be on.
set -uo pipefail
REPO="__REPO__"
WT="__WT__"
LOG="__DIR__/publish-check.log"
BRANCH="__BRANCH__"
{
  echo "=== run $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
  if git -C "$REPO" fetch -q origin "$BRANCH"; then
    git -C "$WT" checkout -q --detach "origin/$BRANCH"
  else
    echo "warn: git fetch failed; using the existing checkout ($(git -C "$WT" rev-parse --short HEAD))"
  fi
  cd "$WT" && npx tsx scripts/blog/publish-check.ts
} >> "$LOG" 2>&1
