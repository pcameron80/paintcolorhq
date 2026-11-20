import { test } from "node:test";
import assert from "node:assert/strict";
import { extractVariantSuffix, isCodeOnlyName, isColorIndexable, isMatchIndexable, MATCH_INDEX_MAX_DE } from "./indexing";
const color = { slug: "sea-salt-6204", color_number: "6204", name: "Sea Salt", lrv: 63, color_family: "gray", undertone: "neutral" };
test("sitemap eligibility preserves sparse, code-only and duplicate exclusions", () => {
  assert.equal(isColorIndexable(color), true);
  assert.equal(isColorIndexable({ ...color, name: "YL-W15", color_number: "YL-W15", slug: "yl-w15-yl-w15" }), false);
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

test("a counter that is part of the slug is not a variant: Vista casa-blanca-c-7 and Behr almond-latte-n260-2", () => {
  const vista = { ...color, name: "Casa Blanca", slug: "casa-blanca-c-7", color_number: "0008" };
  assert.equal(isColorIndexable(vista), true);
  assert.equal(extractVariantSuffix("casa-blanca-c-7", "0008"), "");
  const behr = { ...color, name: "Almond Latte", slug: "almond-latte-n260-2", color_number: "N260-2" };
  assert.equal(isColorIndexable(behr), true);
  assert.equal(extractVariantSuffix("almond-latte-n260-2", "N260-2"), "");
});

test("a variant is a slug whose color number sits right before the -N suffix", () => {
  assert.equal(extractVariantSuffix("sea-salt-6204-2", "6204"), " (variant 2)");
  assert.equal(isColorIndexable({ ...color, slug: "sea-salt-6204-2" }), false);
  assert.equal(extractVariantSuffix("agreeable-gray-7029-3", "7029"), " (variant 3)");
  // Without a color number the suffix alone still reads as a variant.
  assert.equal(extractVariantSuffix("sea-salt-2", null), " (variant 2)");
});

test("a -2-2 slug is a variant of its primary", () => {
  assert.equal(extractVariantSuffix("some-name-n100-2-2", "N100-2"), " (variant 2)");
});

test("a short real name is not code-only unless it is the color number", () => {
  assert.equal(isCodeOnlyName("Oh So Vo", "8001-40G"), false);
  assert.equal(isCodeOnlyName("H2O", "CC-878"), false);
  assert.equal(isCodeOnlyName("YL-W15", "YL-W15"), true);
  assert.equal(isCodeOnlyName("PPU5-16", "PPU5-16"), false); // "PPU" is a 3-letter run
  assert.equal(isCodeOnlyName("", "X"), true);
  // Without a number the name alone decides, as before.
  assert.equal(isCodeOnlyName("YL-W15"), true);
  assert.equal(isCodeOnlyName("Red"), false);
  assert.equal(isColorIndexable({ ...color, name: "Oh So Vo", slug: "oh-so-vo-8001-40g", color_number: "8001-40G" }), true);
  assert.equal(isColorIndexable({ ...color, name: "H2O", slug: "h2o-cc-878", color_number: "CC-878" }), true);
});

test("a match page is not indexable when its source color has a code-only name", () => {
  assert.equal(isMatchIndexable({ slug: "yl-w15-yl-w15", name: "YL-W15", color_number: "YL-W15" }, 1), false);
  assert.equal(isMatchIndexable({ slug: "h2o-cc-878", name: "H2O", color_number: "CC-878" }, 1), true);
});

test("the match gate is a named constant, stricter than the Very similar label", () => {
  assert.equal(MATCH_INDEX_MAX_DE, 3);
  assert.equal(isMatchIndexable(color, MATCH_INDEX_MAX_DE - 0.001), true);
  assert.equal(isMatchIndexable(color, MATCH_INDEX_MAX_DE), false);
});
