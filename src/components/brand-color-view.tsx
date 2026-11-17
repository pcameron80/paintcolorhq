"use client";

import { useState } from "react";
import Link from "next/link";
import { ColorCard } from "./color-card";

export interface ChartRow {
  id: string;
  name: string;
  slug: string;
  hex: string;
  code: string | null;
  lrv: number | null;
  undertone: string | null;
}

type View = "grid" | "table";
type Sort = "default" | "lrv-asc" | "lrv-desc";

function formatLrv(v: number): string {
  return String(Math.round(v * 10) / 10);
}

/**
 * Grid or chart for the colors on this page. Same URL either way: the choice is
 * client state, never a query parameter, so it cannot create a new indexable
 * variant. The grid is what the server renders; the table only mounts after the
 * toggle. Sorting reorders the colors on this page, not the whole brand.
 */
export function BrandColorView({ brandSlug, brandName, rows }: { brandSlug: string; brandName: string; rows: ChartRow[] }) {
  const [view, setView] = useState<View>("grid");
  const [sort, setSort] = useState<Sort>("default");

  const sorted =
    sort === "default"
      ? rows
      : [...rows].sort((a, b) => {
          // Colors without a published LRV sort last in either direction.
          if (a.lrv === null && b.lrv === null) return 0;
          if (a.lrv === null) return 1;
          if (b.lrv === null) return -1;
          return sort === "lrv-asc" ? a.lrv - b.lrv : b.lrv - a.lrv;
        });

  const toggle = (v: View, label: string) => (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-pressed={view === v}
      className={`rounded-full px-4 py-2 text-sm font-headline font-bold transition-all ${view === v ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
    >
      {label}
    </button>
  );

  const nextSort = () => setSort(sort === "lrv-asc" ? "lrv-desc" : "lrv-asc");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Color layout">
        {toggle("grid", "Swatches")}
        {toggle("table", "Chart")}
        {view === "table" && (
          <span className="ml-2 text-xs text-on-surface-variant">Sorting reorders the {rows.length} colors on this page.</span>
        )}
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {rows.map((c) => (
            <ColorCard key={c.id} name={c.name} hex={c.hex} brandName={brandName} brandSlug={brandSlug} colorSlug={c.slug} colorNumber={c.code} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
          <table className="w-full min-w-[480px] text-left text-sm">
            <caption className="sr-only">{brandName} colors on this page with code, hex, LRV and undertone</caption>
            <thead className="bg-surface-container-low">
              <tr>
                <th scope="col" className="p-3 font-headline">Color</th>
                <th scope="col" className="p-3 font-headline">Code</th>
                <th scope="col" className="hidden p-3 font-headline sm:table-cell">Hex</th>
                <th scope="col" className="p-3 font-headline" aria-sort={sort === "lrv-asc" ? "ascending" : sort === "lrv-desc" ? "descending" : "none"}>
                  <button type="button" onClick={nextSort} className="font-headline font-bold hover:text-primary">
                    LRV {sort === "lrv-asc" ? "▲" : sort === "lrv-desc" ? "▼" : "⇅"}
                  </button>
                </th>
                <th scope="col" className="p-3 font-headline">Undertone</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} className="border-t border-outline-variant/15">
                  <td className="p-3">
                    <Link href={`/colors/${brandSlug}/${c.slug}`} className="flex items-center gap-3 font-bold text-on-surface hover:text-primary">
                      <span className="h-7 w-7 shrink-0 rounded-md border border-black/10" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-3 text-on-surface-variant">{c.code ?? ""}</td>
                  <td className="hidden p-3 font-mono text-xs text-on-surface-variant sm:table-cell">{c.hex.toUpperCase()}</td>
                  <td className="p-3 tabular-nums text-on-surface-variant">{c.lrv === null ? "" : formatLrv(c.lrv)}</td>
                  <td className="p-3 text-on-surface-variant">{c.undertone ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
