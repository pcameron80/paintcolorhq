#!/usr/bin/env bash
# Install (or remove) the weekly Supabase snapshot launchd agent
# (com.paintcolorhq.db-backup, Mondays 11:00 local). Same layout as
# scripts/social/install-schedules.sh, in its own folder:
#
#   ~/Library/Application Support/PaintColorHQ/backup/
#     checkout/   detached worktree of origin/main, moved before every run
#     db/         the local snapshots (newest 4; the NAS keeps 12)
#     logs/       db-backup.log
#     run.sh      rendered from scripts/backup/run-backup.sh
#     last-success
#
# Safe to run from any checkout or worktree: it never changes the branch of
# the main checkout.
#
# Usage: ./scripts/backup/install-backup-schedule.sh            # install / reinstall
#        ./scripts/backup/install-backup-schedule.sh --check    # render + validate only; loads nothing
#        ./scripts/backup/install-backup-schedule.sh uninstall  # remove the agent (keeps db/ and logs/)
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$(git -C "$HERE" rev-parse --path-format=absolute --git-common-dir)/.." && pwd)"
DIR="$HOME/Library/Application Support/PaintColorHQ/backup"
WT="$DIR/checkout"
AGENTS="$HOME/Library/LaunchAgents"
BRANCH="${BACKUP_SCHEDULE_BRANCH:-main}" # override only to test an unmerged branch
LABEL="com.paintcolorhq.db-backup"
MODE="${1:-install}"

case "$MODE" in
  uninstall)
    launchctl unload "$AGENTS/$LABEL.plist" 2>/dev/null || true
    rm -f "$AGENTS/$LABEL.plist" "$DIR/run.sh"
    git -C "$REPO" worktree remove --force "$WT" 2>/dev/null || true
    echo "Uninstalled $LABEL (snapshots and logs kept in $DIR)."
    exit 0 ;;
  install|--check) ;;
  *) echo "Usage: $0 [--check|uninstall]" >&2; exit 2 ;;
esac

# /usr/local/bin/node is the binary granted Full Disk Access (see the social installer).
if [[ -x /usr/local/bin/node ]]; then NODE_DIR=/usr/local/bin; else NODE_DIR="$(dirname "$(command -v node)")"; fi
export PATH="$NODE_DIR:$PATH"

[[ -e "$REPO/.env.local" ]] || { echo "No .env.local in $REPO; the job needs SUPABASE_SERVICE_ROLE_KEY from it." >&2; exit 1; }
[[ -d "$REPO/node_modules" ]] || { echo "No node_modules in $REPO; run npm install there first." >&2; exit 1; }
command -v rsync >/dev/null || { echo "rsync not found." >&2; exit 1; }

mkdir -p "$DIR/logs" "$DIR/db" "$AGENTS"
chmod 700 "$DIR" "$DIR/db"
git -C "$REPO" fetch -q origin "$BRANCH"
if [[ ! -d "$WT" ]]; then
  git -C "$REPO" worktree add -q --detach "$WT" "origin/$BRANCH"
else
  git -C "$WT" checkout -q -f --detach "origin/$BRANCH"
fi
[[ -e "$WT/node_modules" ]] || ln -s "$REPO/node_modules" "$WT/node_modules"
[[ -e "$WT/.env.local" ]] || ln -s "$REPO/.env.local" "$WT/.env.local"
if [[ ! -f "$WT/scripts/backup/run-backup.sh" ]]; then
  echo "origin/$BRANCH has no scripts/backup/run-backup.sh yet; merge the PR first." >&2
  exit 1
fi

RENDER_DIR="$AGENTS"
if [[ "$MODE" == "--check" ]]; then RENDER_DIR="$DIR/plist-check"; mkdir -p "$RENDER_DIR"; fi

sed -e "s|__REPO__|$REPO|g" -e "s|__WT__|$WT|g" -e "s|__DIR__|$DIR|g" -e "s|__BRANCH__|$BRANCH|g" \
  "$WT/scripts/backup/run-backup.sh" > "$DIR/run.sh.new"
sed -e "s|__LABEL__|$LABEL|g" -e "s|__RUNSH__|$DIR/run.sh|g" -e "s|__NODE_DIR__|$NODE_DIR|g" \
    -e "s|__LOG__|$DIR/logs/db-backup.log|g" \
  "$WT/scripts/backup/$LABEL.plist.template" > "$RENDER_DIR/$LABEL.plist.new"
plutil -lint -s "$RENDER_DIR/$LABEL.plist.new"
bash -n "$DIR/run.sh.new"

# Dry run from the job's own checkout: proves tsx, the imports and the paths resolve.
(cd "$WT" && NODE_NO_WARNINGS=1 PCHQ_BACKUP_DIR="$DIR/db" PCHQ_REPO="$REPO" npx tsx scripts/backup-db-snapshot.ts)

if [[ "$MODE" == "--check" ]]; then
  mv "$RENDER_DIR/$LABEL.plist.new" "$RENDER_DIR/$LABEL.plist"
  mv "$DIR/run.sh.new" "$DIR/run.sh.check"
  echo "Check passed. Rendered plist: $RENDER_DIR/$LABEL.plist; runner: $DIR/run.sh.check. Nothing loaded."
  exit 0
fi

launchctl unload "$AGENTS/$LABEL.plist" 2>/dev/null || true
mv "$DIR/run.sh.new" "$DIR/run.sh"
mv "$AGENTS/$LABEL.plist.new" "$AGENTS/$LABEL.plist"
launchctl load "$AGENTS/$LABEL.plist"

echo "Installed $LABEL: Mondays 11:00 local, from $WT (latest origin/$BRANCH)."
echo "Snapshots: $DIR/db/ (4 kept) and Tower:/mnt/user/backups/paintcolorhq-db/ (12 kept)"
echo "Log:       $DIR/logs/db-backup.log"
echo "Run now:   bash \"$DIR/run.sh\""
echo "Test the failure notice: PCHQ_BACKUP_EXTRA_ARGS=--force-fail bash \"$DIR/run.sh\""
echo "Uninstall: ./scripts/backup/install-backup-schedule.sh uninstall"
