import { test } from "node:test";
import assert from "node:assert/strict";
import { pickBestPerBrand, missingBigThree, bigThreeRows } from "./best-per-brand";

const sorted = [
  { id: "a", brandSlug: "ppg", deltaE: 0.4 },
  { id: "b", brandSlug: "ppg", deltaE: 0.6 },
  { id: "c", brandSlug: "behr", deltaE: 0.9 },
  { id: "d", brandSlug: "sherwin-williams", deltaE: 1.2 },
  { id: "e", brandSlug: "behr", deltaE: 1.3 },
];

test("keeps the first (closest) entry per brand, in Delta E order", () => {
  assert.deepEqual(
    pickBestPerBrand(sorted).map((m) => m.id),
    ["a", "c", "d"],
  );
});

test("names the big-three brands with no entry", () => {
  assert.deepEqual(missingBigThree(pickBestPerBrand(sorted)), ["benjamin-moore"]);
  assert.deepEqual(missingBigThree([]), ["sherwin-williams", "benjamin-moore", "behr"]);
});

test("big-three rows come back in SW, BM, Behr order and skip missing brands", () => {
  const best = pickBestPerBrand(sorted);
  assert.deepEqual(
    bigThreeRows(best).map((m) => m.brandSlug),
    ["sherwin-williams", "behr"],
  );
});
