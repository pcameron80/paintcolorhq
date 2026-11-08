/**
 * Pure logic for scripts/fix-vista-identities.ts: validates the plan in
 * scripts/data/vista-identity-plan.json and turns each op into a row patch
 * with every hex-derived column recomputed.
 */
import { calculateLrv, classifyColorFamily, hexToRgb, rgbToLab } from './color-math';
import { undertoneLabel } from './undertone';

export interface IdentityOp {
  op: 'assign' | 'restore' | 'alternates';
  slug: string;
  /** The row must still hold these values, or the op is skipped. */
  expect: { color_number: string; hex: string };
  set: {
    color_number?: string;
    alternate_numbers?: string[] | null;
    name?: string;
    hex?: string;
    /** Published LRV; null or absent means compute from hex. */
    lrv?: number | null;
    last_seen_live_on?: string | null;
    availability?: string;
  };
  source: string;
}

export interface IdentityPlan {
  brand: string;
  ops: IdentityOp[];
}

export interface IdentityPatch {
  color_number?: string;
  alternate_numbers?: string[] | null;
  name?: string;
  hex?: string;
  rgb_r?: number;
  rgb_g?: number;
  rgb_b?: number;
  lab_l?: number;
  lab_a?: number;
  lab_b_val?: number;
  lrv?: number;
  color_family?: string;
  undertone?: string;
  last_seen_live_on?: string | null;
  availability?: string;
}

/** Problems that make the plan unsafe to apply; empty when it is sound. */
export function validatePlan(plan: IdentityPlan): string[] {
  const errors: string[] = [];
  const slugs = new Set<string>();
  const assigned = new Map<string, string>();
  for (const o of plan.ops) {
    if (slugs.has(o.slug)) errors.push(`${o.slug} appears in two ops`);
    slugs.add(o.slug);
    if (o.set.hex !== undefined && !hexToRgb(o.set.hex)) errors.push(`${o.slug}: bad hex ${o.set.hex}`);
    if (o.op === 'assign') {
      const code = o.set.color_number!;
      if (assigned.has(code)) errors.push(`live code ${code} assigned to ${assigned.get(code)} and ${o.slug}`);
      assigned.set(code, o.slug);
      if (!o.set.name || !o.set.hex) errors.push(`${o.slug}: assign needs name and hex`);
    }
  }
  // Every live code taken from a row must land on exactly one other row.
  for (const o of plan.ops) {
    if (o.op !== 'restore' && o.op !== 'assign') continue;
    const given = o.expect.color_number;
    const releases = o.set.color_number !== undefined && o.set.color_number !== given;
    if (releases && /^\d{4}$|^AC\d+$/.test(given) && !assigned.has(given)) {
      errors.push(`${o.slug} gives up live code ${given} but no op assigns it`);
    }
  }
  for (const o of plan.ops) {
    if (o.op === 'restore' && o.set.color_number && assigned.has(o.set.color_number)) {
      errors.push(`${o.slug} restores to ${o.set.color_number}, which is also assigned`);
    }
  }
  return errors;
}

/** Row patch for one op. `key` is "<brand>/<slug>" for undertone overrides. */
export function patchFor(o: IdentityOp, key: string): IdentityPatch {
  const p: IdentityPatch = {};
  if (o.set.color_number !== undefined) p.color_number = o.set.color_number;
  if (o.set.alternate_numbers !== undefined) p.alternate_numbers = o.set.alternate_numbers;
  if (o.set.name !== undefined) p.name = o.set.name;
  if (o.set.last_seen_live_on !== undefined) p.last_seen_live_on = o.set.last_seen_live_on;
  if (o.set.availability !== undefined) p.availability = o.set.availability;
  if (o.set.hex !== undefined) {
    const hex = o.set.hex.toLowerCase();
    const rgb = hexToRgb(hex)!;
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    Object.assign(p, {
      hex,
      rgb_r: rgb.r,
      rgb_g: rgb.g,
      rgb_b: rgb.b,
      lab_l: lab.l,
      lab_a: lab.a,
      lab_b_val: lab.b_val,
      lrv: o.set.lrv ?? Math.round(calculateLrv(rgb.r, rgb.g, rgb.b) * 10) / 10,
      color_family: classifyColorFamily(rgb.r, rgb.g, rgb.b),
      undertone: undertoneLabel(hex, lab.a, lab.b_val, key),
    });
  }
  return p;
}
