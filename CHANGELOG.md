# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-30

First public release of [mcp-hub](https://mcp.gholl.com) — interactive
micro-tools for humans **and** AI agents.

### Added

- **10 interactive tools**, each exposed as a login-free web playground and as
  MCP tools that render sandboxed UI iframe cards (MCP Apps / SEP-1865):
  `vram-calc`, `cron-debugger`, `schema-viewer`, `api-uptime`, `jwt-decoder`,
  `hash-generator`, `color-studio`, `chrono-energy`, `gomoku`, `echarts`.
- **Four-surface generator**: a single `ToolMeta` definition in
  `shared/tools.ts` powers the gallery, the SEO landing page, the sandboxed
  embed, and the MCP server + discovery document.
- **MCP endpoint** at `https://mcp.gholl.com/mcp` (Streamable HTTP, no auth).
  Each tool returns `text` + `structuredContent` plus
  `_meta.ui.resourceUri = ui://gholl/<id>`; hosts fetch the card HTML via
  `resources/read` and get a self-contained single-file app.
- **Agent discovery document** at `/.well-known/mcp.json`.
- **SEO / GEO surfaces**: `llms.txt`, `sitemap.xml`, `robots.txt`.
- **Per-widget embeds** at `/embed/:id` — sandboxed, self-contained
  single-file apps for iframes and MCP Apps hosts.
- **Generated Open Graph images** at `/og/:name.png`.
- **Prerendered SEO pages** for `/` and every `/tools/:id`, so crawlers that
  don't run JS still see full content.
- **Bilingual README** (English / 中文).

[Unreleased]: https://github.com/Gholls/mcp-hub/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Gholls/mcp-hub/releases/tag/v0.1.0
