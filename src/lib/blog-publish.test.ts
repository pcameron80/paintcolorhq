import { test } from "node:test";
import assert from "node:assert/strict";
import { isLiveAt, publishInstant } from "./blog-publish";

test("date-only publish dates mean midnight Eastern (EDT)", () => {
  assert.equal(new Date(publishInstant("2026-10-27")).toISOString(), "2026-10-27T04:00:00.000Z");
  // 22:46 EDT on 10-26 is 02:46Z on 10-27: still scheduled.
  assert.equal(isLiveAt("2026-10-27", new Date("2026-10-27T02:46:00Z")), false);
  assert.equal(isLiveAt("2026-10-27", new Date("2026-10-27T04:00:00Z")), true);
});

test("date-only publish dates mean midnight Eastern (EST)", () => {
  assert.equal(new Date(publishInstant("2026-12-03")).toISOString(), "2026-12-03T05:00:00.000Z");
});

test("DST change days resolve to local midnight", () => {
  assert.equal(new Date(publishInstant("2026-11-01")).toISOString(), "2026-11-01T04:00:00.000Z");
  assert.equal(new Date(publishInstant("2026-03-08")).toISOString(), "2026-03-08T05:00:00.000Z");
});

test("strings with a time are parsed as written", () => {
  assert.equal(publishInstant("2026-10-27T12:00:00Z"), Date.parse("2026-10-27T12:00:00Z"));
});
