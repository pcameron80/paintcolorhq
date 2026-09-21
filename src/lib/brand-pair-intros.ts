const BRAND_NAMES: Record<string, string> = {
  "sherwin-williams": "Sherwin-Williams", "benjamin-moore": "Benjamin Moore",
  behr: "Behr", ppg: "PPG", valspar: "Valspar", "dunn-edwards": "Dunn-Edwards", "farrow-ball": "Farrow & Ball",
};

// Brand-wide pigment, durability and price claims cannot be established from
// color coordinates. Describe only what this comparison actually provides.
export function getBrandPairIntro(sourceSlug: string, targetSlug: string): string | undefined {
  const source = BRAND_NAMES[sourceSlug];
  const target = BRAND_NAMES[targetSlug];
  if (!source || !target) return undefined;
  return `Find ${target} candidates for a ${source} color by name or code. The results rank stored digital colors by similarity, not paint quality or formula compatibility. Compare the original with a physical ${target} sample in the finish you plan to use before substituting brands.`;
}
