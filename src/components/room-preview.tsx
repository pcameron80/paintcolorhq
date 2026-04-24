/**
 * Photo-based room preview — overlays paint colors onto a real room photograph
 * using SVG paths with mix-blend-multiply for realistic color application.
 *
 * Paths traced from AdobeStock_970516903.svg (viewBox 0 0 862 1290.24).
 * Groups: OuterWalls (left + right), Trim (crown, exterior window, baseboard,
 *         window recess, window frame), Back_Wall (left, right, window wall, base)
 */
import Image from "next/image";

// Helper: convert "x1 y1 x2 y2 ..." polygon points to "M x1,y1 L x2,y2 ... Z" path
function pts(s: string): string {
  const nums = s.trim().split(/\s+/);
  const pairs: string[] = [];
  for (let i = 0; i < nums.length; i += 2) {
    pairs.push(`${nums[i]},${nums[i + 1]}`);
  }
  return `M ${pairs[0]} L ${pairs.slice(1).join(" L ")} Z`;
}

// ─── OUTER WALLS (main color) ───
const LEFT_WALL = pts("105.98 716.44 103 707.18 103.83 705.71 105.98 705.71 107.67 705.71 109.7 705.71 112.64 706.73 117.38 707.74 121.67 709.21 124.72 711.08 126.53 711.08 127.88 711.7 125.51 277.4 .62 142.91 0 732.36 105.98 716.44");
const RIGHT_WALL = pts("774.04 278.03 770.65 829.26 862 876.37 859.72 181.25 774.04 278.03");

// ─── BACK WALL (accent color) ───
const BACK_WALL_LEFT = pts("125.51 277.4 209.79 275.8 209.79 700.31 208.58 699.54 207.28 698.76 203.64 698.76 202.33 699.67 200.51 700.31 198.3 701.63 196.34 702.28 195.13 702.9 193.56 703.94 191.99 704.61 191.05 705.01 189.93 705.82 187.42 707.03 186.48 707.48 185.67 707.48 184.42 708.15 180.79 709.41 178.5 710.35 176.75 711.33 175.41 711.92 174.29 712.63 172.49 712.99 170.39 712.99 169.26 713.44 168.14 713.71 166.8 714.25 166.08 714.47 163.7 714.47 162.9 714.83 161.01 715.46 159.36 715.77 157.92 716.13 155.72 716.49 153.17 716.49 150.57 717.03 149.58 715.19 147.92 712.5 146.53 711.06 145.46 710.08 144.47 709.94 143.08 710.17 141.96 710.48 139.09 711.29 136.22 711.83 133.13 712.45 130.98 713.08 130.44 713.08 127.88 711.7 125.51 277.4");
const BACK_WALL_RIGHT = pts("683.91 277.94 774.04 278.03 770.65 829.26 769.64 829.82 764.47 830.28 681.28 831.09 683.91 277.94");
const WINDOW_WALL = pts("224.45 714.8 229.54 713.65 231.81 713.65 235.94 711.38 238.41 711.38 240.75 710.33 240.23 305.8 656.64 306.69 655.51 831.09 667.68 831.09 671.62 281.5 222.91 281.36 224.45 714.8");
const BACK_WALL_BASE = pts("323.77 739.03 324.79 759.73 327.13 783.51 339.52 782.79 347.52 782.08 356.57 781.61 377.41 781.48 394.5 781.97 407.87 782.79 418.14 785.63 421.11 788.4 423.84 793.98 425.35 802.51 424.96 808.03 422.98 814.82 451.27 814.88 492.72 814.24 495.23 807.51 496.82 805.81 500.92 804.54 506 804.13 512.76 804.93 515.46 806.52 518.59 812.35 519.17 814.57 650.03 814.25 650.03 739.17 323.77 739.03");

// ─── TRIM ───
const TRIM_CROWN = "M.62,142.91l124.89,134.49,84.62.08,563.91.54,85.67-96.77L858.52,0h-8.77l-136.52,224.33c-.27.27-543.94-1.33-543.94-1.33L13.63,0H0s.62,142.91.62,142.91h0";
const TRIM_EXTERIOR_WINDOW = pts("209.79 700.31 212.85 702.86 213.53 705.74 213.53 708.97 212.51 715.59 212.68 717.29 216.33 716.26 224.45 714.8 222.91 281.36 671.62 281.5 667.68 831.09 681.28 831.09 683.91 277.94 210.13 277.48 209.79 700.31");
const TRIM_BASEBOARD = pts("860.16 876.37 770.65 829.26 768.55 830.48 521.28 831.9 521.28 833.92 536.48 836.15 539.52 839.8 552.29 859.87 765.56 859.73 860.16 917.22 860.16 876.37");
const TRIM_WINDOW_RECESS = pts("240.23 305.8 656.64 306.69 656.64 735.7 643.55 733.54 643.43 325.36 258.74 322.52 258.62 719.8 255.54 719.68 255.07 716.13 255.19 711.75 255.43 709.85 255.9 708.31 255.78 706.3 254.95 705.12 253.53 705 251.76 705.23 249.86 706.42 247.62 707.25 245.37 707.96 243.24 708.79 240.75 710.33 240.23 305.8");
const TRIM_WINDOW_FRAME = pts("387.86 339.25 387.28 491.82 270.55 491.35 270.63 501.14 387.94 501.9 388.64 732.9 404.48 732.9 404.17 501.15 507.14 501.43 506.02 732.9 520.77 732.82 521.4 502.23 625.84 502.49 626.34 492.53 521.56 492.84 521.95 340.24 508.64 340.4 507.63 492.61 404.09 491.74 403.77 339.25 387.86 339.25");

interface RoomPreviewProps {
  wallColor: string;
  trimColor: string;
  accentColor: string;
  className?: string;
}

export function RoomPreview({ wallColor, trimColor, accentColor, className }: RoomPreviewProps) {
  const wallPaths = [LEFT_WALL, RIGHT_WALL];
  const accentPaths = [BACK_WALL_LEFT, BACK_WALL_RIGHT, WINDOW_WALL, BACK_WALL_BASE];
  const trimPaths = [TRIM_CROWN, TRIM_EXTERIOR_WINDOW, TRIM_BASEBOARD, TRIM_WINDOW_RECESS, TRIM_WINDOW_FRAME];

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <Image
        src="/room-preview.webp"
        alt="Living room with applied paint colors"
        width={862}
        height={1290}
        sizes="(max-width: 768px) 100vw, 600px"
        className="w-full h-auto block"
        loading="lazy"
      />

      {/* Multiply pass */}
      <svg
        viewBox="0 0 862 1290.24"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: "multiply" }}
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        {wallPaths.map((d, i) => <path key={`w${i}`} d={d} fill={wallColor} opacity="0.55" />)}
        {accentPaths.map((d, i) => <path key={`a${i}`} d={d} fill={accentColor} opacity="0.55" />)}
        {trimPaths.map((d, i) => <path key={`t${i}`} d={d} fill={trimColor} opacity="0.45" />)}
      </svg>

      {/* Soft-light pass for color richness */}
      <svg
        viewBox="0 0 862 1290.24"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: "soft-light" }}
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        {wallPaths.map((d, i) => <path key={`ws${i}`} d={d} fill={wallColor} opacity="0.35" />)}
        {accentPaths.map((d, i) => <path key={`as${i}`} d={d} fill={accentColor} opacity="0.35" />)}
      </svg>
    </div>
  );
}
