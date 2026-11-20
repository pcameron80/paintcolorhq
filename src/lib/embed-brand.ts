// Brand-preset embed helpers. Pure module so the snippet text and the credit
// line are unit-testable and shared by the widget and the /embed page.

export const EMBED_SITE = "https://www.paintcolorhq.com";

export interface EmbedBrand {
  slug: string;
  name: string;
}

export function brandCreditText(brandName: string): string {
  return `Find any color in ${brandName} paint, by PaintColorHQ`;
}

export function brandUrl(slug: string): string {
  return `${EMBED_SITE}/brands/${slug}`;
}

// Per-brand copy-paste snippet. The credit paragraph sits OUTSIDE the iframe
// and carries no rel attribute, so it is a followed link on the host page.
export function brandEmbedSnippet(brand: EmbedBrand): string {
  return `<iframe src="${EMBED_SITE}/embed/match?brand=${brand.slug}"
  width="100%" height="480" loading="lazy"
  style="border:0;border-radius:12px;max-width:600px"
  title="${brand.name} paint color matcher"></iframe>
<p style="font:13px/1.4 sans-serif;color:#666">
  <a href="${brandUrl(brand.slug)}">${brandCreditText(brand.name)}</a></p>`;
}

// Pull the preset brand out of ?brand=, keeping it only when it is a known slug.
export function resolveEmbedBrand(
  raw: string | string[] | undefined,
  brands: EmbedBrand[],
): EmbedBrand | null {
  const slug = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();
  if (!slug) return null;
  return brands.find((b) => b.slug === slug) ?? null;
}

// Brand-first ordering: the preset brand's match on top, the other brands after.
export function brandFirst<T extends { brandSlug: string }>(rows: T[], brand: string, first?: T): T[] {
  const head = first ?? rows.find((r) => r.brandSlug === brand);
  if (!head) return rows;
  return [head, ...rows.filter((r) => r !== head && r.brandSlug !== brand)];
}
