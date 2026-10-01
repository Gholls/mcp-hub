# Host implementation checklist

This document describes what an MCP **host** (an AI app/agent framework) must
implement to connect to `mcp.gholl.com` — from the minimum to render tools as
plain text, up to rendering the interactive **MCP Apps** cards.

There are two levels:

| Level | What works | Extra host requirements |
| --- | --- | --- |
| **L1 — Text tools** | `tools/list`, `tools/call` for all 8 tools (text + `structuredContent`) | Streamable HTTP client |
| **L2 — Interactive cards** | Sandboxed iframe widgets that call back into the conversation | `resources/*` + MCP Apps postMessage bridge |

Reference implementations you can copy from: `@mcp-ui/client` `AppRenderer` /
`AppFrame` (host side) and `@modelcontextprotocol/ext-apps` `App` (view side).

---

## 1. Endpoint & discovery

```
MCP endpoint   https://mcp.gholl.com/mcp        (Streamable HTTP)
Alias          https://mcp.gholl.com/mcp/sse    (same transport)
Health         https://mcp.gholl.com/mcp/health  → {"status":"ok"}
Discovery      https://mcp.gholl.com/.well-known/mcp.json
Agent index    https://mcp.gholl.com/llms.txt
```

- **No authentication** is required.
- **Stateless**: no `Mcp-Session-Id` needed; each request is independent.
- CORS is open (`Access-Control-Allow-Origin: *`) for browser-based hosts.

Minimal client config:

```jsonc
{ "mcpServers": { "gholl": { "type": "http", "url": "https://mcp.gholl.com/mcp" } } }
```

---

## 2. L1 — required transport behavior

- [ ] **JSON-RPC 2.0 over HTTP `POST`**
- [ ] Header `Accept: application/json, text/event-stream` on every `POST`
      (otherwise the server returns `406`)
- [ ] `Content-Type: application/json`
- [ ] `initialize` → send `protocolVersion`; the server negotiates and replies
- [ ] Send `notifications/initialized` after initialize
- [ ] `tools/list`, `tools/call`
- [ ] Read `structuredContent` when present (nice-to-have but recommended)
- [ ] Tolerate `405` (HEAD/unsupported) and `406` gracefully

Example — initialize:

```bash
curl -s -X POST https://mcp.gholl.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{
        "protocolVersion":"2025-06-18","capabilities":{},
        "clientInfo":{"name":"my-host","version":"1.0.0"}}}'
```

Server response:

```json
{
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": { "tools": {}, "resources": {} },
    "serverInfo": { "name": "mcp.gholl.com", "version": "0.1.0" },
    "instructions": "Interactive micro-tools by gholl.com. ..."
  },
  "jsonrpc": "2.0", "id": 1
}
```

Tool result shape (L1):

```json
{
  "result": {
    "content": [{ "type": "text", "text": "18.06 GB VRAM required. ..." }],
    "structuredContent": { "totalVramGB": 18.06, "...": "..." },
    "_meta": { "ui": { "resourceUri": "ui://gholl/vram-calc" } }
  }
}
```

> If `_meta.ui.resourceUri` is absent from a host's model view, the tool still
> works — just render `content`/`structuredContent` as text.

---

## 3. L2 — required `resources` behavior

The UI HTML is **not** inlined in the tool result (to keep responses small).
Fetch it via `resources/read`.

- [ ] `resources/list` (optional — you can go straight from `_meta.ui.resourceUri`)
- [ ] `resources/read` with the URI from the tool's `_meta.ui.resourceUri`

```bash
curl -s -X POST https://mcp.gholl.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"resources/read",
       "params":{"uri":"ui://gholl/vram-calc"}}'
```

Response:

```json
{
  "result": {
    "contents": [{
      "uri": "ui://gholl/vram-calc",
      "mimeType": "text/html;profile=mcp-app",
      "text": "<!doctype html>... (self-contained single-file widget)",
      "_meta": { "ui": {
        "prefersBorder": true,
        "csp": { "connectDomains": [], "resourceDomains": [],
                 "frameDomains": [], "baseUriDomains": [] }
      }}
    }]
  }
}
```

Key facts:

- `mimeType` is **`text/html;profile=mcp-app`** → render as an **MCP App** iframe.
- The HTML is **fully self-contained** (all JS/CSS inline, no external requests),
  so a **deny-all CSP** (empty domain lists) is correct and safest.
- Resource URIs are `ui://gholl/<tool-id>`.

---

## 4. L2 — the MCP Apps postMessage bridge

The widget expects the host to speak the **MCP Apps** protocol over
`postMessage` (JSON-RPC 2.0 message objects). See
`@modelcontextprotocol/ext-apps` for the canonical schemas.

### Message envelope

```ts
// guest → host (widget runs inside the iframe)
iframe.contentWindow  // irrelevant; widget does window.parent.postMessage(msg, '*')
// host → guest
iframe.contentWindow.postMessage(msg, '<guest-origin-or-*>')
```

```jsonc
{ "jsonrpc": "2.0", "id": 7, "method": "ui/initialize", "params": { } }   // request
{ "jsonrpc": "2.0", "id": 7, "result": { } }                              // response
{ "jsonrpc": "2.0", "method": "ui/notifications/tool-input", "params": { } } // notification
```

### Methods the host must handle

**Host → Guest (requests the host answers when the widget calls back)**

| Method | Params | Result |
| --- | --- | --- |
| `tools/call` | `{ name, arguments }` | `CallToolResult` (proxy to the MCP server, or handle yourself) |
| `ui/message` | `{ role:"user", content:[{type:"text",text}] }` | `{}` (append to the conversation) |
| `ui/open-link` | `{ url }` | `{ isError?: boolean }` |
| `ui/request-display-mode` | `{ mode: "inline"\|"pip"\|"fullscreen" }` | `{ mode }` |
| `ui/download-file` | `{ contents:[...] }` | `{ isError?: boolean }` |

**Host → Guest (notifications the host pushes to the widget)**

| Method | Params | Why |
| --- | --- | --- |
| `ui/initialize` (request) | `{ appInfo, appCapabilities, protocolVersion }` | handshake |
| `ui/notifications/initialized` | `{}` | (sent by the widget) ack |
| `ui/notifications/tool-input` | `{ arguments }` | pass the tool args so the card renders the right data |
| `ui/notifications/tool-result` | `CallToolResult` | pass the result |
| `ui/notifications/host-context-changed` | `McpUiHostContext` (partial) | theme / locale / display mode changes |
| `ui/resource-teardown` (request) | `{}` | tell the widget it is being unmounted |

**Guest → Host (notifications from the widget the host should apply)**

| Method | Params | Why |
| --- | --- | --- |
| `ui/notifications/size-changed` | `{ width?, height? }` | resize the iframe to fit |
| `ui/notifications/initialized` | `{}` | widget finished init |

### `ui/initialize` handshake — host must reply with all four fields

```jsonc
// request (guest → host)
{ "jsonrpc":"2.0", "id":1, "method":"ui/initialize",
  "params": { "appInfo": {"name":"mcp.gholl.com","version":"0.1.0"},
              "appCapabilities": {}, "protocolVersion":"2025-11-21" } }

// response (host → guest)  ← REQUIRED fields
{ "jsonrpc":"2.0", "id":1, "result": {
    "protocolVersion": "2025-11-21",
    "hostInfo": { "name": "my-host", "version": "1.0.0" },
    "hostCapabilities": { "serverTools": {}, "serverResources": {}, "openLinks": {} },
    "hostContext": {
      "theme": "dark",
      "locale": "zh-CN",                 // ← controls card language (en/zh)
      "displayMode": "inline",
      "availableDisplayModes": ["inline","fullscreen"],
      "containerDimensions": { "maxWidth": 720, "maxHeight": 640 }
    }
} }
```

> The widget reads `hostContext.locale` (falls back to `toolInput.locale`) to
> pick its UI language, and uses `autoResize` to report height.

---

## 5. Host responsibilities checklist

**Sandbox / security**
- [ ] Render widget HTML in an iframe with `sandbox="allow-scripts"` (add
      `allow-forms`/`allow-popups` if you support those actions). Do **not** use
      `allow-same-origin` with `srcdoc` unless you understand the implications.
- [ ] Apply the resource CSP from `_meta.ui.csp` (here: deny all external).
- [ ] Validate `event.origin` / use a dedicated sandbox origin where possible.

**Lifecycle**
- [ ] On tool call: forward `tool-input` (args) and `tool-result` to the iframe.
- [ ] Respond to `ui/initialize` before the widget waits (it has a timeout).
- [ ] Send `ui/resource-teardown` before unmounting; then destroy the iframe.
- [ ] Push `host-context-changed` on theme/locale/display-mode changes.

**Rendering**
- [ ] Size the iframe from `ui/notifications/size-changed` (the widget uses a
      `ResizeObserver`; initial height comes from `hostContext.containerDimensions`).
- [ ] Provide `hostContext.theme` (`light`/`dark`) and `locale` for a good UX.
- [ ] Handle `ui/open-link` (brand link / referral) — otherwise the widget falls
      back to `window.open`.

**Graceful degradation**
- [ ] If you don't support MCP Apps, render `content` + `structuredContent` as
      text. Tools remain fully usable; only the visual card is lost.
- [ ] Optionally offer a fallback link to
      `https://mcp.gholl.com/embed/<tool-id>` (open in a browser tab).

---

## 6. Feature / compatibility matrix

| Host | L1 text | L2 cards | Notes |
| --- | --- | --- | --- |
| Claude Desktop / Claude Code | ✅ | ✅ | Use `type:"http"`, URL `/mcp` |
| Cursor / VS Code (Copilot) | ✅ | ✅ | `mcp.json` http server |
| LibreChat | ✅ | ✅ | `streamable-http` |
| Cline / Continue | ✅ | ✅ (if MCP Apps enabled) | http transport |
| Dify / FastGPT (MCP plugin) | ✅ | depends on plugin | Streamable HTTP |
| ChatGPT (Apps SDK) | ✅ | ⚠️ | Needs the Apps SDK adapter (server-side) |

---

## 7. Automated self-test (host CI)

```bash
B=https://mcp.gholl.com/mcp
H=(-H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream')

# 1. handshake
curl -s "${H[@]}" -X POST $B -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"ci","version":"1"}}}'

# 2. tool list (expects 8)
curl -s "${H[@]}" -X POST $B -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# 3. call a tool
curl -s "${H[@]}" -X POST $B -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"vram-calc","arguments":{"modelParamsB":7}}}'

# 4. fetch the UI card
curl -s "${H[@]}" -X POST $B -d '{"jsonrpc":"2.0","id":4,"method":"resources/read","params":{"uri":"ui://gholl/vram-calc"}}'
```

A passing host implementation must:
- [ ] complete `initialize` and see `capabilities.tools` + `capabilities.resources`
- [ ] list 8 tools, each with `_meta.ui.resourceUri`
- [ ] call a tool and receive `content` + `structuredContent`
- [ ] read `ui://gholl/<id>` and receive `text/html;profile=mcp-app`
- [ ] render it and complete the `ui/initialize` bridge handshake

---

## 8. Known limitations

- Only **Streamable HTTP**. A legacy “SSE + POST `/messages`” client is not
  supported (`/mcp/sse` is an alias for the same transport).
- The endpoint is a **bot/agent** endpoint — opening `/mcp` in a browser shows a
  help page, not the app.
- Outbound probes (`api-uptime`, `schema-viewer` URL mode) only allow public
  `http(s)` hosts (private/loopback addresses are rejected).
