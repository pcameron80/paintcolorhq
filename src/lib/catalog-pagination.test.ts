import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCatalogSearch, catalogCanonical } from "./catalog-pagination";
test("pagination has distinct canonicals but arbitrary filters consolidate", () => {
  assert.equal(catalogCanonical("behr", parseCatalogSearch({ page: "2" })), "https://www.paintcolorhq.com/brands/behr?page=2");
  assert.equal(catalogCanonical("behr", parseCatalogSearch({ page: "2", family: "gray" })), "https://www.paintcolorhq.com/brands/behr");
});
test("untrusted query values cannot produce negative, fractional or unsafe offsets", () => {
  for (const page of ["-2", "2.5", "2junk", "Infinity", "9007199254740992", "0"]) assert.equal(parseCatalogSearch({ page }).page, 1);
  assert.equal(parseCatalogSearch({ page: ["3", "4"] }).page, 3);
});
