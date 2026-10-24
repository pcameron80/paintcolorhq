import { test } from "node:test";
import assert from "node:assert/strict";
import { diffPairs, sitemapPaths } from "./sitemap-pairs";
import { colorLastmod, latestDate, matchLastmod, COLOR_TEMPLATE_DATE, MATCH_TEMPLATE_DATE } from "./content-dates";

test("pair diff separates newly indexable, newly noindexed and removed pairs", () => {
  const a = "/match/sherwin-williams/sea-salt-6204-to-behr";
  const b = "/match/sherwin-williams/sea-salt-6204-to-ppg";
  const c = "/match/behr/polar-bear-75-to-ppg";
  const d = "/match/behr/gone-1-to-ppg";
  const diff = diffPairs([a, b, d], [a, c], new Map([[b, "noindexed"], [d, "removed"]]));
  assert.deepEqual(diff, { newlyIndexable: [c], newlyNoindexed: [b], removed: [d] });
});

test("a dropped pair the build never generated counts as removed", () => {
  const diff = diffPairs(["/match/x/y-to-z"], [], new Map());
  assert.deepEqual(diff, { newlyIndexable: [], newlyNoindexed: [], removed: ["/match/x/y-to-z"] });
});

test("sitemap paths strip the origin and unescape entities", () => {
  const xml = `<urlset><url><loc>https://www.paintcolorhq.com/match/a/b-to-c</loc><lastmod>2026-10-11</lastmod></url><url><loc>https://www.paintcolorhq.com/x?a=1&amp;b=2</loc></url></urlset>`;
  assert.deepEqual(sitemapPaths(xml, "https://www.paintcolorhq.com"), ["/match/a/b-to-c", "/x?a=1&b=2"]);
});

test("content dates never fall below the template date and read timestamps as days", () => {
  assert.equal(latestDate(), "");
  assert.equal(latestDate(null, undefined, "2026-02-10T00:45:10+00:00"), "2026-02-10");
  assert.equal(colorLastmod({ brandSlug: "b", colorSlug: "c", createdAt: "2026-02-10T00:00:00+00:00" }), COLOR_TEMPLATE_DATE);
  assert.equal(colorLastmod({ brandSlug: "b", colorSlug: "c", contentUpdatedAt: "2026-12-01T00:00:00+00:00" }), "2026-12-01");
  assert.equal(matchLastmod("/m", {}), MATCH_TEMPLATE_DATE);
  assert.equal(matchLastmod("/m", { "/m": "2026-12-02T00:00:00+00:00" }), "2026-12-02");
});
