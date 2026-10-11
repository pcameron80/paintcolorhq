#!/usr/bin/env bash
# Install (or remove) the publish-day check as a launchd agent.
#
# Everything the job needs lives in ~/Library/Application Support/PaintColorHQ/
# publish-check/: run.sh, its own detached worktree of origin/main (checkout/),
# the state file and the log. Safe to run from any checkout or worktree: it
# never changes the branch of the main checkout.
#
# Usage: ./scripts/blog/install-publish-check.sh           # install / reinstall
#        ./scripts/blog/install-publish-check.sh uninstall # remove (keeps state + log)
set -euo pipefail
LABEL="com.paintcolorhq.blog-publish-check"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$(git -C "$HERE" rev-parse --path-format=absolute --git-common-dir)/.." && pwd)"
DIR="$HOME/Library/Application Support/PaintColorHQ/publish-check"
WT="$DIR/checkout"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
BRANCH="${PUBLISH_CHECK_BRANCH:-main}" # override only to test an unmerged branch

if [[ "${1:-}" == "uninstall" ]]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST" "$DIR/run.sh"
  git -C "$REPO" worktree remove --force "$WT" 2>/dev/null || true
  echo "Uninstalled $LABEL (state and log kept in $DIR)."
  exit 0
fi

mkdir -p "$DIR" "$HOME/Library/LaunchAgents"
git -C "$REPO" fetch -q origin "$BRANCH"
if [[ ! -d "$WT" ]]; then
  git -C "$REPO" worktree add -q --detach "$WT" "origin/$BRANCH"
else
  git -C "$WT" checkout -q --detach "origin/$BRANCH"
fi
[[ -e "$WT/node_modules" ]] || ln -s "$REPO/node_modules" "$WT/node_modules"
if [[ ! -f "$WT/scripts/blog/publish-check.ts" ]]; then
  echo "origin/$BRANCH has no scripts/blog/publish-check.ts yet; merge the PR first." >&2
  exit 1
fi

sed -e "s|__REPO__|$REPO|g" -e "s|__WT__|$WT|g" -e "s|__DIR__|$DIR|g" -e "s|__BRANCH__|$BRANCH|g" \
  "$HERE/publish-check.sh" > "$DIR/run.sh"
NODE_DIR="$(dirname "$(command -v node)")"
sed -e "s|__LABEL__|$LABEL|g" -e "s|__SCRIPT__|$DIR/run.sh|g" \
    -e "s|__NODE_DIR__|$NODE_DIR|g" -e "s|__LOG__|$DIR/publish-check.log|g" \
  "$HERE/com.paintcolorhq.blog-publish-check.plist.template" > "$PLIST"
plutil -lint -s "$PLIST"
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Installed $LABEL: runs at 09:30 and 21:30 local time from $WT (latest origin/$BRANCH)."
echo "Log:   $DIR/publish-check.log"
echo "State: $DIR/publish-check-state.json"
echo "Uninstall: ./scripts/blog/install-publish-check.sh uninstall"
