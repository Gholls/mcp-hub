[English](./README.md) | **中文**

# mcp-hub

[![CI](https://github.com/Gholls/mcp-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/Gholls/mcp-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

面向**人类**与 **AI Agent** 的交互式微型工具集，部署于
[`mcp.gholl.com`](https://mcp.gholl.com)。

- **对人类** — 免登录、毫秒级加载的小工具箱（Playground）。
- **对 AI Agent** — 同一批组件以 [MCP](https://modelcontextprotocol.io) 工具形式暴露，
  在支持 [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) 的客户端里以
  沙箱 iframe 卡片渲染。

一份工具定义（`shared/tools.ts`）驱动四个界面：展厅、SEO 落地页、沙箱嵌入页、
以及 MCP 服务端与发现文档。

| 线上地址 | |
| --- | --- |
| 站点 | https://mcp.gholl.com |
| MCP 端点 | `https://mcp.gholl.com/mcp`（Streamable HTTP，无需鉴权） |
| 发现文档 | https://mcp.gholl.com/.well-known/mcp.json |
| Agent 索引 | https://mcp.gholl.com/llms.txt |

## 工具

| id | 工具 | 分类 | 作用 |
| --- | --- | --- | --- |
| `vram-calc` | GPU 显存与部署预估 | Infrastructure | 估算大模型部署所需显存、推荐 GPU、生成 vLLM / Ollama 命令 |
| `cron-debugger` | Cron / 正则调试器 | Developer | 把 Cron 翻译成自然语言、列出下次执行时间、实时高亮测试正则 |
| `schema-viewer` | JSON-LD / Schema 可视化 | Data | 校验并用可折叠树视图浏览 JSON / JSON-LD |
| `api-uptime` | API 健康度与延迟 | Monitoring | Live Ping 探测 + 24 小时可用率/延迟看板 |
| `jwt-decoder` | JWT 解析器 | Developer | 解析 header/payload/claims 并判断是否过期 |
| `hash-generator` | 哈希生成器 | Developer | SHA-1 / SHA-256 / SHA-512 摘要（hex + base64），本地计算 |
| `color-studio` | 颜色工具与对比度 | Design | hex/RGB/HSL 转换、深浅色阶、WCAG 对比度检查 |
| `chrono-energy` | 玄学八字与 Chrono 能量盘 | Culture | 四柱八字、五行雷达、大运时间轴（beta） |

## 路由

| 路径 | 作用 |
| --- | --- |
| `/` | 工具展厅 + Playground（预渲染） |
| `/tools/:id` | 单工具 SEO 落地页（预渲染 + SPA） |
| `/embed/:id` | 沙箱化的按组件单文件应用（iframe / MCP Apps） |
| `/app/:id/index.html` | 原始按组件产物（内部使用） |
| `/mcp`、`/mcp/sse` | MCP 端点（Streamable HTTP / JSON-RPC） |
| `/.well-known/mcp.json` | Agent 发现文档 |
| `/llms.txt`、`/sitemap.xml`、`/robots.txt` | SEO / GEO 资源 |
| `/og/:name.png` | 生成的 Open Graph 分享图 |

`GET /mcp`（且 `Accept` 不含 `text/event-stream`）返回发现文档；浏览器访问得到帮助页。
`POST /mcp` 才是 JSON-RPC 传输。完整说明见
[`docs/host-integration.md`](docs/host-integration.md)。

## 技术栈

Vite · React 19 · TypeScript · Tailwind CSS v4 · `@mcp-ui/*` ·
`@modelcontextprotocol/ext-apps` · Cloudflare Workers + 静态资源 ·
Vitest · GitHub Actions。

## 架构

```
shared/
  tools.ts            唯一数据源（ToolMeta：schema、i18n、示例）
  calc/               纯逻辑，组件与 MCP 服务端共用
  mcp/                MCP 服务端、HTTP 处理器、发现文档生成
worker/index.ts       Cloudflare Worker：/mcp、/.well-known、/embed、/tools、SPA 回退
src/
  pages/              Home、ToolPage、EmbedPage
  components/         Layout、ToolCard、ParamTable、WidgetHost、ui 等
  widgets/<id>/       交互式组件（懒加载）
scripts/
  build-embeds.mjs    每个组件产出自包含 HTML -> dist/app/<id>
  build-og.mjs        Open Graph PNG -> dist/og
  prerender.mjs       面向爬虫的静态 HTML（/ 与 /tools/<id>）-> dist/tools
docs/                 integrations.md（客户端）、host-integration.md（宿主）
```

### UI 卡片如何下发

每个工具返回精简结果（`text` + `structuredContent`）以及
`_meta.ui.resourceUri = ui://gholl/<id>`。宿主通过 `resources/read` 获取卡片
HTML，得到的是**自包含单文件应用**（`text/html;profile=mcp-app`，无外部请求）。
同一批组件也可作为普通页面（`/tools/:id`）与 iframe（`/embed/:id`）访问。

### 性能与 SEO/GEO

- 主站**代码分包**（路由与组件均懒加载），首屏约 2 KB HTML + 约 100 KB gzip；
  组件仅在打开时才加载。
- 为 `/` 和每个 `/tools/:id` 生成**预渲染**内容，让不执行 JS 的 AI 爬虫也能读到
  完整内容、参数表与链接。
- 富结构化数据：`WebSite`、`ItemList`、`SoftwareApplication`、
  `BreadcrumbList`、`FAQPage`、`Organization`；每个工具有独立 OG 图。

## 命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | Vite 开发服务器（仅 UI，无 Worker/MCP） |
| `pnpm dev:worker` | 通过 `wrangler dev` 本地运行 `dist` + Worker（需先 `pnpm build`） |
| `pnpm build` | 类型检查、Web 构建、按组件产物、OG 图、预渲染 |
| `pnpm build:web` | 快速路径：仅类型检查 + Web 构建 |
| `pnpm preview` | 用 `vite preview` 预览构建结果 |
| `pnpm test` / `test:watch` | Vitest 单元 + MCP 集成测试 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | 应用 TypeScript |
| `pnpm typecheck:functions` | Worker TypeScript |
| `pnpm deploy` | `pnpm build && wrangler deploy` |

## 本地开发

```bash
pnpm install
pnpm dev            # http://localhost:5173（仅 UI）
pnpm build && pnpm dev:worker   # 全栈，含 http://localhost:8787 的 /mcp
pnpm test
```

## 部署（Cloudflare）

以 **Worker + 静态资源** 形式部署（`wrangler.jsonc`）：

- `main` → `worker/index.ts` 处理 `/mcp`、`/mcp/sse`、`/.well-known/mcp.json`、
  `/embed/:id`、`/tools/:id` 以及 SPA 回退。
- `assets.directory` → `./dist`，`html_handling: none`，
  `not_found_handling: single-page-application`。

构建命令 `pnpm build`，部署命令 `pnpm exec wrangler deploy`（或在 Cloudflare
控制台连接仓库）。将自定义域名 `mcp.gholl.com` 绑定到该 Worker。生成文件
（`llms.txt`、`sitemap.xml`、`robots.txt`、`dist/app/*`、`dist/og/*`、
`dist/tools/*`）均来自 `shared/tools.ts`。

> **GEO 提示：** Cloudflare 的**托管** `robots.txt` / Content Signals 策略可能屏蔽
> AI 爬虫（GPTBot、ClaudeBot、Perplexity 等）。若希望被 AI 引擎引用，请在
> Cloudflare 控制台为该 zone 允许这些爬虫。

## 接入客户端

Claude Desktop / Code、Cursor、VS Code、LibreChat、Dify、FastGPT 的配置见
[`docs/integrations.md`](docs/integrations.md)。正在开发宿主？见
[`docs/host-integration.md`](docs/host-integration.md)。目录提交元数据见
[`server.json`](server.json)。

## 新增工具

1. 在 `shared/tools.ts` 添加 `ToolMeta`（id、i18n、`inputSchema`、示例）。
2. 在 `src/widgets/<id>/` 实现组件并注册到 `src/widgets/registry.ts`。
3. 可选：在 `shared/mcp/server.ts` 的 `runTool` 添加服务端结果。

其余全部自动生成：展厅卡片、落地页、按组件嵌入页、预渲染 HTML、MCP 工具列表、
发现文档、OG 图与 sitemap 条目。

## 许可

[MIT](./LICENSE)
