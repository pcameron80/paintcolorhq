interface ColorSwatchProps {
  hex: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 rounded",
  md: "h-12 w-12 rounded-lg",
  lg: "h-24 w-24 rounded-xl",
  xl: "h-40 w-40 rounded-2xl",
};

export function ColorSwatch({ hex, size = "md", className = "" }: ColorSwatchProps) {
  const isLight = isLightColor(hex);
  return (
    <div
      className={`${sizeClasses[size]} ${isLight ? "border border-gray-200" : ""} ${className}`}
      style={{ backgroundColor: hex }}
    />
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.85;
}
