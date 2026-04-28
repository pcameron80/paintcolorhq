import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Pinterest-optimized 1000×1500 pin image for an inspiration palette.
 *
 * Layout:
 *   Top ~67% — five horizontal swatches (1000×200 each), with role label
 *              (Walls / Trim / Accent / Pop) in the corner.
 *   Bottom 33% — white info card with palette name, description,
 *                "5-color paint palette" subtitle, paintcolorhq.com.
 *
 * Params:
 *   name        — palette name (required)
 *   description — short tagline (optional)
 *   colors      — colon-separated `hex:role` pairs joined by commas, e.g.
 *                 `colors=#a1b2c3:Walls,#d4e5f6:Trim,#aabbcc:Accent,...`
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name") || "Color Palette";
  const description = searchParams.get("description") || "";
  const colorsParam = searchParams.get("colors") || "";

  const swatches = colorsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [hex, role] = s.split(":");
      return { hex: hex || "#cccccc", role: role || "" };
    })
    .slice(0, 5);

  // Pad to 5 if fewer were provided
  while (swatches.length < 5) {
    swatches.push({ hex: "#e5e7eb", role: "" });
  }

  function textOnHex(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? "#1a1a1a" : "#ffffff";
  }

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
        {/* Swatch stack — top 67% */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "67%" }}>
          {swatches.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: "100%",
                height: "20%",
                backgroundColor: s.hex,
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 60px",
              }}
            >
              <span
                style={{
                  fontSize: 26,
                  fontFamily: "sans-serif",
                  fontWeight: 600,
                  color: textOnHex(s.hex),
                  opacity: 0.85,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {s.role}
              </span>
              <span
                style={{
                  fontSize: 26,
                  fontFamily: "sans-serif",
                  color: textOnHex(s.hex),
                  opacity: 0.7,
                  letterSpacing: "0.05em",
                }}
              >
                {s.hex.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Info card — bottom 33% */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
            height: "33%",
            padding: "60px 70px",
            backgroundColor: "#ffffff",
          }}
        >
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
            5-color paint palette
          </span>
          <span
            style={{
              fontSize: 60,
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1.1,
              marginTop: 14,
              fontFamily: "sans-serif",
            }}
          >
            {name}
          </span>
          {description && (
            <span
              style={{
                fontSize: 24,
                color: "#374151",
                marginTop: 16,
                fontFamily: "sans-serif",
                lineHeight: 1.3,
              }}
            >
              {description}
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
            paintcolorhq.com · cross-brand matched palettes
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
