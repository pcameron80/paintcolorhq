import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey, {
  global: {
    fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
  },
});

// ---------- Undertone logic (mirrors src/lib/color-description.ts) ----------

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

type RawUndertone = "golden" | "pink" | "green" | "blue" | "violet" | "balanced";

function computeUndertone(
  hex: string,
  labA: number | null,
  labB: number | null,
): RawUndertone {
  const [h, s] = hexToHsl(hex);
  const isAchromatic = s < 8;

  if (isAchromatic) {
    if (labA != null && labB != null) {
      if (labB > 3) return "golden";
      if (labA > 2) return "pink";
      if (labB < -2) return "blue";
      if (labA < -2) return "green";
      return "balanced";
    }
    return "balanced";
  }

  if (labA != null && labB != null) {
    if (labA > 8 && labB > 8) return "golden";
    if (labA > 8 && labB <= 8) return "pink";
    if (labA < -5 && labB > 5) return "green";
    if (labA < -5 && labB < -5) return "blue";
    if (labA > 3 && labB < -3) return "violet";
    return "balanced";
  }

  if (h >= 20 && h < 70) return "golden";
  if (h >= 330 || h < 20) return "pink";
  if (h >= 70 && h < 160) return "green";
  if (h >= 200 && h < 270) return "blue";
  if (h >= 270 && h < 330) return "violet";
  return "balanced";
}

const LABEL_MAP: Record<RawUndertone, string> = {
  golden: "Warm (Golden)",
  pink: "Warm (Pink)",
  blue: "Cool (Blue)",
  green: "Cool (Green)",
  violet: "Cool (Violet)",
  balanced: "Neutral",
};

// ---------- Main ----------

async function main() {
  const batchSize = 1000;
  let offset = 0;
  let totalUpdated = 0;
  let hasMore = true;

  console.log("Populating undertone column for all colors...\n");

  while (hasMore) {
    const { data: colors, error } = await supabase
      .from("colors")
      .select("id, hex, lab_a, lab_b_val")
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error("Fetch error:", error);
      process.exit(1);
    }

    if (!colors || colors.length === 0) {
      hasMore = false;
      break;
    }

    // Compute undertones and batch update
    for (const color of colors) {
      const raw = computeUndertone(
        color.hex,
        color.lab_a != null ? Number(color.lab_a) : null,
        color.lab_b_val != null ? Number(color.lab_b_val) : null,
      );
      const undertone = LABEL_MAP[raw];

      const { error: updateError } = await supabase
        .from("colors")
        .update({ undertone })
        .eq("id", color.id);

      if (updateError) {
        console.error(`Error updating ${color.id}:`, updateError);
      }
    }

    totalUpdated += colors.length;
    console.log(`  Processed ${totalUpdated} colors (batch at offset ${offset})`);

    if (colors.length < batchSize) {
      hasMore = false;
    }
    offset += batchSize;
  }

  console.log(`\nDone! Updated ${totalUpdated} colors.`);
}

main();
