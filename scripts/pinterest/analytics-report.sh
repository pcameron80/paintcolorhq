#!/usr/bin/env bash
# launchd entry point for the weekly Pinterest reach-by-type report.
# Runs the analytics for the last 7 days, writes a dated report file + a
# `latest` copy, fires a macOS notification, and (via --email) emails it
# through Resend IF RESEND_API_KEY is set in .env.local. Logs to analytics.log.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
DIR="$REPO/scripts/pinterest"
mkdir -p "$DIR/reports"
STAMP="$(date +%Y-%m-%d)"
LOG="$DIR/analytics.log"

echo "=== analytics run $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >> "$LOG"
# Capture the report; --email sends via Resend when a key exists (else no-op).
REPORT="$(npx tsx scripts/pinterest/analytics-by-type.ts --days=7 --email 2>>"$LOG" | grep -v 'injecting env' || true)"
echo "$REPORT" | tee "$DIR/reports/$STAMP.txt" > "$DIR/reports/latest.txt"
echo "$REPORT" >> "$LOG"

# macOS banner so it surfaces even if email isn't wired up.
SUMMARY="$(echo "$REPORT" | grep '^TOTAL' || echo 'report ready')"
osascript -e "display notification \"${SUMMARY//\"/\'}\" with title \"PaintColorHQ — Pinterest weekly\"" 2>/dev/null || true
