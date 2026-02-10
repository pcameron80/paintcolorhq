import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Paint Color HQ - Paint Color Inspiration & Palettes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SWATCHES = [
  "#2f4538", "#d5e1df", "#c75c2a", "#2b4c6f", "#e8c547",
  "#c4a882", "#6a9fb5", "#8b2232", "#b87333", "#a8c5a0",
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Color swatches row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 48 }}>
          {SWATCHES.map((color) => (
            <div
              key={color}
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                backgroundColor: color,
              }}
            />
          ))}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#111827",
            letterSpacing: -1,
          }}
        >
          PaintColorHQ
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#6b7280",
            marginTop: 16,
          }}
        >
          25,000+ Paint Colors &middot; 14 Brands &middot; Cross-Brand Matching
        </div>
      </div>
    ),
    { ...size }
  );
}
