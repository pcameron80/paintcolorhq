import { test } from "node:test";
import assert from "node:assert/strict";
import { isIgnoredHost, normalizeReferrer, referrerFromHeaders, MAX_REFERRER_URL_LENGTH } from "./attribution";

test("strips query, fragment and credentials, lowercases the host", () => {
  assert.deepEqual(normalizeReferrer("https://User:pw@Blog.Example.COM/paint/match?utm=x#top"), {
    url: "https://blog.example.com/paint/match",
    host: "blog.example.com",
  });
});

test("keeps a non-default port in the URL but not in the host", () => {
  assert.deepEqual(normalizeReferrer("http://shop.example.org:8080/a"), {
    url: "http://shop.example.org:8080/a",
    host: "shop.example.org",
  });
});

test("an origin becomes the site root", () => {
  assert.equal(normalizeReferrer("https://designer.co")?.url, "https://designer.co/");
});

test("caps the URL length", () => {
  const long = "https://example.org/" + "a".repeat(1000);
  assert.equal(normalizeReferrer(long)?.url.length, MAX_REFERRER_URL_LENGTH);
});

test("ignores missing, junk and non-http values", () => {
  for (const v of [null, undefined, "", "   ", "null", "not a url", "file:///etc/passwd", "chrome-extension://abc/x"]) {
    assert.equal(normalizeReferrer(v), null, String(v));
  }
});

test("ignores our own hosts, previews and local or private addresses", () => {
  for (const v of [
    "https://www.paintcolorhq.com/embed",
    "https://paintcolorhq.com/",
    "https://paintcolorhq-git-feature-x.vercel.app/api",
    "http://localhost:3000/",
    "http://app.localhost/",
    "http://127.0.0.1/",
    "http://192.168.2.110:8000/",
    "http://10.0.0.5/",
    "http://172.20.1.1/",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "http://[fd00::1]/",
    "http://tower/",
    "http://nas.local/",
  ]) {
    assert.equal(normalizeReferrer(v), null, v);
  }
});

test("does not mistake look-alike hosts for ours", () => {
  assert.equal(normalizeReferrer("https://notpaintcolorhq.com/x")?.host, "notpaintcolorhq.com");
  assert.equal(normalizeReferrer("https://paintcolorhq.com.evil.io/x")?.host, "paintcolorhq.com.evil.io");
  assert.equal(isIgnoredHost("172.32.0.1"), false);
  assert.equal(isIgnoredHost("93.184.216.34"), false);
});

test("Referer wins, Origin is the fallback", () => {
  assert.equal(referrerFromHeaders("https://a.example.com/p?q=1", "https://b.example.com")?.url, "https://a.example.com/p");
  assert.equal(referrerFromHeaders(null, "https://b.example.com")?.url, "https://b.example.com/");
  assert.equal(referrerFromHeaders("garbage", "https://b.example.com")?.url, "https://b.example.com/");
  assert.equal(referrerFromHeaders(null, null), null);
});

test("a Referer from our own site never falls back to Origin", () => {
  assert.equal(referrerFromHeaders("https://www.paintcolorhq.com/embed/match", "https://b.example.com"), null);
});
