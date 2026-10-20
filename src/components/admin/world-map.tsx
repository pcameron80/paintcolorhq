"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoArea, geoCentroid, geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import world from "world-atlas/countries-110m.json";
import type { MapPoint } from "@/lib/admin-analytics-types";
import { normalizePlace } from "@/lib/place-key";
import { useElementWidth } from "./charts";

/* Basemap: Natural Earth via world-atlas. City coordinates (server side): GeoNames, CC BY 4.0. */

type Country = Feature<Polygon | MultiPolygon, { name: string }>;

const W = 960;
const H = 470;

// GA4 country name (normalized) -> world-atlas name (normalized).
const ALIASES: Record<string, string> = {
  "united states": "united states of america",
  "congo - kinshasa": "dem. rep. congo",
  "congo - brazzaville": "congo",
  "bosnia & herzegovina": "bosnia and herz.",
  "czech republic": "czechia",
  "dominican republic": "dominican rep.",
  "central african republic": "central african rep.",
  "south sudan": "s. sudan",
  "equatorial guinea": "eq. guinea",
  eswatini: "eswatini",
  swaziland: "eswatini",
  "cote d’ivoire": "cote d'ivoire",
  "cote divoire": "cote d'ivoire",
  "western sahara": "w. sahara",
  "north macedonia": "macedonia",
  "myanmar (burma)": "myanmar",
  turkiye: "turkey",
  "falkland islands": "falkland is.",
  "solomon islands": "solomon is.",
  "trinidad & tobago": "trinidad and tobago",
  "timor-leste": "timor-leste",
  "south korea": "south korea",
  "north korea": "north korea",
  "laos": "laos",
  "russia": "russia",
};

const topo = world as unknown as Topology;
const countries = (feature(topo, topo.objects.countries as GeometryCollection) as FeatureCollection<Polygon | MultiPolygon, { name: string }>).features
  .filter((f) => f.properties?.name !== "Antarctica") as Country[];

const projection = geoEqualEarth().fitExtent(
  [
    [4, 4],
    [W - 4, H - 4],
  ],
  { type: "FeatureCollection", features: countries },
);
const pathGen = geoPath(projection);
const landPaths = countries.map((c) => ({ name: c.properties.name, d: pathGen(c) ?? "" }));

/** Centroid of the largest polygon, so the US is not dragged toward Hawaii and France toward Guiana. */
function mainCentroid(c: Country): [number, number] {
  if (c.geometry.type === "Polygon") return geoCentroid(c);
  let best: [number, number] = geoCentroid(c);
  let bestArea = -1;
  for (const coords of c.geometry.coordinates) {
    const poly: Feature<Polygon> = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: coords } };
    const a = geoArea(poly);
    if (a > bestArea) {
      bestArea = a;
      best = geoCentroid(poly);
    }
  }
  return best;
}

const centroidByName = new Map<string, [number, number]>(countries.map((c) => [normalizePlace(c.properties.name), mainCentroid(c)]));

function countryCentroid(name: string): [number, number] | null {
  const key = normalizePlace(name);
  return centroidByName.get(ALIASES[key] ?? key) ?? centroidByName.get(key) ?? null;
}

type Placed = { key: string; label: string; users: number; x: number; y: number; approx: boolean };

export function placePoints(points: MapPoint[]): { placed: Placed[]; unplaced: number } {
  const merged = new Map<string, Placed>();
  let unplaced = 0;
  for (const p of points) {
    let lngLat: [number, number] | null = null;
    let approx = false;
    if (p.lat !== undefined && p.lng !== undefined) lngLat = [p.lng, p.lat];
    else {
      lngLat = countryCentroid(p.country);
      approx = true;
    }
    const xy = lngLat ? projection(lngLat) : null;
    if (!xy) {
      unplaced += p.users;
      continue;
    }
    const key = `${p.city}|${p.country}`;
    const label = p.city ? `${p.city}, ${p.country}` : `${p.country} (city unknown)`;
    const prev = merged.get(key);
    if (prev) prev.users += p.users;
    else merged.set(key, { key, label, users: p.users, x: Math.round(xy[0] * 10) / 10, y: Math.round(xy[1] * 10) / 10, approx });
  }
  return { placed: [...merged.values()].sort((a, b) => b.users - a.users), unplaced };
}

export function WorldMap({ points }: { points: MapPoint[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const { placed, unplaced } = useMemo(() => placePoints(points), [points]);
  const [active, setActive] = useState<string | null>(null);

  // Dots that were not on the previous poll get a one-time pulse.
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    const keys = new Set(placed.map((p) => p.key));
    if (seen.current) {
      const added = new Set([...keys].filter((k) => !seen.current!.has(k)));
      setFresh(added);
    }
    seen.current = keys;
  }, [placed]);

  const k = width ? W / width : 1; // svg units per CSS pixel, keeps dots a constant on-screen size
  const radius = (users: number) => (5 + Math.min(11, 3.2 * Math.sqrt(users))) * k;
  const sel = placed.find((p) => p.key === active);

  return (
    <div>
      <div ref={ref} className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label={`Map of ${placed.length} visitor locations`}>
          {landPaths.map((l) => (
            <path key={l.name} d={l.d} fill="var(--v-land)" stroke="var(--v-surface)" strokeWidth={0.6 * k} />
          ))}
          {placed.map((p) => (
            <g key={p.key}>
              {fresh.has(p.key) && (
                <circle className="admin-pulse" cx={p.x} cy={p.y} r={radius(p.users)} fill="none" stroke="var(--v-series-1)" strokeWidth={2 * k} />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={radius(p.users)}
                fill="var(--v-series-1)"
                fillOpacity={p.approx ? 0.55 : 0.85}
                stroke="var(--v-surface)"
                strokeWidth={1.5 * k}
              />
              {/* Larger invisible target for touch. */}
              <circle
                cx={p.x}
                cy={p.y}
                r={Math.max(radius(p.users), 14 * k)}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setActive(p.key)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive((a) => (a === p.key ? null : p.key))}
              />
            </g>
          ))}
        </svg>
        {sel && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md px-2 py-1 text-xs shadow"
            style={{
              left: `${Math.min(88, Math.max(12, (sel.x / W) * 100))}%`,
              top: `calc(${(sel.y / H) * 100}% - 10px)`,
              background: "var(--v-tip-bg)",
              color: "var(--v-tip-fg)",
              whiteSpace: "nowrap",
            }}
          >
            <div className="font-medium">{sel.label}</div>
            <div>
              {sel.users} active {sel.users === 1 ? "visitor" : "visitors"}
              {sel.approx ? " (country level)" : ""}
            </div>
          </div>
        )}
        {placed.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: "var(--v-muted)" }}>
            No visitors on the map right now.
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs" style={{ color: "var(--v-muted)" }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--v-series-1)" }} /> City
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--v-series-1)", opacity: 0.55 }} /> Country only
        </span>
        <span>Dot size = visitors</span>
        {unplaced > 0 && <span>{unplaced} not placed</span>}
      </div>
      {placed.length > 0 && (
        <ol className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {placed.slice(0, 6).map((p) => (
            <li key={p.key} className="flex justify-between gap-3">
              <span className="truncate">{p.label}</span>
              <span className="tabular-nums">{p.users}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-[11px]" style={{ color: "var(--v-muted)" }}>
        City locations from GeoNames (CC BY 4.0). Basemap from Natural Earth.
      </p>
    </div>
  );
}
