import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSlugs } from "./indexnow-lib.ts";

const NOW = new Date("2026-10-11T05:19:00Z");
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
  const r = checkSlugs(["how-to-choose-trim-color"], dateOf, new Date("2026-10-13T00:00:00Z"));
  assert.deepEqual(r.live, ["how-to-choose-trim-color"]);
});

test("checkSlugs: a slug with no post is reported as unknown", () => {
  const r = checkSlugs(["how-to-chose-trim-color"], dateOf, NOW);
  assert.deepEqual(r.unknown, ["how-to-chose-trim-color"]);
  assert.deepEqual(r.live, []);
});
