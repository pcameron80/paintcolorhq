#!/usr/bin/env bash
# launchd entry point for the Pinterest drip. Resolves the repo root from its
# own location, then publishes the day's multi-board quota mix (--daily computes
# the per-type quota by weekday). Logs to drip.log.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
echo "=== drip run $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >> "$REPO/scripts/pinterest/drip.log"
npx tsx scripts/pinterest-publish.ts --daily >> "$REPO/scripts/pinterest/drip.log" 2>&1
