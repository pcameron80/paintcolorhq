"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AddPaletteToProject } from "@/components/add-palette-to-project";

// --- Color utilities (copied from curated-palettes.tsx for client-side use) ---

type PaletteRole = "Walls" | "Trim" | "Accent" | "Pop";
const ROLES: PaletteRole[] = ["Walls", "Trim", "Accent", "Pop"];

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

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function determineRole(hex: string): PaletteRole {
  const [, s, l] = hexToHsl(hex);
  if (l > 92) return "Trim";
  if (l > 65) return "Walls";
  if (s > 50 && l >= 30 && l <= 70) return "Pop";
  return "Accent";
}

// --- Palette templates ---

interface PaletteTemplate {
  name: string;
  description: string;
  generate: (h: number, s: number, l: number, role: PaletteRole) => string;
}

const templates: PaletteTemplate[] = [
  {
    name: "Warm & Inviting",
    description: "Warm tones with cozy appeal — welcoming and comfortable",
    generate: (h, s, _l, role) => {
      const warmHue = h + (((30 - h + 540) % 360) - 180) * 0.4;
      switch (role) {
        case "Walls":
          return hslToHex(warmHue, clamp(s * 0.3, 8, 20), 83);
        case "Trim":
          return hslToHex(warmHue, clamp(s * 0.1, 3, 10), 96);
        case "Accent":
          return hslToHex(warmHue + 15, clamp(s * 0.5, 15, 35), 37);
        case "Pop":
          return hslToHex(warmHue - 10, clamp(s * 0.8 + 20, 40, 65), 52);
      }
    },
  },
  {
    name: "Cool & Calm",
    description: "Cool hues with soft contrast — serene and restful",
    generate: (h, s, _l, role) => {
      const coolHue = h + (((210 - h + 540) % 360) - 180) * 0.4;
      switch (role) {
        case "Walls":
          return hslToHex(coolHue, clamp(s * 0.25, 8, 18), 85);
        case "Trim":
          return hslToHex(coolHue, clamp(s * 0.08, 2, 8), 97);
        case "Accent":
          return hslToHex(coolHue + 20, clamp(s * 0.5, 15, 30), 40);
        case "Pop":
          return hslToHex(coolHue + 150, clamp(s * 0.6 + 15, 35, 55), 55);
      }
    },
  },
  {
    name: "Bold Contrast",
    description: "Complementary hues with punch — dynamic and striking",
    generate: (h, s, _l, role) => {
      const compHue = h + 180;
      switch (role) {
        case "Walls":
          return hslToHex(h, clamp(s * 0.2, 5, 15), 86);
        case "Trim":
          return hslToHex(h, clamp(s * 0.05, 2, 6), 97);
        case "Accent":
          return hslToHex(compHue - 30, clamp(s * 0.7, 25, 50), 36);
        case "Pop":
          return hslToHex(compHue, clamp(s * 0.9 + 20, 50, 75), 50);
      }
    },
  },
  {
    name: "Analogous Harmony",
    description: "Neighboring hues for a smooth, cohesive feel",
    generate: (h, s, _l, role) => {
      switch (role) {
        case "Walls":
          return hslToHex(h + 30, clamp(s * 0.25, 8, 18), 84);
        case "Trim":
          return hslToHex(h + 30, clamp(s * 0.08, 2, 8), 96);
        case "Accent":
          return hslToHex(h - 30, clamp(s * 0.55, 15, 40), 38);
        case "Pop":
          return hslToHex(h + 60, clamp(s * 0.7 + 10, 35, 60), 53);
      }
    },
  },
  {
    name: "Earthy Naturals",
    description: "Grounded earth tones — organic and timeless",
    generate: (h, _s, _l, role) => {
      const earthHue = h + (((35 - h + 540) % 360) - 180) * 0.6;
      switch (role) {
        case "Walls":
          return hslToHex(earthHue, 18, 82);
        case "Trim":
          return hslToHex(earthHue + 5, 10, 95);
        case "Accent":
          return hslToHex(earthHue + 140, 22, 34);
        case "Pop":
          return hslToHex(earthHue + 10, 52, 50);
      }
    },
  },
];

// --- Types ---

interface PaletteColor {
  hex: string;
  role: PaletteRole;
  isViewedColor: boolean;
}

interface GeneratedPalette {
  name: string;
  description: string;
  colors: PaletteColor[];
}

interface MatchResult {
  id: string;
  name: string;
  hex: string;
  brandName: string;
  brandSlug: string;
  colorSlug: string;
  deltaE: number;
}

// --- Palette generation ---

function generatePalettes(hex: string): GeneratedPalette[] {
  const [h, s, l] = hexToHsl(hex);
  const viewedRole = determineRole(hex);

  return templates.map((t) => ({
    name: t.name,
    description: t.description,
    colors: ROLES.map((role) =>
      role === viewedRole
        ? { hex, role, isViewedColor: true }
        : { hex: t.generate(h, s, l, role), role, isViewedColor: false }
    ),
  }));
}

// --- Brand list ---

const BRANDS = [
  { name: "All Brands", slug: "" },
  { name: "Sherwin-Williams", slug: "sherwin-williams" },
  { name: "Benjamin Moore", slug: "benjamin-moore" },
  { name: "Behr", slug: "behr" },
  { name: "PPG", slug: "ppg" },
  { name: "Dunn-Edwards", slug: "dunn-edwards" },
  { name: "Valspar", slug: "valspar" },
  { name: "Pratt & Lambert", slug: "pratt-lambert" },
  { name: "California Paints", slug: "california-paints" },
  { name: "Farrow & Ball", slug: "farrow-ball" },
  { name: "Dulux", slug: "dulux" },
  { name: "Clark+Kensington", slug: "clark-kensington" },
  { name: "Olympic", slug: "olympic" },
  { name: "Dutch Boy", slug: "dutch-boy" },
];

// --- Component ---

export function PaletteGenerator() {
  const searchParams = useSearchParams();
  const initialHex = (() => {
    const param = searchParams.get("hex");
    if (param && /^#?[0-9a-fA-F]{6}$/.test(param)) {
      return param.startsWith("#") ? param : `#${param}`;
    }
    return "#5B8C5A";
  })();

  const [inputHex, setInputHex] = useState(initialHex);
  const [hexText, setHexText] = useState(initialHex);
  const [brandFilter, setBrandFilter] = useState("");
  const [palettes, setPalettes] = useState<GeneratedPalette[]>([]);
  const [matches, setMatches] = useState<Map<string, MatchResult | null>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);

  const fetchMatches = useCallback(
    async (generatedPalettes: GeneratedPalette[], brand: string) => {
      const uniqueHexes = new Set<string>();
      for (const p of generatedPalettes) {
        for (const c of p.colors) {
          uniqueHexes.add(c.hex);
        }
      }

      setLoading(true);
      try {
        const entries = [...uniqueHexes];
        const results = await Promise.all(
          entries.map(async (hex) => {
            const params = new URLSearchParams({ hex: hex.replace("#", "") });
            if (brand) params.set("brand", brand);
            const res = await fetch(`/api/color-match?${params}`);
            const data = await res.json();
            const top = data.matches?.[0] ?? null;
            return [hex, top] as [string, MatchResult | null];
          })
        );
        setMatches(new Map(results));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Generate on mount
  useEffect(() => {
    const p = generatePalettes(inputHex);
    setPalettes(p);
    fetchMatches(p, brandFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGenerate() {
    const p = generatePalettes(inputHex);
    setPalettes(p);
    fetchMatches(p, brandFilter);
  }

  function handleColorChange(hex: string) {
    setInputHex(hex);
    setHexText(hex);
  }

  function handleHexTextChange(value: string) {
    setHexText(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      setInputHex(value);
    }
  }

  function roomVisualizerUrl(palette: GeneratedPalette): string {
    const wallsColor = palette.colors.find((c) => c.role === "Walls");
    const trimColor = palette.colors.find((c) => c.role === "Trim");
    const accentColor = palette.colors.find((c) => c.role === "Accent");
    const popColor = palette.colors.find((c) => c.role === "Pop");

    const resolve = (c: PaletteColor | undefined) =>
      c ? (matches.get(c.hex)?.hex ?? c.hex) : "";

    const wallsHex = resolve(wallsColor);
    const trimHex = resolve(trimColor);
    const accentHex = resolve(accentColor);
    const popHex = resolve(popColor);

    const params = new URLSearchParams();
    if (wallsHex) params.set("walls", wallsHex.replace("#", ""));
    if (trimHex) params.set("trim", trimHex.replace("#", ""));
    if (accentHex) params.set("accent", accentHex.replace("#", ""));
    if (popHex) params.set("pop", popHex.replace("#", ""));

    return `/tools/room-visualizer?${params}`;
  }

  return (
    <div className="mt-8">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Starting Color
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={inputHex}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-gray-300"
            />
            <input
              type="text"
              value={hexText}
              onChange={(e) => handleHexTextChange(e.target.value)}
              placeholder="#5B8C5A"
              className="h-10 w-28 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-brand-blue focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Brand Filter
          </label>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="mt-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-brand-blue focus:outline-none"
          >
            {BRANDS.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="h-10 rounded-lg bg-gray-900 px-6 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Matching..." : "Generate"}
        </button>
      </div>

      {/* Palettes grid */}
      {palettes.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {palettes.map((palette) => (
            <div
              key={palette.name}
              className="rounded-xl border border-gray-200 p-5"
            >
              <h3 className="font-semibold text-gray-900">{palette.name}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {palette.description}
              </p>

              <div className="mt-4 flex gap-2">
                {palette.colors.map((color, i) => {
                  const match = matches.get(color.hex);
                  const displayHex = match?.hex ?? color.hex;

                  return (
                    <div key={i} className="min-w-0 flex-1">
                      {match ? (
                        <Link
                          href={`/colors/${match.brandSlug}/${match.colorSlug}`}
                          className="group block"
                        >
                          <div
                            className={`aspect-square w-full rounded-lg border transition-shadow group-hover:shadow-md ${
                              color.isViewedColor
                                ? "border-2 border-gray-900 ring-2 ring-gray-900/10"
                                : "border-gray-200"
                            }`}
                            style={{ backgroundColor: displayHex }}
                          />
                        </Link>
                      ) : (
                        <div
                          className={`aspect-square w-full rounded-lg border ${
                            color.isViewedColor
                              ? "border-2 border-gray-900 ring-2 ring-gray-900/10"
                              : "border-gray-200"
                          }`}
                          style={{ backgroundColor: displayHex }}
                        />
                      )}
                      <p className="mt-1.5 text-center text-[10px] font-medium text-gray-400">
                        {color.role}
                      </p>
                      {loading ? (
                        <p className="truncate text-center text-[10px] text-gray-300">
                          ...
                        </p>
                      ) : match ? (
                        <>
                          <p className="truncate text-center text-[10px] text-gray-500">
                            {match.name}
                          </p>
                          <p className="truncate text-center text-[10px] text-gray-400">
                            {match.brandName}
                          </p>
                        </>
                      ) : (
                        <p className="truncate text-center text-[10px] text-gray-300">
                          No match
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={roomVisualizerUrl(palette)}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-terra px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-terra-dark"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                  </svg>
                  Visualize
                </Link>
                <AddPaletteToProject
                  colors={palette.colors
                    .filter((c) => matches.get(c.hex))
                    .map((c) => ({
                      colorId: matches.get(c.hex)!.id,
                      role: c.role.toLowerCase(),
                    }))}
                  currentPath="/tools/palette-generator"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
