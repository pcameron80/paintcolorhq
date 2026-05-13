import type { ColorWithBrand, CrossBrandMatchWithColor } from "./types";
import { hexToHsl } from "./palettes";

// ---------- Derived color properties ----------

type Temperature = "warm" | "cool" | "neutral";
type LightnessCategory = "very light" | "light" | "medium" | "deep" | "dark";

interface DerivedProps {
  temperature: Temperature;
  lightness: LightnessCategory;
  isAchromatic: boolean;
  hue: number;
}

function deriveProps(color: ColorWithBrand): DerivedProps {
  const [h, s, l] = hexToHsl(color.hex);
  const lrv = color.lrv != null ? Number(color.lrv) : null;
  const labA = color.lab_a != null ? Number(color.lab_a) : null;
  const labB = color.lab_b_val != null ? Number(color.lab_b_val) : null;

  const isAchromatic = s < 8;

  // Temperature: use LAB a* if available, else hue
  let temperature: Temperature;
  if (isAchromatic) {
    if (labA != null && labB != null) {
      temperature = labA > 1 || labB > 2 ? "warm" : labA < -1 || labB < -2 ? "cool" : "neutral";
    } else {
      temperature = "neutral";
    }
  } else if (labA != null) {
    if (labA > 3) temperature = "warm";
    else if (labA < -3) temperature = "cool";
    else if (h >= 15 && h < 75) temperature = "warm";
    else if (h >= 75 && h < 165) temperature = "cool";
    else if (h >= 165 && h < 260) temperature = "cool";
    else temperature = "warm";
  } else {
    if (h >= 15 && h < 75) temperature = "warm";
    else if (h >= 260 || h < 15) temperature = "warm";
    else temperature = "cool";
  }

  // Lightness from LRV (preferred) or HSL
  let lightness: LightnessCategory;
  const lightnessVal = lrv ?? l;
  if (lightnessVal >= 82) lightness = "very light";
  else if (lightnessVal >= 55) lightness = "light";
  else if (lightnessVal >= 30) lightness = "medium";
  else if (lightnessVal >= 12) lightness = "deep";
  else lightness = "dark";

  return { temperature, lightness, isAchromatic, hue: h };
}

// ---------- Hue name helper ----------

function getHueName(hue: number): string {
  if (hue < 15) return "red";
  if (hue < 40) return "orange";
  if (hue < 70) return "yellow";
  if (hue < 150) return "green";
  if (hue < 200) return "teal";
  if (hue < 260) return "blue";
  if (hue < 290) return "purple";
  if (hue < 330) return "magenta";
  return "red";
}

// ---------- SEO query-targeting sentences ----------

// LRV bucket → room-application sentence. Splits across 4 LRV ranges so the
// generated copy varies meaningfully across the 25k color pages instead of
// reading as a templated string repeated thousands of times — that pattern
// was a known driver of the March 2026 Helpful Content suppression.
function getLrvApplicationSentence(name: string, lrv: number): string {
  if (lrv >= 70) {
    return `With a Light Reflectance Value of ${lrv}, ${name} reflects a generous amount of light, making it well-suited for north-facing rooms or smaller spaces that benefit from extra brightness.`;
  }
  if (lrv >= 50) {
    return `At LRV ${lrv}, ${name} sits in the comfortable mid-light range — bright enough for living areas yet soft enough for bedrooms, and adaptable across most lighting conditions.`;
  }
  if (lrv >= 25) {
    return `Its LRV of ${lrv} gives ${name} depth without going dark, which makes it a strong choice for accent walls, libraries, and rooms with abundant natural light.`;
  }
  return `With an LRV of ${lrv}, ${name} creates a dramatic, enveloping mood — best on accent walls, dining rooms, and intimate spaces where atmosphere matters more than reflected light.`;
}

// Temperature → trim/hardware pairing sentence. Gives an opinionated styling
// recommendation that varies by warm/cool/neutral so the copy reads less
// templated.
function getPairingSentence(name: string, temperature: Temperature): string {
  if (temperature === "warm") {
    return `Pair it with warm whites like Sherwin-Williams Pure White or Benjamin Moore White Dove for trim, plus natural wood tones and brass hardware for a coordinated warm palette.`;
  }
  if (temperature === "cool") {
    return `Pair it with cool whites such as Benjamin Moore Chantilly Lace for trim, plus brushed nickel hardware and gray-toned flooring for a cohesive cool palette.`;
  }
  return `As a neutral, ${name} pairs flexibly — crisp whites for trim, oak or walnut floors, and either warm brass or cool nickel hardware depending on the mood you want.`;
}

// Temperature → lighting-behavior sentence. Bulb-color guidance is one of the
// most-asked questions about residential paint and rarely appears in
// programmatic color descriptions — adding it lifts the page out of pure
// data-sheet territory.
function getLightingBehaviorSentence(name: string, temperature: Temperature): string {
  if (temperature === "warm") {
    return `Under 2700K-3000K warm bulbs ${name} stays true to itself; under 4000K+ cool LED bulbs it reads slightly more muted but keeps its warmth.`;
  }
  if (temperature === "cool") {
    return `${name} holds its coolness under cool LED lighting (4000K and up) but can shift warmer under 2700K incandescent or warm-white bulbs — worth sampling in your actual room lighting.`;
  }
  return `${name} stays neutral across most lighting conditions, though warm 2700K bulbs will slightly amplify any underlying warm undertones while cool 4000K bulbs do the opposite.`;
}

function getQueryTargetingSentences(
  color: ColorWithBrand,
  matches: CrossBrandMatchWithColor[],
  props: DerivedProps
): string {
  const family = color.color_family || getHueName(props.hue);
  const hex = color.hex.toUpperCase();
  const tempWord = props.temperature === "neutral" ? "neutral" : props.temperature;

  // "What color is X" — directly answers the most common query pattern
  const whatColorIs = `What color is ${color.name}? It's a ${props.lightness} ${tempWord} ${family} with the hex code ${hex}.`;

  // "Colors similar to X" — answers "colors similar to" / "colors close to" queries
  const closeMatches = matches.filter((m) => Number(m.delta_e_score) < 3).slice(0, 3);
  let similarColors = "";
  if (closeMatches.length >= 2) {
    const names = closeMatches.map(
      (m) => `${m.match_color.brand.name} ${m.match_color.name}`
    );
    similarColors = `Colors similar to ${color.name} include ${names.join(", ")}.`;
  }

  // Undertone callout for "{color} undertones" queries
  const undertoneCallout = color.undertone
    ? `${color.name} has a ${color.undertone.toLowerCase()} undertone, which affects how it pairs with trim, flooring, and adjacent wall colors.`
    : "";

  // LRV-driven room application context — adds use-case framing that lifts
  // the description into the 134-167 word citation window the GEO audit
  // identified as the optimal range for AI engines (Perplexity, AI Overviews).
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const lrvSentence = lrv != null ? getLrvApplicationSentence(color.name, lrv) : "";

  // Trim/hardware pairing recommendation, varied by temperature
  const pairingSentence = getPairingSentence(color.name, props.temperature);

  // Lighting-behavior guidance — concrete bulb temperature advice
  const lightingSentence = getLightingBehaviorSentence(color.name, props.temperature);

  return [
    whatColorIs,
    similarColors,
    undertoneCallout,
    lrvSentence,
    pairingSentence,
    lightingSentence,
  ]
    .filter(Boolean)
    .join(" ");
}

// ---------- Public API ----------

export function generateColorDescription(
  color: ColorWithBrand,
  matches: CrossBrandMatchWithColor[]
): string {
  const props = deriveProps(color);
  return getQueryTargetingSentences(color, matches, props);
}

const TOP_BRANDS_FOR_COMPARE = ["Sherwin-Williams", "Benjamin Moore", "Behr", "PPG"];

export function generateMetaDescription(color: ColorWithBrand): string {
  const props = deriveProps(color);
  const family = color.color_family || getHueName(props.hue);
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const colorNum = color.color_number ? ` (${color.color_number})` : "";
  const lrvPart = lrv != null ? `, LRV ${lrv}` : "";
  const undertonePart = color.undertone ? `, ${color.undertone.toLowerCase()} undertone` : "";

  // Pick 3 well-known brands different from the source for the cross-brand
  // comparison list. With 14 brands total, "and 10 more" is correct whether
  // the source is one of the top 4 or not.
  const compareTo = TOP_BRANDS_FOR_COMPARE.filter((b) => b !== color.brand.name).slice(0, 3);
  const compareList = `${compareTo.join(", ")}, and 10 more`;

  const result = `${color.brand.name} ${color.name}${colorNum} — ${family}${lrvPart}${undertonePart}. Compare matches across ${compareList}.`;

  if (result.length <= 160) return result;
  const trimmed = result.slice(0, 157);
  const lastSpace = trimmed.lastIndexOf(" ");
  return trimmed.slice(0, lastSpace > 120 ? lastSpace : 157) + "...";
}
