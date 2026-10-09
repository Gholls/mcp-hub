import type { ToolMeta } from './types.ts'
import { ECHARTS_DEFAULT_OPTION, ECHARTS_OPTION_GUIDE } from './calc/echarts.ts'

export const vramCalcTool: ToolMeta = {
  id: 'vram-calc',
  name: 'GPU VRAM & Deployment Cost Estimator',
  title: {
    en: 'GPU VRAM & Deployment Estimator',
    zh: 'GPU 显存与部署成本预估',
  },
  description: {
    en: 'Estimate the VRAM required to serve an LLM and get GPU recommendations with ready-to-copy vLLM / Ollama commands.',
    zh: '估算部署大模型所需的显存，给出 GPU 推荐方案，并生成可直接复制的 vLLM / Ollama 启动命令。',
  },
  mcpDescription:
    'Estimate the GPU VRAM (GB) required to serve a large language model. Inputs: model parameter count in billions, weight quantization precision (fp16/int8/int4), context length in tokens, batch size (concurrent sequences), and KV-cache precision. Returns a memory breakdown (weights, KV cache, activations, runtime overhead), a recommended GPU configuration, and copy-paste vLLM and Ollama launch commands. Use this when a user asks how much GPU memory a model needs or which GPU to buy/rent.',
  category: 'Infrastructure',
  icon: '🖥️',
  tags: ['vram', 'gpu', 'llm', 'vllm', 'ollama'],
  status: 'stable',
  embedPath: '/embed/vram-calc',
  pagePath: '/tools/vram-calc',
  examples: [
    { en: 'How much VRAM does Llama 3 70B need at INT4 with a 32k context?', zh: 'Llama 3 70B 用 INT4、32k 上下文需要多少显存？' },
    { en: 'Which GPU should I rent to serve a 13B model for 16 concurrent users?', zh: '部署 13B 模型、16 路并发，该租哪种 GPU？' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      modelParamsB: {
        type: 'number',
        description: 'Model size in billions of parameters (e.g. 7, 13, 70).',
        default: 7,
      },
      precision: {
        type: 'string',
        enum: ['fp16', 'int8', 'int4'],
        description: 'Weight quantization precision.',
        default: 'fp16',
      },
      contextLength: {
        type: 'integer',
        description: 'Context window length in tokens.',
        default: 8192,
      },
      batchSize: {
        type: 'integer',
        description: 'Number of concurrent sequences (batch size).',
        default: 1,
      },
      kvPrecision: {
        type: 'string',
        enum: ['fp16', 'int8'],
        description: 'KV-cache precision.',
        default: 'fp16',
      },
      tensorParallel: {
        type: 'integer',
        description: 'Number of GPUs to shard the model across (tensor parallel size).',
        default: 1,
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card. Match the language of the end user.',
        default: 'en',
      },
    },
    required: ['modelParamsB'],
  },
}

export const cronDebuggerTool: ToolMeta = {
  id: 'cron-debugger',
  name: 'Cron & Regex Debugger',
  title: {
    en: 'Cron & Regex Debugger',
    zh: 'Cron / 正则调试器',
  },
  description: {
    en: 'Translate a cron schedule into plain language, preview the next runs, and test regular expressions with live highlighting.',
    zh: '把 Cron 表达式翻译成自然语言，预览未来执行时间，并实时高亮测试正则表达式。',
  },
  mcpDescription:
    'Explain a cron expression in plain language and compute its next 5 fire times, or test a regular expression against sample text and return the matches. Inputs: `cron` (a standard 5-field cron expression) and/or `regex` with optional `flags` and `text`. Use this when a user asks when a cron schedule runs, wants to verify a cron format, or wants to test/debug a regex.',
  category: 'Developer',
  icon: '⏱️',
  tags: ['cron', 'regex', 'schedule', 'developer'],
  status: 'stable',
  embedPath: '/embed/cron-debugger',
  pagePath: '/tools/cron-debugger',
  examples: [
    { en: "Explain the cron '30 9 * * 1-5' and when it runs next.", zh: "解释 cron '30 9 * * 1-5' 并给出下次执行时间。" },
    { en: "Test the regex (\\d{3})-\\d{4} against 'call 555-1234'.", zh: "用正则 (\\d{3})-\\d{4} 测试 'call 555-1234'。" },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      cron: {
        type: 'string',
        description: 'A standard 5-field cron expression, e.g. "*/5 * * * *".',
        default: '*/5 * * * *',
      },
      regex: {
        type: 'string',
        description: 'A JavaScript regular expression pattern to test.',
      },
      flags: {
        type: 'string',
        description: 'Regex flags, e.g. "gi".',
        default: 'g',
      },
      text: {
        type: 'string',
        description: 'Sample text to run the regex against.',
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card.',
        default: 'en',
      },
    },
  },
}

export const schemaViewerTool: ToolMeta = {
  id: 'schema-viewer',
  name: 'JSON-LD & Schema Viewer',
  title: {
    en: 'JSON-LD / Schema Viewer',
    zh: 'JSON-LD / Schema 可视化',
  },
  description: {
    en: 'Inspect, validate and explore structured JSON / JSON-LD with a collapsible tree, syntax checks and JSON-LD detection.',
    zh: '用可折叠树视图检查、校验并浏览结构化 JSON / JSON-LD，提供语法检查与 JSON-LD 识别。',
  },
  mcpDescription:
    'Parse, validate and summarize a structured JSON or JSON-LD document. Accepts a JSON string (`json`) or a URL to fetch (`url`). Returns syntax validity, JSON-LD signals (@context, @type), node count, top-level keys, and the parsed structure. Use this when a user pastes structured data / schema.org markup and wants it checked, explained or cleaned up.',
  category: 'Data',
  icon: '🧩',
  tags: ['json', 'json-ld', 'schema', 'seo'],
  status: 'stable',
  embedPath: '/embed/schema-viewer',
  pagePath: '/tools/schema-viewer',
  examples: [
    { en: 'Validate this JSON-LD Product markup and list its @type.', zh: '校验这段 JSON-LD Product 并列出 @type。' },
    { en: 'Summarize the structure of this JSON document.', zh: '概括这份 JSON 文档的结构。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      json: {
        type: 'string',
        description: 'The JSON or JSON-LD document as a string.',
      },
      url: {
        type: 'string',
        description: 'Optional public http(s) URL to fetch JSON/JSON-LD from.',
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card.',
        default: 'en',
      },
    },
  },
}

export const apiUptimeTool: ToolMeta = {
  id: 'api-uptime',
  name: 'API Health & Latency Dashboard',
  title: {
    en: 'API Health & Latency',
    zh: 'API 健康度与延迟看板',
  },
  description: {
    en: 'Probe an API endpoint, measure live latency, and view a 24h uptime and latency dashboard.',
    zh: '探测 API 接口，测量实时延迟，并查看 24 小时可用率与延迟看板。',
  },
  mcpDescription:
    'Run a live health check against a public API endpoint and return its reachability, HTTP status and round-trip latency, along with a 24h uptime/latency summary. Inputs: `endpoint` (public http(s) URL, required) and `method` (GET or HEAD). Use this when a user wants to check whether an API or website is up, or compare response latency.',
  category: 'Monitoring',
  icon: '📡',
  tags: ['api', 'uptime', 'latency', 'monitoring'],
  status: 'stable',
  embedPath: '/embed/api-uptime',
  pagePath: '/tools/api-uptime',
  examples: [
    { en: "Is https://api.github.com up right now, and what's its latency?", zh: 'https://api.github.com 现在可用吗？延迟多少？' },
    { en: 'Check the health of my API endpoint.', zh: '检查我的 API 接口健康状况。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      endpoint: {
        type: 'string',
        description: 'Public http(s) URL to probe.',
        default: 'https://api.github.com/',
      },
      method: {
        type: 'string',
        enum: ['GET', 'HEAD'],
        description: 'HTTP method used for the probe.',
        default: 'HEAD',
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card.',
        default: 'en',
      },
    },
    required: ['endpoint'],
  },
}

export const chronoEnergyTool: ToolMeta = {
  id: 'chrono-energy',
  name: 'BaZi Chrono-Energy Wheel',
  title: {
    en: 'BaZi Chrono-Energy Wheel',
    zh: '玄学八字与 Chrono 能量盘',
  },
  description: {
    en: 'Compute the Four Pillars (BaZi) from a birth date/time and explore the five-element energy wheel and luck cycles.',
    zh: '根据出生年月日时推算八字四柱，可视化五行能量分布与人生大运。',
  },
  mcpDescription:
    'Compute a BaZi (Chinese Four Pillars) chart from a birth date, time and gender. Returns the year/month/day/hour pillars with heavenly stems and earthly branches, the five-element (Wu Xing) distribution, day-master strength, favorable/missing elements, and the decade luck (大运) cycles. Use this for Chinese metaphysics / fortune-telling requests that need a birth-chart analysis. Cultural and entertainment purposes only.',
  category: 'Culture',
  icon: '☯️',
  tags: ['bazi', 'wuxing', 'chinese', 'metaphysics'],
  status: 'beta',
  embedPath: '/embed/chrono-energy',
  pagePath: '/tools/chrono-energy',
  examples: [
    { en: 'Analyze the BaZi chart for someone born 1990-06-15 at 10:30.', zh: '分析 1990-06-15 10:30 出生的八字。' },
    { en: 'What are this chart’s favorable five elements (喜用神)?', zh: '这个八字的喜用神是什么？' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      birthDate: {
        type: 'string',
        description: 'Birth date in ISO format YYYY-MM-DD.',
        default: '1990-06-15',
      },
      birthTime: {
        type: 'string',
        description: 'Birth time in 24h HH:mm. Defaults to 12:00 when unknown.',
        default: '10:30',
      },
      gender: {
        type: 'string',
        enum: ['male', 'female'],
        description: 'Gender, required to order the luck cycles (大运).',
        default: 'male',
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card.',
        default: 'en',
      },
    },
    required: ['birthDate'],
  },
}

export const jwtDecoderTool: ToolMeta = {
  id: 'jwt-decoder',
  name: 'JWT Decoder',
  title: {
    en: 'JWT Decoder',
    zh: 'JWT 解析器',
  },
  description: {
    en: 'Decode a JWT into its header, payload and claims, and check whether it is expired.',
    zh: '将 JWT 解析为头部、载荷与声明，并检查是否已过期。',
  },
  mcpDescription:
    'Decode a JSON Web Token (JWT) without verifying the signature. Returns the decoded header, payload, and standard claims (iss, sub, aud, exp, iat, nbf), plus whether the token is expired and how long until expiry. Use this when a user pastes a JWT and wants to inspect its contents.',
  category: 'Developer',
  icon: '🔑',
  tags: ['jwt', 'auth', 'token', 'decode'],
  status: 'stable',
  embedPath: '/embed/jwt-decoder',
  pagePath: '/tools/jwt-decoder',
  examples: [
    { en: 'Decode this JWT and tell me if it has expired.', zh: '解析这个 JWT，看它是否已过期。' },
    { en: 'Show the claims and signing algorithm of this access token.', zh: '显示这个 access token 的声明和签名算法。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'The JWT string (header.payload.signature).',
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card.',
        default: 'en',
      },
    },
    required: ['token'],
  },
}

export const hashGeneratorTool: ToolMeta = {
  id: 'hash-generator',
  name: 'Hash Generator',
  title: {
    en: 'Hash Generator',
    zh: '哈希生成器',
  },
  description: {
    en: 'Compute SHA-1 / SHA-256 / SHA-512 digests of text as hex and base64, entirely in your browser.',
    zh: '在浏览器本地计算文本的 SHA-1 / SHA-256 / SHA-512 摘要（hex 与 base64）。',
  },
  mcpDescription:
    'Compute cryptographic hash digests (SHA-1, SHA-256, SHA-512) of a text string, returned as hex and base64. Use this when a user wants to hash a value, verify a checksum, or generate a digest. The text is hashed with the Web Crypto API.',
  category: 'Developer',
  icon: '🔐',
  tags: ['hash', 'sha256', 'crypto', 'checksum'],
  status: 'stable',
  embedPath: '/embed/hash-generator',
  pagePath: '/tools/hash-generator',
  examples: [
    { en: "Compute the SHA-256 hash of 'hello world'.", zh: "计算 'hello world' 的 SHA-256。" },
    { en: 'Give me the SHA-512 checksum of this text.', zh: '给我这段文本的 SHA-512 校验和。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to hash.',
      },
      algorithms: {
        type: 'array',
        items: { type: 'string', enum: ['SHA-1', 'SHA-256', 'SHA-512'] },
        description: 'Hash algorithms to compute. Defaults to all.',
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card.',
        default: 'en',
      },
    },
    required: ['text'],
  },
}

export const colorStudioTool: ToolMeta = {
  id: 'color-studio',
  name: 'Color Studio & Contrast',
  title: {
    en: 'Color Studio & Contrast',
    zh: '颜色工具与对比度',
  },
  description: {
    en: 'Convert between hex/RGB/HSL, generate tints and shades, and check WCAG contrast against black and white.',
    zh: '在 hex/RGB/HSL 之间转换，生成深浅色阶，并检查与黑白两色的 WCAG 对比度。',
  },
  mcpDescription:
    'Analyze a color given as hex, rgb() or hsl(). Returns its hex/RGB/HSL values, relative luminance, WCAG contrast ratios against white and black (with AA/AAA pass flags), the recommended text color, and a tint/shade scale. Use this when a user asks to convert a color or to check color accessibility/contrast.',
  category: 'Design',
  icon: '🎨',
  tags: ['color', 'contrast', 'wcag', 'design'],
  status: 'stable',
  embedPath: '/embed/color-studio',
  pagePath: '/tools/color-studio',
  examples: [
    { en: 'Convert #6366f1 to RGB and HSL.', zh: '把 #6366f1 转成 RGB 和 HSL。' },
    { en: 'Is white text on #6366f1 accessible? Check WCAG contrast.', zh: '白字放在 #6366f1 上可读吗？检查 WCAG 对比度。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      color: {
        type: 'string',
        description: 'A color as hex (#6366f1), rgb(99,102,241) or hsl(239,84%,67%).',
        default: '#6366f1',
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card.',
        default: 'en',
      },
    },
    required: ['color'],
  },
}

export const gomokuTool: ToolMeta = {
  id: 'gomoku',
  name: 'Gomoku (Five in a Row)',
  title: {
    en: 'Gomoku · Play vs AI',
    zh: '五子棋 · 与 AI 对战',
  },
  description: {
    en: 'Play Gomoku (five-in-a-row) against your host AI. The card provides the board, move rules and win detection.',
    zh: '与你的宿主 AI 下五子棋。卡片负责任意棋盘、落子规则与胜负判定。',
  },
  mcpDescription:
    'Gomoku (five in a row) board game. This tool provides the board, move validation and win detection; the opponent moves are made by the host application\'s own AI. Inputs: `moves` (comma-separated coordinates in play order, black first, e.g. "H8,H9,I9"), `humanColor` ("black" or "white", default "black") and `size` (board size, default 15). Returns the board state, whose turn it is, and the winner if the game has ended. Use this when a user wants to play five-in-a-row against the assistant.',
  category: 'Games',
  icon: '⚫',
  tags: ['game', 'gomoku', 'five-in-a-row', 'board'],
  status: 'beta',
  embedPath: '/embed/gomoku',
  pagePath: '/tools/gomoku',
  examples: [
    { en: "Let's play Gomoku — start a board, I'll go first as Black.", zh: '我们下五子棋吧——开个棋盘，我执黑先行。' },
    { en: 'Start a Gomoku game where I play White and you move first.', zh: '开始一局五子棋，我执白，你先走。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      moves: {
        type: 'string',
        description: 'Comma-separated coordinates in play order (black first), e.g. "H8,H9,I9".',
      },
      humanColor: {
        type: 'string',
        enum: ['black', 'white'],
        description: 'Which color the human plays.',
        default: 'black',
      },
      size: {
        type: 'integer',
        description: 'Board size (9-19).',
        default: 15,
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card.',
        default: 'en',
      },
    },
  },
}

export const echartsTool: ToolMeta = {
  id: 'echarts',
  name: 'Interactive ECharts',
  title: {
    en: 'ECharts Data Visualization',
    zh: 'ECharts 数据可视化',
  },
  description: {
    en: 'Render interactive Apache ECharts charts from an ECharts option — line, bar, pie, radar, scatter, sankey and more.',
    zh: '用标准 ECharts option 渲染交互式图表——折线、柱状、饼图、雷达、散点、桑基图等。',
  },
  mcpDescription:
    'Render an interactive Apache ECharts chart from a standard ECharts `option` JSON object. Supports line, bar (incl. stacked & dual-axis mixed), pie, radar, scatter, funnel, gauge, sankey, graph and more — chosen via `series[].type`. Use this whenever a user would benefit from a chart or data visualization instead of raw numbers. The `option` field description contains ready-to-copy JSON templates for every common chart type — follow those shapes and fill in the user\'s real data. Inputs: `option` (required ECharts option object), optional `title`, `subtitle`, `insights` (one-line takeaway under the chart). When `enableInteractivity` is true (default), clicking a data point sends a follow-up message to the conversation for drill-down. Output valid JSON only (no comments, no functions).',
  category: 'Data',
  icon: '📊',
  tags: ['chart', 'echarts', 'visualization', 'data'],
  status: 'stable',
  embedPath: '/embed/echarts',
  pagePath: '/tools/echarts',
  examples: [
    { en: 'Chart my monthly revenue: Jan 12, Feb 18, Mar 9, Apr 22 (bar chart).', zh: '把月度营收画成柱状图：1月12、2月18、3月9、4月22。' },
    { en: 'Visualize these two models across speed/quality/cost as a radar chart.', zh: '用雷达图对比这两个模型在速度/质量/成本上的表现。' },
    { en: 'Show the token spend flow from providers to tasks as a Sankey diagram.', zh: '用桑基图展示从供应商到任务的 Token 消耗流向。' },
    { en: 'Plot QPS and p99 latency together with a dual Y axis.', zh: '用双 Y 轴同时画出 QPS 与 p99 延迟。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      option: {
        type: 'object',
        description: `A valid Apache ECharts option object. Generate it from the user's data. Type templates (copy the shape, fill in real data):\n${ECHARTS_OPTION_GUIDE}`,
        default: ECHARTS_DEFAULT_OPTION,
      },
      title: { type: 'string', description: 'Card title shown above the chart.' },
      subtitle: { type: 'string', description: 'Small subtitle under the title.' },
      insights: {
        type: 'string',
        description: 'A one-line AI takeaway rendered under the chart.',
      },
      enableInteractivity: {
        type: 'boolean',
        description: 'When true, clicking a data point sends it back to the conversation.',
        default: true,
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card.',
        default: 'en',
      },
    },
    required: ['option'],
  },
}

export const functionGrapherTool: ToolMeta = {
  id: 'function-grapher',
  name: 'Function Grapher',
  title: {
    en: 'Function Grapher',
    zh: '函数图像绘制器',
  },
  description: {
    en: 'Plot common functions with live parameter sliders (linear, inverse, quadratic, power, exponential, logarithmic) and read off key features.',
    zh: '用滑块实时绘制常见函数图像（一次、反比例、二次、幂、指数、对数），并显示图像特征。',
  },
  mcpDescription:
    'Plot and explore a common function. Inputs: `family` (one of "linear", "proportion", "inverse", "quadratic", "power", "exponential", "logarithmic") and optional `params` (e.g. {"a":1,"b":-2,"c":-3} for quadratic, {"k":2} for linear/inverse, {"a":2} for exponential/logarithmic/power). Returns the equation and key features such as vertex, axis of symmetry, discriminant, asymptotes and monotonicity. Use this for middle/high-school math when a user asks to draw or explain a function graph.',
  category: 'Math',
  icon: '📈',
  tags: ['math', 'function', 'graph', 'plot', 'education'],
  status: 'stable',
  embedPath: '/embed/function-grapher',
  pagePath: '/tools/function-grapher',
  examples: [
    { en: 'Plot the quadratic y = x² − 2x − 3 and show its vertex.', zh: '画出二次函数 y = x² − 2x − 3 并标出顶点。' },
    { en: 'Show how y = a·x changes as a varies.', zh: '展示 y = a·x 随 a 变化的图像。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      family: {
        type: 'string',
        enum: ['linear', 'proportion', 'inverse', 'quadratic', 'power', 'exponential', 'logarithmic'],
        description: 'Function family to plot.',
        default: 'quadratic',
      },
      params: {
        type: 'object',
        description: 'Parameter values, e.g. {"a":1,"b":-2,"c":-3} or {"k":2}. Missing values use defaults.',
      },
      locale: {
        type: 'string',
        enum: ['en', 'zh'],
        description: 'UI language for the rendered card.',
        default: 'en',
      },
    },
    required: ['family'],
  },
}

/**
 * The single source of truth for every tool shipped by mcp.gholl.com.
 *
 * One definition powers three surfaces:
 *   1. the human-facing catalog + landing pages (`/`, `/tools/:id`)
 *   2. the sandboxed widget iframes (`/embed/:id`)
 *   3. the MCP server tool list + `/.well-known/mcp.json` discovery document
 */
export const TOOLS: ToolMeta[] = [
  vramCalcTool,
  cronDebuggerTool,
  schemaViewerTool,
  apiUptimeTool,
  chronoEnergyTool,
  jwtDecoderTool,
  hashGeneratorTool,
  colorStudioTool,
  gomokuTool,
  echartsTool,
  functionGrapherTool,
]

export function getTool(id: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.id === id)
}
