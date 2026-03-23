import Link from "next/link";

interface ColorCardProps {
  name: string;
  hex: string;
  brandName: string;
  brandSlug: string;
  colorSlug: string;
  colorNumber?: string | null;
}

export function ColorCard({
  name,
  hex,
  brandName,
  brandSlug,
  colorSlug,
  colorNumber,
}: ColorCardProps) {
  return (
    <Link
      href={`/colors/${brandSlug}/${colorSlug}`}
      className="group block overflow-hidden rounded-xl bg-surface-container-lowest hover:shadow-md transition-all duration-500"
    >
      <div
        className="h-28 w-full rounded-t-xl"
        style={{ backgroundColor: hex }}
      />
      <div className="p-4">
        <p className="font-headline font-bold text-on-surface text-sm tracking-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: hex }}
          />
          {name}
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-outline">
          {brandName}
          {colorNumber && ` \u00B7 ${colorNumber}`}
        </p>
        <div className="h-4" />
        <p className="font-mono text-[10px] text-outline">
          {hex.toUpperCase()}
        </p>
      </div>
    </Link>
  );
}
