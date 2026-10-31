import { test } from "node:test";
import assert from "node:assert/strict";
import { median, sectorOf, bandOf, NAME_WORDS, toCsv } from "../study-palette-stats";

test("median handles odd, even and rounds to one decimal", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([44, 44.5]), 44.3); // 44.25 rounds half up
  assert.ok(Number.isNaN(median([])));
});

test("hue sectors wrap through 0 degrees for red", () => {
  assert.equal(sectorOf(350), "Red and pink");
  assert.equal(sectorOf(10), "Red and pink");
  assert.equal(sectorOf(30), "Orange and tan");
  assert.equal(sectorOf(90), "Yellow, cream and gold");
  assert.equal(sectorOf(260), "Blue");
  assert.equal(sectorOf(344.9), "Purple");
});

test("lightness bands use L* floors", () => {
  assert.equal(bandOf(85), "Very light");
  assert.equal(bandOf(84.9), "Light");
  assert.equal(bandOf(50), "Mid");
  assert.equal(bandOf(29.9), "Very dark");
});

test("'White' means the last word, so White Oak is not a white", () => {
  const white = NAME_WORDS.find((w) => w.word === "white")!.re;
  assert.ok(white.test("Alabaster White"));
  assert.ok(white.test("Antique Whites"));
  assert.ok(!white.test("White Oak"));
  assert.ok(!white.test("Whitewater Bay"));
  const gray = NAME_WORDS.find((w) => w.word === "gray")!.re;
  assert.ok(gray.test("Agreeable Gray") && gray.test("Grey Owl") && !gray.test("Greyhound"));
});

test("CSV escapes commas and leaves missing values blank", () => {
  const row = {
    name: "Hirshfield's",
    slug: "hirshfields",
    catalog: 10,
    current: 10,
    retired: 0,
    uniquePct: 14.8,
    verified: 9,
    nearNeutralPct: 25.1,
    nearWhitePct: 10.6,
    lrvColors: null,
    medianLrv: null,
    lrv80PlusPct: null,
    lrvUnder20Pct: null,
    lrvSource: "published by the brand, not yet reconciled; left out",
  };
  const [header, line] = toCsv([row]).trim().split("\n");
  assert.equal(header.split(",")[0], "brand");
  assert.equal(line, `Hirshfield's,10,10,0,14.8,9,25.1,10.6,,,,,"published by the brand, not yet reconciled; left out"`);
});
