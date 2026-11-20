import { test } from "node:test";
import assert from "node:assert/strict";
import { POPULAR_COLOR_SLUGS, MATCH_ONLY_COLOR_SLUGS, MATCH_SHARD_SOURCE_COLORS } from "./popular-colors";

const key = (c: { brandSlug: string; colorSlug: string }) => `${c.brandSlug}/${c.colorSlug}`;

test("match-only colors do not overlap the popular list or repeat", () => {
  const popular = new Set(POPULAR_COLOR_SLUGS.map(key));
  const matchOnly = MATCH_ONLY_COLOR_SLUGS.map(key);
  assert.equal(new Set(matchOnly).size, matchOnly.length);
  for (const k of matchOnly) assert.ok(!popular.has(k), `${k} is already in POPULAR_COLOR_SLUGS`);
});

test("shard sources are the popular list plus the match-only list", () => {
  assert.equal(MATCH_SHARD_SOURCE_COLORS.length, POPULAR_COLOR_SLUGS.length + MATCH_ONLY_COLOR_SLUGS.length);
});
