"use client";

import { useState } from "react";
import Link from "next/link";
import { MatchColorSearch } from "@/components/match-color-search";

interface HubBrand {
  slug: string;
  name: string;
}

/**
 * Picker for the /match hub: choose the brand you have a color from, the brand
 * you want to buy in, then search the source brand's colors. Reuses
 * MatchColorSearch (same /api/search lookup and routing as the brand-to-brand
 * listing pages), keyed on the brand pair so its state resets on change.
 */
export function MatchHubPicker({ brands }: { brands: HubBrand[] }) {
  const [sourceSlug, setSourceSlug] = useState("sherwin-williams");
  const [targetSlug, setTargetSlug] = useState("benjamin-moore");

  const source = brands.find((b) => b.slug === sourceSlug) ?? brands[0];
  const target = brands.find((b) => b.slug === targetSlug) ?? brands[1];
  const sameBrand = source.slug === target.slug;

  const selectClass =
    "w-full rounded-xl bg-surface-container-lowest px-4 py-3 text-on-surface shadow-sm border border-outline-variant/15 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="max-w-2xl rounded-2xl bg-surface-container-lowest border border-outline-variant/10 p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="hub-source-brand" className="block text-sm font-bold text-on-surface mb-2">
            I have a color from
          </label>
          <select id="hub-source-brand" value={sourceSlug} onChange={(e) => setSourceSlug(e.target.value)} className={selectClass}>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="hub-target-brand" className="block text-sm font-bold text-on-surface mb-2">
            I want the match in
          </label>
          <select id="hub-target-brand" value={targetSlug} onChange={(e) => setTargetSlug(e.target.value)} className={selectClass}>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {sameBrand ? (
        <p className="mt-6 text-sm text-on-surface-variant">Pick two different brands to see matches.</p>
      ) : (
        <>
          <MatchColorSearch
            key={`${source.slug}-${target.slug}`}
            sourceBrandSlug={source.slug}
            targetBrandSlug={target.slug}
            sourceBrandName={source.name}
            targetBrandName={target.name}
          />
          <p className="mt-4 text-sm text-outline">
            Or browse{" "}
            <Link href={`/match/${source.slug}/to/${target.slug}`} className="text-primary hover:underline underline-offset-4">
              all {source.name} to {target.name} matches
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
