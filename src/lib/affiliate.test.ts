import { test } from "node:test";
import assert from "node:assert/strict";
import { getEcosAwinUrl, getSampleLinks } from "./affiliate";
import { HEAD_COLOR_PUSH } from "./head-colors";

const info = (
  brandSlug: string,
  colorSlug: string,
  colorName: string,
  brandName = "Brand",
  colorNumber?: string | null,
) => ({
  brandSlug,
  colorSlug,
  brandName,
  colorName,
  colorNumber,
});

const ecosLink = (...args: Parameters<typeof info>) => getSampleLinks(info(...args)).at(-1)!;

// The page ECOS's button lands on, read back out of the Awin link.
const ecosDestination = (awinUrl: string) => new URL(awinUrl).searchParams.get("ued")!;
const ecosForm = (awinUrl: string) => new URL(ecosDestination(awinUrl)).searchParams;

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
  assert.equal(new URL(ecos.url).searchParams.get("clickref"), "color-page");
});

test("the ECOS link opens the form filled in, in the form ECOS documents", () => {
  const ecos = ecosLink("benjamin-moore", "saybrook-sage-hc-114", "Saybrook Sage", "Benjamin Moore", "HC-114");
  assert.equal(
    ecosDestination(ecos.url),
    "https://ecospaints.net/color-matching?cm_brand=Benjamin+Moore&cm_name=Saybrook+Sage&cm_number=HC-114",
  );
});

test("ECOS gets the color number as the brand prints it", () => {
  const number = (brandSlug: string, code: string) =>
    ecosForm(ecosLink(brandSlug, "a-color", "A Color", "Brand", code).url).get("cm_number");
  assert.equal(number("sherwin-williams", "7015"), "SW 7015");
  assert.equal(number("sherwin-williams", "20"), "SW 0020");
  assert.equal(number("ppg", "1006-1"), "PPG1006-1");
  assert.equal(number("behr", "UL150-8"), "UL150-8");
});

test("a color with no number leaves cm_number out", () => {
  for (const code of [null, undefined, "", "  "]) {
    const form = ecosForm(ecosLink("behr", "a-color", "A Color", "Behr", code).url);
    assert.equal(form.has("cm_number"), false, String(code));
    assert.equal(form.get("cm_brand"), "Behr");
    assert.equal(form.get("cm_name"), "A Color");
  }
});

test("names with apostrophes, ampersands and accents reach ECOS intact", () => {
  const cases: [string, string][] = [
    ["Behr", "C'est La Vie"],
    ["Behr", "Pearls & Lace"],
    ["Behr", "Crème De La Crème"],
    ["Farrow & Ball", "Elephant's Breath"],
    ["Hirshfield's", "À la Mode"],
  ];
  for (const [brandName, colorName] of cases) {
    const form = ecosForm(ecosLink("behr", "a-color", colorName, brandName, "1").url);
    assert.equal(form.get("cm_brand"), brandName);
    assert.equal(form.get("cm_name"), colorName);
    assert.equal(form.get("cm_number"), "1");
  }
});

test("none of the 13 frozen head colors gets an ECOS link", () => {
  assert.equal(HEAD_COLOR_PUSH.length, 13);
  for (const key of HEAD_COLOR_PUSH) {
    const [brandSlug, colorSlug] = key.split("/");
    const links = getSampleLinks(info(brandSlug, colorSlug, "Head Color"));
    assert.equal(links.some((l) => l.program === "ecos"), false, key);
  }
});
