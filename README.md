# mcp-hub

Interactive micro-tools for humans **and** AI agents, served from
[`mcp.gholl.com`](https://mcp.gholl.com).

- **For humans** — a login-free playground of fast, single-purpose widgets.
- **For AI agents** — the same widgets exposed as [MCP](https://modelcontextprotocol.io) tools
  with sandboxed iframe apps ([MCP Apps](https://github.com/modelcontextprotocol/ext-apps)).

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Tool gallery + playground |
| `/tools/:widgetId` | SEO landing page for a single tool |
| `/embed/:widgetId` | Sandboxed widget view (iframe / MCP Apps) |
| `/mcp` | MCP endpoint (Streamable HTTP / JSON-RPC) |
| `/.well-known/mcp.json` | Agent discovery document |

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · `@mcp-ui/*` · Cloudflare Workers + static assets.

## How the UI cards are delivered

Each MCP tool returns a small text + `structuredContent` result and points at a
UI resource (`_meta.ui.resourceUri` = `ui://gholl/<tool>`). Hosts fetch the card
HTML via `resources/read`; the worker returns the built single-file app with a
`window.__GHOLL__` bootstrap injected so it renders that specific widget and
speaks the MCP Apps protocol over `postMessage`. The same widgets are also
available as regular pages (`/tools/:id`) and iframes (`/embed/:id`).

## Development

```bash
pnpm install
pnpm dev          # site at http://localhost:5173
pnpm build        # production build to dist/
pnpm lint
pnpm typecheck
pnpm dev:worker   # build + serve dist and the Worker locally (wrangler dev)
```

## Deployment (Cloudflare)

The project deploys as a **Worker with static assets** (`wrangler.jsonc`):

- `main` → `worker/index.ts` handles `/mcp`, `/mcp/sse` and `/.well-known/mcp.json`.
- `assets.directory` → `./dist` (the Vite build), with
  `not_found_handling: "single-page-application"` for client-side routing.

Build command `pnpm build`, deploy command `pnpm exec wrangler deploy`
(or click **Deploy** in the Cloudflare dashboard with the repo connected).
Bind the custom domain `mcp.gholl.com` to the Worker.

```bash
pnpm deploy        # pnpm build && wrangler deploy
```

`llms.txt`, `sitemap.xml` and `robots.txt` are generated at build time from the
tool registry in `shared/tools.ts`. `/.well-known/mcp.json` is served by the
Worker from the same registry, so it always stays in sync.

See [`docs/integrations.md`](docs/integrations.md) for connecting the server to
Claude, Cursor, VS Code, LibreChat, Dify, FastGPT and more. Server metadata for
directory submissions lives in [`server.json`](server.json).

## Adding a tool

1. Add a `ToolMeta` entry in `shared/tools.ts` (single source of truth).
2. Build the widget component in `src/widgets/<id>/` and register it in
   `src/widgets/registry.ts`.
3. Done — the catalog, landing page, embed route, MCP tool list and discovery
   document all pick it up automatically.
