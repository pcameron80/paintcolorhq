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

// ---------- Saturation category helper ----------

type SaturationCategory = "muted" | "soft" | "moderate" | "vivid" | "bold";

function getSaturationCategory(hex: string): SaturationCategory {
  const [, s] = hexToHsl(hex);
  if (s < 10) return "muted";
  if (s < 25) return "soft";
  if (s < 50) return "moderate";
  if (s < 75) return "vivid";
  return "bold";
}

// ---------- Appearance paragraph ----------

function getAppearanceParagraph(
  color: ColorWithBrand,
  props: DerivedProps,
  family: string,
  satCat: SaturationCategory
): string {
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const hex = color.hex.toUpperCase();

  const satDescriptors: Record<SaturationCategory, string> = {
    muted: "understated, nearly neutral quality",
    soft: "gentle, subdued character",
    moderate: "balanced saturation that feels natural and approachable",
    vivid: "rich, saturated presence that draws the eye",
    bold: "striking intensity that commands attention",
  };

  const lightnessFeels: Record<LightnessCategory, string> = {
    "very light": "airy, open feeling that maximizes the sense of space in any room",
    light: "bright, welcoming quality that keeps interiors feeling fresh",
    medium: "versatile mid-tone depth that anchors a room without overwhelming it",
    deep: "grounded richness that adds drama and sophistication",
    dark: "bold depth that creates intimate, cocooning spaces",
  };

  const tempFeels: Record<Temperature, string> = {
    warm: "leans toward warmth, adding coziness and inviting energy",
    cool: "carries a cool cast, lending calm and collected elegance",
    neutral: "stays balanced between warm and cool, making it exceptionally versatile",
  };

  // Dominant channel description for uniqueness
  const channels = [
    { name: "red", val: color.rgb_r },
    { name: "green", val: color.rgb_g },
    { name: "blue", val: color.rgb_b },
  ].sort((a, b) => b.val - a.val);
  const channelNote = channels[0].val - channels[2].val > 30
    ? `In its RGB breakdown, ${channels[0].name} is the dominant channel, which gives it a subtle ${channels[0].name === "red" ? "rosy warmth" : channels[0].name === "green" ? "earthy, organic quality" : "cool, atmospheric depth"} even under different lighting conditions.`
    : `Its RGB channels are closely balanced, contributing to its neutral, even-keeled visual character.`;

  const lines = [
    `${color.name} (${hex}) by ${color.brand.name} is a ${props.lightness} ${family} paint color with a ${satDescriptors[satCat]}.`,
    `It delivers ${/^[aeiou]/i.test(lightnessFeels[props.lightness]) ? "an" : "a"} ${lightnessFeels[props.lightness]}.`,
    `On the temperature spectrum this shade ${tempFeels[props.temperature]}.`,
    channelNote,
  ];

  if (lrv != null) {
    const lrvContext =
      lrv >= 80
        ? `With a Light Reflectance Value of ${lrv}, it reflects the vast majority of light, helping smaller rooms feel more spacious`
        : lrv >= 55
          ? `Its Light Reflectance Value of ${lrv} means it reflects a healthy amount of light, keeping spaces bright without feeling stark`
          : lrv >= 30
            ? `A Light Reflectance Value of ${lrv} gives it moderate light reflection, striking a balance between brightness and depth`
            : lrv >= 12
              ? `At an LRV of ${lrv} it absorbs more light than it reflects, creating a moody, enveloping atmosphere`
              : `With an LRV of only ${lrv}, this color absorbs nearly all light, producing a dramatic, cocoon-like effect`;
    lines.push(`${lrvContext}.`);
  }

  return lines.join(" ");
}

// ---------- Room usage paragraph ----------

const roomSuggestions: Record<string, Record<LightnessCategory, string>> = {
  red: {
    "very light": "A barely-there blush like this works beautifully in bedrooms, powder rooms, and nurseries where you want a hint of warmth without intensity.",
    light: "This soft rose tone is a popular pick for dining rooms and living spaces that benefit from a gentle, flattering glow.",
    medium: "At this depth, a red becomes a confident statement color well-suited to accent walls, front doors, and intimate dining areas.",
    deep: "Deep reds like this excel in formal dining rooms, home libraries, and entryway accents where richness sets the tone.",
    dark: "A dark red this saturated brings theatrical drama to wine cellars, media rooms, and sophisticated accent walls.",
  },
  orange: {
    "very light": "This pale apricot tone brings gentle warmth to kitchens, breakfast nooks, and south-facing rooms that benefit from a sunny disposition.",
    light: "Light peach and terra-cotta hues like this feel at home in kitchens, sunrooms, and casual dining areas.",
    medium: "A medium orange lends spirited energy to family rooms, playrooms, and creative studio spaces.",
    deep: "At this depth, orange carries an earthy, spiced warmth ideal for accent walls in living rooms and cozy reading corners.",
    dark: "Dark burnt-orange tones create rustic elegance in dens, home offices, and Southwestern-inspired interiors.",
  },
  yellow: {
    "very light": "A barely-there butter or cream shade like this is universally flattering in kitchens, hallways, and any room that needs a lift.",
    light: "Light yellows brighten bathrooms, laundry rooms, and north-facing spaces that crave extra warmth.",
    medium: "This golden mid-tone works well as an accent in kitchens, mudrooms, and cottage-style interiors.",
    deep: "Deep ochre and mustard tones make striking accent walls in living rooms and pair beautifully with dark wood furniture.",
    dark: "Dark amber shades bring a vintage warmth to studies, craft rooms, and eclectic interiors.",
  },
  green: {
    "very light": "A whisper of green like this is calming in bedrooms, spa-inspired bathrooms, and meditation spaces.",
    light: "Light sage and mint greens feel fresh in kitchens, guest bedrooms, and garden-view rooms.",
    medium: "This mid-tone green adds grounding, nature-inspired energy to home offices, living rooms, and open-plan kitchens.",
    deep: "Deep greens like this create moody elegance in studies, formal dining rooms, and bedroom accent walls.",
    dark: "A dark forest or hunter green delivers timeless sophistication in libraries, accent cabinetry, and entryway millwork.",
  },
  teal: {
    "very light": "Barely-there aqua tones like this suit bathrooms, coastal-themed bedrooms, and airy sitting rooms.",
    light: "Light teal brings a refreshing, ocean-inspired calm to bathrooms, bedrooms, and sunlit living areas.",
    medium: "This balanced teal adds personality to home offices, accent walls, and kitchen cabinetry.",
    deep: "Deep teal tones create jewel-box richness in powder rooms, formal living rooms, and statement furniture pieces.",
    dark: "A dark teal this intense works beautifully on built-in bookshelves, accent walls, and exterior doors.",
  },
  blue: {
    "very light": "A barely-there blue like this soothes bedrooms, ceilings, and nurseries with its sky-like openness.",
    light: "Light blues are classic in bathrooms, bedrooms, and coastal-themed living rooms.",
    medium: "This mid-tone blue brings confidence and calm to home offices, accent walls, and kitchen islands.",
    deep: "Deep blues like this deliver striking navy elegance in dining rooms, bedrooms, and exterior shutters.",
    dark: "A dark blue this rich creates moody drama in bedrooms, media rooms, and formal living spaces.",
  },
  purple: {
    "very light": "A whisper of lavender like this is serene in bedrooms, powder rooms, and feminine-styled sitting rooms.",
    light: "Light purple tones bring a dreamy quality to bedrooms, reading nooks, and creative workspaces.",
    medium: "This mid-tone purple adds creative energy to home offices, accent walls, and eclectic living rooms.",
    deep: "Deep plum and aubergine shades create opulent drama in dining rooms, bedrooms, and luxurious powder rooms.",
    dark: "A dark purple this intense is theatrical for accent walls, home theaters, and richly layered interiors.",
  },
  magenta: {
    "very light": "Pale mauve and blush tones like this are flattering in bedrooms, dressing areas, and romantic dining spaces.",
    light: "A light magenta adds a playful, warm blush to living rooms, bedrooms, and bridal suites.",
    medium: "This vivid mid-tone brings bold personality to accent walls, creative spaces, and modern interiors.",
    deep: "Deep berry shades like this add luxury and warmth to dining rooms, powder rooms, and evening-oriented spaces.",
    dark: "Dark magenta tones deliver moody opulence in media rooms, accent walls, and high-drama interiors.",
  },
};

const neutralRoomSuggestions: Record<LightnessCategory, string> = {
  "very light": "As a near-white neutral, this shade is one of the most versatile wall colors available — ideal for ceilings, trim, open floor plans, and any room where you want maximum light and a clean canvas for furnishings.",
  light: "Light neutrals like this are go-to choices for whole-home color schemes, working seamlessly in living rooms, bedrooms, kitchens, and hallways without competing with decor.",
  medium: "A mid-tone neutral at this depth adds sophisticated warmth or coolness to living rooms, bedrooms, and transitional hallways, grounding the space without closing it in.",
  deep: "Deep neutrals like this create contrast and gravitas on accent walls, exterior facades, and kitchen cabinetry, pairing well with lighter trim.",
  dark: "A dark neutral this deep brings modern drama to feature walls, built-in cabinetry, and exterior accents while remaining easier to coordinate than a saturated color.",
};

const finishAdvice: Record<LightnessCategory, string> = {
  "very light": "An eggshell or matte finish works well at this lightness, hiding minor wall imperfections while still being easy to wipe clean.",
  light: "Eggshell or satin finishes complement light tones nicely, balancing a subtle sheen with durability for high-traffic areas.",
  medium: "A satin or eggshell finish brings out the richness at this depth, and the slight sheen makes walls easier to maintain.",
  deep: "Satin or semi-gloss finishes help deep colors reflect just enough light to show their full depth, especially on accent walls and trim.",
  dark: "For dark shades, a satin finish helps the color look its best by adding a gentle luminosity, while flat finishes create a more velvety, matte effect.",
};

function getRoomUsageParagraph(
  color: ColorWithBrand,
  props: DerivedProps,
  family: string
): string {
  let base: string;
  if (props.isAchromatic) {
    base = neutralRoomSuggestions[props.lightness];
  } else {
    const hueKey = family.toLowerCase();
    const hueMap = roomSuggestions[hueKey];
    base = hueMap ? hueMap[props.lightness] : neutralRoomSuggestions[props.lightness];
  }
  return `${base} ${finishAdvice[props.lightness]}`;
}

// ---------- Design style paragraph ----------

const styleByHueGroup: Record<string, string> = {
  red: "traditional, Mediterranean, and eclectic décor styles",
  orange: "bohemian, Southwestern, and modern farmhouse aesthetics",
  yellow: "cottage-core, transitional, and Scandinavian-inspired interiors",
  green: "organic modern, biophilic, and mid-century aesthetics",
  teal: "coastal, Art Deco, and contemporary maximalist design",
  blue: "nautical, classic traditional, and Hamptons-style interiors",
  purple: "eclectic, glam, and romantic vintage décor",
  magenta: "maximalist, Hollywood Regency, and feminine modern spaces",
};

function getDesignStyleParagraph(
  color: ColorWithBrand,
  props: DerivedProps,
  family: string
): string {
  const hueKey = family.toLowerCase();
  const styleContext = props.isAchromatic
    ? "virtually every design style from minimalist Japandi to rustic farmhouse to sleek contemporary"
    : styleByHueGroup[hueKey] || "a wide range of interior design styles";

  const brandContext = `As part of the ${color.brand.name} palette, ${color.name} benefits from a curated selection of coordinating colors that the brand recommends for trim, accent, and ceiling pairings.`;

  return `This shade is a natural fit for ${styleContext}. ${brandContext}`;
}

// ---------- Pairing paragraph ----------

function getPairingParagraph(
  color: ColorWithBrand,
  props: DerivedProps,
  family: string,
  matches: CrossBrandMatchWithColor[]
): string {
  const complement = getHueName((props.hue + 180) % 360);
  const analogous1 = getHueName((props.hue + 30) % 360);
  const analogous2 = getHueName((props.hue + 330) % 360);

  const lines: string[] = [];

  if (props.isAchromatic) {
    const neutralPairing = props.temperature === "warm"
      ? `Because ${color.name} carries warm undertones, it pairs naturally with other warm neutrals, creamy whites, and earthy accents like terracotta or caramel.`
      : props.temperature === "cool"
        ? `The cool cast of ${color.name} pairs well with crisp whites, silvery grays, and blue-toned accents for a sleek, modern palette.`
        : `As a balanced neutral, ${color.name} coordinates with virtually any accent color — from warm golds and blush to cool blues and greens.`;
    lines.push(neutralPairing);
  } else {
    lines.push(
      `For color coordination, ${color.name} pairs beautifully with ${complement} tones for bold complementary contrast, or with neighboring ${analogous1} and ${analogous2} hues for a harmonious, flowing palette.`
    );
  }

  if (color.undertone) {
    const ut = color.undertone.toLowerCase();
    lines.push(
      `Its ${ut} undertone means trim and ceiling whites should lean ${ut === "yellow" || ut === "golden" || ut === "warm" || ut === "peach" || ut === "orange" || ut === "red" || ut === "pink" ? "warm (think creamy or antique white)" : ut === "blue" || ut === "green" || ut === "violet" || ut === "cool" || ut === "gray" || ut === "grey" ? "cool (bright white or blue-white)" : "neutral"} to avoid a jarring clash.`
    );
  }

  const topMatches = matches.filter((m) => Number(m.delta_e_score) < 5).slice(0, 4);
  if (topMatches.length >= 2) {
    const brandNames = [...new Set(topMatches.map((m) => m.match_color.brand.name))].slice(0, 3);
    lines.push(
      `If ${color.brand.name} is unavailable in your area, close cross-brand alternatives exist from ${brandNames.join(", ")}${brandNames.length > 1 ? " and others" : ""}.`
    );
  }

  return lines.join(" ");
}

// ---------- Mood / aesthetic paragraph ----------

const moodByTemp: Record<Temperature, Record<LightnessCategory, string>> = {
  warm: {
    "very light": "evokes the soft glow of morning sunlight, creating a gentle, optimistic ambiance",
    light: "radiates an inviting, sun-washed warmth that makes guests feel immediately at ease",
    medium: "strikes a cozy, amber-toned balance that feels like late-afternoon light filtering through linen curtains",
    deep: "delivers a fireside richness that wraps the room in warmth and groundedness",
    dark: "creates a deeply intimate, candlelit mood reminiscent of old-world parlors and luxe retreats",
  },
  cool: {
    "very light": "brings a crisp, spa-like tranquility that opens up a room and calms the mind",
    light: "offers a breezy, coastal serenity that keeps spaces feeling clean and refreshed",
    medium: "delivers a composed, professional calm often favored in contemporary and Scandinavian-inspired interiors",
    deep: "projects a confident, tailored sophistication associated with classic nautical and Art Deco aesthetics",
    dark: "creates a brooding, midnight atmosphere that feels both dramatic and deeply restful",
  },
  neutral: {
    "very light": "delivers quiet minimalism, letting furniture, art, and natural light take center stage",
    light: "offers effortless elegance — it recedes gracefully, supporting any décor direction from modern farmhouse to contemporary",
    medium: "provides a grounded, organic warmth that feels simultaneously modern and timeless",
    deep: "lends a serious, anchoring presence that pairs with metallics, natural wood, and bold art",
    dark: "brings a powerful, enveloping stillness that transforms spaces into dramatic retreats",
  },
};

function getMoodParagraph(
  color: ColorWithBrand,
  props: DerivedProps
): string {
  const mood = moodByTemp[props.temperature][props.lightness];
  return `In terms of mood and atmosphere, ${color.name} ${mood}. Designers often reach for shades like this when the goal is to shape how a room feels, not just how it looks.`;
}

// ---------- Practical tips paragraph ----------

function getPracticalParagraph(
  color: ColorWithBrand,
  props: DerivedProps,
  family: string
): string {
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const lines: string[] = [];

  if (lrv != null && lrv < 20) {
    lines.push(
      `Because ${color.name} has a low LRV, it can look dramatically different under incandescent versus daylight bulbs — always test a large swatch on the actual wall before committing.`
    );
  } else if (lrv != null && lrv >= 70) {
    lines.push(
      `High-LRV colors like ${color.name} are forgiving in most lighting conditions, but they can pick up reflected color from adjacent walls, flooring, or large furniture pieces, so evaluate samples in situ.`
    );
  } else {
    lines.push(
      `As with any paint color, ${color.name} can shift noticeably between natural daylight, warm incandescent, and cool LED lighting — testing a sample swatch on your wall under different conditions is always recommended.`
    );
  }

  if (props.lightness === "dark" || props.lightness === "deep") {
    lines.push(
      "Deep shades generally benefit from a quality primer and may require an extra coat for even, streak-free coverage."
    );
  } else if (props.lightness === "very light") {
    lines.push(
      "Very light shades can sometimes read as stark white on small swatches — viewing a larger area in your intended space reveals the true character of the color."
    );
  }

  // Texture pairing advice varies by lightness
  const texturePairings: Record<LightnessCategory, string> = {
    "very light": "Pair this shade with natural linen, light oak, rattan, and marble for a fresh, layered look, or contrast it with dark walnut and wrought iron for more definition.",
    light: "This tone works well alongside natural textures like jute rugs, bleached wood, ceramic tile, and woven baskets, building an inviting, tactile space.",
    medium: "Mid-tone shades like this look best when balanced with a mix of textures — think leather seating, brushed brass hardware, woven wool, and raw-edge wood.",
    deep: "Deep tones pair beautifully with velvet upholstery, burnished metal fixtures, dark-stained wood, and textured wallcoverings on adjacent surfaces.",
    dark: "Dark paint colors benefit from rich material pairings: think thick wool throws, aged leather, matte black hardware, and warm metallic accents in copper or brass.",
  };
  lines.push(texturePairings[props.lightness]);

  const colorNum = color.color_number ? ` (${color.color_number})` : "";
  lines.push(
    `You can order ${color.name}${colorNum} directly from ${color.brand.name} or through major paint retailers, and we recommend purchasing a peel-and-stick sample to preview it on your wall before buying gallons.`
  );

  return lines.join(" ");
}

// ---------- SEO query-targeting sentences ----------

function getQueryTargetingSentences(
  color: ColorWithBrand,
  matches: CrossBrandMatchWithColor[],
  props: DerivedProps
): string {
  const family = color.color_family || getHueName(props.hue);
  const hex = color.hex.toUpperCase();
  const tempWord = props.temperature === "neutral" ? "neutral" : props.temperature;
  const satCat = getSaturationCategory(color.hex);

  // "What color is X" — directly answers the most common query pattern
  const whatColorIs = `What color is ${color.name}? It's a ${props.lightness} ${tempWord} ${family} with the hex code ${hex}.`;

  // "Colors similar to X" — answers "colors similar to" / "colors close to" queries
  const closeMatches = matches.filter((m) => Number(m.delta_e_score) < 3).slice(0, 3);
  let similarColors = "";
  if (closeMatches.length >= 2) {
    const names = closeMatches.map(
      (m) => `${m.match_color.brand.name} ${m.match_color.name}`
    );
    similarColors = `Colors similar to ${color.name} include ${names.join(", ")}. Comparing swatches side by side is the best way to spot the subtle differences that distinguish these close color relatives.`;
  } else {
    similarColors = `${color.name} is a distinctive shade in the ${color.brand.name} lineup, and while close cross-brand equivalents exist, its specific blend of ${tempWord} tone and ${props.lightness} depth gives it a character worth comparing in person.`;
  }

  // Undertone callout for "{color} undertones" queries
  const undertoneCallout = color.undertone
    ? `${color.name} has a ${color.undertone.toLowerCase()} undertone, which affects how it pairs with trim, flooring, and adjacent wall colors. Understanding a color's undertone is key to avoiding combinations that clash — it often matters more than the surface color itself.`
    : `While ${color.name} does not have a strongly pronounced undertone, subtle shifts can appear depending on surrounding colors and lighting. Testing it next to your flooring and trim samples will reveal any hidden warmth or coolness.`;

  // Extended content paragraphs
  const appearance = getAppearanceParagraph(color, props, family, satCat);
  const roomUsage = getRoomUsageParagraph(color, props, family);
  const pairing = getPairingParagraph(color, props, family, matches);
  const mood = getMoodParagraph(color, props);
  const designStyle = getDesignStyleParagraph(color, props, family);
  const practical = getPracticalParagraph(color, props, family);

  return [whatColorIs, similarColors, undertoneCallout, appearance, roomUsage, pairing, mood, designStyle, practical]
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

export function generateMetaDescription(color: ColorWithBrand): string {
  const props = deriveProps(color);
  const family = color.color_family || getHueName(props.hue);
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const colorNum = color.color_number ? ` (${color.color_number})` : "";
  const lrvPart = lrv != null ? `, LRV ${lrv}` : "";
  const undertonePart = color.undertone ? `, ${color.undertone.toLowerCase()} undertone` : "";

  const result = `${color.name}${colorNum} by ${color.brand.name} — ${color.hex.toUpperCase()}${lrvPart}${undertonePart}. ${family} with cross-brand matches from 14 paint brands.`;

  if (result.length <= 160) return result;
  const trimmed = result.slice(0, 157);
  const lastSpace = trimmed.lastIndexOf(" ");
  return trimmed.slice(0, lastSpace > 120 ? lastSpace : 157) + "...";
}
