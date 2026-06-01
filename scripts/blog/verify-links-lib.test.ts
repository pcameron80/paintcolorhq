import { test } from "node:test";
import assert from "node:assert/strict";
import { extractInternalLinks, parseColorHref, parseMatchBrands } from "./verify-links-lib.ts";

const SAMPLE = `
  <Swatch href="/colors/benjamin-moore/hale-navy-hc-154" />
  <Link href="/colors/benjamin-moore/hale-navy-hc-154">dupe</Link>
  <a href="https://example.com">external excluded</a>
  See our [undertones guide](/blog/understanding-paint-color-undertones).
  <Link href="/match/benjamin-moore/to/sherwin-williams">matches</Link>
  <Link href="/colors/family/blue">blues</Link>
  <Link href="/brands/behr">behr</Link>
  <Link href="/compare">compare</Link>
`;

test("extractInternalLinks finds internal links, dedupes, excludes external", () => {
  const links = extractInternalLinks(SAMPLE);
  const hrefs = links.map((l) => l.href);
  assert.ok(!hrefs.some((h) => h.startsWith("http")));
  assert.equal(hrefs.filter((h) => h === "/colors/benjamin-moore/hale-navy-hc-154").length, 1); // deduped
  assert.ok(hrefs.includes("/blog/understanding-paint-color-undertones"));
  assert.ok(hrefs.includes("/match/benjamin-moore/to/sherwin-williams"));
});

test("extractInternalLinks classifies link kinds", () => {
  const byHref = new Map(extractInternalLinks(SAMPLE).map((l) => [l.href, l.kind]));
  assert.equal(byHref.get("/colors/benjamin-moore/hale-navy-hc-154"), "color");
  assert.equal(byHref.get("/colors/family/blue"), "family");
  assert.equal(byHref.get("/match/benjamin-moore/to/sherwin-williams"), "match");
  assert.equal(byHref.get("/blog/understanding-paint-color-undertones"), "blog");
  assert.equal(byHref.get("/brands/behr"), "brand");
  assert.equal(byHref.get("/compare"), "compare");
});

test("parseColorHref extracts brand+color, rejects family and non-color", () => {
  assert.deepEqual(parseColorHref("/colors/benjamin-moore/hale-navy-hc-154"), {
    brandSlug: "benjamin-moore",
    colorSlug: "hale-navy-hc-154",
  });
  assert.equal(parseColorHref("/colors/family/blue"), null);
  assert.equal(parseColorHref("/blog/x"), null);
  assert.equal(parseColorHref("/colors/behr"), null);
});

test("parseMatchBrands handles both match route shapes", () => {
  assert.deepEqual(parseMatchBrands("/match/benjamin-moore/to/sherwin-williams"), ["benjamin-moore", "sherwin-williams"]);
  assert.deepEqual(parseMatchBrands("/match/benjamin-moore/hale-navy-to-sherwin-williams"), ["benjamin-moore"]);
  assert.deepEqual(parseMatchBrands("/blog/x"), []);
});
