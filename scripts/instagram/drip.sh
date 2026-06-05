#!/usr/bin/env bash
# launchd entry point for the Instagram drip. Resolves the repo root from its
# own location, then cross-posts one IG-eligible pin via the variety rotation
# (--drip=1). Logs to drip.log.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
echo "=== ig drip run $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >> "$REPO/scripts/instagram/drip.log"
npx tsx scripts/instagram-publish.ts --drip=1 >> "$REPO/scripts/instagram/drip.log" 2>&1
