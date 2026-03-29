"use client";

import { useState } from "react";
import { RoomPreview } from "@/components/room-preview";
import { TrackedLink } from "@/components/tracked-link";

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

interface Pairing {
  name: string;
  description: string;
  trim: { hex: string; label: string; desc: string };
  accent: { hex: string; label: string; desc: string };
}

function generatePairings(hex: string): Pairing[] {
  const [h, s, l] = hexToHsl(hex);

  return [
    {
      name: "Classic",
      description: "Timeless pairing with clean white trim and a tonal accent wall",
      trim: {
        hex: "#FFFFFF",
        label: "Pure White",
        desc: "Crisp white trim for a clean, traditional look.",
      },
      accent: {
        hex: hslToHex(h + 30, Math.max(s * 0.6, 20), Math.min(l + 10, 60)),
        label: "Tonal Shift",
        desc: "A warm shift that adds depth without clashing.",
      },
    },
    {
      name: "Bold Contrast",
      description: "High-impact pairing with dark trim and a complementary accent",
      trim: {
        hex: hslToHex(h, Math.min(s * 0.3, 15), 20),
        label: "Dark Trim",
        desc: "Rich dark trim for a modern, dramatic frame.",
      },
      accent: {
        hex: hslToHex(h + 180, Math.max(s * 0.5, 25), Math.min(Math.max(l, 40), 55)),
        label: "Complementary",
        desc: "Opposite on the color wheel for maximum visual energy.",
      },
    },
    {
      name: "Warm Neutral",
      description: "Soft, inviting palette with warm-toned trim and an earthy accent",
      trim: {
        hex: hslToHex(35, 20, 90),
        label: "Warm Cream",
        desc: "A creamy warm tone that softens transitions.",
      },
      accent: {
        hex: hslToHex(Math.max(h - 15, 0), Math.max(s * 0.4, 15), Math.min(l + 15, 65)),
        label: "Earthy Tone",
        desc: "An analogous shift toward warmth and comfort.",
      },
    },
    {
      name: "Cool Modern",
      description: "Sleek palette with cool gray trim and a muted complementary accent",
      trim: {
        hex: hslToHex(210, 8, 85),
        label: "Cool Gray",
        desc: "Contemporary gray trim with a subtle blue undertone.",
      },
      accent: {
        hex: hslToHex(h + 150, Math.max(s * 0.35, 15), Math.min(Math.max(l, 35), 50)),
        label: "Split Complement",
        desc: "A sophisticated offset that feels curated, not random.",
      },
    },
  ];
}

interface PairingSelectorProps {
  colorHex: string;
  colorName: string;
}

export function PairingSelector({ colorHex, colorName }: PairingSelectorProps) {
  const pairings = generatePairings(colorHex);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = pairings[activeIndex];
  const vizUrl = `/tools/room-visualizer?walls=${colorHex.slice(1)}&trim=${active.trim.hex.slice(1)}&accent=${active.accent.hex.slice(1)}`;

  return (
    <section className="bg-tertiary-fixed py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="inline-block px-4 py-1 bg-on-secondary-container/10 text-on-surface text-[10px] font-bold uppercase tracking-widest rounded-full mb-6">
            Recommended Pairings
          </span>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
            Colors That Work With {colorName}
          </h2>
        </div>

        {/* Pairing tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {pairings.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setActiveIndex(i)}
              className={`px-4 py-2 rounded-full text-sm font-headline font-bold transition-all ${
                i === activeIndex
                  ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                  : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-low"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <p className="text-sm text-on-surface-variant mb-8">{active.description}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Room visualization */}
          <div>
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-lg border-[8px] border-surface-container-lowest">
              <RoomPreview
                wallColor={colorHex}
                trimColor={active.trim.hex}
                accentColor={active.accent.hex}
                className="w-full"
              />
            </div>
          </div>

          {/* Pairing swatches */}
          <div className="space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-lg shrink-0 border border-outline-variant/10" style={{ backgroundColor: colorHex }} />
                <div>
                  <p className="text-[10px] uppercase text-outline font-bold tracking-widest">Side Walls</p>
                  <h4 className="font-headline font-bold text-on-surface">{colorName}</h4>
                </div>
              </div>
              <p className="text-[10px] text-outline">{colorHex.toUpperCase()}</p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-lg shrink-0 border border-outline-variant/10" style={{ backgroundColor: active.accent.hex }} />
                <div>
                  <p className="text-[10px] uppercase text-outline font-bold tracking-widest">Accent Wall</p>
                  <h4 className="font-headline font-bold text-on-surface">{active.accent.label}</h4>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant">{active.accent.desc}</p>
              <p className="text-[10px] text-outline mt-1">{active.accent.hex.toUpperCase()}</p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-lg shrink-0 border border-outline-variant/10" style={{ backgroundColor: active.trim.hex }} />
                <div>
                  <p className="text-[10px] uppercase text-outline font-bold tracking-widest">Trim &amp; Molding</p>
                  <h4 className="font-headline font-bold text-on-surface">{active.trim.label}</h4>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant">{active.trim.desc}</p>
              <p className="text-[10px] text-outline mt-1">{active.trim.hex.toUpperCase()}</p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <TrackedLink
                href={vizUrl}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-xl font-headline font-bold text-sm shadow-lg shadow-primary/20 text-center"
                eventName="cta_click"
                eventParams={{ cta_label: "visualize_pairings", color_name: colorName }}
              >
                Customize in Room Visualizer
              </TrackedLink>
              <TrackedLink
                href={`/tools/palette-generator?hex=${encodeURIComponent(colorHex)}`}
                className="inline-flex items-center justify-center gap-2 border-b-2 border-primary text-primary font-headline font-bold text-sm py-2 hover:gap-3 transition-all"
                eventName="cta_click"
                eventParams={{ cta_label: "full_palette", color_name: colorName }}
              >
                Explore full palette <span>&rarr;</span>
              </TrackedLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
