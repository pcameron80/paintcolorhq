import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyColorFamily, refineColorFamily, hexToRgb } from "./color-math";

// Pinned examples for the family classifier (MP-27, 2026-10-24). `stored` is
// the family the colors table held before the rewrite, so each case checks
// both the refine pass over existing rows and a fresh import.
const CASES: { name: string; hex: string; stored: string; want: string }[] = [
  { name: "SW 6258 Tricorn Black", hex: "#2f2f30", stored: "gray", want: "black" },
  { name: "SW 6990 Caviar", hex: "#313031", stored: "gray", want: "black" },
  { name: "BM HC-190 Black", hex: "#313132", stored: "gray", want: "black" },
  { name: "SW 2935 English Ivy", hex: "#002f24", stored: "black", want: "green" },
  { name: "BM CW-520 Palace Green", hex: "#778d6f", stored: "gray", want: "green" },
  { name: "BM 629 Weeping Willow", hex: "#64856a", stored: "gray", want: "green" },
  { name: "SW 6126 Navajo White", hex: "#e9dcc6", stored: "orange", want: "off-white" },
  { name: "BM 228 Shakespeare Tan", hex: "#cbb98d", stored: "orange", want: "beige" },
  { name: "Dunn-Edwards DEFD05 Parisian Plum", hex: "#6e5370", stored: "gray", want: "purple" },
  { name: "SW 7069 Iron Ore", hex: "#434341", stored: "gray", want: "gray" },
  { name: "SW 7036 Accessible Beige", hex: "#d1c7b8", stored: "beige", want: "beige" },
  // Guard for rule (e): a muted, source-labeled yellow is not a tan.
  { name: "Lime Chiffon", hex: "#eee4ba", stored: "yellow", want: "yellow" },
  // Guard for rule (g): a pale mauve-pink stays pink, not beige.
  { name: "Rose Glow", hex: "#e4cfdc", stored: "pink", want: "pink" },
  { name: "Abalone Shell", hex: "#dbc7bd", stored: "orange", want: "beige" },
  { name: "Wisp of Mauve", hex: "#d9c7be", stored: "orange", want: "beige" },
];

function rgb(hex: string) {
  const v = hexToRgb(hex);
  assert.ok(v, `bad hex ${hex}`);
  return v;
}

for (const c of CASES) {
  test(`${c.name} refines ${c.stored} -> ${c.want}`, () => {
    const { r, g, b } = rgb(c.hex);
    assert.equal(refineColorFamily(c.stored, r, g, b), c.want);
  });
  test(`${c.name} classifies as ${c.want} on a fresh import`, () => {
    const { r, g, b } = rgb(c.hex);
    assert.equal(classifyColorFamily(r, g, b), c.want);
  });
}

test("BM HC-188 Essex Green is not black", () => {
  const { r, g, b } = rgb("#28372f");
  assert.notEqual(refineColorFamily("neutral", r, g, b), "black");
  assert.notEqual(classifyColorFamily(r, g, b), "black");
});

test("tan is never produced", () => {
  for (let v = 0; v < 256; v += 17) {
    for (const fam of ["orange", "yellow", "brown", "beige", "gray", "neutral"]) {
      assert.notEqual(refineColorFamily(fam, 200, 170 - (v % 60), v), "tan");
    }
  }
});

// refine-color-families.ts re-runs refine over stored rows, so a second pass
// must never move a color the first pass already placed.
test("refine is idempotent across an RGB grid and every source family", () => {
  const families = ["white", "off-white", "black", "gray", "neutral", "beige", "brown",
    "red", "orange", "yellow", "green", "blue", "purple", "pink"];
  for (let r = 0; r < 256; r += 15) {
    for (let g = 0; g < 256; g += 15) {
      for (let b = 0; b < 256; b += 15) {
        for (const fam of families) {
          const once = refineColorFamily(fam, r, g, b);
          assert.equal(refineColorFamily(once, r, g, b), once, `${fam} rgb(${r},${g},${b})`);
        }
        const fresh = classifyColorFamily(r, g, b);
        assert.equal(refineColorFamily(fresh, r, g, b), fresh, `fresh rgb(${r},${g},${b})`);
      }
    }
  }
});
