# Contributing to mcp-hub

Thanks for your interest in improving
[mcp-hub](https://mcp.gholl.com) — interactive micro-tools for humans **and**
AI agents, served from [`mcp.gholl.com`](https://mcp.gholl.com).

mcp-hub aims to be a reference implementation of the MCP Apps (SEP-1865)
interactive-UI pattern, so contributions that improve the host-integration
story are especially welcome. Every tool is exposed both as a login-free web
playground and as an MCP tool that renders a sandboxed UI iframe card, so
changes that keep those two surfaces consistent — and make the pattern easier
for other hosts to adopt — are exactly what this project is for.

## Development setup

You need [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev            # http://localhost:5173 (UI only; no Worker/MCP)
pnpm build && pnpm dev:worker   # full stack incl. /mcp on http://localhost:8787
pnpm test
```

- `pnpm dev` runs the Vite dev server for the gallery and widgets only.
- `pnpm build && pnpm dev:worker` builds first, then serves `dist` plus the
  Cloudflare Worker (MCP endpoint, discovery document, embeds) via
  `wrangler dev`.
- `pnpm test` runs the Vitest unit and MCP integration suites.

## Adding a tool

1. Add a `ToolMeta` entry in [`shared/tools.ts`](shared/tools.ts)
   (id, i18n, `inputSchema`, examples). This is the single source of truth.
2. Add the widget in `src/widgets/<id>/` and register it in
   [`src/widgets/registry.ts`](src/widgets/registry.ts).
3. Optionally add a server-side result in
   [`shared/mcp/server.ts`](shared/mcp/server.ts) (`runTool`).

Everything else — gallery card, landing page, per-widget embed, prerendered
HTML, MCP tool listing, discovery document, OG image and sitemap entry — is
generated automatically from the `ToolMeta` definition.

Two conventions worth following:

- Put pure logic in `shared/calc/` so the widget and the MCP server reuse the
  same code instead of duplicating it.
- Add a test file in [`tests/`](tests/) for your tool (see the existing
  per-tool files). Every tool ships with Vitest coverage.

## Code style

- TypeScript strict mode. No `as any`, no `@ts-ignore`.
- ESLint must pass: `pnpm lint`.
- Type-checks must pass: `pnpm typecheck` (app) and
  `pnpm typecheck:functions` (Worker) when you touch `worker/` or
  `shared/mcp/`.
- Every tool has Vitest tests; new tools and bug fixes come with tests.

## Pull requests

- Keep PRs small and focused — one tool, one fix, or one docs change at a
  time.
- Include or update tests for whatever you change.
- Before submitting, run:

  ```bash
  pnpm lint && pnpm typecheck && pnpm test
  ```

- Describe what changed and why, and link any related issue.

Building an MCP host? [`docs/host-integration.md`](docs/host-integration.md)
explains how UI cards are delivered. Connecting a client? See
[`docs/integrations.md`](docs/integrations.md).

## License

Contributions are licensed under the project's [MIT license](./LICENSE).
