import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCopyCounts, findCountProblems } from "../../scripts/lib/copy-counts";
import { BRAND_COUNT, moreBrands } from "./site-facts";

const texts = (src: string) => findCountProblems(src, 13).map((f) => f.text);

test("moreBrands is the remainder after the named brands", () => {
  assert.equal(moreBrands(3), BRAND_COUNT - 3);
});

test("catalog totals must equal BRAND_COUNT", () => {
  assert.deepEqual(texts("across 13 brands"), []);
  assert.deepEqual(texts("all 13 supported brands"), []);
  assert.deepEqual(texts("from 13 brands&apos; catalogs"), []);
  assert.deepEqual(texts("12 of the 13 brands we track"), []);
  assert.deepEqual(texts("we cover 11 major paint brands"), ["11 major paint brands"]);
  assert.deepEqual(texts("over 26,000 colors across 14 major brands"), ["14 major brands"]);
  assert.deepEqual(texts("across ${BRAND_COUNT} brands"), []);
  // Subsets are not catalog totals.
  assert.deepEqual(texts("the top 7 brands"), []);
});

test("other counts must be below BRAND_COUNT", () => {
  assert.deepEqual(texts("its closest equivalents in 12 other brands"), []);
  assert.deepEqual(texts("Benjamin Moore, Behr, and 10 other brands"), []);
  assert.deepEqual(texts("closest matches from the other 12 brands"), []);
  assert.deepEqual(texts("closest matches in 13 other brands"), ["13 other brands"]);
});

test("typed 'N more' remainders of the catalog are rejected", () => {
  assert.deepEqual(texts("Behr & 11 more brands"), ["& 11 more"]);
  assert.deepEqual(texts("Behr, and 10 more."), ["and 10 more"]);
  assert.deepEqual(texts("Behr, and 11 more paint manufacturers"), ["and 11 more"]);
  assert.deepEqual(texts("Behr and 4 more brands"), []);
  assert.deepEqual(texts("Behr & ${moreBrands(3)} more brands"), []);
});

test("copy in src/ agrees with BRAND_COUNT", () => {
  assert.deepEqual(checkCopyCounts(process.cwd(), BRAND_COUNT), []);
});
