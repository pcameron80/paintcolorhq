import { test } from "node:test";
import assert from "node:assert/strict";
import { citedDomain, cleanUrl, parseAnswer } from "./ai-visibility";

test("Gemini grounding redirects use the title as the domain", () => {
  assert.equal(citedDomain("https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZ", "www.matchthatpaint.com"), "matchthatpaint.com");
  assert.equal(citedDomain("https://www.paintcolorhq.com/colors/x", "anything"), "paintcolorhq.com");
  assert.equal(citedDomain("not a url", "x"), null);
});

test("utm parameters are stripped from cited URLs", () => {
  assert.equal(cleanUrl("https://www.paintcolorhq.com/match?utm_source=openai"), "https://www.paintcolorhq.com/match");
});

test("ChatGPT reasoning summaries are ignored; the message's citations count", () => {
  const a = parseAnswer(
    "chatgpt",
    [
      { type: "reasoning", sections: [{ type: "summary_text", text: "maybe paintcolorhq", annotations: [{ url: "https://www.paintcolorhq.com/a" }] }] },
      { type: "message", sections: [{ type: "text", text: "Use Cotton Grey.", annotations: [{ title: "x", url: "https://matchthatpaint.com/a?utm_source=openai" }, { title: "y", url: "https://www.paintcolorhq.com/match/sherwin-williams/agreeable-gray-7029-to-behr?utm_source=openai" }] }] },
    ],
    0.03,
  );
  assert.equal(a.cited, true);
  assert.equal(a.mentioned, false);
  assert.deepEqual(a.domains, ["matchthatpaint.com", "paintcolorhq.com"]);
  assert.deepEqual(a.ourUrls, ["https://www.paintcolorhq.com/match/sherwin-williams/agreeable-gray-7029-to-behr"]);
});

test("a Gemini citation of our domain counts, and naming us in text is recorded", () => {
  const a = parseAnswer("gemini", [{ type: "message", sections: [{ text: "Paint Color HQ lists it.", annotations: [{ title: "paintcolorhq.com", url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/Q" }] }] }], 0.03);
  assert.equal(a.cited, true);
  assert.equal(a.mentioned, true);
  assert.deepEqual(a.ourUrls, ["paintcolorhq.com"]);
});

test("no annotations means not cited", () => {
  const a = parseAnswer("perplexity", [{ type: "message", sections: [{ text: "Cotton Grey", annotations: null }] }], 0.006);
  assert.equal(a.cited, false);
  assert.deepEqual(a.domains, []);
});
