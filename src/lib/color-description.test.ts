import { test } from "node:test";
import assert from "node:assert/strict";
import { generateColorLede, nearestMatchesPerBrand } from "./color-description.ts";

function color(over: Record<string, unknown> = {}) {
  return {
    name: "Agreeable Gray",
    color_number: "7029",
    hex: "#D1CBC1",
    lrv: 60,
    undertone: "Neutral",
    color_family: "gray",
    brand: { name: "Sherwin-Williams", slug: "sherwin-williams" },
    ...over,
  } as never;
}

function match(name: string, brand: string, de: number) {
  return {
    id: name,
    delta_e_score: de,
    match_color: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      hex: "#cccccc",
      brand: { name: brand, slug: brand.toLowerCase().replace(/\s+/g, "-") },
    },
  } as never;
}

// ---- generateColorLede ----

test("lede cites the color's own data and nearest match", () => {
  const led = generateColorLede(color(), [
    match("Doves Wings", "Dutch Boy", 1.1),
    match("Wish", "Benjamin Moore", 3),
  ]);
  assert.match(led, /Agreeable Gray/);
  assert.match(led, /#D1CBC1/);
  assert.match(led, /LRV 60/);
  assert.match(led, /Doves Wings/); // nearest match cited
  assert.match(led, /nearly identical/i); // delta_e 1.1 → nearly identical
  assert.match(led, /1 more|more equivalent/); // 2 matches → "1 more"
});

test("two different colors produce different ledes", () => {
  const a = generateColorLede(color(), [match("Doves Wings", "Dutch Boy", 1.1)]);
  const b = generateColorLede(
    color({ name: "Repose Gray", color_number: "7015", hex: "#CCC9C0", lrv: 58 }),
    [match("Classic Silver", "Behr", 2.2)],
  );
  assert.notEqual(a, b);
});

test("lede handles missing lrv/undertone and zero matches gracefully", () => {
  const led = generateColorLede(color({ lrv: null, undertone: null }), []);
  assert.match(led, /Agreeable Gray/);
  assert.doesNotMatch(led, /LRV/);
  assert.doesNotMatch(led, /closest cross-brand/); // no match clause when none
});

// ---- nearestMatchesPerBrand ----

test("nearestMatchesPerBrand: one per brand, sorted best-first", () => {
  const ms = [
    match("A", "Behr", 4),
    match("B", "Behr", 2),
    match("C", "PPG", 1),
    match("D", "Valspar", 6),
  ];
  const r = nearestMatchesPerBrand(ms as never);
  assert.deepEqual(
    r.map((m) => m.match_color.name),
    ["C", "B", "D"], // PPG(1), Behr(best=2), Valspar(6)
  );
});
