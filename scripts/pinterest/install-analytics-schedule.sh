#!/usr/bin/env bash
# Render + (un)load the weekly Pinterest analytics-by-type launchd agent.
# Run from the PERMANENT repo checkout (the agent references this path).
#
# Usage: ./install-analytics-schedule.sh           # install
#        ./install-analytics-schedule.sh uninstall # remove
set -euo pipefail
LABEL="com.paintcolorhq.pinterest-analytics"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [[ "${1:-}" == "uninstall" ]]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Uninstalled $LABEL."
  exit 0
fi

REPORTSH="$REPO/scripts/pinterest/analytics-report.sh"
NODE_DIR="$(dirname "$(command -v node)")"
chmod +x "$REPORTSH"
mkdir -p "$HOME/Library/LaunchAgents"
sed -e "s|__LABEL__|$LABEL|g" \
    -e "s|__REPORTSH__|$REPORTSH|g" \
    -e "s|__NODE_DIR__|$NODE_DIR|g" \
    -e "s|__REPO__|$REPO|g" \
    "$REPO/scripts/pinterest/com.paintcolorhq.pinterest-analytics.plist.template" > "$PLIST"
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Installed $LABEL — runs the reach-by-type report every Monday 09:00 LOCAL."
echo "Reports: $REPO/scripts/pinterest/reports/<date>.txt (+ latest.txt); log: analytics.log"
echo "Uses the SAME Full Disk Access grant as the drip (/bin/bash + node) — no new grant needed."
echo "Email: set RESEND_API_KEY (and optional REPORT_EMAIL_TO) in .env.local to enable the email leg;"
echo "       until then it writes the report file + a macOS notification."
echo "Uninstall: ./scripts/pinterest/install-analytics-schedule.sh uninstall"
