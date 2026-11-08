"use client";

import { useState, useRef, useEffect, useId } from "react";
import { trackToolEngagement } from "@/lib/analytics";
import { SuppliesList } from "./supplies-list";
import {
  COVERAGE_PRODUCTS,
  GENERIC_RATE,
  formatRange,
  planningRate,
  type CoverageSurface,
} from "@/lib/paint-coverage";
import {
  CABINET_DOOR_SQFT,
  DOOR_FACE_SQFT,
  DOOR_SQFT,
  DRAWER_FRONT_SQFT,
  WINDOW_SQFT,
  formatCans,
  gallonsAndQuarts,
  parseClamped,
  parseCount,
  plural,
  rawGallons,
  wallArea,
  wholeGallons,
} from "@/lib/paint-quantity";

type Mode = "walls" | "ceiling" | "sqft" | "doors" | "cabinets" | "exterior";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "walls", label: "Room walls" },
  { id: "ceiling", label: "Ceiling" },
  { id: "sqft", label: "Square feet" },
  { id: "doors", label: "Doors" },
  { id: "cabinets", label: "Cabinets" },
  { id: "exterior", label: "Exterior" },
];

/** Which products the picker offers in each mode. */
const MODE_SURFACE: Record<Mode, CoverageSurface> = {
  walls: "walls",
  ceiling: "ceiling",
  sqft: "walls",
  doors: "trim",
  cabinets: "trim",
  exterior: "exterior",
};

const PRIMER = COVERAGE_PRODUCTS.find((p) => p.surfaces.includes("primer"));

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue";
const labelClass = "block text-sm font-medium text-gray-700";

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode = "decimal",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        min="0"
        step={inputMode === "decimal" ? "0.5" : "1"}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

export function PaintCalculator() {
  const tracked = useRef(false);
  const modeId = useId();
  const productId = useId();
  const coatsId = useId();
  const primerId = useId();

  const [mode, setMode] = useState<Mode>("walls");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("8");
  const [doors, setDoors] = useState("1");
  const [windows, setWindows] = useState("1");
  const [area, setArea] = useState("");
  const [doorCount, setDoorCount] = useState("");
  const [cabDoors, setCabDoors] = useState("");
  const [drawers, setDrawers] = useState("");
  const [coats, setCoats] = useState("2");
  const [productKey, setProductKey] = useState("");
  const [primer, setPrimer] = useState(false);

  const lengthNum = parseClamped(length, 0, 500);
  const widthNum = parseClamped(width, 0, 500);
  const heightNum = parseClamped(height, 0, 60);
  const doorsNum = parseCount(doors, 0, 100);
  const windowsNum = parseCount(windows, 0, 200);
  const coatsNum = parseCount(coats, 1, 3);

  // --- Area for the selected mode ---
  let paintable = 0;
  let needsInput = "";
  let breakdown: Array<[string, string]> = [];
  const walls = wallArea({ lengthFt: lengthNum, widthFt: widthNum, heightFt: heightNum, doors: doorsNum, windows: windowsNum });

  if (mode === "walls" || mode === "exterior") {
    if (!(lengthNum > 0 && widthNum > 0 && heightNum > 0)) {
      needsInput =
        mode === "walls"
          ? "Enter room length, width and ceiling height (all above 0) to see your estimate."
          : "Enter the house length, width and wall height (all above 0) to see your estimate.";
    } else {
      paintable = walls.paintableArea;
      breakdown = [
        [mode === "walls" ? "Total wall area" : "Total siding area", `${walls.wallArea.toLocaleString()} sq ft`],
        [`Doors (${doorsNum} x ${DOOR_SQFT} sq ft)`, `−${walls.doorArea} sq ft`],
        [`Windows (${windowsNum} x ${WINDOW_SQFT} sq ft)`, `−${walls.windowArea} sq ft`],
      ];
    }
  } else if (mode === "ceiling") {
    if (!(lengthNum > 0 && widthNum > 0)) {
      needsInput = "Enter room length and width (both above 0) to see your estimate.";
    } else {
      paintable = lengthNum * widthNum;
      breakdown = [["Ceiling area", `${paintable.toLocaleString()} sq ft`]];
    }
  } else if (mode === "sqft") {
    const a = parseClamped(area, 0, 50000);
    if (!(a > 0)) needsInput = "Enter the square footage to paint (above 0) to see your estimate.";
    else {
      paintable = a;
      breakdown = [["Area entered", `${a.toLocaleString()} sq ft`]];
    }
  } else if (mode === "doors") {
    const n = parseCount(doorCount, 0, 200);
    if (!(n > 0)) needsInput = "Enter how many doors you are painting to see your estimate.";
    else {
      paintable = n * DOOR_FACE_SQFT * 2;
      breakdown = [[`${n} ${plural(n, "door", "doors")} x 2 sides x ${DOOR_FACE_SQFT} sq ft`, `${paintable.toLocaleString()} sq ft`]];
    }
  } else if (mode === "cabinets") {
    const d = parseCount(cabDoors, 0, 500);
    const f = parseCount(drawers, 0, 500);
    if (!(d + f > 0)) needsInput = "Enter the number of cabinet doors or drawer fronts to see your estimate.";
    else {
      paintable = d * CABINET_DOOR_SQFT * 2 + f * DRAWER_FRONT_SQFT;
      breakdown = [
        [`Cabinet doors (${d} x 2 sides x ${CABINET_DOOR_SQFT} sq ft)`, `${(d * CABINET_DOOR_SQFT * 2).toLocaleString()} sq ft`],
        [`Drawer fronts (${f} x ${DRAWER_FRONT_SQFT} sq ft)`, `${(f * DRAWER_FRONT_SQFT).toLocaleString()} sq ft`],
      ];
    }
  }

  const canCalculate = needsInput === "";
  const coveredAll = canCalculate && paintable <= 0;

  // --- Spread rate ---
  const surface = MODE_SURFACE[mode];
  const options = COVERAGE_PRODUCTS.filter((p) => p.surfaces.includes(surface));
  const product = options.find((p) => p.id === productKey);
  const genericRate = mode === "exterior" ? GENERIC_RATE.exterior : GENERIC_RATE.interior;
  const rate = product ? planningRate(product) : genericRate;

  const raw = rawGallons(paintable, coatsNum, rate);
  const gallons = wholeGallons(raw);
  const cans = gallonsAndQuarts(raw);
  const showCans = cans.gallons !== gallons || cans.quarts > 0;

  const primerRate = PRIMER ? planningRate(PRIMER) : GENERIC_RATE.primer;
  const primerRaw = rawGallons(paintable, 1, primerRate);

  useEffect(() => {
    trackToolEngagement("paint-calculator", "open");
  }, []);

  useEffect(() => {
    if (canCalculate && !coveredAll && !tracked.current) {
      tracked.current = true;
      trackToolEngagement("paint-calculator", "complete");
    }
  }, [canCalculate, coveredAll]);

  function changeMode(next: Mode) {
    setMode(next);
    // The picked product may not exist in the new mode's list.
    if (!COVERAGE_PRODUCTS.some((p) => p.id === productKey && p.surfaces.includes(MODE_SURFACE[next]))) {
      setProductKey("");
    }
  }

  const usesRoom = mode === "walls" || mode === "ceiling" || mode === "exterior";

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">What Are You Painting?</h2>

        <div className="mt-4">
          <label htmlFor={modeId} className={labelClass}>
            Surface
          </label>
          <select id={modeId} value={mode} onChange={(e) => changeMode(e.target.value as Mode)} className={inputClass}>
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {usesRoom && (
            <>
              <Field label={mode === "exterior" ? "House length (ft)" : "Length (ft)"} value={length} onChange={setLength} placeholder="12" />
              <Field label={mode === "exterior" ? "House width (ft)" : "Width (ft)"} value={width} onChange={setWidth} placeholder="14" />
            </>
          )}
          {(mode === "walls" || mode === "exterior") && (
            <Field
              label={mode === "exterior" ? "Wall height (ft)" : "Ceiling height (ft)"}
              value={height}
              onChange={setHeight}
              placeholder="8"
            />
          )}
          {mode === "sqft" && (
            <div className="col-span-2">
              <Field label="Area to paint (sq ft)" value={area} onChange={setArea} placeholder="400" hint="One coat's worth of surface. The coats setting multiplies it." />
            </div>
          )}
          {mode === "doors" && (
            <div className="col-span-2">
              <Field
                label="Interior doors"
                value={doorCount}
                onChange={setDoorCount}
                placeholder="4"
                inputMode="numeric"
                hint={`Both sides painted, about ${DOOR_FACE_SQFT} sq ft per side with edges.`}
              />
            </div>
          )}
          {mode === "cabinets" && (
            <>
              <Field
                label="Cabinet doors"
                value={cabDoors}
                onChange={setCabDoors}
                placeholder="16"
                inputMode="numeric"
                hint={`Both sides, about ${CABINET_DOOR_SQFT} sq ft per side.`}
              />
              <Field
                label="Drawer fronts"
                value={drawers}
                onChange={setDrawers}
                placeholder="6"
                inputMode="numeric"
                hint={`Face only, about ${DRAWER_FRONT_SQFT} sq ft each.`}
              />
            </>
          )}
          <div>
            <label htmlFor={coatsId} className={labelClass}>
              Number of coats
            </label>
            <select id={coatsId} value={coats} onChange={(e) => setCoats(e.target.value)} className={inputClass}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          {(mode === "walls" || mode === "exterior") && (
            <>
              <Field label="Doors" value={doors} onChange={setDoors} inputMode="numeric" />
              <Field label="Windows" value={windows} onChange={setWindows} inputMode="numeric" />
            </>
          )}
        </div>

        {mode === "exterior" && (
          <p className="mt-3 text-xs text-gray-600">
            Covers the four walls up to the eaves. Add gable ends separately in Square feet mode.
          </p>
        )}

        <div className="mt-4">
          <label htmlFor={productId} className={labelClass}>
            Paint
          </label>
          <select id={productId} value={productKey} onChange={(e) => setProductKey(e.target.value)} className={inputClass}>
            <option value="">Any brand (plan with {genericRate} sq ft per gallon)</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.brand} {p.product}, {p.sheen} ({formatRange(p)} sq ft/gal)
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-600">
            {product ? (
              <>
                The {product.sourceType} lists {formatRange(product)} sq ft per gallon; the estimate uses {planningRate(product)}.{" "}
                <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">
                  View the data sheet
                </a>
              </>
            ) : (
              <>Pick a product to use the spread rate from its own data sheet.</>
            )}
          </p>
        </div>

        <div className="mt-4 flex items-start gap-2">
          <input
            id={primerId}
            type="checkbox"
            checked={primer}
            onChange={(e) => setPrimer(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor={primerId} className="text-sm text-gray-700">
            Add a coat of primer (new drywall, patched walls, stains or a big color change)
          </label>
        </div>
      </div>

      {!canCalculate ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <p className="text-center text-sm text-gray-600">{needsInput}</p>
        </div>
      ) : coveredAll ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6">
          <p className="text-center text-sm text-amber-900">
            The doors and windows you entered cover all of the wall area, so there is nothing left to paint. Check the counts.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold text-gray-900">You Need</h2>
          <p className="mt-2 text-5xl font-bold text-brand-blue">
            {gallons} {plural(gallons, "gallon", "gallons")}
          </p>
          {showCans && (
            <p className="mt-1 text-sm text-gray-700">
              Or buy {formatCans(cans)} if you don&apos;t want leftovers.
            </p>
          )}
          {primer && (
            <p className="mt-2 text-sm font-medium text-gray-900">
              Plus primer: {wholeGallons(primerRaw)} {plural(wholeGallons(primerRaw), "gallon", "gallons")}
              <span className="font-normal text-gray-600">
                {" "}
                (1 coat at {primerRate} sq ft per gallon{PRIMER ? `, from the ${PRIMER.brand} ${PRIMER.product} ${PRIMER.sourceType}` : ""})
              </span>
            </p>
          )}

          <div className="mt-6 space-y-2 text-sm text-gray-700">
            {breakdown.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span>{k}</span>
                <span className="shrink-0 font-medium">{v}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-gray-200 pt-2">
              <span>Paintable area</span>
              <span className="shrink-0 font-medium">{paintable.toLocaleString()} sq ft</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>
                &times; {coatsNum} {plural(coatsNum, "coat", "coats")}
              </span>
              <span className="shrink-0 font-medium">{(paintable * coatsNum).toLocaleString()} sq ft total</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>&divide; {rate} sq ft/gallon</span>
              <span className="shrink-0 font-medium">{raw.toFixed(2)} gallons</span>
            </div>
            <p className="text-xs text-gray-600">Rounded up to whole gallons.</p>
          </div>

          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Tip: Consider buying an extra quart for future touch-ups. Textured
            or porous surfaces may require additional paint.
          </p>
        </div>
      )}

      {mode === "walls" && canCalculate && !coveredAll && (
        <SuppliesList
          lengthFt={lengthNum}
          widthFt={widthNum}
          heightFt={heightNum}
          doors={doorsNum}
          windows={windowsNum}
          coats={coatsNum}
          gallons={gallons}
        />
      )}
    </div>
  );
}
