/**
 * Pure helpers for the content color-fact audit. No I/O — unit-tested with fixtures.
 *
 * Content files quote color data by hand: Swatch hexes, printed LRVs, "hex #..."
 * in editorial, and cross-brand match claims ("Behr X is nearly identical").
 * When the DB changes underneath them (a swatch correction, a published-LRV
 * update), those quotes go stale silently. This module finds them.
 *
 * What it checks, per content file (auditText):
 *   - every <Swatch hex href> hex against the DB hex for that href     (error)
 *   - every /colors/<brand>/<slug> href resolves, and is not archived   (error / warn)
 *   - a /colors/ href to a row the brand's palette scan never saw       (warn)
 *   - a printed LRV right after a Swatch: "(OC-20, LRV 68.6)",
 *     "— No. 281, LRV 10", or a table "(68.6)"                          (warn)
 *   - a fact parenthetical "(…, LRV n, #hex)" about the color it follows:
 *     a Swatch or Link within about 80 characters, or a named color
 *     resolved by its code ("Alabaster SW 7008 (LRV 82, #EDEAE0)",
 *     "Pale Oak (OC-20, LRV 68.6)") or by a name only one brand uses
 *     ("Baja Dunes (LRV 41)")                                     (hex error / LRV warn)
 *   - keyed editorial: the "<Name> is hex #… with an estimated LRV of …"
 *     opener, and "at LRV n" / "LRV of n" in any sentence that names no
 *     other color before the number                              (hex error / LRV warn)
 *   - match claims: a named match's closeness label vs CIEDE2000 from
 *     current hexes, and "closest" claims vs the brand's actual nearest (warn)
 *   - optionally, any reference to a color in a --changed backup set    (info)
 * There is no general "any hex anywhere" check: a hex is only compared when the
 * audit can tell which color it describes.
 *
 * Separate passes:
 *   - auditBrandCounts: "N brands" / "X, Y & N more brands" copy vs the brand count
 *   - auditCatalogRows: DB-side implausibilities (LRV range, null undertone,
 *     entity or mis-cased names, brand count vs BRAND_COUNT)
 *   - auditLightestWhites: src/data/lightest-whites.ts rows vs the DB and the
 *     brand's palette feed
 *
 * Closeness labels come from src/lib/closeness.ts, the site's only vocabulary.
 */
import { closenessLabel, type ClosenessLabel } from "../../src/lib/closeness.ts";

export interface Lab {
  L: number;
  a: number;
  b: number;
}

export interface AuditColor {
  id: string;
  brandSlug: string;
  brandName: string;
  slug: string;
  name: string;
  code: string;
  hex: string;
  lrv: number | null;
  archived: boolean;
  lab: Lab;
  /** null when the importer never computed one; undefined when not loaded (fixtures). */
  undertone?: string | null;
  /** Date the brand's palette scan last saw this row; null = never seen. */
  lastSeenLive?: string | null;
}

export type Severity = "error" | "warn" | "info";
export type FindingKind =
  | "stale-hex"
  | "broken-link"
  | "archived-link"
  | "stale-lrv"
  | "closeness-label"
  | "not-closest"
  | "banned-label"
  | "changed-color"
  | "not-live-link"
  | "brand-count"
  | "lrv-range"
  | "null-undertone"
  | "name-mechanics"
  | "whites-data";

export interface Finding {
  file: string;
  line: number;
  severity: Severity;
  kind: FindingKind;
  message: string;
}

/** Brand slug → how copy refers to it. Longest aliases first so "Farrow & Ball" beats nothing shorter. */
export const BRAND_ALIASES: Record<string, string[]> = {
  "benjamin-moore": ["Benjamin Moore", "BM"],
  "sherwin-williams": ["Sherwin-Williams", "SW"],
  behr: ["Behr", "BEHR"],
  ppg: ["PPG"],
  valspar: ["Valspar"],
  "dunn-edwards": ["Dunn-Edwards", "Dunn Edwards"],
  "dutch-boy": ["Dutch Boy"],
  "farrow-ball": ["Farrow & Ball", "F&B"],
  kilz: ["Kilz", "KILZ"],
  "vista-paint": ["Vista Paint", "Vista"],
  colorhouse: ["Colorhouse"],
  hirshfields: ["Hirshfield's", "Hirshfields"],
  ral: ["RAL"],
};

const LABELS: ClosenessLabel[] = ["Nearly identical", "Very similar", "Visible difference"];
/** Wording CLAUDE.md bans as a closeness label. */
const BANNED = /\b(virtually identical|near-identical|exact match|close match|same family)\b/i;
const CLOSEST = /\b(closest|nearest|twins?)\b/i;
const LOOSE_CLOSE = /\b(close behind|close second|lands close|close cross-brand|are both close|is close|close to)\b/i;
/** Words between a brand and the color name: "its closest Behr match is Shy Green". */
const FILLER = new Set(["match", "matches", "equivalent", "equivalents", "twin", "is", "are", "its", "closest", "nearest", "color", "pick", "alternative"]);

export function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/&apos;|&#x27;|&#39;|[’']/g, "")
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9&]+/g, " ")
    .trim();
}

export function decode(s: string): string {
  return s
    .replace(/&apos;|&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/’/g, "'");
}

/** Codes as copy writes them ("SW 7008", "No. 281", "0852") folded to the DB's form. */
export function normCode(s: string): string {
  return s
    .toUpperCase()
    .replace(/^\s*(?:SW|NO\.?)\s*/, "")
    .replace(/\s+/g, "")
    .replace(/^0+(?=\d)/, "");
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  (m.get(k) ?? m.set(k, []).get(k)!).push(v);
}

export class Catalog {
  readonly byRef = new Map<string, AuditColor>();
  private readonly byBrandName = new Map<string, AuditColor[]>();
  private readonly byBrand = new Map<string, AuditColor[]>();
  private readonly byName = new Map<string, AuditColor[]>();
  private readonly byCodeMap = new Map<string, AuditColor[]>();
  /** Brands whose palette scan stamps lastSeenLive; only these can have "not live" rows. */
  private readonly scanned = new Set<string>();
  private readonly bestCache = new Map<string, { color: AuditColor; deltaE: number } | null>();

  constructor(
    colors: AuditColor[],
    private readonly deltaE: (a: Lab, b: Lab) => number,
  ) {
    for (const c of colors) {
      this.byRef.set(`${c.brandSlug}/${c.slug}`, c);
      push(this.byBrandName, `${c.brandSlug}|${normName(c.name)}`, c);
      push(this.byBrand, c.brandSlug, c);
      push(this.byName, normName(c.name), c);
      if (c.code) push(this.byCodeMap, normCode(c.code), c);
      if (c.lastSeenLive) this.scanned.add(c.brandSlug);
    }
  }

  /** Non-archived colors with this code, in any brand. */
  byCode(code: string): AuditColor[] {
    return (this.byCodeMap.get(normCode(code)) ?? []).filter((c) => !c.archived);
  }

  /** Non-archived colors with this exact name, in any brand. */
  namedAnywhere(name: string): AuditColor[] {
    return (this.byName.get(normName(name)) ?? []).filter((c) => !c.archived);
  }

  /** In a brand with a palette scan, but the scan never saw this row. */
  notLive(c: AuditColor): boolean {
    return this.scanned.has(c.brandSlug) && c.lastSeenLive == null;
  }

  de(a: AuditColor, b: AuditColor): number {
    return this.deltaE(a.lab, b.lab);
  }

  /** Colors named `name` in `brand`; a name can repeat (e.g. "Armadillo" N230-3 and a "-2" row). */
  named(brand: string, name: string): AuditColor[] {
    return this.byBrandName.get(`${brand}|${normName(name)}`) ?? [];
  }

  /** Among same-named rows, the one a reader most plausibly means relative to `subject`. */
  resolve(brands: string[], name: string, subject?: AuditColor): AuditColor | undefined {
    const cands = brands.flatMap((b) => this.named(b, name)).filter((c) => !c.archived);
    if (cands.length <= 1 || !subject) return cands[0];
    return cands.reduce((best, c) => (this.de(subject, c) < this.de(subject, best) ? c : best));
  }

  /** Nearest non-archived color in `brand` to `subject`, excluding the subject itself. */
  best(subject: AuditColor, brand: string): { color: AuditColor; deltaE: number } | null {
    const key = `${subject.id}|${brand}`;
    if (this.bestCache.has(key)) return this.bestCache.get(key)!;
    let out: { color: AuditColor; deltaE: number } | null = null;
    for (const c of this.byBrand.get(brand) ?? []) {
      if (c.archived || c.id === subject.id) continue;
      const d = this.de(subject, c);
      if (!out || d < out.deltaE) out = { color: c, deltaE: d };
    }
    this.bestCache.set(key, out);
    return out;
  }

  hasBrand(brand: string): boolean {
    return this.byBrand.has(brand);
  }
}

// ---------- text segmentation ----------

interface Item {
  kind: "swatch" | "link" | "name";
  color: AuditColor;
  pos: number; // offset in the unit's plain text
  end: number;
}

interface Unit {
  raw: string;
  start: number; // offset in the file
}

function lineAt(starts: number[], offset: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

const BLOCK = /<\/?(?:p|li|h[1-6]|div|ul|ol|table|thead|tbody|section|blockquote)\b[^>]*>|\n\s*\n|\n(?=\s*[A-Za-z_]+:\s)/g;

/** Split a block of text into sentences, keeping offsets. JSX tags stay inside their sentence. */
function sentences(raw: string, start: number): Unit[] {
  const out: Unit[] = [];
  const re = /[.!?](?:&quot;|")?(?=\s+(?:[A-Z<{]|&quot;))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    // don't split inside a tag (e.g. a decimal or "No." inside attributes)
    const before = raw.slice(last, m.index + 1);
    if ((before.match(/</g) ?? []).length > (before.match(/>/g) ?? []).length) continue;
    out.push({ raw: before, start: start + last });
    last = m.index + m[0].length;
  }
  if (raw.slice(last).trim()) out.push({ raw: raw.slice(last), start: start + last });
  return out;
}

/** Turn a unit's JSX into plain text, collecting Swatch/Link color refs and placeholder positions. */
function flatten(raw: string, cat: Catalog) {
  const items: Item[] = [];
  let plain = "";
  const tagRe = /<Swatch\b[^>]*\/?>|<Link\b[^>]*href="(\/colors\/[^"]+)"[^>]*>([\s\S]*?)<\/Link>|<[^>]+>|\{"\s*"\}|\{" "\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(raw))) {
    plain += decode(raw.slice(last, m.index));
    last = m.index + m[0].length;
    const tag = m[0];
    if (tag.startsWith("<Swatch")) {
      const href = tag.match(/href="\/colors\/([^/"]+)\/([^/"]+)"/);
      const c = href ? cat.byRef.get(`${href[1]}/${href[2]}`) : undefined;
      const name = tag.match(/name="([^"]*)"/)?.[1] ?? "";
      const mark = ` ⟦${items.length}⟧ `;
      if (c) items.push({ kind: "swatch", color: c, pos: plain.length, end: plain.length + mark.length });
      plain += c ? mark : ` ${decode(name)} `;
    } else if (m[1]) {
      const ref = m[1].match(/^\/colors\/([^/]+)\/([^/]+)\/?$/);
      const c = ref && ref[1] !== "family" ? cat.byRef.get(`${ref[1]}/${ref[2]}`) : undefined;
      const mark = ` ⟦${items.length}⟧ `;
      if (c) items.push({ kind: "link", color: c, pos: plain.length, end: plain.length + mark.length });
      plain += c ? mark : ` ${decode(m[2].replace(/<[^>]+>/g, ""))} `;
    } else plain += " ";
  }
  plain += decode(raw.slice(last));
  return { plain, items };
}

const SMALL = new Set(["of", "the", "and", "in", "a", "my", "on", "to", "at", "de", "la", "le", "by"]);
const ALIAS_STARTS = new Set(Object.values(BRAND_ALIASES).flat().map((a) => a.split(" ")[0]));

/** The capitalized phrase at the start of `s`: "Shy Green (MQ3-48)" → "Shy Green",
 *  "Back to Nature is" → "Back to Nature". Small words count only between capitalized ones. */
export function nameRun(s: string): string {
  const toks = s.match(/^[^\s,;:()⟦]+(?:\s+[^\s,;:()⟦]+){0,7}/)?.[0].split(/\s+/) ?? [];
  const cap = (t: string) => /^[A-Z0-9][\w'&.-]*$/.test(t.replace(/[.,;:!?]+$/, ""));
  const out: string[] = [];
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    // a brand name starts the next mention: "Bee's Knees and PPG Sandy Beach"
    if (out.length && ALIAS_STARTS.has(t)) {
      if (SMALL.has(out[out.length - 1].toLowerCase())) out.pop();
      break;
    }
    if (cap(t)) out.push(t);
    else if (out.length && SMALL.has(t.toLowerCase()) && toks[k + 1] && cap(toks[k + 1])) out.push(t);
    else break;
    if (/[.,;:!?]$/.test(t)) break;
  }
  return out.join(" ").replace(/[.,;:!?]+$/, "");
}

/** Find brand-qualified color names in plain text: "Behr Shy Green", "its SW match Simple Stone". */
function namedMentions(plain: string, cat: Catalog, subject: AuditColor | undefined): Item[] {
  const out: Item[] = [];
  for (const [brand, aliases] of Object.entries(BRAND_ALIASES)) {
    if (!cat.hasBrand(brand)) continue;
    for (const alias of aliases) {
      const re = new RegExp(`(?<![\\w-])${alias.replace(/[.*+?^${}()|[\]\\&]/g, "\\$&")}(?:'s)?\\s+`, "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(plain))) {
        let i = m.index + m[0].length;
        let words = plain.slice(i).split(/(\s+)/);
        // skip filler words ("match is", "equivalent is")
        let skipped = 0;
        while (words.length > 1 && FILLER.has(words[0].toLowerCase().replace(/[^a-z]/g, "")) && skipped < 4) {
          i += words[0].length + (words[1]?.length ?? 0);
          words = words.slice(2);
          skipped++;
        }
        // The whole capitalized phrase must name the color. Falling back to a shorter
        // prefix turns "Nimbus Gray" (not in the DB) into an unrelated "Nimbus".
        const cand = nameRun(plain.slice(i));
        const c = cand ? cat.resolve([brand], cand, subject) : undefined;
        if (c) out.push({ kind: "name", color: c, pos: m.index, end: i + cand.length });
      }
    }
  }
  // An alias inside a longer one ("BM" inside nothing, but "Vista" inside "Vista Paint") can double-count.
  return out
    .sort((a, b) => a.pos - b.pos || b.end - a.end)
    .filter((it, k, arr) => k === 0 || it.pos >= arr[k - 1].end || it.color.id !== arr[k - 1].color.id);
}

function labelsIn(s: string): { label: ClosenessLabel; pos: number }[] {
  const out: { label: ClosenessLabel; pos: number }[] = [];
  for (const l of LABELS) {
    const re = new RegExp(l, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) out.push({ label: l, pos: m.index });
  }
  return out.sort((a, b) => a.pos - b.pos);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lrvOk(printed: string, actual: number, approx: boolean): boolean {
  const p = Number(printed);
  const decimals = printed.includes(".") ? printed.split(".")[1].length : 0;
  if (approx) return Math.abs(actual - p) <= 1;
  if (decimals === 0) return Math.abs(actual - p) <= 0.5 + 1e-9;
  return Math.abs(actual - p) <= 0.5 * 10 ** -decimals + 1e-9;
}

function fmtLrv(actual: number, printed: string): string {
  const decimals = printed.includes(".") ? printed.split(".")[1].length : 0;
  return actual.toFixed(decimals);
}

const label = (c: AuditColor) => `${c.brandName} ${c.name}${c.code ? ` ${c.code}` : ""}`;

/** Words that mark a printed LRV as approximate: "LRV ~10", "LRV about 10". */
const APPROX = String.raw`(~|(?:about|around|roughly|approximately|approx\.?)\s+)?`;
/** A printed LRV; never the start of a range ("LRV 6-12" states no single value). */
const NUM = String.raw`(\d+(?:\.\d+)?)(?!\s*[–-]\s*\d|\d|\.\d)`;

interface Facts {
  /** `published`: the copy cites the maker's value ("published LRV 93.5"), which a hex-computed DB LRV may not match. */
  lrv?: { printed: string; approx: boolean; published: boolean };
  hex?: string;
}

/** LRV and hex inside one parenthetical: "(BM, LRV 82, #EEECE1)", "(LRV 60, warm undertone, hex #D1CBC1)".
 *  A parenthetical comparing two values ("LRV 60 vs 58", two hexes) states no single fact. */
function parseFacts(inner: string): Facts | null {
  const lrvs = [...inner.matchAll(new RegExp(String.raw`(\bpublished\s+)?\bLRV\s*(?:of\s+)?${APPROX}${NUM}`, "gi"))];
  const hexes = [...inner.matchAll(/#[0-9a-fA-F]{6}\b/g)];
  if (lrvs.length > 1 || hexes.length > 1 || (!lrvs.length && !hexes.length)) return null;
  if (/\b(?:vs\.?|versus|against|compared)\b/i.test(inner)) return null;
  const f: Facts = {};
  if (lrvs[0]) f.lrv = { printed: lrvs[0][3], approx: Boolean(lrvs[0][2]), published: Boolean(lrvs[0][1]) };
  if (hexes[0]) f.hex = hexes[0][0];
  return f;
}

const aliasToBrand = new Map(Object.entries(BRAND_ALIASES).flatMap(([slug, al]) => al.map((a) => [a.toLowerCase(), slug] as const)));
const brandOf = (s: string) => aliasToBrand.get(s.trim().replace(/'s$/, "").toLowerCase());

/** The color a "Name CODE (…)" / "Name (CODE, …)" / "Brand Name (…)" list item names, if certain.
 *  `pre` is the text right before the "(", `inner` the parenthetical's content. */
export function resolveListItem(pre: string, inner: string, cat: Catalog): AuditColor[] | undefined {
  const toks = pre.replace(/\s+$/, "").split(/\s+/).filter(Boolean);
  if (!toks.length) return undefined;
  const segs = inner.split(",").map((s) => s.trim());
  const brand = segs.map(brandOf).find(Boolean);
  const endsWithName = (words: string[], c: AuditColor) => {
    const n = normName(c.name);
    const w = normName(words.join(" "));
    return n.length > 0 && (w === n || w.endsWith(` ${n}`));
  };
  // 1. code inside the parenthetical, name right before it: "Pale Oak (OC-20, LRV 68.6)"
  for (const seg of segs.slice(0, 2)) {
    if (brandOf(seg) || /LRV|#/.test(seg)) continue;
    const hits = cat.byCode(seg).filter((c) => endsWithName(toks, c) && (!brand || c.brandSlug === brand));
    if (hits.length) return hits;
  }
  // 2. code at the end of the name: "Alabaster SW 7008 (LRV 82, …)", "Soft Candlelight 61YY 89/135 (…)"
  for (let k = Math.min(3, toks.length - 1); k >= 1; k--) {
    const code = toks.slice(-k).join(" ");
    if (!/\d/.test(code)) continue;
    const hits = cat.byCode(code).filter((c) => endsWithName(toks.slice(0, -k), c) && (!brand || c.brandSlug === brand));
    if (hits.length) return hits;
  }
  // 3. name only, longest capitalized suffix first: "Baja Dunes (LRV 41)", "Ultra Pure White (Behr, …)".
  // Every word but small ones must be capitalized ("Muted sage (LRV 45)" describes a hex, not
  // Behr Muted Sage), and a one-word name needs a brand ("Greens (LRV 6)" is a heading).
  for (let k = Math.min(6, toks.length); k >= 1; k--) {
    const words = toks.slice(-k);
    if (!words.every((w, i) => /^[A-Z0-9]/.test(w) || (i > 0 && SMALL.has(w.toLowerCase())))) continue;
    const before = brandOf(toks[toks.length - k - 1] ?? "") ?? brandOf(toks.slice(-k - 2, -k).join(" "));
    const b = brand ?? before;
    if (k === 1 && !b) continue;
    const hits = cat.namedAnywhere(words.join(" ")).filter((c) => !b || c.brandSlug === b);
    if (!hits.length) continue;
    // Without a brand, the name must belong to one brand only.
    if (new Set(hits.map((c) => c.brandSlug)).size > 1) return undefined;
    return hits;
  }
  return undefined;
}

export interface AuditOptions {
  /** Color ids changed in a recent correction; references get an info finding for human review. */
  changedIds?: Set<string>;
  /** Max ΔE a named match may sit above the brand's nearest before a "closest" claim is flagged. */
  closestSlack?: number;
}

/** Audit one content file. `editorialKeyed` files map "brand/slug": (...) entries to a subject color. */
export function auditText(file: string, text: string, cat: Catalog, opts: AuditOptions = {}): Finding[] {
  const findings: Finding[] = [];
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") starts.push(i + 1);
  const lineOf = (o: number) => lineAt(starts, o);
  const add = (offset: number, severity: Severity, kind: FindingKind, message: string) =>
    findings.push({ file, line: lineOf(offset), severity, kind, message });
  const slack = opts.closestSlack ?? 1;

  // 1. Every Swatch hex and every /colors/ href, file-wide.
  const swatchRe = /<Swatch\b[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = swatchRe.exec(text))) {
    const hex = m[0].match(/hex="(#[0-9a-fA-F]{6})"/)?.[1];
    const href = m[0].match(/href="\/colors\/([^/"]+)\/([^/"]+)"/);
    if (!href || href[1] === "family") continue;
    const c = cat.byRef.get(`${href[1]}/${href[2]}`);
    if (!c) continue; // reported by the href pass below
    if (hex && hex.toLowerCase() !== c.hex.toLowerCase())
      add(m.index, "error", "stale-hex", `Swatch for ${label(c)} shows ${hex}; DB has ${c.hex}`);
  }
  const hrefRe = /href="\/colors\/([^/"]+)\/([^/"#?]+)\/?"/g;
  while ((m = hrefRe.exec(text))) {
    if (m[1] === "family") continue;
    const c = cat.byRef.get(`${m[1]}/${m[2]}`);
    if (!c) add(m.index, "error", "broken-link", `/colors/${m[1]}/${m[2]} is not in the DB`);
    else if (c.archived) add(m.index, "warn", "archived-link", `/colors/${m[1]}/${m[2]} links an archived color`);
    else if (cat.notLive(c))
      add(m.index, "warn", "not-live-link", `/colors/${m[1]}/${m[2]} (${label(c)}) was not in ${c.brandName}'s last palette scan`);
  }

  // 2. Units: table rows, then prose blocks split into sentences.
  const rows: Unit[] = [];
  const masked = text.replace(/<tr\b[\s\S]*?<\/tr>/g, (s, off: number) => {
    rows.push({ raw: s, start: off });
    return " ".repeat(s.length);
  });
  const tableHeads = new Map<number, string[][]>(); // row start → per-column brand slugs
  const headRe = /<thead\b[\s\S]*?<\/thead>[\s\S]*?<\/table>/g;
  while ((m = headRe.exec(text))) {
    const ths = [...m[0].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map((t) => decode(t[1]));
    const cols = ths.map((t) =>
      Object.entries(BRAND_ALIASES)
        .filter(([, al]) => al.some((a) => new RegExp(`(?<![\\w-])${a.replace(/[&]/g, "\\&")}(?![\\w-])`).test(t)))
        .map(([slug]) => slug),
    );
    tableHeads.set(m.index, cols);
  }
  const headFor = (off: number) => {
    let best: string[][] | undefined;
    let bestStart = -1;
    for (const [s, cols] of tableHeads) if (s <= off && s > bestStart) [best, bestStart] = [cols, s];
    return best;
  };

  // editorial entries: "brand/slug": ( ... ),
  const keyed: { start: number; end: number; color?: AuditColor }[] = [];
  const keyRe = /^\s*"([a-z0-9-]+\/[a-z0-9-]+)":\s*\(/gm;
  const keyHits = [...text.matchAll(keyRe)];
  keyHits.forEach((k, i) =>
    keyed.push({ start: k.index!, end: keyHits[i + 1]?.index ?? text.length, color: cat.byRef.get(k[1]) }),
  );
  const keyFor = (off: number) => keyed.find((k) => off >= k.start && off < k.end)?.color;

  const blocks: Unit[] = [];
  let lastB = 0;
  BLOCK.lastIndex = 0;
  while ((m = BLOCK.exec(masked))) {
    blocks.push({ raw: masked.slice(lastB, m.index), start: lastB });
    lastB = m.index + m[0].length;
  }
  blocks.push({ raw: masked.slice(lastB), start: lastB });

  const checkUnit = (u: Unit, carried: AuditColor | undefined, cell?: { brands: string[]; subject?: AuditColor }) => {
    const { plain, items } = flatten(u.raw, cat);
    const key = keyFor(u.start);
    const swatches = items.filter((i) => i.kind === "swatch");
    const subject = cell?.subject ?? swatches[0]?.color ?? (items.length === 0 ? key : undefined) ?? key ?? carried;
    const mentions = [...items, ...namedMentions(plain, cat, subject)]
      .filter((i) => !(i.kind === "swatch" && i.color.id === subject?.id && i === swatches[0]))
      .sort((a, b) => a.pos - b.pos);

    if (BANNED.test(plain) && mentions.length) add(u.start, "warn", "banned-label", `Uses banned closeness wording: "${plain.match(BANNED)![0]}"`);

    const staleLrv = (c: AuditColor, printed: string) =>
      add(u.start, "warn", "stale-lrv", `${label(c)}: printed LRV ${printed}, DB has ${fmtLrv(c.lrv!, printed)}`);

    // printed LRV right after a Swatch: "(OC-20, LRV 68.6)", "— 4009-7, LRV 6.5",
    // "— No. 281, LRV about 10", or a table "(68.6)"
    const swatchLrv = new RegExp(
      String.raw`^\s*\((?:[^()]{0,24},\s*)?LRV\s*${APPROX}\s*${NUM}\s*[,)]|^\s*[—-]\s*(?:No\.\s*)?[^.⟦]{0,30}?LRV\s*${APPROX}${NUM}|^\s*\(${NUM}\)`,
      "i",
    );
    for (const s of swatches) {
      const after = plain.slice(s.end, s.end + 80).split(/⟦/)[0];
      const lm = after.match(swatchLrv);
      if (!lm || s.color.lrv == null) continue;
      const printed = lm[2] ?? lm[4] ?? lm[5];
      if (!lrvOk(printed, s.color.lrv, Boolean(lm[1] ?? lm[3]))) staleLrv(s.color, printed);
    }

    // Fact parentheticals: "(…, LRV n, #hex)". Attribute each to the color it names
    // ("Alabaster SW 7008 (…)", "Pale Oak (OC-20, …)", "Baja Dunes (LRV 41)") or, failing
    // that, to a Swatch/Link right before it ("<Link>Agreeable Gray SW 7029</Link> (LRV 60, hex #D1CBC1)").
    // Parentheticals that only name a color ("Edgecomb Gray (HC-173)") are kept as mentions.
    const parenNamed: { pos: number; colors: AuditColor[] }[] = [];
    for (const pm of plain.matchAll(/\(([^()]{1,100})\)/g)) {
      const open = pm.index!;
      const facts = parseFacts(pm[1]);
      if (!facts && !/\d/.test(pm[1])) continue;
      const window = plain.slice(Math.max(0, open - 80), open);
      const pre = window.split(/⟦\d+⟧/).pop()!.split(/[.;:!?](?:\s|$)|[—≈]|&#8776;/).pop()!;
      let cands = resolveListItem(pre, pm[1], cat);
      if (cands) parenNamed.push({ pos: open, colors: cands });
      if (!facts) continue;
      if (!cands) {
        const marker = [...window.matchAll(/⟦(\d+)⟧/g)].pop();
        const gap = marker ? window.slice(marker.index! + marker[0].length) : "";
        const it = marker ? items[Number(marker[1])] : undefined;
        if (it && /^[^A-Z.;:()]{0,40}$/.test(gap)) cands = [it.color];
      }
      if (!cands?.length) continue;
      const c = cands[0];
      if (facts.hex && !cands.some((x) => x.hex.toLowerCase() === facts.hex!.toLowerCase()))
        add(u.start, "error", "stale-hex", `${label(c)} printed as ${facts.hex}; DB has ${c.hex}`);
      const lrv = facts.lrv;
      if (lrv && c.lrv != null && !cands.some((x) => x.lrv != null && lrvOk(lrv.printed, x.lrv, lrv.approx))) {
        if (lrv.published)
          add(u.start, "info", "stale-lrv", `${label(c)}: copy cites published LRV ${lrv.printed}; DB has ${fmtLrv(c.lrv, lrv.printed)}`);
        else staleLrv(c, lrv.printed);
      }
    }
    // editorial prose about the keyed color
    if (key && subject?.id === key.id && !swatches.length) {
      // Only the canonical opener ("Pale Oak (OC-20) is hex #… with an estimated LRV of …") is
      // certainly about the keyed color; other sentences quote neighbors
      // ("Against Iron Ore (SW 7069, LRV 5.6), …", "Benjamin Moore Natural Linen is hex …").
      const opener = new RegExp(
        `^\\s*(?:${escapeRe(decode(key.name))}|It)\\b[^.]{0,40}?\\bis hex (#[0-9a-fA-F]{6})(?:[^.]*?\\bestimated LRV of (~)?(\\d+(?:\\.\\d+)?))?`,
        "i",
      );
      const om = plain.match(opener);
      if (om && om[1].toLowerCase() !== key.hex.toLowerCase())
        add(u.start, "error", "stale-hex", `${label(key)} described as hex ${om[1]}; DB has ${key.hex}`);
      if (om?.[3] && key.lrv != null && !lrvOk(om[3], key.lrv, Boolean(om[2]))) staleLrv(key, om[3]);
      // "at LRV 8 it's deep", "an LRV of 48": about the keyed color unless another color is named
      // earlier in the sentence (by link, brand + name, or "Name (CODE)"). Parentheticals were
      // handled above.
      if (key.lrv != null) {
        const re = new RegExp(String.raw`\b(?:at\s+(?:an?\s+)?(?:estimated\s+)?LRV(?:\s+of)?|LRV\s+of)\s*${APPROX}${NUM}`, "gi");
        for (const lm of plain.matchAll(re)) {
          const pos = lm.index!;
          if (/\([^()]*$/.test(plain.slice(0, pos))) continue; // inside a parenthetical
          const other =
            mentions.some((x) => x.pos < pos && x.color.id !== key.id) ||
            parenNamed.some((p) => p.pos < pos && !p.colors.some((c) => c.id === key.id));
          if (!other && !lrvOk(lm[2], key.lrv, Boolean(lm[1]))) staleLrv(key, lm[2]);
        }
      }
    }

    if (subject && opts.changedIds?.has(subject.id) && swatches[0]?.color.id === subject.id)
      add(u.start, "info", "changed-color", `Describes ${label(subject)}, whose swatch changed; check descriptive copy`);
    if (!subject || mentions.length === 0) return subject;
    const labels = labelsIn(plain);
    // Mentions joined by "and"/"or"/a comma (codes in parentheses allowed) share one predicate:
    // "Behr Bee's Knees (T13-11) and PPG Sandy Beach are its closest twins".
    const joined = (j: number) =>
      Boolean(mentions[j + 1]) &&
      /^\s*(?:,|and|or|, and|, or)\s*$/i.test(plain.slice(mentions[j].end, mentions[j + 1].pos).replace(/\([^)]*\)/g, ""));
    mentions.forEach((it, k) => {
      if (it.color.id === subject.id) return;
      const d = cat.de(subject, it.color);
      const actual = closenessLabel(d);
      let last = k;
      while (joined(last)) last++;
      const tailEnd = mentions[last].end;
      // The label for this mention, most specific first: one in its own stretch of text; one right
      // before it ("a nearly identical match for <X>", "very similar to <X>"); else the one after
      // the last mention it is joined to ("A and B are both …") — never across "with B very similar".
      let own = labels.find((l) => l.pos > it.pos && l.pos < (mentions[k + 1]?.pos ?? Infinity));
      if (!own)
        own = labels.find(
          (l) => l.pos < it.pos && l.pos > (mentions[k - 1]?.end ?? -1) &&
            /^\s*(?:digital |cross-brand |hex )?(?:match(?:es)?|twins?|alternative)?\s*(?:for|to|of|is|are)?\s*(?:its |the )?$/i.test(
              plain.slice(l.pos + l.label.length, it.pos),
            ),
        );
      if (!own && last > k) own = labels.find((l) => l.pos > tailEnd && l.pos < (mentions[last + 1]?.pos ?? Infinity));
      // "closest" covers this mention only within its clause: "its closest Behr match is <X>"
      // or "<X> (and <Y>) is/are its closest …", not a later "with Y …" in the same sentence.
      const before = plain.slice(Math.max(0, it.pos - 90), it.pos).split(/[;—]|\bwith\b|\.\s/).pop() ?? "";
      const after = plain.slice(tailEnd, tailEnd + 50);
      const claimsClosest = CLOSEST.test(before) || /^\s*(?:\([^)]*\)\s*)?(?:is|are) (?:its|the|their) (?:closest|nearest)/i.test(after);
      const calledTwin = /^\s*(?:\([^)]*\)\s*)?(?:is|are) (?:its|their) (?:closest )?twins?\b/i.test(after);
      const printed = own?.label;
      if (printed && printed !== actual)
        add(u.start, "warn", "closeness-label",
          `${label(it.color)} vs ${label(subject)}: copy says "${printed.toLowerCase()}", ΔE ${d.toFixed(2)} is ${actual.toLowerCase()}`);
      else if (!printed && calledTwin && actual !== "Nearly identical")
        add(u.start, "warn", "closeness-label",
          `${label(it.color)} vs ${label(subject)}: called a twin, ΔE ${d.toFixed(2)} is ${actual.toLowerCase()}`);
      else if (!printed && LOOSE_CLOSE.test(plain) && actual === "Visible difference")
        add(u.start, "warn", "closeness-label",
          `${label(it.color)} vs ${label(subject)}: described as close, ΔE ${d.toFixed(2)} is a visible difference`);
      if (claimsClosest && it.color.brandSlug !== subject.brandSlug) {
        const best = cat.best(subject, it.color.brandSlug);
        if (best && best.color.id !== it.color.id && d - best.deltaE > slack)
          add(u.start, "warn", "not-closest",
            `${label(it.color)} is ΔE ${d.toFixed(2)} from ${label(subject)}; the nearest ${it.color.brandName} is ${best.color.name} ${best.color.code} at ${best.deltaE.toFixed(2)}`);
      }
      if (opts.changedIds?.has(it.color.id))
        add(u.start, "info", "changed-color", `Mentions ${label(it.color)}, whose swatch changed; check descriptive copy`);
    });
    return subject;
  };

  for (const b of blocks) {
    let carried: AuditColor | undefined;
    for (const s of sentences(b.raw, b.start)) carried = checkUnit(s, carried) ?? carried;
  }
  for (const r of rows) {
    const cells = [...r.raw.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)];
    const cols = headFor(r.start) ?? [];
    const first = cells[0] ? flatten(cells[0][1], cat).items[0]?.color : undefined;
    cells.forEach((c, i) => {
      const start = r.start + c.index! + c[0].indexOf(c[1]);
      const raw = c[1];
      // plain "Name (label)" cells: resolve the name in the column's brands
      const pm = decode(raw.replace(/<[^>]+>/g, "")).match(/^\s*([A-Z][^()<]{1,40}?)\s*\((nearly identical|very similar|visible difference)\)/i);
      if (pm && !/<(Link|Swatch)\b/.test(raw) && first) {
        const all = Object.keys(BRAND_ALIASES);
        // prefer the column's brands; fall back to any brand so a wrong-column name is still caught
        const c2 = (cols[i]?.length ? cat.resolve(cols[i], pm[1], first) : undefined) ?? cat.resolve(all, pm[1], first);
        if (c2) {
          const d = cat.de(first, c2);
          if (closenessLabel(d).toLowerCase() !== pm[2].toLowerCase())
            add(start, "warn", "closeness-label", `${label(c2)} vs ${label(first)}: table says "${pm[2]}", ΔE ${d.toFixed(2)} is ${closenessLabel(d).toLowerCase()}`);
          if (!cols[i]?.includes(c2.brandSlug) && cols[i]?.length)
            add(start, "warn", "closeness-label", `${label(c2)} sits in a column for ${cols[i].join("/")}`);
          if (opts.changedIds?.has(c2.id)) add(start, "info", "changed-color", `Mentions ${label(c2)}, whose swatch changed`);
        }
        return;
      }
      checkUnit({ raw, start }, first, i === 0 ? undefined : { brands: cols[i] ?? [], subject: first });
    });
  }

  return findings
    .filter((f, i, arr) => arr.findIndex((g) => g.line === f.line && g.message === f.message) === i)
    .sort((a, b) => a.line - b.line);
}

// ---------- brand-count copy ----------

const BRAND_WORD = String.raw`(?:major |paint |different |leading |top )?brands\b`;

/** Blank JSX tags (keeping offsets) so "Behr</Link>, PPG" reads as a list. A tag holding a
 *  {expression} is left alone: its attributes can carry copy (JSON-LD FAQ answers). */
function blankTags(text: string): string {
  return text.replace(/<\/?[A-Za-z][^<>{}]*>|\{"\s*"\}/g, (s) => " ".repeat(s.length));
}

/** "N brands" copy that disagrees with the number of brands in the DB:
 *   - "X, Y & N more brands" / "plus N other brands": named brands + N must equal the count
 *   - "N other brands" on its own: N must be count - 1
 *   - "across N brands", "N paint brands": N may be a subset, but never more than the count */
export function auditBrandCounts(file: string, text: string, brandCount: number): Finding[] {
  const out: Finding[] = [];
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") starts.push(i + 1);
  const plain = blankTags(text);
  const re = new RegExp(String.raw`(\b(?:and|plus)\s+|&(?:amp;)?\s+)?\b(\d{1,3})\s+(more |other )?${BRAND_WORD}`, "gi");
  for (const m of plain.matchAll(re)) {
    const n = Number(m[2]);
    const joined = Boolean(m[1]);
    const rel = m[3]?.trim().toLowerCase();
    const line = lineAt(starts, m.index!);
    const phrase = m[0].trim();
    const say = (msg: string) => out.push({ file, line, severity: "warn", kind: "brand-count", message: msg });
    if (rel && joined) {
      // brands named earlier in the same sentence or string literal
      const before = plain.slice(Math.max(0, m.index! - 200), m.index!).split(/[.!?]\s|["`]|\n\s*\n/).pop()!;
      const named = Object.entries(BRAND_ALIASES).filter(([, al]) =>
        al.some((a) => new RegExp(`(?<![\\w-])${escapeRe(a).replace(/&/g, "&(?:amp;)?")}(?![\\w-])`).test(before)),
      ).length;
      if (named && named + n !== brandCount)
        say(`"${phrase}" after ${named} named brand${named > 1 ? "s" : ""} implies ${named + n}; the DB has ${brandCount}`);
    } else if (rel === "other") {
      if (n !== brandCount - 1) say(`"${phrase}" implies ${n + 1} brands; the DB has ${brandCount}`);
    } else if (!rel && n > brandCount) say(`"${phrase}" is more than the ${brandCount} brands in the DB`);
  }
  return out;
}

// ---------- DB-side checks ----------

export interface CatalogRules {
  /** LRV outside this range is physically implausible for a paint unless the maker publishes it. */
  lrvRange: [number, number];
  /** "brand/slug" rows whose out-of-range LRV is the manufacturer's published value. */
  lrvAllowlist: Set<string>;
  /** "brand/slug" rows whose capital-after-apostrophe is the manufacturer's own styling. */
  nameAllowlist: Set<string>;
  /** Severity for a null undertone and for name mechanics: "error" once each backlog is fixed. */
  nullUndertone: Severity;
  nameMechanics: Severity;
}

/** Rows the DB holds that no page should print as-is. Pure: takes loaded rows. */
export function auditCatalogRows(colors: AuditColor[], rules: CatalogRules): Finding[] {
  const out: Finding[] = [];
  const add = (severity: Severity, kind: FindingKind, message: string) => out.push({ file: "db:colors", line: 0, severity, kind, message });
  const [lo, hi] = rules.lrvRange;
  for (const c of colors) {
    const ref = `${c.brandSlug}/${c.slug}`;
    if (c.lrv != null && (c.lrv < lo || c.lrv > hi) && !rules.lrvAllowlist.has(ref))
      add("warn", "lrv-range", `${ref} (${label(c)}) has LRV ${c.lrv}, outside ${lo}-${hi}`);
    if (c.undertone === null) add(rules.nullUndertone, "null-undertone", `${ref} (${label(c)}) has no undertone`);
    if (/&#?[a-z0-9]+;/i.test(c.name)) add(rules.nameMechanics, "name-mechanics", `${ref} name holds an HTML entity: "${c.name}"`);
    else if (/[a-z]{2}'[A-Z]/.test(c.name) && !rules.nameAllowlist.has(ref))
      add(rules.nameMechanics, "name-mechanics", `${ref} name has a capital after an apostrophe: "${c.name}"`);
  }
  return out;
}

/** The site's BRAND_COUNT (from the build snapshot) must equal the brands table. */
export function auditBrandTotal(dbBrands: number, siteCount: number): Finding[] {
  if (dbBrands === siteCount) return [];
  return [
    {
      file: "db:brands",
      line: 0,
      severity: "error",
      kind: "brand-count",
      message: `brands table has ${dbBrands} rows; BRAND_COUNT (src/generated/sitemap.json) is ${siteCount}`,
    },
  ];
}

// ---------- lightest-whites data ----------

export interface WhiteRow {
  brand: string;
  brandSlug: string;
  name: string;
  code: string;
  slug: string;
  lrv: number;
  source: string;
  estimated: boolean;
  checked: string;
}

/** A brand palette feed row (data/brand-scans/<date>/<brand>-live.json). */
export interface FeedRow {
  code: string;
  name: string;
  hex: string;
  lrv?: number;
}

/** Each row's slug is live, its code is the DB row's code, and its LRV is either the brand's
 *  published value (checked against the feed when the feed carries LRVs) or, for an
 *  estimated row, the DB's hex-computed value. */
export function auditLightestWhites(
  file: string,
  text: string,
  rows: WhiteRow[],
  cat: Catalog,
  feeds?: Map<string, FeedRow[]>,
): Finding[] {
  const out: Finding[] = [];
  const lines = text.split("\n");
  for (const r of rows) {
    const line = Math.max(1, lines.findIndex((l) => l.includes(`"${r.slug}"`)) + 1);
    const add = (severity: Severity, message: string) => out.push({ file, line, severity, kind: "whites-data", message });
    const c = cat.byRef.get(`${r.brandSlug}/${r.slug}`);
    if (!c) {
      add("error", `${r.brand} ${r.name}: /colors/${r.brandSlug}/${r.slug} is not in the DB`);
      continue;
    }
    if (c.archived) add("error", `${r.brand} ${r.name}: ${r.slug} is archived`);
    else if (cat.notLive(c)) add("error", `${r.brand} ${r.name}: ${r.slug} was not in ${c.brandName}'s last palette scan`);
    if (normCode(r.code) !== normCode(c.code)) add("warn", `${r.brand} ${r.name}: code ${r.code}, DB row has ${c.code}`);
    if (r.estimated !== /estimate/i.test(r.source)) add("warn", `${r.brand} ${r.name}: estimated=${r.estimated} but source is "${r.source}"`);
    const printed = String(r.lrv);
    if (r.estimated) {
      if (c.lrv != null && !lrvOk(printed, c.lrv, false))
        add("warn", `${r.brand} ${r.name}: estimated LRV ${printed}, DB computes ${c.lrv}`);
      continue;
    }
    const feed = feeds?.get(r.brandSlug)?.find((f) => normCode(f.code) === normCode(r.code));
    if (feeds?.has(r.brandSlug) && !feed) add("warn", `${r.brand} ${r.name}: code ${r.code} is not in ${r.brand}'s palette feed`);
    else if (feed?.lrv != null && !lrvOk(printed, feed.lrv, false))
      add("warn", `${r.brand} ${r.name}: published LRV ${printed}, ${r.brand}'s feed says ${feed.lrv}`);
  }
  return out;
}
