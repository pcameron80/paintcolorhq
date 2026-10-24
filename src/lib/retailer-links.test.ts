import { test } from "node:test";
import assert from "node:assert/strict";
import { getRetailerLinks, nameSlug } from "./retailer-links";

function official(brandSlug: string, name: string, num?: string, family?: string): string | undefined {
  return getRetailerLinks(brandSlug, brandSlug, name, num, family)[0]?.url;
}

function names(brandSlug: string, name: string, num?: string, family?: string): string[] {
  return getRetailerLinks(brandSlug, brandSlug, name, num, family).map((l) => l.retailerName);
}

test("nameSlug folds accents and drops apostrophes", () => {
  assert.equal(nameSlug("Elephant's Breath"), "elephants-breath");
  assert.equal(nameSlug("Angel’s Wing"), "angels-wing");
  assert.equal(nameSlug("Banana Crème"), "banana-creme");
  assert.equal(nameSlug("Jalapeño Tango"), "jalapeno-tango");
});

test("PPG links to the Pittsburgh Paints color page, not the ppgpaints.com interstitial", () => {
  assert.equal(official("ppg", "Field Poppy", "1195-7", "red"), "https://www.pittsburghpaints.com/ppg-colors/field-poppy");
  // A repeated name resolves to the page whose <title> carries our code.
  assert.equal(official("ppg", "Misty Moor", "1116-4", "gray"), "https://www.pittsburghpaints.com/ppg-colors/misty-moor-2");
});

test("a PPG color missing from the map gets no official link but keeps Home Depot", () => {
  assert.deepEqual(names("ppg", "Not A Real Color", "0000-0", "red"), ["Home Depot"]);
});

test("Valspar links come from the sitemap map and keep Lowe's", () => {
  assert.equal(
    official("valspar", "Western Sandstone", "1001-10A", "beige"),
    "https://www.valspar.com/en/colors/browse-colors/lowes/neutral/western-sandstone-1001-10a",
  );
  assert.deepEqual(names("valspar", "Retired Color", "9999-9Z", "red"), ["Lowe's"]);
});

test("Sherwin-Williams whites use the live white family segment", () => {
  assert.equal(
    official("sherwin-williams", "Alabaster", "7008", "white"),
    "https://www.sherwin-williams.com/en-us/color/color-family/white-paint-colors/SW7008-alabaster",
  );
  assert.equal(
    official("sherwin-williams", "Pure White", "7005", "off-white"),
    "https://www.sherwin-williams.com/en-us/color/color-family/white-paint-colors/SW7005-pure-white",
  );
});

test("Sherwin-Williams non-white and Benjamin Moore links are unchanged", () => {
  assert.equal(
    official("sherwin-williams", "Naval", "6244", "blue"),
    "https://www.sherwin-williams.com/en-us/color/color-family/blue-paint-colors/SW6244-naval",
  );
  assert.equal(
    official("benjamin-moore", "Hale Navy", "HC-154", "blue"),
    "https://www.benjaminmoore.com/en-us/paint-colors/color/hc-154/hale-navy",
  );
});

test("Farrow & Ball links to the color's own US store page", () => {
  assert.equal(official("farrow-ball", "Elephant's Breath", "229", "gray"), "https://www.farrow-ball.com/us/paint/elephants-breath");
});

test("Dutch Boy and Vista link to the color page, or nothing when unmapped", () => {
  assert.equal(
    official("dutch-boy", "True Black", "438-7DB", "black"),
    "https://www.dutchboy.com/en/colors/color-library/paint/black/true-black-438-7db",
  );
  assert.deepEqual(names("dutch-boy", "Unlisted", "000W", "white"), ["Menards"]);
  assert.equal(official("vista-paint", "3am Latte", "0175", "beige"), "https://www.vistapaint.com/colors/Neutrals/175-3am-latte/");
  assert.deepEqual(names("vista-paint", "Unlisted", "K-0", "white"), []);
});

test("Hirshfield's links to its color library, not a Color Basics article", () => {
  assert.equal(official("hirshfields", "Any", "1", "white"), "https://www.hirshfields.com/color-inspiration/browse-our-colors/");
});
