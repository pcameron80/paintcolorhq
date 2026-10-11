import test from "node:test";
import assert from "node:assert/strict";
import {
  MATCH_TITLE_TEST_PAIRS,
  isMatchTitleTestPair,
  matchClosenessLabel,
  matchTestDescription,
  matchTestTitle,
} from "./match-title-test";

test("title uses searcher phrasing and stays within 60 chars", () => {
  assert.equal(matchTestTitle("White Dove", "OC-17", "Behr"), "White Dove (OC-17) Behr Equivalent: Closest Match");
  assert.equal(matchTestTitle("Swiss Coffee", "OC-45", "Sherwin-Williams"), "Swiss Coffee (OC-45) Sherwin-Williams Equivalent");
  assert.ok(matchTestTitle("Accessible Beige", "7036", "Behr").length <= 60);
});

test("closeness is plain language", () => {
  assert.equal(matchClosenessLabel(0.4), "Nearly identical");
  assert.equal(matchClosenessLabel(1.8), "Very similar");
  assert.equal(matchClosenessLabel(4), "Visible difference");
});

test("description names match, next options, sample caveat, no raw number", () => {
  const d = matchTestDescription("Benjamin Moore", "White Dove", "OC-17", "Behr", [
    { name: "Ultra Pure White", colorNumber: "1850", deltaE: 0.7 },
    { name: "Swiss Coffee", colorNumber: "12", deltaE: 1.4 },
    { name: "Cottage White", colorNumber: "13", deltaE: 2.0 },
  ])!;
  assert.match(d, /Closest Behr match for Benjamin Moore White Dove OC-17: Ultra Pure White 1850, nearly identical\./);
  assert.match(d, /Next closest: Swiss Coffee 12/);
  assert.match(d, /confirm with a sample/);
  assert.ok(!/\d\.\d/.test(d));
  assert.ok(!d.includes("—"));
  assert.ok(d.length <= 170);
  assert.equal(matchTestDescription("A", "B", null, "C", []), null);
});

test("test list is explicit and excludes everything else", () => {
  assert.equal(MATCH_TITLE_TEST_PAIRS.size, 21);
  assert.ok(isMatchTitleTestPair("benjamin-moore", "white-dove-oc-17-to-behr"));
  assert.ok(!isMatchTitleTestPair("benjamin-moore", "white-dove-oc-17-to-dunn-edwards"));
});
