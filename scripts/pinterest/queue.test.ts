import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import {
  unpublished,
  collisionScore,
  pickNext,
  selectForDrip,
  type PinSpec,
  type PublishedLog,
} from "./queue.ts";

// Minimal PinSpec stub — only the fields the selection layer reads.
function mk(key: string, theme: string, format: string, board: PinSpec["board"]): PinSpec {
  return { key, theme, format, board } as unknown as PinSpec;
}

const Q: PinSpec[] = [
  mk("a", "navy", "living-room", "Color Palettes"),
  mk("b", "navy", "kitchen", "Color Palettes"),
  mk("c", "sage", "bathroom", "Color Palettes"),
  mk("d", "white", "comparison", "Paint Color Guides"),
];

test("unpublished filters out keys present in the log", () => {
  const log: PublishedLog = { a: { pinId: "1", publishedAt: "2026-05-30T00:00:00Z" } };
  assert.deepEqual(unpublished(Q, log).map((p) => p.key), ["b", "c", "d"]);
});

test("collisionScore counts shared theme/format/board", () => {
  const recent = [mk("a", "navy", "living-room", "Color Palettes")];
  assert.equal(collisionScore(mk("x", "navy", "kitchen", "Color Palettes"), recent), 2); // theme+board
  assert.equal(collisionScore(mk("y", "white", "comparison", "Paint Color Guides"), recent), 0);
});

test("pickNext prefers lowest collision, tie-breaks by queue order", () => {
  const recent = [mk("a", "navy", "living-room", "Color Palettes")];
  assert.equal(pickNext([Q[1], Q[2], Q[3]], recent)!.key, "d");
  assert.equal(pickNext([Q[1], Q[2], Q[3]], [])!.key, "b");
});

test("selectForDrip returns [] when everything is published", () => {
  const log: PublishedLog = Object.fromEntries(
    Q.map((p) => [p.key, { pinId: "x", publishedAt: "2026-05-30T00:00:00Z" }]),
  );
  assert.deepEqual(selectForDrip(Q, log, 2), []);
});

test("selectForDrip(N=2) does not pick two of the same theme back-to-back", () => {
  const picks = selectForDrip(Q, {}, 2).map((p) => p.key);
  assert.equal(picks[0], "a");
  assert.notEqual(picks[1], "b");
  assert.equal(picks[1], "d");
});

import { guidePins } from "./sources/guides.ts";

test("guidePins: all guide-type, on Guides board, with imageUrl + unique keys", () => {
  const g = guidePins();
  assert.ok(g.length >= 20, `expected >=20 guide pins, got ${g.length}`);
  assert.ok(g.every((p) => p.type === "guide" && p.board === "Paint Color Guides"));
  assert.ok(g.every((p) => typeof p.imageUrl === "string" && p.imageUrl!.startsWith("https://")));
  assert.ok(g.every((p) => p.link.includes("/blog/")));
  assert.equal(new Set(g.map((p) => p.key)).size, g.length);
});

import { swatchPins } from "./sources/swatches.ts";

test("swatchPins: all swatch-type, on Colors board, /api/pin imageUrl, unique keys", () => {
  const s = swatchPins();
  assert.ok(s.length > 0);
  assert.ok(s.every((p) => p.type === "swatch" && p.board === "Paint Colors"));
  assert.ok(s.every((p) => p.imageUrl!.includes("/api/pin?")));
  assert.ok(s.every((p) => p.link.includes("/colors/")));
  assert.equal(new Set(s.map((p) => p.key)).size, s.length);
});

import { palettePins } from "./sources/palettes.ts";

test("palettePins: all palette-type, on Color Palettes board, /api/pin/palette imageUrl, unique keys", () => {
  const p = palettePins();
  assert.ok(p.length >= 15, `expected >=15 palette pins, got ${p.length}`);
  assert.ok(p.every((x) => x.type === "palette" && x.board === "Color Palettes"));
  assert.ok(p.every((x) => x.imageUrl!.includes("/api/pin/palette?")));
  assert.ok(p.every((x) => x.link.includes("/inspiration/")));
  assert.equal(new Set(p.map((x) => x.key)).size, p.length);
});

import { quotasForWeekday, selectDailyMix, DRIP_CONFIG } from "./queue.ts";

function mkT(key: string, type: PinSpec["type"]): PinSpec {
  return { key, type, board: "x", theme: type, format: type } as unknown as PinSpec;
}

test("quotasForWeekday merges daily + weekday extras", () => {
  assert.deepEqual(quotasForWeekday(DRIP_CONFIG, 1), { swatch: 2, palette: 1, guide: 1 }); // Mon
  assert.deepEqual(quotasForWeekday(DRIP_CONFIG, 2), { swatch: 2, palette: 1 });            // Tue
});

test("selectDailyMix fills each type's quota from fresh", () => {
  const q = [mkT("s1","swatch"),mkT("s2","swatch"),mkT("s3","swatch"),mkT("s4","swatch"),mkT("p1","palette"),mkT("p2","palette")];
  const picks = selectDailyMix(q, {}, { swatch: 3, palette: 1 }, 0, 35);
  assert.equal(picks.filter((p) => p.type === "swatch").length, 3);
  assert.equal(picks.filter((p) => p.type === "palette").length, 1);
});

test("selectDailyMix re-pins only after cooldown, oldest first", () => {
  const DAY = 86400_000, now = 100 * DAY;
  const q = [mkT("p1","palette"), mkT("p2","palette")];
  const log = {
    p1: { pinId: "1", publishedAt: new Date(now - 40 * DAY).toISOString() }, // eligible
    p2: { pinId: "2", publishedAt: new Date(now - 5 * DAY).toISOString() },  // in cooldown
  };
  const picks = selectDailyMix(q, log, { palette: 1 }, now, 35);
  assert.equal(picks.length, 1);
  assert.equal(picks[0].key, "p1");
});

test("selectDailyMix prefers fresh over re-pin", () => {
  const DAY = 86400_000, now = 100 * DAY;
  const q = [mkT("p1","palette"), mkT("p2","palette")];
  const log = { p1: { pinId: "1", publishedAt: new Date(now - 40 * DAY).toISOString() } }; // p2 fresh
  const picks = selectDailyMix(q, log, { palette: 1 }, now, 35);
  assert.equal(picks[0].key, "p2");
});

// ---- re-pin annotation + publish gate ----
// (July 2026: every lane that ran out of fresh pins went SILENT — selectDailyMix
//  correctly chose cooldown re-pins, but publishPin's already-published guard
//  skipped them every day, forever. The repin flag is how the selector tells the
//  publisher "yes, this one is in the log on purpose — post it again".)

test("selectDailyMix marks cooldown re-pins with repin:true, fresh picks not", () => {
  const DAY = 86400_000, now = 100 * DAY;
  const q = [mkT("p1","palette"), mkT("s1","swatch")];
  const log = { p1: { pinId: "1", publishedAt: new Date(now - 40 * DAY).toISOString() } };
  const picks = selectDailyMix(q, log, { swatch: 1, palette: 1 }, now, 35);
  const byKey = Object.fromEntries(picks.map((p) => [p.key, p]));
  assert.equal(byKey.p1.repin, true, "cooldown pick must carry repin:true");
  assert.ok(!byKey.s1.repin, "fresh pick must not carry repin");
});

import { shouldSkip } from "./queue.ts";

test("shouldSkip: skips published pins unless the selector flagged a re-pin", () => {
  const log: PublishedLog = { a: { pinId: "1", publishedAt: "2026-05-30T00:00:00Z" } };
  assert.equal(shouldSkip(mk("a", "navy", "living-room", "Color Palettes"), log), true);
  assert.equal(shouldSkip({ ...mk("a", "navy", "living-room", "Color Palettes"), repin: true }, log), false);
  assert.equal(shouldSkip(mk("b", "navy", "kitchen", "Color Palettes"), log), false);
});

// ---- drift guards: catch a silent revert of the once-daily quota schedule ----
// (June 2026: drip.sh was silently reverted to v1 `--drip=2` at 3 slots/day,
//  which collapsed the feed to guides for a week before anyone noticed.)

test("drift guard: drip.sh runs --daily, NOT the v1 --drip path", () => {
  const sh = fs.readFileSync(new URL("./drip.sh", import.meta.url), "utf8");
  assert.match(sh, /--daily/, "drip.sh must invoke the v2 daily-quota mix (--daily)");
  assert.doesNotMatch(sh, /--drip=/, "drip.sh must NOT use the v1 --drip= path (collapses the feed)");
});

test("drift guard: plist fires ONE slot/day (multi-slot + --daily = overpost)", () => {
  const plist = fs.readFileSync(
    new URL("./com.paintcolorhq.pinterest-drip.plist.template", import.meta.url),
    "utf8",
  );
  // A single <dict> StartCalendarInterval is required. An <array> of slots would
  // re-fill the full daily quota on every slot — keep --daily ⇔ one slot.
  assert.doesNotMatch(
    plist,
    /StartCalendarInterval<\/key>\s*<array>/,
    "plist must use a single StartCalendarInterval dict, not an array of slots",
  );
});
