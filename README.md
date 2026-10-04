**English** | [中文](./README.zh.md)

# mcp-hub

[![CI](https://github.com/Gholls/mcp-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/Gholls/mcp-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Interactive micro-tools for humans **and** AI agents, served from
[`mcp.gholl.com`](https://mcp.gholl.com).

- **For humans** — a login-free playground of fast, single-purpose widgets.
- **For AI agents** — the same widgets exposed as [MCP](https://modelcontextprotocol.io)
  tools that render as sandboxed iframe apps
  ([MCP Apps](https://github.com/modelcontextprotocol/ext-apps)).

One tool definition (`shared/tools.ts`) powers four surfaces: the gallery, the
SEO landing page, the sandboxed embed, and the MCP server + discovery document.

| Live | |
| --- | --- |
| Site | https://mcp.gholl.com |
| MCP endpoint | `https://mcp.gholl.com/mcp` (Streamable HTTP, no auth) |
| Discovery | https://mcp.gholl.com/.well-known/mcp.json |
| Agent index | https://mcp.gholl.com/llms.txt |

## Tools

| id | Tool | Category | What it does |
| --- | --- | --- | --- |
| `vram-calc` | GPU VRAM & Deployment Estimator | Infrastructure | Estimate LLM serving VRAM, recommend GPUs, generate vLLM / Ollama commands |
| `cron-debugger` | Cron & Regex Debugger | Developer | Explain cron schedules, list next runs, test regexes with highlighting |
| `schema-viewer` | JSON-LD / Schema Viewer | Data | Validate & explore JSON / JSON-LD with a collapsible tree |
| `api-uptime` | API Health & Latency | Monitoring | Live probe + 24h uptime/latency dashboard |
| `jwt-decoder` | JWT Decoder | Developer | Decode header/payload/claims and check expiry |
| `hash-generator` | Hash Generator | Developer | SHA-1 / SHA-256 / SHA-512 digests (hex + base64), local |
| `color-studio` | Color Studio & Contrast | Design | hex/RGB/HSL conversion, tints/shades, WCAG contrast checks |
| `chrono-energy` | BaZi Chrono-Energy Wheel | Culture | Four Pillars, five-element radar and luck cycles (beta) |
| `gomoku` | Gomoku · Play vs AI | Games | Five-in-a-row against the host's own AI (board + rules live in the card) |

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Tool gallery + playground (prerendered) |
| `/tools/:id` | SEO landing page for one tool (prerendered + SPA) |
| `/embed/:id` | Sandboxed, per-widget single-file app (iframe / MCP Apps) |
| `/app/:id/index.html` | Raw per-widget bundle (used internally) |
| `/mcp`, `/mcp/sse` | MCP endpoint (Streamable HTTP / JSON-RPC) |
| `/.well-known/mcp.json` | Agent discovery document |
| `/llms.txt`, `/sitemap.xml`, `/robots.txt` | SEO / GEO surfaces |
| `/og/:name.png` | Generated Open Graph images |

`GET /mcp` (no `text/event-stream`) returns the discovery document; a browser
gets a help page. `POST /mcp` is the JSON-RPC transport. See
[`docs/host-integration.md`](docs/host-integration.md) for the full matrix.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · `@mcp-ui/*` ·
`@modelcontextprotocol/ext-apps` · Cloudflare Workers + static assets ·
Vitest · GitHub Actions.

## Architecture

```
shared/
  tools.ts            Single source of truth (ToolMeta: schema, i18n, examples)
  calc/               Pure logic reused by widgets AND the MCP server
  mcp/                MCP server, HTTP handler, discovery builders
worker/index.ts       Cloudflare Worker: /mcp, /.well-known, /embed, /tools, SPA
src/
  pages/              Home, ToolPage, EmbedPage
  components/         Layout, ToolCard, ParamTable, WidgetHost, ui, ...
  widgets/<id>/       Interactive widget components (lazy-loaded)
scripts/
  build-embeds.mjs    One self-contained HTML per widget -> dist/app/<id>
  build-og.mjs        Open Graph PNGs -> dist/og
  prerender.mjs       Crawler-visible HTML for / and /tools/<id> -> dist/tools
docs/                 integrations.md (clients), host-integration.md (hosts)
```

### How the UI cards are delivered

Each tool returns a small result (`text` + `structuredContent`) plus
`_meta.ui.resourceUri = ui://gholl/<id>`. Hosts fetch the card HTML via
`resources/read` and get a **self-contained single-file app**
(`text/html;profile=mcp-app`, no external requests). The same widgets are also
served as regular pages (`/tools/:id`) and iframes (`/embed/:id`).

### Performance & SEO/GEO

- The main site is **code-split** (lazy routes + lazy widgets); first paint is
  ~2 KB HTML + ~100 KB gzip total. Widgets load only when opened.
- **Prerendered** content is emitted for `/` and every `/tools/:id`, so AI
  crawlers that don't run JS still see full content, parameter tables and links.
- Rich structured data: `WebSite`, `ItemList`, `SoftwareApplication`,
  `BreadcrumbList`, `FAQPage`, `Organization`. Per-tool OG images.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Vite dev server (UI only; no Worker/MCP) |
| `pnpm dev:worker` | Serve `dist` + Worker locally via `wrangler dev` (needs `pnpm build` first) |
| `pnpm build` | Type-check, build web, per-widget embeds, OG images, prerender |
| `pnpm build:web` | Fast path: type-check + web build only |
| `pnpm preview` | Preview the built site with `vite preview` |
| `pnpm test` / `test:watch` | Vitest unit + MCP integration tests |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | App TypeScript |
| `pnpm typecheck:functions` | Worker TypeScript |
| `pnpm deploy` | `pnpm build && wrangler deploy` |

## Development

```bash
pnpm install
pnpm dev            # http://localhost:5173 (UI only)
pnpm build && pnpm dev:worker   # full stack incl. /mcp on http://localhost:8787
pnpm test
```

## Deployment (Cloudflare)

Deploys as a **Worker with static assets** (`wrangler.jsonc`):

- `main` → `worker/index.ts` handles `/mcp`, `/mcp/sse`, `/.well-known/mcp.json`,
  `/embed/:id`, `/tools/:id` and the SPA fallback.
- `assets.directory` → `./dist`, `html_handling: none`,
  `not_found_handling: single-page-application`.

Build command `pnpm build`, deploy command `pnpm exec wrangler deploy` (or
connect the repo in the Cloudflare dashboard). Bind the custom domain
`mcp.gholl.com`. Generated files (`llms.txt`, `sitemap.xml`, `robots.txt`,
`dist/app/*`, `dist/og/*`, `dist/tools/*`) come from `shared/tools.ts`.

> **GEO note:** Cloudflare's *managed* `robots.txt` / Content Signals policy can
> block AI crawlers (GPTBot, ClaudeBot, Perplexity, …). If you want AI engines to
> cite the site, allow those crawlers in the Cloudflare dashboard for this zone.

## Connect a client

See [`docs/integrations.md`](docs/integrations.md) for Claude Desktop / Code,
Cursor, VS Code, LibreChat, Dify and FastGPT. Building a host? Use
[`docs/host-integration.md`](docs/host-integration.md). Registry metadata lives
in [`server.json`](server.json).

## Adding a tool

1. Add a `ToolMeta` entry in `shared/tools.ts` (id, i18n, `inputSchema`, examples).
2. Add the widget in `src/widgets/<id>/` and register it in
   `src/widgets/registry.ts`.
3. Optionally add a server-side result in `shared/mcp/server.ts` (`runTool`).

Everything else — gallery card, landing page, per-widget embed, prerendered HTML,
MCP tool listing, discovery document, OG image and sitemap entry — is generated
automatically.

## License

[MIT](./LICENSE)
