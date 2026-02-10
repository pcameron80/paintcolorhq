"use client";

import { useState } from "react";

export function PaintCalculator() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("8");
  const [doors, setDoors] = useState("1");
  const [windows, setWindows] = useState("1");
  const [coats, setCoats] = useState("2");

  const lengthNum = parseFloat(length) || 0;
  const widthNum = parseFloat(width) || 0;
  const heightNum = parseFloat(height) || 8;
  const doorsNum = parseInt(doors) || 0;
  const windowsNum = parseInt(windows) || 0;
  const coatsNum = parseInt(coats) || 2;

  const canCalculate = lengthNum > 0 && widthNum > 0;

  const wallArea = 2 * (lengthNum + widthNum) * heightNum;
  const doorArea = doorsNum * 21;
  const windowArea = windowsNum * 15;
  const paintableArea = Math.max(0, wallArea - doorArea - windowArea);
  const totalArea = paintableArea * coatsNum;
  const gallons = Math.ceil(totalArea / 350);

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Room Dimensions
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="length"
              className="block text-sm font-medium text-gray-700"
            >
              Length (ft)
            </label>
            <input
              id="length"
              type="number"
              min="0"
              step="0.5"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="12"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="width"
              className="block text-sm font-medium text-gray-700"
            >
              Width (ft)
            </label>
            <input
              id="width"
              type="number"
              min="0"
              step="0.5"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="14"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="height"
              className="block text-sm font-medium text-gray-700"
            >
              Ceiling Height (ft)
            </label>
            <input
              id="height"
              type="number"
              min="0"
              step="0.5"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="coats"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Coats
            </label>
            <select
              id="coats"
              value={coats}
              onChange={(e) => setCoats(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="doors"
              className="block text-sm font-medium text-gray-700"
            >
              Doors
            </label>
            <input
              id="doors"
              type="number"
              min="0"
              value={doors}
              onChange={(e) => setDoors(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="windows"
              className="block text-sm font-medium text-gray-700"
            >
              Windows
            </label>
            <input
              id="windows"
              type="number"
              min="0"
              value={windows}
              onChange={(e) => setWindows(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {canCalculate ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            You Need
          </h2>
          <p className="mt-2 text-5xl font-bold text-blue-600">
            {gallons} {gallons === 1 ? "gallon" : "gallons"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            of paint for your {lengthNum}&prime; &times; {widthNum}&prime; room
          </p>

          <div className="mt-6 space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Total wall area</span>
              <span className="font-medium">
                {wallArea.toLocaleString()} sq ft
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                Doors ({doorsNum} &times; 21 sq ft)
              </span>
              <span className="font-medium">&minus;{doorArea} sq ft</span>
            </div>
            <div className="flex justify-between">
              <span>
                Windows ({windowsNum} &times; 15 sq ft)
              </span>
              <span className="font-medium">&minus;{windowArea} sq ft</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span>Paintable area</span>
              <span className="font-medium">
                {paintableArea.toLocaleString()} sq ft
              </span>
            </div>
            <div className="flex justify-between">
              <span>&times; {coatsNum} coats</span>
              <span className="font-medium">
                {totalArea.toLocaleString()} sq ft total
              </span>
            </div>
            <div className="flex justify-between">
              <span>&divide; 350 sq ft/gallon</span>
              <span className="font-medium">
                {(totalArea / 350).toFixed(1)} gallons
              </span>
            </div>
          </div>

          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Tip: Consider buying an extra quart for future touch-ups. Textured
            or porous surfaces may require additional paint.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <p className="text-center text-sm text-gray-400">
            Enter room length and width to see your estimate.
          </p>
        </div>
      )}
    </div>
  );
}
