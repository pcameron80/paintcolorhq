/**
 * Snapshot production /match-data/<id>.json for every active entry in
 * scripts/data/frozen-match-sources.json, into scripts/data/frozen-match/.
 *
 * build-match-data.ts serves these snapshots instead of the regenerated file
 * until each entry's `until` date, so running tests (the head-color push and
 * the match-title test) keep the match lists they were measured with while
 * the color data underneath is corrected.
 *
 * Reads production only (one GET per color, paced). Writes local files only.
 * An existing snapshot is kept unless --force is passed: a freeze means the
 * first capture wins.
 *
 * Usage:
 *   npx tsx scripts/snapshot-frozen-match.ts            # write missing snapshots
 *   npx tsx scripts/snapshot-frozen-match.ts --check    # compare to production, write nothing
 *   npx tsx scripts/snapshot-frozen-match.ts --force    # re-capture all active entries
 *   BASE_URL=https://... to read from another deployment
 */

import * as fs from "fs";
import {
  activeFrozen,
  checkPayload,
  FROZEN_SNAPSHOT_DIR,
  loadFrozenList,
  snapshotPath,
  todayUtc,
} from "./lib/frozen-match";

const BASE_URL = (process.env.BASE_URL ?? "https://www.paintcolorhq.com").replace(/\/$/, "");
const PACE_MS = 750;
const TOP_N = 50;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const check = process.argv.includes("--check");
  const force = process.argv.includes("--force");
  const today = todayUtc();
  const active = activeFrozen(loadFrozenList(), today);
  console.log(`${active.length} active frozen sources on ${today}; reading ${BASE_URL}`);
  fs.mkdirSync(FROZEN_SNAPSHOT_DIR, { recursive: true });

  let failures = 0;
  let written = 0;
  for (const [i, entry] of active.entries()) {
    if (i > 0) await sleep(PACE_MS);
    const file = snapshotPath(entry.id);
    const exists = fs.existsSync(file);
    if (exists && !force && !check) {
      console.log(`  keep   ${entry.key} (snapshot exists)`);
      continue;
    }
    const res = await fetch(`${BASE_URL}/match-data/${entry.id}.json`, { cache: "no-store" });
    if (!res.ok) {
      console.error(`  FAIL   ${entry.key}: HTTP ${res.status}`);
      failures++;
      continue;
    }
    const text = await res.text();
    const problem = checkPayload(entry.id, text, TOP_N);
    if (problem) {
      console.error(`  FAIL   ${entry.key}: ${problem}`);
      failures++;
      continue;
    }
    if (check) {
      const same = exists && fs.readFileSync(file, "utf-8") === text;
      console.log(`  ${same ? "same  " : exists ? "DIFF  " : "none  "} ${entry.key}`);
      if (!same) failures++;
      continue;
    }
    fs.writeFileSync(file, text);
    written++;
    console.log(`  wrote  ${entry.key} (${text.length} bytes)`);
  }
  console.log(`\n${written} written, ${failures} ${check ? "differences/failures" : "failures"}.`);
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
