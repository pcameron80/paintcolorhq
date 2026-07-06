/**
 * Tests the paint-calculator supply-list sizing + Amazon search-link
 * construction in src/lib/painting-supplies.ts. Run: npm run test:supplies
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { getSupplyList } from "../../src/lib/painting-supplies";
import { getAmazonSearchUrl } from "../../src/lib/affiliate";

const room = {
  lengthFt: 12,
  widthFt: 14,
  heightFt: 8,
  doors: 1,
  windows: 2,
  coats: 2,
  gallons: 2,
};

test("every item links to a tagged Amazon search", () => {
  for (const item of getSupplyList(room)) {
    assert.ok(
      item.url.startsWith("https://www.amazon.com/s?k="),
      `${item.name}: should be an Amazon search link, got ${item.url}`
    );
    assert.match(
      item.url,
      /&tag=[a-z0-9-]+-20$/,
      `${item.name}: should carry an Associates tag`
    );
  }
});

test("getAmazonSearchUrl encodes the query", () => {
  const url = getAmazonSearchUrl("canvas drop cloth 9x12");
  assert.ok(url.includes("k=canvas%20drop%20cloth%209x12"));
});

test("tape rolls scale with room edges", () => {
  // 12x14, 1 door, 2 windows: perimeter 52*2 + 17 + 26 = 147 ft -> 1 roll
  const tape = getSupplyList(room).find((i) => i.name === "Painter's tape");
  assert.ok(tape);
  assert.ok(tape!.quantity.startsWith("1 roll"), `got ${tape!.quantity}`);

  // 20x22, 2 doors, 3 windows: 84*2 + 34 + 39 = 241 ft -> 2 rolls
  const bigTape = getSupplyList({
    ...room,
    lengthFt: 20,
    widthFt: 22,
    doors: 2,
    windows: 3,
  }).find((i) => i.name === "Painter's tape");
  assert.ok(bigTape!.quantity.startsWith("2 rolls"), `got ${bigTape!.quantity}`);
});

test("drop cloths scale with floor area", () => {
  // 12x14 = 168 sq ft -> 1 cloth
  const cloth = getSupplyList(room).find((i) => i.name === "Canvas drop cloth");
  assert.equal(cloth!.quantity, "1");

  // 20x22 = 440 sq ft -> 3 cloths
  const bigCloth = getSupplyList({ ...room, lengthFt: 20, widthFt: 22 }).find(
    (i) => i.name === "Canvas drop cloth"
  );
  assert.equal(bigCloth!.quantity, "3");
});

test("tray liners follow the coat count", () => {
  const liners = (coats: number) =>
    getSupplyList({ ...room, coats }).find((i) => i.name === "Paint tray and liners");
  assert.equal(liners(1)!.quantity, "1 tray, 1 liner");
  assert.equal(liners(3)!.quantity, "1 tray, 3 liners");
});

test("list stays at seven items — no padding", () => {
  assert.equal(getSupplyList(room).length, 7);
});
