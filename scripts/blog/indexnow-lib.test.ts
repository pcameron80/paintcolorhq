import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSlugs, checkUrls, MAX_URLS } from "./indexnow-lib.ts";

const NOW = new Date("2026-10-11T09:19:00Z");
const DATES: Record<string, string> = {
  "how-to-match-paint-color": "2026-10-11",
  "how-to-choose-trim-color": "2026-10-13",
  "paint-sheen-guide": "2025-10-16",
};
const dateOf = (slug: string) => DATES[slug];

test("checkSlugs: past and same-day posts are live", () => {
  const r = checkSlugs(["paint-sheen-guide", "how-to-match-paint-color"], dateOf, NOW);
  assert.deepEqual(r.live, ["paint-sheen-guide", "how-to-match-paint-color"]);
  assert.deepEqual(r.scheduled, []);
  assert.deepEqual(r.unknown, []);
});

test("checkSlugs: a future-dated post is held back with its date", () => {
  const r = checkSlugs(["how-to-choose-trim-color"], dateOf, NOW);
  assert.deepEqual(r.live, []);
  assert.deepEqual(r.scheduled, [{ slug: "how-to-choose-trim-color", date: "2026-10-13" }]);
});

test("checkSlugs: the post becomes live on its date", () => {
  const r = checkSlugs(["how-to-choose-trim-color"], dateOf, new Date("2026-10-13T04:00:00Z"));
  assert.deepEqual(r.live, ["how-to-choose-trim-color"]);
});

test("checkSlugs: a slug with no post is reported as unknown", () => {
  const r = checkSlugs(["how-to-chose-trim-color"], dateOf, NOW);
  assert.deepEqual(r.unknown, ["how-to-chose-trim-color"]);
  assert.deepEqual(r.live, []);
});

test("checkUrls: accepts www https URLs and drops duplicates", () => {
  const r = checkUrls([
    "https://www.paintcolorhq.com/colors/sherwin-williams/agreeable-gray-7029",
    "https://www.paintcolorhq.com/colors/sherwin-williams/agreeable-gray-7029",
    " https://www.paintcolorhq.com/blog/paint-sheen-guide ",
  ]);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.urls, [
    "https://www.paintcolorhq.com/colors/sherwin-williams/agreeable-gray-7029",
    "https://www.paintcolorhq.com/blog/paint-sheen-guide",
  ]);
});

test("checkUrls: rejects other hosts, http, queries and junk", () => {
  const r = checkUrls([
    "https://paintcolorhq.com/colors",
    "http://www.paintcolorhq.com/colors",
    "https://www.paintcolorhq.com.evil.io/x",
    "https://paintcolorhq-git-x-pac-projects.vercel.app/",
    "https://www.paintcolorhq.com/search?q=gray",
    "https://www.paintcolorhq.com:8443/x",
    "colors/sherwin-williams",
  ]);
  assert.deepEqual(r.urls, []);
  assert.equal(r.errors.length, 7);
});

test("checkUrls: more than 25 distinct URLs is refused", () => {
  const many = Array.from({ length: MAX_URLS + 1 }, (_, i) => `https://www.paintcolorhq.com/p/${i}`);
  assert.match(checkUrls(many).errors.at(-1) ?? "", /limit is 25/);
  assert.deepEqual(checkUrls(many.slice(0, MAX_URLS)).errors, []);
});
