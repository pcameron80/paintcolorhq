/**
 * Pinterest OAuth — one-time token mint.
 *
 * The dashboard "Generate token" button only grants READ scopes. To publish
 * pins we need pins:write, which requires the full OAuth authorization flow.
 * This script runs that flow locally:
 *
 *   1. Spins up a localhost listener on REDIRECT (default :8732).
 *   2. Opens the Pinterest consent screen requesting the scopes we need.
 *   3. Catches the redirect ?code=..., exchanges it (App ID + secret) for an
 *      access token + refresh token, and writes both back to .env.local.
 *
 * PREREQUISITE — add this exact redirect URI in the Pinterest app dashboard
 * (Redirect URIs section), or the consent screen will reject the request:
 *
 *   http://localhost:8732/callback
 *
 * Run:  npx tsx scripts/pinterest-auth.ts
 */
import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import { randomBytes } from "crypto";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, "../.env.local");
dotenv.config({ path: ENV_PATH });

const APP_ID = process.env.PINTEREST_APP_ID;
const APP_SECRET = process.env.PINTEREST_APP_SECRET_KEY;
const PORT = 8732;
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPES = ["boards:read", "boards:write", "pins:read", "pins:write", "user_accounts:read"];

if (!APP_ID || !APP_SECRET) {
  console.error("Missing PINTEREST_APP_ID or PINTEREST_APP_SECRET_KEY in .env.local");
  process.exit(1);
}

/** Upsert a KEY=value line in .env.local, preserving everything else. */
function upsertEnv(updates: Record<string, string>) {
  let lines = fs.readFileSync(ENV_PATH, "utf8").split("\n");
  for (const [key, value] of Object.entries(updates)) {
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    const line = `${key}=${value}`;
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  fs.writeFileSync(ENV_PATH, lines.join("\n"));
}

async function exchangeCode(code: string) {
  const basic = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString("base64");
  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${JSON.stringify(data)}`);
  return data as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_token_expires_in?: number;
    scope: string;
  };
}

const state = randomBytes(16).toString("hex");
const authUrl =
  "https://www.pinterest.com/oauth/?" +
  new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end("Not found");
    return;
  }
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400).end(`Authorization denied: ${error}`);
    console.error(`\n❌ Authorization denied: ${error}`);
    server.close();
    process.exit(1);
  }
  if (returnedState !== state) {
    res.writeHead(400).end("State mismatch — possible CSRF. Aborted.");
    console.error("\n❌ State mismatch. Aborted.");
    server.close();
    process.exit(1);
  }
  if (!code) {
    res.writeHead(400).end("No code in callback.");
    return;
  }

  try {
    const token = await exchangeCode(code);
    upsertEnv({
      PINTEREST_ACCESS_TOKEN: token.access_token,
      PINTEREST_REFRESH_TOKEN: token.refresh_token,
    });
    res.writeHead(200, { "Content-Type": "text/html" }).end(
      "<h2>✅ Pinterest authorized.</h2><p>Tokens saved to .env.local. You can close this tab and return to the terminal.</p>"
    );
    const days = token.expires_in ? Math.round(token.expires_in / 86400) : "?";
    console.log("\n✅ Authorized and saved to .env.local");
    console.log(`   Scopes:  ${token.scope}`);
    console.log(`   Access token expires in ~${days} days (refresh token saved for renewal).`);
    server.close();
    process.exit(0);
  } catch (e) {
    res.writeHead(500).end(String(e));
    console.error("\n❌", e);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log("Pinterest OAuth — requesting scopes:", SCOPES.join(", "));
  console.log(`\nIf your browser doesn't open, paste this URL:\n\n${authUrl}\n`);
  execFile("open", [authUrl]); // macOS — no shell, URL passed as a single arg
});
