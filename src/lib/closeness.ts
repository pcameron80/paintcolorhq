// Single closeness vocabulary for the whole site. CIEDE2000 Delta E maps to
// exactly three labels. Never print the raw number in user-facing copy.
//
//   < 2      Nearly identical
//   2 to < 5 Very similar
//   >= 5     Visible difference
//
// Every surface that recommends a substitute should also carry a short
// "digital match, confirm with a physical sample" caveat.

export const NEARLY_IDENTICAL_MAX = 2;
export const VERY_SIMILAR_MAX = 5;

export type ClosenessLabel = "Nearly identical" | "Very similar" | "Visible difference";
/** The three labels, closest first, for copy that names them all. */
export const CLOSENESS_LABELS: readonly ClosenessLabel[] = ["Nearly identical", "Very similar", "Visible difference"];

export type ClosenessTier = "nearly-identical" | "very-similar" | "visible-difference";

export function closenessTier(deltaE: number): ClosenessTier {
  if (deltaE < NEARLY_IDENTICAL_MAX) return "nearly-identical";
  if (deltaE < VERY_SIMILAR_MAX) return "very-similar";
  return "visible-difference";
}

export function closenessLabel(deltaE: number): ClosenessLabel {
  const tier = closenessTier(deltaE);
  if (tier === "nearly-identical") return "Nearly identical";
  if (tier === "very-similar") return "Very similar";
  return "Visible difference";
}

/** Lowercase form for mid-sentence use, e.g. "These two are nearly identical". */
export function closenessLabelLower(deltaE: number): Lowercase<ClosenessLabel> {
  return closenessLabel(deltaE).toLowerCase() as Lowercase<ClosenessLabel>;
}
