import Link from "next/link";
import { findClosestColor } from "@/lib/queries";
import type { ColorWithBrand } from "@/lib/types";

interface Palette {
  name: string;
  description: string;
  colors: { hex: string; role: string }[];
}

const palettes: Palette[] = [
  {
    name: "Modern Farmhouse",
    description: "Warm neutrals with earthy contrast — timeless and inviting",
    colors: [
      { hex: "#d6d0c4", role: "Walls" },
      { hex: "#f0ece2", role: "Trim" },
      { hex: "#4a4a48", role: "Accent" },
      { hex: "#7a8c6e", role: "Pop" },
    ],
  },
  {
    name: "Coastal Retreat",
    description: "Soft blues and sandy tones — calm and airy",
    colors: [
      { hex: "#d5e1df", role: "Walls" },
      { hex: "#f5f0e8", role: "Trim" },
      { hex: "#2b4c6f", role: "Accent" },
      { hex: "#c4a87c", role: "Pop" },
    ],
  },
  {
    name: "Moody Library",
    description: "Rich, saturated tones — dramatic and sophisticated",
    colors: [
      { hex: "#2f4538", role: "Walls" },
      { hex: "#f2ead3", role: "Trim" },
      { hex: "#6b2737", role: "Accent" },
      { hex: "#b8963e", role: "Pop" },
    ],
  },
  {
    name: "Scandinavian Minimal",
    description: "Clean whites with muted pastels — bright and serene",
    colors: [
      { hex: "#f4f1ec", role: "Walls" },
      { hex: "#ffffff", role: "Trim" },
      { hex: "#b0b8b4", role: "Accent" },
      { hex: "#d4c1a8", role: "Pop" },
    ],
  },
  {
    name: "Bold & Eclectic",
    description: "Unexpected pairings — playful and expressive",
    colors: [
      { hex: "#e8c547", role: "Walls" },
      { hex: "#f7f3ea", role: "Trim" },
      { hex: "#2d5a7b", role: "Accent" },
      { hex: "#c1533c", role: "Pop" },
    ],
  },
  {
    name: "Earthy Organic",
    description: "Grounded natural tones — warm and restorative",
    colors: [
      { hex: "#c4a882", role: "Walls" },
      { hex: "#efe8dd", role: "Trim" },
      { hex: "#6b4e37", role: "Accent" },
      { hex: "#8a9a5b", role: "Pop" },
    ],
  },
  {
    name: "Soft Romantic",
    description: "Blush and dusty tones — elegant and gentle",
    colors: [
      { hex: "#e8d5d0", role: "Walls" },
      { hex: "#faf6f3", role: "Trim" },
      { hex: "#9b7e8a", role: "Accent" },
      { hex: "#c4956a", role: "Pop" },
    ],
  },
  {
    name: "Urban Industrial",
    description: "Grays and charcoals with warmth — edgy and modern",
    colors: [
      { hex: "#6d6e70", role: "Walls" },
      { hex: "#e8e4de", role: "Trim" },
      { hex: "#3c3c3c", role: "Accent" },
      { hex: "#b87333", role: "Pop" },
    ],
  },
  {
    name: "Mediterranean Sun",
    description: "Warm terracotta and ocean blues — vibrant and welcoming",
    colors: [
      { hex: "#f5e6d3", role: "Walls" },
      { hex: "#fefcf7", role: "Trim" },
      { hex: "#c75c2a", role: "Accent" },
      { hex: "#2e6b8a", role: "Pop" },
    ],
  },
  {
    name: "Classic Traditional",
    description: "Navy and cream with heritage feel — refined and stately",
    colors: [
      { hex: "#2b3a52", role: "Walls" },
      { hex: "#f2ece0", role: "Trim" },
      { hex: "#8b2232", role: "Accent" },
      { hex: "#c5a55a", role: "Pop" },
    ],
  },
];

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

function colorDistance(hex1: string, hex2: string): number {
  const [h1, s1, l1] = hexToHsl(hex1);
  const [h2, s2, l2] = hexToHsl(hex2);
  const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)) / 180;
  const ds = (s1 - s2) / 100;
  const dl = (l1 - l2) / 100;
  return Math.sqrt(dh * dh + ds * ds + dl * dl);
}

function findRelevantPalettes(hex: string): Palette[] {
  const scored = palettes.map((palette) => {
    const minDist = Math.min(
      ...palette.colors.map((c) => colorDistance(hex, c.hex))
    );
    return { palette, score: minDist };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 3).map((s) => s.palette);
}

interface ResolvedColor {
  role: string;
  paletteHex: string;
  match: ColorWithBrand | null;
}

interface ResolvedPalette {
  name: string;
  description: string;
  colors: ResolvedColor[];
}

async function resolvePalette(palette: Palette): Promise<ResolvedPalette> {
  const colors = await Promise.all(
    palette.colors.map(async (c) => ({
      role: c.role,
      paletteHex: c.hex,
      match: await findClosestColor(c.hex),
    }))
  );
  return { name: palette.name, description: palette.description, colors };
}

export async function CuratedPalettes({ hex }: { hex: string }) {
  const relevant = findRelevantPalettes(hex);
  const resolved = await Promise.all(relevant.map(resolvePalette));

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900">Room Palettes</h2>
      <p className="mt-2 text-sm text-gray-500">
        Curated color schemes that work with this color — each swatch links to
        the closest matching paint.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resolved.map((palette) => (
          <div
            key={palette.name}
            className="rounded-xl border border-gray-200 p-5"
          >
            <div className="flex gap-2">
              {palette.colors.map((color, i) => {
                const href = color.match
                  ? `/colors/${color.match.brand.slug}/${color.match.slug}`
                  : `/search?q=${encodeURIComponent(color.paletteHex)}`;
                return (
                  <Link key={i} href={href} className="group flex-1">
                    <div
                      className="aspect-square w-full rounded-lg border border-gray-200 transition-shadow group-hover:shadow-md"
                      style={{ backgroundColor: color.match?.hex ?? color.paletteHex }}
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
