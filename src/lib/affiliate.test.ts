import { test } from "node:test";
import assert from "node:assert/strict";
import { getEcosAwinUrl, getSampleLinks } from "./affiliate";
import { HEAD_COLOR_PUSH } from "./head-colors";

const info = (brandSlug: string, colorSlug: string, colorName: string) => ({
  brandSlug,
  colorSlug,
  brandName: "Brand",
  colorName,
});

test("ECOS Awin link carries the program, publisher, encoded destination and surface", () => {
  assert.equal(
    getEcosAwinUrl("https://ecospaints.net/browse-all/lullaby-eggshell-paint", "nursery-guide"),
    "https://www.awin1.com/cread.php?awinmid=92075&awinaffid=3135251&ued=https%3A%2F%2Fecospaints.net%2Fbrowse-all%2Flullaby-eggshell-paint&clickref=nursery-guide",
  );
});

test("a normal color gets a non-primary ECOS link after Amazon, naming the color", () => {
  const links = getSampleLinks(info("behr", "swiss-coffee-12", "Swiss Coffee"));
  assert.match(links[links.length - 2].url, /amazon\.com/);
  const ecos = links[links.length - 1];
  assert.equal(ecos.label, "Have ECOS Paints match Swiss Coffee");
  assert.equal(ecos.program, "ecos");
  assert.equal(ecos.affiliate, true);
  assert.equal(ecos.primary, undefined);
  assert.match(ecos.url, /ued=https%3A%2F%2Fecospaints\.net%2Fcolor-matching&clickref=color-page$/);
});

test("none of the 13 frozen head colors gets an ECOS link", () => {
  assert.equal(HEAD_COLOR_PUSH.length, 13);
  for (const key of HEAD_COLOR_PUSH) {
    const [brandSlug, colorSlug] = key.split("/");
    const links = getSampleLinks(info(brandSlug, colorSlug, "Head Color"));
    assert.equal(links.some((l) => l.program === "ecos"), false, key);
  }
});
