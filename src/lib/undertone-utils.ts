export const UNDERTONE_LABELS = [
  "Warm (Golden)",
  "Warm (Pink)",
  "Cool (Blue)",
  "Cool (Green)",
  "Cool (Violet)",
  "Neutral",
] as const;

export const UNDERTONE_CATEGORIES: Record<string, string[]> = {
  warm: ["Warm (Golden)", "Warm (Pink)"],
  cool: ["Cool (Blue)", "Cool (Green)", "Cool (Violet)"],
  neutral: ["Neutral"],
};

export function getUndertoneDotClass(undertone: string): string {
  if (undertone.includes("Golden")) return "bg-amber-400";
  if (undertone.includes("Pink")) return "bg-pink-400";
  if (undertone.includes("Blue")) return "bg-blue-400";
  if (undertone.includes("Green")) return "bg-emerald-400";
  if (undertone.includes("Violet")) return "bg-violet-400";
  return "bg-gray-400";
}

export function getUndertoneCategory(
  undertone: string,
): "warm" | "cool" | "neutral" {
  for (const [category, labels] of Object.entries(UNDERTONE_CATEGORIES)) {
    if (labels.includes(undertone)) return category as "warm" | "cool" | "neutral";
  }
  return "neutral";
}

/** Expand a category like "warm" into its constituent undertone labels */
export function expandUndertoneFilter(filter: string): string[] {
  const category = UNDERTONE_CATEGORIES[filter];
  if (category) return category;
  // If it's already a specific label, return as-is
  if ((UNDERTONE_LABELS as readonly string[]).includes(filter)) return [filter];
  return [];
}
