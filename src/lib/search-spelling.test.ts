import { test } from "node:test";
import assert from "node:assert/strict";
import { correctName, editDistance, isWeakResult, nameWords } from "./search-spelling";

const words = {
  aegean: 3, teal: 40, harmonious: 1, gold: 120, shiitake: 1, worn: 6, greige: 9, gray: 300,
  pageant: 4, green: 400, agreeable: 1, alabaster: 2, mineral: 8, mist: 30, mint: 25,
};

test("editDistance counts an adjacent swap as one edit", () => {
  assert.equal(editDistance("agean", "aegean", 1), 1);
  assert.equal(editDistance("gery", "grey", 1), 1);
  assert.equal(editDistance("abc", "xyzw", 1), 2);
});

test("correctName fixes the zero-result terms from Plausible", () => {
  assert.equal(correctName("agean", words), "aegean");
  assert.equal(correctName("harmonius gold", words), "harmonious gold");
  assert.equal(correctName("shitake", words), "shiitake");
  assert.equal(correctName("worn greig", words), null); // "greig" is still a prefix of "greige"
  assert.equal(correctName("worn grige", words), "worn greige");
});

test("correctName leaves real words, short words and far-off words alone", () => {
  assert.equal(correctName("agreeable gray", words), null);
  assert.equal(correctName("tan", words), null);
  assert.equal(correctName("xylophone", words), null);
});

test("correctName prefers the word used in more names on a tie", () => {
  // "minst" is one edit from both "mint" and "mist"; mist is in more names.
  assert.equal(correctName("minst mineral", words), "mist mineral");
});

test("correctName keeps the first letter and leaves a short last word alone", () => {
  assert.equal(correctName("agea", words), null);
  assert.equal(correctName("teal pagent", { ...words, pageant: 4 }), "teal pageant");
  assert.equal(correctName("xold teal", words), null); // no x-word near "xold"
});

test("isWeakResult: only mid-word hits are weak", () => {
  assert.equal(isWeakResult("agean", ["Pageant Green", "Pageant Song"]), true);
  assert.equal(isWeakResult("aegean", ["Aegean Teal"]), false);
  assert.equal(isWeakResult("agean", []), true);
});

test("nameWords drops punctuation and short words", () => {
  assert.deepEqual(nameWords("Farrow's Cream"), ["farrows", "cream"]);
  assert.deepEqual(nameWords("Off-White No. 3"), ["off", "white"]);
});
