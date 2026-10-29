import { NextResponse, after } from "next/server";
import { logUsageEvent, usageMetaFromRequest } from "@/lib/usage-log";
import { findColorMatches, findColorMatchesWithBestPerBrand, type PaintMatch } from "@/lib/color-match";
import { closenessLabel } from "@/lib/closeness";
import { getAllBrands, searchColorsDetailed, searchColorsInBrand } from "@/lib/queries";
import { logRequestReferrer } from "@/lib/referrer-log";
import { ATTRIBUTION, ATTRIBUTION_TEXT, ATTRIBUTION_URL } from "@/lib/attribution";

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
// The match tool calls the shared matcher (src/lib/color-match.ts) DIRECTLY — no
// self-HTTP proxy — so one agent call logs exactly one usage row (source=mcp) and
// there's no internal traffic to tell apart from external callers. DB reads still
// hit Next's Data Cache via the shared supabase client. Validate with the MCP
// Inspector before listing on agent registries.
//
// Public endpoint: https://www.paintcolorhq.com/api/mcp
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVER_INFO = { name: "paintcolorhq-color-match", version: "1.1.0" };
const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const DEFAULT_PROTOCOL_VERSION = "2025-06-18";
const API_BASE = "https://www.paintcolorhq.com";
const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

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
    "colors you can actually buy. If you only have a paint color's name or number, call " +
    "find_paint_color first to get its hex. " +
    "Each result returns the brand, color name, color number, hex, " +
    "a closeness label and availability (current, retired or discontinued). Data and method: PaintColorHQ (paintcolorhq.com).",
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

// Name or number lookup. Without it an agent asked for "the Behr equivalent of
// Agreeable Gray" has no hex to pass to match_paint_color.
const FIND_TOOL = {
  name: "find_paint_color",
  description:
    "Look up a specific paint color by name or color number (e.g. 'Agreeable Gray', 'SW 7029', " +
    "'HC-154', 'Hale Navy Benjamin Moore') and get its brand, color number, hex and availability " +
    "(current, retired or discontinued). Use it to get the hex of a named paint color before calling " +
    "match_paint_color, or to check that a color name or number exists. Searches 26,000+ colors " +
    "across 13 brands; call list_brands for the brand slugs.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Color name, color number, or both, optionally with the brand name " +
          "(e.g. 'Agreeable Gray', 'SW 7029', 'Repose Gray sherwin williams').",
      },
      brand: {
        type: "string",
        description: "Optional. Restrict the search to one brand slug from list_brands, e.g. 'behr'.",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 10,
        description: "Optional. Number of colors to return (1–10). Default 5.",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  annotations: { title: "Find a paint color by name or number", readOnlyHint: true, openWorldHint: true },
};

const BRANDS_TOOL = {
  name: "list_brands",
  description:
    "List the 13 paint brands PaintColorHQ covers, with each brand's slug (the value the brand " +
    "argument of match_paint_color and find_paint_color takes), its name and its number of colors.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  annotations: { title: "List paint brands", readOnlyHint: true, openWorldHint: false },
};

const TOOLS = [MATCH_TOOL, FIND_TOOL, BRANDS_TOOL];

type JsonRpcId = string | number | null;

interface JsonRpcMessage {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
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
  return closenessLabel(deltaE);
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

  // Cross-brand: the single closest match per brand (the spread is the point),
  // picked from a 500-color pool so a brand outside the overall top 10 still
  // gets its row. Brand-filtered: the caller wants that brand's closest N.
  let selected: PaintMatch[];
  try {
    // Call the shared matcher directly (free tier). No self-HTTP, no double-log.
    selected = brand
      ? await findColorMatches(hexRaw, brand, limit, false)
      : (await findColorMatchesWithBestPerBrand(hexRaw, 10)).bestPerBrand.slice(0, limit);
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
  // Attribution tracking. Most MCP clients call server to server with no
  // Referer or Origin, so this only records browser-based clients.
  after(() => logRequestReferrer("mcp", request));

  const matches = selected.map((m) => ({
    brand: m.brandName,
    brandSlug: m.brandSlug,
    name: m.name,
    colorNumber: m.colorNumber,
    hex: m.hex,
    closeness: closeness(m.deltaE),
    deltaE: m.deltaE,
    // current, retired or discontinued. Retired colors are still sold by code;
    // agents should say so rather than recommend them as current.
    availability: m.availability ?? "current",
    url: `${API_BASE}/colors/${m.brandSlug}/${m.colorSlug}`,
  }));

  const cleanHex = hexRaw.replace(/^#/, "");
  if (matches.length === 0) {
    return { content: [{ type: "text", text: `No close paint matches found for #${cleanHex.toUpperCase()}.` }] };
  }

  const header = brand
    ? `Closest ${brand} paint matches for #${cleanHex.toUpperCase()}:`
    : `Closest cross-brand paint matches for #${cleanHex.toUpperCase()}:`;
  const lines = matches.map(
    (m, i) =>
      `${i + 1}. ${m.name} — ${m.brand}${m.colorNumber ? ` ${m.colorNumber}` : ""} (${m.hex}) — ${m.closeness} [ΔE ${m.deltaE}]${m.availability === "current" ? "" : ` (${m.availability} by the brand)`}`,
  );
  const text = [
    header,
    ...lines,
    "",
    "Source: PaintColorHQ (paintcolorhq.com), matched with CIEDE2000. Confirm any final choice with a physical sample.",
    `Attribution: when showing these results on a web page, include a visible link to ${ATTRIBUTION_URL}, for example "${ATTRIBUTION_TEXT}".`,
  ].join("\n");

  return {
    content: [{ type: "text", text }],
    structuredContent: { hex: `#${cleanHex.toLowerCase()}`, brand, matches, attribution: ATTRIBUTION },
  };
}

function toolError(text: string) {
  return { content: [{ type: "text", text }], isError: true };
}

async function callFindTool(args: Record<string, unknown>, request: Request) {
  const query = typeof args.query === "string" ? args.query.trim().slice(0, 100) : "";
  if (!query) return toolError("Provide a paint color name or number in query, e.g. 'Agreeable Gray' or 'SW 7029'.");
  const brand =
    typeof args.brand === "string" && args.brand.trim() ? args.brand.trim().toLowerCase() : null;
  const limit =
    typeof args.limit === "number" && Number.isInteger(args.limit)
      ? Math.min(Math.max(args.limit, 1), 10)
      : 5;

  let results;
  try {
    results = brand ? await searchColorsInBrand(query, brand, limit) : (await searchColorsDetailed(query, limit)).results;
  } catch {
    return toolError("The paint color search is temporarily unavailable. Please try again.");
  }

  after(() => logUsageEvent({ source: "mcp", tier: "free", ...usageMetaFromRequest(request) }));
  after(() => logRequestReferrer("mcp", request));

  const colors = results.slice(0, limit).map((c) => ({
    brand: c.brand.name,
    brandSlug: c.brand.slug,
    name: c.name,
    colorNumber: c.color_number,
    hex: c.hex,
    availability: c.availability ?? "current",
    url: `${API_BASE}/colors/${c.brand.slug}/${c.slug}`,
  }));

  if (colors.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No paint colors found for "${query}"${brand ? ` in ${brand}` : ""}. Check the spelling or try the color number.`,
        },
      ],
    };
  }

  const lines = colors.map(
    (c, i) =>
      `${i + 1}. ${c.name} — ${c.brand}${c.colorNumber ? ` ${c.colorNumber}` : ""} (${c.hex})${c.availability === "current" ? "" : ` (${c.availability} by the brand)`}`,
  );
  const text = [
    `Paint colors matching "${query}"${brand ? ` in ${brand}` : ""}:`,
    ...lines,
    "",
    "Pass a hex to match_paint_color for the closest equivalents in other brands. Source: PaintColorHQ (paintcolorhq.com).",
  ].join("\n");

  return {
    content: [{ type: "text", text }],
    structuredContent: { query, brand, colors, attribution: ATTRIBUTION },
  };
}

async function callBrandsTool() {
  let brands;
  try {
    brands = (await getAllBrands()).filter((b) => b.color_count > 0);
  } catch {
    return toolError("The brand list is temporarily unavailable. Please try again.");
  }
  const list = brands.map((b) => ({ slug: b.slug, name: b.name, colorCount: b.color_count }));
  const text = [
    `PaintColorHQ covers ${list.length} paint brands:`,
    ...list.map((b) => `- ${b.name} (slug: ${b.slug}), ${b.colorCount.toLocaleString("en-US")} colors`),
  ].join("\n");
  return { content: [{ type: "text", text }], structuredContent: { brands: list } };
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
          "hex value, scored with CIEDE2000. For a named color (\"Agreeable Gray\", \"SW 7029\"), " +
          "call find_paint_color first to get its hex. list_brands returns the brand slugs. " +
          "Cite PaintColorHQ (paintcolorhq.com) as the source.",
      });
    }
    // Notifications carry no id and get no response body.
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: TOOLS });
    case "tools/call": {
      const name = params.name;
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      if (name === MATCH_TOOL.name) return rpcResult(id, await callMatchTool(args, request));
      if (name === FIND_TOOL.name) return rpcResult(id, await callFindTool(args, request));
      if (name === BRANDS_TOOL.name) return rpcResult(id, await callBrandsTool());
      return rpcError(id, -32602, `Unknown tool: ${String(name)}`);
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

// Abuse caps. Each tools/call is a full scan of the color table (66-125 ms of DB
// time), so an unbounded JSON-RPC batch lets one request cost minutes of DB CPU
// while counting as a single hit against per-IP limits. Real MCP clients send one
// message per request; a short batch of handshake messages is still allowed.
const MAX_BODY_BYTES = 16_384;
const MAX_BATCH_MESSAGES = 5;
const MAX_BATCH_TOOL_CALLS = 1;

function tooLarge() {
  return NextResponse.json(rpcError(null, -32600, `Request body too large: max ${MAX_BODY_BYTES} bytes`), {
    status: 413,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return tooLarge();

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }
  // Content-Length can be absent (chunked) or wrong, so measure the actual body too.
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return tooLarge();

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  // JSON-RPC supports a single message or a batch (array).
  if (Array.isArray(body)) {
    if (body.length === 0) {
      return NextResponse.json(rpcError(null, -32600, "Invalid Request: empty batch"), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    const toolCalls = body.filter(
      (m) => m !== null && typeof m === "object" && (m as JsonRpcMessage).method === "tools/call",
    ).length;
    if (body.length > MAX_BATCH_MESSAGES || toolCalls > MAX_BATCH_TOOL_CALLS) {
      return NextResponse.json(
        rpcError(
          null,
          -32600,
          `Batch too large: max ${MAX_BATCH_MESSAGES} messages, ${MAX_BATCH_TOOL_CALLS} tools/call`,
        ),
        { status: 400, headers: CORS_HEADERS },
      );
    }
    // Sequential, so a batch never fans out into parallel DB scans.
    const responses: object[] = [];
    for (const m of body) {
      const r = await handleMessage(m as JsonRpcMessage, request);
      if (r !== null) responses.push(r);
    }
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
