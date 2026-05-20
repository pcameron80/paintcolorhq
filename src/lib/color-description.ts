import type { ColorWithBrand, CrossBrandMatchWithColor } from "./types";
import { hexToHsl } from "./palettes";

// ---------- Derived color properties ----------

type Temperature = "warm" | "cool" | "neutral";
type LightnessCategory = "very light" | "light" | "medium" | "deep" | "dark";
type SaturationBand = "muted" | "mid" | "saturated";

interface DerivedProps {
  temperature: Temperature;
  lightness: LightnessCategory;
  saturation: SaturationBand;
  isAchromatic: boolean;
  hue: number;
}

// Color families the brand classified as visually neutral. Honoring these
// catches famously-warm grays like SW Agreeable Gray (HSL saturation 14%
// pushes them past the strict s<8 threshold, mis-classifying them as
// chromatic orange) by trusting the brand's family label.
const ACHROMATIC_FAMILIES = new Set([
  "gray",
  "neutral",
  "off-white",
  "white",
  "beige",
  "cream",
  "tan",
  "brown",
  "black",
  "charcoal",
]);

function deriveProps(color: ColorWithBrand): DerivedProps {
  const [h, s, l] = hexToHsl(color.hex);
  const lrv = color.lrv != null ? Number(color.lrv) : null;
  const labA = color.lab_a != null ? Number(color.lab_a) : null;
  const labB = color.lab_b_val != null ? Number(color.lab_b_val) : null;

  const familyAchromatic = color.color_family ? ACHROMATIC_FAMILIES.has(color.color_family.toLowerCase()) : false;
  const isAchromatic = s < 8 || familyAchromatic;

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

  // Saturation band — second axis on pairing + lighting copy so the same
  // hue family + LRV bucket can render distinct paragraphs depending on
  // whether the color is muted (dusty/desaturated), mid (balanced), or
  // saturated (vivid). Pre-fix, every red shared one pairing sentence
  // across ~250 pages. Post-fix, hue × saturation × LRV cardinality
  // multiplies that surface roughly 3x.
  let saturation: SaturationBand;
  if (isAchromatic || s < 20) saturation = "muted";
  else if (s > 55) saturation = "saturated";
  else saturation = "mid";

  return { temperature, lightness, saturation, isAchromatic, hue: h };
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

// Hue-family axis for the pairing + lighting sentences. Keying these on a
// single binary "temperature" produced only 3 variants per slot, which at
// 23k color pages meant the same trim/hardware sentence appeared on roughly
// 7,800 pages verbatim. Switching to hue family expands the surface to 11
// variants (8 chromatic + 3 achromatic flavors) and cuts the per-variant
// page count by ~3x. Matters post-HCU because Google's near-duplicate
// clustering flagged the prior pattern as templated doorway copy.
type HueFamily =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "magenta"
  | "achromatic-warm"
  | "achromatic-cool"
  | "achromatic-neutral";

// Map brand-classified families to our HueFamily values. The brand
// classifier produces 7 chromatic families (red, orange, yellow, green,
// blue, purple, pink). "pink" maps to magenta in our taxonomy — same
// pairing/lighting advice serves both. Teal isn't a brand family so
// teal colors fall through to HSL math (hue 165-200).
const FAMILY_TO_HUE: Record<string, HueFamily> = {
  red: "red",
  orange: "orange",
  yellow: "yellow",
  green: "green",
  blue: "blue",
  purple: "purple",
  pink: "magenta",
};

function getHueFamily(color: ColorWithBrand, props: DerivedProps): HueFamily {
  if (props.isAchromatic) {
    if (props.temperature === "warm") return "achromatic-warm";
    if (props.temperature === "cool") return "achromatic-cool";
    return "achromatic-neutral";
  }
  const family = color.color_family?.toLowerCase();
  if (family && FAMILY_TO_HUE[family]) return FAMILY_TO_HUE[family];
  // HSL hue fallback when color_family is unmapped (e.g. teal) or missing.
  const h = props.hue;
  if (h < 15) return "red";
  if (h < 40) return "orange";
  if (h < 70) return "yellow";
  if (h < 150) return "green";
  if (h < 200) return "teal";
  if (h < 260) return "blue";
  if (h < 290) return "purple";
  if (h < 330) return "magenta";
  return "red";
}

// Hue-family → trim/hardware pairing sentence. 11 variants instead of 3.
function getPairingSentence(name: string, family: HueFamily): string {
  switch (family) {
    case "red":
      return `Pair it with creamy off-whites like Alabaster for trim, walnut or cherry hardwoods, and brass hardware — the warmth keeps reds from feeling clinical. Deep forest green or navy work as bold accent walls.`;
    case "orange":
      return `Pair it with warm whites like White Dove, white oak floors, and unlacquered brass or copper hardware. Terracotta tile or deep green plants complete an earthy warm palette.`;
    case "yellow":
      return `Pair it with crisp whites like Pure White for trim, oak or maple woods, and brass hardware. Navy or deep teal accents balance the brightness without competing for attention.`;
    case "green":
      return `Pair it with off-whites like Simply White, walnut or rift-cut oak floors, and mixed metals — brass for warmth, matte black for grounding. Terracotta and rust accents add warm contrast.`;
    case "teal":
      return `Pair it with crisp whites like Decorator's White, white oak floors, and brushed nickel or chrome hardware. Aged brass or copper introduces deliberate warm contrast if you want to break up the cool palette.`;
    case "blue":
      return `Pair it with cool whites like Chantilly Lace, walnut or rift-cut oak floors, and brushed nickel or polished chrome hardware. Brass accents add warmth for a layered look.`;
    case "purple":
      return `Pair it with cool whites for trim, walnut floors, and either brass or matte black hardware depending on whether you want warm or grounded contrast. Sage green works as a complementary accent.`;
    case "magenta":
      return `Pair it with warm whites like Simply White, blonde wood floors, and brass or gold hardware. Deep green or forest accents add contrast that keeps it from feeling too sweet.`;
    case "achromatic-warm":
      return `As a warm neutral, ${name} pairs with off-whites for trim, white oak or walnut floors, and brass or warm brushed nickel hardware. Deep green, navy, or terra-cotta all read well as accent colors.`;
    case "achromatic-cool":
      return `As a cool neutral, ${name} pairs with cool whites for trim, gray-toned or rift-cut oak floors, and brushed nickel or polished chrome hardware. Black accents and natural greenery add contrast.`;
    case "achromatic-neutral":
      return `${name} is a true neutral — pair with any wood, any metal, any trim color. Off-white trim works in most homes; brushed nickel or matte black hardware both read well across spaces.`;
  }
}

// Saturation modifier appended to pairing sentence. Adds a second axis so
// hue family × saturation × LRV bucket multiplies the unique tail-string
// surface ~3x. For achromatic-* families saturation is always "muted" so
// only that branch fires there.
function getPairingSaturationModifier(saturation: SaturationBand, isAchromatic: boolean): string {
  if (isAchromatic) return "";
  if (saturation === "muted") {
    return ` Because this version is on the desaturated side, it pairs forgivingly with both warm and cool accent palettes — and reads especially calm in north-facing rooms where high-chroma versions can feel intrusive.`;
  }
  if (saturation === "saturated") {
    return ` As a fully saturated example, it reads as a confident statement color — best deployed as a single accent wall or large architectural feature rather than a whole-room dominant.`;
  }
  return ` At mid saturation, this color sits at a flexible mid-point — bold enough to anchor a room without dominating, and pairs cleanly with both crisp and creamy whites.`;
}

// Saturation modifier appended to lighting sentence.
function getLightingSaturationModifier(saturation: SaturationBand, isAchromatic: boolean): string {
  if (isAchromatic) return "";
  if (saturation === "muted") {
    return ` Desaturated versions shift least under different lighting — they hold their character whether the room runs warm or cool.`;
  }
  if (saturation === "saturated") {
    return ` Saturated colors amplify lighting effects more than muted ones: warm bulbs deepen and enrich, cool daylight sharpens and slightly cools the same hex.`;
  }
  return ` At mid saturation the lighting shift is moderate but real — sample under both warm-bulb evening light and cool-daylight morning light before committing.`;
}

// Hue-family → lighting-behavior sentence. Bulb-color guidance is one of the
// most-asked questions about residential paint. Hue-keyed variants give
// concrete per-family advice (purples shift mauve under 2700K, blues read
// grayer, etc.) that pure-temperature copy couldn't deliver.
function getLightingBehaviorSentence(name: string, family: HueFamily): string {
  switch (family) {
    case "red":
      return `Reds intensify under 2700K-3000K warm bulbs, deepening into wine territory. Under 4000K+ cool LEDs they can read pinker or slightly washed — sample under your actual room lighting before committing.`;
    case "orange":
      return `Oranges glow under 2700K warm bulbs, deepening into rich amber. Under 4000K cool light they can lose warmth and shift toward beige — particularly true for muted or dusty oranges.`;
    case "yellow":
      return `Under 2700K warm bulbs ${name} reads more golden or buttery. Under 4000K daylight bulbs it stays truer to the chip, though saturated yellows can edge toward green in mixed light.`;
    case "green":
      return `Greens shift the most under different light. 2700K warms them toward olive or yellow-green; 4000K daylight reveals their true tone. Bluer greens especially benefit from north-facing daylight.`;
    case "teal":
      return `Teals hold their clarity under 4000K LEDs. Under 2700K warm bulbs they can dull toward muted gray-blue or push slightly green — preview in evening light if your bulbs run warm.`;
    case "blue":
      return `Blues stay crisp under 4000K+ cool LEDs. Under 2700K warm bulbs they can read grayer or shift slightly purple — particularly true for mid-tone and saturated blues.`;
    case "purple":
      return `Purples are the most lighting-sensitive paint family. 2700K bulbs push them toward mauve or pink; 4000K daylight keeps them violet or even slightly blue. Always sample at multiple times of day.`;
    case "magenta":
      return `Under 2700K warm bulbs pinks and magentas glow warmly, leaning coral. Under 4000K cool light they read more vibrant — important for nursery and bedroom planning where bulb choice changes the mood.`;
    case "achromatic-warm":
      return `Warm neutrals come alive under 2700K bulbs, where their underlying yellow or peach undertones add visible warmth. Under 4000K daylight they read cleaner and slightly cooler.`;
    case "achromatic-cool":
      return `Cool neutrals hold their crisp quality under 4000K+ daylight bulbs. Under 2700K warm light they soften considerably — particularly true for any blue or green undertone.`;
    case "achromatic-neutral":
      return `True neutrals read consistently across lighting conditions, which is why they're popular base colors. They inherit a faint warm cast under 2700K and a cool cast under 4000K, but never dramatically.`;
  }
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

  // Trim/hardware pairing — hue family (11) × saturation band (3) for
  // chromatic colors. Achromatic flavors collapse to the base sentence
  // since saturation is constant there.
  const hueFamily = getHueFamily(color, props);
  const pairingSentence =
    getPairingSentence(color.name, hueFamily) +
    getPairingSaturationModifier(props.saturation, props.isAchromatic);

  // Lighting-behavior guidance — same hue × saturation composition.
  const lightingSentence =
    getLightingBehaviorSentence(color.name, hueFamily) +
    getLightingSaturationModifier(props.saturation, props.isAchromatic);

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
