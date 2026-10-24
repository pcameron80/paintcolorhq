import { test } from "node:test";
import assert from "node:assert/strict";
import { codeRegex, normalizeSearchQuery as n, pgQuote } from "./search-query";

const re = (key: string) => new RegExp(codeRegex(key, true), "i");

test("trailing space and plain names", () => {
  const a = n("Alabaster ");
  assert.equal(a.name, "alabaster");
  assert.equal(a.brandSlug, null);
  assert.deepEqual(a.codes, []);
  assert.deepEqual(a.nameTerms, ["alabaster"]);
});

test("brand phrase at the start or end becomes a brand filter", () => {
  assert.deepEqual(
    [n("Sherwin Williams Alabaster").brandSlug, n("Sherwin Williams Alabaster").name],
    ["sherwin-williams", "alabaster"],
  );
  assert.deepEqual([n("Behr Swiss Coffee").brandSlug, n("Behr Swiss Coffee").name], ["behr", "swiss coffee"]);
  assert.equal(n("Sherwin-Williams ").brandSlug, "sherwin-williams");
  assert.equal(n("Sherwin-Williams ").name, "");
  assert.equal(n("bm white dove").brandSlug, "benjamin-moore");
  assert.equal(n("Evergreen 107 ppg").brandSlug, "ppg");
  assert.equal(n("farrow and ball ").brandSlug, "farrow-ball");
  assert.equal(n("Farrow & Ball Farrow's Cream").brandSlug, "farrow-ball");
  assert.equal(n("Farrow & Ball Farrow's Cream").name, "farrow's cream");
  // Swiss Coffee is not Sherwin-Williams; Coral is not RAL.
  assert.equal(n("swiss coffee").brandSlug, null);
  assert.equal(n("coral reef").brandSlug, null);
});

test("a bare 'farrow' is a name, not a brand", () => {
  assert.equal(n("Farrow").brandSlug, null);
  assert.equal(n("Farrow").name, "farrow");
  const fc = n("Farrow's Cream");
  assert.equal(fc.brandSlug, null);
  assert.deepEqual(fc.nameTerms, ["farrow_s cream"]);
  // Typed without the apostrophe, it still tries the possessive.
  assert.ok(n("Farrows cream").nameTerms.includes("farrow_s cream"));
});

test("Sherwin-Williams codes in every spelling", () => {
  for (const q of ["SW 7029", "SW7029", "SW-7029", "sw 7029", "#SW7029", "SW\u20117029"]) {
    const r = n(q);
    assert.equal(r.brandSlug, "sherwin-williams", q);
    assert.deepEqual(r.codes, ["7029"], q);
    assert.equal(r.name, "", q);
  }
});

test("grey and gray search the same", () => {
  const r = n("agreeable grey");
  assert.deepEqual(r.nameTerms, ["agreeable gr_y"]);
  assert.equal(n("Repose Gray").nameTerms[0], "repose gr_y");
});

test("Benjamin Moore lettered codes, spaced, joined or hyphenated", () => {
  for (const q of ["HC 154", "HC-154", "hc154"]) {
    const r = n(q);
    assert.deepEqual(r.codes, ["HC154"], q);
    assert.ok(r.codeValues.includes("HC-154"), q);
    assert.ok(re(r.codes[0]).test("HC-154"), q);
    // Benjamin Moore 154 (Mango Punch) is a different color.
    assert.ok(!re(r.codes[0]).test("154"), q);
  }
  const oc = n("OC17");
  assert.deepEqual(oc.codes, ["OC17"]);
  assert.ok(oc.codeValues.includes("OC-17"));
  assert.ok(re("OC17").test("OC-17"));
  assert.ok(!re("OC17").test("OC-170"));
  // OC-117 (Simply White) lives only in alternate_numbers.
  assert.ok(n("OC-117").codeValues.includes("OC-117"));
  assert.ok(n("oc 117").codeValues.includes("OC-117"));
});

test("PPG, Dunn-Edwards, Behr Hispanic and separator-free codes", () => {
  const ppg = n("PPG 1095-4");
  assert.equal(ppg.brandSlug, "ppg");
  assert.ok(ppg.codes.includes("10954"));
  assert.ok(ppg.codes.includes("PPG10954"));
  assert.ok(re("10954").test("1095-4"));
  assert.ok(re("PPG10954").test("PPG1095-4"));

  assert.deepEqual(n("DE6374").codes, ["DE6374"]);
  assert.deepEqual(n("DE 6374").codes, ["DE6374"]);

  const hisp = n("PPH-61 (HISP)");
  assert.deepEqual(hisp.codes, ["PPH61HISP"]);
  assert.equal(hisp.name, "");
  assert.ok(re("PPH61HISP").test("PPH-61 (HISP)"));

  assert.ok(re(n("hdcnt11").codes[0]).test("HDC-NT-11"));
  assert.ok(re(n("90rr 63/139").codes[0]).test("90RR 63/139"));
});

test("name plus code keeps both", () => {
  const r = n("Sherwin-Williams Cinnamon Slate SW 9599");
  assert.equal(r.brandSlug, "sherwin-williams");
  assert.equal(r.name, "cinnamon slate");
  assert.deepEqual(r.codes, ["9599"]);
  const om = n("October Mist 1495");
  assert.equal(om.name, "october mist");
  assert.deepEqual(om.codes, ["1495"]);
});

test("comma lists keep the first entry", () => {
  assert.equal(n("white, dove").name, "white");
  assert.equal(n(" Agreeable Gray, ").name, "agreeable gray");
  assert.equal(n(",,a, simply white").name, "simply white");
  assert.equal(n(",").name, "");
});

test("RGB triplets become hex", () => {
  assert.equal(n("rgb(240,236,228)").hex, "#f0ece4");
  assert.equal(n("RGB (240, 236, 228)").hex, "#f0ece4");
  assert.equal(n(" 239, 80, 122").hex, "#ef507a");
  assert.equal(n("251,251,251").hex, "#fbfbfb");
  // Out of range or unprefixed spaces: not RGB.
  assert.equal(n("300, 20, 20").hex, null);
  assert.equal(n("100 200 50").hex, null);
});

test("hex codes in the shapes people paste", () => {
  assert.equal(n("a8a29a").hex, "#a8a29a");
  assert.equal(n("#D6D0C4").hex, "#d6d0c4");
  assert.equal(n('"#EF507A"').hex, "#ef507a");
  assert.equal(n("##869167").hex, "#869167");
  assert.equal(n("# B2A6AA").hex, "#b2a6aa");
  assert.equal(n("hex a8a29a").hex, "#a8a29a");
  const named = n("B4C6D8 ~ Light Steel Blue");
  assert.equal(named.hex, "#b4c6d8");
  assert.equal(named.name, "light steel blue");
  assert.equal(n("DARK GOLD - #b58d1f").hex, "#b58d1f");
  assert.equal(n("DARK GOLD - #b58d1f").name, "dark gold");
  // An explicit hex is not also a code; a bare one may be (DEFD39).
  assert.deepEqual(n("#a8a29a").codes, []);
  assert.deepEqual(n("defd39").codes, ["DEFD39"]);
  // Words made of hex letters stay words.
  assert.equal(n("facade").hex, null);
});

test("filter-breaking characters never reach PostgREST", () => {
  const evil = n('abc%,name.eq.x),or(id.gt.0)*:"\\');
  for (const t of evil.nameTerms) assert.ok(!/[%,()*:"\\]/.test(t), t);
  for (const v of evil.codeValues) assert.ok(/^[A-Za-z0-9-]+$/.test(v), v);
  assert.equal(pgQuote('a"b\\c'), '"abc"');
  // Wildcards typed by the user are not wildcards.
  assert.ok(!n("50% gray").nameTerms[0].includes("%"));
  assert.ok(!n("a_b").nameTerms[0].includes("_"));
});

test("Unicode dashes and curly apostrophes normalize", () => {
  assert.deepEqual(n("HC\u2013154").codes, ["HC154"]);
  assert.deepEqual(n("Lauren\u2019s lace").nameTerms, ["lauren_s lace"]);
  assert.deepEqual(n("Martha&#8217;s").nameTerms, ["martha_s"]);
});
