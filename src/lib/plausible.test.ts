import { test } from "node:test";
import assert from "node:assert/strict";
import { withNonInteractiveFlag } from "./plausible";

test("adds interactive:false when the tracker sent i:false", () => {
  const body = '{"n":"Web Vitals","u":"https://www.paintcolorhq.com/","d":"paintcolorhq.com","p":{"metric":"LCP"},"i":false}';
  assert.deepEqual(JSON.parse(withNonInteractiveFlag(body)), { ...JSON.parse(body), interactive: false });
});

test("leaves interactive events and pageviews byte-identical", () => {
  const pageview = '{"n":"pageview","u":"https://www.paintcolorhq.com/","d":"paintcolorhq.com","r":null}';
  const search = '{"n":"Color Search","u":"https://www.paintcolorhq.com/","d":"paintcolorhq.com","p":{"term":"i\\":false"}}';
  assert.equal(withNonInteractiveFlag(pageview), pageview);
  assert.equal(withNonInteractiveFlag(search), search);
});

test("passes through bodies it cannot parse", () => {
  assert.equal(withNonInteractiveFlag('{"i":false'), '{"i":false');
});
