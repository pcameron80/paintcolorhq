import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPost, isExempt, type PostRange, type RangeCommit } from "./check-modified-dates-lib.ts";

const commit = (sha: string, date: string, subject = "edit"): RangeCommit =>
  ({ sha, date, subject, changed: ["        <p>New sentence.</p>"] }) as RangeCommit;
const post = (slug: string, modifiedDate: string): PostRange =>
  ({ slug, date: "2026-01-01", modifiedDate, start: 1, end: 10 }) as PostRange;

test("isExempt: a bare sha exempts every post, sha:slug only that post", () => {
  const c = commit("71aa3fe0000", "2026-10-29");
  assert.equal(isExempt(c, ["71aa3fe"], "a"), true);
  assert.equal(isExempt(c, ["71aa3fe:a"], "a"), true);
  assert.equal(isExempt(c, ["71aa3fe:a"], "b"), false);
  assert.equal(isExempt(commit("abc", "2026-10-29", "fix [no-date]"), [], "b"), true);
});

test("checkPost: a per-post ignore clears only the named post", () => {
  const commits = [commit("71aa3fe0000", "2026-10-29")];
  assert.equal(checkPost(post("a", "2026-10-11"), commits, ["71aa3fe:a"]), null);
  assert.equal(checkPost(post("b", "2026-10-11"), commits, ["71aa3fe:a"])?.slug, "b");
});
