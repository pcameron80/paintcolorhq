# PaintColorHQ MCP Server

The agent-facing surface of the cross-brand color-match API — Stream B in
`docs/api-adoption-plan-2026-06-27.md` ("become the canonical cross-brand paint
equivalent tool that AI agents call"). It is a thin, stateless Model Context
Protocol server that wraps the live `/api/color-match` endpoint.

## Endpoint

```
https://www.paintcolorhq.com/api/mcp
```

- Transport: **Streamable HTTP**, stateless (JSON-RPC 2.0 over POST; no SSE, no
  sessions, no auth, no key).
- Source: `src/app/api/mcp/route.ts` (hand-rolled, zero new dependencies).
- It proxies the **free** tier of `/api/color-match`, so it inherits the 24h edge
  cache and the single source of truth for matching.

## Tool

`match_paint_color` — find the closest real, purchasable paint colors across 13
brands for any hex value, scored with CIEDE2000.

| Arg | Required | Description |
|-----|----------|-------------|
| `hex` | yes | 6-digit hex, with or without `#` (e.g. `7F9B8E`). |
| `brand` | no | Restrict to one brand slug (`sherwin-williams`, `behr`, …). |
| `limit` | no | 1–10 cross-brand matches (default 10). |

Returns a readable text summary plus `structuredContent` (`{ hex, brand, matches }`)
with brand, name, color number, hex, closeness label, ΔE, and the canonical
color-page URL — citing PaintColorHQ as the source.

## Verify before listing

Test with the official MCP Inspector (no install needed):

```bash
npx @modelcontextprotocol/inspector
# Transport: "Streamable HTTP"  →  URL: https://www.paintcolorhq.com/api/mcp
# Then: Connect → Tools → list → run match_paint_color { "hex": "7F9B8E" }
```

Or a raw curl round-trip:

```bash
# initialize
curl -s https://www.paintcolorhq.com/api/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'

# tools/list
curl -s https://www.paintcolorhq.com/api/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# tools/call
curl -s https://www.paintcolorhq.com/api/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"match_paint_color","arguments":{"hex":"7F9B8E"}}}'
```

## Where to list it (manual distribution — the Stream B flywheel)

Once verified on prod:

- **Smithery** (https://smithery.ai) — submit the remote server URL.
- **MCP registry / directories** — the official registry, `mcp.so`, Glama, PulseMCP.
- **`awesome-mcp-servers`** — open a PR adding it under a "Design / Color" entry.
- **ChatGPT connectors / app directory** — if/when eligible for a remote MCP connector.

Pitch line for listings: *"Cross-brand paint color matching — find the closest
real, purchasable paint colors across 13 brands (Sherwin-Williams, Benjamin Moore,
Behr, …) for any hex value, scored with CIEDE2000. Free, no key."*

## Instrumentation

Every tool call logs a row to `api_usage_events` (`source = 'mcp'`) via
`src/lib/usage-log.ts`. Read with `npm run adoption-report` (Stream B counts +
distinct agent clients).
