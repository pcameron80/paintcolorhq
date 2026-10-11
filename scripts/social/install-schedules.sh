#!/usr/bin/env bash
# Install (or remove) the four social launchd agents: the Pinterest, Facebook
# and Instagram drips and the weekly Pinterest analytics report.
#
# Everything the jobs need lives in ~/Library/Application Support/PaintColorHQ/
# social/: run.sh, one detached worktree of origin/main (checkout/) that run.sh
# moves to the latest origin/main before every run, the ledgers
# (*-published.json), logs/ and pinterest-reports/. Safe to run from any
# checkout or worktree: it never changes the branch of the main checkout.
#
# The first install also moves the ledgers out of the main checkout (see
# migrate-ledgers.ts). Order matters: the old agents are unloaded before the
# migration so none of them writes the in-repo copy afterwards.
#
# Usage: ./scripts/social/install-schedules.sh            # install / reinstall
#        ./scripts/social/install-schedules.sh --check    # render + validate only;
#                                                         # loads nothing, migrates nothing
#        ./scripts/social/install-schedules.sh uninstall  # remove (keeps ledgers, logs, reports)
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$(git -C "$HERE" rev-parse --path-format=absolute --git-common-dir)/.." && pwd)"
DIR="$HOME/Library/Application Support/PaintColorHQ/social"
WT="$DIR/checkout"
AGENTS="$HOME/Library/LaunchAgents"
BRANCH="${SOCIAL_SCHEDULE_BRANCH:-main}" # override only to test an unmerged branch
MODE="${1:-install}"

# label | plist template | job name (log file) | job script, relative to the repo
JOBS=(
  "com.paintcolorhq.pinterest-drip|scripts/pinterest/com.paintcolorhq.pinterest-drip.plist.template|pinterest-drip|scripts/pinterest/drip.sh"
  "com.paintcolorhq.instagram-drip|scripts/instagram/com.paintcolorhq.instagram-drip.plist.template|instagram-drip|scripts/instagram/drip.sh"
  "com.paintcolorhq.facebook-drip|scripts/facebook/com.paintcolorhq.facebook-drip.plist.template|facebook-drip|scripts/facebook/drip.sh"
  "com.paintcolorhq.pinterest-analytics|scripts/pinterest/com.paintcolorhq.pinterest-analytics.plist.template|pinterest-analytics|scripts/pinterest/analytics-report.sh"
)

unload_all() {
  for row in "${JOBS[@]}"; do
    IFS='|' read -r label _ _ _ <<< "$row"
    launchctl unload "$AGENTS/$label.plist" 2>/dev/null || true
  done
}

case "$MODE" in
  uninstall)
    unload_all
    for row in "${JOBS[@]}"; do
      IFS='|' read -r label _ _ _ <<< "$row"
      rm -f "$AGENTS/$label.plist"
    done
    rm -f "$DIR/run.sh"
    git -C "$REPO" worktree remove --force "$WT" 2>/dev/null || true
    echo "Uninstalled the social agents (ledgers, logs and reports kept in $DIR)."
    exit 0 ;;
  install|--check) ;;
  *) echo "Usage: $0 [--check|uninstall]" >&2; exit 2 ;;
esac

# Node: /usr/local/bin/node is the binary granted Full Disk Access. The
# interactive shell's node can be a symlink into another tool's private install
# (on this Mac, ~/.hermes/node), which launchd jobs must not depend on.
if [[ -x /usr/local/bin/node ]]; then NODE_DIR=/usr/local/bin; else NODE_DIR="$(dirname "$(command -v node)")"; fi
export PATH="$NODE_DIR:$PATH"

[[ -e "$REPO/.env.local" ]] || { echo "No .env.local in $REPO; the jobs need its API tokens." >&2; exit 1; }
[[ -d "$REPO/node_modules" ]] || { echo "No node_modules in $REPO; run npm install there first." >&2; exit 1; }

mkdir -p "$DIR/logs" "$AGENTS"
git -C "$REPO" fetch -q origin "$BRANCH"
if [[ ! -d "$WT" ]]; then
  git -C "$REPO" worktree add -q --detach "$WT" "origin/$BRANCH"
else
  git -C "$WT" checkout -q -f --detach "origin/$BRANCH"
fi
# Symlinks, not copies: pinterest-publish.ts writes refreshed OAuth tokens back
# to .env.local, and that write has to land in the main checkout's file.
[[ -e "$WT/node_modules" ]] || ln -s "$REPO/node_modules" "$WT/node_modules"
[[ -e "$WT/.env.local" ]] || ln -s "$REPO/.env.local" "$WT/.env.local"
if [[ ! -f "$WT/scripts/social/run-job.sh" ]]; then
  echo "origin/$BRANCH has no scripts/social/run-job.sh yet; merge the PR first." >&2
  exit 1
fi

export PCHQ_SOCIAL_STATE_DIR="$DIR"
migrate() { (cd "$WT" && npx tsx scripts/social/migrate-ledgers.ts --from-repo="$REPO" "$@"); }
echo "Ledgers (preview):"
migrate --dry-run

RENDER_DIR="$AGENTS"
if [[ "$MODE" == "--check" ]]; then RENDER_DIR="$DIR/plist-check"; mkdir -p "$RENDER_DIR"; fi

sed -e "s|__REPO__|$REPO|g" -e "s|__WT__|$WT|g" -e "s|__DIR__|$DIR|g" -e "s|__BRANCH__|$BRANCH|g" \
  "$WT/scripts/social/run-job.sh" > "$DIR/run.sh.new"
for row in "${JOBS[@]}"; do
  IFS='|' read -r label template job script <<< "$row"
  [[ -f "$WT/$script" ]] || { echo "Missing $script on origin/$BRANCH." >&2; exit 1; }
  sed -e "s|__LABEL__|$label|g" -e "s|__RUNSH__|$DIR/run.sh|g" -e "s|__JOB__|$job|g" \
      -e "s|__SCRIPT__|$script|g" -e "s|__NODE_DIR__|$NODE_DIR|g" -e "s|__LOG__|$DIR/logs/$job.log|g" \
    "$WT/$template" > "$RENDER_DIR/$label.plist.new"
  plutil -lint -s "$RENDER_DIR/$label.plist.new"
done
bash -n "$DIR/run.sh.new"

if [[ "$MODE" == "--check" ]]; then
  for row in "${JOBS[@]}"; do
    IFS='|' read -r label _ _ _ <<< "$row"
    mv "$RENDER_DIR/$label.plist.new" "$RENDER_DIR/$label.plist"
  done
  mv "$DIR/run.sh.new" "$DIR/run.sh.check"
  echo "Check passed. Rendered plists: $RENDER_DIR; runner: $DIR/run.sh.check. Nothing loaded or migrated."
  exit 0
fi

unload_all
echo "Ledgers (migrating):"
if ! migrate; then
  echo "Migration failed. The agents are unloaded; the old plists are still in $AGENTS" >&2
  echo "(launchctl load them to roll back) or fix the error and re-run." >&2
  exit 1
fi
mv "$DIR/run.sh.new" "$DIR/run.sh"
for row in "${JOBS[@]}"; do
  IFS='|' read -r label _ _ _ <<< "$row"
  mv "$AGENTS/$label.plist.new" "$AGENTS/$label.plist"
  launchctl load "$AGENTS/$label.plist"
done

echo "Installed 4 agents; each runs from $WT (latest origin/$BRANCH):"
echo "  pinterest-drip 10:00, instagram-drip 16:00, facebook-drip 18:00 daily; pinterest-analytics Mon 09:00 (local time)"
echo "Ledgers: $DIR/*-published.json"
echo "Logs:    $DIR/logs/"
echo "Reports: $DIR/pinterest-reports/"
echo "Uninstall: ./scripts/social/install-schedules.sh uninstall"
echo "Full Disk Access for /bin/bash and $NODE_DIR/node still applies (node_modules,"
echo ".env.local and the pin images are under ~/Documents and ~/Desktop)."
