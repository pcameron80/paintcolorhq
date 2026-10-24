import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import {
  activeFrozen,
  checkPayload,
  expectedMatchCount,
  loadFrozenList,
  matchCountError,
  parseFrozenList,
  snapshotPath,
  todayUtc,
} from "./frozen-match";
import { HEAD_COLOR_PUSH } from "../../src/lib/head-colors";
import { MATCH_TITLE_TEST_PAIRS } from "../../src/lib/match-title-test";

const ID = "355ff048-6b5e-4aa6-b4a4-ee66055068ec";

test("expected match count is colors x (brands - 1) x 5", () => {
  assert.equal(expectedMatchCount(26720, 13), 1_603_200);
  assert.equal(expectedMatchCount(10, 1), 0);
});

test("integrity gate passes only on the exact count", () => {
  assert.equal(matchCountError(1_603_200, 26720, 13), null);
  assert.match(matchCountError(0, 26720, 13) ?? "", /reseed is in progress/);
  assert.match(matchCountError(1_603_199, 26720, 13) ?? "", /expected 26720 colors x 12 brands x 5/);
  assert.match(matchCountError(1_603_201, 26720, 13) ?? "", /1603201 rows/);
  assert.match(matchCountError(0, 0, 0) ?? "", /empty/);
});

test("frozen entries stay active strictly before until", () => {
  const list = parseFrozenList([{ id: ID, key: "a/b", until: "2026-11-28", reason: "r" }]);
  assert.equal(activeFrozen(list, "2026-11-27").length, 1);
  assert.equal(activeFrozen(list, "2026-11-28").length, 0);
  assert.equal(todayUtc(new Date("2026-10-24T23:59:59Z")), "2026-10-24");
});

test("parseFrozenList rejects malformed and duplicate entries", () => {
  const ok = { id: ID, key: "a/b", until: "2026-11-28", reason: "r" };
  assert.throws(() => parseFrozenList({}), /array/);
  assert.throws(() => parseFrozenList([{ ...ok, id: "nope" }]), /UUID/);
  assert.throws(() => parseFrozenList([{ ...ok, until: "11/28" }]), /YYYY-MM-DD/);
  assert.throws(() => parseFrozenList([{ ...ok, reason: "" }]), /reason/);
  assert.throws(() => parseFrozenList([ok, ok]), /duplicate/);
});

test("checkPayload enforces shape and ownership", () => {
  const entry = (n: number) => ({ id: `${ID}:m${n}`, delta_e_score: n, match_color: { id: `m${n}` } });
  const good = JSON.stringify(Array.from({ length: 50 }, (_, i) => entry(i)));
  assert.equal(checkPayload(ID, good, 50), null);
  assert.match(checkPayload(ID, good, 51) ?? "", /expected at least 51/);
  assert.match(checkPayload(ID, "{", 1) ?? "", /JSON/);
  assert.match(checkPayload("other", good, 1) ?? "", /does not belong/);
});

test("the committed frozen list covers every head color and match-test source, with snapshots", () => {
  const list = loadFrozenList();
  const keys = new Set(list.map((e) => e.key));
  for (const k of HEAD_COLOR_PUSH) assert.ok(keys.has(k), `head color ${k} is not frozen`);
  for (const pair of MATCH_TITLE_TEST_PAIRS) {
    const [brand, matchSlug] = pair.split("/");
    const source = `${brand}/${matchSlug.replace(/-to-[a-z-]+$/, "")}`;
    assert.ok(keys.has(source), `match-test source ${source} is not frozen`);
  }
  for (const e of list) {
    const file = snapshotPath(e.id);
    assert.ok(fs.existsSync(file), `missing snapshot for ${e.key}`);
    assert.equal(checkPayload(e.id, fs.readFileSync(file, "utf-8"), 50), null, e.key);
  }
});
