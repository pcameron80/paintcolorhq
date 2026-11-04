// Generated text for /colors/[brand]/[color]: the title and meta description,
// the FAQ and the Pinterest description. Pure functions of the color and its
// matches, so the offline report (scripts/mp40-report.ts) runs the same code
// the page does.
//
// Every builder takes `isHead`. The 13 head colors (head-colors.ts) keep their
// pre-MP-40 strings byte for byte until their read: the `isHead` branches below
// are copies of the old page code, em dashes, "a estimated" and all. Do not
// "fix" them; B-34 removes the guard.

import { REVIEWED_COLOR_PAGES } from "./color-review";
import { closenessLabelLower, closenessTier } from "./closeness";
import { generateMetaDescription, nearestMatchesPerBrand } from "./color-description";
import { FORMER_NAMES } from "./former-names";
import { extractVariantSuffix } from "./indexing";
import { MAJOR_MATCH_BRANDS, UNVERIFIED_BUY_BRANDS } from "./popular-colors";
import { capMeta, codeSuffix, displayColorNumber } from "./text";
import { colorMatchesDescription, colorTitle, legacyMatchesArmDescription, legacyMatchesArmTitle, titleArm } from "./title-test";
import { displayUndertone } from "./undertone-display";
import type { ColorWithBrand, CrossBrandMatchWithColor } from "./types";

/** The color's code as page copy prints it (" 7029"), "" when absent or when
 *  the name already ends with it. Head colors keep the raw " {code}". */
export function codeForCopy(color: ColorWithBrand, isHead: boolean): string {
  if (isHead) return color.color_number ? ` ${color.color_number}` : "";
  return codeSuffix(color.name, color.color_number ? displayColorNumber(color.brand.slug, color.color_number) : null);
}

/** The undertone label to print for this page, or null. Head colors print the
 *  stored label as before. */
export function pageUndertone(color: ColorWithBrand, isHead: boolean): string | null {
  return isHead ? color.undertone : displayUndertone(color);
}

export function colorMetadataText(opts: {
  color: ColorWithBrand;
  brandSlug: string;
  colorSlug: string;
  matches: CrossBrandMatchWithColor[];
  isHead: boolean;
}): { title: { absolute: string } | string; description: string } {
  const { color, brandSlug, colorSlug, matches, isHead } = opts;
  const key = `${brandSlug}/${colorSlug}`;
  const variant = extractVariantSuffix(colorSlug, color.color_number);
  const reviewed = Boolean(REVIEWED_COLOR_PAGES[key]);
  const formerName = FORMER_NAMES[key];
  const former = formerName && formerName !== color.name ? ` Previously listed as ${formerName}.` : "";

  if (isHead) {
    const colorNum = color.color_number ? ` ${color.color_number}` : "";
    const lrvForTitle = color.lrv != null ? Math.round(Number(color.lrv)) : null;
    const familyForTitle = color.color_family
      ? color.color_family.charAt(0).toUpperCase() + color.color_family.slice(1)
      : null;
    const titleSuffix = familyForTitle
      ? ` | ${lrvForTitle != null ? `LRV ${lrvForTitle} ` : ""}${familyForTitle} Paint Color`
      : ` | ${color.hex.toUpperCase()}`;
    let title: { absolute: string } | string = reviewed
      ? { absolute: `${color.brand.name} ${color.name}${colorNum}: Color Matches` }
      : `${color.name}${colorNum} by ${color.brand.name}${variant}${titleSuffix}`;
    let description = generateMetaDescription(color, [], { legacy: true }) + variant;
    if (!reviewed && titleArm(brandSlug, colorSlug) === "matches") {
      title = { absolute: legacyMatchesArmTitle(color.name, colorNum, color.brand.name, variant) };
      description = legacyMatchesArmDescription(color.name, lrvForTitle, nearestMatchesPerBrand(matches)) ?? description;
    }
    return { title, description: `${description}${former}` };
  }

  const perBrand = nearestMatchesPerBrand(matches);
  const title = reviewed
    ? { absolute: `${color.brand.name} ${color.name}${color.color_number ? ` ${color.color_number}` : ""}: Color Matches` }
    : { absolute: colorTitle({ name: color.name, brandName: color.brand.name, brandSlug, colorNumber: color.color_number, variant, hasMatches: perBrand.length > 0 }) };
  const fallback = () => generateMetaDescription(color, perBrand) + variant;
  const description = (reviewed ? fallback() : colorMatchesDescription(color, perBrand) ?? fallback());
  return { title, description: capMeta(`${description}${former}`) };
}

// ---- FAQ ----

const MAJOR = MAJOR_MATCH_BRANDS as readonly string[];

/** Up to 3 distinct-brand matches to name in the FAQ: nearest first, never an
 *  unverified brand, and at least one major brand when any has a match. */
export function faqMatchPicks(matches: CrossBrandMatchWithColor[]): CrossBrandMatchWithColor[] {
  const pool = nearestMatchesPerBrand(matches.filter((m) => !UNVERIFIED_BUY_BRANDS.has(m.match_color.brand.slug)));
  const picks = pool.slice(0, 3);
  if (!picks.some((m) => MAJOR.includes(m.match_color.brand.slug))) {
    const major = pool.find((m) => MAJOR.includes(m.match_color.brand.slug));
    if (major) {
      if (picks.length >= 3) picks[2] = major;
      else picks.push(major);
      picks.sort((x, y) => Number(x.delta_e_score) - Number(y.delta_e_score));
    }
  }
  return picks;
}

export function buildColorFaq(color: ColorWithBrand, matches: CrossBrandMatchWithColor[], isHead: boolean): Array<{ question: string; answer: string }> {
  const faqItems: Array<{ question: string; answer: string }> = [];
  const lrv = color.lrv != null ? Number(color.lrv) : null;
  const undertone = pageUndertone(color, isHead);
  const closenessPhrase = (de: number) => `${closenessLabelLower(de)} in our digital data`;
  const family = color.color_family ? ` and sits in the ${color.color_family} color family` : "";

  // FAQ answers lead with per-color DATA (undertone / match list / LRV value) so
  // each is a citeable standalone passage for AI Overviews / Perplexity / Copilot.
  // The generic explainer sentences were trimmed: identical across 26K pages,
  // they added duplication, not citability. Delta E stays plain language.
  if (undertone) {
    faqItems.push({
      question: `What undertone does ${color.name} have?`,
      answer: `${color.name} by ${color.brand.name} has a ${undertone.toLowerCase()} undertone${family}. This is a digital classification, not a prediction of physical paint under every light. Compare samples in your own space.`,
    });
  }
  if (matches.length > 0) {
    const question = `What colors match ${color.name} from other brands?`;
    if (isHead) {
      const topList = matches.slice(0, 3).map((m) => `${m.match_color.name} by ${m.match_color.brand.name} (${closenessPhrase(Number(m.delta_e_score))})`).join(", ");
      faqItems.push({
        question,
        answer: `The closest cross-brand equivalents to ${color.name} are ${topList} — the best options for getting ${color.name}'s look from a brand your local store carries. Confirm with a physical sample, since sheen and lighting shift the final result.`,
      });
    } else {
      const picks = faqMatchPicks(matches);
      if (picks.length > 0) {
        const topList = picks.map((m) => `${m.match_color.name} by ${m.match_color.brand.name} (${closenessPhrase(Number(m.delta_e_score))})`).join(", ");
        const allVisible = picks.every((m) => closenessTier(Number(m.delta_e_score)) === "visible-difference");
        const hasMajor = picks.some((m) => MAJOR.includes(m.match_color.brand.slug));
        const answer = allVisible
          ? `For ${color.name}, the options are ${topList}. No brand has a very similar match in our data. These are the nearest, and each is a visible difference, so test samples before choosing.`
          : `The closest cross-brand matches to ${color.name} are ${topList}.${hasMajor ? ` These are the best options for getting ${color.name}'s look from a brand your local store carries.` : ""} Confirm with a physical sample, since sheen and lighting shift the final result.`;
        faqItems.push({ question, answer });
      }
    }
  }
  if (lrv != null) {
    // Head-color pages keep the frozen pre-push wording (em dashes and the old
    // "a estimated lightness value" sentence) until their read date.
    const dash = isHead ? " — " : ", ";
    const lrvBand =
      lrv >= 70 ? `a light, reflective color that bounces plenty of light back into a room${dash}well-suited to north-facing spaces, hallways, and smaller rooms that need to feel brighter`
      : lrv >= 50 ? `a mid-light color${dash}bright enough for living areas yet soft enough for bedrooms, and adaptable across most lighting conditions`
      : lrv >= 25 ? `a mid-depth color with real presence${dash}strong on accent walls, libraries, and rooms with good natural light`
      : "a deep, dramatic color best saved for accent walls, dining rooms, and cozy spaces where atmosphere matters more than reflected light";
    faqItems.push({
      question: `What is the LRV of ${color.name}?`,
      answer: isHead
        ? `${color.name} has a estimated lightness value of ${lrv.toFixed(1)}, on a scale where 0 is pure black and 100 is pure white — that makes it ${lrvBand}.`
        : `${color.name} has an estimated light reflectance value (LRV) of ${lrv.toFixed(1)}, on a scale where 0 is pure black and 100 is pure white. That makes it ${lrvBand}.`,
    });
  }
  return faqItems;
}

// ---- Pinterest ----

export function buildPinDescription(color: ColorWithBrand, isHead: boolean): string {
  const pinFamily = color.color_family ? ` ${color.color_family}` : "";
  const pinLrv = color.lrv != null ? `, LRV ${Math.round(Number(color.lrv))}` : "";
  const undertone = pageUndertone(color, isHead);
  const pinUndertone = undertone ? `, ${undertone.toLowerCase()} undertone` : "";
  const brandHashtag = `#${color.brand.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const familyHashtag = color.color_family
    ? ` #${color.color_family.toLowerCase().replace(/[^a-z0-9]/g, "")}paint`
    : "";
  const dash = isHead ? " —" : ":";
  const code = isHead
    ? (color.color_number ? ` (${color.color_number})` : "")
    : (codeForCopy(color, false) ? ` (${displayColorNumber(color.brand.slug, color.color_number!)})` : "");
  return `${color.brand.name} ${color.name}${code}${dash}${pinFamily} paint color${pinLrv}${pinUndertone}. Cross-brand matches at PaintColorHQ.com #paintcolor ${brandHashtag}${familyHashtag}`;
}
