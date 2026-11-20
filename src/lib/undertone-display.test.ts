import { test } from "node:test";
import assert from "node:assert/strict";
import { displayUndertone } from "./undertone-display";

// Real rows, Lab values from the catalog (2026-11-03).
const shakespeareTan = { undertone: "Neutral", lab_a: -0.25, lab_b_val: 24.7 }; // BM 228
const chantillyLace = { undertone: "Neutral", lab_a: -1.5401, lab_b_val: 2.167 }; // BM 2121-70
const cosmicBlue = { undertone: "Neutral", lab_a: -4.76, lab_b_val: -40.43 }; // Valspar 4008-10C

test("Shakespeare Tan and Cosmic Blue lose the neutral label, Chantilly Lace keeps it", () => {
  assert.equal(displayUndertone(shakespeareTan), null);
  assert.equal(displayUndertone(cosmicBlue), null);
  assert.equal(displayUndertone(chantillyLace), "Neutral");
});

test("no label returns null", () => {
  assert.equal(displayUndertone({ undertone: null, lab_a: 1, lab_b_val: 1 }), null);
  assert.equal(displayUndertone({ undertone: "  ", lab_a: 1, lab_b_val: 1 }), null);
});

test("chroma of 20 or more returns null for any label", () => {
  assert.equal(displayUndertone({ undertone: "Warm (Golden)", lab_a: 12, lab_b_val: 16 }), null); // C* 20.0
  assert.equal(displayUndertone({ undertone: "Warm (Golden)", lab_a: 12, lab_b_val: 15.9 }), "Warm (Golden)"); // C* 19.9
});

test("Neutral needs C* under 10 and b* under 5", () => {
  assert.equal(displayUndertone({ undertone: "Neutral", lab_a: 0, lab_b_val: 10 }), null);
  assert.equal(displayUndertone({ undertone: "Neutral", lab_a: 0, lab_b_val: 5 }), null);
  assert.equal(displayUndertone({ undertone: "Neutral", lab_a: 0, lab_b_val: 4.9 }), "Neutral");
  assert.equal(displayUndertone({ undertone: "Neutral", lab_a: -9.9, lab_b_val: 0 }), "Neutral");
  assert.equal(displayUndertone({ undertone: "Neutral", lab_a: 10, lab_b_val: 0 }), null);
});

test("Warm with a negative b* is contradicted", () => {
  assert.equal(displayUndertone({ undertone: "Warm (Pink)", lab_a: 8, lab_b_val: -1 }), null);
  assert.equal(displayUndertone({ undertone: "Warm (Pink)", lab_a: 8, lab_b_val: 0 }), "Warm (Pink)");
});

test("Cool with b* over 5 and a* of 0 or more is contradicted", () => {
  assert.equal(displayUndertone({ undertone: "Cool (Green)", lab_a: 0, lab_b_val: 5.1 }), null);
  assert.equal(displayUndertone({ undertone: "Cool (Green)", lab_a: -1, lab_b_val: 5.1 }), "Cool (Green)");
  assert.equal(displayUndertone({ undertone: "Cool (Blue)", lab_a: 2, lab_b_val: 5 }), "Cool (Blue)");
});

test("Lab values that are missing cannot contradict the label", () => {
  assert.equal(displayUndertone({ undertone: "Neutral" }), "Neutral");
  assert.equal(displayUndertone({ undertone: "Cool (Blue)", lab_a: null, lab_b_val: null }), "Cool (Blue)");
});

test("string Lab values from a numeric column are read as numbers", () => {
  assert.equal(displayUndertone({ undertone: "Neutral", lab_a: "-0.25", lab_b_val: "24.7" }), null);
});
