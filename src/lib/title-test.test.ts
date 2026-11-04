import { test } from "node:test";
import assert from "node:assert/strict";
import { colorMatchesDescription, colorTitle, fitTitle, fnv1a, mixedHashBit, TITLE_MAX } from "./title-test";
import { codeSuffix, displayColorNumber } from "./text";

const t = (over: Partial<Parameters<typeof colorTitle>[0]> = {}) =>
  colorTitle({ name: "Repose Gray", brandName: "Sherwin-Williams", brandSlug: "sherwin-williams", colorNumber: "7015", variant: "", hasMatches: true, ...over });

test("the winning-arm title fits 60 characters by dropping parts in order", () => {
  // Fits whole: Behr page, short name.
  assert.equal(t({ name: "Ash", colorNumber: "N", brandName: "Behr", brandSlug: "behr" }), "Ash N by Behr: Sherwin-Williams & Benjamin Moore Matches");
  assert.equal(t({ name: "Ash", colorNumber: "", brandName: "Behr", brandSlug: "behr" }), "Ash by Behr: Sherwin-Williams & Benjamin Moore Matches");
  assert.equal(t({ name: "Ash", colorNumber: "", brandName: "Benjamin Moore", brandSlug: "benjamin-moore" }), "Ash by Benjamin Moore: Sherwin-Williams & Behr Matches");
  assert.equal(t({ name: "A", colorNumber: "", brandName: "Benjamin Moore", brandSlug: "benjamin-moore" }), "A by Benjamin Moore: Closest Sherwin-Williams & Behr Matches");
  // 66 characters whole, so "Closest" goes first, then still too long, so one brand.
  assert.equal(t({ name: "Ash", colorNumber: "N10" }), "Ash N10 by Sherwin-Williams: Benjamin Moore & Behr Matches");
  assert.equal(t(), "Repose Gray 7015 by Sherwin-Williams: Benjamin Moore Match");
});

test("every title is 60 characters or fewer and keeps name and brand when it can", () => {
  const long = t({ name: "Sunlit Meadow Morning Dew Whisper", colorNumber: "ICC-110" });
  assert.ok(long.length <= TITLE_MAX, long);
  assert.match(long, /^Sunlit Meadow Morning Dew Whisper ICC-110/);
  const huge = t({ name: "An Extremely Long And Unreasonable Paint Color Name Indeed Yes", colorNumber: "X-1" });
  assert.ok(huge.length <= TITLE_MAX, huge);
});

test("fitTitle drops 'Closest' before it drops the second brand", () => {
  const c = ["a".repeat(40) + ": Closest X & Y Matches", "a".repeat(40) + ": X & Y Matches", "short"];
  assert.equal(fitTitle(c), c[1]);
});

test("PPG shows its prefix and Sherwin-Williams codes are zero-padded", () => {
  assert.equal(displayColorNumber("ppg", "1001-5"), "PPG1001-5");
  assert.equal(displayColorNumber("ppg", "13-04"), "13-04");
  assert.equal(displayColorNumber("sherwin-williams", "20"), "0020");
  assert.equal(displayColorNumber("sherwin-williams", "6204"), "6204");
  assert.equal(displayColorNumber("behr", "N260-2"), "N260-2");
  assert.match(t({ name: "Gypsum", brandName: "PPG", brandSlug: "ppg", colorNumber: "1006-1" }), /^Gypsum PPG1006-1 by PPG/);
  assert.match(t({ name: "Peacock Plume", colorNumber: "20" }), /^Peacock Plume 0020 by Sherwin-Williams/);
});

test("a name that ends with its code does not repeat it", () => {
  assert.equal(codeSuffix("Ultra Pure White 1850", "1850"), "");
  assert.equal(codeSuffix("Black", "BLACK"), "");
  assert.equal(codeSuffix("Alabaster", "7008"), " 7008");
  assert.equal(codeSuffix("Alabaster", null), "");
  assert.doesNotMatch(t({ name: "Ultra Pure White 1850", brandName: "Behr", brandSlug: "behr", colorNumber: "1850" }), /1850 1850/);
});

test("the variant suffix stays on the title and a color with no matches gets 'Paint Color'", () => {
  assert.match(t({ variant: " (variant 2)", name: "Ash", brandName: "Behr", brandSlug: "behr" }), /^Ash 7015 by Behr \(variant 2\): /);
  assert.equal(t({ hasMatches: false, name: "Zinc Yellow", brandName: "RAL", brandSlug: "ral", colorNumber: "1018" }), "Zinc Yellow 1018 by RAL Paint Color");
});

test("mixedHashBit is a 0/1 value that is not fnv1a % 2", () => {
  let differs = 0;
  for (let i = 0; i < 200; i++) {
    const k = `sherwin-williams/color-${i}`;
    assert.ok(mixedHashBit(k) === 0 || mixedHashBit(k) === 1);
    if (mixedHashBit(k) !== fnv1a(k) % 2) differs++;
  }
  assert.ok(differs > 50 && differs < 150, `bits agree too often: ${differs}`);
});

const m = (name: string, brand: string, slug: string, de: number) =>
  ({ id: name, delta_e_score: de, match_color: { name, slug: name, hex: "#ccc", brand: { name: brand, slug } } }) as never;

test("matches description uses closeness labels, skips Colorhouse, and keeps the caveat", () => {
  const d = colorMatchesDescription({ name: "Ash", lrv: 60, undertone: "Neutral" }, [m("Odd", "Colorhouse", "colorhouse", 0.4), m("Wings", "Dutch Boy", "dutch-boy", 1.1), m("Wish", "Behr", "behr", 3)])!;
  assert.match(d, /^Closest match to Ash: Dutch Boy Wings \(nearly identical\)\./);
  assert.match(d, /3 other brands, plus LRV 60 and neutral undertone/);
  assert.ok(d.length <= 160);
  // The caveat is added when it fits; a long name gives it up before the nearest match.
  const short = colorMatchesDescription({ name: "Ash", lrv: null }, [m("Wings", "Behr", "behr", 3)])!;
  assert.match(short, /Digital match, confirm with a physical sample\.$/);
  assert.doesNotMatch(d, /close digital match|exact|near-identical/i);
});

test("matches description omits an undertone the Lab values contradict", () => {
  const d = colorMatchesDescription({ name: "Shakespeare Tan", lrv: 47.4, undertone: "Neutral", lab_a: -0.25, lab_b_val: 24.7 }, [m("X", "Behr", "behr", 2.5)])!;
  assert.doesNotMatch(d, /undertone/);
  assert.match(d, /\(very similar\)/);
});

test("matches description is null when only Colorhouse matches", () => {
  assert.equal(colorMatchesDescription({ name: "X", lrv: null }, [m("Odd", "Colorhouse", "colorhouse", 1)]), null);
});
