// Whether a color's stored undertone label is safe to print.
//
// The label comes from the classifier in scripts/lib/undertone.ts; the color's
// own Lab values are the check on it. About 5,100 pages said "neutral
// undertone" for colors whose a*/b* plainly lean one way (Benjamin Moore
// Shakespeare Tan: Neutral, but b* 24.7), and saturated colors have a color,
// not an undertone. Every surface that prints the label (lede, meta, FAQ, pin,
// hero, technical profile, JSON-LD, the title test) goes through this, so
// they agree with each other.
//
// After MP-44 (the undertone classifier rewrite) the label itself should be
// trustworthy; reduce this guard to the first two rules (no label, C* >= 20).

export interface UndertoneInput {
  undertone?: string | null;
  lab_a?: number | string | null;
  lab_b_val?: number | string | null;
}

// Chroma (C*) from the Lab a* and b* pair, or null when either is missing.
export function chroma(a: number | null, b: number | null): number | null {
  return a == null || b == null ? null : Math.sqrt(a * a + b * b);
}

const num = (v: number | string | null | undefined): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** The undertone label to show, or null when it should not be shown. A color
 *  with no Lab values cannot contradict its label, so the label stands. */
export function displayUndertone(color: UndertoneInput): string | null {
  const label = color.undertone?.trim();
  if (!label) return null;
  const a = num(color.lab_a);
  const b = num(color.lab_b_val);
  const c = chroma(a, b);
  if (c != null && c >= 20) return null;
  const kind = label.toLowerCase();
  if (kind.startsWith("neutral") && ((c != null && c >= 10) || (b != null && b >= 5))) return null;
  if (kind.startsWith("warm") && b != null && b < 0) return null;
  if (kind.startsWith("cool") && b != null && b > 5 && a != null && a >= 0) return null;
  return label;
}
