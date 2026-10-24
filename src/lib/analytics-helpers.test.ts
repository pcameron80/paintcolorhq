import { test } from "node:test";
import assert from "node:assert/strict";
import { detectPageType } from "./analytics";
import { navTypeFor, type NavTypeState } from "./nav-type";
import { createVitalsGate, vitalsParams, vitalsValue } from "./web-vitals";
import { createSearchSettler } from "./use-search-tracking";

test("detectPageType separates the match hub, listings and hue bands", () => {
  assert.equal(detectPageType("/match"), "match_hub");
  assert.equal(detectPageType("/match/sherwin-williams/to/behr"), "match_listing");
  assert.equal(detectPageType("/match/sherwin-williams/agreeable-gray-to-behr"), "match");
  assert.equal(detectPageType("/colors/hue/warm-whites"), "hue_band");
  assert.equal(detectPageType("/colors/family/beige"), "family");
  assert.equal(detectPageType("/colors/behr/swiss-coffee"), "color");
  assert.equal(detectPageType("/brands/behr"), "brand");
  assert.equal(detectPageType("/"), "homepage");
  assert.equal(detectPageType("/privacy"), "other");
});

test("nav_type is full for the landing page, soft after the first navigation", () => {
  const s: NavTypeState = { landingPath: null, leftLanding: false };
  assert.equal(navTypeFor(s, "/colors/behr/swiss-coffee"), "full");
  assert.equal(navTypeFor(s, "/colors/behr/swiss-coffee"), "full");
  assert.equal(navTypeFor(s, "/brands/behr"), "soft");
  // Back to the landing page by client navigation is still soft.
  assert.equal(navTypeFor(s, "/colors/behr/swiss-coffee"), "soft");
});

test("web vitals: CLS x1000, timings in ms, non_interaction set", () => {
  assert.equal(vitalsValue("CLS", 0.0834), 83);
  assert.equal(vitalsValue("LCP", 2412.6), 2413);
  const p = vitalsParams({ id: "v1", name: "INP", value: 184.2, rating: "good", navigationType: "navigate" }, "color");
  assert.deepEqual(p, {
    metric_name: "INP",
    metric_value: 184,
    metric_rating: "good",
    navigation_type: "navigate",
    page_type: "color",
    non_interaction: true,
    transport_type: "beacon",
  });
});

test("web vitals gate: five metrics, once per id, hard cap per document", () => {
  const allow = createVitalsGate(10);
  const sent = ["LCP", "CLS", "INP", "FCP", "TTFB", "FID"].filter((name) =>
    allow({ id: `${name}-1`, name, value: 1 }),
  );
  assert.deepEqual(sent, ["LCP", "CLS", "INP", "FCP", "TTFB"]);
  assert.equal(allow({ id: "LCP-1", name: "LCP", value: 2 }), false);
  const capped = createVitalsGate(2);
  assert.equal(capped({ id: "a", name: "LCP", value: 1 }), true);
  assert.equal(capped({ id: "b", name: "CLS", value: 1 }), true);
  assert.equal(capped({ id: "c", name: "INP", value: 1 }), false);
});

// Manual clock for the settler.
function fakeClock() {
  let now = 0;
  let nextId = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  return {
    schedule: (fn: () => void, ms: number) => {
      const id = ++nextId;
      timers.set(id, { at: now + ms, fn });
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    cancel: (t: ReturnType<typeof setTimeout>) => {
      timers.delete(t as unknown as number);
    },
    advance(ms: number) {
      const end = now + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]);
        now = due[1].at;
        due[1].fn();
      }
      now = end;
    },
  };
}

test("search settles once per term after 1.5 s idle, trimmed, at least 2 chars", () => {
  const clock = fakeClock();
  const sent: [string, number][] = [];
  let count: number | null = 0;
  const s = createSearchSettler({
    getResultCount: () => count,
    send: (t, c) => sent.push([t, c]),
    schedule: clock.schedule,
    cancel: clock.cancel,
  });
  // Typing "agreeable" one key every 200 ms: nothing until it settles.
  for (const q of ["a", "ag", "agr", "agre", "agree", "agreea", "agreeab", "agreeabl", "agreeable "]) {
    s.update(q);
    clock.advance(200);
  }
  assert.deepEqual(sent, []);
  count = 7;
  clock.advance(1300);
  assert.deepEqual(sent, [["agreeable", 7]]);
  // Same term again (trailing space removed) does not resend.
  s.update("agreeable");
  clock.advance(2000);
  assert.equal(sent.length, 1);
  // Single character never counts.
  s.update("a");
  clock.advance(2000);
  assert.equal(sent.length, 1);
});

test("search waits for in-flight results and reads the count at send time", () => {
  const clock = fakeClock();
  const sent: [string, number][] = [];
  let count: number | null = null;
  const s = createSearchSettler({
    getResultCount: () => count,
    send: (t, c) => sent.push([t, c]),
    schedule: clock.schedule,
    cancel: clock.cancel,
  });
  s.update("sw 7029");
  clock.advance(1600);
  assert.deepEqual(sent, []);
  count = 0;
  clock.advance(300);
  assert.deepEqual(sent, [["sw 7029", 0]]);
});
