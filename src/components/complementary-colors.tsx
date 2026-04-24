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
  colorName,
}: {
  hex: string;
  harmonies: ResolvedHarmony[];
  colorName?: string;
}) {
  const [active, setActive] = useState(0);
  const [prevHex, setPrevHex] = useState(hex);
  if (hex !== prevHex) {
    setPrevHex(hex);
    setActive(0);
  }

  return (
    <section>
      <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
        {colorName ? `Color Palettes for ${colorName}` : "Suggested Color Palettes"}
      </h2>
      <p className="mt-2 text-sm text-on-surface-variant">
        Color harmonies based on color theory — each swatch links to the closest matching paint.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {harmonies.map((harmony, i) => (
          <button
            key={harmony.name}
            onClick={() => setActive(i)}
            className={`rounded-full px-4 py-2 text-sm font-headline font-bold transition-all ${
              active === i
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest text-on-surface-variant hover:text-primary border border-outline-variant/10"
            }`}
          >
            {harmony.name}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-sm text-on-surface-variant">{harmonies[active].description}</p>
        <div className="mt-4 flex gap-4">
          {harmonies[active].colors.map((color, i) => {
            const href =
              color.matchBrandSlug && color.matchColorSlug
                ? `/colors/${color.matchBrandSlug}/${color.matchColorSlug}`
                : `/search?q=${encodeURIComponent(color.paletteHex)}`;
            return (
              <Link key={i} href={href} className="group flex-1">
                <div
                  className="aspect-square w-full rounded-xl border border-outline-variant/10 transition-shadow group-hover:shadow-md"
                  style={{ backgroundColor: color.matchHex }}
                />
                <p className="mt-2 text-center text-xs font-medium text-outline">
                  {color.label}
                </p>
                {color.matchName ? (
                  <p className="truncate text-center text-xs text-on-surface-variant group-hover:text-primary flex items-center justify-center gap-1">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color.matchHex }}
                    />
                    {color.matchName}
                  </p>
                ) : (
                  <p className="text-center font-mono text-xs text-outline group-hover:text-primary">
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
