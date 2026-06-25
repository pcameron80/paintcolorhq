#!/usr/bin/env bash
# launchd entry point for the Pinterest drip. Resolves the repo root from its
# own location, then publishes the day's quota mix (--daily): per-type floors
# (swatch 3, palette 1) + weekday extras (guide Mon/Thu, comparison Wed/Sat),
# with a 35-day cooldown re-pin so the queue never goes silent. selectDailyMix
# is designed to run ONCE/day — the plist fires this a single time (see plist),
# NOT in a 3×/day spread, or each run would re-fill the full quota and overpost.
# Logs to drip.log.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
echo "=== drip run $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >> "$REPO/scripts/pinterest/drip.log"
npx tsx scripts/pinterest-publish.ts --daily >> "$REPO/scripts/pinterest/drip.log" 2>&1
