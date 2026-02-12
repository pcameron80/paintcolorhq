import Link from "next/link";
import { ColorSwatch } from "./color-swatch";

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
      className="group block overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
    >
      <div
        className="h-24 w-full"
        style={{ backgroundColor: hex }}
      />
      <div className="p-3">
        <p className="font-medium text-gray-900 group-hover:text-brand-blue">
          {name}
        </p>
        <p className="mt-0.5 text-sm text-gray-500">
          {brandName}
          {colorNumber && ` - ${colorNumber}`}
        </p>
        <p className="mt-0.5 font-mono text-xs text-gray-400">
          {hex.toUpperCase()}
        </p>
      </div>
    </Link>
  );
}
