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

Vite · React 19 · TypeScript · Tailwind CSS v4 · `@mcp-ui/*` · Cloudflare Pages + Functions.

## Development

```bash
pnpm install
pnpm dev          # site at http://localhost:5173
pnpm build        # production build to dist/
pnpm lint
pnpm typecheck
pnpm pages:dev    # build output + Pages Functions via wrangler
```

## Deployment (Cloudflare Pages)

1. Create a Pages project connected to this repository.
2. Build command: `pnpm build`. Output directory: `dist`.
3. Environment: Node 20+. Pages Functions under `functions/` deploy automatically
   (they provide `/mcp` and `/mcp/sse`).
4. Add the custom domain `mcp.gholl.com` under **Custom domains**.

`llms.txt`, `sitemap.xml` and `robots.txt` are generated at build time from the
tool registry in `shared/tools.ts`. `/.well-known/mcp.json` is served by the
Pages Function fallback (`functions/[[path]].ts`) from the same registry, so it
stays in sync and avoids Cloudflare's dot-directory asset quirks.

For manual deploys:

```bash
pnpm build
pnpm pages:deploy   # wrangler pages deploy dist
```

See [`docs/integrations.md`](docs/integrations.md) for connecting the server to
Claude, Cursor, VS Code, LibreChat, Dify, FastGPT and more. Server metadata for
directory submissions lives in [`server.json`](server.json).

## Adding a tool

1. Add a `ToolMeta` entry in `shared/tools.ts` (single source of truth).
2. Build the widget component in `src/widgets/<id>/` and register it in
   `src/widgets/registry.ts`.
3. Done — the catalog, landing page, embed route, MCP tool list and discovery
   document all pick it up automatically.
