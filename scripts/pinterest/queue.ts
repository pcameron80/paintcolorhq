// Aggregated, approved Pinterest pin queue + variety-rotation selection.
// Pure functions only — no I/O — so the drip logic is unit-testable.

import { BATCH as MAY26, TYPE_FOR_BOARD } from "./batch-may26.ts";
import { BATCH as JUN_RESTOCK } from "./batch-jun-restock.ts";
import { BATCH as JUN_RESTOCK_2 } from "./batch-jun-restock-2.ts";
export { BOARD_IDS, IMAGE_DIR, BOARD_FOR_TYPE, TYPE_FOR_BOARD } from "./batch-may26.ts";
export type { PinSpec, BoardName, PinType } from "./batch-may26.ts";
import type { PinSpec, PinType } from "./batch-may26.ts";
import { guidePins } from "./sources/guides.ts";
import { swatchPins } from "./sources/swatches.ts";

/** Fill `type` on curated pins from their board (board↔type is 1:1). */
function typed(pins: PinSpec[]): PinSpec[] {
  return pins.map((p) => ({ ...p, type: p.type ?? TYPE_FOR_BOARD[p.board] }));
}

/**
 * All pins across every lane:
 *  - curated (local images): palette + comparison, from the batch files
 *  - programmatic (image URLs): swatch (catalog) + guide (blog posts)
 */
export const QUEUE: PinSpec[] = [
  ...typed(MAY26),
  ...typed(JUN_RESTOCK),
  ...typed(JUN_RESTOCK_2),
  ...swatchPins(),
  ...guidePins(),
];

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

// ---- v2: per-type daily quotas + cooldown re-pin ----

export type Quotas = Partial<Record<PinType, number>>;

export interface DripConfig {
  cooldownDays: number;
  daily: Quotas;
  /** Extra quota by ISO weekday (1=Mon … 7=Sun), merged onto `daily`. */
  byWeekday: Record<number, Quotas>;
}

export const DRIP_CONFIG: DripConfig = {
  cooldownDays: 35,
  daily: { swatch: 3, palette: 1 },
  byWeekday: {
    1: { guide: 1 }, // Mon
    3: { comparison: 1 }, // Wed
    4: { guide: 1 }, // Thu
    6: { comparison: 1 }, // Sat
  },
};

/** The day's quota = daily quota plus any weekday extras. */
export function quotasForWeekday(cfg: DripConfig, isoWeekday: number): Quotas {
  const merged: Quotas = { ...cfg.daily };
  for (const [t, n] of Object.entries(cfg.byWeekday[isoWeekday] ?? {})) {
    merged[t as PinType] = (merged[t as PinType] ?? 0) + (n as number);
  }
  return merged;
}

/**
 * Pick the day's mix. Per type: fill from fresh (variety rotation within type),
 * then top up with cooldown-eligible re-pins (least-recently-published first).
 */
export function selectDailyMix(
  queue: PinSpec[],
  published: PublishedLog,
  quotas: Quotas,
  nowMs: number,
  cooldownDays: number,
): PinSpec[] {
  const chosen: PinSpec[] = [];
  for (const [type, nRaw] of Object.entries(quotas)) {
    const n = nRaw as number;
    const ofType = queue.filter((p) => p.type === (type as PinType));
    const picks: PinSpec[] = [];

    const freshPool = ofType.filter((p) => !(p.key in published));
    while (picks.length < n && freshPool.length > 0) {
      const next = pickNext(freshPool, [...picks].reverse().slice(0, LOOKBACK))!;
      picks.push(next);
      freshPool.splice(freshPool.indexOf(next), 1);
    }

    if (picks.length < n) {
      const cutoff = nowMs - cooldownDays * 86400_000;
      const repinnable = ofType
        .filter((p) => published[p.key] && Date.parse(published[p.key].publishedAt) < cutoff)
        .sort(
          (a, b) =>
            Date.parse(published[a.key].publishedAt) - Date.parse(published[b.key].publishedAt),
        );
      for (const p of repinnable) {
        if (picks.length >= n) break;
        picks.push(p);
      }
    }
    chosen.push(...picks);
  }
  return chosen;
}
