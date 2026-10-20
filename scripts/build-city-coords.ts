/**
 * Builds src/generated/city-coords.json for the private /admin/live map.
 *
 * GA4 realtime reports return city and country names but no coordinates, so
 * the server resolves them against this table. Key: "city|country" (lowercase,
 * diacritics stripped, country as GA4 spells it) -> [lat, lng]. Only places
 * with population >= 15000 are kept; the biggest city wins a name collision.
 *
 * Data: GeoNames (https://www.geonames.org), CC BY 4.0, via the
 * `all-the-cities` npm package (devDependency). No network is needed, but the
 * output is committed so builds do not depend on this script running.
 *
 * Run: npm run build-city-coords
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { normalizePlace } from "../src/lib/place-key";

const require = createRequire(import.meta.url);
const cities = require("all-the-cities") as {
  name: string;
  country: string;
  population: number;
  loc: { coordinates: [number, number] };
}[];

const names = new Intl.DisplayNames(["en"], { type: "region" });
// GA4 spells a few countries differently from CLDR.
const OVERRIDES: Record<string, string[]> = {
  HK: ["Hong Kong"],
  MO: ["Macao", "Macau"],
  TR: ["Turkey", "Türkiye"],
  CZ: ["Czechia", "Czech Republic"],
  MM: ["Myanmar (Burma)", "Myanmar"],
  CD: ["Congo - Kinshasa", "Congo (DRC)"],
  CG: ["Congo - Brazzaville"],
  PS: ["Palestine", "Palestinian Territories"],
  CI: ["Côte d’Ivoire", "Cote d'Ivoire"],
  SZ: ["Eswatini", "Swaziland"],
  MK: ["North Macedonia"],
  CV: ["Cape Verde", "Cabo Verde"],
};

const best = new Map<string, { pop: number; ll: [number, number] }>();
for (const c of cities) {
  if (c.population < 15000) continue;
  const label = names.of(c.country);
  if (!label || label === c.country) continue;
  const countries = [label, ...(OVERRIDES[c.country] ?? [])];
  const [lng, lat] = c.loc.coordinates;
  for (const country of countries) {
    // GA4 says "New York", GeoNames says "New York City".
    const cityNames = c.name === "New York City" ? [c.name, "New York"] : [c.name];
    for (const cityName of cityNames) {
      const key = `${normalizePlace(cityName)}|${normalizePlace(country)}`;
      const prev = best.get(key);
      if (!prev || c.population > prev.pop) {
        best.set(key, { pop: c.population, ll: [Math.round(lat * 100) / 100, Math.round(lng * 100) / 100] });
      }
    }
  }
}

const out: Record<string, [number, number]> = {};
for (const [k, v] of [...best.entries()].sort((a, b) => a[0].localeCompare(b[0]))) out[k] = v.ll;
mkdirSync("src/generated", { recursive: true });
writeFileSync("src/generated/city-coords.json", JSON.stringify(out));
console.log(`city-coords.json: ${Object.keys(out).length} keys`);
