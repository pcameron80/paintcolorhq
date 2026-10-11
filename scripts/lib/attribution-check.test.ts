import { test } from "node:test";
import assert from "node:assert/strict";
import { detectCredit, hasCreditLink, hasEmbedIframe, isOriginOnly } from "./attribution-check";

test("finds a credit link in any common form", () => {
  for (const html of [
    `<p>Matching by <a href="https://www.paintcolorhq.com">PaintColorHQ</a></p>`,
    `<a class="x" href='https://paintcolorhq.com/colors/behr/x'>x</a>`,
    `<a href=//www.paintcolorhq.com/?utm_source=x>x</a>`,
    `<A HREF="http://www.paintcolorhq.com/">x</A>`,
  ]) {
    assert.equal(hasCreditLink(html), true, html);
  }
});

test("ignores look-alikes, plain text and non-link tags", () => {
  for (const html of [
    `<p>Data from paintcolorhq.com</p>`,
    `<a href="https://paintcolorhq.com.evil.io/">x</a>`,
    `<a href="https://notpaintcolorhq.com/">x</a>`,
    `<link rel="preconnect" href="https://www.paintcolorhq.com">`,
    `<img src="https://www.paintcolorhq.com/logo.png">`,
  ]) {
    assert.equal(hasCreditLink(html), false, html);
  }
});

test("detects our embed iframe", () => {
  assert.equal(hasEmbedIframe(`<iframe src="https://www.paintcolorhq.com/embed/match" width="100%"></iframe>`), true);
  assert.equal(hasEmbedIframe(`<iframe loading="lazy" src='//paintcolorhq.com/embed/match'></iframe>`), true);
  assert.equal(hasEmbedIframe(`<iframe src="https://www.paintcolorhq.com/colors/behr/x"></iframe>`), false);
  assert.equal(hasEmbedIframe(`<iframe src="https://evil.io/?u=https://www.paintcolorhq.com/embed"></iframe>`), false);
});

test("embed rows pass on the iframe alone; api rows need a link", () => {
  const iframeOnly = `<iframe src="https://www.paintcolorhq.com/embed/match"></iframe>`;
  assert.equal(detectCredit(iframeOnly, "embed").hasCredit, true);
  assert.equal(detectCredit(iframeOnly, "api").hasCredit, false);
  assert.equal(detectCredit(`<a href="https://www.paintcolorhq.com">c</a>`, "mcp").hasCredit, true);
  assert.equal(detectCredit("<html></html>", "embed").hasCredit, false);
});

test("origin-only URLs are flagged", () => {
  assert.equal(isOriginOnly("https://example.com/"), true);
  assert.equal(isOriginOnly("https://example.com/blog/paint"), false);
});
