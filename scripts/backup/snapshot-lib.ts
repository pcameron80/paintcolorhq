/**
 * Pure helpers for scripts/backup-db-snapshot.ts: the snapshot file format,
 * the count checks that decide whether a snapshot is trustworthy, the
 * retention list, and the restore test into a scratch SQLite database.
 *
 * Nothing here talks to Supabase or the NAS, so all of it is covered by
 * snapshot-lib.test.ts with synthetic rows.
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { createRequire } from "node:module";

/** Tables in the weekly snapshot, in the order they are written. */
export const SNAPSHOT_TABLES = [
  "brands",
  "color_families",
  "colors",
  "projects",
  "project_colors",
  "api_referrers",
  "api_usage_events",
] as const;
export type SnapshotTable = (typeof SNAPSHOT_TABLES)[number];

/**
 * Left out on purpose: cross_brand_matches is derived (npm run compute-matches
 * rebuilds it from colors), and auth.users is not reachable through PostgREST
 * and is covered by Supabase's own auth backups.
 */
export const SKIPPED_TABLES = ["cross_brand_matches", "auth.users"] as const;

/** A table may shrink by at most this fraction between two snapshots. */
export const MAX_DROP_FRACTION = 0.05;

export interface TableEntry {
  file: string;
  rows: number;
  /** count(*) taken just before and just after paging the table. */
  count_before: number;
  count_after: number;
  bytes: number;
  sha256: string;
}

export interface Manifest {
  format: 1;
  date: string;
  created_at: string;
  git_sha: string;
  supabase_host: string;
  tables: Record<string, TableEntry>;
  skipped: readonly string[];
  previous?: { date: string; tables: Record<string, number> };
}

export type Row = Record<string, unknown>;

export function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

/** Gzipped JSON array, one file per table. Returns the manifest entry. */
export function writeTableFile(
  dir: string,
  table: string,
  rows: Row[],
  counts: { before: number; after: number },
): TableEntry {
  const file = `${table}.json.gz`;
  const gz = zlib.gzipSync(Buffer.from(JSON.stringify(rows)), { level: 9 });
  fs.writeFileSync(path.join(dir, file), gz);
  return {
    file,
    rows: rows.length,
    count_before: counts.before,
    count_after: counts.after,
    bytes: gz.length,
    sha256: sha256(gz),
  };
}

export function readTableFile(dir: string, entry: TableEntry): Row[] {
  const gz = fs.readFileSync(path.join(dir, entry.file));
  const actual = sha256(gz);
  if (actual !== entry.sha256) {
    throw new Error(`${entry.file}: sha256 ${actual} does not match the manifest ${entry.sha256}`);
  }
  const rows = JSON.parse(zlib.gunzipSync(gz).toString("utf8"));
  if (!Array.isArray(rows)) throw new Error(`${entry.file}: not a JSON array`);
  return rows as Row[];
}

/**
 * Problems with one table's fetch. A table is trustworthy only if paging
 * returned a row count between the counts taken before and after (rows can be
 * appended mid-run, never removed), every id is present and unique, and the
 * table is not empty unless the caller allowed that.
 */
export function checkFetchedTable(
  table: string,
  rows: Row[],
  counts: { before: number; after: number },
  opts: { allowEmpty?: boolean } = {},
): string[] {
  const errors: string[] = [];
  if (rows.length === 0 && !opts.allowEmpty) {
    errors.push(`${table}: 0 rows. A live table this script backs up is never empty; refusing to keep this snapshot.`);
  }
  if (rows.length < counts.before || rows.length > counts.after) {
    errors.push(
      `${table}: paged ${rows.length} rows but count(*) was ${counts.before} before and ${counts.after} after; rows were lost while paging.`,
    );
  }
  const ids = new Set<unknown>();
  let missing = 0;
  for (const r of rows) {
    if (r.id === undefined || r.id === null) missing++;
    else ids.add(r.id);
  }
  if (missing > 0) errors.push(`${table}: ${missing} rows have no id.`);
  if (ids.size + missing !== rows.length) {
    errors.push(`${table}: ${rows.length - missing - ids.size} duplicate ids (paging overlapped).`);
  }
  return errors;
}

/**
 * Compare this snapshot's counts with the previous one. A drop of more than
 * MAX_DROP_FRACTION in any table fails the run: that is the signature of a bad
 * bulk write, and the backup that would rotate out the last good copy is
 * exactly the one that must not run quietly.
 */
export function checkAgainstPrevious(
  current: Record<string, number>,
  previous: Record<string, number> | undefined,
  maxDrop = MAX_DROP_FRACTION,
): string[] {
  if (!previous) return [];
  const errors: string[] = [];
  for (const [table, prev] of Object.entries(previous)) {
    const now = current[table];
    if (now === undefined) {
      errors.push(`${table}: in the previous snapshot (${prev} rows) but missing from this one.`);
      continue;
    }
    if (prev > 0 && (prev - now) / prev > maxDrop) {
      const pct = (((prev - now) / prev) * 100).toFixed(1);
      errors.push(`${table}: ${prev} -> ${now} rows, a ${pct}% drop (limit ${(maxDrop * 100).toFixed(0)}%).`);
    }
  }
  return errors;
}

const DATE_DIR = /^\d{4}-\d{2}-\d{2}$/;

/** Snapshot directory names to delete so that only the newest `keep` remain. */
export function pruneList(names: string[], keep: number): string[] {
  const dated = names.filter((n) => DATE_DIR.test(n)).sort();
  return dated.slice(0, Math.max(0, dated.length - keep));
}

/** Newest snapshot directory (by name) that has a manifest, excluding `exclude`. */
export function latestManifest(root: string, exclude?: string): { date: string; manifest: Manifest } | undefined {
  if (!fs.existsSync(root)) return undefined;
  const names = fs
    .readdirSync(root)
    .filter((n) => DATE_DIR.test(n) && n !== exclude)
    .sort()
    .reverse();
  for (const n of names) {
    const p = path.join(root, n, "manifest.json");
    if (fs.existsSync(p)) return { date: n, manifest: JSON.parse(fs.readFileSync(p, "utf8")) as Manifest };
  }
  return undefined;
}

export function manifestCounts(m: Manifest): Record<string, number> {
  return Object.fromEntries(Object.entries(m.tables).map(([t, e]) => [t, e.rows]));
}

/** Local calendar date, YYYY-MM-DD. */
export function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// node:sqlite ships with Node 22.13+ but @types/node here predates it, so it is
// loaded through require with the small surface this file uses.
interface SqliteStatement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): Record<string, unknown> | undefined;
}
interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
}
function openSqlite(file: string): SqliteDatabase {
  // Any base path works for a builtin; this one is valid in both CJS and ESM.
  const req = createRequire(path.join(process.cwd(), "noop.js"));
  const { DatabaseSync } = req("node:sqlite") as { DatabaseSync: new (f: string) => SqliteDatabase };
  return new DatabaseSync(file);
}

const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`;

function sqliteValue(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}

export interface RestoreResult {
  ok: boolean;
  checked_at: string;
  sqlite_file: string | null;
  tables: Record<string, { manifest_rows: number; restored_rows: number; distinct_ids: number }>;
  errors: string[];
}

/**
 * Load every table of a snapshot into a scratch SQLite database and compare
 * the restored counts and distinct ids with the manifest. Verifies each file's
 * sha256 on the way in. The SQLite file is deleted afterwards unless keepDb.
 */
export function restoreTest(dir: string, opts: { keepDb?: boolean } = {}): RestoreResult {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8")) as Manifest;
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "pchq-restore-"));
  const dbFile = path.join(scratch, "restore.sqlite");
  const db = openSqlite(dbFile);
  const result: RestoreResult = {
    ok: true,
    checked_at: new Date().toISOString(),
    sqlite_file: opts.keepDb ? dbFile : null,
    tables: {},
    errors: [],
  };
  try {
    for (const [table, entry] of Object.entries(manifest.tables)) {
      let rows: Row[];
      try {
        rows = readTableFile(dir, entry);
      } catch (e) {
        result.errors.push((e as Error).message);
        continue;
      }
      const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      if (cols.length === 0) cols.push("id");
      db.exec(`CREATE TABLE ${quoteIdent(table)} (${cols.map(quoteIdent).join(", ")})`);
      const insert = db.prepare(
        `INSERT INTO ${quoteIdent(table)} (${cols.map(quoteIdent).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
      );
      db.exec("BEGIN");
      for (const r of rows) insert.run(...cols.map((c) => sqliteValue(r[c])));
      db.exec("COMMIT");
      const restored = Number(db.prepare(`SELECT count(*) AS n FROM ${quoteIdent(table)}`).get()?.n ?? -1);
      const distinct = Number(db.prepare(`SELECT count(DISTINCT "id") AS n FROM ${quoteIdent(table)}`).get()?.n ?? -1);
      result.tables[table] = { manifest_rows: entry.rows, restored_rows: restored, distinct_ids: distinct };
      if (restored !== entry.rows) result.errors.push(`${table}: manifest ${entry.rows} rows, restored ${restored}.`);
      if (distinct !== entry.rows) result.errors.push(`${table}: ${distinct} distinct ids for ${entry.rows} rows.`);
    }
  } finally {
    db.close();
    if (!opts.keepDb) fs.rmSync(scratch, { recursive: true, force: true });
  }
  result.ok = result.errors.length === 0;
  return result;
}
