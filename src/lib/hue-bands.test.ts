import { test } from "node:test";
import assert from "node:assert/strict";
import { HUE_BANDS, getHueBand, inHueBand, labPrefilter, toLch } from "./hue-bands";
import { hueBandCanonical } from "./hue-band-pagination";

// Lab values read from the colors table (2026-10-11).
const KNOWN: Record<string, { l: number; a: number; b: number; band: string | null }> = {
  "SW Krypton": { l: 77.2, a: -2.2, b: -2.4, band: "blue-gray" },
  "SW Gale Force": { l: 28.3, a: -3.9, b: -7.4, band: "blue-gray" },
  "SW Oceanside": { l: 34.8, a: -16.2, b: -16.2, band: "blue-green" },
  "BM Rust": { l: 51.3, a: 30.2, b: 34.3, band: "rust" },
  "SW Cavern Clay": { l: 51.7, a: 23.3, b: 24.3, band: "rust" },
  "SW Boothbay-type green gray": { l: 72, a: -3.2, b: 0.1, band: null },
  "SW Real Red": { l: 43, a: 57, b: 33, band: null },
  "neutral gray": { l: 60, a: 0, b: 0, band: null },
};

function bandsFor(lab: { l: number; a: number; b: number }) {
  return HUE_BANDS.filter((band) => inHueBand(band, lab)).map((band) => band.slug);
}

test("known colors land in the expected band and nowhere else", () => {
  for (const [name, { band, ...lab }] of Object.entries(KNOWN)) {
    assert.deepEqual(bandsFor(lab), band ? [band] : [], name);
  }
});

test("blue-gray yields to blue-green in the shared hue overlap", () => {
  const lab = { l: 55, a: -8.5, b: -8.5 }; // h 225, C 12
  assert.equal(toLch(lab).hue.toFixed(0), "225");
  assert.deepEqual(bandsFor(lab), ["blue-green"]);
});

test("no color can belong to two bands", () => {
  for (let l = 20; l <= 92; l += 12) for (let a = -40; a <= 40; a += 3) for (let b = -40; b <= 60; b += 3) {
    assert.ok(bandsFor({ l, a, b }).length <= 1, `${l},${a},${b}`);
  }
});

test("prefilter rectangle contains every point the exact test accepts", () => {
  for (const band of HUE_BANDS) {
    const f = labPrefilter(band);
    for (let l = 20; l <= 92; l += 6) for (let a = -60; a <= 60; a += 1.5) for (let b = -60; b <= 60; b += 1.5) {
      if (!inHueBand(band, { l, a, b })) continue;
      assert.ok(a >= f.aMin && a <= f.aMax && b >= f.bMin && b <= f.bMax && l >= f.lMin && l <= f.lMax, `${band.slug} ${l},${a},${b}`);
    }
  }
});

test("band definitions are unique and resolvable", () => {
  assert.equal(new Set(HUE_BANDS.map((b) => b.slug)).size, HUE_BANDS.length);
  for (const b of HUE_BANDS) assert.equal(getHueBand(b.slug), b);
  assert.equal(getHueBand("purple"), undefined);
});

test("canonical urls: page 1 is bare, later pages are self-canonical", () => {
  assert.equal(hueBandCanonical("rust", 1), "https://www.paintcolorhq.com/colors/hue/rust");
  assert.equal(hueBandCanonical("rust", 3), "https://www.paintcolorhq.com/colors/hue/rust?page=3");
});
