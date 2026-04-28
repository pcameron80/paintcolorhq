/**
 * Pinterest OAuth — callback handler.
 *
 * Receives the authorization code, validates state, exchanges code for
 * access + refresh tokens, and renders a one-time success page that
 * surfaces the tokens for manual capture into Vercel env vars.
 *
 * This is a bootstrap-only flow. Once the auto-pinner cron is built, token
 * refresh will be automated via Supabase persistence; for now we just need
 * the demo flow to work for the Pinterest standard-access review video.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REDIRECT_URI = "https://www.paintcolorhq.com/api/auth/pinterest/callback";

interface PinterestTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_token_expires_in: number;
  scope: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderError(title: string, detail: string): NextResponse {
  return new NextResponse(
    `<!doctype html><html><head><title>${escapeHtml(title)}</title><meta name="robots" content="noindex"/></head><body style="font-family:system-ui;padding:40px;max-width:680px;margin:0 auto;"><h1 style="color:#b91c1c">${escapeHtml(title)}</h1><pre style="background:#f3f4f6;padding:16px;border-radius:8px;overflow:auto">${escapeHtml(detail)}</pre><p><a href="/api/auth/pinterest/start">Retry</a></p></body></html>`,
    { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return renderError("Pinterest authorization denied", `error=${error}`);
  }
  if (!code) return renderError("Missing authorization code", "Pinterest did not return a `code` parameter.");

  const cookieState = req.cookies.get("pinterest_oauth_state")?.value;
  if (!state || !cookieState || state !== cookieState) {
    return renderError("State mismatch", "OAuth state cookie did not match. Restart the flow at /api/auth/pinterest/start.");
  }

  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return renderError("Server misconfigured", "PINTEREST_CLIENT_ID or PINTEREST_CLIENT_SECRET env var not set.");
  }

  // Exchange code for tokens
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return renderError(`Token exchange failed (${tokenRes.status})`, errText);
  }

  const tokens = (await tokenRes.json()) as PinterestTokenResponse;
  const expiresInDays = Math.round((tokens.expires_in / 86400) * 10) / 10;
  const refreshExpiresInDays = Math.round((tokens.refresh_token_expires_in / 86400) * 10) / 10;

  const html = `<!doctype html><html><head><title>Pinterest connected</title><meta name="robots" content="noindex"/><style>
    body{font-family:system-ui;padding:40px;max-width:780px;margin:0 auto;line-height:1.5}
    h1{color:#059669;margin-bottom:8px}
    .note{color:#6b7280;font-size:14px}
    .field{margin-top:24px}
    .field label{display:block;font-weight:600;margin-bottom:4px}
    .field code{display:block;background:#f3f4f6;padding:12px;border-radius:6px;word-break:break-all;font-size:12px;font-family:ui-monospace,monospace}
    .meta{display:flex;gap:16px;font-size:13px;color:#374151;margin-top:16px}
    .meta div{background:#eff6ff;padding:8px 12px;border-radius:6px}
    .next{background:#fef3c7;padding:16px;border-radius:8px;margin-top:32px;font-size:14px}
  </style></head><body>
    <h1>✓ Pinterest connected</h1>
    <p class="note">Authorization complete. Copy these tokens to Vercel env vars (one-time bootstrap).</p>

    <div class="field">
      <label>PINTEREST_ACCESS_TOKEN</label>
      <code>${escapeHtml(tokens.access_token)}</code>
    </div>

    <div class="field">
      <label>PINTEREST_REFRESH_TOKEN</label>
      <code>${escapeHtml(tokens.refresh_token)}</code>
    </div>

    <div class="meta">
      <div>access_token expires in <strong>${expiresInDays} days</strong></div>
      <div>refresh_token expires in <strong>${refreshExpiresInDays} days</strong></div>
    </div>

    <div class="field">
      <label>Granted scopes</label>
      <code>${escapeHtml(tokens.scope)}</code>
    </div>

    <div class="next">
      <strong>Next:</strong> paste both tokens into Vercel → Settings → Environment Variables (production).
      Then redeploy or trigger any function — the auto-pinner cron will read them from there.
    </div>
  </body></html>`;

  const res = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
  });
  res.cookies.delete("pinterest_oauth_state");
  return res;
}
