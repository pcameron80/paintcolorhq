"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RegionId = "walls" | "accentWall" | "trim" | "floor";

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
  { id: "floor", label: "Floor" },
];

const DEFAULT_COLORS: Record<RegionId, string> = {
  walls: "#D6D0C4",
  accentWall: "#5B7FA5",
  trim: "#FFFFFF",
  floor: "#9E8B76",
};

// ---------------------------------------------------------------------------
// SVG path data (extracted from room.svg clip paths)
// ---------------------------------------------------------------------------

const CEILING_PATH =
  "M623.7,534.6c66.5,0,126.3,0,185.1,0,264.6,0,457.4.4,621.3.8,322.3.9,533.4,2.2,960.2,2.8,129.1.2,277.9.3,455.5.3,0-22.3,146.3-54.5,146.3-76.8s413.3-106.1,413.3-106.1l22.4-38.4s.3-38.1.7-88.1c.7-83.9,1.6-201.4,1.6-228.3-177.6,0-390.3,0-621.3,0C2045,.7,1080.1.4,516.3.2,229.4,0,46.4,0,46.4,0c1.8,3.7,0,98.7,0,103.3,0,0,58.8,46.9,139.2,109.2,47.9,37.1,103.4,79.7,158.8,121.1,41.2,30.8,81.9,61,119,87.9,4.9,3.6,30.9,14.4,35.7,17.8,66.8,48.8,124.8,95.3,124.8,95.3Z";

const FLOOR_PATH =
  "M40.9,1963h3368.2c0-85.9,2.9-101.5,3.7-195.7.1-14.1,0-129.8,0-142.6,0-31,.7-56.7,1.6-80.4.1-2.8.2-5.6.3-8.4,2-47,4.7-88,4.7-150.2-497.4,0-881.6,3.8-1252.9,8-382.4,4.3-751.1,9.1-1215.6,10.7-59.4.2-120.3.4-183.1.4-45.7,0-92.3.1-140,.1,0,0-192.6,73.1-364.8,138.5-10.2,3.9-126.1,31.8-135.8,35.7C46.2,1611,0,1616.7.5,1634.8c.3,12.9.5,26.3.6,40.2.5,92.7,39.8,202.1,39.8,288Z";

const WALLS_PATH =
  "M46.4,1633.8s20.4-7.8,53.6-20.4c40.1-15.3,98.9-37.7,162.6-61.9,53.3-20.3,110.1-42,162.5-61.9,14.6-5.6,28.9-11,42.7-16.3,15.6-5.9,30.5-11.6,44.5-17,50.2-19.1,88.6-33.7,103.4-39.4,4.4-1.7,6.7-2.6,6.7-2.6h2221.7s2.2.8,6.1,2.3c30.7,11.4,168.7,37.7,208.2,52.3,6.7,2.5,10.6,3.9,10.6,3.9,1.5,0-1.5,4.6,0,4.6h359.3V317.3h-359.3c-.2,0-.2.5-.5.5,0,0-3.9,3.7-10.6,10.1-39.4,37.5-177.1,168.4-207.8,197.6-3.9,3.7-6.1,5.8-6.1,5.8H622.4s-2.3-1.8-6.7-5.1c-14.8-11.3-105.8-104-105.5-104.3.8-.8-43.9.3-44.2-.3,0,0-2.8-2.2-7.8-6.2-18-14.2-65.3-51.3-121.8-95.6-67.5-52.9-148-116.1-207.1-162.4-48.8-38.3-83-65.1-83-65.1v1541.5Z";

// Trim polygon point strings
const TRIM_POLYGONS = [
  "44 1640.2 202 1578.1 202 1539.7 186 1525 42.3 1572.6 44 1640.2",
  "515.4 1476.8 515.4 1449.4 509.9 1430.2 466.7 1430.2 462.6 1444.6 462.6 1476.3 515.4 1476.8",
  "623.7 1386.3 509.9 1430.2 515.4 1449.4 515.4 1476.8 627.9 1424.7 627.9 1397.9 623.7 1386.3",
  "3054.8 1492.6 3054.8 1462.4 3064.4 1444.6 3423.7 1444.6 3423.7 1489.4 3054.8 1492.6",
  "2839.5 1382.4 3064.4 1444.6 3054.8 1462.4 3054.8 1492.6 2836.8 1421.7 2836.8 1396.1 2839.5 1382.4",
  "2839.5 1382.4 2550.6 1382.4 2550.6 1421.3 2836.8 1421.3 2836.8 1396.1 2839.5 1382.4",
  "627.9 1424.5 930.5 1424.5 930.5 1386.1 623.7 1386.1 627.9 1397.7 627.9 1424.5",
  "2556.1 1430.9 2556.1 1408.9 2549.2 1395.9 921.4 1395.9 913.1 1409.8 913.1 1433.6 2556.1 1430.9",
];

// Gradient definitions for trim 3D effect
const TRIM_GRADIENTS = [
  {
    id: "rv-grad-1",
    transform:
      "translate(17409.5 53999.8) rotate(-109.7) scale(75.8 -75.8)",
    stops: ["#7e7e7e", "#7e7e7e", "#fff", "#c1c1c1", "#fff"],
  },
  {
    id: "rv-grad-2",
    transform: "translate(-395.6 35410.1) rotate(-90) scale(46.6 -46.6)",
    stops: ["#a2a4a7", "#a2a4a7", "#fff", "#d9dbdc", "#fff"],
  },
  {
    id: "rv-grad-3",
    transform:
      "translate(13025.6 34732.1) rotate(-112) scale(48.8 -48.8)",
    stops: ["#a2a4a7", "#a2a4a7", "#fff", "#d9dbdc", "#fff"],
  },
  {
    id: "rv-grad-4",
    transform: "translate(2328.6 36423.9) rotate(-90) scale(48 -48)",
    stops: ["#7e7e7e", "#7e7e7e", "#fff", "#c1c1c1", "#fff"],
  },
  {
    id: "rv-grad-5",
    transform:
      "translate(-9376.7 39756.4) rotate(-73.7) scale(55.3 -55.3)",
    stops: ["#a2a4a7", "#a2a4a7", "#fff", "#d9dbdc", "#fff"],
  },
  {
    id: "rv-grad-6",
    transform: "translate(1957.9 29699.1) rotate(-90) scale(38.9 -38.9)",
    stops: ["#a2a4a7", "#a2a4a7", "#fff", "#d9dbdc", "#fff"],
  },
  {
    id: "rv-grad-7",
    transform: "translate(48.6 29369.5) rotate(-90) scale(38.4 -38.4)",
    stops: ["#a2a4a7", "#a2a4a7", "#fff", "#d9dbdc", "#fff"],
  },
  {
    id: "rv-grad-8",
    transform: "translate(1019.1 28879.7) rotate(-90) scale(37.7 -37.7)",
    stops: ["#a2a4a7", "#a2a4a7", "#fff", "#d9dbdc", "#fff"],
  },
];

const STOP_OFFSETS = [0, 0.2, 0.4, 0.7, 1];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Regions where pop colors can be tried */
const POP_REGIONS: RegionId[] = ["walls", "accentWall"];

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
  const [hexInput, setHexInput] = useState(
    merged.walls.replace("#", ""),
  );
  const [matches, setMatches] = useState<PaintMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const selectRegion = (id: RegionId) => {
    setSelected(id);
    setHexInput(colors[id].replace("#", ""));
    setMatches([]);
  };

  const applyColor = (hex: string) => {
    const normalized = hex.startsWith("#") ? hex : `#${hex}`;
    setColors((prev) => ({ ...prev, [selected]: normalized }));
    setHexInput(normalized.replace("#", ""));
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
      {/* ---- SVG Room ---- */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <svg
          viewBox="0 0 3430.1 1963"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-auto w-full"
        >
          <defs>
            {/* Clip paths for raster images */}
            <clipPath id="rv-clip-outer">
              <rect x="50" y="4.6" width="3355.4" height="1952.9" />
            </clipPath>
            <clipPath id="rv-clip-ceiling">
              <path d={CEILING_PATH} />
            </clipPath>
            <clipPath id="rv-clip-floor">
              <path d={FLOOR_PATH} />
            </clipPath>
            <clipPath id="rv-clip-walls">
              <path d={WALLS_PATH} />
            </clipPath>
            <clipPath id="rv-clip-accent">
              <rect x="921.3" y="446.2" width="1629.3" height="951.7" />
            </clipPath>
            {/* Grayscale filter for texture overlays */}
            <filter id="rv-grayscale">
              <feColorMatrix type="saturate" values="0" />
            </filter>

            {/* Trim gradients */}
            {TRIM_GRADIENTS.map((g) => (
              <linearGradient
                key={g.id}
                id={g.id}
                x1="727.7"
                y1="-19"
                x2="728.7"
                y2="-19"
                gradientTransform={g.transform}
                gradientUnits="userSpaceOnUse"
              >
                {g.stops.map((color, i) => (
                  <stop
                    key={i}
                    offset={STOP_OFFSETS[i]}
                    stopColor={color}
                  />
                ))}
              </linearGradient>
            ))}
          </defs>

          {/* Outer room clip */}
          <g clipPath="url(#rv-clip-outer)">
            {/* ---- Ceiling (always white) ---- */}
            <g style={{ isolation: "isolate" }}>
              <path d={CEILING_PATH} fill="#FFFFFF" />
              <g
                clipPath="url(#rv-clip-ceiling)"
                filter="url(#rv-grayscale)"
                style={{ mixBlendMode: "multiply", opacity: 0.3 }}
              >
                <image
                  width="3385"
                  height="540"
                  transform="translate(45.7 -1)"
                  href="/room/room-1.png"
                />
              </g>
            </g>

            {/* ---- Floor ---- */}
            <g style={{ isolation: "isolate" }}>
              <path d={FLOOR_PATH} fill={colors.floor} />
              <g
                clipPath="url(#rv-clip-floor)"
                filter="url(#rv-grayscale)"
                style={{ mixBlendMode: "multiply", opacity: 0.35 }}
              >
                <image
                  width="3420"
                  height="578"
                  transform="translate(-.3 1385)"
                  href="/room/room-2.png"
                />
              </g>
            </g>

            {/* ---- Walls ---- */}
            <g style={{ isolation: "isolate" }}>
              <path d={WALLS_PATH} fill={colors.walls} />
              <g
                clipPath="url(#rv-clip-walls)"
                filter="url(#rv-grayscale)"
                style={{ mixBlendMode: "multiply", opacity: 0.3 }}
              >
                <image
                  width="3383"
                  height="1542"
                  transform="translate(45.7 92)"
                  href="/room/room-3.png"
                />
              </g>
            </g>

            {/* ---- Wall Light (non-paintable) ---- */}
            <image
              width="45"
              height="1036"
              transform="translate(465.7 421)"
              href="/room/room-4.png"
            />

            {/* ---- Window Light (non-paintable) ---- */}
            <polygon
              points="434 1449.1 434 430.6 187.2 251.4 187.2 1538.3 434 1449.1"
              fill="#edf1f5"
            />

            {/* ---- Accent Wall ---- */}
            <g style={{ isolation: "isolate" }}>
              <rect
                x="921.3"
                y="446.2"
                width="1629.3"
                height="951.7"
                fill={colors.accentWall}
              />
              <g
                clipPath="url(#rv-clip-accent)"
                filter="url(#rv-grayscale)"
                style={{ mixBlendMode: "multiply", opacity: 0.3 }}
              >
                <image
                  width="1630"
                  height="952"
                  transform="translate(920.7 446)"
                  href="/room/room-5.png"
                />
              </g>
            </g>

            {/* ---- Trim ---- */}
            <g style={{ isolation: "isolate" }}>
              {/* Solid color base */}
              {TRIM_POLYGONS.map((pts, i) => (
                <polygon key={`trim-base-${i}`} points={pts} fill={colors.trim} />
              ))}
              {/* Gradient overlay for 3D effect */}
              <g style={{ mixBlendMode: "multiply", opacity: 0.4 }}>
                {TRIM_POLYGONS.map((pts, i) => (
                  <polygon
                    key={`trim-grad-${i}`}
                    points={pts}
                    fill={`url(#rv-grad-${i + 1})`}
                  />
                ))}
              </g>
            </g>

            {/* ---- Shadows (non-paintable, multiply blend) ---- */}
            <image
              width="282"
              height="985"
              transform="translate(2547.7 446)"
              href="/room/room-6.png"
              style={{ mixBlendMode: "multiply" }}
            />
            <image
              width="374"
              height="1055"
              transform="translate(508.7 422)"
              href="/room/room-7.png"
              style={{ mixBlendMode: "multiply" }}
            />

            {/* ---- Window (non-paintable) ---- */}
            <path
              d="M187.4,382.2v34.7c.1,0,46.3,26,46.3,26v238l-46.7-14.2.5,26,47,16.4.3,232.7-47.4-11.9v19.3l49.5,9.8v276.2s-49.4,10.3-49.4,10.3v19.3c-.1,0,49.4-12.1,49.4-12.1v179.7l-49.9,14.3.3,20.7,66.8-30.3V431.2l-66.8-49Z"
              fill="#dce8ef"
            />
            <path
              d="M187.4,382.2v27l54.4,34.1v239.5l-54.4-17.6v17.7l55.7,19.9v234.9l-55.7-12v17.6l58.2,12.1v285.3l-58.2,13.2v16.6l58.2-12.1v180.8l-58.2,17.6v17.6l78.1-26,.4-1016.7-78.5-49.3Z"
              fill="#ccd8dd"
            />
            <polygon
              points="265.9 431.8 435.9 431.8 186.3 250.5 186.3 382.2 265.9 431.8"
              fill="#e6eaed"
            />
            <polygon
              points="265.5 1448.2 434 1448.2 197 1534.9 187.2 1525.9 187.2 1474.2 265.5 1448.2"
              fill="#e6eaed"
            />

            {/* ---- Window Shadow (non-paintable) ---- */}
            <image
              width="157"
              height="1185"
              transform="translate(184.7 324)"
              href="/room/room-8.png"
              style={{ mixBlendMode: "multiply" }}
            />

            {/* ---- Invisible click targets ---- */}
            <path
              d={FLOOR_PATH}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => selectRegion("floor")}
            />
            <path
              d={WALLS_PATH}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => selectRegion("walls")}
            />
            <rect
              x="921.3"
              y="446.2"
              width="1629.3"
              height="951.7"
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => selectRegion("accentWall")}
            />
            {TRIM_POLYGONS.map((pts, i) => (
              <polygon
                key={`click-trim-${i}`}
                points={pts}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={() => selectRegion("trim")}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* ---- Controls ---- */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        {/* Region selector */}
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => selectRegion(r.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                selected === r.id
                  ? "border-brand-blue bg-blue-50 text-brand-blue-dark"
                  : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span
                className="inline-block h-5 w-5 rounded border border-gray-300"
                style={{ backgroundColor: colors[r.id] }}
              />
              {r.label}
            </button>
          ))}
          <button
            onClick={resetColors}
            className="ml-auto rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:border-gray-300 hover:bg-gray-50"
          >
            Reset All
          </button>
        </div>

        {/* Palette options + Pop swatches */}
        {(() => {
          const hasPopForRegion = popColors && popColors.length > 0 && POP_REGIONS.includes(selected);
          const paletteOpts = colorOptions?.[selected] && colorOptions[selected].length > 1
            ? colorOptions[selected]
            : hasPopForRegion
              ? [merged[selected]]
              : null;
          if (!paletteOpts && !hasPopForRegion) return null;
          return (
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            {/* Color alternatives toggle */}
            {paletteOpts && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Palette options:
                </span>
                {paletteOpts.map((hex) => {
                  const normalized = hex.startsWith("#") ? hex : `#${hex}`;
                  const isActive =
                    colors[selected].toUpperCase() === normalized.toUpperCase();
                  return (
                    <button
                      key={hex}
                      onClick={() => applyColor(normalized)}
                      className={`h-8 w-8 rounded-lg border-2 transition-transform ${
                        isActive
                          ? "scale-110 border-brand-blue ring-2 ring-blue-200"
                          : "border-gray-300 hover:scale-105 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: normalized }}
                      title={normalized.toUpperCase()}
                    />
                  );
                })}
              </div>
            )}

            {/* Pop color options (shown on walls/accent wall) */}
            {popColors && popColors.length > 0 && POP_REGIONS.includes(selected) && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-amber-600">
                  Pop:
                </span>
                {popColors.map((hex) => {
                  const normalized = hex.startsWith("#") ? hex : `#${hex}`;
                  const isActive =
                    colors[selected].toUpperCase() === normalized.toUpperCase();
                  return (
                    <button
                      key={hex}
                      onClick={() => applyColor(normalized)}
                      className={`h-8 w-8 rounded-lg border-2 transition-transform ${
                        isActive
                          ? "scale-110 border-amber-500 ring-2 ring-amber-200"
                          : "border-gray-300 hover:scale-105 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: normalized }}
                      title={`Pop: ${normalized.toUpperCase()}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
          );
        })()}

        {/* Color picker */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            {REGIONS.find((r) => r.id === selected)?.label} Color:
          </label>
          <input
            type="color"
            value={colors[selected]}
            onChange={handlePickerChange}
            className="h-10 w-14 cursor-pointer rounded border border-gray-300"
          />
          <div className="flex items-center rounded-lg border border-gray-300 bg-white">
            <span className="pl-3 text-sm text-gray-400">#</span>
            <input
              type="text"
              value={hexInput}
              onChange={handleHexInput}
              maxLength={6}
              className="w-20 border-none bg-transparent px-1 py-2 text-sm text-gray-900 outline-none"
              placeholder="D6D0C4"
            />
          </div>
          <div
            className="h-10 w-10 rounded-lg border border-gray-300"
            style={{ backgroundColor: colors[selected] }}
          />
          <button
            onClick={findMatches}
            disabled={loading || hexInput.length !== 6}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Searching..." : "Find Paint Match"}
          </button>
        </div>

        {/* Paint matches */}
        {matches.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Closest Paint Colors
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
                >
                  <button
                    onClick={() => applyColor(m.hex)}
                    className="relative h-16 w-full"
                    style={{ backgroundColor: m.hex }}
                    title={`Apply ${m.name}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                      Apply
                    </span>
                  </button>
                  <div className="p-2">
                    <Link
                      href={`/colors/${m.brandSlug}/${m.colorSlug}`}
                      className="block text-xs font-medium text-gray-900 hover:text-brand-blue"
                    >
                      {m.name}
                    </Link>
                    <p className="text-xs text-gray-500">{m.brandName}</p>
                    <p className="text-xs text-gray-400">
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
