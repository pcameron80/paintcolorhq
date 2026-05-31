// Aggregated, approved Pinterest pin queue + variety-rotation selection.
// Pure functions only — no I/O — so the drip logic is unit-testable.

import { BATCH as MAY26 } from "./batch-may26.ts";
import { BATCH as JUN_RESTOCK } from "./batch-jun-restock.ts";
export { BOARD_IDS, IMAGE_DIR } from "./batch-may26.ts";
export type { PinSpec, BoardName } from "./batch-may26.ts";
import type { PinSpec } from "./batch-may26.ts";

/** All approved batches, concatenated in intended publish order. */
export const QUEUE: PinSpec[] = [...MAY26, ...JUN_RESTOCK];

export type PublishedLog = Record<string, { pinId: string; publishedAt: string }>;

export const LOOKBACK = 3;

/** Queue entries whose key is not yet in the published log, in queue order. */
export function unpublished(queue: PinSpec[], published: PublishedLog): PinSpec[] {
  return queue.filter((p) => !(p.key in published));
}

/** The most recently published specs (newest first), capped to `lookback`. */
export function recentlyPublished(
  queue: PinSpec[],
  published: PublishedLog,
  lookback: number,
): PinSpec[] {
  const byKey = new Map(queue.map((p) => [p.key, p]));
  return Object.entries(published)
    .filter(([key]) => byKey.has(key))
    .sort((a, b) => (a[1].publishedAt < b[1].publishedAt ? 1 : -1)) // newest first
    .slice(0, lookback)
    .map(([key]) => byKey.get(key)!);
}

/** How many of {theme, format, board} a candidate shares with the recent window. */
export function collisionScore(candidate: PinSpec, recent: PinSpec[]): number {
  const themes = new Set(recent.map((r) => r.theme));
  const formats = new Set(recent.map((r) => r.format));
  const boards = new Set(recent.map((r) => r.board));
  return (
    (themes.has(candidate.theme) ? 1 : 0) +
    (formats.has(candidate.format) ? 1 : 0) +
    (boards.has(candidate.board) ? 1 : 0)
  );
}

/** Lowest-collision candidate; ties keep the earliest (queue order). */
export function pickNext(candidates: PinSpec[], recent: PinSpec[]): PinSpec | null {
  if (candidates.length === 0) return null;
  let best = candidates[0];
  let bestScore = collisionScore(best, recent);
  for (const c of candidates.slice(1)) {
    const s = collisionScore(c, recent);
    if (s < bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}

/** Pick `count` unpublished pins via the variety rotation. */
export function selectForDrip(
  queue: PinSpec[],
  published: PublishedLog,
  count: number,
  lookback = LOOKBACK,
): PinSpec[] {
  const chosen: PinSpec[] = [];
  const prior = recentlyPublished(queue, published, lookback); // newest first
  let pool = unpublished(queue, published);
  for (let i = 0; i < count; i++) {
    const window = [...chosen].reverse().concat(prior).slice(0, lookback);
    const next = pickNext(pool, window);
    if (!next) break;
    chosen.push(next);
    pool = pool.filter((p) => p.key !== next.key);
  }
  return chosen;
}
