import { test } from "node:test";
import assert from "node:assert/strict";
import { generateColorLede, generateMetaDescription, nearestMatchesPerBrand } from "./color-description";
import { capMeta } from "./text";

function color(over: Record<string, unknown> = {}) {
  return {
    name: "Agreeable Gray",
    color_number: "7029",
    hex: "#D1CBC1",
    lrv: 60,
    undertone: "Neutral",
    color_family: "gray",
    brand: { name: "Sherwin-Williams", slug: "sherwin-williams" },
    ...over,
  } as never;
}

function match(name: string, brand: string, de: number) {
  return {
    id: name,
    delta_e_score: de,
    match_color: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      hex: "#cccccc",
      brand: { name: brand, slug: brand.toLowerCase().replace(/\s+/g, "-") },
    },
  } as never;
}

// ---- generateColorLede ----

test("lede cites the color's own data and nearest match", () => {
  const led = generateColorLede(color(), [
    match("Doves Wings", "Dutch Boy", 1.1),
    match("Wish", "Benjamin Moore", 3),
  ]);
  assert.match(led, /Agreeable Gray/);
  assert.match(led, /#D1CBC1/);
  assert.match(led, /LRV 60/);
  assert.match(led, /Doves Wings/); // nearest match cited
  assert.match(led, /nearly identical/i); // delta_e 1.1 → nearly identical
  // Brands with something very similar: Dutch Boy (1.1) and Benjamin Moore (3).
  assert.match(led, /with very similar options from 2 other brands\./);
  assert.doesNotMatch(led, /equivalent/i);
});

test("lede counts brands, not match rows, and drops the clause at zero", () => {
  const rows = [
    ...Array.from({ length: 49 }, (_, i) => match(`Far ${i}`, "Behr", 9 + i / 10)),
    match("Near", "Dutch Boy", 1.2),
  ];
  const led = generateColorLede(color(), rows);
  assert.doesNotMatch(led, /49|more/);
  assert.match(led, /Near from Dutch Boy \(nearly identical\), with very similar options from 1 other brand\./);
});

test("lede with only visible differences says so and asks for a sample", () => {
  const led = generateColorLede(color(), [match("Far", "RAL", 7), match("Farther", "Behr", 9)]);
  assert.match(led, /Far from RAL \(visible difference\)\. No brand in our data has a very similar match, so compare a physical sample before buying\.$/);
  assert.doesNotMatch(led, /very similar options/);
});

test("lede names a verified brand, not Colorhouse, as the nearest match", () => {
  const led = generateColorLede(color(), [match("Odd", "Colorhouse", 0.5), match("Wish", "Benjamin Moore", 3)]);
  assert.match(led, /closest cross-brand match is Wish from Benjamin Moore/);
  assert.match(led, /from 2 other brands/); // Colorhouse still counts as a brand with a close match
});

test("lede does not repeat a code the name already ends with", () => {
  const led = generateColorLede(color({ name: "Ultra Pure White 1850", color_number: "1850" }), []);
  assert.match(led, /^Ultra Pure White 1850 is a /);
  assert.doesNotMatch(led, /1850 1850/);
  assert.match(generateColorLede(color({ name: "Black", color_number: "BLACK" }), []), /^Black is a /);
});

test("lede drops an undertone the Lab values contradict", () => {
  const tan = generateColorLede(color({ name: "Shakespeare Tan", undertone: "Neutral", lab_a: -0.25, lab_b_val: 24.7 }), []);
  assert.doesNotMatch(tan, /undertone/);
  const lace = generateColorLede(color({ lab_a: -1.54, lab_b_val: 2.17 }), []);
  assert.match(lace, /a neutral undertone/);
});

test("legacy lede is the pre-MP-40 text, equivalents count and all", () => {
  const led = generateColorLede(color({ undertone: "Neutral", lab_a: -0.25, lab_b_val: 24.7 }), [match("A", "Behr", 1), match("B", "PPG", 9)], { legacy: true });
  assert.match(led, /a neutral undertone/);
  assert.match(led, /with 1 more equivalent across other brands\./);
});

// ---- generateMetaDescription ----

function perBrand(...brands: Array<[string, number]>) {
  return nearestMatchesPerBrand(brands.map(([b, de], i) => match(`M${i}`, b, de)) as never);
}

test("meta 'and N more' is the other brands with a match minus the named ones", () => {
  const all = ["Sherwin-Williams", "Benjamin Moore", "Behr", "PPG", "Valspar", "Dunn-Edwards", "Kilz", "Vista Paint", "RAL", "Hirshfield's", "Dutch Boy", "Farrow & Ball"];
  // Source is Sherwin-Williams: 11 other brands have a match, 3 are named.
  const meta = generateMetaDescription(color(), perBrand(...all.slice(1).map((b, i): [string, number] => [b, i])));
  assert.match(meta, /Compare matches across Benjamin Moore, Behr, PPG, and 8 more\.$/);
  assert.doesNotMatch(meta, /10 more/);
  assert.match(meta, /^Sherwin-Williams Agreeable Gray \(7029\): gray, LRV 60, neutral undertone\./);
});

test("meta drops 'and N more' when nothing is left and names only brands with a match", () => {
  const meta = generateMetaDescription(color(), perBrand(["Behr", 1], ["PPG", 2]));
  assert.match(meta, /Compare matches across Behr and PPG\.$|Compare matches across Behr, and PPG\.$/);
  assert.doesNotMatch(meta, /more/);
  const none = generateMetaDescription(color(), []);
  assert.doesNotMatch(none, /Compare matches across/);
});

test("meta uses a colon, not an em dash, and the legacy text keeps its dash", () => {
  assert.doesNotMatch(generateMetaDescription(color(), perBrand(["Behr", 1])), /—/);
  assert.match(generateMetaDescription(color(), [], { legacy: true }), /\(7029\) — gray, LRV 60, neutral undertone\. Compare matches across Benjamin Moore, Behr, PPG, and 10 more\./);
});

test("capMeta keeps a description with former-name and variant suffixes at 160 or fewer", () => {
  const base = generateMetaDescription(color({ name: "A Very Long Paint Color Name That Keeps Going", color_number: "PPU18-06" }), perBrand(["Behr", 1], ["PPG", 2], ["Benjamin Moore", 3], ["Valspar", 4]));
  const full = `${base} (variant 2) Previously listed as Another Rather Long Former Name Here.`;
  const capped = capMeta(full);
  assert.ok(capped.length <= 160, `${capped.length}`);
  assert.match(capped, /\.\.\.$/);
  assert.equal(capMeta("short"), "short");
});

test("two different colors produce different ledes", () => {
  const a = generateColorLede(color(), [match("Doves Wings", "Dutch Boy", 1.1)]);
  const b = generateColorLede(
    color({ name: "Repose Gray", color_number: "7015", hex: "#CCC9C0", lrv: 58 }),
    [match("Classic Silver", "Behr", 2.2)],
  );
  assert.notEqual(a, b);
});

test("lede handles missing lrv/undertone and zero matches gracefully", () => {
  const led = generateColorLede(color({ lrv: null, undertone: null }), []);
  assert.match(led, /Agreeable Gray/);
  assert.doesNotMatch(led, /LRV/);
  assert.doesNotMatch(led, /closest cross-brand/); // no match clause when none
});

test("lede uses 'an' before a vowel family", () => {
  const orange = generateColorLede(color({ name: "Tangerine", color_family: "orange" }), []);
  assert.match(orange, /Tangerine 7029 is an orange paint color/);
  const offWhite = generateColorLede(color({ name: "Alabaster", color_family: "off-white" }), []);
  assert.match(offWhite, /Alabaster 7029 is an off-white paint color/);
  const gray = generateColorLede(color(), []);
  assert.match(gray, /is a gray paint color/);
});

test("legacy lede keeps the fixed 'a' article for frozen head-color pages", () => {
  const led = generateColorLede(color({ name: "Alabaster", color_family: "off-white" }), [], { legacy: true });
  assert.match(led, /Alabaster 7029 is a off-white paint color/);
  const gray = generateColorLede(color(), [], { legacy: true });
  assert.equal(gray, generateColorLede(color(), []));
});

// ---- nearestMatchesPerBrand ----

test("nearestMatchesPerBrand: one per brand, sorted best-first", () => {
  const ms = [
    match("A", "Behr", 4),
    match("B", "Behr", 2),
    match("C", "PPG", 1),
    match("D", "Valspar", 6),
  ];
  const r = nearestMatchesPerBrand(ms as never);
  assert.deepEqual(
    r.map((m) => m.match_color.name),
    ["C", "B", "D"], // PPG(1), Behr(best=2), Valspar(6)
  );
});
