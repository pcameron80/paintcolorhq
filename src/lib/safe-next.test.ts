import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "./safe-next";

const ORIGIN = "https://www.paintcolorhq.com";

test("off-site and malformed targets fall back to /dashboard", () => {
  for (const raw of [
    ".evil.example",
    "@evil.example",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "https://evil.example/dashboard",
    "https://www.paintcolorhq.com/dashboard",
    "javascript:alert(1)",
    "/\t/evil.example",
    "/\n/evil.example",
    "",
    null,
    undefined,
  ]) {
    assert.equal(safeNext(raw, ORIGIN), "/dashboard", `input: ${JSON.stringify(raw)}`);
  }
});

test("real same-site paths pass through with search and hash", () => {
  assert.equal(safeNext("/dashboard", ORIGIN), "/dashboard");
  assert.equal(
    safeNext("/colors/sherwin-williams/agreeable-gray-7029", ORIGIN),
    "/colors/sherwin-williams/agreeable-gray-7029",
  );
  assert.equal(safeNext("/compare?a=1&b=2#result", ORIGIN), "/compare?a=1&b=2#result");
});

test("custom fallback is honored", () => {
  assert.equal(safeNext("//evil.example", ORIGIN, "/"), "/");
});
