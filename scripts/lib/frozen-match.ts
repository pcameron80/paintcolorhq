/**
 * Frozen match-data sources: colors whose /match-data/<id>.json must not
 * change while a running test is being measured, even when the underlying
 * color data is corrected. The list lives in scripts/data/frozen-match-sources.json
 * and each entry's snapshot (a byte copy of the production file, taken by
 * scripts/snapshot-frozen-match.ts) lives in scripts/data/frozen-match/<id>.json.
 *
 * build-match-data.ts writes the snapshot over the generated file while
 * today < until. After `until` the generated file ships as normal.
 */

import * as fs from "fs";
import * as path from "path";

export interface FrozenMatchSource {
  id: string;
  key: string;
  /** YYYY-MM-DD. The snapshot is served on dates strictly before this one. */
  until: string;
  reason: string;
}

export const FROZEN_LIST_PATH = path.resolve(__dirname, "../data/frozen-match-sources.json");
export const FROZEN_SNAPSHOT_DIR = path.resolve(__dirname, "../data/frozen-match");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates the parsed list. Throws on any malformed entry or duplicate id. */
export function parseFrozenList(raw: unknown): FrozenMatchSource[] {
  if (!Array.isArray(raw)) throw new Error("frozen list must be a JSON array");
  const seen = new Set<string>();
  return raw.map((e, i) => {
    const entry = e as Partial<FrozenMatchSource>;
    if (typeof entry.id !== "string" || !UUID_RE.test(entry.id))
      throw new Error(`frozen entry ${i}: id must be a color UUID`);
    if (typeof entry.key !== "string" || !entry.key.includes("/"))
      throw new Error(`frozen entry ${i}: key must be brand-slug/color-slug`);
    if (typeof entry.until !== "string" || !DATE_RE.test(entry.until))
      throw new Error(`frozen entry ${i}: until must be YYYY-MM-DD`);
    if (typeof entry.reason !== "string" || entry.reason.length === 0)
      throw new Error(`frozen entry ${i}: reason is required`);
    if (seen.has(entry.id)) throw new Error(`frozen entry ${i}: duplicate id ${entry.id}`);
    seen.add(entry.id);
    return { id: entry.id, key: entry.key, until: entry.until, reason: entry.reason };
  });
}

export function loadFrozenList(file = FROZEN_LIST_PATH): FrozenMatchSource[] {
  if (!fs.existsSync(file)) return [];
  return parseFrozenList(JSON.parse(fs.readFileSync(file, "utf-8")));
}

/** UTC calendar date, YYYY-MM-DD. */
export function todayUtc(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Entries still frozen on `today` (today < until). */
export function activeFrozen(list: FrozenMatchSource[], today: string): FrozenMatchSource[] {
  return list.filter((e) => today < e.until);
}

export function snapshotPath(id: string, dir = FROZEN_SNAPSHOT_DIR): string {
  return path.join(dir, `${id}.json`);
}

/**
 * Checks a match-data payload for the shape the color and match pages read.
 * Returns an error string, or null when the payload is usable.
 */
export function checkPayload(sourceId: string, text: string, minEntries: number): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return "not valid JSON";
  }
  if (!Array.isArray(parsed)) return "not a JSON array";
  if (parsed.length < minEntries) return `${parsed.length} entries, expected at least ${minEntries}`;
  for (const m of parsed as Array<{ id?: unknown; match_color?: { id?: unknown } }>) {
    if (typeof m.id !== "string" || !m.id.startsWith(`${sourceId}:`))
      return `entry id ${String(m.id)} does not belong to ${sourceId}`;
    if (!m.match_color || typeof m.match_color.id !== "string") return "entry without match_color";
  }
  return null;
}

/**
 * Expected cross_brand_matches row count: compute-matches writes the top 5
 * from every other brand for every color.
 */
export function expectedMatchCount(colorCount: number, brandCount: number, perBrand = 5): number {
  return colorCount * Math.max(brandCount - 1, 0) * perBrand;
}

/** Null when the table is complete, else the reason the build must stop. */
export function matchCountError(
  actual: number,
  colorCount: number,
  brandCount: number,
  perBrand = 5,
): string | null {
  const expected = expectedMatchCount(colorCount, brandCount, perBrand);
  if (colorCount === 0) return "colors table is empty";
  if (actual === expected) return null;
  return (
    `cross_brand_matches has ${actual} rows, expected ${colorCount} colors x ` +
    `${brandCount - 1} brands x ${perBrand} = ${expected}. ` +
    "A reseed is in progress or incomplete. Finish seed-matches, then redeploy."
  );
}
