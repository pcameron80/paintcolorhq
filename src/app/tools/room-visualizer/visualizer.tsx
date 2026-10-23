"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { trackToolEngagement } from "@/lib/analytics";
import { ROOMS, type Surface } from "@/lib/rooms";
import { RoomCanvas } from "@/components/room-canvas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RegionId = "walls" | "accentWall" | "trim" | "windows";

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

const REGIONS: { id: RegionId; label: string; surface: Surface }[] = [
  { id: "walls", label: "Main", surface: "main" },
  { id: "accentWall", label: "Accent", surface: "accent" },
  { id: "trim", label: "Trim", surface: "trim" },
  { id: "windows", label: "Windows", surface: "window" },
];

const SURFACE_TO_REGION: Record<Surface, RegionId> = {
  main: "walls",
  accent: "accentWall",
  trim: "trim",
  window: "windows",
};

const DEFAULT_COLORS: Record<RegionId, string> = {
  walls: "#D6D0C4",
  accentWall: "#5B7FA5",
  trim: "#FFFFFF",
  windows: "#F4F3EF",
};

/** Regions where pop colors can be tried */
const POP_REGIONS: RegionId[] = ["walls", "accentWall"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RoomVisualizerProps {
  initialColors?: Partial<Record<RegionId, string>>;
  /** Extra color options per region (for toggling between alternatives) */
  colorOptions?: Partial<Record<RegionId, string[]>>;
  /** Pop colors shown as a separate section on walls/accent wall */
  popColors?: string[];
  /** Room to open on (e.g. passed from a color page's preview) */
  initialRoomId?: string;
}

export function RoomVisualizer({ initialColors, colorOptions, popColors, initialRoomId }: RoomVisualizerProps) {
  const merged = initialColors
    ? { ...DEFAULT_COLORS, ...initialColors }
    : DEFAULT_COLORS;
  const [colors, setColors] = useState(merged);
  const [selected, setSelected] = useState<RegionId>("walls");
  const [roomIdx, setRoomIdx] = useState(() => Math.max(0, ROOMS.findIndex((r) => r.id === initialRoomId)));
  const [hexInput, setHexInput] = useState(merged.walls.replace("#", ""));
  const [matches, setMatches] = useState<PaintMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const room = ROOMS[roomIdx];
  // Rooms only offer the surfaces they have (not every room has paintable windows).
  const regions = REGIONS.filter((r) => room.masks[r.surface]);
  const surfaceColors = useMemo(
    () => ({ main: colors.walls, accent: colors.accentWall, trim: colors.trim, window: colors.windows }),
    [colors],
  );

  useEffect(() => {
    trackToolEngagement("room-visualizer", "open");
  }, []);

  const selectRegion = (id: RegionId) => {
    setSelected(id);
    setHexInput(colors[id].replace("#", ""));
    setMatches([]);
  };

  const changeRoom = (idx: number) => {
    setRoomIdx(idx);
    const next = ROOMS[idx];
    if (!REGIONS.some((r) => r.id === selected && next.masks[r.surface])) selectRegion("walls");
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

  // Load real paint matches whenever the color settles, so every color a
  // visitor tries comes with named paints to open. Before this, matches only
  // appeared after the button, and most visitors left after one page.
  useEffect(() => {
    if (hexInput.length !== 6) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/color-match?hex=${hexInput}`, { signal: controller.signal });
        const data = await res.json();
        setMatches(data.matches ?? []);
      } catch {
        // Aborted by a newer color, or offline: keep the current list.
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [hexInput]);

  const resetColors = () => {
    setColors(DEFAULT_COLORS);
    setHexInput(DEFAULT_COLORS[selected].replace("#", ""));
    setMatches([]);
  };

  return (
    <div className="mt-8">
      {/* ---- Room picker ---- */}
      {ROOMS.length > 1 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Choose a room</p>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {ROOMS.map((r, idx) => (
              <button
                key={r.id}
                type="button"
                onClick={() => changeRoom(idx)}
                aria-pressed={roomIdx === idx}
                className={`w-36 shrink-0 overflow-hidden rounded-xl border-2 text-left transition-all ${
                  roomIdx === idx
                    ? "border-primary shadow-sm"
                    : "border-transparent hover:border-outline-variant"
                }`}
              >
                <Image
                  src={r.image}
                  alt=""
                  width={288}
                  height={161}
                  sizes="144px"
                  className="block h-auto w-full"
                />
                <span className="block bg-surface-container-low px-2 py-1.5 text-xs font-semibold text-on-surface">
                  {r.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Room photo + paint overlay ---- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
        <p aria-live="polite" className="text-sm"><strong>Editing: {REGIONS.find(r => r.id === selected)?.label}</strong><span className="block mt-1">Digital color: {colors[selected].toUpperCase()}</span></p>
        <button type="button" onClick={resetColors} className="rounded-xl bg-primary text-on-primary px-4 py-3 font-semibold">Reset all colors</button>
        <p className="w-full text-xs text-on-surface-variant">Digital room preview only. Lighting, screens, and paint finish affect appearance. Confirm your choice with a physical sample.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container">
        <RoomCanvas
          room={room}
          colors={surfaceColors}
          onSelectSurface={(s) => selectRegion(SURFACE_TO_REGION[s])}
          priority={roomIdx === 0}
        />
      </div>

      {/* ---- Controls ---- */}
      <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 sm:p-8">
        {/* Region selector */}
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Select Region</p>
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <button
              key={r.id}
              aria-pressed={selected === r.id}
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
            Wall regions (Main + Accent) share one pooled set — Main, Accent,
            and Pop are all applicable to either wall. Trim and windows keep
            their own colors so wall swatches can't overwrite them. */}
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
            // Main + Accent are both available to both walls.
            push(merged.walls, "Main");
            push(merged.accentWall, "Accent");
            (colorOptions?.walls ?? []).forEach((h) => push(h, "Main"));
            (colorOptions?.accentWall ?? []).forEach((h) => push(h, "Accent"));
          } else {
            // Trim or windows: only that region's own color(s).
            const label = REGIONS.find((r) => r.id === selected)?.label ?? "";
            push(merged[selected], label);
            (colorOptions?.[selected] ?? []).forEach((h) => push(h, label));
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
