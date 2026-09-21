import { test } from "node:test";
import assert from "node:assert/strict";
import { isColorIndexable, isMatchIndexable } from "./indexing";
const color = { slug: "sea-salt-6204", color_number: "6204", name: "Sea Salt", lrv: 63, color_family: "gray", undertone: "neutral" };
test("sitemap eligibility preserves sparse, code-only and duplicate exclusions", () => {
  assert.equal(isColorIndexable(color), true);
  assert.equal(isColorIndexable({ ...color, name: "YL-W15", slug: "yl-w15-yl-w15" }), false);
  assert.equal(isColorIndexable({ ...color, slug: "sea-salt-6204-2" }), false);
  assert.equal(isColorIndexable({ ...color, lrv: null, color_family: null, undertone: null }), false);
  assert.equal(isColorIndexable({ ...color, name: "Crème" }), true);
});
test("numbers ending in a variant digit are not falsely excluded", () => {
  assert.equal(isColorIndexable({ ...color, slug: "dolphin-fin-790c-3", color_number: "790C-3" }), true);
});
test("match threshold rejects absent, invalid, distant and variant matches", () => {
  for (const score of [null, NaN, Infinity, -1, 3, 4]) assert.equal(isMatchIndexable(color, score), false);
  assert.equal(isMatchIndexable(color, 2.999), true);
  assert.equal(isMatchIndexable(color, 0), true);
  assert.equal(isMatchIndexable({ ...color, slug: "sea-salt-6204-2" }, 0), false);
});
