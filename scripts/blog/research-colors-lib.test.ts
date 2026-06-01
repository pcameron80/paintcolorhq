import { test } from "node:test";
import assert from "node:assert/strict";
import { parseColorRef, bestMatchPerBrand, formatResearchMarkdown } from "./research-colors-lib.ts";

test("parseColorRef splits brand and color on the first slash", () => {
  assert.deepEqual(parseColorRef("benjamin-moore/hale-navy-hc-154"), {
    brandSlug: "benjamin-moore",
    colorSlug: "hale-navy-hc-154",
  });
});

test("parseColorRef trims whitespace", () => {
  assert.deepEqual(parseColorRef("  sherwin-williams/naval-6244 "), {
    brandSlug: "sherwin-williams",
    colorSlug: "naval-6244",
  });
});

test("parseColorRef throws on missing slash or empty side", () => {
  assert.throws(() => parseColorRef("nope"));
  assert.throws(() => parseColorRef("brand/"));
  assert.throws(() => parseColorRef("/color"));
});

test("bestMatchPerBrand picks the closest match per other brand and excludes source brand", () => {
  const matches = [
    { delta_e_score: 0.0, match_color: { name: "Self", slug: "self", hex: "#000", brand: { name: "Benjamin Moore", slug: "benjamin-moore" } } },
    { delta_e_score: 3.0, match_color: { name: "Naval", slug: "naval-6244", hex: "#34405A", brand: { name: "Sherwin-Williams", slug: "sherwin-williams" } } },
    { delta_e_score: 2.1, match_color: { name: "Indigo", slug: "indigo", hex: "#35415B", brand: { name: "Sherwin-Williams", slug: "sherwin-williams" } } },
    { delta_e_score: 1.8, match_color: { name: "Composed", slug: "composed", hex: "#333", brand: { name: "Behr", slug: "behr" } } },
  ];
  const rows = bestMatchPerBrand(matches, "benjamin-moore");
  assert.equal(rows.length, 2); // BM excluded, one SW (the 2.1), one Behr
  assert.equal(rows[0].brandName, "Behr"); // sorted by brandName asc
  assert.equal(rows[1].brandName, "Sherwin-Williams");
  assert.equal(rows[1].slug, "indigo"); // 2.1 beat 3.0
  assert.equal(rows[1].deltaE, 2.1);
});

test("formatResearchMarkdown includes topic, color facts, and a match table row", () => {
  const md = formatResearchMarkdown("best blue paint colors", [
    {
      brandName: "Benjamin Moore", brandSlug: "benjamin-moore", name: "Hale Navy", colorSlug: "hale-navy-hc-154",
      colorNumber: "HC-154", hex: "#3B444B", lrv: 8, undertone: "green", family: "blue",
      matches: [{ brandName: "Behr", brandSlug: "behr", name: "Composed", slug: "composed", hex: "#333", deltaE: 1.8 }],
    },
  ]);
  assert.match(md, /best blue paint colors/);
  assert.match(md, /Hale Navy/);
  assert.match(md, /#3B444B/);
  assert.match(md, /LRV.*8/);
  assert.match(md, /Behr.*Composed.*1\.8/s);
  assert.match(md, /\/colors\/behr\/composed/); // match rows carry a link target
});
