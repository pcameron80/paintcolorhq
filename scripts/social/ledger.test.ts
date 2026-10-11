import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ledgerPath, mergeLedgers, readLedger, writeLedger, LEGACY_REPO_PATH } from "./ledger.ts";
import { migrateLedger } from "./migrate-ledgers.ts";

let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pchq-ledger-"));
  process.env.PCHQ_SOCIAL_STATE_DIR = path.join(tmp, "state");
});

const read = (p: string) => fs.readFileSync(p, "utf8");
const here = (f: string) => fs.readFileSync(new URL(f, import.meta.url), "utf8");

test("ledgerPath honours PCHQ_SOCIAL_STATE_DIR and names each ledger", () => {
  assert.equal(ledgerPath("facebook"), path.join(tmp, "state", "facebook-published.json"));
  assert.notEqual(ledgerPath("pinterest"), ledgerPath("instagram"));
});

test("readLedger: a missing ledger throws (an empty one would repost everything)", () => {
  assert.throws(() => readLedger(path.join(tmp, "nope.json")), /Ledger not found/);
  assert.deepEqual(readLedger(path.join(tmp, "nope.json"), { allowMissing: true }), {});
});

test("readLedger: corrupt or non-object JSON throws even with allowMissing", () => {
  const bad = path.join(tmp, "bad.json");
  fs.writeFileSync(bad, '{"a": {"publishedAt": ');
  assert.throws(() => readLedger(bad, { allowMissing: true }), SyntaxError);
  fs.writeFileSync(bad, "[]");
  assert.throws(() => readLedger(bad, { allowMissing: true }), /not a JSON object/);
});

test("writeLedger creates the folder, round-trips, and leaves no temp file", () => {
  const file = ledgerPath("instagram");
  writeLedger(file, { k1: { mediaId: "m1", publishedAt: "2026-10-01T16:00:00Z" } });
  assert.deepEqual(readLedger(file), { k1: { mediaId: "m1", publishedAt: "2026-10-01T16:00:00Z" } });
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ["instagram-published.json"]);
  assert.ok(read(file).endsWith("}\n"));
});

test("mergeLedgers: union of keys, newest publishedAt wins, ties keep the first", () => {
  const a = {
    old: { pinId: "1", publishedAt: "2026-08-01T10:00:00Z" },
    tie: { pinId: "a", publishedAt: "2026-09-01T10:00:00Z" },
    onlyA: { pinId: "x", publishedAt: "2026-09-02T10:00:00Z" },
  };
  const b = {
    old: { pinId: "2", publishedAt: "2026-09-15T10:00:00Z" }, // cooldown re-pin
    tie: { pinId: "b", publishedAt: "2026-09-01T10:00:00Z" },
    onlyB: { pinId: "y", publishedAt: "2026-09-03T10:00:00Z" },
  };
  const m = mergeLedgers(a, b);
  assert.deepEqual(Object.keys(m).sort(), ["old", "onlyA", "onlyB", "tie"]);
  assert.equal(m.old.pinId, "2");
  assert.equal(m.tie.pinId, "a");
  assert.equal(mergeLedgers(b, a).old.pinId, "2", "order does not matter for different dates");
});

function fakeRepo(name: keyof typeof LEGACY_REPO_PATH, ledger: object): string {
  const repo = path.join(tmp, "repo");
  const file = path.join(repo, LEGACY_REPO_PATH[name]);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(ledger));
  return repo;
}

test("migrateLedger copies the checkout's ledger into the state folder", () => {
  const repo = fakeRepo("facebook", { k1: { postId: "p1", publishedAt: "2026-10-10T18:00:00Z" } });
  const r = migrateLedger("facebook", repo);
  assert.deepEqual([r.existing, r.fromRepo, r.merged], [0, 1, 1]);
  assert.equal(readLedger(ledgerPath("facebook")).k1.publishedAt, "2026-10-10T18:00:00Z");
});

test("migrateLedger is idempotent and never drops entries already in the state folder", () => {
  writeLedger(ledgerPath("facebook"), {
    k1: { postId: "p1", publishedAt: "2026-10-10T18:00:00Z" },
    k2: { postId: "p2", publishedAt: "2026-10-11T18:00:00Z" }, // posted after the move
  });
  // A stale checkout copy from before the move.
  const repo = fakeRepo("facebook", { k1: { postId: "p1", publishedAt: "2026-10-10T18:00:00Z" } });
  migrateLedger("facebook", repo);
  const again = migrateLedger("facebook", repo);
  assert.deepEqual([again.existing, again.fromRepo, again.merged], [2, 1, 2]);
  assert.deepEqual(Object.keys(readLedger(ledgerPath("facebook"))).sort(), ["k1", "k2"]);
});

test("migrateLedger --dry-run writes nothing", () => {
  const repo = fakeRepo("instagram", { k1: { mediaId: "m", publishedAt: "2026-10-10T16:00:00Z" } });
  assert.equal(migrateLedger("instagram", repo, true).merged, 1);
  assert.equal(fs.existsSync(ledgerPath("instagram")), false);
});

test("migrateLedger refuses to create an empty ledger when neither copy exists", () => {
  assert.throws(() => migrateLedger("pinterest", path.join(tmp, "repo")), /refusing to create an empty one/);
  assert.equal(fs.existsSync(ledgerPath("pinterest")), false);
});

test("publishers read the shared ledgers, not repo-relative files", () => {
  for (const [file, name] of [
    ["../pinterest-publish.ts", "pinterest"],
    ["../facebook-publish.ts", "facebook"],
    ["../instagram-publish.ts", "instagram"],
  ]) {
    const src = here(file);
    assert.match(src, new RegExp(`ledgerPath\\("${name}"\\)`), `${file} must use ledgerPath`);
    assert.doesNotMatch(src, /published\.json"\)/, `${file} must not resolve a ledger inside the repo`);
  }
});

test("installer maps each launchd label to its own template and job script", () => {
  const sh = here("./install-schedules.sh");
  const rows = [...sh.matchAll(/"(com\.paintcolorhq\.[\w-]+)\|([^|]+)\|([^|]+)\|([^"]+)"/g)];
  assert.deepEqual(
    rows.map((r) => r[1]).sort(),
    [
      "com.paintcolorhq.facebook-drip",
      "com.paintcolorhq.instagram-drip",
      "com.paintcolorhq.pinterest-analytics",
      "com.paintcolorhq.pinterest-drip",
    ],
  );
  for (const [, label, template, job, script] of rows) {
    assert.ok(template.endsWith(`/${label}.plist.template`), `${label} template`);
    assert.equal(label, `com.paintcolorhq.${job}`, `${label} job name`);
    assert.ok(fs.existsSync(new URL(`../../${template}`, import.meta.url)), template);
    assert.ok(fs.existsSync(new URL(`../../${script}`, import.meta.url)), script);
  }
  // The daily-quota cadence guard in queue.test.ts checks drip.sh; make sure
  // the Pinterest drip agent is still the thing that runs it.
  assert.ok(rows.some((r) => r[3] === "pinterest-drip" && r[4] === "scripts/pinterest/drip.sh"));
});

test("runner hands the state folder to the jobs and resets the worktree to origin", () => {
  const sh = here("./run-job.sh");
  assert.match(sh, /export PCHQ_SOCIAL_STATE_DIR="\$DIR"/);
  assert.match(sh, /checkout -q -f --detach "origin\/\$BRANCH"/);
});
