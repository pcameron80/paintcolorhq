#!/usr/bin/env bash
# launchd entry point for the Pinterest drip. Resolves the repo root from its
# own location, then publishes 2 pins via the variety rotation. Fires 3×/day
# (see the plist) to spread ~6 pins/day across the day instead of one burst.
# Logs to drip.log.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
echo "=== drip run $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >> "$REPO/scripts/pinterest/drip.log"
npx tsx scripts/pinterest-publish.ts --drip=2 >> "$REPO/scripts/pinterest/drip.log" 2>&1
