import type { InspirationPalette } from "./palettes";
import { hexToHsl } from "./palettes";
import { hashStr, pick } from "./color-description";

// ---------- Palette analysis helpers ----------

type PaletteTemperature = "warm" | "cool" | "mixed";
type LightnessProfile = "light-dominant" | "dark-dominant" | "balanced";
type ContrastLevel = "high" | "moderate" | "low";

interface PaletteAnalysis {
  temperature: PaletteTemperature;
  lightnessProfile: LightnessProfile;
  contrastLevel: ContrastLevel;
  avgLightness: number;
}

function analyzePalette(colors: string[]): PaletteAnalysis {
  let warmCount = 0;
  let coolCount = 0;
  let totalL = 0;
  let minL = 100;
  let maxL = 0;

  for (const hex of colors) {
    const [h, s, l] = hexToHsl(hex);
    totalL += l;
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;

    // Skip achromatic colors from temperature count
    if (s < 8) continue;

    // Warm hues: 0-15, 15-75, 260-360
    if ((h >= 0 && h < 15) || (h >= 15 && h < 75) || h >= 260) {
      warmCount++;
    } else {
      coolCount++;
    }
  }

  const chromaTotal = warmCount + coolCount;
  let temperature: PaletteTemperature;
  if (chromaTotal === 0) {
    temperature = "mixed";
  } else if (warmCount / chromaTotal > 0.6) {
    temperature = "warm";
  } else if (coolCount / chromaTotal > 0.6) {
    temperature = "cool";
  } else {
    temperature = "mixed";
  }

  const avgLightness = totalL / colors.length;
  let lightnessProfile: LightnessProfile;
  if (avgLightness > 65) {
    lightnessProfile = "light-dominant";
  } else if (avgLightness < 35) {
    lightnessProfile = "dark-dominant";
  } else {
    lightnessProfile = "balanced";
  }

  const contrastRange = maxL - minL;
  let contrastLevel: ContrastLevel;
  if (contrastRange > 40) {
    contrastLevel = "high";
  } else if (contrastRange > 20) {
    contrastLevel = "moderate";
  } else {
    contrastLevel = "low";
  }

  return { temperature, lightnessProfile, contrastLevel, avgLightness };
}

// ---------- Sentence 1: Mood ----------

function getMoodSentence(
  name: string,
  analysis: PaletteAnalysis,
  hash: number,
): string {
  const key = `${analysis.temperature}-${analysis.contrastLevel}`;

  const pools: Record<string, string[]> = {
    "warm-high": [
      `The ${name} palette builds a bold, sun-warmed atmosphere with enough tonal range to keep every wall interesting, creating rooms that feel both energized and deeply grounded.`,
      `Anchored in warm tones with dramatic value shifts, ${name} strikes a balance between energy and sophistication that rewards layering with rich textures and natural materials.`,
      `${name} delivers the kind of confident warmth that turns a room into a destination — inviting but never predictable, with contrasts that define architectural details and draw the eye to focal points.`,
      `With strong contrasts woven through warm hues, ${name} creates interiors that feel both lively and deeply comfortable, offering enough tonal variety to differentiate every surface in a room.`,
      `${name} channels the warmth of golden-hour light paired with grounding darks, building a space that feels collected and intentional from the trim to the accent wall.`,
      `Drawing on a wide warm spectrum, ${name} wraps a room in inviting tones while its high contrast keeps the eye moving, preventing any single surface from fading into the background.`,
    ],
    "warm-moderate": [
      `${name} creates a welcoming, layered warmth that feels effortless — like a room that's been thoughtfully lived in for years, with each tone earning its place through harmony rather than drama.`,
      `The gentle contrast within ${name}'s warm tones builds an atmosphere that is cozy without feeling heavy or closed-in, offering a sense of ease that works from sunrise coffee to evening firelight.`,
      `${name} evokes sun-drenched afternoons and candlelit evenings, offering a versatile warmth that shifts gracefully with the light and creates a sense of continuity from room to room.`,
      `With its measured contrast and warm foundation, ${name} establishes a mood that is relaxed yet visually engaging, making it easy to build a coordinated interior that feels natural rather than forced.`,
      `${name} brings the comfortable warmth of natural materials — leather, linen, aged wood — into a cohesive color story that anchors a home without demanding attention.`,
      `Rooted in inviting earth tones, ${name} reads like a well-curated collection of warm neutrals, each shade supporting the others without competing for prominence.`,
    ],
    "warm-low": [
      `${name} wraps a space in a single, enveloping warmth — soft transitions between tones create a cocooning, tranquil effect that blurs the boundaries between walls, trim, and furnishings.`,
      `With its tonal consistency, ${name} bathes a room in warmth, blurring boundaries between surfaces for a seamless, restful feel that turns even utilitarian spaces into retreats.`,
      `${name} trades drama for serenity, building a warm envelope that makes a room feel sheltered and intimate, where the subtle differences between tones reveal themselves slowly over time.`,
      `The close value range in ${name} produces a soothing, monochromatic warmth that whispers rather than shouts, inviting you to layer textures and materials for visual depth.`,
      `${name} keeps its warm palette in a tight tonal band, creating interiors that feel unified, calm, and endlessly approachable — a palette that grows more beautiful the longer you live with it.`,
      `Offering the kind of quiet, enveloping warmth that makes a room feel like a retreat from the outside world, ${name} proves that restraint can be just as powerful as bold contrast.`,
    ],
    "cool-high": [
      `${name} pairs crisp cool tones with bold value contrasts, producing interiors that feel sharp, modern, and full of clarity — the kind of palette that gives a room real architectural presence.`,
      `The high-contrast cool palette of ${name} lends a gallery-like precision to any space, balancing drama with composure and creating rooms that feel curated down to the last detail.`,
      `${name} delivers an architectural quality — cool hues with strong light-dark shifts that define surfaces, create depth, and turn simple rooms into considered compositions.`,
      `With its bold contrasts across a cool foundation, ${name} creates rooms that feel deliberate, refined, and visually compelling, rewarding careful placement of each color in the scheme.`,
      `${name} channels the clarity of coastal light meeting deep water, producing a palette that is both calming and striking, with enough contrast to give each surface its own identity.`,
      `Combining the serenity of cool tones with real tonal range, ${name} adds dimension and visual weight to a space while keeping the overall mood fresh and controlled.`,
    ],
    "cool-moderate": [
      `${name} builds a composed, tranquil atmosphere with cool undertones that keep a room feeling fresh and open, creating the kind of effortless sophistication that never goes out of style.`,
      `The measured contrast in ${name}'s cool palette creates a sense of quiet sophistication, like a well-edited living space where every element has been chosen with intention and care.`,
      `${name} offers the kind of cool restraint that reads as effortlessly chic — poised, balanced, and never overwrought, making it a versatile foundation for layered, textural rooms.`,
      `With its balanced cool tones, ${name} evokes still water and overcast skies, creating interiors that feel serene, thoughtful, and naturally suited to both intimate and expansive spaces.`,
      `${name} produces a calming rhythm of cool hues and moderate contrasts that make a room feel curated and complete, without the visual noise of competing color temperatures.`,
      `Bringing a sense of coastal calm indoors, ${name} provides enough variation to hold visual interest without overwhelming the senses, making it ideal for homes that prize serenity.`,
    ],
    "cool-low": [
      `${name} creates an immersive cool atmosphere, with closely related tones that make a space feel unified and meditative — a palette designed for rooms where stillness is the priority.`,
      `The tonal closeness in ${name}'s cool palette produces a spa-like calm, blurring edges and softening every surface into a single, harmonious envelope of color.`,
      `${name} delivers a hushed, contemplative quality — cool tones in quiet conversation, never raising their voice, and creating a serene backdrop that lets natural light and texture take center stage.`,
      `With minimal contrast across its cool spectrum, ${name} turns a room into a sanctuary of stillness and repose, where subtle tonal shifts reward close attention.`,
      `${name} wraps a space in a single cool breath, creating the kind of seamless serenity found in the best minimalist interiors where every decision serves the pursuit of calm.`,
      `Offering a tonal cool wash that unifies walls, trim, and accents into one harmonious composition, ${name} demonstrates how a restrained palette can feel deeply luxurious.`,
    ],
    "mixed-high": [
      `${name} plays warm against cool with bold contrasts, creating a dynamic tension that makes a room feel alive, curated, and full of the kind of personality that rewards exploration.`,
      `The interplay of warm and cool tones in ${name} produces high-energy interiors that balance excitement with visual coherence, giving you a palette broad enough to define distinct zones in a single space.`,
      `${name} embraces contrast in both temperature and value, resulting in spaces that feel artfully composed and full of personality, with each color playing a distinct role in the overall composition.`,
      `With its warm-cool dialogue and strong value shifts, ${name} builds rooms that reward a second glance at every angle, turning ordinary surfaces into opportunities for visual interest.`,
      `${name} pairs opposing temperatures with dramatic contrast, delivering the kind of visual depth that gives a room real character and makes it feel collected rather than decorated.`,
      `Thriving on the tension between warm and cool extremes, ${name} creates interiors that feel vibrant and intentional, with a wide enough range to paint an entire home from a single curated palette.`,
    ],
    "mixed-moderate": [
      `${name} weaves warm and cool tones into a balanced, harmonious whole that feels neither too energetic nor too subdued, striking the kind of equilibrium that makes a palette feel timeless.`,
      `The blend of temperatures in ${name} creates an adaptable atmosphere — equally at home in a sun-filled kitchen or a quiet reading corner, shifting mood effortlessly with the changing light.`,
      `${name} achieves an easy equilibrium between warm and cool, producing interiors that feel versatile and naturally appealing no matter which direction the windows face.`,
      `With its balanced mix of warm and cool hues, ${name} avoids leaning too far in either direction, landing in a universally flattering range that coordinates with a wide variety of materials and finishes.`,
      `${name} captures the nuance of natural light itself — warm and cool tones coexisting in a palette that works from dawn to dusk, adapting to the shifting quality of each hour.`,
      `Finding its strength in balance, ${name} blends warm and cool elements into a cohesive scheme that adapts to any room orientation, making it one of the most flexible palettes in the collection.`,
    ],
    "mixed-low": [
      `${name} merges warm and cool tones in a tight tonal range, creating a subtle, sophisticated harmony that unfolds slowly and reveals new relationships between its colors over time.`,
      `The quiet interplay of warm and cool in ${name} produces an understated elegance — a palette that reveals its depth over time, rewarding the kind of attention that daily living brings.`,
      `${name} keeps its warm-cool dialogue at a whisper, creating rooms that feel layered and nuanced without any visual noise, and proving that subtlety can be the most powerful design choice.`,
      `With its low contrast and mixed temperatures, ${name} produces a soft, atmospheric quality that wraps a room in gentle complexity, like the first light of a foggy morning.`,
      `${name} blends warm and cool in close harmony, building interiors that feel calm, considered, and subtly dimensional — a palette that grows richer the longer you spend with it.`,
      `Offering a quiet richness where warm and cool tones sit closely together, ${name} creates a single, unified atmosphere that feels both soothing and sophisticated.`,
    ],
  };

  return pick(pools[key], hash, 10);
}

// ---------- Sentence 2: Room suggestion ----------

function getRoomSuggestion(
  analysis: PaletteAnalysis,
  hash: number,
): string {
  const key = `${analysis.lightnessProfile}-${analysis.contrastLevel}`;

  const pools: Record<string, string[]> = {
    "light-dominant-high": [
      "The lighter values open up main living areas and bedrooms while keeping the space from feeling flat, and the deeper accents ground dining rooms, studies, and built-in cabinetry with welcome visual weight.",
      "Use the lighter tones on walls throughout an open floor plan and reserve the darkest shade for a focal feature wall or piece of statement furniture that anchors the room.",
      "This range works beautifully in kitchens and great rooms where the lighter colors keep things airy and expansive, while the darks add definition to islands, trim, and architectural details.",
      "Try the lightest shades in a primary bedroom for tranquility, then bring the deepest tone into an adjacent bath vanity or walk-in closet for a bold but cohesive contrast.",
      "The high-contrast spread gives you real flexibility — light walls in a family room feel spacious and inviting, while the boldest accent turns a powder room or entryway into a jewel box.",
      "Consider the airiest tones for sun-drenched living spaces and the deeper shades for cozy evening rooms like dens, media spaces, and candlelit dining areas.",
    ],
    "light-dominant-moderate": [
      "This palette keeps rooms feeling spacious and breathable, making it well suited for bedrooms, living rooms, and open-concept layouts where you want light without monotony.",
      "The predominantly light values shine in north-facing rooms that need a lift, while the moderate accents add warmth and definition to sunlit south-facing spaces and connecting hallways.",
      "Try it across an entire floor for a cohesive flow — the subtle but present contrast provides just enough variety to distinguish rooms without disrupting the overall sense of openness.",
      "It works beautifully in a primary suite, where the lightest shades create calm, restful walls and the mid-tones add visual interest to an accent chair, headboard wall, or window seat.",
      "Living rooms, guest bedrooms, and breakfast nooks all benefit from this light-forward palette, with the deeper tones reserved for textiles, artwork, and decorative accents that add dimension.",
      "The gentle value range makes this palette forgiving in any exposure and any season, maintaining its character from bright morning light through soft, candlelit evenings.",
    ],
    "light-dominant-low": [
      "With its gentle, closely related values, this palette creates a serene and enveloping backdrop ideal for bedrooms, nurseries, and spa-inspired bathrooms where calm is the priority.",
      "The soft tonal range works as a whole-home neutral, flowing seamlessly from hallways into bedrooms and living areas without jarring transitions or the need for complicated accent strategies.",
      "Consider this palette for a primary suite or guest bedroom where quiet, restful surfaces take priority over bold statements, letting furniture and textiles carry the visual interest.",
      "It excels in compact spaces like hallways, powder rooms, and home offices, where the close values make walls feel expansive, unified, and significantly larger than they actually are.",
      "Try it in a sunroom or reading nook where the softness of the palette enhances the calming effect of natural light, creating a space that feels like a breath of fresh air.",
      "This subtle range turns a bathroom into a spa retreat — use the lightest shade on walls, the next on cabinetry, and the deepest on hardware accents and decorative tile.",
    ],
    "dark-dominant-high": [
      "The dark foundation creates moody, enveloping rooms — think libraries, media rooms, and intimate dining spaces — while the lighter accents prevent the space from feeling heavy or closed-in.",
      "Use the deepest tones on walls for maximum drama and let the lightest color breathe on ceilings, trim, and crown molding to maintain a sense of balance and architectural definition.",
      "This palette transforms a home office or study into a focused retreat, with dark walls that reduce glare and screen fatigue while light accents frame doorways and built-in shelving.",
      "Try the darkest shades in a formal dining room or wine cellar, pulling the lighter values into the adjacent hallway for a dramatic reveal that makes both spaces feel more intentional.",
      "The strong contrast means this palette can anchor a loft or open-plan space, using dark zones to define activity areas and lighter zones to expand circulation paths and gathering spots.",
      "Consider using the deep tones on lower walls and wainscoting with lighter shades above the chair rail for a classic, grounded composition that adds height and polish to any room.",
    ],
    "dark-dominant-moderate": [
      "These deeper values excel in dens, home theaters, and cozy sitting rooms where a sense of enclosure is welcome rather than constraining, creating spaces that invite lingering.",
      "Use the richest tones in rooms with good artificial lighting — table lamps, sconces, and pendants bring out the depth and nuance without letting the space feel cave-like or oppressive.",
      "The moderate contrast provides enough relief to keep dark walls visually interesting, making this palette work well for master bedrooms that double as quiet evening retreats from the day.",
      "Try it in a study or library, where the dark base supports wood shelving, leather seating, and brass hardware, creating a space that feels both scholarly and deeply comfortable.",
      "It works well in rooms with high ceilings where the dark values add welcome intimacy, or in small powder rooms where the drama feels deliberately chosen rather than accidental.",
      "This palette turns a standard hallway into a gallery-like passage — dark walls with lighter trim create the perfect frame for artwork, mirrors, and collected objects displayed on shelves.",
    ],
    "dark-dominant-low": [
      "With its closely held dark values, this palette creates deeply cocooning spaces best suited for intimate rooms like dens, bedrooms, and wine cellars where atmosphere outweighs brightness.",
      "Use it in spaces where mood matters more than light — a music room, home bar, or candlelit dining room will showcase its quiet intensity and reward you with a sense of occasion.",
      "The tight value range reads as sophisticated restraint, working well in small rooms that benefit from feeling like intentional, curated chambers rather than accidentally dim spaces.",
      "Consider it for a dressing room, walk-in closet, or butler's pantry where the enveloping darkness adds a genuine sense of luxury, privacy, and departure from the rest of the home.",
      "It excels in rooms with warm, ambient lighting that activates the subtle differences between tones, revealing a depth and texture that flat overhead lighting tends to flatten.",
      "This palette works best in smaller rooms and niche spaces where the uniformity of dark tones creates an intimate, cocoon-like enclosure that makes you want to stay longer.",
    ],
    "balanced-high": [
      "The wide tonal range makes this palette a true workhorse — use lighter shades in high-traffic areas and reserve the bolder tones for rooms that deserve a strong focal point.",
      "It transitions naturally from an airy kitchen to a richly painted dining room, giving each space its own distinct identity while maintaining a connected, curated palette throughout the home.",
      "Try the mid-tones in a living room, the lightest shade on trim throughout the house, and the darkest on a fireplace wall, exterior front door, or kitchen island for impact.",
      "This balanced range suits homes with varied room sizes and functions — the lighter values expand small rooms while the deeper tones add gravity and presence to large ones.",
      "Use it to create a visual journey through your home, with lighter entries and hallways gradually leading into more richly colored living and dining spaces for a sense of arrival.",
      "The strong contrast across balanced values gives you the flexibility to paint an entire home from a single curated palette without any room feeling repetitive or disconnected.",
    ],
    "balanced-moderate": [
      "This versatile range works from room to room without losing cohesion — try lighter tones in bedrooms and bolder ones in a home office, accent wall, or entryway statement.",
      "The moderate contrast keeps things interesting without overwhelming, making it a reliable choice for open-plan living areas that flow naturally between cooking, dining, and lounging zones.",
      "Use the middle values on primary walls, the lightest on ceilings and trim, and the deepest as an accent on a single feature surface like a bookshelf back or powder room.",
      "It suits a whole-home approach, where the palette ties together a living room, kitchen, and adjacent hallways through shared undertones and a consistent but not monotonous value range.",
      "Try it in a transitional home where the moderate contrast bridges casual family spaces and more formally appointed rooms, giving each area character without breaking the overall flow.",
      "This palette delivers variety without chaos, allowing you to differentiate rooms through value shifts while keeping the overall home feeling unified, intentional, and well-designed.",
    ],
    "balanced-low": [
      "The closely related mid-range values create a calm, tonal quality that works well in bedrooms, sitting rooms, and spa-inspired bathrooms where serenity takes precedence over statement.",
      "Use it as a subtle, layered backdrop where visual interest comes from texture and material rather than bold color contrast — think linen curtains, natural stone, and raw wood surfaces.",
      "This tight tonal range is ideal for minimalist and Japandi-inspired interiors where restraint and intentionality drive every design decision, from wall color to furniture selection.",
      "Try it in a primary bedroom or meditation space where the quiet palette supports deep relaxation without visual distraction, letting your mind settle as easily as your body.",
      "The low contrast makes this palette forgiving in shifting light conditions, maintaining its character gracefully from bright morning sun through overcast afternoons to soft evening lamplight.",
      "It excels in spaces designed for calm — yoga rooms, reading nooks, and guest suites where the subtle tonal shifts feel deliberate, soothing, and intentionally understated.",
    ],
  };

  return pick(pools[key], hash, 20);
}

// ---------- Sentence 3: Role guidance ----------

function getRoleGuidance(
  analysis: PaletteAnalysis,
  hash: number,
): string {
  const pools: Record<ContrastLevel, string[]> = {
    high: [
      "Assign the lightest color to ceilings and trim for maximum openness, use a mid-tone on your largest wall surfaces, and let the darkest shade anchor an accent wall, cabinetry, or a statement piece of built-in furniture.",
      "Start with the deepest value on the feature you want to emphasize — a fireplace surround, kitchen island, or front door — then step up in lightness for surrounding walls, trim, and ceiling to create a natural hierarchy.",
      "Reserve the boldest shade for surfaces you want to advance visually and the lightest for areas you want to recede, using the remaining three tones to bridge the transition and keep the eye moving naturally through the space.",
      "Paint your largest rooms in the lighter values to maintain a sense of openness and flow, then deploy the two deepest tones in smaller, more intimate spaces where drama and enclosure become assets rather than liabilities.",
      "Use the strongest contrast pair — lightest and darkest — on trim and accent surfaces in the same room for sharp architectural definition, and fill the primary wall surfaces with a middle value that ties everything together.",
      "The lightest shade makes an excellent ceiling color throughout the entire home, while the darkest grounds furniture, built-in shelving, or a single bold wall that serves as the room's visual anchor.",
    ],
    moderate: [
      "Distribute the five colors by room function — lighter tones in communal spaces where you want openness, mid-values in private rooms, and the boldest as a throughline accent on doors, millwork, or cabinetry.",
      "Use two of the lighter shades as your primary wall colors in the most-used rooms, reserve the mid-tone for accent walls and painted furniture, and bring the deeper values into accessories, textiles, and decorative objects.",
      "Paint adjacent rooms in neighboring values from this palette to create a natural, flowing progression, saving the most saturated shade for a single focal element per room that draws the eye without overwhelming.",
      "Assign the calmest tone to bedrooms where rest matters most, the warmest to gathering spaces like kitchens and family rooms, and the deepest to surfaces where you want the eye to land — a bookcase, range hood, or vanity.",
      "Try using three colors per room — one on walls, one on trim, and one on an accent piece or textile — then rotate selections from room to room for variety within a unified whole.",
      "The moderate contrast lets you use any two adjacent colors side by side without jarring shifts, so feel free to experiment with different pairings and combinations in different rooms throughout the home.",
    ],
    low: [
      "With this close tonal range, use all five colors within a single room for a layered, tonal effect — walls, trim, ceiling, furnishings, and textiles each in a slightly different shade for quiet depth.",
      "Apply the colors in order from lightest on the ceiling to deepest on the floor or lower walls, creating a subtle gradient that grounds the space naturally and draws the eye gently downward.",
      "Because the values sit so close together, you can use two or three colors in a single room without creating hard contrasts — the effect is soft, enveloping, and deeply sophisticated in its restraint.",
      "Try a tonal approach: paint trim one step lighter than walls, ceiling one step lighter than trim, and bring the deepest shade into throw pillows, upholstery, and rugs for a fully layered composition.",
      "The tight value range invites layering — use these five colors across surfaces, textiles, and accessories within the same room for a rich monochromatic look that reveals its complexity gradually.",
      "Use the lightest value as your ceiling and the darkest as your floor-adjacent tone, then distribute the three middle values across walls, trim, and soft furnishings to build a seamless tonal envelope.",
    ],
  };

  return pick(pools[analysis.contrastLevel], hash, 30);
}

// ---------- Sentence 4: Design style ----------

function getDesignStyle(
  analysis: PaletteAnalysis,
  hash: number,
): string {
  const pools: Record<PaletteTemperature, string[]> = {
    warm: [
      "This palette complements farmhouse, Mediterranean, and craftsman interiors where warmth, natural materials, and lived-in character are central to the design language of the space.",
      "It pairs naturally with mid-century modern, bohemian, and rustic styles that rely on warm wood tones, woven textures, and earthy accents to create spaces that feel collected over time.",
      "Warm-toned palettes like this one are staples in traditional, transitional, and desert-modern design, grounding a room with an inviting, sun-touched quality that never goes out of fashion.",
      "Expect it to shine in cottagecore, arts-and-crafts, and Tuscan-inspired spaces where warmth and handcrafted details set the tone and natural imperfection is welcomed rather than avoided.",
      "It aligns beautifully with organic modern and earthy contemporary styles that favor natural stone, terracotta, and warm metals like brass and copper as finishing touches.",
      "This warm foundation supports everything from French country kitchens to Santa Fe living rooms, adapting to any design style where coziness and approachability are the driving priorities.",
    ],
    cool: [
      "Cool palettes like this one resonate with coastal, Scandinavian, and modern minimalist interiors where clarity, calm, and a sense of visual order drive the design direction.",
      "It complements nautical, Hamptons, and contemporary styles that pair cool tones with crisp whites, natural fiber, and polished metals for an effortlessly refined atmosphere.",
      "This palette is at home in spa-inspired bathrooms, Japandi living rooms, and any space where serenity and visual order take priority over bold decorative gestures.",
      "Expect it to perform well in mid-century modern, industrial, and Nordic interiors that favor cool neutrals, matte surfaces, and clean lines as their foundational design elements.",
      "Cool-toned schemes like this pair naturally with marble, concrete, and pale wood, fitting seamlessly into urban loft, gallery-inspired, and contemporary apartment settings.",
      "It aligns with coastal grandmother, modern farmhouse, and transitional styles that use cool tones to keep interiors feeling perpetually fresh, open, and full of natural light.",
    ],
    mixed: [
      "The warm-cool balance in this palette makes it remarkably versatile, supporting everything from eclectic maximalism to restrained transitional design without favoring one direction over the other.",
      "It adapts to modern farmhouse, collected bohemian, and globally inspired interiors where a deliberate mix of temperatures feels intentional rather than accidental or uncertain.",
      "Mixed-temperature palettes like this provide built-in flexibility — they coordinate equally well with warm wood tones and cool stone surfaces without clashing with either material family.",
      "Expect it to work in transitional, contemporary, and eclectic settings where the interplay of warm and cool elements creates a layered, curated feel that evolves with the seasons.",
      "This palette bridges design styles that might otherwise conflict, making it a strong choice for open-plan homes with varied room functions and mixed material selections.",
      "It complements art-filled, personality-driven interiors where the mix of warm and cool tones mirrors the eclectic, well-traveled spirit of the furnishings and collected objects.",
    ],
  };

  return pick(pools[analysis.temperature], hash, 40);
}

// ---------- Sentence 5: Practical tip ----------

function getPracticalTip(hash: number): string {
  const tips = [
    "Before committing, order sample pots of all five colors and paint large swatches in each room where they'll be used — colors interact differently depending on adjacency, lighting, and sheen, and what works on a small chip can surprise you on a full wall.",
    "Test all five colors together on a single large sample board, then move that board from room to room throughout the day to see how natural and artificial light alter the relationships between the tones.",
    "When working with a five-color palette, choose a single sheen for all wall colors and a consistent sheen for all trim to ensure the colors read as a unified family rather than a patchwork of finishes.",
    "Start by painting the two largest surfaces first — typically walls and ceiling — then layer in accent and trim colors one at a time, adjusting your selections if the first two feel too close or too far apart in practice.",
    "Keep your undertone families consistent across all five colors by comparing swatches under the same light source at the same time of day; a warm white under warm light can mask a cool undertone that only appears in daylight.",
    "If one of the five colors feels too bold on a full wall, try it on a smaller surface like the inside of a bookcase, a mudroom bench, or a single piece of painted furniture where it can shine without overwhelming.",
    "Apply the 60-30-10 principle adapted for five colors: let two lighter tones cover roughly sixty percent of surfaces, two mid-tones handle thirty percent, and reserve the boldest shade for the final ten percent of accents.",
    "Photograph your sample swatches in place rather than relying on memory — side-by-side phone photos taken in morning light and evening lamplight reveal shifts that your eye naturally adjusts to in the moment.",
  ];

  return pick(tips, hash, 50);
}

// ---------- Public API ----------

export function generatePaletteDescription(
  palette: InspirationPalette,
): string {
  const hash = hashStr(palette.slug);
  const analysis = analyzePalette(palette.colors);

  const mood = getMoodSentence(palette.name, analysis, hash);
  const room = getRoomSuggestion(analysis, hash);
  const role = getRoleGuidance(analysis, hash);
  const style = getDesignStyle(analysis, hash);
  const tip = getPracticalTip(hash);

  return [mood, room, role, style, tip].join(" ");
}
