import { test } from "node:test";
import assert from "node:assert/strict";
import { formatLrv, hexToRgbString, lrvSourceLabel, parseColorInput } from "./color-input";

test("hex input with and without #, any case, and CSS shorthand", () => {
  assert.equal(parseColorInput("a8a29a"), "#a8a29a");
  assert.equal(parseColorInput("#A8A29A"), "#a8a29a");
  assert.equal(parseColorInput("  #a8a29a "), "#a8a29a");
  assert.equal(parseColorInput("#abc"), "#aabbcc");
  assert.equal(parseColorInput("FFF"), "#ffffff");
});

test("rgb input in the forms people paste", () => {
  assert.equal(parseColorInput("rgb(168, 162, 154)"), "#a8a29a");
  assert.equal(parseColorInput("RGB(168,162,154)"), "#a8a29a");
  assert.equal(parseColorInput("168, 162, 154"), "#a8a29a");
  assert.equal(parseColorInput("168 162 154"), "#a8a29a");
  assert.equal(parseColorInput("0,0,0"), "#000000");
  assert.equal(parseColorInput("255 255 255"), "#ffffff");
});

test("rejects what is not a color", () => {
  for (const bad of [null, undefined, "", "   ", "a8a29", "a8a29a0", "#ggg000", "256,0,0", "1,2", "1,2,3,4", "1.5,2,3", "-1,2,3", "agreeable gray"]) {
    assert.equal(parseColorInput(bad), null, String(bad));
  }
});

test("hex to rgb string", () => {
  assert.equal(hexToRgbString("#a8a29a"), "rgb(168, 162, 154)");
});

test("LRV formatting and source labels", () => {
  assert.equal(formatLrv(92.6), "92.6");
  assert.equal(formatLrv("90.00"), "90");
  assert.equal(formatLrv(8.44), "8.4");
  assert.equal(formatLrv(null), null);
  assert.equal(formatLrv("x"), null);
  assert.equal(lrvSourceLabel(62, "manufacturer"), "Published");
  assert.equal(lrvSourceLabel(62, "computed"), "Estimated");
  assert.equal(lrvSourceLabel(62, null), null);
  assert.equal(lrvSourceLabel(62, undefined), null);
  // NULL contract: no LRV means no label, whatever lrv_source says.
  assert.equal(lrvSourceLabel(null, "computed"), null);
});
