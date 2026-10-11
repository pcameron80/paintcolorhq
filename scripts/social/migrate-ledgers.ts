/**
 * Move the social drips' ledgers out of a repo checkout into the shared state
 * folder (see ledger.ts). Idempotent: it merges the checkout's copy into
 * whatever is already in the state folder, so re-running it after the move
 * only re-adds entries that are already there.
 *
 * install-schedules.sh runs this after unloading the old launchd agents and
 * before loading the new ones, so no drip writes the old copy afterwards.
 *
 * Usage: npx tsx scripts/social/migrate-ledgers.ts --from-repo=<main checkout> [--dry-run]
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  LEGACY_REPO_PATH,
  ledgerPath,
  mergeLedgers,
  readLedger,
  writeLedger,
  type LedgerName,
} from "./ledger.ts";

export type MigrationResult = {
  name: LedgerName;
  target: string;
  existing: number;
  fromRepo: number;
  merged: number;
};

export function migrateLedger(name: LedgerName, repoDir: string, dryRun = false): MigrationResult {
  const target = ledgerPath(name);
  const source = path.join(repoDir, LEGACY_REPO_PATH[name]);
  if (!fs.existsSync(target) && !fs.existsSync(source)) {
    throw new Error(`${name}: no ledger at ${target} or ${source}; refusing to create an empty one`);
  }
  const existing = readLedger(target, { allowMissing: true });
  const fromRepo = readLedger(source, { allowMissing: true });
  const merged = mergeLedgers(existing, fromRepo);
  if (!dryRun) writeLedger(target, merged);
  return {
    name,
    target,
    existing: Object.keys(existing).length,
    fromRepo: Object.keys(fromRepo).length,
    merged: Object.keys(merged).length,
  };
}

function main() {
  const args = process.argv.slice(2);
  const repo = args.find((a) => a.startsWith("--from-repo="))?.slice("--from-repo=".length);
  const dryRun = args.includes("--dry-run");
  if (!repo) {
    console.error("Usage: migrate-ledgers.ts --from-repo=<main checkout> [--dry-run]");
    process.exit(2);
  }
  for (const name of Object.keys(LEGACY_REPO_PATH) as LedgerName[]) {
    const r = migrateLedger(name, path.resolve(repo), dryRun);
    console.log(
      `${dryRun ? "[dry run] " : ""}${r.name}: ${r.merged} entries ` +
        `(${r.existing} already in state folder, ${r.fromRepo} in checkout) -> ${r.target}`,
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
