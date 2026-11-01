import { test } from "node:test";
import assert from "node:assert/strict";
import { paintLabel } from "./visualizer-labels";

const m = (name: string, hex: string, brandName: string) => ({ name, hex, brandName });

test("a preset hex keeps its preset label", () => {
  assert.equal(paintLabel("#EDECE6"), "Pure White (Sherwin-Williams)");
  assert.equal(paintLabel("#edece6", [m("Other", "#EDECE6", "Behr")]), "Pure White (Sherwin-Williams)");
});

test("an exact catalog hit is named, case-insensitively", () => {
  assert.equal(paintLabel("#cbcec5", [m("Pearl Gray", "#CBCEC5", "Sherwin-Williams")]), "Pearl Gray (Sherwin-Williams)");
});

test("a near match is never named", () => {
  assert.equal(paintLabel("#CBCEC5", [m("Pearl Gray", "#CBCEC6", "Sherwin-Williams")]), "#CBCEC5");
});

test("no matches falls back to the uppercase hex", () => {
  assert.equal(paintLabel("#cbcec5"), "#CBCEC5");
  assert.equal(paintLabel("cbcec5", []), "#CBCEC5");
});

test("shared hex picks by brand order, then name, regardless of input order", () => {
  const a = m("Zed", "#123456", "Behr");
  const b = m("Alpha", "#123456", "Benjamin Moore");
  const c = m("Mid", "#123456", "Acme Paint");
  const d = m("Beta", "#123456", "Acme Paint");
  assert.equal(paintLabel("#123456", [a, c, b]), "Alpha (Benjamin Moore)");
  assert.equal(paintLabel("#123456", [b, a, c]), "Alpha (Benjamin Moore)");
  assert.equal(paintLabel("#123456", [c, d]), "Beta (Acme Paint)");
});
