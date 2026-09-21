import Link from "next/link";
import type { ColorWithBrand, CrossBrandMatchWithColor } from "@/lib/types";
import { REVIEWED_COLOR_PAGES } from "@/lib/color-review";
import { nearestMatchesPerBrand } from "@/lib/color-description";

export function ColorDecisionGuide({ color, matches }: { color: ColorWithBrand; matches: CrossBrandMatchWithColor[] }) {
  const review = REVIEWED_COLOR_PAGES[`${color.brand.slug}/${color.slug}`];
  if (!review) return null;
  const shortlist = nearestMatchesPerBrand(matches).slice(0, 3);
  return <section className="max-w-4xl mx-auto px-6 md:px-12 py-10 space-y-4">
    <h2 className="font-headline text-2xl font-bold">Choosing {color.brand.name} {color.name}</h2>
    <p className="text-on-surface-variant">{review.task}</p>
    {review.measuredLrv !== undefined && <p>Manufacturer-published LRV: {review.measuredLrv}. This differs from the calculated estimate in our catalog.</p>}
    {review.reference && <p className="text-sm"><a href={review.reference} className="text-primary underline">Manufacturer reference</a> · Checked {review.checked}</p>}
    {shortlist.length > 0 && <><h3 className="font-semibold">Start with these digital candidates</h3><ul className="space-y-2">{shortlist.map(m => <li key={m.match_color.id}>
      <Link className="text-primary underline" href={`/colors/${m.match_color.brand.slug}/${m.match_color.slug}`}>{m.match_color.brand.name} {m.match_color.name}</Link>{" "}
      <span className="font-mono text-sm">{m.match_color.hex.toUpperCase()}</span>
    </li>)}</ul></>}
    <p className="text-sm text-on-surface-variant">The shortlist uses the current stored match data. It does not verify paint formulas or touch-up compatibility. <Link href="#color-matches" className="text-primary underline">Compare the full shortlist and sample options</Link>.</p>
  </section>;
}
