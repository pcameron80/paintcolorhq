import type { ColorWithBrand, CrossBrandMatchWithColor } from "./types";
import { hexToHsl } from "./palettes";

// ---------- Deterministic hash helpers ----------

function hashStr(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
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
    if (props.lightness === "very light") return ["clean", "crisp", "airy", "bright", "fresh", "luminous", "pure", "pristine", "open", "ethereal", "cloudlike", "spacious"];
    if (props.lightness === "light") return ["soft", "gentle", "quiet", "restful", "serene", "calm", "subtle", "understated", "hushed", "mellow", "tender", "breezy"];
    if (props.lightness === "dark") return ["bold", "dramatic", "striking", "powerful", "commanding", "intense", "anchoring", "grounding", "moody", "cinematic", "brooding", "authoritative"];
    return ["balanced", "versatile", "adaptable", "timeless", "classic", "refined", "steady", "composed", "dependable", "enduring", "unfussy", "grounded"];
  }
  if (props.temperature === "warm") {
    if (props.saturation === "vibrant") return ["bold", "energetic", "striking", "vivid", "dynamic", "lively", "spirited", "radiant", "expressive", "electrifying", "fiery", "exuberant"];
    if (props.saturation === "muted" || props.saturation === "subtle") return ["soft", "approachable", "warm", "gentle", "inviting", "understated", "relaxed", "easygoing", "lived-in", "effortless", "familiar", "easy"];
    return ["warm", "inviting", "welcoming", "comfortable", "rich", "cozy", "engaging", "earthy", "grounded", "nurturing", "enveloping", "homey"];
  }
  // cool
  if (props.saturation === "vibrant") return ["bold", "commanding", "dramatic", "vivid", "striking", "powerful", "intense", "captivating", "arresting", "electric", "magnetic", "dazzling"];
  if (props.saturation === "muted" || props.saturation === "subtle") return ["calm", "serene", "restful", "tranquil", "peaceful", "soothing", "quiet", "subdued", "meditative", "contemplative", "still", "zen"];
  return ["cool", "composed", "elegant", "refined", "sophisticated", "poised", "collected", "graceful", "polished", "cultivated", "tailored", "sleek"];
}

function getUndertonePhrase(props: DerivedProps): string[] {
  if (props.isAchromatic) {
    if (props.undertone === "golden") return ["warm golden undertones", "subtle warm undertones", "a hint of warmth beneath the surface", "a faint golden cast", "underlying amber warmth", "a whisper of gold"];
    if (props.undertone === "pink") return ["soft pink undertones", "a subtle rosy warmth", "gentle pinkish undertones", "an underlying blush", "faint rose-tinted warmth", "a delicate pink cast"];
    if (props.undertone === "blue") return ["cool blue undertones", "a slight blue-gray cast", "subtle cool undertones", "an icy blue edge", "faint steel-blue undertones", "a cool silvery cast"];
    if (props.undertone === "green") return ["faint green undertones", "subtle sage undertones", "a whisper of green", "an earthy green cast", "underlying olive tones", "a mossy hint"];
    return ["minimal undertones", "a nearly neutral base", "very balanced undertones", "a true neutral cast", "almost no visible undertone", "an exceptionally clean base"];
  }
  if (props.undertone === "golden") return ["warm golden undertones", "rich amber undertones", "honey-warm undertones", "sun-kissed undertones", "buttery golden undertones", "toasty amber warmth", "wheat-toned undertones", "caramel-kissed depth"];
  if (props.undertone === "pink") return ["soft pink undertones", "rosy undertones", "subtle blush undertones", "warm rose undertones", "dusty pink undertones", "berry-tinted warmth", "flushed rose tones", "petal-soft pink undertones"];
  if (props.undertone === "green") return ["cool green undertones", "earthy green undertones", "sage undertones", "olive undertones", "mossy green undertones", "eucalyptus-like undertones", "fern-tinted depth", "leafy green undertones"];
  if (props.undertone === "blue") return ["cool blue undertones", "blue-gray undertones", "oceanic undertones", "steely blue undertones", "icy blue undertones", "slate-blue depth", "denim-like undertones", "twilight blue undertones"];
  if (props.undertone === "violet") return ["violet undertones", "subtle purple undertones", "cool violet undertones", "lavender undertones", "plum-tinted undertones", "grape-like undertones", "amethyst undertones", "dusky violet depth"];
  return ["balanced undertones", "neutral undertones", "cleanly balanced undertones", "evenly balanced undertones", "well-centered undertones", "a balanced and neutral base", "steady neutral undertones", "no dominant undertone"];
}

const characterFrames = [
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} by ${brand} is a ${lightDesc} with ${undertone} that give it a ${feel} quality.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} by ${brand} is a ${lightDesc} featuring ${undertone} and a ${feel} character.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `A ${lightDesc} from ${brand}, ${name} carries ${undertone} and a distinctly ${feel} presence.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} is a ${feel} ${lightDesc} from ${brand} with ${undertone}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `With ${undertone}, ${brand}'s ${name} is a ${feel} ${lightDesc}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} reads as a ${feel} ${lightDesc} in the ${brand} lineup, shaped by its ${undertone}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `A ${feel} ${lightDesc} from ${brand}, ${name} gets its personality from ${undertone}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `${brand}'s ${name} presents as a ${lightDesc} with ${undertone} and a ${feel} mood.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `Defined by ${undertone}, ${brand}'s ${name} is a ${feel} ${lightDesc}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} from ${brand} is a ${lightDesc} — ${feel} in tone, with ${undertone}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `A ${lightDesc} that feels ${feel}, ${brand}'s ${name} is distinguished by its ${undertone}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} offers a ${feel} take on a ${lightDesc} from ${brand}, accented by ${undertone}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `As a ${lightDesc} in ${brand}'s collection, ${name} brings a ${feel} energy through its ${undertone}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `${name} by ${brand} combines the depth of a ${lightDesc} with ${undertone} for a ${feel} effect.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `Both ${feel} and nuanced, ${brand}'s ${name} is a ${lightDesc} with ${undertone}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `Part of ${brand}'s palette, ${name} is a ${lightDesc} defined by ${undertone} and a ${feel} sensibility.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `${brand} describes ${name} as a ${lightDesc}, and it delivers a ${feel} quality thanks to its ${undertone}.`,
  (name: string, brand: string, lightDesc: string, feel: string, undertone: string) =>
    `In the ${brand} range, ${name} stands out as a ${feel} ${lightDesc} built on ${undertone}.`,
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
        `${lrvNote} opens up even compact rooms, performing well on ceilings, wainscoting, and as a gallery-wall backdrop.`,
        `${lrvNote} reads as clean and expansive, a reliable pick for trim, doors, and low-light hallways.`,
      ], hash, 200);
    }
    if (props.lightness === "dark") {
      return pick([
        `${lrvNote} absorbs light dramatically, ideal for accent walls, cabinetry, and front doors.`,
        `${lrvNote} creates depth and drama, perfect for accent walls, built-ins, and statement furniture.`,
        `${lrvNote} brings intensity to any space — try it on a feature wall, exterior door, or library shelving.`,
        `${lrvNote} commands attention, making it a standout choice for fireplace surrounds, vanities, and exterior shutters.`,
        `${lrvNote} anchors a room with confidence — consider it for a study, media room, or dramatic powder room.`,
      ], hash, 200);
    }
    return pick([
      `${lrvNote} works as a versatile whole-home neutral for living rooms, bedrooms, and hallways.`,
      `${lrvNote} adapts easily to any room, serving as a dependable backdrop for living areas and bedrooms.`,
      `${lrvNote} provides a flexible foundation that pairs well with both warm and cool accent colors.`,
      `${lrvNote} creates a calm, cohesive feel in open-concept spaces, hallways, and bedrooms alike.`,
      `${lrvNote} serves as a reliable whole-house color, flowing naturally between living rooms, corridors, and bedrooms.`,
      `${lrvNote} grounds a space without competing with furniture or artwork — ideal for open-plan living.`,
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
        `${lrvNote} reads as gentle and inviting, ideal for nurseries, guest bedrooms, and breakfast nooks.`,
        `${lrvNote} wraps a room in quiet warmth — a strong choice for master bedrooms, sitting rooms, and foyers.`,
        `${lrvNote} offers enough softness for a bedroom retreat while staying interesting enough for a main living area.`,
      ], hash, 200);
    }
    return pick([
      `${lrvNote} keeps spaces feeling open and airy, working well in bathrooms, bedrooms, and coastal-inspired rooms.`,
      `${lrvNote} brightens interiors with a refreshing feel, ideal for bathrooms, laundry rooms, and sunlit bedrooms.`,
      `${lrvNote} offers a serene backdrop for bedrooms, bathrooms, and reading nooks.`,
      `${lrvNote} lends a tranquil quality to any room, from master bedrooms to spa-like bathrooms.`,
      `${lrvNote} feels crisp and airy, a natural fit for sunrooms, enclosed porches, and light-filled kitchens.`,
      `${lrvNote} evokes a seaside calm, making it a favorite for bathrooms, pool houses, and coastal-themed bedrooms.`,
      `${lrvNote} keeps a room feeling fresh and spacious — try it in a laundry room, mudroom, or home gym.`,
    ], hash, 200);
  }

  if (props.lightness === "medium") {
    return pick([
      `${lrvNote} balances depth and brightness, making it a strong choice for dining rooms, accent walls, and home offices.`,
      `${lrvNote} provides enough depth for visual interest while remaining approachable — ideal for dining rooms and studies.`,
      `${lrvNote} adds character to a space without overpowering it, working well in home offices, mudrooms, and powder rooms.`,
      `${lrvNote} strikes a balance that suits both traditional and contemporary spaces, from dining rooms to dens.`,
      `${lrvNote} brings personality to a room without shrinking it — consider it for a kitchen island, feature wall, or covered patio.`,
      `${lrvNote} holds its own in well-lit rooms and becomes even richer in softer light — a strong pick for dining rooms and home libraries.`,
      `${lrvNote} works as a confident main-wall color in rooms with good natural light, or as an accent in brighter spaces.`,
    ], hash, 200);
  }

  // deep or dark
  if (props.saturation === "vibrant") {
    return pick([
      `${lrvNote} absorbs light dramatically, making it ideal for accent walls, cabinetry, and front doors where bold contrast is the goal.`,
      `${lrvNote} makes a powerful statement on feature walls, kitchen islands, and exterior doors.`,
      `${lrvNote} demands attention — try it on a statement wall, built-in shelving, or bathroom vanity.`,
      `${lrvNote} turns heads on a front door, a fireplace surround, or the inside of a bookcase for a pop of drama.`,
      `${lrvNote} performs best when balanced by lighter surfaces — pair it with white trim for maximum impact.`,
    ], hash, 200);
  }
  return pick([
    `${lrvNote} creates a cocooning effect, perfect for moody bedrooms, libraries, and intimate dining rooms.`,
    `${lrvNote} adds depth and sophistication, well-suited for accent walls, powder rooms, and home offices.`,
    `${lrvNote} grounds a space with quiet intensity, working beautifully in dens, master bedrooms, and formal dining rooms.`,
    `${lrvNote} turns a room into a sanctuary — ideal for a reading nook, wine room, or enclosed study.`,
    `${lrvNote} wraps a room in richness, especially effective in spaces with warm lighting and natural textures.`,
  ], hash, 200);
}

// ---------- Design style suggestions ----------

function getDesignStyle(props: DerivedProps, hash: number): string {
  if (props.isAchromatic) {
    if (props.lightness === "very light" || props.lightness === "light") {
      return pick([
        "It fits seamlessly into Scandinavian, minimalist, and modern farmhouse interiors.",
        "Popular in Japandi, Scandinavian, and transitional design, it keeps the focus on texture and form.",
        "A staple in minimalist and coastal design, it creates a gallery-like backdrop for artwork and furniture.",
        "Whether the style is farmhouse, contemporary, or traditional, this neutral adapts effortlessly.",
        "It anchors modern farmhouse and transitional spaces, letting shiplap, wood beams, and textured fabrics take center stage.",
      ], hash, 500);
    }
    if (props.lightness === "dark") {
      return pick([
        "It suits moody, dramatic interiors — think dark academia, industrial, and bold contemporary design.",
        "A favorite in industrial lofts, library-inspired rooms, and modern maximalist spaces.",
        "This depth of neutral works beautifully in Art Deco, mid-century, and glamorous modern interiors.",
        "It brings an editorial quality to a space, fitting naturally into curated, design-forward rooms.",
        "Popular in moody modern and Victorian-inspired interiors, it pairs well with brass fixtures and rich fabrics.",
      ], hash, 500);
    }
    return pick([
      "It works across nearly every style, from mid-century modern to traditional to transitional.",
      "A chameleon neutral, it adapts to farmhouse, coastal, modern, and traditional settings equally well.",
      "Its versatility makes it a designer favorite for transitional and contemporary interiors.",
      "It serves as a bridge between styles — layer it with vintage pieces or clean-lined modern furniture.",
      "Whether the décor leans rustic, contemporary, or eclectic, this neutral holds its own.",
    ], hash, 500);
  }

  // Chromatic colors
  if (props.temperature === "warm") {
    if (props.hue >= 15 && props.hue < 45) {
      // orange/terracotta/rust range
      return pick([
        "It leans into Southwest, bohemian, and Mediterranean design with natural ease.",
        "A natural fit for terracotta-inspired spaces, boho-chic interiors, and desert-modern design.",
        "It channels Tuscan warmth, pairing beautifully with wrought iron, clay, and natural stone.",
        "Popular in Santa Fe, boho, and earth-toned modern interiors where warmth is key.",
        "It evokes sun-baked clay and artisan craft, well-suited to eclectic and globally inspired rooms.",
      ], hash, 500);
    }
    if (props.hue >= 45 && props.hue < 75) {
      // yellow/gold range
      return pick([
        "It brightens French country, cottage-core, and traditional interiors with cheerful warmth.",
        "A favorite in English country, cottage-style, and sunlit traditional rooms.",
        "It brings a collected, lived-in feeling to farmhouse kitchens, breakfast rooms, and mudrooms.",
        "Popular in traditional, French provincial, and vintage-inspired spaces where warmth meets charm.",
        "It carries the warmth of afternoon light, fitting naturally into cottage and transitional styles.",
      ], hash, 500);
    }
    // general warm (reds, warm pinks, etc.)
    return pick([
      "It complements traditional, mid-century, and eclectic interiors where warmth sets the mood.",
      "This warm tone suits rustic, farmhouse, and craftsman-style homes where coziness is the goal.",
      "It resonates with mid-century modern, arts-and-crafts, and warm contemporary design.",
      "A natural choice for cozy modern, transitional, and collected-over-time interiors.",
      "It pairs with rich fabrics, leather, and wood — fitting for dens, libraries, and traditional dining rooms.",
    ], hash, 500);
  }

  // cool colors
  if (props.hue >= 75 && props.hue < 165) {
    // green range
    return pick([
      "It brings a grounded, organic quality to biophilic, Japandi, and nature-inspired interiors.",
      "A natural fit for botanical, cottage-core, and earthy modern spaces.",
      "It works beautifully in wellness-inspired rooms, garden-adjacent sunrooms, and eco-modern interiors.",
      "Popular in biophilic design, craftsman homes, and nature-forward contemporary spaces.",
      "It channels the outdoors, pairing well with natural wood, stone, and woven textures.",
    ], hash, 500);
  }
  if (props.hue >= 165 && props.hue < 260) {
    // blue/teal range
    return pick([
      "It resonates with coastal, nautical, and relaxed modern interiors.",
      "A coastal classic, it also works in Hamptons, Scandinavian, and mid-century modern settings.",
      "It channels nautical calm, fitting naturally into beach houses, lake cottages, and spa bathrooms.",
      "Popular in coastal, preppy, and relaxed contemporary design — a perennial favorite for bedrooms and baths.",
      "It pairs with crisp whites and natural rattan for a breezy, resort-like atmosphere.",
    ], hash, 500);
  }
  // violet/purple range
  return pick([
    "It adds a creative, artistic edge to eclectic, maximalist, and glam interiors.",
    "A statement tone that works in Art Deco, jewel-box rooms, and curated eclectic spaces.",
    "It lends a regal quality to formal dining rooms, dressing rooms, and boutique-inspired bedrooms.",
    "Popular in glamorous, Victorian-inspired, and bold contemporary interiors.",
    "It brings drama and personality, fitting naturally into maximalist and color-confident design.",
  ], hash, 500);
}

// ---------- Lighting behavior ----------

function getLightingBehavior(props: DerivedProps, hash: number): string {
  if (props.isAchromatic) {
    if (props.undertone === "golden" || props.undertone === "pink") {
      return pick([
        "In north-facing rooms it reads warmer, while south-facing light pulls out its cleanest tone.",
        "Incandescent bulbs amplify its warmth; daylight-balanced LEDs keep it more neutral.",
        "Morning light brings out subtle warmth, while cool afternoon light keeps it crisp and balanced.",
        "It warms up under tungsten lighting and reads cooler in rooms with plenty of natural daylight.",
      ], hash, 600);
    }
    if (props.undertone === "blue" || props.undertone === "green") {
      return pick([
        "It leans cooler in north-facing rooms and warms up slightly under incandescent lighting.",
        "South-facing natural light brings out its truest tone, while cooler lighting emphasizes the undertone.",
        "Under warm artificial light it softens; under daylight LEDs, its cool undertone becomes more apparent.",
        "It shifts subtly depending on light source — warmer fixtures tame its cool edge, while daylight reveals it fully.",
      ], hash, 600);
    }
    return pick([
      "Its neutral base holds steady across different lighting conditions, looking consistent from morning to evening.",
      "It reads similarly under natural daylight and warm artificial light, making it a low-risk choice for any room.",
      "One of its strengths is consistency — it doesn't shift dramatically between north- and south-facing rooms.",
      "Lighting changes barely alter its appearance, giving it the same dependable look in any exposure.",
    ], hash, 600);
  }

  // Chromatic
  if (props.saturation === "vibrant" || props.saturation === "moderate") {
    if (props.temperature === "warm") {
      return pick([
        "South-facing light intensifies its warmth, while north-facing rooms let it relax into a softer version of itself.",
        "It gains energy under warm lighting and reads more subdued in cooler, north-facing spaces.",
        "Sunset light sets it on fire, while overcast days reveal a quieter, more muted personality.",
        "Its warm character deepens under incandescent bulbs and softens slightly in cool-white LED light.",
      ], hash, 600);
    }
    return pick([
      "North-facing light deepens its cool character, while south-facing rooms warm it up just enough to soften the edges.",
      "Under daylight it reads vivid and true; under warm artificial light, it shifts subtly toward neutral.",
      "Cool-toned LEDs make it pop, while warm incandescent light tempers its intensity.",
      "It holds its color well across lighting conditions, though cool daylight reveals it at its most vibrant.",
    ], hash, 600);
  }

  // Muted/subtle saturation
  if (props.temperature === "warm") {
    return pick([
      "In warm evening light it leans richer, while morning daylight keeps it light and easy.",
      "Its muted saturation means it shifts gracefully between lighting conditions without ever feeling overwhelming.",
      "It feels cozier under lamplight and fresher in daylight — a versatile performer across exposures.",
      "Warm bulbs coax out its depth; natural light keeps it breezy and open.",
    ], hash, 600);
  }
  return pick([
    "North-facing rooms emphasize its cool side, while warmer light sources bring out a more balanced tone.",
    "It reads slightly different in every room — cooler near windows, warmer under lamps — but always in a flattering range.",
    "Its restrained saturation helps it adapt across light levels without becoming too intense or too flat.",
    "Overcast daylight keeps it mellow, while warm evening light adds a gentle, approachable glow.",
  ], hash, 600);
}

// ---------- Coordination / pairing tips ----------

function getCoordinationTip(color: ColorWithBrand, props: DerivedProps, hash: number): string {
  const family = color.color_family || getHueName(props.hue);

  if (props.isAchromatic) {
    if (props.lightness === "very light" || props.lightness === "light") {
      return pick([
        `Pair it with a deeper ${props.temperature === "warm" ? "taupe or greige" : "charcoal or slate"} for contrast, and add texture through linen, wool, or natural wood.`,
        `It works as a clean canvas — layer in warmth with honey-toned oak, rattan, and creamy textiles.`,
        `For visual interest, combine it with a bold accent color on a single wall or through throw pillows and art.`,
        `Coordinate with matte black hardware, warm brass fixtures, or brushed nickel to give it direction.`,
        `It pairs naturally with both warm and cool accent colors, making it a safe starting point for any palette.`,
      ], hash, 700);
    }
    if (props.lightness === "dark") {
      return pick([
        `Balance its weight with crisp white trim, light ceiling colors, and reflective metallic accents.`,
        `Pair it with warm brass, copper fixtures, and rich fabrics like velvet or leather for a layered look.`,
        `Offset the depth with a bright, warm rug and light-toned artwork to keep the room from feeling heavy.`,
        `It creates a striking frame for white built-ins, marble counters, or light-stained hardwood floors.`,
        `Add warmth with amber-toned lighting, textured throws, and natural wood to keep it inviting.`,
      ], hash, 700);
    }
    return pick([
      `Try pairing it with a white trim that has the same undertone to keep transitions seamless.`,
      `It coordinates beautifully with natural wood floors, whether light oak, walnut, or reclaimed pine.`,
      `For a cohesive look, choose trim, ceiling, and adjacent wall colors from the same temperature family.`,
      `Layer it with textures — a chunky knit throw, a jute rug, and linen curtains keep a neutral room interesting.`,
      `Add a single saturated accent color through artwork, cushions, or a statement lamp for a curated look.`,
    ], hash, 700);
  }

  // Chromatic pairing tips by hue family
  if (props.hue >= 15 && props.hue < 45) {
    // orange/coral/terracotta
    return pick([
      `For trim, reach for a warm white rather than a stark white — the shared warmth creates a smoother transition.`,
      `It pairs beautifully with sage greens, dusty blues, and creamy off-whites for a balanced, earthy palette.`,
      `Natural materials like terracotta tile, raw wood, and woven baskets amplify its organic character.`,
      `Try it alongside navy or deep teal for dramatic contrast, or with beige and cream for a softer scheme.`,
      `Brass and copper hardware echo its warm tone, while matte black adds a modern edge.`,
    ], hash, 700);
  }
  if (props.hue >= 45 && props.hue < 75) {
    // yellow/gold
    return pick([
      `Pair it with soft gray or blue-gray for a sophisticated contrast that keeps the warmth in check.`,
      `It coordinates naturally with white trim, natural wood, and soft greens for a garden-inspired palette.`,
      `For a bolder look, pair it with deep navy or charcoal — the contrast is both classic and modern.`,
      `Layer it with warm whites, creamy ivories, and natural linen for a sun-drenched, European feel.`,
      `It works well with both brushed brass and polished nickel hardware, depending on the desired mood.`,
    ], hash, 700);
  }
  if (props.hue >= 75 && props.hue < 165) {
    // green range
    return pick([
      `Pair it with warm wood tones and creamy whites for an organic, grounded palette.`,
      `It coordinates beautifully with soft pinks, terracotta, or mustard for unexpected warmth.`,
      `For a nature-inspired scheme, combine it with stone gray, sandy beige, and raw wood.`,
      `White marble, light oak, and linen textures bring out its freshness without competing for attention.`,
      `Layer it with deeper greens for a tonal effect, or with warm blush tones for playful contrast.`,
    ], hash, 700);
  }
  if (props.hue >= 165 && props.hue < 260) {
    // blue/teal range
    return pick([
      `Pair it with warm whites and natural wood to keep the cool tones from feeling stark or cold.`,
      `It works beautifully with sandy beiges, warm tans, and honey-toned flooring for a coastal palette.`,
      `For a polished look, combine it with crisp white trim, chrome fixtures, and cool-toned marble.`,
      `Coral, rust, or terracotta accents create a vibrant, complementary contrast against this cool base.`,
      `Layer it with deeper navy for a tonal scheme, or with warm gray and cream for an approachable, lived-in feel.`,
    ], hash, 700);
  }
  if (props.hue >= 260 && props.hue < 330) {
    // purple/violet range
    return pick([
      `Pair it with warm gold or brass accents to bring out its richness without letting it feel cold.`,
      `It coordinates beautifully with dusty pink, sage green, or warm gray for an unexpectedly balanced palette.`,
      `For a dramatic scheme, combine it with deep charcoal, velvet textures, and moody floral prints.`,
      `White trim, light hardwood floors, and natural linen keep it grounded and livable.`,
      `Try it alongside soft blush, warm taupe, or champagne for a feminine, sophisticated pairing.`,
    ], hash, 700);
  }
  // red/warm red
  return pick([
    `Balance its intensity with crisp white trim and neutral furnishings to let it be the star.`,
    `It pairs naturally with warm wood tones, cream upholstery, and brass or copper accents.`,
    `For a layered look, combine it with charcoal, soft black, and natural stone textures.`,
    `Tone it down with sandy beige, warm gray, or greige on adjacent walls for a cohesive flow.`,
    `It makes a striking partner for deep navy or forest green in a bold, confident palette.`,
  ], hash, 700);
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
        `Shopping across brands? ${bestBrand}'s ${bestName} is ${closenessPhrase}, and ${second.match_color.brand.name}'s ${second.match_color.name} is another viable option.`,
      ], hash, 300);
    }
  }

  return pick([
    `The closest match from ${bestBrand} is ${bestName}, ${closenessPhrase}.`,
    `${bestBrand}'s ${bestName} is the nearest cross-brand equivalent, ${closenessPhrase}.`,
    `For a ${bestBrand} alternative, ${bestName} is ${closenessPhrase}.`,
    `Looking across brands, ${bestBrand}'s ${bestName} comes in as ${closenessPhrase}.`,
    `The most similar option from ${bestBrand} is ${bestName}, ${closenessPhrase}.`,
    `If you prefer ${bestBrand}, their ${bestName} is ${closenessPhrase}.`,
  ], hash, 300);
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

// ---------- Color number intro ----------

function getColorNumberIntro(color: ColorWithBrand, hash: number): string | null {
  if (!color.color_number) return null;
  return pick([
    `It's catalogued as ${color.color_number} in the ${color.brand.name} system.`,
    `${color.brand.name} lists it under the code ${color.color_number}.`,
    `You'll find it as ${color.color_number} in ${color.brand.name}'s lineup.`,
    `In ${color.brand.name}'s catalog, it carries the designation ${color.color_number}.`,
    `It's filed as ${color.color_number} within the ${color.brand.name} collection.`,
  ], hash, 800);
}

// ---------- Public API ----------

export function generateColorDescription(
  color: ColorWithBrand,
  matches: CrossBrandMatchWithColor[]
): string {
  // Use both hex and name for hash — ensures similar hexes with different names get different content
  const hash = hashStr(color.hex + color.name + color.brand.slug);
  const props = deriveProps(color);
  const lrv = color.lrv != null ? Number(color.lrv) : null;

  // 1. Character statement (always included)
  const lightDesc = getLightDescription(color, props);
  const feel = pick(getColorFeel(props), hash, 100);
  const undertone = pick(getUndertonePhrase(props), hash, 101);
  const characterSentence = pick(characterFrames, hash, 102)(
    color.name,
    color.brand.name,
    lightDesc,
    feel,
    undertone
  );

  // 2. Room suggestion (always included)
  const roomSentence = getRoomSuggestion(props, lrv, hash);

  // 3. Color number sentence (when available)
  const colorNumSentence = getColorNumberIntro(color, hash);

  // 4. Cross-brand match (when available)
  const matchSentence = getMatchSentence(matches, hash);

  // 5. Design, lighting, coordination — pick 2 of 3 for variety
  const designStyle = getDesignStyle(props, hash);
  const lighting = getLightingBehavior(props, hash);
  const coordination = getCoordinationTip(color, props, hash);
  const optionalPool = [designStyle, lighting, coordination];
  const optSkip = hash % 3;
  const selectedOptional = optionalPool.filter((_, i) => i !== optSkip);

  const sentences = [characterSentence, roomSentence];
  if (colorNumSentence) sentences.push(colorNumSentence);
  if (matchSentence) sentences.push(matchSentence);
  sentences.push(...selectedOptional);

  return sentences.join(" ");
}

export function generateMetaDescription(color: ColorWithBrand): string {
  const hash = hashStr(color.hex + color.name);
  const props = deriveProps(color);
  const family = color.color_family || getHueName(props.hue);
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const brandName = color.brand.name;
  const colorNum = color.color_number ? ` (${color.color_number})` : "";
  const undertoneWord = color.undertone ? ` ${color.undertone} undertone.` : "";

  // Multiple meta description patterns for variety
  const patterns = [
    () => {
      const tempWord = props.temperature === "neutral" ? "" : `${props.temperature} `;
      const lrvPart = lrv != null ? ` LRV ${lrv}.` : "";
      return `${color.name}${colorNum} by ${brandName} — a ${props.lightness} ${tempWord}${family}. ${color.hex.toUpperCase()}.${lrvPart}${undertoneWord} See matches from 14 brands.`;
    },
    () => {
      const lrvPart = lrv != null ? `, LRV ${lrv}` : "";
      return `Explore ${brandName}'s ${color.name}${colorNum}, a ${props.lightness} ${family} (${color.hex.toUpperCase()}${lrvPart}). Cross-brand matches, palettes & room ideas.`;
    },
    () => {
      const tempWord = props.temperature === "neutral" ? "neutral" : props.temperature;
      const lrvPart = lrv != null ? ` with an LRV of ${lrv}` : "";
      return `${color.name} by ${brandName} is a ${props.lightness}, ${tempWord} ${family}${lrvPart}. Find equivalent colors from Sherwin-Williams, Benjamin Moore, Behr & more.`;
    },
    () => {
      const lrvPart = lrv != null ? ` LRV ${lrv}.` : "";
      return `${brandName} ${color.name}${colorNum} (${color.hex.toUpperCase()}) — ${props.lightness} ${family}.${lrvPart} Match it across 14 paint brands, build palettes & visualize in a room.`;
    },
    () => {
      const lrvPart = lrv != null ? `, LRV ${lrv}` : "";
      const tempWord = props.temperature === "neutral" ? "" : `${props.temperature}-toned `;
      return `${color.name} is a ${props.lightness} ${tempWord}${family} from ${brandName} (${color.hex.toUpperCase()}${lrvPart}). Compare across brands & generate palettes.`;
    },
  ];

  const result = pick(patterns, hash, 900)();

  if (result.length <= 160) return result;
  // Trim gracefully at last space before 157 chars
  const trimmed = result.slice(0, 157);
  const lastSpace = trimmed.lastIndexOf(" ");
  return trimmed.slice(0, lastSpace > 120 ? lastSpace : 157) + "...";
}
