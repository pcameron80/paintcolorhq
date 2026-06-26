/**
 * Tests the Samplize affiliate CTA gating + CJ deep-link construction in
 * src/lib/affiliate.ts. Run: npm run test:samplize
 *
 * The CJ prefix is read at module load, so the npm script sets
 * NEXT_PUBLIC_SAMPLIZE_AFFILIATE_PREFIX in the environment before Node starts.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { getSampleLinks } from "../../src/lib/affiliate";

const PREFIX = process.env.NEXT_PUBLIC_SAMPLIZE_AFFILIATE_PREFIX ?? "";

const base = {
  brandSlug: "sherwin-williams",
  colorSlug: "agreeable-gray-7029",
  brandName: "Sherwin-Williams",
  colorName: "Agreeable Gray",
  colorNumber: "7029",
};
const sampleLink = (info: Parameters<typeof getSampleLinks>[0]) =>
  getSampleLinks(info).find((l) => l.primary && l.label.includes("peel-and-stick"));

test("available stocked color: renders CTA with CJ prefix + encoded dest + sid", () => {
  assert.ok(PREFIX, "test must run via `npm run test:samplize` (sets the CJ prefix env)");
  const link = sampleLink({ ...base, samplizeAvailable: true });
  assert.ok(link, "expected a Samplize sample link");
  assert.equal(link!.affiliate, true);
  assert.ok(link!.url.startsWith(PREFIX), "url should start with the CJ prefix");
  assert.ok(
    link!.url.includes(encodeURIComponent("https://samplize.com/products/agreeable-gray-7029-12x12")),
    "url should contain the encoded product destination"
  );
  assert.ok(link!.url.endsWith("&sid=agreeable-gray-7029"), "url should append &sid=<colorSlug>");
});

test("unavailable color (404): no Samplize CTA", () => {
  assert.equal(sampleLink({ ...base, samplizeAvailable: false }), undefined);
});

test("unchecked color (undefined): no Samplize CTA (fail safe)", () => {
  assert.equal(sampleLink({ ...base }), undefined);
});

test("non-stocked brand even if marked available: no Samplize CTA", () => {
  assert.equal(sampleLink({ ...base, brandSlug: "behr", samplizeAvailable: true }), undefined);
});

test("Amazon supplies link is always present regardless of Samplize", () => {
  const links = getSampleLinks({ ...base, samplizeAvailable: false });
  assert.ok(links.some((l) => l.label.includes("Amazon")), "Amazon fallback should remain");
});
