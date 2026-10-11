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

import { computeUndertone, LABEL_MAP } from "./lib/undertone";

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
