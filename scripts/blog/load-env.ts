/**
 * Side-effect module: load .env.local before anything reads process.env.
 *
 * Import this FIRST (before src/lib/queries.ts) in blog pipeline runners.
 * queries.ts → supabase.ts creates the Supabase client at import time from
 * process.env, so the env must be populated before that module evaluates.
 * ES/CJS evaluate imports in source order, so a bare `import "./load-env.ts"`
 * above the queries import guarantees this without top-level await (which tsx's
 * cjs output rejects).
 */
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
