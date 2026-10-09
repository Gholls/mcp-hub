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

> 线上共 **41 张卡片、13 个分类**（Culture、Data、Design、Developer、Education、Everyday、Finance、Games、Infrastructure、Math、Monitoring、Security、Text）。展厅见 https://mcp.gholl.com ，机器可读列表见 https://mcp.gholl.com/.well-known/mcp.json 。完整列表：

| id | 工具 | 分类 | 作用 |
| --- | --- | --- | --- |
| `chrono-energy` | 玄学八字与 Chrono 能量盘 | Culture | 根据出生年月日时推算八字四柱，可视化五行能量分布与人生大运。 |
| `csv-chart` | CSV 出图 | Data | 粘贴 CSV 立即出图（柱状/折线）。 |
| `echarts` | ECharts 数据可视化 | Data | 用标准 ECharts option 渲染交互式图表——折线、柱状、饼图、雷达、散点、桑基图等。 |
| `schema-viewer` | JSON-LD / Schema 可视化 | Data | 用可折叠树视图检查、校验并浏览结构化 JSON / JSON-LD，提供语法检查与 JSON-LD 识别。 |
| `statistics` | 统计 | Data | 一组数据的均值、中位数、标准差与直方图。 |
| `css-effects` | CSS 效果工作室 | Design | 可视化设计渐变、阴影与圆角，实时预览并复制 CSS。 |
| `qr-generator` | 二维码生成器 | Design | 把文本或链接生成二维码。 |
| `favicon-generator` | 图标生成器 | Design | 把文字或 emoji 做成图标。 |
| `image-compressor` | 图片压缩 | Design | 在浏览器内压缩图片。 |
| `image-to-base64` | 图片转 Base64 | Design | 把图片转成 Data URI / Base64。 |
| `color-blindness` | 色盲模拟 | Design | 预览色觉异常者看到的颜色。 |
| `color-palette` | 调色板 | Design | 从基色生成协调配色。 |
| `color-studio` | 颜色工具与对比度 | Design | 在 hex/RGB/HSL 之间转换，生成深浅色阶，并检查与黑白两色的 WCAG 对比度。 |
| `cron-debugger` | Cron / 正则调试器 | Developer | 把 Cron 表达式翻译成自然语言，预览未来执行时间，并实时高亮测试正则表达式。 |
| `jwt-decoder` | JWT 解析器 | Developer | 将 JWT 解析为头部、载荷与声明，并检查是否已过期。 |
| `bit-visualizer` | 位可视化 | Developer | 以位方块查看整数，附二进制/八进制/十六进制。 |
| `hash-generator` | 哈希生成器 | Developer | 在浏览器本地计算文本的 SHA-1 / SHA-256 / SHA-512 摘要（hex 与 base64）。 |
| `quiz` | 测试题 | Education | 万能测试题卡片。题目、选项、每个选项的分值与每页题数都由 AI 设定；卡片只负责渲染并把作答回传。 |
| `world-clock` | 世界时钟 | Everyday | 多城市实时时间与昼夜指示。 |
| `unit-converter` | 单位换算 | Everyday | 换算长度、质量、面积、体积、温度、速度、数据与时间单位。 |
| `resistor-color` | 电阻色环 | Everyday | 由四色环解析电阻阻值。 |
| `compound-interest` | 复利计算 | Finance | 复利增长预测。 |
| `loan-calculator` | 贷款计算器 | Finance | 月供、总利息与余额曲线。 |
| `chinese-money` | 金额大写 | Finance | 以票据样式把金额转成人民币大写。 |
| `gomoku` | 五子棋 · 与 AI 对战 | Games | 与你的宿主 AI 下五子棋。卡片负责任意棋盘、落子规则与胜负判定。 |
| `reaction-test` | 反应速度测试 | Games | 交互式测量反应速度。 |
| `typing-test` | 打字测试 | Games | 测量打字速度与正确率。 |
| `random-picker` | 随机抽取 | Games | 转盘公平地从列表抽取。 |
| `dice-roller` | 骰子 | Games | 掷骰子（密码学随机）并显示合计。 |
| `vram-calc` | GPU 显存与部署成本预估 | Infrastructure | 估算部署大模型所需的显存，给出 GPU 推荐方案，并生成可直接复制的 vLLM / Ollama 启动命令。 |
| `trig-lab` | 三角函数实验室 | Math | 探索单位圆与三角函数 y = A·sin(ωx+φ)+k，用滑块实时调整振幅、周期与相位。 |
| `geometry-lab` | 几何实验室 | Math | 拖动三角形、四边形、圆，实时查看边长、角度、面积，并验证勾股定理与正余弦定理。 |
| `function-grapher` | 函数图像绘制器 | Math | 用滑块实时绘制常见函数图像（一次、反比例、二次、幂、指数、对数），并显示图像特征。 |
| `conic-sections` | 圆锥曲线 | Math | 用滑块实时绘制圆、椭圆、抛物线、双曲线，显示焦点、离心率与渐近线。 |
| `matrix-calculator` | 矩阵计算 | Math | 矩阵乘法、转置与行列式。 |
| `api-uptime` | API 健康度与延迟看板 | Monitoring | 探测 API 接口，测量实时延迟，并查看 24 小时可用率与延迟看板。 |
| `dns-lookup` | DNS 查询 | Monitoring | 通过 DoH 解析 DNS 记录。 |
| `http-inspector` | HTTP 响应检查 | Monitoring | 请求网址并查看状态、重定向与响应头。 |
| `totp-generator` | TOTP 动态口令 | Security | 生成基于时间的动态口令（2FA）。 |
| `password-strength` | 密码强度 | Security | 评估密码强度与熵。 |
| `text-diff` | 文本差异 | Text | 逐行对比两段文本。 |

## 路由

| 路径 | 作用 |
| --- | --- |
| `/` | 工具展厅 + Playground（预渲染） |
| `/tools/:id` | 单工具 SEO 落地页（预渲染 + SPA） |
| `/:category` | 分类落地页，如 `/math`、`/developer`（预渲染） |
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
`@modelcontextprotocol/ext-apps` · Apache ECharts · KaTeX · Cloudflare Workers +
静态资源 · Vitest · GitHub Actions。

> ECharts 与 KaTeX 仅在需要它们的组件分包中懒加载，不影响站点首屏与其他卡片。

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
