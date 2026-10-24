import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  SNAPSHOT_TABLES,
  checkAgainstPrevious,
  checkFetchedTable,
  latestManifest,
  pruneList,
  restoreTest,
  writeTableFile,
  type Manifest,
} from "./snapshot-lib.ts";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "pchq-backup-test-"));

test("the snapshot never includes the derived match table", () => {
  assert.ok(!(SNAPSHOT_TABLES as readonly string[]).includes("cross_brand_matches"));
  assert.ok(SNAPSHOT_TABLES.includes("colors") && SNAPSHOT_TABLES.includes("projects"));
});

test("checkFetchedTable: a clean page set passes", () => {
  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.deepEqual(checkFetchedTable("t", rows, { before: 3, after: 3 }), []);
  // Rows appended while paging are fine.
  assert.deepEqual(checkFetchedTable("t", rows, { before: 2, after: 4 }), []);
});

test("checkFetchedTable: empty, short, duplicated and id-less fetches fail", () => {
  assert.match(checkFetchedTable("t", [], { before: 0, after: 0 }).join(), /0 rows/);
  assert.deepEqual(checkFetchedTable("t", [], { before: 0, after: 0 }, { allowEmpty: true }), []);
  assert.match(checkFetchedTable("t", [{ id: 1 }], { before: 2, after: 2 }).join(), /lost while paging/);
  assert.match(checkFetchedTable("t", [{ id: 1 }, { id: 1 }], { before: 2, after: 2 }).join(), /1 duplicate ids/);
  assert.match(checkFetchedTable("t", [{ id: 1 }, { name: "x" }], { before: 2, after: 2 }).join(), /1 rows have no id/);
});

test("checkAgainstPrevious: fails on a drop over 5% or a missing table, passes growth", () => {
  assert.deepEqual(checkAgainstPrevious({ colors: 26720 }, undefined), []);
  assert.deepEqual(checkAgainstPrevious({ colors: 26000 }, { colors: 26720 }), []); // 2.7% drop
  assert.deepEqual(checkAgainstPrevious({ colors: 30000 }, { colors: 26720 }), []);
  assert.match(checkAgainstPrevious({ colors: 25000 }, { colors: 26720 }).join(), /6\.4% drop/);
  assert.match(checkAgainstPrevious({}, { projects: 21 }).join(), /missing from this one/);
  assert.deepEqual(checkAgainstPrevious({ api_referrers: 0 }, { api_referrers: 0 }), []);
});

test("pruneList keeps the newest N dated folders and ignores everything else", () => {
  const names = ["2026-10-05", "files", "2026-10-26", "2026-10-12", "2026-10-19.partial", "2026-10-19"];
  assert.deepEqual(pruneList(names, 2), ["2026-10-05", "2026-10-12"]);
  assert.deepEqual(pruneList(names, 12), []);
});

function writeSnapshot(dir: string, data: Record<string, Record<string, unknown>[]>): Manifest {
  const tables = Object.fromEntries(
    Object.entries(data).map(([t, rows]) => [t, writeTableFile(dir, t, rows, { before: rows.length, after: rows.length })]),
  );
  const m: Manifest = {
    format: 1,
    date: path.basename(dir),
    created_at: new Date().toISOString(),
    git_sha: "test",
    supabase_host: "example.supabase.co",
    tables,
    skipped: [],
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(m));
  return m;
}

test("restoreTest: a snapshot restores into SQLite with matching counts", () => {
  const dir = path.join(tmp(), "2026-10-26");
  fs.mkdirSync(dir);
  writeSnapshot(dir, {
    brands: [{ id: "b1", name: "Sherwin-Williams", slug: "sherwin-williams" }],
    colors: [
      { id: "c1", brand_id: "b1", hex: "#F2EEE5", lrv: 84, is_archived: false, alternate_numbers: ["SW 7005"] },
      { id: "c2", brand_id: "b1", hex: "#D8D2C5", lrv: null, is_archived: true, alternate_numbers: null },
    ],
    api_referrers: [],
  });
  const res = restoreTest(dir);
  assert.equal(res.ok, true, res.errors.join("; "));
  assert.deepEqual(res.tables.colors, { manifest_rows: 2, restored_rows: 2, distinct_ids: 2 });
  assert.deepEqual(res.tables.api_referrers, { manifest_rows: 0, restored_rows: 0, distinct_ids: 0 });
  assert.equal(res.sqlite_file, null);
});

test("restoreTest: a corrupted file fails the sha256 check", () => {
  const dir = path.join(tmp(), "2026-10-26");
  fs.mkdirSync(dir);
  writeSnapshot(dir, { brands: [{ id: "b1" }] });
  fs.writeFileSync(path.join(dir, "brands.json.gz"), "not gzip");
  const res = restoreTest(dir);
  assert.equal(res.ok, false);
  assert.match(res.errors.join(), /sha256/);
});

test("latestManifest returns the newest complete snapshot, skipping today and partials", () => {
  const root = tmp();
  for (const d of ["2026-10-12", "2026-10-19", "2026-10-26"]) {
    fs.mkdirSync(path.join(root, d));
    writeSnapshot(path.join(root, d), { brands: [{ id: d }] });
  }
  fs.mkdirSync(path.join(root, "2026-10-27.partial"));
  assert.equal(latestManifest(root)?.date, "2026-10-26");
  assert.equal(latestManifest(root, "2026-10-26")?.date, "2026-10-19");
  assert.equal(latestManifest(path.join(root, "nope")), undefined);
});
