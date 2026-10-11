#!/usr/bin/env bash
# Instagram drip job: cross-posts one IG-eligible pin via the variety
# rotation (--drip=1).
#
# launchd runs this through scripts/social/run-job.sh, from a detached worktree
# of the latest origin/main. Logs to the shared state folder (logs/).
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOGS="${PCHQ_SOCIAL_STATE_DIR:-$HOME/Library/Application Support/PaintColorHQ/social}/logs"
mkdir -p "$LOGS"
cd "$REPO"
echo "=== ig drip run $(date -u +%Y-%m-%dT%H:%M:%SZ) ($(git rev-parse --short HEAD 2>/dev/null || echo '?')) ===" >> "$LOGS/instagram-drip.log"
npx tsx scripts/instagram-publish.ts --drip=1 >> "$LOGS/instagram-drip.log" 2>&1
