import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { brandLede, formatLrv, rankFamilies, pickMostViewed, mostViewedWindowLabel, mostViewedCandidates, brandCotyPicks, MOST_VIEWED_MIN } from "./brand-entry";

test("LRV prints with at most one decimal", () => {
  assert.equal(formatLrv(3.3), "3.3");
  assert.equal(formatLrv("90.0"), "90");
  assert.equal(formatLrv("100.0"), "100");
  assert.equal(formatLrv(85.449), "85.4");
});

test("families rank by count and skip empty ones", () => {
  assert.deepEqual(rankFamilies({ white: 5, gray: 9, red: 0, blue: 5 }), [
    { name: "gray", count: 9 }, { name: "blue", count: 5 }, { name: "white", count: 5 },
  ]);
});

test("opening line is two sentences of figures with no em dash", () => {
  const line = brandLede({
    brandName: "Benjamin Moore", total: 3820, lrv: { min: 3.3, max: 90 },
    families: rankFamilies({ white: 412, "off-white": 300, gray: 350, blue: 200 }),
  });
  assert.equal(line, "We catalog 3,820 Benjamin Moore colors, with LRV running from 3.3 to 90. The largest families are whites (412), grays (350) and off-whites (300).");
  assert.ok(!line.includes("—"));
  assert.equal(line.split(/(?<=\.) /).length, 2);
});

test("opening line degrades without LRV or families and stays empty for no colors", () => {
  assert.equal(brandLede({ brandName: "RAL", total: 213, lrv: null, families: [] }), "We catalog 213 RAL colors.");
  assert.equal(brandLede({ brandName: "RAL", total: 0, lrv: null, families: [] }), "");
});

const row = (slug: string, over: object = {}) => ({ slug, name: `Name ${slug}`, color_number: null, lrv: 50, undertone: "Neutral", color_family: "gray", ...over });

test("most viewed keeps rank order, drops missing and noindex colors, and needs a minimum", () => {
  const slugs = Array.from({ length: 30 }, (_, i) => `c${i}`);
  const resolved = slugs.filter((s) => s !== "c3").map((s) => row(s, s === "c5" ? { name: "YL-W15", color_number: "YL-W15" } : {}));
  const picked = pickMostViewed(slugs, resolved);
  assert.equal(picked.length, 24);
  assert.deepEqual(picked.slice(0, 5).map((c) => c.slug), ["c0", "c1", "c2", "c4", "c6"]);
  assert.deepEqual(pickMostViewed(slugs.slice(0, MOST_VIEWED_MIN - 1), resolved), []);
});

test("generated file: no redirect slugs, brands with thin traffic have no list", () => {
  assert.ok(mostViewedCandidates("benjamin-moore").length >= MOST_VIEWED_MIN);
  assert.deepEqual(mostViewedCandidates("ral"), []);
  assert.deepEqual(mostViewedCandidates("not-a-brand"), []);
});

test("no most-viewed candidate is a redirected slug", () => {
  const redirects = new Set(Object.keys(JSON.parse(readFileSync("src/data/color-redirects.json", "utf8"))));
  for (const brand of ["behr", "benjamin-moore", "sherwin-williams", "valspar", "ppg", "dunn-edwards", "dutch-boy", "farrow-ball"]) {
    for (const slug of mostViewedCandidates(brand)) assert.ok(!redirects.has(`${brand}/${slug}`), `${brand}/${slug}`);
  }
});

test("window label", () => {
  assert.equal(mostViewedWindowLabel({ windowStart: "2026-10-20", windowEnd: "2026-11-15" }), "Oct 20 to Nov 15, 2026");
  assert.equal(mostViewedWindowLabel({ windowStart: "2026-08-17", windowEnd: "2027-01-02" }), "Aug 17, 2026 to Jan 2, 2027");
});

test("Colors of the Year picks come from our verified list", () => {
  const bm = brandCotyPicks("benjamin-moore");
  assert.deepEqual(bm.map((p) => [p.year, p.pick.name]), [[2027, "Webster Green"], [2026, "Silhouette"]]);
  assert.deepEqual(brandCotyPicks("ral"), []);
});
