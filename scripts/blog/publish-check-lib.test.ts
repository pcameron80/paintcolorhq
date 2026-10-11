import { test } from "node:test";
import assert from "node:assert/strict";
import {
  postsToSubmit,
  postsToInspect,
  postsNeverIndexed,
  isIndexed,
  liveProblem,
  type PostRef,
  type PublishState,
} from "./publish-check-lib.ts";

const TRIM: PostRef = { slug: "how-to-choose-trim-color", date: "2026-10-13" };
const COATS: PostRef = { slug: "how-many-coats-of-paint", date: "2026-10-15" };
const OLD: PostRef = { slug: "paint-sheen-guide", date: "2025-10-16" };
const POSTS = [TRIM, COATS, OLD];
const at = (iso: string) => new Date(iso);

test("postsToSubmit: nothing before the reveal date", () => {
  assert.deepEqual(postsToSubmit(POSTS, {}, at("2026-10-12T23:59:00Z")), []);
});

test("postsToSubmit: a post is due from 00:00 UTC on its date", () => {
  assert.deepEqual(postsToSubmit(POSTS, {}, at("2026-10-13T01:30:00Z")), [TRIM]);
});

test("postsToSubmit: old posts and already-submitted posts are skipped", () => {
  const state: PublishState = { [TRIM.slug]: { submittedAt: "2026-10-13T01:30:00Z" } };
  assert.deepEqual(postsToSubmit(POSTS, state, at("2026-10-13T13:30:00Z")), []);
});

test("postsToSubmit: an unsubmitted post is retried for 3 days, then dropped", () => {
  assert.deepEqual(postsToSubmit(POSTS, {}, at("2026-10-15T23:00:00Z")).map((p) => p.slug), [
    TRIM.slug,
    COATS.slug,
  ]);
  assert.deepEqual(postsToSubmit(POSTS, {}, at("2026-10-16T01:00:00Z")), [COATS]);
});

test("postsToInspect: only submitted, unindexed posts, at most once a day", () => {
  const state: PublishState = {
    [TRIM.slug]: {
      submittedAt: "2026-10-13T01:30:00Z",
      inspections: [{ at: "2026-10-13T01:31:00Z", verdict: "NEUTRAL", coverageState: "URL is unknown to Google" }],
    },
  };
  assert.deepEqual(postsToInspect(POSTS, state, at("2026-10-13T13:30:00Z")), []); // 12h later
  assert.deepEqual(postsToInspect(POSTS, state, at("2026-10-14T01:30:00Z")), [TRIM]); // next day
});

test("postsToInspect: stops once indexed or after 14 days", () => {
  const indexed: PublishState = { [TRIM.slug]: { submittedAt: "2026-10-13T01:30:00Z", indexedAt: "2026-10-15T01:30:00Z" } };
  assert.deepEqual(postsToInspect(POSTS, indexed, at("2026-10-16T01:30:00Z")), []);
  const waiting: PublishState = { [TRIM.slug]: { submittedAt: "2026-10-13T01:30:00Z" } };
  assert.deepEqual(postsToInspect(POSTS, waiting, at("2026-10-28T01:30:00Z")), []);
});

test("postsNeverIndexed: reported once after the window closes", () => {
  const waiting: PublishState = { [TRIM.slug]: { submittedAt: "2026-10-13T01:30:00Z" } };
  assert.deepEqual(postsNeverIndexed(POSTS, waiting, at("2026-10-28T01:30:00Z")), [TRIM]);
  const reported: PublishState = { [TRIM.slug]: { submittedAt: "x", lastProblem: "not indexed after 14 days" } };
  assert.deepEqual(postsNeverIndexed(POSTS, reported, at("2026-10-28T01:30:00Z")), []);
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
