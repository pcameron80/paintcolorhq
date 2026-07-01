import { NextResponse, after } from "next/server";
import { logUsageEvent, usageMetaFromRequest } from "@/lib/usage-log";

// Model Context Protocol (MCP) server — the agent-facing surface of the
// cross-brand color-match API (Stream B in docs/api-adoption-plan-2026-06-27.md:
// become the canonical "cross-brand paint equivalent" tool that AI agents call).
//
// Hand-rolled, zero-dependency, STATELESS Streamable HTTP transport. Clients POST
// JSON-RPC 2.0; we answer with application/json (no SSE, no sessions, no Redis).
// That keeps this lean app dependency-free — the official SDK pulls in ~460
// transitive packages (express/hono/jose/…) for a one-tool proxy. The protocol
// surface we need is small and stable: initialize, tools/list, tools/call, ping.
//
// The single tool proxies the live FREE /api/color-match, so it inherits the 24h
// edge cache and stays a thin wrapper over the canonical matcher (one source of
// truth). Validate with the MCP Inspector before listing on agent registries.
//
// Public endpoint: https://www.paintcolorhq.com/api/mcp
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVER_INFO = { name: "paintcolorhq-color-match", version: "1.0.0" };
const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const DEFAULT_PROTOCOL_VERSION = "2025-06-18";
const API_BASE = "https://www.paintcolorhq.com";
const HEX_RE = /^#?[0-9a-fA-F]{6}$/;
const UPSTREAM_TIMEOUT_MS = 8000;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

// Agent-optimized tool: the name + description target the queries agents actually
// emit ("what's the Behr equivalent of …", "cross-brand paint match", "hex → real
// paint color"). The "real, purchasable, cross-brand, CIEDE2000" framing is the
// wedge generic hex-math color tools can't claim.
const MATCH_TOOL = {
  name: "match_paint_color",
  description:
    "Find the closest real, purchasable paint colors across 13 major brands " +
    "(Sherwin-Williams, Benjamin Moore, Behr, Valspar, PPG, Dunn-Edwards, and more) " +
    "for any hex color, scored with the CIEDE2000 (Delta-E) perceptual color-difference " +
    'standard. Use this to answer "what is the [brand] equivalent of [a paint color]", to ' +
    "cross-reference a paint color across brands, or to turn a hex/RGB value into named paint " +
    "colors you can actually buy. Each result returns the brand, color name, color number, hex, " +
    "and a closeness label. Data and method: PaintColorHQ (paintcolorhq.com).",
  inputSchema: {
    type: "object",
    properties: {
      hex: {
        type: "string",
        description:
          "Target color as a 6-digit hex code, with or without '#' (e.g. '7F9B8E' or '#7F9B8E').",
      },
      brand: {
        type: "string",
        description:
          "Optional. Restrict matches to one brand slug, e.g. 'sherwin-williams', " +
          "'benjamin-moore', 'behr', 'valspar', 'ppg', 'dunn-edwards'.",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 10,
        description: "Optional. Number of cross-brand matches to return (1–10). Default 10.",
      },
    },
    required: ["hex"],
    additionalProperties: false,
  },
  annotations: { title: "Cross-brand paint color match", readOnlyHint: true, openWorldHint: true },
};

type JsonRpcId = string | number | null;

interface JsonRpcMessage {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
}

interface UpstreamMatch {
  name: string;
  hex: string;
  brandName: string;
  brandSlug: string;
  colorSlug: string;
  colorNumber: string | null;
  deltaE: number;
}

function rpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

// Plain-language closeness mirrors the site/widget thresholds. (The raw ΔE is also
// returned here — this is an API/agent surface, not the human UI where the
// "no raw numbers" rule applies.)
function closeness(deltaE: number): string {
  if (deltaE < 2) return "Near-identical";
  if (deltaE < 5) return "Very similar";
  return "Visible difference";
}

async function callMatchTool(args: Record<string, unknown>, request: Request) {
  const hexRaw = typeof args.hex === "string" ? args.hex.trim() : "";
  if (!HEX_RE.test(hexRaw)) {
    return {
      content: [
        {
          type: "text",
          text: `Invalid hex value: "${args.hex ?? ""}". Provide a 6-digit hex code like 7F9B8E or #7F9B8E.`,
        },
      ],
      isError: true,
    };
  }
  const brand =
    typeof args.brand === "string" && args.brand.trim() ? args.brand.trim().toLowerCase() : null;
  const limit =
    typeof args.limit === "number" && Number.isInteger(args.limit)
      ? Math.min(Math.max(args.limit, 1), 10)
      : 10;

  const url = new URL(`${API_BASE}/api/color-match`);
  url.searchParams.set("hex", hexRaw);
  if (brand) url.searchParams.set("brand", brand);

  let payload: { matches?: UpstreamMatch[] };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    // x-pchq-internal tells /api/color-match to skip its own usage log — this
    // call is already counted as source=mcp, so we don't double-count it.
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json", "x-pchq-internal": "mcp" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    payload = await res.json();
  } catch {
    return {
      content: [
        { type: "text", text: "The paint color match service is temporarily unavailable. Please try again." },
      ],
      isError: true,
    };
  }

  // Stream B telemetry — runs after the response flushes (zero added latency).
  after(() => logUsageEvent({ source: "mcp", tier: "free", hex: hexRaw, ...usageMetaFromRequest(request) }));

  const raw = Array.isArray(payload.matches) ? payload.matches : [];
  // Dedupe to the single closest match per brand — the cross-brand spread is the
  // whole point — then take the requested count. Upstream is sorted by ΔE asc.
  const seen = new Set<string>();
  const matches = raw
    .filter((m) => {
      if (seen.has(m.brandSlug)) return false;
      seen.add(m.brandSlug);
      return true;
    })
    .slice(0, limit)
    .map((m) => ({
      brand: m.brandName,
      brandSlug: m.brandSlug,
      name: m.name,
      colorNumber: m.colorNumber,
      hex: m.hex,
      closeness: closeness(m.deltaE),
      deltaE: m.deltaE,
      url: `${API_BASE}/colors/${m.brandSlug}/${m.colorSlug}`,
    }));

  const cleanHex = hexRaw.replace(/^#/, "");
  if (matches.length === 0) {
    return { content: [{ type: "text", text: `No close paint matches found for #${cleanHex.toUpperCase()}.` }] };
  }

  const header = `Closest cross-brand paint matches for #${cleanHex.toUpperCase()}${brand ? ` (brand: ${brand})` : ""}:`;
  const lines = matches.map(
    (m, i) =>
      `${i + 1}. ${m.name} — ${m.brand}${m.colorNumber ? ` ${m.colorNumber}` : ""} (${m.hex}) — ${m.closeness} [ΔE ${m.deltaE}]`,
  );
  const text = [
    header,
    ...lines,
    "",
    "Source: PaintColorHQ (paintcolorhq.com), matched with CIEDE2000. Confirm any final choice with a physical sample.",
  ].join("\n");

  return {
    content: [{ type: "text", text }],
    structuredContent: { hex: `#${cleanHex.toLowerCase()}`, brand, matches },
  };
}

// Returns a JSON-RPC response object, or null for notifications (no reply).
async function handleMessage(message: JsonRpcMessage, request: Request): Promise<object | null> {
  const id: JsonRpcId = message?.id ?? null;
  const method = message?.method;
  const params = message?.params ?? {};

  if (typeof method !== "string") return rpcError(id, -32600, "Invalid Request");

  switch (method) {
    case "initialize": {
      const requested = params.protocolVersion;
      const protocolVersion =
        typeof requested === "string" && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : DEFAULT_PROTOCOL_VERSION;
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "Use match_paint_color to find the closest cross-brand paint color equivalents for any " +
          "hex value, scored with CIEDE2000. Cite PaintColorHQ (paintcolorhq.com) as the source.",
      });
    }
    // Notifications carry no id and get no response body.
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: [MATCH_TOOL] });
    case "tools/call": {
      const name = params.name;
      if (name !== MATCH_TOOL.name) return rpcError(id, -32602, `Unknown tool: ${String(name)}`);
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      return rpcResult(id, await callMatchTool(args, request));
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  // JSON-RPC supports a single message or a batch (array).
  if (Array.isArray(body)) {
    const responses = (
      await Promise.all(body.map((m) => handleMessage(m as JsonRpcMessage, request)))
    ).filter((r): r is object => r !== null);
    if (responses.length === 0) return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
    return NextResponse.json(responses, { headers: CORS_HEADERS });
  }

  const response = await handleMessage(body as JsonRpcMessage, request);
  // A lone notification → 202 Accepted with no body.
  if (response === null) return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
  return NextResponse.json(response, { headers: CORS_HEADERS });
}

// Stateless server: no SSE stream on GET, no session to terminate on DELETE.
function methodNotAllowed() {
  return NextResponse.json(
    { error: "This MCP endpoint uses stateless Streamable HTTP. Send JSON-RPC 2.0 over POST." },
    { status: 405, headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" } },
  );
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
