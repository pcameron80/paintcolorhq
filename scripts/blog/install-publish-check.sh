#!/usr/bin/env bash
# Render the launchd plist with this machine's paths and (un)load it.
# Run this from the PERMANENT repo checkout (not a worktree): the agent runs
# whatever path this resolves to.
#
# Usage: ./scripts/blog/install-publish-check.sh           # install
#        ./scripts/blog/install-publish-check.sh uninstall # remove
set -euo pipefail
LABEL="com.paintcolorhq.blog-publish-check"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [[ "${1:-}" == "uninstall" ]]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Uninstalled $LABEL."
  exit 0
fi

if [[ "$REPO" == *"/.claude/worktrees/"* ]]; then
  echo "Refusing: run this from the main checkout, not a worktree ($REPO)." >&2
  exit 1
fi

SCRIPT="$REPO/scripts/blog/publish-check.sh"
NODE_DIR="$(dirname "$(command -v node)")"
chmod +x "$SCRIPT"
mkdir -p "$HOME/Library/LaunchAgents"
sed -e "s|__LABEL__|$LABEL|g" \
    -e "s|__SCRIPT__|$SCRIPT|g" \
    -e "s|__NODE_DIR__|$NODE_DIR|g" \
    -e "s|__REPO__|$REPO|g" \
    "$REPO/scripts/blog/com.paintcolorhq.blog-publish-check.plist.template" > "$PLIST"
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Installed $LABEL: runs at 09:30 and 21:30 local time."
echo "Logs:  $REPO/scripts/blog/publish-check.log"
echo "State: $REPO/scripts/blog/publish-check-state.json"
echo "Uninstall: ./scripts/blog/install-publish-check.sh uninstall"
