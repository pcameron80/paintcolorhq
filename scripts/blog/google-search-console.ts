/**
 * Minimal Google Search Console client for scripts, using a service-account key
 * and Node's own crypto (no googleapis dependency).
 *
 * Key file: $GSC_SERVICE_ACCOUNT_KEY, default ~/.claude/keys/gsc-service-account.json
 * (the same service account the gsc MCP server uses; it has siteFullUser on
 * sc-domain:paintcolorhq.com). The key is read here and never printed.
 *
 * What the API allows: resubmitting a sitemap and inspecting a URL's index
 * status. It has NO "Request indexing" equivalent; that button is UI-only, and
 * Google's separate Indexing API is limited to job-posting and livestream pages.
 */
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const SCOPE = "https://www.googleapis.com/auth/webmasters";
const KEY_PATH =
  process.env.GSC_SERVICE_ACCOUNT_KEY ?? path.join(os.homedir(), ".claude/keys/gsc-service-account.json");

let cached: { token: string; exp: number } | null = null;

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const key = JSON.parse(fs.readFileSync(KEY_PATH, "utf8")) as {
    client_email: string;
    private_key: string;
    token_uri?: string;
  };
  const tokenUri = key.token_uri ?? "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })) +
    "." +
    b64url(JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: tokenUri, iat: now, exp: now + 3600 }));
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), key.private_key);
  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${b64url(signature)}`,
    }),
  });
  if (!res.ok) throw new Error(`GSC auth failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return cached.token;
}

/** Resubmit a sitemap that is already registered on the property. */
export async function submitSitemap(siteUrl: string, sitemapUrl: string): Promise<void> {
  const url =
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}` +
    `/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const res = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${await accessToken()}` } });
  if (!res.ok) throw new Error(`GSC sitemap submit failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

export interface InspectionResult {
  verdict: string;
  coverageState: string;
  lastCrawlTime?: string;
}

/** URL Inspection API: Google's current index status for one URL. */
export async function inspectUrl(siteUrl: string, inspectionUrl: string): Promise<InspectionResult> {
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: "en-US" }),
  });
  if (!res.ok) throw new Error(`GSC inspection failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as {
    inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string } };
  };
  const r = json.inspectionResult?.indexStatusResult ?? {};
  return {
    verdict: r.verdict ?? "VERDICT_UNSPECIFIED",
    coverageState: r.coverageState ?? "unknown",
    lastCrawlTime: r.lastCrawlTime,
  };
}
