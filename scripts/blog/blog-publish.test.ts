import { test } from "node:test";
import assert from "node:assert/strict";
import { isLiveAt, canRenderAt } from "../../src/lib/blog-publish.ts";

const NOW = new Date("2026-06-01T12:00:00Z");

test("isLiveAt: a past or today date is live", () => {
  assert.equal(isLiveAt("2026-05-31", NOW), true);
  assert.equal(isLiveAt("2026-06-01", NOW), true); // earlier today (UTC midnight) <= now
});

test("isLiveAt: a future date is not live", () => {
  assert.equal(isLiveAt("2026-06-07", NOW), false);
});

test("canRenderAt: live posts render in production", () => {
  assert.equal(canRenderAt("2026-05-31", NOW, true), true);
});

test("canRenderAt: future post is hidden in production but viewable on preview/dev", () => {
  assert.equal(canRenderAt("2026-06-07", NOW, true), false); // production hides it
  assert.equal(canRenderAt("2026-06-07", NOW, false), true); // preview/dev shows it for review
});
