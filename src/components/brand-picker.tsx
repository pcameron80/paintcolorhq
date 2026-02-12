"use client";

import { useRouter } from "next/navigation";

interface Brand {
  slug: string;
  name: string;
}

export function BrandPicker({
  brands,
  currentBrand,
  slug,
}: {
  brands: Brand[];
  currentBrand: string | null;
  slug: string;
}) {
  const router = useRouter();

  return (
    <select
      value={currentBrand ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        const url = val
          ? `/inspiration/${slug}?brand=${val}`
          : `/inspiration/${slug}`;
        router.push(url);
      }}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none"
    >
      <option value="">Best Match</option>
      {brands.map((brand) => (
        <option key={brand.slug} value={brand.slug}>
          {brand.name}
        </option>
      ))}
    </select>
  );
}
