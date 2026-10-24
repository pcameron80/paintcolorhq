import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLrvFilters } from "./lrv-finder";

const FAMILIES = ["white", "gray", "blue"];

test("defaults: all four brands, full range, highest first", () => {
  assert.deepEqual(parseLrvFilters({}, FAMILIES), {
    brand: null, family: null, min: 0, max: 100, sort: "high", publishedOnly: false,
  });
});

test("reads valid filters", () => {
  assert.deepEqual(
    parseLrvFilters({ brand: "behr", family: "white", min: "85", max: "94.5", sort: "low", published: "1" }, FAMILIES),
    { brand: "behr", family: "white", min: 85, max: 94.5, sort: "low", publishedOnly: true },
  );
});

test("ignores unknown brands and families, clamps and orders the range", () => {
  const f = parseLrvFilters({ brand: "valspar", family: "plaid", min: "120", max: "-5" }, FAMILIES);
  assert.equal(f.brand, null);
  assert.equal(f.family, null);
  assert.equal(f.min, 0);
  assert.equal(f.max, 100);
  const g = parseLrvFilters({ min: "abc", max: "" }, FAMILIES);
  assert.equal(g.min, 0);
  assert.equal(g.max, 100);
});
