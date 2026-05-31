#!/usr/bin/env bash
# Render the launchd plist with this machine's paths and (un)load it.
# Run this from the PERMANENT repo checkout (not a temporary worktree), since
# the launchd agent will reference whatever path this resolves to.
#
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
echo "Installed $LABEL — runs the daily multi-board mix once at 14:00 UTC (10am EDT)."
echo "Repo: $REPO"
echo "Logs: $REPO/scripts/pinterest/drip.log"
echo "Uninstall: ./scripts/pinterest/install-drip-schedule.sh uninstall"
echo ""
echo "REQUIRED ONE-TIME: grant Full Disk Access (System Settings → Privacy &"
echo "Security → Full Disk Access) to /bin/bash AND $(command -v node), or"
echo "scheduled runs fail with 'Operation not permitted' (repo is in ~/Documents,"
echo "images in ~/Desktop — both TCC-protected for background agents)."
