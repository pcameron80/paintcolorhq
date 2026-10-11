import { test } from "node:test";
import assert from "node:assert/strict";
import { closenessLabel, closenessLabelLower, closenessTier } from "./closeness";

test("labels follow the 2 and 5 CIEDE2000 thresholds", () => {
  assert.equal(closenessLabel(0), "Nearly identical");
  assert.equal(closenessLabel(1.99), "Nearly identical");
  assert.equal(closenessLabel(2), "Very similar");
  assert.equal(closenessLabel(4.99), "Very similar");
  assert.equal(closenessLabel(5), "Visible difference");
  assert.equal(closenessLabel(30), "Visible difference");
});

test("lowercase helper and tier agree with the label", () => {
  assert.equal(closenessLabelLower(1), "nearly identical");
  assert.equal(closenessLabelLower(3), "very similar");
  assert.equal(closenessLabelLower(9), "visible difference");
  assert.equal(closenessTier(3), "very-similar");
});
