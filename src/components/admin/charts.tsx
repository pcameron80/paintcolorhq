"use client";

import { useEffect, useRef, useState } from "react";
import { fmtNum } from "./format";

export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** 30 bars, one per minute, newest on the right. */
export function MinuteBars({ values }: { values: number[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const h = 56;
  const max = Math.max(1, ...values);
  const gap = 2;
  const bw = width ? Math.max(2, (width - gap * (values.length - 1)) / values.length) : 0;
  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={h} role="img" aria-label={`Visitors per minute over the last 30 minutes, peak ${max}`}>
          {values.map((v, i) => {
            const bh = v === 0 ? 2 : Math.max(3, (v / max) * (h - 4));
            return (
              <rect
                key={i}
                x={i * (bw + gap)}
                y={h - bh}
                width={bw}
                height={bh}
                rx={Math.min(2, bw / 2)}
                fill={v === 0 ? "var(--v-grid)" : "var(--v-series-1)"}
              >
                <title>{`${29 - i === 0 ? "This minute" : `${29 - i} min ago`}: ${v}`}</title>
              </rect>
            );
          })}
        </svg>
      )}
      <div className="mt-1 flex justify-between text-[11px]" style={{ color: "var(--v-muted)" }}>
        <span>30 min ago</span>
        <span>now</span>
      </div>
    </div>
  );
}

export type Point = { label: string; value: number; partial?: boolean };

/** Single-series line with hover crosshair. The last point can be flagged as partial (dashed). */
export function LineChart({
  points,
  color = "var(--v-series-1)",
  height = 180,
  format = fmtNum,
  ariaLabel,
  unit,
}: {
  points: Point[];
  color?: string;
  height?: number;
  format?: (n: number) => string;
  ariaLabel: string;
  unit: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 38;
  const padR = 14;
  const padT = 14;
  const padB = 22;

  const n = points.length;
  const rawMax = Math.max(1, ...points.map((p) => p.value));
  const max = niceMax(rawMax);
  const iw = Math.max(1, width - padL - padR);
  const ih = height - padT - padB;
  const x = (i: number) => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => padT + ih - (v / max) * ih;

  const solid = points.filter((p) => !p.partial);
  const partialTail = points.length > 0 && points[points.length - 1].partial;
  const path = (idx: number[]) => idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(points[i].value).toFixed(1)}`).join("");
  const solidIdx = solid.map((_, i) => i);
  const ticks = [0, max / 2, max];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - padL) / iw) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  }

  const hp = hover !== null ? points[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover), 70), Math.max(70, width - 70)) : 0;

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          style={{ touchAction: "pan-y" }}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke="var(--v-grid)" strokeWidth={1} />
              <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--v-muted)">
                {fmtNum(t)}
              </text>
            </g>
          ))}
          {n > 0 && (
            <>
              <text x={x(0)} y={height - 5} textAnchor="start" fontSize={11} fill="var(--v-muted)">
                {points[0].label}
              </text>
              <text x={x(n - 1)} y={height - 5} textAnchor="end" fontSize={11} fill="var(--v-muted)">
                {points[n - 1].label}
              </text>
            </>
          )}
          {solidIdx.length > 0 && <path d={path(solidIdx)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {partialTail && solidIdx.length > 0 && (
            <path
              d={path([solidIdx[solidIdx.length - 1], n - 1])}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}
          {n > 0 && (
            <circle
              cx={x(n - 1)}
              cy={y(points[n - 1].value)}
              r={4}
              fill={partialTail ? "var(--v-surface)" : color}
              stroke={color}
              strokeWidth={2}
            />
          )}
          {hover !== null && hp && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="var(--v-axis)" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(hp.value)} r={4.5} fill={color} stroke="var(--v-surface)" strokeWidth={2} />
            </>
          )}
        </svg>
      )}
      {hp && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md px-2 py-1 text-xs shadow"
          style={{ left: tipLeft, background: "var(--v-tip-bg)", color: "var(--v-tip-fg)" }}
        >
          <div className="font-medium">{hp.label}{hp.partial ? " (so far)" : ""}</div>
          <div>
            {format(hp.value)} {unit}
          </div>
        </div>
      )}
    </div>
  );
}

function niceMax(v: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/** Thin horizontal bar rows: label, bar, value. */
export function BarList({
  rows,
  format = fmtNum,
  empty = "Nothing to show yet.",
}: {
  rows: { label: string; value: number; sub?: string; title?: string }[];
  format?: (n: number) => string;
  empty?: string;
}) {
  if (!rows.length) return <p className="text-sm" style={{ color: "var(--v-muted)" }}>{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate" title={r.title ?? r.label}>
              {r.label}
            </span>
            <span className="shrink-0 tabular-nums">
              {format(r.value)}
              {r.sub && <span className="ml-2 text-xs" style={{ color: "var(--v-muted)" }}>{r.sub}</span>}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full" style={{ background: "var(--v-grid)" }}>
            <div
              className="h-1.5 rounded-full"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: "var(--v-series-1)" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
