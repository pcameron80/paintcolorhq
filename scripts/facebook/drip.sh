#!/usr/bin/env bash
# launchd entry point for the Facebook Page drip. Resolves the repo root from its
# own location, then cross-posts one eligible pin via the variety rotation
# (--drip=1). Logs to drip.log.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
echo "=== fb drip run $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >> "$REPO/scripts/facebook/drip.log"
npx tsx scripts/facebook-publish.ts --drip=1 >> "$REPO/scripts/facebook/drip.log" 2>&1
