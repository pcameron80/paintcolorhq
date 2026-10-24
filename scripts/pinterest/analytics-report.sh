#!/usr/bin/env bash
# Weekly Pinterest reach-by-type report job.
# Runs the analytics for the last 7 days, writes a dated report file + a
# `latest` copy, fires a macOS notification, and (via --email) emails it
# through Resend IF RESEND_API_KEY is set in .env.local.
#
# Fails loudly: the report files are written only when the output has its
# TOTAL line. Otherwise (the 2026-10-19 run swallowed a failure and wrote a
# 1-byte latest.txt) it logs, notifies and exits 1, leaving the last good
# latest.txt in place, and run-job.sh records the failure.
#
# launchd runs this through scripts/social/run-job.sh, from a detached worktree
# of the latest origin/main. Reports and log go to the shared state folder
# (pinterest-reports/, logs/pinterest-analytics.log).
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
STATE="${PCHQ_SOCIAL_STATE_DIR:-$HOME/Library/Application Support/PaintColorHQ/social}"
REPORTS="$STATE/pinterest-reports"
mkdir -p "$REPORTS" "$STATE/logs"
STAMP="$(date +%Y-%m-%d)"
LOG="$STATE/logs/pinterest-analytics.log"
# Override only to test the failure path.
REPORT_CMD="${PCHQ_ANALYTICS_CMD:-npx tsx scripts/pinterest/analytics-by-type.ts --days=7 --email}"

notify() {
  osascript -e "display notification \"${1//\"/\'}\" with title \"PaintColorHQ: Pinterest weekly\"" 2>/dev/null || true
}

echo "=== analytics run $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >> "$LOG"
# Capture the report; --email sends via Resend when a key exists (else no-op).
STATUS=0
RAW="$($REPORT_CMD 2>>"$LOG")" || STATUS=$?
REPORT="$(printf '%s\n' "$RAW" | grep -v 'injecting env' || true)"
echo "$REPORT" >> "$LOG"

SUMMARY="$(printf '%s\n' "$REPORT" | grep '^TOTAL' || true)"
if [[ -z "$SUMMARY" ]]; then
  echo "FAILED: report had no TOTAL line (exit $STATUS); latest.txt left unchanged." >> "$LOG"
  notify "Report FAILED (exit $STATUS). See logs/pinterest-analytics.log"
  exit 1
fi

echo "$REPORT" | tee "$REPORTS/$STAMP.txt" > "$REPORTS/latest.txt"
# macOS banner so it surfaces even if email isn't wired up.
notify "$SUMMARY"
# The table is saved, but a failed email still fails the job so it gets noticed.
if [[ $STATUS -ne 0 ]]; then
  echo "FAILED: report saved, but the command exited $STATUS (email failure?)." >> "$LOG"
  exit "$STATUS"
fi
