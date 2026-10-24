import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyOutboundLink, colorFromPagePath } from "./outbound-link";

const page = (pagePath: string, rel?: string) => ({ pagePath, pageHost: "www.paintcolorhq.com", rel });

test("Home Depot click from a Behr color page carries the color, not the hostname", () => {
  const r = classifyOutboundLink(
    "https://www.homedepot.com/s/Behr%20Swiss%20Coffee%20paint",
    page("/colors/behr/swiss-coffee", "nofollow noopener noreferrer"),
  );
  assert.deepEqual(r, {
    outbound_url: "https://www.homedepot.com/s/Behr%20Swiss%20Coffee%20paint",
    retailer: "homedepot.com",
    affiliate: "false",
    color_brand: "behr",
    color_slug: "swiss-coffee",
  });
});

test("Dutch Boy official-color and Menards clicks are tracked (Menards was missed before)", () => {
  const dutch = classifyOutboundLink(
    "https://www.dutchboy.com/en/colors/color-library/paint/whisper-white",
    page("/colors/dutch-boy/whisper-white"),
  );
  assert.equal(dutch?.retailer, "dutchboy.com");
  assert.equal(dutch?.color_brand, "dutch-boy");
  assert.equal(dutch?.color_slug, "whisper-white");
  const menards = classifyOutboundLink(
    "https://www.menards.com/main/search.html?search=Dutch%20Boy%20Whisper%20White%20paint",
    page("/colors/dutch-boy/whisper-white"),
  );
  assert.equal(menards?.retailer, "menards.com");
});

test("rel=sponsored marks the click as affiliate", () => {
  const r = classifyOutboundLink("https://www.amazon.com/dp/B000", page("/tools/paint-calculator", "sponsored nofollow noopener noreferrer"));
  assert.equal(r?.affiliate, "true");
  assert.equal(r?.retailer, "amazon.com");
  assert.equal(r?.color_brand, undefined);
});

test("affiliate-network redirects report the wrapped store as the retailer", () => {
  const cj = classifyOutboundLink(
    "https://www.jdoqocy.com/click-1-2?url=https%3A%2F%2Fsamplize.com%2Fproducts%2Fagreeable-gray",
    page("/colors/sherwin-williams/agreeable-gray"),
  );
  assert.equal(cj?.retailer, "samplize.com");
  assert.equal(cj?.affiliate, "true");
  const impact = classifyOutboundLink(
    "https://homedepot.sjv.io/c/1/2/3?u=https%3A%2F%2Fwww.homedepot.com%2Fs%2FBehr",
    page("/colors/behr/swiss-coffee"),
  );
  assert.equal(impact?.retailer, "homedepot.com");
});

test("share, social, self, relative and non-http links are not retailer clicks", () => {
  for (const href of [
    "https://www.pinterest.com/pin/create/button/?url=x",
    "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.paintcolorhq.com%2F",
    "https://x.com/intent/tweet?text=hi",
    "https://www.reddit.com/submit?url=x",
    "https://www.linkedin.com/company/paint-color-hq",
    "https://www.paintcolorhq.com/colors/behr/swiss-coffee",
    "https://paintcolorhq.com/blog",
    "/colors/behr/swiss-coffee",
    "mailto:support@paintcolorhq.com",
    "tel:+15555550100",
  ]) {
    assert.equal(classifyOutboundLink(href, page("/colors/behr/swiss-coffee")), null, href);
  }
});

test("links to the preview host itself are self links", () => {
  assert.equal(
    classifyOutboundLink("https://pchq-abc.vercel.app/blog", { pagePath: "/", pageHost: "pchq-abc.vercel.app" }),
    null,
  );
});

test("color comes from color and match page paths only", () => {
  assert.deepEqual(colorFromPagePath("/colors/behr/swiss-coffee"), { color_brand: "behr", color_slug: "swiss-coffee" });
  assert.deepEqual(colorFromPagePath("/colors/family/beige"), {});
  assert.deepEqual(colorFromPagePath("/colors/hue/warm-whites"), {});
  assert.deepEqual(colorFromPagePath("/match/sherwin-williams/agreeable-gray-to-benjamin-moore"), {
    color_brand: "sherwin-williams",
    color_slug: "agreeable-gray",
  });
  assert.deepEqual(colorFromPagePath("/match/sherwin-williams/to/behr"), {});
  assert.deepEqual(colorFromPagePath("/blog/best-whites"), {});
});
