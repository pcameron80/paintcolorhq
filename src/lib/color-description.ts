import type { ColorWithBrand, CrossBrandMatchWithColor } from "./types";
import { hexToHsl } from "./palettes";

// ---------- Deterministic hash helpers ----------

function hashHex(hex: string): number {
  let hash = 5381;
  for (let i = 0; i < hex.length; i++) {
    hash = ((hash << 5) + hash + hex.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // unsigned 32-bit
}

function pick<T>(items: T[], hash: number, salt: number): T {
  const index = ((hash ^ (salt * 2654435761)) >>> 0) % items.length;
  return items[index];
}

// ---------- Derived color properties ----------

type Temperature = "warm" | "cool" | "neutral";
type LightnessCategory = "very light" | "light" | "medium" | "deep" | "dark";
type SaturationCategory = "muted" | "subtle" | "moderate" | "vibrant";
type UndertoneCategory =
  | "golden"
  | "pink"
  | "green"
  | "blue"
  | "violet"
  | "balanced";

interface DerivedProps {
  temperature: Temperature;
  lightness: LightnessCategory;
  saturation: SaturationCategory;
  undertone: UndertoneCategory;
  isAchromatic: boolean;
  hue: number;
  hslS: number;
  hslL: number;
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

  // Saturation
  let saturation: SaturationCategory;
  if (s < 15) saturation = "muted";
  else if (s < 35) saturation = "subtle";
  else if (s < 60) saturation = "moderate";
  else saturation = "vibrant";

  // Undertone from LAB a*/b* or hue fallback
  let undertone: UndertoneCategory;
  if (isAchromatic) {
    if (labA != null && labB != null) {
      if (labB > 3) undertone = "golden";
      else if (labA > 2) undertone = "pink";
      else if (labB < -2) undertone = "blue";
      else if (labA < -2) undertone = "green";
      else undertone = "balanced";
    } else {
      undertone = "balanced";
    }
  } else if (labA != null && labB != null) {
    if (labA > 8 && labB > 8) undertone = "golden";
    else if (labA > 8 && labB <= 8) undertone = "pink";
    else if (labA < -5 && labB > 5) undertone = "green";
    else if (labA < -5 && labB < -5) undertone = "blue";
    else if (labA > 3 && labB < -3) undertone = "violet";
    else undertone = "balanced";
  } else {
    if (h >= 20 && h < 70) undertone = "golden";
    else if (h >= 330 || h < 20) undertone = "pink";
    else if (h >= 70 && h < 160) undertone = "green";
    else if (h >= 200 && h < 270) undertone = "blue";
    else if (h >= 270 && h < 330) undertone = "violet";
    else undertone = "balanced";
  }

  return { temperature, lightness, saturation, undertone, isAchromatic, hue: h, hslS: s, hslL: l };
}

// ---------- Template pools ----------

function getColorFeel(props: DerivedProps): string[] {
  if (props.isAchromatic) {
    if (props.lightness === "very light") return ["clean", "crisp", "airy", "bright", "fresh", "luminous", "pure", "pristine"];
    if (props.lightness === "light") return ["soft", "gentle", "quiet", "restful", "serene", "calm", "subtle", "understated"];
    if (props.lightness === "dark") return ["bold", "dramatic", "striking", "powerful", "commanding", "intense", "anchoring", "grounding"];
    return ["balanced", "versatile", "adaptable", "timeless", "classic", "refined", "steady", "composed"];
  }
  if (props.temperature === "warm") {
    if (props.saturation === "vibrant") return ["bold", "energetic", "striking", "vivid", "dynamic", "lively", "spirited", "radiant"];
    if (props.saturation === "muted" || props.saturation === "subtle") return ["soft", "approachable", "warm", "gentle", "inviting", "understated", "relaxed", "easygoing"];
    return ["warm", "inviting", "welcoming", "comfortable", "rich", "cozy", "engaging", "earthy"];
  }
  // cool
  if (props.saturation === "vibrant") return ["bold", "commanding", "dramatic", "vivid", "striking", "powerful", "intense", "captivating"];
  if (props.saturation === "muted" || props.saturation === "subtle") return ["calm", "serene", "restful", "tranquil", "peaceful", "soothing", "quiet", "subdued"];
  return ["cool", "composed", "elegant", "refined", "sophisticated", "poised", "collected", "graceful"];
}

function getUndertonePhrase(props: DerivedProps): string[] {
  if (props.isAchromatic) {
    if (props.undertone === "golden") return ["warm golden undertones", "subtle warm undertones", "a hint of warmth beneath the surface"];
    if (props.undertone === "pink") return ["soft pink undertones", "a subtle rosy warmth", "gentle pinkish undertones"];
    if (props.undertone === "blue") return ["cool blue undertones", "a slight blue-gray cast", "subtle cool undertones"];
    if (props.undertone === "green") return ["faint green undertones", "subtle sage undertones", "a whisper of green"];
    return ["minimal undertones", "a nearly neutral base", "very balanced undertones"];
  }
  if (props.undertone === "golden") return ["warm golden undertones", "rich amber undertones", "honey-warm undertones", "sun-kissed undertones"];
  if (props.undertone === "pink") return ["soft pink undertones", "rosy undertones", "subtle blush undertones", "warm rose undertones"];
  if (props.undertone === "green") return ["cool green undertones", "earthy green undertones", "sage undertones", "olive undertones"];
  if (props.undertone === "blue") return ["cool blue undertones", "blue-gray undertones", "oceanic undertones", "steely blue undertones"];
  if (props.undertone === "violet") return ["violet undertones", "subtle purple undertones", "cool violet undertones", "lavender undertones"];
  return ["balanced undertones", "neutral undertones", "cleanly balanced undertones", "evenly balanced undertones"];
}

const characterFrames = [
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} is a ${lightDesc} with ${undertone} that give it a ${feel} quality.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} is a ${lightDesc} featuring ${undertone} and a ${feel} character.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `A ${lightDesc}, ${name} carries ${undertone} and a distinctly ${feel} presence.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} is a ${feel} ${lightDesc} with ${undertone}.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `With ${undertone}, ${name} is a ${feel} ${lightDesc}.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} reads as a ${feel} ${lightDesc}, shaped by its ${undertone}.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `A ${feel} ${lightDesc}, ${name} gets its personality from ${undertone}.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} presents as a ${lightDesc} with ${undertone} and a ${feel} mood.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `Defined by ${undertone}, ${name} is a ${feel} ${lightDesc}.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} is a ${lightDesc} — ${feel} in tone, with ${undertone}.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `A ${lightDesc} that feels ${feel}, ${name} is distinguished by its ${undertone}.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} offers a ${feel} take on a ${lightDesc}, accented by ${undertone}.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `As a ${lightDesc}, ${name} brings a ${feel} energy through its ${undertone}.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} combines the depth of a ${lightDesc} with ${undertone} for a ${feel} effect.`,
  (name: string, lightDesc: string, feel: string, undertone: string) =>
    `Both ${feel} and nuanced, ${name} is a ${lightDesc} with ${undertone}.`,
];

// ---------- Room/usage suggestions ----------

function getRoomSuggestion(props: DerivedProps, lrv: number | null, hash: number): string {
  const lrvNote = lrv != null ? ` With an LRV of ${Math.round(lrv)}, it` : " It";

  if (props.isAchromatic) {
    if (props.lightness === "very light") {
      return pick([
        `${lrvNote} maximizes light reflection, making it ideal for ceilings, trim, or whole-room whites.`,
        `${lrvNote} reflects light beautifully, working as a versatile ceiling color, trim, or all-over wall color.`,
        `${lrvNote} bounces light throughout a space, perfect for brightening small rooms, hallways, and trim.`,
        `${lrvNote} enhances natural light, making it a top choice for kitchens, bathrooms, and open floor plans.`,
      ], hash, 200);
    }
    if (props.lightness === "dark") {
      return pick([
        `${lrvNote} absorbs light dramatically, ideal for accent walls, cabinetry, and front doors.`,
        `${lrvNote} creates depth and drama, perfect for accent walls, built-ins, and statement furniture.`,
        `${lrvNote} brings intensity to any space — try it on a feature wall, exterior door, or library shelving.`,
      ], hash, 200);
    }
    return pick([
      `${lrvNote} works as a versatile whole-home neutral for living rooms, bedrooms, and hallways.`,
      `${lrvNote} adapts easily to any room, serving as a dependable backdrop for living areas and bedrooms.`,
      `${lrvNote} provides a flexible foundation that pairs well with both warm and cool accent colors.`,
      `${lrvNote} creates a calm, cohesive feel in open-concept spaces, hallways, and bedrooms alike.`,
    ], hash, 200);
  }

  // Chromatic colors
  if (props.lightness === "very light" || props.lightness === "light") {
    if (props.temperature === "warm") {
      return pick([
        `${lrvNote} reflects a comfortable amount of light, making it a versatile choice for living rooms, bedrooms, and hallways.`,
        `${lrvNote} brings warmth without overwhelming a space, well-suited for main living areas and dining rooms.`,
        `${lrvNote} creates a welcoming atmosphere in bedrooms, family rooms, and entryways.`,
        `${lrvNote} works beautifully as a whole-home color, adding warmth to kitchens and living spaces.`,
      ], hash, 200);
    }
    return pick([
      `${lrvNote} keeps spaces feeling open and airy, working well in bathrooms, bedrooms, and coastal-inspired rooms.`,
      `${lrvNote} brightens interiors with a refreshing feel, ideal for bathrooms, laundry rooms, and sunlit bedrooms.`,
      `${lrvNote} offers a serene backdrop for bedrooms, bathrooms, and reading nooks.`,
      `${lrvNote} lends a tranquil quality to any room, from master bedrooms to spa-like bathrooms.`,
    ], hash, 200);
  }

  if (props.lightness === "medium") {
    return pick([
      `${lrvNote} balances depth and brightness, making it a strong choice for dining rooms, accent walls, and home offices.`,
      `${lrvNote} provides enough depth for visual interest while remaining approachable — ideal for dining rooms and studies.`,
      `${lrvNote} adds character to a space without overpowering it, working well in home offices, mudrooms, and powder rooms.`,
      `${lrvNote} strikes a balance that suits both traditional and contemporary spaces, from dining rooms to dens.`,
    ], hash, 200);
  }

  // deep or dark
  if (props.saturation === "vibrant") {
    return pick([
      `${lrvNote} absorbs light dramatically, making it ideal for accent walls, cabinetry, and front doors where bold contrast is the goal.`,
      `${lrvNote} makes a powerful statement on feature walls, kitchen islands, and exterior doors.`,
      `${lrvNote} demands attention — try it on a statement wall, built-in shelving, or bathroom vanity.`,
    ], hash, 200);
  }
  return pick([
    `${lrvNote} creates a cocooning effect, perfect for moody bedrooms, libraries, and intimate dining rooms.`,
    `${lrvNote} adds depth and sophistication, well-suited for accent walls, powder rooms, and home offices.`,
    `${lrvNote} grounds a space with quiet intensity, working beautifully in dens, master bedrooms, and formal dining rooms.`,
  ], hash, 200);
}

// ---------- Cross-brand match sentence ----------

function getMatchSentence(
  matches: CrossBrandMatchWithColor[],
  hash: number
): string | null {
  const closeMatches = matches.filter((m) => Number(m.delta_e_score) < 5);
  if (closeMatches.length === 0) return null;

  const best = closeMatches[0];
  const bestName = best.match_color.name;
  const bestBrand = best.match_color.brand.name;
  const deltaE = Number(best.delta_e_score);

  const closenessPhrase =
    deltaE < 1
      ? "a near-identical match"
      : deltaE < 2
        ? "an extremely close match"
        : deltaE < 3
          ? "with only a slight difference visible side by side"
          : "a close visual equivalent";

  if (closeMatches.length >= 2 && Number(closeMatches[1].delta_e_score) < 4) {
    const second = closeMatches[1];
    // Only include second match if from a different brand
    if (second.match_color.brand.name !== bestBrand) {
      return pick([
        `The closest cross-brand match is ${bestBrand}'s ${bestName}, ${closenessPhrase}. ${second.match_color.brand.name}'s ${second.match_color.name} is another strong alternative.`,
        `${bestBrand} offers ${bestName} as ${closenessPhrase}, while ${second.match_color.brand.name}'s ${second.match_color.name} is also very similar.`,
        `For a cross-brand equivalent, ${bestBrand}'s ${bestName} is ${closenessPhrase}. ${second.match_color.brand.name}'s ${second.match_color.name} runs close as well.`,
      ], hash, 300);
    }
  }

  return pick([
    `The closest match from ${bestBrand} is ${bestName}, ${closenessPhrase}.`,
    `${bestBrand}'s ${bestName} is the nearest cross-brand equivalent, ${closenessPhrase}.`,
    `For a ${bestBrand} alternative, ${bestName} is ${closenessPhrase}.`,
    `Looking across brands, ${bestBrand}'s ${bestName} comes in as ${closenessPhrase}.`,
    `The most similar option from ${bestBrand} is ${bestName}, ${closenessPhrase}.`,
  ], hash, 300);
}

// ---------- Optional extra detail ----------

function getExtraDetail(
  color: ColorWithBrand,
  props: DerivedProps,
  hash: number
): string | null {
  // Only ~40% of colors get an extra sentence
  if (hash % 5 > 1) return null;

  const lrv = color.lrv != null ? Number(color.lrv) : null;

  // Extreme LRV
  if (lrv != null && lrv >= 90) {
    return pick([
      "As one of the brightest whites available, it pairs naturally with virtually any accent color.",
      "Its exceptionally high reflectance makes it a go-to choice for maximizing light in any space.",
      "With near-maximum light reflectance, it serves as a blank canvas for layered color schemes.",
    ], hash, 400);
  }
  if (lrv != null && lrv <= 5) {
    return pick([
      "Its near-zero reflectance absorbs virtually all light, creating maximum drama and contrast.",
      "As one of the darkest options available, it delivers unmatched depth on any surface.",
      "Its extremely low LRV makes it a powerful grounding element in both traditional and modern spaces.",
    ], hash, 400);
  }

  // Coordination tips based on temperature
  if (props.temperature === "warm") {
    return pick([
      "It pairs well with crisp whites for contrast and warm metallics like brass or gold for cohesion.",
      "Try it alongside a cool-toned accent to create visual balance, or lean into warmth with natural wood tones.",
      "Coordinate with warm whites for trim and natural materials like jute and linen for a layered look.",
    ], hash, 400);
  }
  return pick([
    "It pairs beautifully with warm wood tones to offset its coolness, or with silver and chrome for a polished look.",
    "Balance its cool character with warm neutrals on adjacent surfaces, or embrace the chill with blue-gray accents.",
    "It complements both bright whites and charcoal grays, making it easy to build a cohesive palette around.",
  ], hash, 400);
}

// ---------- Light description string ----------

function getLightDescription(
  color: ColorWithBrand,
  props: DerivedProps
): string {
  const family = color.color_family;
  const satAdj = props.saturation === "vibrant" ? "saturated " : props.saturation === "muted" ? "muted " : "";

  if (props.isAchromatic) {
    if (props.lightness === "very light") {
      return family ? `very light, nearly pure ${family}` : "very light, nearly pure white";
    }
    if (props.lightness === "dark") {
      return family ? `dark, deep ${family}` : "dark, deep neutral";
    }
    return `${props.lightness}, ${props.temperature} ${family || "gray"}`;
  }

  const tempAdj = props.temperature === "warm" ? "warm " : props.temperature === "cool" ? "cool " : "";
  if (family) {
    return `${props.lightness}, ${satAdj}${tempAdj}${family}`;
  }
  // fallback to hue name
  const hueName = getHueName(props.hue);
  return `${props.lightness}, ${satAdj}${tempAdj}${hueName}`;
}

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

// ---------- Public API ----------

export function generateColorDescription(
  color: ColorWithBrand,
  matches: CrossBrandMatchWithColor[]
): string {
  const hash = hashHex(color.hex);
  const props = deriveProps(color);

  // 1. Character statement
  const lightDesc = getLightDescription(color, props);
  const feel = pick(getColorFeel(props), hash, 100);
  const undertone = pick(getUndertonePhrase(props), hash, 101);
  const characterSentence = pick(characterFrames, hash, 102)(
    color.name,
    lightDesc,
    feel,
    undertone
  );

  // 2. Usage / room suggestion
  const lrv = color.lrv != null ? Number(color.lrv) : null;
  const roomSentence = getRoomSuggestion(props, lrv, hash);

  // 3. Cross-brand match (when available)
  const matchSentence = getMatchSentence(matches, hash);

  // 4. Optional extra detail (~40%)
  const extraSentence = getExtraDetail(color, props, hash);

  const sentences = [characterSentence, roomSentence];
  if (matchSentence) sentences.push(matchSentence);
  if (extraSentence) sentences.push(extraSentence);

  return sentences.join(" ");
}

export function generateMetaDescription(color: ColorWithBrand): string {
  const props = deriveProps(color);
  const family = color.color_family || getHueName(props.hue);
  const lrv = color.lrv != null ? ` LRV ${Math.round(Number(color.lrv))}.` : "";
  const brandName = color.brand.name;

  // Build a concise sentence under 160 chars
  const tempWord = props.temperature === "neutral" ? "" : `${props.temperature} `;
  const base = `${color.name} by ${brandName} is a ${props.lightness}, ${tempWord}${family}. Hex ${color.hex.toUpperCase()}.${lrv}`;

  if (base.length <= 155) {
    const suffix = " Find cross-brand matches and coordinating colors.";
    if ((base + suffix).length <= 160) return base + suffix;
    const shortSuffix = " Compare across brands.";
    if ((base + shortSuffix).length <= 160) return base + shortSuffix;
  }

  // Fallback: trim to fit
  return base.slice(0, 157) + "...";
}
