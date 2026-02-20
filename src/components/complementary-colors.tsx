"use client";

import { useState } from "react";
import Link from "next/link";

interface ResolvedHarmonyColor {
  label: string;
  paletteHex: string;
  matchHex: string;
  matchName: string | null;
  matchBrandSlug: string | null;
  matchColorSlug: string | null;
}

interface ResolvedHarmony {
  name: string;
  description: string;
  colors: ResolvedHarmonyColor[];
}

export function ComplementaryColors({
  hex,
  harmonies,
}: {
  hex: string;
  harmonies: ResolvedHarmony[];
}) {
  const [active, setActive] = useState(0);
  const [prevHex, setPrevHex] = useState(hex);
  if (hex !== prevHex) {
    setPrevHex(hex);
    setActive(0);
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900">
        Suggested Color Palettes
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Color harmonies based on color theory — each swatch links to the closest
        matching paint.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {harmonies.map((harmony, i) => (
          <button
            key={harmony.name}
            onClick={() => setActive(i)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === i
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {harmony.name}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-600">{harmonies[active].description}</p>
        <div className="mt-4 flex gap-4">
          {harmonies[active].colors.map((color, i) => {
            const href =
              color.matchBrandSlug && color.matchColorSlug
                ? `/colors/${color.matchBrandSlug}/${color.matchColorSlug}`
                : `/search?q=${encodeURIComponent(color.paletteHex)}`;
            return (
              <Link key={i} href={href} className="group flex-1">
                <div
                  className="aspect-square w-full rounded-xl border border-gray-200 transition-shadow group-hover:shadow-md"
                  style={{ backgroundColor: color.matchHex }}
                />
                <p className="mt-2 text-center text-xs font-medium text-gray-500">
                  {color.label}
                </p>
                {color.matchName ? (
                  <p className="truncate text-center text-xs text-gray-400 group-hover:text-brand-blue">
                    {color.matchName}
                  </p>
                ) : (
                  <p className="text-center font-mono text-xs text-gray-400 group-hover:text-brand-blue">
                    {color.matchHex.toUpperCase()}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
