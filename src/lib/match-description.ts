import type { ColorWithBrand, CrossBrandMatchWithColor } from "./types";
import { hashStr, pick } from "./color-description";
import { hexToHsl } from "./palettes";

// ---------- Temperature helper ----------

type Temperature = "warm" | "cool" | "neutral";

function getTemperature(hex: string): Temperature {
  const [h, s] = hexToHsl(hex);
  if (s < 8) return "neutral";
  if ((h >= 15 && h < 75) || h >= 260 || h < 15) return "warm";
  return "cool";
}

// ---------- Delta E quality tier ----------

type QualityTier =
  | "near-identical"
  | "extremely-close"
  | "very-close"
  | "close"
  | "noticeable";

function getQualityTier(deltaE: number): QualityTier {
  if (deltaE < 1) return "near-identical";
  if (deltaE < 2) return "extremely-close";
  if (deltaE < 3) return "very-close";
  if (deltaE < 5) return "close";
  return "noticeable";
}

// ---------- Sentence 1: Opening ----------

function getOpening(
  sourceName: string,
  sourceBrand: string,
  matchName: string,
  matchBrand: string,
  deltaE: number,
  tier: QualityTier,
  hash: number,
): string {
  const score = deltaE.toFixed(2);

  const pools: Record<QualityTier, string[]> = {
    "near-identical": [
      `${matchBrand}'s ${matchName} is a near-identical match to ${sourceBrand}'s ${sourceName}, with a Delta E of just ${score}.`,
      `With a Delta E of only ${score}, ${matchName} by ${matchBrand} is virtually indistinguishable from ${sourceName} by ${sourceBrand}.`,
      `${sourceName} and ${matchName} are about as close as two colors from different brands can get, registering a Delta E of ${score}.`,
      `At a Delta E of ${score}, ${matchBrand}'s ${matchName} is an almost perfect replica of ${sourceBrand}'s ${sourceName}.`,
      `The match between ${sourceBrand}'s ${sourceName} and ${matchBrand}'s ${matchName} is remarkably tight, with a Delta E of ${score}.`,
      `If you're looking for ${sourceName} in the ${matchBrand} lineup, ${matchName} delivers an almost exact match at a Delta E of ${score}.`,
    ],
    "extremely-close": [
      `${matchBrand}'s ${matchName} is an extremely close match to ${sourceBrand}'s ${sourceName}, scoring a Delta E of ${score}.`,
      `With a Delta E of ${score}, ${matchName} by ${matchBrand} is nearly indistinguishable from ${sourceBrand}'s ${sourceName} in most lighting conditions.`,
      `${sourceName} by ${sourceBrand} finds an excellent counterpart in ${matchBrand}'s ${matchName}, with a Delta E of just ${score}.`,
      `At ${score} on the Delta E scale, ${matchBrand}'s ${matchName} is an exceptionally close stand-in for ${sourceBrand}'s ${sourceName}.`,
      `The Delta E of ${score} between ${sourceName} and ${matchName} puts this match well within professional-grade accuracy.`,
      `${matchName} from ${matchBrand} lands extremely close to ${sourceBrand}'s ${sourceName}, with a measured Delta E of ${score}.`,
    ],
    "very-close": [
      `${matchBrand}'s ${matchName} is a very close match to ${sourceBrand}'s ${sourceName}, with a Delta E of ${score}.`,
      `Scoring a Delta E of ${score}, ${matchName} by ${matchBrand} is one of the strongest alternatives to ${sourceBrand}'s ${sourceName}.`,
      `${sourceName} and ${matchBrand}'s ${matchName} share a strong visual resemblance, registering a Delta E of ${score}.`,
      `At a Delta E of ${score}, ${matchBrand}'s ${matchName} captures the essence of ${sourceBrand}'s ${sourceName} with only minor variation.`,
      `The Delta E of ${score} between these two colors means ${matchName} is a very reliable substitute for ${sourceName}.`,
      `If ${sourceBrand}'s ${sourceName} is your target, ${matchBrand}'s ${matchName} at a Delta E of ${score} is a strong contender.`,
    ],
    "close": [
      `${matchBrand}'s ${matchName} is a close match to ${sourceBrand}'s ${sourceName}, with a Delta E of ${score}.`,
      `With a Delta E of ${score}, ${matchName} by ${matchBrand} captures the general character of ${sourceBrand}'s ${sourceName}, though minor differences are visible.`,
      `${sourceName} by ${sourceBrand} and ${matchBrand}'s ${matchName} sit in the same visual neighborhood, with a Delta E of ${score}.`,
      `At a Delta E of ${score}, ${matchBrand}'s ${matchName} is a reasonable alternative to ${sourceBrand}'s ${sourceName}, with slight tonal shifts.`,
      `The Delta E of ${score} places ${matchName} close enough to ${sourceName} to serve as a workable cross-brand substitute.`,
      `${matchName} from ${matchBrand} tracks close to ${sourceBrand}'s ${sourceName} at a Delta E of ${score}, though some nuance is lost.`,
    ],
    "noticeable": [
      `${matchBrand}'s ${matchName} is the closest available match to ${sourceBrand}'s ${sourceName}, though at a Delta E of ${score} the difference is visible.`,
      `With a Delta E of ${score}, ${matchName} by ${matchBrand} is the nearest option to ${sourceBrand}'s ${sourceName}, but expect a noticeable shift in tone.`,
      `${sourceName} by ${sourceBrand} doesn't have a tight equivalent in the ${matchBrand} range — ${matchName} is the closest at a Delta E of ${score}.`,
      `At a Delta E of ${score}, ${matchBrand}'s ${matchName} shares the same color family as ${sourceName} but diverges enough to read as a distinct shade.`,
      `The Delta E of ${score} between ${sourceName} and ${matchName} means this is more of an inspired alternative than a direct swap.`,
      `${matchName} from ${matchBrand} is the best available stand-in for ${sourceName}, though the Delta E of ${score} suggests a perceptible color shift.`,
    ],
  };

  return pick(pools[tier], hash, 1);
}

// ---------- Sentence 2: Delta E explanation ----------

function getDeltaEExplanation(tier: QualityTier, hash: number): string {
  const pools: Record<QualityTier, string[]> = {
    "near-identical": [
      "A Delta E below 1.0 means the difference falls beneath the threshold of human perception — even trained colorists would struggle to tell them apart.",
      "In practical terms, a Delta E this low means the two colors are perceptually identical; side-by-side swatches would look the same under standard lighting.",
      "Delta E scores under 1.0 are considered imperceptible to the human eye, making this one of the tightest cross-brand matches possible.",
      "At this level of accuracy, the color difference is measurable only by instruments — your eye simply cannot distinguish between the two.",
      "Professional color matching considers anything below 1.0 Delta E to be a perfect match, and this pairing meets that standard.",
      "This score means the two paints will dry to virtually the same color, with no visible difference even when applied directly adjacent.",
    ],
    "extremely-close": [
      "A Delta E between 1 and 2 is only perceptible to a trained eye under controlled conditions — in a real room, the difference effectively vanishes.",
      "At this Delta E range, the color difference is technically detectable but rarely noticeable once paint is on the wall and furniture is in place.",
      "Delta E scores in this range represent the kind of variation you might see between two cans of the same paint mixed at different times.",
      "In practice, a Delta E this small disappears once the paint is applied — lighting, sheen, and surrounding colors all mask a gap this minor.",
      "Color professionals consider a Delta E under 2 to be an excellent match, well within the tolerance for seamless cross-brand substitution.",
      "This level of color difference is comparable to what you'd see between different sheens of the same paint color — functionally invisible in context.",
    ],
    "very-close": [
      "A Delta E between 2 and 3 means the difference is subtle — visible if you hold swatches side by side, but unlikely to be noticed once paint is on the wall.",
      "At this range, a discerning eye might spot the variation on adjacent swatches, but once applied in a room the two colors read as effectively the same.",
      "Delta E scores in this bracket represent a slight but manageable difference — well within what most homeowners would accept as a successful match.",
      "In real-world conditions, a Delta E around this level blends into the natural variation caused by lighting, wall texture, and paint sheen.",
      "Professional painters consider this range a solid match, especially when the two colors won't be applied directly next to each other.",
      "The difference at this Delta E is akin to comparing a freshly painted wall to one that has aged slightly — present but unremarkable.",
    ],
    "close": [
      "A Delta E between 3 and 5 means the difference is noticeable when comparing swatches side by side, though both colors clearly belong to the same family.",
      "At this range, expect a visible shift in undertone or depth — not enough to clash, but enough that a careful eye will spot the change.",
      "Delta E scores in this bracket indicate a color that's in the right ballpark but carries its own personality — think of it as a close cousin rather than a twin.",
      "In a room, this level of difference often reads as intentional variation rather than a mismatch, especially with different lighting or wall orientations.",
      "Professional color consultants would flag this range as a workable substitute when an exact match isn't available, but recommend sampling first.",
      "The variation at this Delta E is comparable to how the same color can look different between two paint brands' fan decks — real but manageable.",
    ],
    "noticeable": [
      "A Delta E of 5 or above means the two colors are clearly different, even at a glance — this is best treated as an inspired alternative rather than a direct replacement.",
      "At this level, the color shift is plainly visible and may involve changes in undertone, depth, or warmth that alter the overall mood of a room.",
      "Delta E scores in this range mean you're looking at a related color rather than a true match — think of it as exploring the same neighborhood rather than the same address.",
      "In practice, a Delta E this high means the two colors will read as distinct shades, so consider whether the alternative achieves the look you're after on its own merits.",
      "Professional matchers would classify this as a directional suggestion rather than a swap — useful for inspiration but not for seamless brand switching.",
      "The difference at this Delta E is large enough that sampling both colors in your actual space is essential before committing.",
    ],
  };

  return pick(pools[tier], hash, 2);
}

// ---------- Sentence 3: Undertone / character comparison ----------

function getUndertoneComparison(
  sourceHex: string,
  matchHex: string,
  sourceName: string,
  matchName: string,
  tier: QualityTier,
  hash: number,
): string {
  const sourceTemp = getTemperature(sourceHex);
  const matchTemp = getTemperature(matchHex);
  const sameTemp = sourceTemp === matchTemp;

  const [, , sourceL] = hexToHsl(sourceHex);
  const [, , matchL] = hexToHsl(matchHex);
  const lighterMatch = matchL > sourceL + 3;
  const darkerMatch = matchL < sourceL - 3;

  // Same temperature
  if (sameTemp) {
    if (lighterMatch) {
      return pick([
        `Both colors lean ${sourceTemp}, though ${matchName} reads slightly lighter, which may open up a room a touch more.`,
        `They share a ${sourceTemp} foundation, but ${matchName} carries a bit more lightness — a subtle lift that's flattering in north-facing rooms.`,
        `The ${sourceTemp} undertone is consistent across both, with ${matchName} sitting just a shade lighter on the value scale.`,
        `Tonally aligned as ${sourceTemp} colors, the main distinction is that ${matchName} picks up a fraction more light.`,
        `Both share ${sourceTemp} undertones, and the slightly lighter body of ${matchName} gives it an airier feel on larger surfaces.`,
        `The ${sourceTemp} character is preserved in both colors, with ${matchName} leaning just perceptibly brighter.`,
      ], hash, 3);
    }
    if (darkerMatch) {
      return pick([
        `Both colors carry ${sourceTemp} undertones, though ${matchName} reads a touch deeper, adding a bit more gravity to a space.`,
        `They share a ${sourceTemp} base, but ${matchName} dips slightly darker — a difference that becomes more apparent on large walls.`,
        `The ${sourceTemp} character holds across both, with ${matchName} offering a marginally richer depth.`,
        `Tonally, both sit in the ${sourceTemp} range, but ${matchName} adds a whisper of extra weight that grounds a room.`,
        `With shared ${sourceTemp} undertones, the key nuance is that ${matchName} carries slightly more depth.`,
        `Both are firmly ${sourceTemp}, and the modest depth increase in ${matchName} gives it a more enveloping quality.`,
      ], hash, 3);
    }
    return pick([
      `Both colors share ${sourceTemp} undertones, so the transition between brands should feel seamless in most interiors.`,
      `The ${sourceTemp} character is consistent across both colors, making this a straightforward brand swap with minimal visual disruption.`,
      `Tonally, these two are well aligned — both carry ${sourceTemp} undertones that will coordinate with the same trim, flooring, and fabrics.`,
      `Because they share a ${sourceTemp} foundation, either color will pair with the same accent palette and finish selections.`,
      `The matching ${sourceTemp} undertones mean these colors will behave similarly under both natural and artificial light.`,
      `With both sitting in the ${sourceTemp} range, you can expect them to play nicely with the same warm or cool whites for trim.`,
    ], hash, 3);
  }

  // Different temperatures
  if (tier === "near-identical" || tier === "extremely-close") {
    return pick([
      `While ${sourceName} leans ${sourceTemp} and ${matchName} trends ${matchTemp}, the difference is so small that it only surfaces under very specific lighting.`,
      `There's a subtle temperature shift — ${sourceName} is ${sourceTemp} where ${matchName} is ${matchTemp} — but at this Delta E it's barely perceptible.`,
      `The slight move from ${sourceTemp} to ${matchTemp} undertones is the main distinction, though it's unlikely to affect how the color coordinates with trim or furnishings.`,
      `${sourceName} reads ${sourceTemp} and ${matchName} reads ${matchTemp}, but the shift is negligible at this match quality.`,
      `A minor undertone shift from ${sourceTemp} to ${matchTemp} is the primary difference, though it's subtle enough to vanish in most room conditions.`,
      `The ${sourceTemp}-to-${matchTemp} shift between these two is the kind of nuance that paint professionals notice on a fan deck but homeowners rarely see on a wall.`,
    ], hash, 3);
  }

  return pick([
    `One thing to note: ${sourceName} leans ${sourceTemp} while ${matchName} carries ${matchTemp} undertones, which may affect how it pairs with existing trim and furnishings.`,
    `The most significant difference is temperature — ${sourceName} reads ${sourceTemp} and ${matchName} reads ${matchTemp}, so test it against your current palette before committing.`,
    `${sourceName}'s ${sourceTemp} character gives way to a ${matchTemp} lean in ${matchName}, a shift worth considering if your room already has a strong warm or cool direction.`,
    `Pay attention to the undertone shift: ${sourceName} is ${sourceTemp} while ${matchName} skews ${matchTemp}, which can change how the color interacts with adjacent surfaces.`,
    `The move from ${sourceTemp} (${sourceName}) to ${matchTemp} (${matchName}) is the kind of shift that becomes more obvious on a large surface area.`,
    `Because ${sourceName} is ${sourceTemp} and ${matchName} is ${matchTemp}, you may notice a different mood in the room — test large samples to see if the shift works for your space.`,
  ], hash, 3);
}

// ---------- Sentence 4: Sampling advice ----------

function getSamplingAdvice(tier: QualityTier, hash: number): string {
  const pools: Record<QualityTier, string[]> = {
    "near-identical": [
      "Even with a match this precise, always test a physical sample on your actual wall — screen colors and printed swatches can't account for your room's unique lighting.",
      "Despite the near-perfect score, we recommend brushing out a sample in your space, because sheen, wall texture, and ambient light all influence the final appearance.",
      "A match this close gives you strong confidence, but nothing replaces a peel-and-stick sample or brush-out on the wall where the color will live.",
      "While the numbers confirm an excellent match, take the extra step of testing a quart or sample pot on your wall to see it in morning and evening light.",
      "This is about as close as cross-brand matching gets, but paint color is always a conversation with your room's light — a sample swatch on-site seals the decision.",
      "The data says near-identical, but your eyes in your space have the final vote — grab a sample and test it on at least two walls before committing.",
    ],
    "extremely-close": [
      "At this level of closeness, a physical sample is still the gold standard — paint a test patch on your wall and observe it at different times of day.",
      "This match is tight enough that most people skip sampling, but spending the few dollars on a test pot can save hundreds in regret.",
      "Brush out a sample and view it in both natural daylight and evening lamplight to confirm it reads the way you expect in your specific room.",
      "Even professional designers sample colors that score this well, because the interaction between paint and a room's light is always slightly unpredictable.",
      "The match is excellent on paper, but we always recommend living with a sample swatch on your wall for 24 to 48 hours before buying gallons.",
      "A quick sample test in your space will confirm what the numbers already suggest — this is a very reliable cross-brand substitute.",
    ],
    "very-close": [
      "With a match in this range, sampling becomes especially important — brush out a test patch and compare it to your reference swatch under your room's actual lighting.",
      "Before committing to gallons, paint a sample board or directly on the wall and observe it at sunrise, midday, and under lamps to see the full range of how it reads.",
      "A very close match still benefits from real-world testing — wall texture, sheen level, and neighboring colors all influence the final perception.",
      "We strongly recommend testing this match in your space, as the slight variation can be amplified or minimized depending on your room's orientation and light sources.",
      "Pick up a sample pot and paint two coats on your wall in the area where the color matters most — you'll get a much clearer picture than any screen can offer.",
      "This match is solid, but the best way to confirm it works for your project is to see it in person on your actual surface with your actual lighting.",
    ],
    "close": [
      "Given the moderate Delta E, sampling side by side in your room is essential — order peel-and-stick swatches or brush out test patches to see both colors in context.",
      "With this level of variation, testing on your wall is a must — what looks close on a screen can read quite differently under your home's specific lighting conditions.",
      "We recommend painting a sample of both the original and this match on adjacent areas of your wall to evaluate the difference in your actual environment.",
      "At this Delta E, the difference is real enough that a physical comparison in your space should drive the decision — don't rely on screen previews alone.",
      "Sampling is critical here — paint a generous test patch and live with it for a couple of days, checking it under natural light, overcast skies, and evening lamps.",
      "Before committing, see this color on your wall alongside a swatch of the original to decide whether the shift works with your trim, flooring, and furnishings.",
    ],
    "noticeable": [
      "Because the color difference is clearly visible, treat this as a starting point rather than a final answer — sample it in your room and decide if the alternative appeals to you on its own terms.",
      "With a Delta E this high, in-person sampling is non-negotiable — paint a large test patch and evaluate it independently rather than expecting it to replicate the original.",
      "We recommend approaching this match as inspiration rather than substitution — order a sample and assess whether it achieves the mood you're looking for in your space.",
      "Physical sampling is essential here, as the gap between these two colors is wide enough to change the feel of a room — test generously before committing.",
      "At this Delta E, a side-by-side wall test will immediately show you whether this alternative suits your space, so invest in a sample before buying gallons.",
      "Think of this as a related color rather than a replacement — sample it on your wall and evaluate it on its own merits in your room's particular light.",
    ],
  };

  return pick(pools[tier], hash, 4);
}

// ---------- Sentence 5: Cross-brand context ----------

function getCrossBrandContext(
  sourceBrand: string,
  matchBrand: string,
  hash: number,
): string {
  return pick([
    `Switching between ${sourceBrand} and ${matchBrand} is common when availability, pricing, or retailer proximity changes — having a reliable cross-brand match makes the transition painless.`,
    `Homeowners often need cross-brand alternatives when their preferred ${sourceBrand} color isn't stocked locally, and knowing the closest ${matchBrand} equivalent saves time and guesswork.`,
    `Whether you're matching existing trim to a new wall color or switching suppliers mid-project, having a vetted ${matchBrand} equivalent for a ${sourceBrand} favorite keeps your palette on track.`,
    `Cross-brand matching is especially useful during renovations, when one room's ${sourceBrand} color needs to flow into an addition or adjacent space painted with ${matchBrand}.`,
    `Contractors frequently work across brand lines depending on project specs and client accounts — a precise ${sourceBrand}-to-${matchBrand} match ensures color continuity regardless of which paint is in the sprayer.`,
    `Many designers specify one brand for walls and another for trim or cabinetry, so having an accurate ${matchBrand} equivalent for ${sourceBrand}'s color makes multi-brand projects seamless.`,
    `Real estate touch-ups, rental turnovers, and insurance repairs often require matching an existing ${sourceBrand} color with whatever brand is available — this ${matchBrand} match gives you a reliable fallback.`,
  ], hash, 5);
}

// ---------- Public API ----------

export function generateMatchDescription(
  sourceColor: ColorWithBrand,
  targetBrandName: string,
  bestMatch: CrossBrandMatchWithColor,
): string {
  const hash = hashStr(sourceColor.hex + targetBrandName);
  const deltaE = Number(bestMatch.delta_e_score);
  const tier = getQualityTier(deltaE);

  const matchColor = bestMatch.match_color;

  // 1. Opening — varies by Delta E quality level
  const opening = getOpening(
    sourceColor.name,
    sourceColor.brand.name,
    matchColor.name,
    matchColor.brand.name,
    deltaE,
    tier,
    hash,
  );

  // 2. Delta E explanation
  const deltaExplanation = getDeltaEExplanation(tier, hash);

  // 3. Undertone / character comparison
  const undertoneNote = getUndertoneComparison(
    sourceColor.hex,
    matchColor.hex,
    sourceColor.name,
    matchColor.name,
    tier,
    hash,
  );

  // 4. Sampling advice
  const samplingAdvice = getSamplingAdvice(tier, hash);

  // 5. Cross-brand context
  const crossBrandNote = getCrossBrandContext(
    sourceColor.brand.name,
    matchColor.brand.name,
    hash,
  );

  return [opening, deltaExplanation, undertoneNote, samplingAdvice, crossBrandNote].join(" ");
}
