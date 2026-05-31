#!/usr/bin/env bash
# launchd entry point for the Pinterest drip. Resolves the repo root from its
# own location, then publishes one pin via the variety rotation. Logs to drip.log.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
COUNT="${1:-1}"
echo "=== drip run $(date -u +%Y-%m-%dT%H:%M:%SZ) (count=$COUNT) ===" >> "$REPO/scripts/pinterest/drip.log"
npx tsx scripts/pinterest-publish.ts --drip="$COUNT" >> "$REPO/scripts/pinterest/drip.log" 2>&1
