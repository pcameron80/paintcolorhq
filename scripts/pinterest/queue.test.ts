import { test } from "node:test";
import assert from "node:assert/strict";
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
  assert.equal(picks[1], "c");
});
