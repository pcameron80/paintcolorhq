import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseClamped,
  parseCount,
  wallArea,
  rawGallons,
  wholeGallons,
  gallonsAndQuarts,
  formatCans,
  roomSizeTable,
} from "./paint-quantity";
import { COVERAGE_PRODUCTS, planningRate, formatRange } from "./paint-coverage";

test("11x11 room, 8 ft, 1 coat, no openings: 1.01 raw, 2 whole gallons, 1 gallon + 1 quart", () => {
  const { paintableArea } = wallArea({ lengthFt: 11, widthFt: 11, heightFt: 8, doors: 0, windows: 0 });
  assert.equal(paintableArea, 352);
  const raw = rawGallons(paintableArea, 1, 350);
  assert.equal(raw.toFixed(2), "1.01");
  assert.equal(wholeGallons(raw), 2);
  assert.deepEqual(gallonsAndQuarts(raw), { gallons: 1, quarts: 1 });
  assert.equal(formatCans(gallonsAndQuarts(raw)), "1 gallon + 1 quart");
});

test("exact multiples do not gain a phantom gallon", () => {
  assert.equal(wholeGallons(rawGallons(700, 1, 350)), 2);
  assert.deepEqual(gallonsAndQuarts(2), { gallons: 2, quarts: 0 });
  assert.equal(wholeGallons(0), 0);
});

test("a remainder of three quarts or more rounds up to a gallon", () => {
  assert.deepEqual(gallonsAndQuarts(1.6), { gallons: 2, quarts: 0 });
  assert.deepEqual(gallonsAndQuarts(1.4), { gallons: 1, quarts: 2 });
  assert.deepEqual(gallonsAndQuarts(0.2), { gallons: 0, quarts: 1 });
  assert.equal(formatCans({ gallons: 0, quarts: 2 }), "2 quarts");
});

test("parsers clamp junk instead of defaulting a blank height to 8", () => {
  assert.equal(parseClamped("", 0, 30), 0);
  assert.equal(parseClamped("0", 0, 30), 0);
  assert.equal(parseClamped("-4", 0, 30), 0);
  assert.equal(parseClamped("1e9", 0, 30), 30);
  assert.equal(parseClamped("Infinity", 0, 30), 0);
  assert.equal(parseCount("2.7", 0, 20), 2);
  assert.equal(parseCount("", 1, 3), 1);
});

test("doors and windows larger than the wall leave zero paintable area", () => {
  const a = wallArea({ lengthFt: 2, widthFt: 2, heightFt: 2, doors: 5, windows: 5 });
  assert.equal(a.paintableArea, 0);
  assert.equal(rawGallons(a.paintableArea, 2, 350), 0);
});

test("12x12 FAQ example stays true: 333 sq ft, 2 gallons for two coats", () => {
  const rows = roomSizeTable(350, 400);
  const row = rows.find((r) => r.lengthFt === 12 && r.widthFt === 12)!;
  assert.equal(row.paintableArea, 333);
  assert.equal(row.wallGallons, 2);
  assert.equal(rows[0].label, "10 x 10 ft");
  assert.equal(rows.at(-1)!.label, "16 x 20 ft");
});

test("every coverage row is sourced, dated and sane", () => {
  const ids = new Set<string>();
  for (const p of COVERAGE_PRODUCTS) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`);
    ids.add(p.id);
    assert.match(p.sourceUrl, /^https:\/\//);
    assert.match(p.readDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.sqftPerGal.max >= 200 && p.sqftPerGal.max <= 600, p.id);
    if (p.sqftPerGal.min !== undefined) assert.ok(p.sqftPerGal.min <= p.sqftPerGal.max, p.id);
    assert.ok(planningRate(p) > 0);
    assert.ok(!/behr|kilz/i.test(p.brand));
  }
  assert.equal(formatRange(COVERAGE_PRODUCTS[0]), "350 to 400");
});
