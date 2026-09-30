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

Build command `pnpm build`, output directory `dist`. Pages Functions live in
`functions/` and are deployed automatically. Point the `mcp.gholl.com` custom
domain at the Pages project.

## Adding a tool

1. Add a `ToolMeta` entry in `shared/tools.ts` (single source of truth).
2. Build the widget component in `src/widgets/<id>/` and register it in
   `src/widgets/registry.ts`.
3. Done — the catalog, landing page, embed route, MCP tool list and discovery
   document all pick it up automatically.
