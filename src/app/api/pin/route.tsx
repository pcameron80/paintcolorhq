import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Pinterest-optimized 1000×1500 (2:3 vertical) pin image for a single color.
 *
 * Layout:
 *   Top 70%   — full-bleed color swatch with hex code in bottom-right corner
 *   Bottom 30% — white info card: brand (label), name (large), code · LRV · family,
 *                paintcolorhq.com footer
 *
 * Cached aggressively at the edge — color data is static.
 *
 * Params: hex (required), name, brand, code, lrv, family
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hex = searchParams.get("hex") || "#4A90D9";
  const name = searchParams.get("name") || "Paint Color";
  const brand = searchParams.get("brand") || "";
  const code = searchParams.get("code") || "";
  const lrv = searchParams.get("lrv");
  const family = searchParams.get("family") || "";

  // Light-or-dark text on the swatch for the corner hex label
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textOnSwatch = luminance > 0.6 ? "#1a1a1a" : "#ffffff";

  // Detail line: "Code · LRV X · Family"
  const detailParts: string[] = [];
  if (code) detailParts.push(code);
  if (lrv) detailParts.push(`LRV ${lrv}`);
  if (family) detailParts.push(family.charAt(0).toUpperCase() + family.slice(1));
  const detailLine = detailParts.join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Swatch — top 70% */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "70%",
            backgroundColor: hex,
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: "60px",
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontFamily: "sans-serif",
              fontWeight: 600,
              color: textOnSwatch,
              opacity: 0.85,
              letterSpacing: "0.05em",
            }}
          >
            {hex.toUpperCase()}
          </span>
        </div>

        {/* Info card — bottom 30% */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
            height: "30%",
            padding: "60px 70px",
            backgroundColor: "#ffffff",
          }}
        >
          {brand && (
            <span
              style={{
                fontSize: 28,
                fontFamily: "sans-serif",
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 600,
              }}
            >
              {brand}
            </span>
          )}
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1.1,
              marginTop: 12,
              fontFamily: "sans-serif",
            }}
          >
            {name}
          </span>
          {detailLine && (
            <span
              style={{
                fontSize: 26,
                color: "#374151",
                marginTop: 18,
                fontFamily: "sans-serif",
              }}
            >
              {detailLine}
            </span>
          )}
          <span
            style={{
              fontSize: 22,
              color: "#9ca3af",
              marginTop: "auto",
              fontFamily: "sans-serif",
            }}
          >
            paintcolorhq.com · cross-brand matches
          </span>
        </div>
      </div>
    ),
    {
      width: 1000,
      height: 1500,
      headers: {
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, immutable",
      },
    },
  );
}
