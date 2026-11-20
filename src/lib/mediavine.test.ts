import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdFreePath } from "./mediavine";
import { isNonTrackedPath } from "./consent";

test("ad wrapper never loads on embed, admin, dashboard, auth, api or search", () => {
  for (const p of [
    "/embed",
    "/embed/match",
    "/admin",
    "/admin/live",
    "/dashboard",
    "/dashboard/abc-123",
    "/auth/callback",
    "/api/geo",
    "/search",
  ]) {
    assert.equal(isAdFreePath(p), true, p);
  }
});

test("ad wrapper loads on content pages", () => {
  for (const p of [
    "/",
    "/colors/sherwin-williams/agreeable-gray-7029",
    "/brands/behr",
    "/match/sherwin-williams/to/behr",
    "/compare",
    "/blog/some-post",
    "/embedded-colors",
    "/administer",
    "/dashboards",
  ]) {
    assert.equal(isAdFreePath(p), false, p);
  }
});

test("every non-tracked path is also ad-free", () => {
  for (const p of ["/embed/match", "/embed/match/x", "/admin", "/admin/live"]) {
    assert.equal(isNonTrackedPath(p), true, p);
    assert.equal(isAdFreePath(p), true, p);
  }
});
