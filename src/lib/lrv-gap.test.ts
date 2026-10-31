import { test } from "node:test";
import assert from "node:assert/strict";
import { lrvGapSentence, lrvLightnessGap, lrvToLstar, usableLrv } from "./lrv-gap";

// Stored rows, 2026-10-31. Supabase returns numerics as strings.
const ironOre = { lab: { L: 28.35, a: -0.44, b: 1.21 }, lrv: "5.6" }; // SW 7069
const notreDame = { lab: { L: 28.58, a: -1.24, b: -0.43 }, lrv: "7.6" }; // BM CSP-570
const naval = { lab: { L: 25.15, a: -1.37, b: -10.96 }, lrv: "4.5" }; // SW 6244
const northSea = { lab: { L: 24.65, a: -1.38, b: -12.41 }, lrv: "6" }; // BM CC-932, whole-number LRV

test("lrvToLstar matches CIE L* at known points", () => {
  assert.equal(lrvToLstar(100), 100);
  assert.ok(Math.abs(lrvToLstar(18.42) - 50) < 0.01);
  assert.ok(Math.abs(lrvToLstar(5.6) - ironOre.lab.L) < 0.1); // SW's LRV follows its swatch
});

test("usableLrv drops missing and impossible values", () => {
  assert.equal(usableLrv(null), null);
  assert.equal(usableLrv(""), null);
  assert.equal(usableLrv("0"), null);
  assert.equal(usableLrv(101), null);
  assert.equal(usableLrv("7.6"), 7.6);
});

test("Iron Ore and Notre Dame: Nearly identical swatches, LRVs say Notre Dame is lighter", () => {
  const gap = lrvLightnessGap(ironOre, notreDame, 1.97);
  assert.ok(gap);
  assert.equal(gap.lighter, "b");
  assert.ok(gap.deltaE >= 2);
});

test("a whole-number LRV is read at its most favorable rounding and can still flag", () => {
  // North Sea's 6 is read as 5.5; the gap to Naval still leaves Nearly identical.
  const gap = lrvLightnessGap(naval, northSea, 1.01);
  assert.ok(gap);
  assert.equal(gap.lighter, "b");
});

test("rounding alone never adds a note", () => {
  const a = { lab: { L: 89.2, a: 0.5, b: 4 }, lrv: 75 };
  const b = { lab: { L: 89.3, a: 0.6, b: 4.2 }, lrv: "75.4" };
  assert.equal(lrvLightnessGap(a, b, 0.4), null);
});

test("LRVs that agree with the swatches add nothing", () => {
  const shifted = { lab: { L: 28.5, a: -0.6, b: 0.9 }, lrv: "5.7" };
  assert.equal(lrvLightnessGap(ironOre, shifted, 0.4), null);
});

test("Very similar pairs flag when the LRVs make them a visible difference", () => {
  const a = { lab: { L: 60, a: 2, b: 8 }, lrv: 28 };
  const b = { lab: { L: 61, a: 4, b: 10 }, lrv: 45 };
  const gap = lrvLightnessGap(a, b, 3);
  assert.ok(gap);
  assert.equal(gap.lighter, "b");
  assert.equal(lrvLightnessGap(a, b, 6), null, "nothing is worse than Visible difference");
});

test("a missing LRV or score means no note", () => {
  assert.equal(lrvLightnessGap({ ...ironOre, lrv: null }, notreDame, 1.97), null);
  assert.equal(lrvLightnessGap(ironOre, notreDame, NaN), null);
});

test("the sentence names the lighter color, by brand when the brands differ", () => {
  const gap = lrvLightnessGap(ironOre, notreDame, 1.97)!;
  assert.equal(
    lrvGapSentence({ name: "Iron Ore", brandName: "Sherwin-Williams" }, { name: "Notre Dame", brandName: "Benjamin Moore" }, gap),
    "Benjamin Moore Notre Dame (LRV 7.6) reflects more light than Sherwin-Williams Iron Ore (LRV 5.6). That gap is bigger than the swatches show, so the Benjamin Moore color may look lighter on the wall.",
  );
  assert.match(
    lrvGapSentence({ name: "Iron Ore", brandName: "Behr" }, { name: "Notre Dame", brandName: "Behr" }, gap),
    /so Notre Dame may look lighter/,
  );
});
