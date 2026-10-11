#!/usr/bin/env bash
# Pinterest drip job: publishes the day's quota mix (--daily): per-type floors
# (swatch 3, palette 1) + weekday extras (guide Mon/Thu, comparison Wed/Sat),
# with a 35-day cooldown re-pin so the queue never goes silent. selectDailyMix
# is designed to run ONCE/day — the plist fires this a single time (see plist),
# NOT in a 3×/day spread, or each run would re-fill the full quota and overpost.
#
# launchd runs this through scripts/social/run-job.sh, from a detached worktree
# of the latest origin/main. Logs to the shared state folder (logs/).
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOGS="${PCHQ_SOCIAL_STATE_DIR:-$HOME/Library/Application Support/PaintColorHQ/social}/logs"
mkdir -p "$LOGS"
cd "$REPO"
echo "=== drip run $(date -u +%Y-%m-%dT%H:%M:%SZ) ($(git rev-parse --short HEAD 2>/dev/null || echo '?')) ===" >> "$LOGS/pinterest-drip.log"
npx tsx scripts/pinterest-publish.ts --daily >> "$LOGS/pinterest-drip.log" 2>&1
