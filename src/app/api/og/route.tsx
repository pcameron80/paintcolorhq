import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hex = searchParams.get("hex") || "#4A90D9";
  const name = searchParams.get("name") || "Paint Color";
  const brand = searchParams.get("brand") || "";

  // Determine if the color is light or dark for text contrast
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textOnSwatch = luminance > 0.6 ? "#1a1a1a" : "#ffffff";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Color swatch - left half */}
        <div
          style={{
            display: "flex",
            width: "50%",
            height: "100%",
            backgroundColor: hex,
            alignItems: "flex-end",
            padding: "40px",
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontFamily: "sans-serif",
              color: textOnSwatch,
              opacity: 0.8,
            }}
          >
            {hex.toUpperCase()}
          </span>
        </div>

        {/* Info - right half */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "50%",
            padding: "60px",
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
            }}
          >
            {name}
          </span>
          {brand && (
            <span
              style={{
                fontSize: 28,
                color: "#6b7280",
                marginTop: 16,
              }}
            >
              {brand}
            </span>
          )}
          <span
            style={{
              fontSize: 20,
              color: "#9ca3af",
              marginTop: 40,
            }}
          >
            paintcolorhq.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    }
  );
}
