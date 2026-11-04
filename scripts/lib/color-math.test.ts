import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyColorFamily, refineColorFamily, familyForRow, familyFromHex, FAMILY_OVERRIDES, hexToRgb } from "./color-math";

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

// 2026-11 data audit (docs/data-audit-2026-11.md). Refine pass over stored
// rows only: a fresh import starts from the HSL family, not these labels.
const AUDIT_2026_11: { name: string; hex: string; stored: string; want: string; brand?: string }[] = [
  // (h) colored grays and neutrals
  { name: "BM HC-155 Newburyport Blue", hex: "#475667", stored: "neutral", want: "blue" },
  { name: "F&B 220 Pitch Blue", hex: "#636e8f", stored: "neutral", want: "blue" },
  { name: "Behr PPU11-07 Clary Sage", hex: "#9fa688", stored: "gray", want: "green" },
  { name: "BM 2070-20 Plum Royale", hex: "#463d51", stored: "gray", want: "purple" },
  { name: "RAL 6007 Bottle Green", hex: "#343b29", stored: "neutral", want: "green" },
  // Below the cutoff (C*/L* 0.24): keeps its label.
  { name: "BM HC-154 Hale Navy", hex: "#444c57", stored: "gray", want: "gray" },
  // Muted hue 330-20: plums are purple and dark wines red, not pink.
  { name: "Vista Concord Grape", hex: "#513e49", stored: "gray", want: "purple" },
  { name: "Behr PPU17-02 Oriental Eggplant", hex: "#533e50", stored: "gray", want: "purple" },
  { name: "Behr PPU1-02 Divine Wine", hex: "#583e3f", stored: "neutral", want: "red" },
  { name: "Valspar 1006-5B Posh Rose", hex: "#9f727d", stored: "neutral", want: "pink" },
  // Warm grays (hue 20-110) are untouched.
  { name: "SW 7029 Agreeable Gray", hex: "#d1cbc1", stored: "gray", want: "gray" },
  // (j) light reds
  { name: "BM 1318 Bed of Roses", hex: "#f7c2c7", stored: "red", want: "pink" },
  { name: "BM 2007-50 Supple Pink", hex: "#f3abb4", stored: "red", want: "pink" },
  { name: "Dunn-Edwards DE5074 Charming Cherry", hex: "#ff90a2", stored: "red", want: "pink" },
  { name: "SW 7586 Stolen Kiss (deep red)", hex: "#813235", stored: "red", want: "red" },
  // Peach carve-out from rule (e)
  { name: "BM 060 Fresh Peach", hex: "#f1c1a5", stored: "orange", want: "orange" },
  { name: "Valspar 2008-6B New Peach", hex: "#f8d0ac", stored: "orange", want: "orange" },
  { name: "Dunn-Edwards DET445 Oakley Apricot", hex: "#e0b695", stored: "orange", want: "orange" },
  { name: "BM 1167 Fox Hedge Tan", hex: "#c5a38a", stored: "orange", want: "beige" },
  { name: "Behr MQ2-41 Cavern Clay", hex: "#b39781", stored: "orange", want: "beige" },
  // (i) teal-greens
  { name: "BM 608 Erin Green", hex: "#01927b", stored: "blue", want: "green" },
  { name: "BM 2047-10 Forest Green", hex: "#184b44", stored: "blue", want: "green" },
  { name: "SW teal, brand files it Blue", hex: "#01927b", stored: "blue", want: "blue", brand: "sherwin-williams" },
  { name: "Teal at LCh hue ~195 stays blue", hex: "#3a9fae", stored: "blue", want: "blue" },
];

for (const c of AUDIT_2026_11) {
  test(`2026-11: ${c.name} refines ${c.stored} -> ${c.want}`, () => {
    const { r, g, b } = rgb(c.hex);
    assert.equal(refineColorFamily(c.stored, r, g, b, { brand: c.brand }), c.want);
  });
}

test("familyForRow applies sourced overrides before refine", () => {
  const beet = rgb("#833337");
  assert.equal(refineColorFamily("neutral", beet.r, beet.g, beet.b), "orange");
  assert.equal(familyForRow("sherwin-williams/beetroot-9695", "orange", beet.r, beet.g, beet.b), "red");
  const maritime = rgb("#b3ded7");
  assert.equal(familyForRow("benjamin-moore/maritime-blue-667", "blue", maritime.r, maritime.g, maritime.b), "blue");
  assert.equal(familyForRow("ppg/some-teal", "blue", maritime.r, maritime.g, maritime.b), "green");
  // The brand is read from the key, so SW teals stay blue.
  const erin = rgb("#01927b");
  assert.equal(familyForRow("sherwin-williams/rivulet-6760", "blue", erin.r, erin.g, erin.b), "blue");
});

test("familyFromHex (hex corrections, scan imports) keeps SW teals blue and applies overrides", () => {
  // SW Cooled Blue 6759 as stored: HSL files it blue, rule (i) would make it green.
  const cooled = rgb("#75b9ae");
  assert.equal(classifyColorFamily(cooled.r, cooled.g, cooled.b), "green");
  assert.equal(familyFromHex("sherwin-williams/cooled-blue-6759", cooled.r, cooled.g, cooled.b), "blue");
  assert.equal(familyFromHex("ppg/some-teal", cooled.r, cooled.g, cooled.b), "green");
  // Once filed green, refine never moves it back: the exemption has to hold on this path.
  assert.equal(familyForRow("sherwin-williams/cooled-blue-6759", "green", cooled.r, cooled.g, cooled.b), "green");
  const beet = rgb("#833337");
  assert.equal(familyFromHex("sherwin-williams/beetroot-9695", beet.r, beet.g, beet.b), "red");
});

test("every family override key is brand-slug/color-slug", () => {
  for (const key of Object.keys(FAMILY_OVERRIDES)) assert.match(key, /^[a-z0-9-]+\/[a-z0-9-]+$/);
});

test("refine with a brand option is idempotent too", () => {
  for (let r = 0; r < 256; r += 30) {
    for (let g = 0; g < 256; g += 30) {
      for (let b = 0; b < 256; b += 30) {
        for (const fam of ["gray", "neutral", "blue", "red", "orange"]) {
          const once = refineColorFamily(fam, r, g, b, { brand: "sherwin-williams" });
          assert.equal(refineColorFamily(once, r, g, b, { brand: "sherwin-williams" }), once);
        }
      }
    }
  }
});
