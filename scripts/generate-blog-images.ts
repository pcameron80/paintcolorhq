import sharp from "sharp";
import * as path from "path";
import * as fs from "fs";

const OUTPUT_DIR = path.resolve(__dirname, "../public/blog");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Determine whether text on a given background should be white or dark */
function textColorOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1a1a1a" : "#ffffff";
}

async function svgToWebp(svg: string, outputPath: string) {
  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outputPath);
  console.log(`  ✓ ${path.basename(outputPath)}`);
}

// ─── Image 1: Gray Undertone Comparison ──────────────────────────────────────

async function generateGrayUndertoneComparison() {
  const WIDTH = 1200;
  const HEIGHT = 460;
  const SWATCH_W = 184;
  const SWATCH_H = 260;
  const GAP = 24;
  const TOP_PADDING = 70;
  const totalSwatchesWidth = 5 * SWATCH_W + 4 * GAP;
  const startX = (WIDTH - totalSwatchesWidth) / 2;

  const colors = [
    { name: "Stonington Gray", brand: "Benjamin Moore", code: "HC-170", hex: "#9EA2A2", undertone: "Blue Undertone" },
    { name: "Revere Pewter", brand: "Benjamin Moore", code: "HC-172", hex: "#CCC7B9", undertone: "Green Undertone" },
    { name: "Agreeable Gray", brand: "Sherwin-Williams", code: "SW 7029", hex: "#D1CBC1", undertone: "Purple Undertone" },
    { name: "Balanced Beige", brand: "Sherwin-Williams", code: "SW 7037", hex: "#C0B2A2", undertone: "Brown Undertone" },
    { name: "Repose Gray", brand: "Sherwin-Williams", code: "SW 7015", hex: "#C2BFB8", undertone: "Neutral Undertone" },
  ];

  let swatches = "";
  colors.forEach((c, i) => {
    const x = startX + i * (SWATCH_W + GAP);
    const centerX = x + SWATCH_W / 2;
    const swatchY = TOP_PADDING;
    const hexLabel = textColorOn(c.hex);

    // Swatch shadow (subtle)
    swatches += `<rect x="${x + 2}" y="${swatchY + 2}" width="${SWATCH_W}" height="${SWATCH_H}" rx="10" fill="#00000010"/>`;
    // Swatch border
    swatches += `<rect x="${x}" y="${swatchY}" width="${SWATCH_W}" height="${SWATCH_H}" rx="10" fill="${c.hex}" stroke="#d4d4d4" stroke-width="1"/>`;
    // Hex value inside swatch
    swatches += `<text x="${centerX}" y="${swatchY + SWATCH_H - 16}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="${hexLabel}" opacity="0.7">${c.hex}</text>`;
    // Color name
    swatches += `<text x="${centerX}" y="${swatchY + SWATCH_H + 28}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#1a1a1a">${escapeXml(c.name)}</text>`;
    // Brand + code
    swatches += `<text x="${centerX}" y="${swatchY + SWATCH_H + 48}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="12" fill="#666">${escapeXml(c.brand)} ${escapeXml(c.code)}</text>`;
    // Undertone label (colored pill)
    const pillWidth = 120;
    const pillX = centerX - pillWidth / 2;
    const pillY = swatchY + SWATCH_H + 58;
    swatches += `<rect x="${pillX}" y="${pillY}" width="${pillWidth}" height="22" rx="11" fill="#f0f0f0"/>`;
    swatches += `<text x="${centerX}" y="${pillY + 15}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#555">${escapeXml(c.undertone)}</text>`;
  });

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fafafa"/>
      <stop offset="100%" stop-color="#f5f5f5"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg1)"/>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="0" fill="none" stroke="#e5e5e5" stroke-width="1"/>
  <text x="${WIDTH / 2}" y="42" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#1a1a1a" letter-spacing="0.3">Common Gray Undertones Compared</text>
  <line x1="${WIDTH / 2 - 60}" y1="52" x2="${WIDTH / 2 + 60}" y2="52" stroke="#d4d4d4" stroke-width="1.5"/>
  ${swatches}
</svg>`;

  await svgToWebp(svg, path.join(OUTPUT_DIR, "understanding-paint-color-undertones-gray-comparison.webp"));
}

// ─── Image 2: Warm vs Cool Whites ────────────────────────────────────────────

async function generateWarmCoolWhites() {
  const WIDTH = 1200;
  const HEIGHT = 420;
  const SWATCH_W = 220;
  const SWATCH_H = 230;
  const GAP = 28;
  const TOP_PADDING = 80;

  const warmColors = [
    { name: "White Dove", brand: "Benjamin Moore", code: "OC-17", hex: "#F3EDE0" },
    { name: "Simply White", brand: "Benjamin Moore", code: "2143-70", hex: "#F1ECE0" },
  ];
  const coolColors = [
    { name: "Decorator\u2019s White", brand: "Benjamin Moore", code: "OC-149", hex: "#E8E6E1" },
    { name: "Chantilly Lace", brand: "Benjamin Moore", code: "2121-70", hex: "#F5F2ED" },
  ];

  // Layout: two groups separated by a divider
  const groupGap = 60;
  const groupWidth = 2 * SWATCH_W + GAP;
  const totalWidth = 2 * groupWidth + groupGap;
  const startX = (WIDTH - totalWidth) / 2;

  let content = "";

  // Group labels
  const warmCenterX = startX + groupWidth / 2;
  const coolCenterX = startX + groupWidth + groupGap + groupWidth / 2;

  // Warm label with subtle warm accent
  content += `<rect x="${warmCenterX - 70}" y="58" width="140" height="26" rx="13" fill="#FDF6EC"/>`;
  content += `<text x="${warmCenterX}" y="76" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#A0845C" letter-spacing="1.5">WARM WHITES</text>`;

  // Cool label with subtle cool accent
  content += `<rect x="${coolCenterX - 70}" y="58" width="140" height="26" rx="13" fill="#ECF0F4"/>`;
  content += `<text x="${coolCenterX}" y="76" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#5C7A8C" letter-spacing="1.5">COOL WHITES</text>`;

  // Divider line
  const divX = startX + groupWidth + groupGap / 2;
  content += `<line x1="${divX}" y1="${TOP_PADDING - 10}" x2="${divX}" y2="${TOP_PADDING + SWATCH_H + 60}" stroke="#d4d4d4" stroke-width="1" stroke-dasharray="6,4"/>`;

  // Draw swatches
  function drawSwatch(c: { name: string; brand: string; code: string; hex: string }, x: number) {
    const centerX = x + SWATCH_W / 2;
    // Shadow
    content += `<rect x="${x + 2}" y="${TOP_PADDING + 2}" width="${SWATCH_W}" height="${SWATCH_H}" rx="10" fill="#00000008"/>`;
    // Border + fill
    content += `<rect x="${x}" y="${TOP_PADDING}" width="${SWATCH_W}" height="${SWATCH_H}" rx="10" fill="${c.hex}" stroke="#d4d4d4" stroke-width="1"/>`;
    // Hex inside
    content += `<text x="${centerX}" y="${TOP_PADDING + SWATCH_H - 16}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#999">${c.hex}</text>`;
    // Name
    content += `<text x="${centerX}" y="${TOP_PADDING + SWATCH_H + 24}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#1a1a1a">${escapeXml(c.name)}</text>`;
    // Brand + code
    content += `<text x="${centerX}" y="${TOP_PADDING + SWATCH_H + 44}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="12" fill="#666">${escapeXml(c.brand)} ${escapeXml(c.code)}</text>`;
  }

  warmColors.forEach((c, i) => {
    drawSwatch(c, startX + i * (SWATCH_W + GAP));
  });
  coolColors.forEach((c, i) => {
    drawSwatch(c, startX + groupWidth + groupGap + i * (SWATCH_W + GAP));
  });

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fafafa"/>
      <stop offset="100%" stop-color="#f5f5f5"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg2)"/>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="#e5e5e5" stroke-width="1"/>
  <text x="${WIDTH / 2}" y="38" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#1a1a1a" letter-spacing="0.3">Warm vs Cool White Paint Colors</text>
  <line x1="${WIDTH / 2 - 60}" y1="48" x2="${WIDTH / 2 + 60}" y2="48" stroke="#d4d4d4" stroke-width="1.5"/>
  ${content}
</svg>`;

  await svgToWebp(svg, path.join(OUTPUT_DIR, "understanding-paint-color-undertones-warm-cool-whites.webp"));
}

// ─── Image 3: Delta E Guide ─────────────────────────────────────────────────

async function generateDeltaEGuide() {
  const WIDTH = 1200;
  const HEIGHT = 380;
  const PAIR_W = 240;
  const SWATCH_W = 100;
  const SWATCH_H = 160;
  const GAP = 30;
  const TOP_PADDING = 75;

  const pairs = [
    {
      label: "Virtually Identical",
      deltaE: "< 1.0",
      left: { hex: "#B5B3AD", name: "Gray A" },
      right: { hex: "#B6B4AE", name: "Gray B" },
    },
    {
      label: "Very Close",
      deltaE: "1 \u2013 2",
      left: { hex: "#B5B3AD", name: "Gray A" },
      right: { hex: "#B9B4AA", name: "Gray C" },
    },
    {
      label: "Close Match",
      deltaE: "2 \u2013 3",
      left: { hex: "#B5B3AD", name: "Gray A" },
      right: { hex: "#BFB6A8", name: "Gray D" },
    },
    {
      label: "Noticeable Difference",
      deltaE: "3 \u2013 5",
      left: { hex: "#B5B3AD", name: "Gray A" },
      right: { hex: "#C8B9A5", name: "Gray E" },
    },
  ];

  const totalW = pairs.length * PAIR_W + (pairs.length - 1) * GAP;
  const startX = (WIDTH - totalW) / 2;

  let content = "";

  pairs.forEach((p, i) => {
    const groupX = startX + i * (PAIR_W + GAP);
    const centerX = groupX + PAIR_W / 2;
    const leftX = groupX + (PAIR_W - 2 * SWATCH_W - 8) / 2;
    const rightX = leftX + SWATCH_W + 8;

    // Delta E badge
    const badgeY = TOP_PADDING - 8;
    content += `<rect x="${centerX - 40}" y="${badgeY - 16}" width="80" height="22" rx="11" fill="#1a1a1a"/>`;
    content += `<text x="${centerX}" y="${badgeY - 1}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#fff">\u0394E ${escapeXml(p.deltaE)}</text>`;

    // Left swatch
    content += `<rect x="${leftX + 1}" y="${TOP_PADDING + 1}" width="${SWATCH_W}" height="${SWATCH_H}" rx="8" fill="#00000008"/>`;
    content += `<rect x="${leftX}" y="${TOP_PADDING}" width="${SWATCH_W}" height="${SWATCH_H}" rx="8" fill="${p.left.hex}" stroke="#d4d4d4" stroke-width="1"/>`;
    content += `<text x="${leftX + SWATCH_W / 2}" y="${TOP_PADDING + SWATCH_H - 12}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="11" fill="#888">${p.left.hex}</text>`;

    // Right swatch
    content += `<rect x="${rightX + 1}" y="${TOP_PADDING + 1}" width="${SWATCH_W}" height="${SWATCH_H}" rx="8" fill="#00000008"/>`;
    content += `<rect x="${rightX}" y="${TOP_PADDING}" width="${SWATCH_W}" height="${SWATCH_H}" rx="8" fill="${p.right.hex}" stroke="#d4d4d4" stroke-width="1"/>`;
    content += `<text x="${rightX + SWATCH_W / 2}" y="${TOP_PADDING + SWATCH_H - 12}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="11" fill="#888">${p.right.hex}</text>`;

    // Arrow between swatches
    const arrowY = TOP_PADDING + SWATCH_H / 2;
    content += `<text x="${leftX + SWATCH_W + 4}" y="${arrowY + 4}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="14" fill="#ccc">\u2194</text>`;

    // Label below
    content += `<text x="${centerX}" y="${TOP_PADDING + SWATCH_H + 28}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#1a1a1a">${escapeXml(p.label)}</text>`;

    // Subtle description
    const descY = TOP_PADDING + SWATCH_H + 46;
    if (i === 0) {
      content += `<text x="${centerX}" y="${descY}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="11" fill="#888">Imperceptible to most</text>`;
    } else if (i === 1) {
      content += `<text x="${centerX}" y="${descY}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="11" fill="#888">Experts may notice</text>`;
    } else if (i === 2) {
      content += `<text x="${centerX}" y="${descY}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="11" fill="#888">Visible side by side</text>`;
    } else {
      content += `<text x="${centerX}" y="${descY}" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="11" fill="#888">Clearly different colors</text>`;
    }
  });

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fafafa"/>
      <stop offset="100%" stop-color="#f5f5f5"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg3)"/>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="#e5e5e5" stroke-width="1"/>
  <text x="${WIDTH / 2}" y="38" text-anchor="middle" font-family="'SF Pro Display', system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#1a1a1a" letter-spacing="0.3">Understanding Delta E Color Difference</text>
  <line x1="${WIDTH / 2 - 60}" y1="48" x2="${WIDTH / 2 + 60}" y2="48" stroke="#d4d4d4" stroke-width="1.5"/>
  ${content}
</svg>`;

  await svgToWebp(svg, path.join(OUTPUT_DIR, "understanding-paint-color-undertones-delta-e-guide.webp"));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Generating blog images...\n");

  await generateGrayUndertoneComparison();
  await generateWarmCoolWhites();
  await generateDeltaEGuide();

  console.log("\nDone! Images saved to public/blog/");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
