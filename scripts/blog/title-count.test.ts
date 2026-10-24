/**
 * A numbered title is a promise: "15 Best ..." must deliver 15 picks.
 *
 * For titles that start with a count ("15 Best", "The 15 Best") or carry one
 * in "(N Picks", the count must lie between:
 * - low: distinct Swatch names that open a paragraph (one pick each), and
 * - high: distinct Swatch names anywhere in the post (picks plus mentions).
 * Years (2026 Colors of the Year) are not counts.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parsePostRanges } from "./check-modified-dates-lib.ts";

const SOURCE = readFileSync(new URL("../../src/lib/blog-posts.tsx", import.meta.url), "utf8");
const LINES = SOURCE.split("\n");

function titleCount(title: string): number | null {
  const m = title.match(/^(?:The )?(\d+) /) ?? title.match(/\((\d+) Picks/);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1900 ? null : n;
}

const SWATCH_NAME = /<Swatch\b[^>]*?\bname="([^"]+)"/g;

function swatchCounts(body: string[]): { low: number; high: number } {
  const opening = new Set<string>();
  const all = new Set<string>();
  body.forEach((line, i) => {
    for (const m of line.matchAll(SWATCH_NAME)) all.add(m[1]);
    // A pick is a Swatch that is the first thing inside a <p>, <li> or <h3>.
    // A Swatch on the second line of a paragraph is a comparison, not a pick.
    const lead = line.trim().match(/^<Swatch\b[^>]*?\bname="([^"]+)"/);
    const prev = (body[i - 1] ?? "").trim();
    if (lead && /^<(p|li|h3)\b[^>]*>$/.test(prev)) opening.add(lead[1]);
  });
  return { low: opening.size, high: all.size };
}

const numbered = parsePostRanges(SOURCE)
  .map((p) => {
    const body = LINES.slice(p.start - 1, p.end);
    const titleLine = body.find((l) => /^    title: "/.test(l)) ?? "";
    const title = titleLine.replace(/^    title: "/, "").replace(/",$/, "");
    return { slug: p.slug, title, n: titleCount(title), body };
  })
  .filter((p): p is typeof p & { n: number } => p.n !== null);

test("title-count: at least the brand round-ups and the white guide are covered", () => {
  const slugs = numbered.map((p) => p.slug);
  for (const s of [
    "best-dutch-boy-paint-colors",
    "best-behr-paint-colors",
    "best-ppg-paint-colors",
    "best-dunn-edwards-paint-colors",
    "best-valspar-paint-colors",
    "best-white-paint-colors-guide",
  ]) {
    assert.ok(slugs.includes(s), `${s} should have a numbered title`);
  }
});

for (const p of numbered) {
  test(`title-count: ${p.slug} delivers the ${p.n} picks its title promises`, () => {
    const { low, high } = swatchCounts(p.body);
    assert.ok(
      p.n >= low && p.n <= high,
      `"${p.title}" promises ${p.n}; the post has ${low} pick paragraphs and ${high} distinct swatches`,
    );
  });
}
