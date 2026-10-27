import { test } from "node:test";
import assert from "node:assert/strict";
import {
  postsToSubmit,
  postsToInspect,
  postsNeverIndexed,
  isIndexed,
  liveProblem,
  nudgesDue,
  nudgedThrough,
  inspectionLink,
  NEVER_INDEXED_PROBLEM,
  type PostRef,
  type PublishState,
} from "./publish-check-lib.ts";

const TRIM: PostRef = { slug: "how-to-choose-trim-color", date: "2026-10-13" };
const COATS: PostRef = { slug: "how-many-coats-of-paint", date: "2026-10-15" };
const OLD: PostRef = { slug: "paint-sheen-guide", date: "2025-10-16" };
const POSTS = [TRIM, COATS, OLD];
const at = (iso: string) => new Date(iso);

test("postsToSubmit: nothing before the reveal date", () => {
  assert.deepEqual(postsToSubmit(POSTS, {}, at("2026-10-13T03:59:00Z")), []);
});

test("postsToSubmit: a post is due from midnight Eastern on its date", () => {
  assert.deepEqual(postsToSubmit(POSTS, {}, at("2026-10-13T05:30:00Z")), [TRIM]);
});

test("postsToSubmit: old posts and already-submitted posts are skipped", () => {
  const state: PublishState = { [TRIM.slug]: { submittedAt: "2026-10-13T05:30:00Z" } };
  assert.deepEqual(postsToSubmit(POSTS, state, at("2026-10-13T17:30:00Z")), []);
});

test("postsToSubmit: an unsubmitted post is retried for 3 days, then dropped", () => {
  assert.deepEqual(postsToSubmit(POSTS, {}, at("2026-10-16T03:00:00Z")).map((p) => p.slug), [
    TRIM.slug,
    COATS.slug,
  ]);
  assert.deepEqual(postsToSubmit(POSTS, {}, at("2026-10-16T05:00:00Z")), [COATS]);
});

test("postsToInspect: only submitted, unindexed posts, at most once a day", () => {
  const state: PublishState = {
    [TRIM.slug]: {
      submittedAt: "2026-10-13T05:30:00Z",
      inspections: [{ at: "2026-10-13T05:31:00Z", verdict: "NEUTRAL", coverageState: "URL is unknown to Google" }],
    },
  };
  assert.deepEqual(postsToInspect(POSTS, state, at("2026-10-13T17:30:00Z")), []); // 12h later
  assert.deepEqual(postsToInspect(POSTS, state, at("2026-10-14T05:30:00Z")), [TRIM]); // next day
});

test("postsToInspect: stops once indexed or after 28 days", () => {
  const indexed: PublishState = { [TRIM.slug]: { submittedAt: "2026-10-13T05:30:00Z", indexedAt: "2026-10-15T05:30:00Z" } };
  assert.deepEqual(postsToInspect(POSTS, indexed, at("2026-10-16T05:30:00Z")), []);
  const waiting: PublishState = { [TRIM.slug]: { submittedAt: "2026-10-13T05:30:00Z" } };
  assert.deepEqual(postsToInspect(POSTS, waiting, at("2026-10-28T05:30:00Z")), [TRIM]); // day 15: still checking
  assert.deepEqual(postsToInspect(POSTS, waiting, at("2026-11-11T01:30:00Z")), []); // day 29
});

test("postsNeverIndexed: reported once after the window closes", () => {
  const waiting: PublishState = { [TRIM.slug]: { submittedAt: "2026-10-13T05:30:00Z" } };
  assert.deepEqual(postsNeverIndexed(POSTS, waiting, at("2026-10-28T05:30:00Z")), []);
  assert.deepEqual(postsNeverIndexed(POSTS, waiting, at("2026-11-11T01:30:00Z")), [TRIM]);
  assert.equal(NEVER_INDEXED_PROBLEM, "not indexed after 28 days");
  const reported: PublishState = { [TRIM.slug]: { submittedAt: "x", lastProblem: NEVER_INDEXED_PROBLEM } };
  assert.deepEqual(postsNeverIndexed(POSTS, reported, at("2026-11-11T01:30:00Z")), []);
});

test("nudgesDue: reveal day, then day 3, only while unindexed", () => {
  const submitted: PublishState = { [TRIM.slug]: { submittedAt: "2026-10-13T05:30:00Z" } };
  assert.deepEqual(nudgesDue(POSTS, submitted, at("2026-10-13T05:31:00Z")), [{ post: TRIM, day: 0 }]);
  const afterDay0: PublishState = { [TRIM.slug]: { ...submitted[TRIM.slug], nudgedDays: [0] } };
  assert.deepEqual(nudgesDue(POSTS, afterDay0, at("2026-10-16T03:00:00Z")), []); // day 2
  assert.deepEqual(nudgesDue(POSTS, afterDay0, at("2026-10-16T05:30:00Z")), [{ post: TRIM, day: 3 }]);
  const afterDay3: PublishState = { [TRIM.slug]: { ...submitted[TRIM.slug], nudgedDays: [0, 3] } };
  assert.deepEqual(nudgesDue(POSTS, afterDay3, at("2026-10-20T05:30:00Z")), []);
  const indexed: PublishState = { [TRIM.slug]: { ...submitted[TRIM.slug], indexedAt: "2026-10-14T05:30:00Z" } };
  assert.deepEqual(nudgesDue(POSTS, indexed, at("2026-10-16T05:30:00Z")), []);
  assert.deepEqual(nudgesDue(POSTS, {}, at("2026-10-13T05:31:00Z")), []); // not submitted yet
});

test("nudgesDue: a missed reveal-day run raises one nudge, not two", () => {
  const late: PublishState = { [TRIM.slug]: { submittedAt: "2026-10-16T13:30:00Z" } };
  assert.deepEqual(nudgesDue(POSTS, late, at("2026-10-16T13:31:00Z")), [{ post: TRIM, day: 3 }]);
  assert.deepEqual(nudgedThrough(3), [0, 3]);
  assert.deepEqual(nudgedThrough(0, [0]), [0]);
});

test("inspectionLink: prefers the API link, else builds the inspect URL", () => {
  const url = "https://www.paintcolorhq.com/blog/how-to-choose-trim-color";
  const prop = "https://www.paintcolorhq.com/";
  assert.equal(
    inspectionLink(url, prop),
    "https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fwww.paintcolorhq.com%2F&id=" +
      encodeURIComponent(url),
  );
  const s = {
    inspections: [
      { at: "a", verdict: "NEUTRAL", coverageState: "x", link: "https://search.google.com/old" },
      { at: "b", verdict: "NEUTRAL", coverageState: "x" },
    ],
  };
  assert.equal(inspectionLink(url, prop, s), "https://search.google.com/old");
});

test("isIndexed: only a PASS verdict counts", () => {
  assert.equal(isIndexed("PASS"), true);
  assert.equal(isIndexed("NEUTRAL"), false);
});

test("liveProblem: checks status, canonical and sitemap", () => {
  const url = "https://www.paintcolorhq.com/blog/how-to-choose-trim-color";
  const html = `<head><link rel="canonical" href="${url}"/></head>`;
  const sitemap = `<url><loc>${url}</loc></url>`;
  assert.equal(liveProblem(url, 200, html, sitemap), null);
  assert.equal(liveProblem(url, 404, "", sitemap), "page returned 404");
  assert.equal(liveProblem(url, 200, "<head></head>", sitemap), "page is missing its canonical tag");
  assert.equal(liveProblem(url, 200, html, "<urlset></urlset>"), "page is live but not in sitemap/blog.xml");
});
