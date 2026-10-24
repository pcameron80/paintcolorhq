// Parses what people type into site search into the parts the query layer
// needs: a brand, color codes, name text and a hex color.
//
// Built 2026-10-24 from GA4 color_search terms (180 days) and the catalog's
// color_number shapes. The raw ILIKE search it replaces returned nothing for
// "SW 7029", "oc17", "agreeable grey" and "sherwin williams alabaster", and a
// comma broke the PostgREST filter string (HTTP 500).
//
// Code parsing reuses color-number.ts (MP-20), which resolves stale color
// slugs: colorNumberCandidates supplies the brand shapes (PPG "90RR 63/139",
// Behr "PPH-31 (HISP)") and colorNumberQueryValues the case variants.

import { colorNumberCandidates, colorNumberQueryValues } from "./color-number";

export interface NormalizedSearch {
  // Cleaned query, lowercase, brand phrase kept. Used for undertone keywords.
  text: string;
  // Brand named at the start or end of the query, as a brand slug.
  brandSlug: string | null;
  // Color-code tokens as alphanumeric keys ("OC17", "PPH61HISP", "7029").
  codes: string[];
  // Exact spellings of those codes for alternate_numbers lookups ("OC-17").
  codeValues: string[];
  // Name text with the brand and codes removed ("agreeable grey").
  name: string;
  // ILIKE patterns for the name, without the surrounding % ("agreeable gr_y").
  nameTerms: string[];
  // A hex color in the query, "#rrggbb" lowercase.
  hex: string | null;
}

// Brand phrases recognized at the start or end of a query. Longest first so
// "sherwin williams" wins over "sherwin". A bare "farrow" is never a brand:
// Farrow's Cream is a Farrow & Ball color. "vista" alone is a word in names.
const BRAND_ALIASES: { re: string; slug: string }[] = [
  { re: "sherwin[\\s-]*williams?", slug: "sherwin-williams" },
  { re: "benjamin[\\s-]*moore", slug: "benjamin-moore" },
  { re: "farrow[\\s-]*(?:(?:and|n)[\\s-]*)?ball", slug: "farrow-ball" },
  { re: "dunn[\\s-]*edwards?", slug: "dunn-edwards" },
  { re: "dutch[\\s-]*boy", slug: "dutch-boy" },
  { re: "vista[\\s-]*paints?", slug: "vista-paint" },
  { re: "hirshfield'?s?", slug: "hirshfields" },
  { re: "colorhouse", slug: "colorhouse" },
  { re: "valspar", slug: "valspar" },
  { re: "glidden", slug: "ppg" },
  { re: "sherwin", slug: "sherwin-williams" },
  { re: "behr", slug: "behr" },
  { re: "kilz", slug: "kilz" },
  { re: "ppg", slug: "ppg" },
  { re: "ral", slug: "ral" },
  { re: "sw", slug: "sherwin-williams" },
  { re: "bm", slug: "benjamin-moore" },
];

// Letter prefixes that people type apart from the number ("HC 154", "de 6374")
// and that the catalog stores joined to it. All appear in color_number or
// alternate_numbers.
const CODE_PREFIXES = new Set([
  "hc", "oc", "af", "cc", "csp", "pm", "cw", "ac", "ow", "hdc", "ppu", "pph",
  "ppl", "ppf", "pmd", "pwn", "bxc", "bic", "bnc", "bwc", "icc", "qe", "dc",
  "de", "dew", "det", "dea", "dec", "debn", "defd", "degr", "dehw", "ci", "ce",
  "ecc",
]);

const RGB_RE =
  /^(rgb|rbg|hex)?\s*\(?\s*(\d{1,3})\s*([,\s])\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)?$/;

const MAX_QUERY_LENGTH = 80;

function toHex(n: number): string {
  return n.toString(16).padStart(2, "0");
}

function clean(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/&#8217;|&#39;|&rsquo;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/[\u2018\u2019\u02bc`]/g, "'")
    .replace(/[\u2010-\u2015\u2212\ufe58\ufe63\uff0d]/g, "-")
    .replace(/["*\\%_:;~|<>{}[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, MAX_QUERY_LENGTH);
}

// "#d6d0c4", "# B2A6AA" and "##869167" are explicit. A bare six-character
// token counts only with both a digit and a letter, so "facade" and "100100"
// stay text.
function extractHex(s: string): { hex: string | null; explicit: boolean; rest: string } {
  const explicit = s.match(/#+\s*([0-9a-f]{6})(?![0-9a-z])/);
  if (explicit) {
    return { hex: `#${explicit[1]}`, explicit: true, rest: s.replace(explicit[0], " ") };
  }
  const bare = s.match(/(?:^|[^0-9a-z])([0-9a-f]{6})(?![0-9a-z])/);
  if (bare && /\d/.test(bare[1]) && /[a-f]/.test(bare[1])) {
    return { hex: `#${bare[1]}`, explicit: false, rest: s };
  }
  return { hex: null, explicit: false, rest: s };
}

function stripBrand(s: string): { brandSlug: string | null; rest: string } {
  for (const { re, slug } of BRAND_ALIASES) {
    const lead = s.match(new RegExp(`^(?:${re})(?=[\\s-]|$)`));
    if (lead) return { brandSlug: slug, rest: s.slice(lead[0].length).replace(/^[\s-]+/, "") };
  }
  for (const { re, slug } of BRAND_ALIASES) {
    const trail = s.match(new RegExp(`(?:^|[\\s-])(?:${re})$`));
    if (trail) return { brandSlug: slug, rest: s.slice(0, s.length - trail[0].length).trim() };
  }
  return { brandSlug: null, rest: s };
}

export function codeKey(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Exact spellings for alternate_numbers, which stores "OC-117", "PM-19",
// "K-1040" and Hirshfield's bare "865". "oc17" also yields "OC-17", and
// "hc 154" yields "HC-154". colorNumberCandidates adds the brand shapes.
function codeSpellings(token: string): string[] {
  const out = new Set<string>();
  const upper = token.toUpperCase();
  out.add(upper);
  const m = upper.match(/^([A-Z]{1,4})-?(\d.*)$/);
  if (m) {
    out.add(`${m[1]}-${m[2]}`);
    out.add(`${m[1]}${m[2]}`);
  }
  const slug = token.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const c of colorNumberCandidates(`x-${slug}`)) {
    if (codeKey(c) === codeKey(upper)) out.add(c);
  }
  return colorNumberQueryValues([...out]);
}

// "grey" and "gray" are the same search; an apostrophe matches straight or
// curly; "farrows cream" also tries "farrow's cream".
function namePatterns(name: string): string[] {
  if (!name) return [];
  const base = name
    .replace(/\bgr[ae]y/g, "gr_y")
    .replace(/'/g, "_")
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (base.length < 2) return [];
  const out = [base];
  if (!name.includes("'")) {
    const words = base.split(" ");
    const i = words.findIndex((w, idx) => idx < words.length - 1 && w.length >= 4 && /[a-z]s$/.test(w));
    if (i >= 0) {
      const w = words[i];
      out.push([...words.slice(0, i), `${w.slice(0, -1)}_s`, ...words.slice(i + 1)].join(" "));
    }
  }
  return out;
}

export function normalizeSearchQuery(raw: string): NormalizedSearch {
  let s = clean(raw ?? "");
  const empty: NormalizedSearch = {
    text: "", brandSlug: null, codes: [], codeValues: [], name: "", nameTerms: [], hex: null,
  };

  // RGB triplet: "rgb(240,236,228)", "239, 80, 122". Needs a prefix or a
  // comma so a space-separated list of numbers stays a code search.
  const rgb = s.match(RGB_RE);
  if (rgb && (rgb[1] || rgb[3] === ",")) {
    const parts = [rgb[2], rgb[4], rgb[5]].map(Number);
    if (parts.every((p) => p <= 255)) {
      return { ...empty, text: s, hex: `#${parts.map(toHex).join("")}` };
    }
  }

  // Comma lists: search the first entry that has 2+ characters.
  if (s.includes(",")) {
    s = s.split(",").map((p) => p.trim()).find((p) => p.length >= 2) ?? "";
  }
  s = s.replace(/^(?:hex|rgb)\s+(?=#|[0-9a-f]{6}\b)/, "");
  if (!s) return empty;

  const { hex, explicit, rest: afterHex } = extractHex(s);
  const text = s.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  const { brandSlug: leadBrand, rest } = stripBrand(afterHex.replace(/[()&]/g, " ").replace(/\s+/g, " ").trim());
  let brandSlug = leadBrand;

  const tokens = rest.split(/\s+/).filter((t) => t && t !== "-" && t !== "#");
  const codeTokens: string[] = [];
  const nameTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i].replace(/^#+/, "").replace(/^-+|-+$/g, "");
    if (!t) continue;
    const next = tokens[i + 1]?.replace(/-+$/, "");
    // "sw 7029", "sw7029", "sw-7029": Sherwin-Williams numbers carry no prefix
    // in the catalog.
    const sw = t.match(/^sw-?(\d{3,4})$/);
    if (sw) {
      brandSlug ??= "sherwin-williams";
      codeTokens.push(sw[1]);
      continue;
    }
    if (t === "sw" && next && /^\d{3,4}$/.test(next)) {
      brandSlug ??= "sherwin-williams";
      continue;
    }
    // "ppg 1095-4": PPG stores both "1095-4" and "PPG1095-4".
    if (t === "ppg" && next && /^\d/.test(next)) {
      brandSlug ??= "ppg";
      continue;
    }
    // "hc 154", "de 6374", "oc- 17": join the prefix to the number.
    if (CODE_PREFIXES.has(t) && next && /^\d/.test(next)) {
      t = `${t}-${next}`;
      i++;
    }
    if (/\d/.test(t)) {
      // Behr's Hispanic line: "pph-61 hisp" is "PPH-61 (HISP)".
      if (tokens[i + 1] === "hisp") {
        t = `${t} (hisp)`;
        i++;
      }
      codeTokens.push(t);
    } else if (t !== "hisp" || codeTokens.length === 0) {
      nameTokens.push(t);
    }
  }

  // An explicit hex is not also a code. A bare one ("defd39") stays both.
  const codesIn = codeTokens.filter((t) => !(explicit && hex && `#${t}` === hex));
  const codes: string[] = [];
  const codeValues = new Set<string>();
  // Codes with a space inside ("90rr 63/139" for PPG) are tried whole first.
  if (codesIn.length > 1) codes.push(codeKey(codesIn.join("")));
  for (const t of codesIn) {
    const k = codeKey(t);
    if (k && !codes.includes(k)) codes.push(k);
    for (const v of codeSpellings(t)) codeValues.add(v);
    if (brandSlug === "ppg" && /^\d{4}-\d$/.test(t)) {
      if (!codes.includes(`PPG${k}`)) codes.push(`PPG${k}`);
      codeValues.add(`PPG${t}`);
    }
  }

  const name = nameTokens.join(" ").replace(/^[\s-]+|[\s-]+$/g, "");
  return {
    text,
    brandSlug,
    codes,
    codeValues: [...codeValues].filter((v) => /^[A-Za-z0-9-]+$/.test(v)),
    name,
    nameTerms: namePatterns(name),
    hex,
  };
}

// POSIX regex for color_number that ignores case and any separators, so
// "hdcnt11" matches "HDC-NT-11" and "90rr 63 139" matches "90RR 63/139".
// Anchored for exact hits; unanchored for partial codes like "de637".
export function codeRegex(key: string, anchored: boolean): string {
  const body = key.toLowerCase().split("").join("[^a-z0-9]*");
  return anchored ? `^[^a-z0-9]*${body}[^a-z0-9]*$` : body;
}

// Value safe inside a double-quoted PostgREST filter value.
export function pgQuote(v: string): string {
  return `"${v.replace(/["\\]/g, "")}"`;
}
