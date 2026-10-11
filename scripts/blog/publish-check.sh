#!/usr/bin/env bash
# launchd entry point for the publish-day check (see publish-check.ts). Resolves
# the repo root from its own location and appends to publish-check.log.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
npx tsx scripts/blog/publish-check.ts >> "$REPO/scripts/blog/publish-check.log" 2>&1
