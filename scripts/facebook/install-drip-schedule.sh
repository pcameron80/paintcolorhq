#!/usr/bin/env bash
# Render the launchd plist with this machine's paths and (un)load it.
# Run this from the PERMANENT repo checkout (not a temporary worktree), since
# the launchd agent will reference whatever path this resolves to.
#
# Usage: ./install-drip-schedule.sh           # install
#        ./install-drip-schedule.sh uninstall # remove
set -euo pipefail
LABEL="com.paintcolorhq.facebook-drip"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [[ "${1:-}" == "uninstall" ]]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Uninstalled $LABEL."
  exit 0
fi

DRIPSH="$REPO/scripts/facebook/drip.sh"
NODE_DIR="$(dirname "$(command -v node)")"
chmod +x "$DRIPSH"
mkdir -p "$HOME/Library/LaunchAgents"
sed -e "s|__LABEL__|$LABEL|g" \
    -e "s|__DRIPSH__|$DRIPSH|g" \
    -e "s|__NODE_DIR__|$NODE_DIR|g" \
    -e "s|__REPO__|$REPO|g" \
    "$REPO/scripts/facebook/com.paintcolorhq.facebook-drip.plist.template" > "$PLIST"
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Installed $LABEL — cross-posts one eligible pin daily at 18:00 UTC (2pm EDT)."
echo "Repo: $REPO"
echo "Logs: $REPO/scripts/facebook/drip.log"
echo "Uninstall: ./scripts/facebook/install-drip-schedule.sh uninstall"
echo ""
echo "Full Disk Access for /bin/bash + node is shared with the Pinterest/Instagram"
echo "drips — if those run, this is already covered."
