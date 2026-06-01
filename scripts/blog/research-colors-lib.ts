/** Pure helpers for the blog research step. No I/O — unit-tested with fixtures. */

export interface ColorRef {
  brandSlug: string;
  colorSlug: string;
}

/** Parse "benjamin-moore/hale-navy-hc-154" → {brandSlug, colorSlug}.
 *  Brand and color slugs never contain "/", so split on the first slash. */
export function parseColorRef(raw: string): ColorRef {
  const trimmed = raw.trim();
  const i = trimmed.indexOf("/");
  if (i <= 0 || i === trimmed.length - 1) {
    throw new Error(`Invalid color ref "${raw}" — expected "brand-slug/color-slug"`);
  }
  return { brandSlug: trimmed.slice(0, i), colorSlug: trimmed.slice(i + 1) };
}

export interface MatchRow {
  brandName: string;
  brandSlug: string;
  name: string;
  slug: string;
  hex: string;
  deltaE: number;
}

interface RawMatch {
  delta_e_score: number;
  match_color: { name: string; slug: string; hex: string; brand: { name: string; slug: string } } | null;
}

/** From a color's cross-brand matches, pick the single closest match in each OTHER
 *  brand (excludes the source brand). Returns sorted by brand name ascending. */
export function bestMatchPerBrand(matches: RawMatch[], sourceBrandSlug: string): MatchRow[] {
  const best = new Map<string, MatchRow>();
  for (const m of matches) {
    const mc = m.match_color;
    if (!mc?.brand || mc.brand.slug === sourceBrandSlug) continue;
    const existing = best.get(mc.brand.slug);
    if (!existing || m.delta_e_score < existing.deltaE) {
      best.set(mc.brand.slug, {
        brandName: mc.brand.name,
        brandSlug: mc.brand.slug,
        name: mc.name,
        slug: mc.slug,
        hex: mc.hex,
        deltaE: m.delta_e_score,
      });
    }
  }
  return [...best.values()].sort((a, b) => a.brandName.localeCompare(b.brandName));
}

export interface ResearchColor {
  brandName: string;
  brandSlug: string;
  name: string;
  colorSlug: string;
  colorNumber: string | null;
  hex: string;
  lrv: number | null;
  undertone: string | null;
  family: string | null;
  matches: MatchRow[];
}

/** Render the verified research brief as markdown — the ground truth for drafting
 *  (Stage 1) and fact-verification (Stage 3). */
export function formatResearchMarkdown(topic: string, colors: ResearchColor[], generatedOn?: string): string {
  const lines: string[] = [];
  lines.push(`# Research: ${topic}`);
  lines.push("");
  lines.push(
    `> Verified from the PaintColorHQ database${generatedOn ? ` on ${generatedOn}` : ""}. ` +
      `Every hex, LRV, undertone, and cross-brand match below is first-party data. ` +
      `Cite these values exactly; do not invent or round them.`,
  );
  lines.push("");
  for (const c of colors) {
    const num = c.colorNumber ? ` (${c.colorNumber})` : "";
    lines.push(`## ${c.name} — ${c.brandName}${num}`);
    lines.push(
      `- Hex: ${c.hex} | LRV: ${c.lrv ?? "n/a"} | Undertone: ${c.undertone ?? "n/a"} | Family: ${c.family ?? "n/a"}`,
    );
    lines.push(`- URL: /colors/${c.brandSlug}/${c.colorSlug}`);
    if (c.matches.length > 0) {
      lines.push("");
      lines.push("| Closest match in | Color | Hex | Delta E |");
      lines.push("|---|---|---|---|");
      for (const m of c.matches) {
        lines.push(`| ${m.brandName} | ${m.name} | ${m.hex} | ${m.deltaE.toFixed(1)} |`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}
