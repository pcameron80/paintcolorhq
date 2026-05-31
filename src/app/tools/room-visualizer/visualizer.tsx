"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { trackToolEngagement } from "@/lib/analytics";
import { ROOMS, type RoomScene } from "@/lib/rooms";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RegionId = "walls" | "accentWall" | "trim";

interface PaintMatch {
  id: string;
  name: string;
  hex: string;
  brandName: string;
  brandSlug: string;
  colorSlug: string;
  colorNumber: string;
  deltaE: number;
}

// ---------------------------------------------------------------------------
// Region metadata
// ---------------------------------------------------------------------------

const REGIONS: { id: RegionId; label: string }[] = [
  { id: "walls", label: "Walls" },
  { id: "accentWall", label: "Accent Wall" },
  { id: "trim", label: "Trim" },
];

const DEFAULT_COLORS: Record<RegionId, string> = {
  walls: "#D6D0C4",
  accentWall: "#5B7FA5",
  trim: "#FFFFFF",
};

/** Regions where pop colors can be tried */
const POP_REGIONS: RegionId[] = ["walls", "accentWall"];

// ---------------------------------------------------------------------------
// Room rendering — real photo + paint overlay (see src/lib/rooms.ts)
// ---------------------------------------------------------------------------

interface RoomCanvasProps {
  room: RoomScene;
  colors: Record<RegionId, string>;
  onSelectRegion: (id: RegionId) => void;
}

/**
 * Renders the room photo with the chosen paint colors blended over the
 * traced wall/accent/trim regions, plus invisible click targets so each
 * region can be selected directly on the image.
 */
function RoomCanvas({ room, colors, onSelectRegion }: RoomCanvasProps) {
  const viewBox = `0 0 ${room.width} ${room.height}`;
  const regionPaths: Record<RegionId, string[]> = {
    walls: room.wall,
    accentWall: room.accent,
    trim: room.trim,
  };

  return (
    <div className="relative block w-full overflow-hidden">
      <Image
        src={room.image}
        alt={`${room.name} with applied paint colors`}
        width={room.width}
        height={Math.round(room.height)}
        sizes="(max-width: 768px) 100vw, 900px"
        className="block h-auto w-full"
        priority
      />

      {/* Multiply pass — grounds the color in the photo's shadows */}
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ mixBlendMode: "multiply" }}
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        {room.wall.map((p, i) => (
          <polygon key={`w${i}`} points={p} fill={colors.walls} opacity="0.55" />
        ))}
        {room.accent.map((p, i) => (
          <polygon key={`a${i}`} points={p} fill={colors.accentWall} opacity="0.55" />
        ))}
        {room.trim.map((p, i) => (
          <polygon key={`t${i}`} points={p} fill={colors.trim} opacity="0.45" />
        ))}
      </svg>

      {/* Soft-light pass — restores color richness on lit surfaces */}
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ mixBlendMode: "soft-light" }}
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        {room.wall.map((p, i) => (
          <polygon key={`ws${i}`} points={p} fill={colors.walls} opacity="0.35" />
        ))}
        {room.accent.map((p, i) => (
          <polygon key={`as${i}`} points={p} fill={colors.accentWall} opacity="0.35" />
        ))}
      </svg>

      {/* Invisible click targets — select a region by clicking the room */}
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {(Object.keys(regionPaths) as RegionId[]).map((id) =>
          regionPaths[id].map((p, i) => (
            <polygon
              key={`click-${id}-${i}`}
              points={p}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => onSelectRegion(id)}
            />
          )),
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RoomVisualizerProps {
  initialColors?: Partial<Record<RegionId, string>>;
  /** Extra color options per region (for toggling between alternatives) */
  colorOptions?: Partial<Record<RegionId, string[]>>;
  /** Pop colors shown as a separate section on walls/accent wall */
  popColors?: string[];
}

export function RoomVisualizer({ initialColors, colorOptions, popColors }: RoomVisualizerProps) {
  const merged = initialColors
    ? { ...DEFAULT_COLORS, ...initialColors }
    : DEFAULT_COLORS;
  const [colors, setColors] = useState(merged);
  const [selected, setSelected] = useState<RegionId>("walls");
  const [roomIdx, setRoomIdx] = useState(0);
  const [hexInput, setHexInput] = useState(merged.walls.replace("#", ""));
  const [matches, setMatches] = useState<PaintMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const room = ROOMS[roomIdx];

  useEffect(() => {
    trackToolEngagement("room-visualizer", "open");
  }, []);

  const selectRegion = (id: RegionId) => {
    setSelected(id);
    setHexInput(colors[id].replace("#", ""));
    setMatches([]);
  };

  const applyColor = (hex: string) => {
    const normalized = hex.startsWith("#") ? hex : `#${hex}`;
    setColors((prev) => ({ ...prev, [selected]: normalized }));
    setHexInput(normalized.replace("#", ""));
    trackToolEngagement("room-visualizer", "use", normalized);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyColor(e.target.value);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setHexInput(val);
    if (val.length === 6) {
      setColors((prev) => ({ ...prev, [selected]: `#${val}` }));
    }
  };

  const findMatches = async () => {
    if (hexInput.length !== 6) return;
    setLoading(true);
    trackToolEngagement("room-visualizer", "complete", hexInput);
    try {
      const res = await fetch(`/api/color-match?hex=${hexInput}`);
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch {
      setMatches([]);
    }
    setLoading(false);
  };

  const resetColors = () => {
    setColors(DEFAULT_COLORS);
    setHexInput(DEFAULT_COLORS[selected].replace("#", ""));
    setMatches([]);
  };

  return (
    <div className="mt-8">
      {/* ---- Room switcher (shown once more than one room exists) ---- */}
      {ROOMS.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {ROOMS.map((r, idx) => (
            <button
              key={r.id}
              onClick={() => setRoomIdx(idx)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                roomIdx === idx
                  ? "border-primary bg-primary-fixed text-on-primary-fixed shadow-sm"
                  : "border-outline-variant/30 text-on-surface-variant hover:border-outline hover:bg-surface-container-low"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* ---- Room photo + paint overlay ---- */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container">
        <RoomCanvas room={room} colors={colors} onSelectRegion={selectRegion} />
      </div>

      {/* ---- Controls ---- */}
      <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 sm:p-8">
        {/* Region selector */}
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Select Region</p>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => selectRegion(r.id)}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                selected === r.id
                  ? "border-primary bg-primary-fixed text-on-primary-fixed shadow-sm"
                  : "border-outline-variant/30 text-on-surface-variant hover:border-outline hover:bg-surface-container-low"
              }`}
            >
              <span
                className="inline-block h-5 w-5 rounded-md border border-outline-variant/40 shadow-sm"
                style={{ backgroundColor: colors[r.id] }}
              />
              {r.label}
            </button>
          ))}
          <button
            onClick={resetColors}
            className="ml-auto rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:border-outline hover:bg-surface-container-low transition-all"
          >
            Reset All
          </button>
        </div>

        {/* Swatch palette.
            Wall regions (Walls + Accent Wall) share one pooled set — Color,
            Accent, and Pop are all applicable to either wall. Trim is isolated
            to its own color so it can't be overwritten by wall swatches. */}
        {(() => {
          const norm = (h: string) => (h.startsWith("#") ? h : `#${h}`);
          const isWallRegion = POP_REGIONS.includes(selected);

          // Build the labeled swatch pool for the current region.
          const palette: { hex: string; label: string }[] = [];
          const seen = new Set<string>();
          const push = (hex: string, label: string) => {
            const n = norm(hex);
            const key = n.toUpperCase();
            if (seen.has(key)) return;
            seen.add(key);
            palette.push({ hex: n, label });
          };

          if (isWallRegion) {
            // Color + Accent are both available to both walls.
            push(merged.walls, "Color");
            push(merged.accentWall, "Accent");
            (colorOptions?.walls ?? []).forEach((h) => push(h, "Color"));
            (colorOptions?.accentWall ?? []).forEach((h) => push(h, "Accent"));
          } else {
            // Trim: only its own color(s).
            push(merged.trim, "Trim");
            (colorOptions?.trim ?? []).forEach((h) => push(h, "Trim"));
          }

          const pops = isWallRegion ? (popColors ?? []) : [];
          const showPalette = palette.length > 1;
          const showPop = pops.length > 0;
          if (!showPalette && !showPop) return null;

          return (
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              {/* Pooled palette swatches (apply to the selected region) */}
              {showPalette && (
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    {isWallRegion ? "Colors:" : "Palette options:"}
                  </span>
                  {palette.map(({ hex, label }) => {
                    const isActive =
                      colors[selected].toUpperCase() === hex.toUpperCase();
                    return (
                      <button
                        key={hex}
                        onClick={() => applyColor(hex)}
                        className={`h-9 w-9 rounded-lg border-2 transition-all ${
                          isActive
                            ? "scale-110 border-primary ring-2 ring-primary-fixed"
                            : "border-outline-variant/40 hover:scale-105 hover:border-outline"
                        }`}
                        style={{ backgroundColor: hex }}
                        title={`${label}: ${hex.toUpperCase()}`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Pop colors — also applicable to either wall */}
              {showPop && (
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-secondary">Pop:</span>
                  {pops.map((hex) => {
                    const n = norm(hex);
                    const isActive =
                      colors[selected].toUpperCase() === n.toUpperCase();
                    return (
                      <button
                        key={hex}
                        onClick={() => applyColor(n)}
                        className={`h-9 w-9 rounded-lg border-2 transition-all ${
                          isActive
                            ? "scale-110 border-secondary ring-2 ring-secondary-container"
                            : "border-outline-variant/40 hover:scale-105 hover:border-outline"
                        }`}
                        style={{ backgroundColor: n }}
                        title={`Pop: ${n.toUpperCase()}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Color picker */}
        <div className="mt-6 pt-5 border-t border-outline-variant/15">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
            {REGIONS.find((r) => r.id === selected)?.label} Color
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={colors[selected]}
              onChange={handlePickerChange}
              className="h-11 w-14 cursor-pointer rounded-xl border border-outline-variant/30"
            />
            <div className="flex items-center rounded-xl border border-outline-variant/30 bg-surface-container-low">
              <span className="pl-3 text-sm text-outline">#</span>
              <input
                type="text"
                value={hexInput}
                onChange={handleHexInput}
                maxLength={6}
                className="w-20 border-none bg-transparent px-1 py-2.5 text-sm font-mono text-on-surface outline-none"
                placeholder="D6D0C4"
              />
            </div>
            <div
              className="h-11 w-11 rounded-xl border border-outline-variant/30 shadow-sm"
              style={{ backgroundColor: colors[selected] }}
            />
            <button
              onClick={findMatches}
              disabled={loading || hexInput.length !== 6}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? "Searching..." : "Find Paint Match"}
            </button>
          </div>
        </div>

        {/* Paint matches */}
        {matches.length > 0 && (
          <div className="mt-6 pt-5 border-t border-outline-variant/15">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Closest Paint Colors
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low transition-shadow hover:shadow-md"
                >
                  <button
                    onClick={() => applyColor(m.hex)}
                    className="relative h-16 w-full"
                    style={{ backgroundColor: m.hex }}
                    title={`Apply ${m.name}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                      Apply
                    </span>
                  </button>
                  <div className="p-2.5">
                    <Link
                      href={`/colors/${m.brandSlug}/${m.colorSlug}`}
                      className="block text-xs font-semibold text-on-surface hover:text-primary"
                    >
                      {m.name}
                    </Link>
                    <p className="text-xs text-on-surface-variant">{m.brandName}</p>
                    <p className="text-xs font-mono text-outline">
                      {m.hex.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
