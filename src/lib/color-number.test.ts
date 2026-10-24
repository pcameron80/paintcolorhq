import { test } from "node:test";
import assert from "node:assert/strict";
import { colorNumberCandidates, pickColorNumberMatch } from "./color-number";

// The bare tail is always the last resort. Word-plus-number tokens tried ahead
// of it (GREY-7029) are not color numbers in any brand and fall through.
const last = (a: string[]) => a[a.length - 1];

test("bare numeric tail resolves Sherwin-Williams and Benjamin Moore numbers", () => {
  assert.equal(last(colorNumberCandidates("agreeable-gray-7029")), "7029");
  // British spelling: same number, so it 308s to agreeable-gray-7029.
  assert.equal(last(colorNumberCandidates("agreeable-grey-7029")), "7029");
  assert.equal(last(colorNumberCandidates("wrong-name-7029")), "7029");
  assert.deepEqual(colorNumberCandidates("blue-736"), ["736"]);
});

test("coded number comes first and the bare tail is skipped after a code prefix", () => {
  const c = colorNumberCandidates("hale-navy-hc-154");
  assert.equal(c[0], "HC-154");
  // Benjamin Moore 154 is Mango Punch, a different color.
  assert.ok(!c.includes("154"));
  assert.ok(!colorNumberCandidates("renamed-csp-10").includes("10"));
  assert.ok(!colorNumberCandidates("romantic-ballad-c-1182").includes("1182"));
});

test("attached letter codes resolve from the last token", () => {
  assert.ok(colorNumberCandidates("swiss-coffee-dew341").includes("DEW341"));
  assert.ok(colorNumberCandidates("renamed-h0075").includes("H0075"));
});

test("brand-specific shapes", () => {
  assert.equal(colorNumberCandidates("tudor-rose-90rr-63-139")[0], "90RR 63/139");
  assert.equal(colorNumberCandidates("elote-pph-02-hisp")[0], "PPH-02 (HISP)");
  assert.ok(colorNumberCandidates("renamed-4002-1a").includes("4002-1A"));
  assert.ok(colorNumberCandidates("renamed-aspire-12").includes("ASPIRE-12"));
  assert.equal(colorNumberCandidates("renamed-la120-45")[0], "LA120-45");
});

test("dedupe suffix never collapses into a bare number", () => {
  const c = colorNumberCandidates("chocolate-froth-720c-2-2");
  assert.ok(c.includes("720C-2"));
  assert.ok(!c.includes("22"));
  assert.ok(c.indexOf("720C-2") < c.indexOf("2"));
});

test("slug with no number yields no candidates", () => {
  assert.deepEqual(colorNumberCandidates("coral-springs-historic-coral-springs"), []);
  assert.deepEqual(colorNumberCandidates("not-a-color"), []);
  assert.deepEqual(colorNumberCandidates("7029"), []);
  assert.deepEqual(colorNumberCandidates(""), []);
});

test("pickColorNumberMatch follows candidate order, alternates, case and ties", () => {
  const rows = [
    { slug: "mango-punch-154", color_number: "154", alternate_numbers: null },
    { slug: "hale-navy-hc-154", color_number: "HC-154", alternate_numbers: null },
  ];
  assert.equal(pickColorNumberMatch("x-hc-154", ["HC-154", "154"], rows), "hale-navy-hc-154");
  assert.equal(pickColorNumberMatch("x-154", ["154"], rows), "mango-punch-154");
  assert.equal(
    pickColorNumberMatch("renamed-c-1182", ["C-1182"], [{ slug: "romantic-ballad-c-1182", color_number: "1183", alternate_numbers: ["C-1182"] }]),
    "romantic-ballad-c-1182",
  );
  assert.equal(pickColorNumberMatch("x-leaf-07", ["LEAF-07"], [{ slug: "fern-leaf-07", color_number: "Leaf-07", alternate_numbers: null }]), "fern-leaf-07");
  const twins = [
    { slug: "garden-wall-730d-4", color_number: "730D-4", alternate_numbers: null },
    { slug: "garden-wall-730d-4-2", color_number: "730D-4", alternate_numbers: null },
  ];
  assert.equal(pickColorNumberMatch("garden-wal-730d-4", ["730D-4"], twins), "garden-wall-730d-4");
  assert.equal(pickColorNumberMatch("x-999", ["999"], rows), null);
});
