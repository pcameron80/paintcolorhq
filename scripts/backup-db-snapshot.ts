/**
 * Weekly logical snapshot of the PaintColorHQ Supabase tables, copied to the
 * NAS (Tower). Supabase keeps 7 daily snapshots that cannot be downloaded and
 * go with the project; data errors here have surfaced weeks later. This keeps
 * 12 weekly copies off-platform.
 *
 * READ-ONLY against Supabase (select only, service role so RLS-only tables
 * are visible). Writes only to the local backup folder and the NAS.
 *
 * Each run:
 *   1. pages select('*').order('id') for every table in SNAPSHOT_TABLES,
 *      taking count(*) before and after, and fails on 0 rows, lost or
 *      duplicate rows, or a drop of more than 5% against the last snapshot;
 *   2. writes <table>.json.gz plus manifest.json (counts, sha256, git SHA)
 *      to <backup dir>/YYYY-MM-DD/;
 *   3. restores that snapshot into a scratch SQLite database and checks the
 *      counts again (restore-test.json, copied with the snapshot);
 *   4. rsyncs it to Tower at /mnt/user/backups/paintcolorhq-db/YYYY-MM-DD/,
 *      keeping 12 there and 4 locally, and mirrors data/brand-scans and
 *      scripts/data/backups from the main checkout (no --delete).
 *
 * Usage:
 *   tsx scripts/backup-db-snapshot.ts                 # dry run: print the plan, touch nothing
 *   tsx scripts/backup-db-snapshot.ts --apply         # snapshot, restore test, copy to the NAS
 *   tsx scripts/backup-db-snapshot.ts --apply --local-only   # skip the NAS copy
 *   tsx scripts/backup-db-snapshot.ts --restore-test=<snapshot dir> [--keep-db]
 *   tsx scripts/backup-db-snapshot.ts --apply --allow-drop=colors   # accept a planned >5% drop
 *   tsx scripts/backup-db-snapshot.ts --force-fail    # exit 1 at once (tests the failure notice)
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local);
 * PCHQ_BACKUP_DIR (default ~/Library/Application Support/PaintColorHQ/backup/db);
 * PCHQ_BACKUP_SSH (default: root@192.168.2.110, then root@tower over Tailscale);
 * PCHQ_REPO (main checkout, for data/brand-scans; default: from git).
 */

import { execFileSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  SKIPPED_TABLES,
  SNAPSHOT_TABLES,
  checkAgainstPrevious,
  checkFetchedTable,
  latestManifest,
  localDate,
  manifestCounts,
  pruneList,
  restoreTest,
  writeTableFile,
  type Manifest,
  type Row,
  type TableEntry,
} from "./backup/snapshot-lib";

dotenv.config({ path: path.resolve(__dirname, "../.env.local"), quiet: true });

const PAGE = 1000;
const KEEP_REMOTE = 12;
const KEEP_LOCAL = 4;
const REMOTE_ROOT = "/mnt/user/backups/paintcolorhq-db";
const BACKUP_DIR =
  process.env.PCHQ_BACKUP_DIR ??
  path.join(os.homedir(), "Library/Application Support/PaintColorHQ/backup/db");
const SSH_HOSTS = process.env.PCHQ_BACKUP_SSH
  ? [process.env.PCHQ_BACKUP_SSH]
  : ["root@192.168.2.110", "root@tower"];
const SSH_OPTS = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=5"];

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

function die(msg: string): never {
  console.error(`\nBACKUP FAILED: ${msg}`);
  process.exit(1);
}

function repoRoot(): string {
  if (process.env.PCHQ_REPO) return process.env.PCHQ_REPO;
  const common = execFileSync("git", ["-C", __dirname, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
    encoding: "utf8",
  }).trim();
  return path.dirname(common);
}

function gitSha(): string {
  try {
    return execFileSync("git", ["-C", __dirname, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

/** The snapshot must never land inside a checkout (data/colors-processed.json lives there). */
function assertOutsideRepo(dir: string, repo: string) {
  const rel = path.relative(path.resolve(repo), path.resolve(dir));
  if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
    die(`backup dir ${dir} is inside the repo ${repo}; set PCHQ_BACKUP_DIR outside it.`);
  }
}

async function countRows(sb: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await sb.from(table).select("*", { count: "exact", head: true });
  if (error || count === null) die(`count(*) on ${table}: ${error?.message ?? "no count returned"}`);
  return count;
}

async function fetchTable(sb: SupabaseClient, table: string): Promise<{ rows: Row[]; before: number; after: number }> {
  const before = await countRows(sb, table);
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from(table).select("*").order("id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) die(`select on ${table} at offset ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as Row[]));
    if (data.length < PAGE) break;
  }
  const after = await countRows(sb, table);
  return { rows, before, after };
}

function pickSshHost(): string {
  for (const host of SSH_HOSTS) {
    const r = spawnSync("ssh", [...SSH_OPTS, host, "true"], { stdio: "ignore" });
    if (r.status === 0) return host;
  }
  die(`no SSH route to the NAS (tried ${SSH_HOSTS.join(", ")}).`);
}

function run(cmd: string, argv: string[]) {
  const r = spawnSync(cmd, argv, { stdio: "inherit" });
  if (r.status !== 0) die(`${cmd} ${argv.slice(0, 3).join(" ")} ... exited ${r.status}`);
}

function copyToNas(snapshotDir: string, date: string, repo: string) {
  const host = pickSshHost();
  const ssh = `ssh ${SSH_OPTS.join(" ")}`;
  console.log(`\nCopying to ${host}:${REMOTE_ROOT}/${date}/`);
  run("ssh", [...SSH_OPTS, host, `mkdir -p ${REMOTE_ROOT}/files`]);
  run("rsync", ["-a", "--partial", "-e", ssh, `${snapshotDir}/`, `${host}:${REMOTE_ROOT}/${date}/`]);

  // Verify the copy against the manifest before pruning anything.
  const manifest = JSON.parse(fs.readFileSync(path.join(snapshotDir, "manifest.json"), "utf8")) as Manifest;
  const sums = Object.values(manifest.tables)
    .map((e) => `${e.sha256}  ${e.file}`)
    .join("\n");
  const check = spawnSync("ssh", [...SSH_OPTS, host, `cd ${REMOTE_ROOT}/${date} && sha256sum -c --quiet -`], {
    input: `${sums}\n`,
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (check.status !== 0) die(`sha256 check of the NAS copy failed for ${date}.`);

  // Gitignored working data that exists only on this laptop. Mirrored, never deleted remotely.
  for (const rel of ["data/brand-scans", "scripts/data/backups"]) {
    const src = path.join(repo, rel);
    if (!fs.existsSync(src)) {
      console.log(`  skip ${rel}: not present in ${repo}`);
      continue;
    }
    run("ssh", [...SSH_OPTS, host, `mkdir -p ${REMOTE_ROOT}/files/${rel}`]);
    run("rsync", ["-a", "--partial", "-e", ssh, `${src}/`, `${host}:${REMOTE_ROOT}/files/${rel}/`]);
    console.log(`  mirrored ${rel}`);
  }

  const listing = spawnSync("ssh", [...SSH_OPTS, host, `ls -1 ${REMOTE_ROOT}`], { encoding: "utf8" });
  if (listing.status !== 0) die("could not list the NAS backup folder for pruning.");
  const old = pruneList(listing.stdout.split("\n").map((s) => s.trim()), KEEP_REMOTE);
  if (old.length > 0) {
    run("ssh", [...SSH_OPTS, host, `cd ${REMOTE_ROOT} && rm -rf -- ${old.join(" ")}`]);
    console.log(`  pruned ${old.length} old NAS snapshot(s): ${old.join(", ")}`);
  }
}

function pruneLocal() {
  const old = pruneList(fs.readdirSync(BACKUP_DIR), KEEP_LOCAL);
  for (const n of old) fs.rmSync(path.join(BACKUP_DIR, n), { recursive: true, force: true });
  if (old.length > 0) console.log(`Pruned ${old.length} old local snapshot(s).`);
}

function printRestore(dir: string, keepDb: boolean): boolean {
  const res = restoreTest(dir, { keepDb });
  fs.writeFileSync(path.join(dir, "restore-test.json"), JSON.stringify(res, null, 2));
  console.log(`\nRestore test into scratch SQLite: ${res.ok ? "PASSED" : "FAILED"}`);
  for (const [t, r] of Object.entries(res.tables)) {
    console.log(`  ${t.padEnd(18)} manifest ${String(r.manifest_rows).padStart(7)}  restored ${String(r.restored_rows).padStart(7)}  ids ${r.distinct_ids}`);
  }
  for (const e of res.errors) console.log(`  ERROR ${e}`);
  if (res.sqlite_file) console.log(`  Kept: ${res.sqlite_file}`);
  return res.ok;
}

async function main() {
  if (flag("force-fail")) die("--force-fail given (testing the failure notice).");

  const restoreDir = opt("restore-test");
  if (restoreDir) {
    process.exit(printRestore(path.resolve(restoreDir), flag("keep-db")) ? 0 : 1);
  }

  const apply = flag("apply");
  const localOnly = flag("local-only");
  const repo = repoRoot();
  const date = localDate();
  const prev = latestManifest(BACKUP_DIR, date);

  console.log(`PaintColorHQ DB snapshot ${date} (${apply ? "APPLY" : "DRY RUN: no database or NAS access, nothing written"})`);
  console.log(`  tables:   ${SNAPSHOT_TABLES.join(", ")}`);
  console.log(`  skipped:  ${SKIPPED_TABLES.join(", ")}`);
  console.log(`  local:    ${path.join(BACKUP_DIR, date)} (keep ${KEEP_LOCAL})`);
  console.log(`  NAS:      ${localOnly ? "skipped (--local-only)" : `${SSH_HOSTS.join(" or ")}:${REMOTE_ROOT}/${date} (keep ${KEEP_REMOTE})`}`);
  console.log(`  mirrors:  ${repo}/data/brand-scans, ${repo}/scripts/data/backups`);
  console.log(`  previous: ${prev ? `${prev.date} ${JSON.stringify(manifestCounts(prev.manifest))}` : "none (no drop check this run)"}`);
  if (!apply) {
    console.log("\nDry run. Re-run with --apply to take the snapshot.");
    return;
  }

  assertOutsideRepo(BACKUP_DIR, repo);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) die("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env.local.");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const finalDir = path.join(BACKUP_DIR, date);
  const workDir = `${finalDir}.partial`;
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true, mode: 0o700 });

  const tables: Record<string, TableEntry> = {};
  const errors: string[] = [];
  for (const table of SNAPSHOT_TABLES) {
    const { rows, before, after } = await fetchTable(sb, table);
    errors.push(...checkFetchedTable(table, rows, { before, after }));
    tables[table] = writeTableFile(workDir, table, rows, { before, after });
    console.log(`  ${table.padEnd(18)} ${String(rows.length).padStart(7)} rows  (count ${before}/${after})`);
  }
  const counts = Object.fromEntries(Object.entries(tables).map(([t, e]) => [t, e.rows]));
  // --allow-drop=a,b accepts a planned >5% drop in those tables for this one run.
  const allowDrop = new Set((opt("allow-drop") ?? "").split(",").filter(Boolean));
  const prevCounts = prev ? manifestCounts(prev.manifest) : undefined;
  if (prevCounts) for (const t of allowDrop) delete prevCounts[t];
  errors.push(...checkAgainstPrevious(counts, prevCounts));

  const manifest: Manifest = {
    format: 1,
    date,
    created_at: new Date().toISOString(),
    git_sha: gitSha(),
    supabase_host: new URL(url).host,
    tables,
    skipped: SKIPPED_TABLES,
    ...(prev ? { previous: { date: prev.date, tables: manifestCounts(prev.manifest) } } : {}),
  };
  fs.writeFileSync(path.join(workDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  if (errors.length > 0) {
    // Kept as .partial for inspection; never promoted, never copied, never prunes a good copy.
    die(`snapshot checks failed, kept for inspection at ${workDir}:\n  ${errors.join("\n  ")}`);
  }
  if (!printRestore(workDir, false)) die(`restore test failed; snapshot left at ${workDir}.`);

  fs.rmSync(finalDir, { recursive: true, force: true });
  fs.renameSync(workDir, finalDir);
  console.log(`\nSnapshot written: ${finalDir}`);

  if (!localOnly) copyToNas(finalDir, date, repo);
  pruneLocal();
  console.log(`\nOK ${date} ${JSON.stringify(counts)}`);
}

main().catch((e) => die((e as Error).stack ?? String(e)));
