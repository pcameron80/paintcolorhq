"use client";

import { useState } from "react";
import { CopySnippet } from "./copy-snippet";
import { brandEmbedSnippet, type EmbedBrand } from "@/lib/embed-brand";

// Brand picker for dealers and brands: choose a brand, copy a snippet whose
// widget shows that brand's match first and whose credit line links to the
// brand page. The credit paragraph is outside the iframe and has no rel.
export function BrandSnippet({ brands }: { brands: EmbedBrand[] }) {
  const [slug, setSlug] = useState(brands[0]?.slug ?? "");
  const brand = brands.find((b) => b.slug === slug) ?? brands[0];
  if (!brand) return null;

  return (
    <div>
      <label htmlFor="embed-brand" className="block text-sm font-semibold text-on-surface">
        Brand
      </label>
      <select
        id="embed-brand"
        value={brand.slug}
        onChange={(e) => setSlug(e.target.value)}
        className="mt-1 mb-4 w-full max-w-xs rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
      >
        {brands.map((b) => (
          <option key={b.slug} value={b.slug}>{b.name}</option>
        ))}
      </select>
      <CopySnippet code={brandEmbedSnippet(brand)} />
    </div>
  );
}
