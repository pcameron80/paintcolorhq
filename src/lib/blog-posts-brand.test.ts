import { test } from "node:test";
import assert from "node:assert/strict";
import { getPostsByBrand } from "./blog-posts";

test("getPostsByBrand: RAL does not match 'neutral' inside titles or tags", () => {
  assert.deepEqual(getPostsByBrand("RAL"), []);
});

test("getPostsByBrand: Sherwin-Williams results are unchanged by whole-word matching", () => {
  assert.deepEqual(
    getPostsByBrand("Sherwin-Williams").map((p) => p.slug),
    ["best-sherwin-williams-paint-colors", "sea-salt-sw-6204", "accessible-beige-sw-7036"],
  );
});

test("getPostsByBrand: Benjamin Moore results are unchanged by whole-word matching", () => {
  assert.deepEqual(
    getPostsByBrand("Benjamin Moore").map((p) => p.slug),
    ["best-benjamin-moore-paint-colors", "hale-navy-bm-hc-154", "best-benjamin-moore-bedroom-colors"],
  );
});

test("getPostsByBrand: a brand's own round-up still leads", () => {
  assert.equal(getPostsByBrand("Behr")[0]?.slug, "best-behr-paint-colors");
  assert.equal(getPostsByBrand("Dunn-Edwards")[0]?.slug, "best-dunn-edwards-paint-colors");
});
