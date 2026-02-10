import Link from "next/link";
import { findClosestColor } from "@/lib/queries";
import type { ColorWithBrand } from "@/lib/types";

type PaletteRole = "Walls" | "Trim" | "Accent" | "Pop";
const ROLES: PaletteRole[] = ["Walls", "Trim", "Accent", "Pop"];

interface ResolvedColor {
  role: string;
  paletteHex: string;
  match: ColorWithBrand | null;
  isViewedColor: boolean;
}

interface ResolvedPalette {
  name: string;
  description: string;
  colors: ResolvedColor[];
}

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
    return Math.round(255 * color).toString(16).padStart(2, "0");
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
];

function generatePalettes(hex: string) {
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

export async function CuratedPalettes({ hex, brandId }: { hex: string; brandId: string }) {
  const palettes = generatePalettes(hex);

  // Collect all unique hex values that need resolving (skip the viewed color)
  const hexesToResolve = new Set<string>();
  for (const p of palettes) {
    for (const c of p.colors) {
      if (!c.isViewedColor) hexesToResolve.add(c.hex);
    }
  }

  // Resolve all companion colors within the same brand, plus the viewed color
  const resolveMap = new Map<string, ColorWithBrand | null>();
  const entries = [...hexesToResolve];
  const [viewedMatch, ...companionMatches] = await Promise.all([
    findClosestColor(hex, brandId),
    ...entries.map((h) => findClosestColor(h, brandId)),
  ]);
  resolveMap.set(hex, viewedMatch);
  entries.forEach((h, i) => resolveMap.set(h, companionMatches[i]));

  const resolved: ResolvedPalette[] = palettes.map((p) => ({
    name: p.name,
    description: p.description,
    colors: p.colors.map((c) => ({
      role: c.role,
      paletteHex: c.hex,
      match: resolveMap.get(c.hex) ?? null,
      isViewedColor: c.isViewedColor,
    })),
  }));

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900">Room Palettes</h2>
      <p className="mt-2 text-sm text-gray-500">
        Color schemes built around this color — each swatch links to the
        closest matching paint.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resolved.map((palette) => (
          <div
            key={palette.name}
            className="rounded-xl border border-gray-200 p-5"
          >
            <div className="flex gap-2">
              {palette.colors.map((color, i) => {
                if (color.isViewedColor) {
                  return (
                    <div key={i} className="min-w-0 flex-1">
                      <div
                        className="aspect-square w-full rounded-lg border-2 border-gray-900 ring-2 ring-gray-900/10"
                        style={{
                          backgroundColor:
                            color.match?.hex ?? color.paletteHex,
                        }}
                      />
                      <p className="mt-1.5 text-center text-[10px] font-bold text-gray-900">
                        {color.role}
                      </p>
                      <p className="truncate text-center text-[10px] font-medium text-gray-700">
                        This Color
                      </p>
                    </div>
                  );
                }
                const href = color.match
                  ? `/colors/${color.match.brand.slug}/${color.match.slug}`
                  : `/search?q=${encodeURIComponent(color.paletteHex)}`;
                return (
                  <Link key={i} href={href} className="group min-w-0 flex-1">
                    <div
                      className="aspect-square w-full rounded-lg border border-gray-200 transition-shadow group-hover:shadow-md"
                      style={{
                        backgroundColor:
                          color.match?.hex ?? color.paletteHex,
                      }}
                    />
                    <p className="mt-1.5 text-center text-[10px] font-medium text-gray-400">
                      {color.role}
                    </p>
                    {color.match && (
                      <p className="truncate text-center text-[10px] text-gray-500">
                        {color.match.name}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              {palette.name}
            </h3>
            <p className="mt-1 text-xs text-gray-500">{palette.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
