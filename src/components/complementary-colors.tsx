"use client";

import { useState } from "react";
import Link from "next/link";

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = s / 100;
  l = l / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

interface ColorHarmony {
  name: string;
  description: string;
  colors: { hex: string; label: string }[];
}

function getColorHarmonies(hex: string): ColorHarmony[] {
  const [h, s, l] = hexToHsl(hex);

  return [
    {
      name: "Complementary",
      description: "Opposite on the color wheel — creates vibrant contrast",
      colors: [
        { hex, label: "Base" },
        { hex: hslToHex(h + 180, s, l), label: "Complement" },
      ],
    },
    {
      name: "Analogous",
      description: "Adjacent colors — creates a harmonious, cohesive feel",
      colors: [
        { hex: hslToHex(h - 30, s, l), label: "Adjacent" },
        { hex, label: "Base" },
        { hex: hslToHex(h + 30, s, l), label: "Adjacent" },
      ],
    },
    {
      name: "Triadic",
      description: "Evenly spaced — balanced and colorful",
      colors: [
        { hex, label: "Base" },
        { hex: hslToHex(h + 120, s, l), label: "Triad" },
        { hex: hslToHex(h + 240, s, l), label: "Triad" },
      ],
    },
    {
      name: "Split Complementary",
      description: "Softer alternative to complementary — less tension, still dynamic",
      colors: [
        { hex, label: "Base" },
        { hex: hslToHex(h + 150, s, l), label: "Split" },
        { hex: hslToHex(h + 210, s, l), label: "Split" },
      ],
    },
  ];
}

export function ComplementaryColors({
  hex,
  searchBaseUrl,
}: {
  hex: string;
  searchBaseUrl: string;
}) {
  const harmonies = getColorHarmonies(hex);
  const [active, setActive] = useState(0);

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900">
        Suggested Color Palettes
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Color harmonies based on color theory — great starting points for room
        palettes.
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
          {harmonies[active].colors.map((color, i) => (
            <Link
              key={i}
              href={`${searchBaseUrl}?q=${encodeURIComponent(color.hex)}`}
              className="group flex-1"
            >
              <div
                className="aspect-square w-full rounded-xl border border-gray-200 transition-shadow group-hover:shadow-md"
                style={{ backgroundColor: color.hex }}
              />
              <p className="mt-2 text-center text-xs font-medium text-gray-500">
                {color.label}
              </p>
              <p className="text-center font-mono text-xs text-gray-400 group-hover:text-blue-600">
                {color.hex.toUpperCase()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
