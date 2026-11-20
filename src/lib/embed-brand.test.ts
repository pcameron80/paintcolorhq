import { test } from "node:test";
import assert from "node:assert/strict";
import { brandCreditText, brandEmbedSnippet, brandFirst, resolveEmbedBrand } from "./embed-brand";

const brands = [
  { slug: "colorhouse", name: "Colorhouse" },
  { slug: "sherwin-williams", name: "Sherwin-Williams" },
];

test("resolves a known slug and ignores unknown or missing ones", () => {
  assert.deepEqual(resolveEmbedBrand("colorhouse", brands), brands[0]);
  assert.deepEqual(resolveEmbedBrand(["Colorhouse", "x"], brands), brands[0]);
  assert.equal(resolveEmbedBrand("nope", brands), null);
  assert.equal(resolveEmbedBrand(undefined, brands), null);
  assert.equal(resolveEmbedBrand("", brands), null);
});

test("credit line wording", () => {
  assert.equal(brandCreditText("Colorhouse"), "Find any color in Colorhouse paint, by PaintColorHQ");
});

test("snippet has a followed credit link outside the iframe pointing at the brand page", () => {
  const s = brandEmbedSnippet(brands[0]);
  assert.ok(s.includes('src="https://www.paintcolorhq.com/embed/match?brand=colorhouse"'));
  assert.ok(s.includes('<a href="https://www.paintcolorhq.com/brands/colorhouse">Find any color in Colorhouse paint, by PaintColorHQ</a>'));
  assert.ok(s.indexOf("</iframe>") < s.indexOf("<a href"));
  assert.ok(!s.includes("rel="));
  assert.ok(!s.includes("—"));
});

test("brandFirst puts the preset brand on top and drops duplicates", () => {
  const rows = [
    { brandSlug: "a", n: 1 },
    { brandSlug: "b", n: 2 },
    { brandSlug: "a", n: 3 },
  ];
  assert.deepEqual(brandFirst(rows, "b").map((r) => r.n), [2, 1, 3]);
  assert.deepEqual(brandFirst(rows, "z"), rows);
  assert.deepEqual(brandFirst(rows, "z", { brandSlug: "z", n: 9 }).map((r) => r.n), [9, 1, 2, 3]);
});
