import { test } from "node:test";
import assert from "node:assert/strict";
import { applyWhiteGain, whiteGainFromReference, srgbToLinear, linearToSrgb } from "./white-reference";

test("sRGB and linear round-trip every 8-bit value", () => {
  for (let v = 0; v <= 255; v++) assert.equal(linearToSrgb(srgbToLinear(v)), v);
});

test("a neutral reference changes nothing", () => {
  const r = whiteGainFromReference("#e0e0e0");
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(applyWhiteGain("#8a7f70", r.gain), "#8a7f70");
});

test("a warm reference becomes neutral and pulls samples cooler", () => {
  const r = whiteGainFromReference("#f0e0c0");
  assert.ok(r.ok);
  if (!r.ok) return;
  const ref = applyWhiteGain("#f0e0c0", r.gain);
  const [rr, gg, bb] = [ref.slice(1, 3), ref.slice(3, 5), ref.slice(5, 7)].map((h) => parseInt(h, 16));
  assert.ok(Math.max(rr, gg, bb) - Math.min(rr, gg, bb) <= 1, `reference not neutral: ${ref}`);
  const sample = applyWhiteGain("#b0a090", r.gain);
  assert.ok(parseInt(sample.slice(5, 7), 16) > 0x90, "blue should rise");
  assert.ok(parseInt(sample.slice(1, 3), 16) < 0xb0, "red should fall");
});

test("accepts white trim under a warm bulb", () => {
  assert.equal(whiteGainFromReference("#ffc080").ok, true);
});

test("rejects dark, strongly colored and malformed references", () => {
  assert.deepEqual(whiteGainFromReference("#101010"), { ok: false, reason: "too-dark" });
  assert.deepEqual(whiteGainFromReference("#c03020"), { ok: false, reason: "too-colorful" });
  assert.deepEqual(whiteGainFromReference("nope"), { ok: false, reason: "invalid" });
});
