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
        className="h-36 sm:h-44 w-full rounded-t-xl border-b border-black/10"
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
        <p className="mt-0.5 text-xs text-on-surface-variant">
          {brandName}
          {colorNumber && ` \u00B7 ${colorNumber}`}
        </p>
        <div className="h-4" />
        <p className="font-mono text-xs text-on-surface-variant">
          {hex.toUpperCase()}
        </p>
      </div>
    </Link>
  );
}
