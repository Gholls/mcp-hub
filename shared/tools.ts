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

export const trigLabTool: ToolMeta = {
  id: 'trig-lab',
  name: 'Trigonometry Lab',
  title: {
    en: 'Trigonometry Lab',
    zh: '三角函数实验室',
  },
  description: {
    en: 'Explore the unit circle and trigonometric functions y = A·sin(ωx+φ)+k with live sliders for amplitude, period and phase.',
    zh: '探索单位圆与三角函数 y = A·sin(ωx+φ)+k，用滑块实时调整振幅、周期与相位。',
  },
  mcpDescription:
    'Explore trigonometric functions and the unit circle. Inputs: `func` ("sin" | "cos" | "tan"), `A` (amplitude), `omega` (angular frequency), `phi` (phase), `k` (vertical shift) and `unit` ("rad" or "deg"). Returns the equation y = A·f(ωx+φ)+k and its features (amplitude, period, phase shift, range). Use this for teaching trigonometry, periodic functions and graph transformations.',
  category: 'Math',
  icon: '📐',
  tags: ['math', 'trigonometry', 'unit-circle', 'education'],
  status: 'stable',
  embedPath: '/embed/trig-lab',
  pagePath: '/tools/trig-lab',
  examples: [
    { en: 'Show y = 2 sin(3x) and its period.', zh: '画出 y = 2 sin(3x) 并说明周期。' },
    { en: 'Explain how the unit circle relates to the sine curve.', zh: '解释单位圆与正弦曲线的关系。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      func: { type: 'string', enum: ['sin', 'cos', 'tan'], description: 'Trigonometric function.', default: 'sin' },
      A: { type: 'number', description: 'Amplitude.', default: 1 },
      omega: { type: 'number', description: 'Angular frequency ω.', default: 1 },
      phi: { type: 'number', description: 'Phase φ.', default: 0 },
      k: { type: 'number', description: 'Vertical shift k.', default: 0 },
      unit: { type: 'string', enum: ['rad', 'deg'], description: 'Angle unit.', default: 'rad' },
      locale: { type: 'string', enum: ['en', 'zh'], description: 'UI language for the rendered card.', default: 'en' },
    },
  },
}

export const geometryLabTool: ToolMeta = {
  id: 'geometry-lab',
  name: 'Geometry Lab',
  title: {
    en: 'Geometry Lab',
    zh: '几何实验室',
  },
  description: {
    en: 'Drag triangles, quadrilaterals and circles to explore sides, angles, area and the Pythagorean / sine / cosine theorems.',
    zh: '拖动三角形、四边形、圆，实时查看边长、角度、面积，并验证勾股定理与正余弦定理。',
  },
  mcpDescription:
    'Interactive plane geometry. Inputs: `shape` ("triangle" | "quadrilateral" | "circle"), optional `points` (array of [x,y] vertices for triangle/quadrilateral) and `radius` (for circle). Returns side lengths, angles, perimeter, area and, for triangles, right/isosceles/equilateral flags plus angle-sum, Pythagorean and law-of-sines/cosines checks. Use for middle-school geometry teaching.',
  category: 'Math',
  icon: '📐',
  tags: ['math', 'geometry', 'triangle', 'circle', 'education'],
  status: 'stable',
  embedPath: '/embed/geometry-lab',
  pagePath: '/tools/geometry-lab',
  examples: [
    { en: 'Draw a 3-4-5 right triangle and verify the Pythagorean theorem.', zh: '画一个 3-4-5 直角三角形并验证勾股定理。' },
    { en: 'Compare the area and circumference of circles with r=2 and r=3.', zh: '比较半径 2 与 3 的圆的面积与周长。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      shape: { type: 'string', enum: ['triangle', 'quadrilateral', 'circle'], description: 'Shape to draw.', default: 'triangle' },
      points: {
        type: 'array',
        items: { type: 'array', items: { type: 'number' } },
        description: 'Vertices as [[x,y], ...] (triangle: 3 points, quadrilateral: 4 points).',
      },
      radius: { type: 'number', description: 'Circle radius.', default: 3 },
      locale: { type: 'string', enum: ['en', 'zh'], description: 'UI language for the rendered card.', default: 'en' },
    },
  },
}

export const conicSectionsTool: ToolMeta = {
  id: 'conic-sections',
  name: 'Conic Sections',
  title: {
    en: 'Conic Sections',
    zh: '圆锥曲线',
  },
  description: {
    en: 'Plot circles, ellipses, parabolas and hyperbolas with live sliders, showing foci, eccentricity and asymptotes.',
    zh: '用滑块实时绘制圆、椭圆、抛物线、双曲线，显示焦点、离心率与渐近线。',
  },
  mcpDescription:
    'Plot a conic section. Inputs: `type` ("circle" | "ellipse" | "parabola" | "hyperbola") and parameters `a` (radius or semi-major axis), `b` (semi-minor axis) and `p` (parabola focal parameter, y²=2px). Returns the standard equation plus foci, eccentricity, directrix and asymptotes where relevant. Use for high-school conic-section teaching.',
  category: 'Math',
  icon: '🌀',
  tags: ['math', 'conic', 'ellipse', 'hyperbola', 'parabola', 'education'],
  status: 'stable',
  embedPath: '/embed/conic-sections',
  pagePath: '/tools/conic-sections',
  examples: [
    { en: 'Draw the ellipse x²/9 + y²/4 = 1 and mark its foci.', zh: '画出椭圆 x²/9 + y²/4 = 1 并标出焦点。' },
    { en: 'Compare the eccentricity of these ellipses as b changes.', zh: '当 b 变化时比较椭圆的离心率。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['circle', 'ellipse', 'parabola', 'hyperbola'], description: 'Conic type.', default: 'ellipse' },
      a: { type: 'number', description: 'Radius (circle) or semi-major axis (ellipse/hyperbola).', default: 3 },
      b: { type: 'number', description: 'Semi-minor axis (ellipse/hyperbola).', default: 2 },
      p: { type: 'number', description: 'Parabola focal parameter p (y² = 2 p x).', default: 2 },
      locale: { type: 'string', enum: ['en', 'zh'], description: 'UI language for the rendered card.', default: 'en' },
    },
    required: ['type'],
  },
}

export const jsonFormatterTool: ToolMeta = {
  id: 'json-formatter',
  name: 'JSON Formatter',
  title: { en: 'JSON Formatter', zh: 'JSON 格式化' },
  description: {
    en: 'Validate, pretty-print, minify and sort JSON keys, with byte/line/node stats.',
    zh: '校验、格式化、压缩并对 JSON 键排序，显示字节/行数/节点统计。',
  },
  mcpDescription:
    'Validate and reformat a JSON string. Inputs: `json` (required) and optional `mode` ("format" pretty-prints with 2-space indent, "minify" compresses). Returns the formatted text plus stats (bytes, lines, nodes, depth). Use when a user pastes JSON and wants it cleaned up, minified or checked.',
  category: 'Developer',
  icon: '🧾',
  tags: ['json', 'format', 'minify', 'validate'],
  status: 'stable',
  embedPath: '/embed/json-formatter',
  pagePath: '/tools/json-formatter',
  examples: [
    { en: 'Format this JSON and tell me how many nodes it has.', zh: '把这个 JSON 格式化，并告诉我有多少节点。' },
    { en: 'Minify this JSON.', zh: '把这个 JSON 压缩成一行。' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      json: { type: 'string', description: 'The JSON document as a string.' },
      mode: { type: 'string', enum: ['format', 'minify'], description: 'Output mode.', default: 'format' },
      locale: { type: 'string', enum: ['en', 'zh'], description: 'UI language for the rendered card.', default: 'en' },
    },
    required: ['json'],
  },
}

export const unitConverterTool: ToolMeta = {
  id: 'unit-converter',
  name: 'Unit Converter',
  title: { en: 'Unit Converter', zh: '单位换算' },
  description: {
    en: 'Convert length, mass, area, volume, temperature, speed, data and time units.',
    zh: '换算长度、质量、面积、体积、温度、速度、数据与时间单位。',
  },
  mcpDescription:
    'Convert a numeric value between units. Inputs: `value` (number), `from`, `to` (unit ids) and `category` ("length" | "mass" | "area" | "volume" | "temperature" | "speed" | "data" | "time"). Examples: km→mi, c→f, mb→gib. Use whenever a user needs a unit conversion.',
  category: 'Everyday',
  icon: '📏',
  tags: ['unit', 'convert', 'length', 'temperature', '日常'],
  status: 'stable',
  embedPath: '/embed/unit-converter',
  pagePath: '/tools/unit-converter',
  examples: [
    { en: 'Convert 10 km to miles.', zh: '把 10 千米换算成英里。' },
    { en: 'What is 100°C in Fahrenheit?', zh: '100 摄氏度等于多少华氏度？' },
  ],
  inputSchema: {
    type: 'object',
    properties: {
      value: { type: 'number', description: 'Numeric value to convert.', default: 1 },
      from: { type: 'string', description: 'Source unit id (e.g. km, c, mb).', default: 'km' },
      to: { type: 'string', description: 'Target unit id (e.g. mi, f, gib).', default: 'mi' },
      category: {
        type: 'string',
        enum: ['length', 'mass', 'area', 'volume', 'temperature', 'speed', 'data', 'time'],
        description: 'Unit category.',
        default: 'length',
      },
      locale: { type: 'string', enum: ['en', 'zh'], description: 'UI language for the rendered card.', default: 'en' },
    },
    required: ['value', 'from', 'to', 'category'],
  },
}

export const gradientGeneratorTool: ToolMeta = {
  id: 'gradient-generator',
  name: 'CSS Gradient Generator',
  title: { en: 'CSS Gradient Generator', zh: 'CSS 渐变生成器' },
  description: { en: 'Design a CSS gradient with a live preview and copy-ready code.', zh: '可视化设计 CSS 渐变并复制代码。' },
  mcpDescription:
    'Generate a CSS gradient. Inputs: `from`, `to` (hex colors), optional `angle` (degrees) and `kind` ("linear" | "radial"). Returns the `background` CSS. Use when a user wants a gradient/background.',
  category: 'Design', icon: '🌈', tags: ['css', 'gradient', 'design'], status: 'stable',
  embedPath: '/embed/gradient-generator', pagePath: '/tools/gradient-generator',
  examples: [{ en: 'Make an indigo-to-cyan gradient at 135°.', zh: '做一个 135° 的靛蓝到青色渐变。' }],
  inputSchema: {
    type: 'object',
    properties: {
      from: { type: 'string', description: 'Start color (hex).', default: '#6366f1' },
      to: { type: 'string', description: 'End color (hex).', default: '#22d3ee' },
      angle: { type: 'number', description: 'Angle in degrees (linear only).', default: 135 },
      kind: { type: 'string', enum: ['linear', 'radial'], default: 'linear' },
      locale: { type: 'string', enum: ['en', 'zh'], default: 'en' },
    },
  },
}

export const boxShadowTool: ToolMeta = {
  id: 'box-shadow',
  name: 'CSS Box Shadow',
  title: { en: 'CSS Box Shadow', zh: 'CSS 阴影生成' },
  description: { en: 'Build a CSS box-shadow with a live preview.', zh: '可视化生成 CSS box-shadow。' },
  mcpDescription:
    'Build a CSS `box-shadow`. Inputs: `x`, `y`, `blur`, `spread` (px), `color` and optional `inset`. Returns the CSS declaration.',
  category: 'Design', icon: '🌑', tags: ['css', 'shadow', 'design'], status: 'stable',
  embedPath: '/embed/box-shadow', pagePath: '/tools/box-shadow',
  examples: [{ en: 'A soft drop shadow for a card.', zh: '给卡片做一个柔和的投影。' }],
  inputSchema: {
    type: 'object',
    properties: {
      x: { type: 'number', default: 0 }, y: { type: 'number', default: 12 },
      blur: { type: 'number', default: 24 }, spread: { type: 'number', default: -6 },
      color: { type: 'string', default: '#00000055' }, inset: { type: 'boolean', default: false },
      locale: { type: 'string', enum: ['en', 'zh'], default: 'en' },
    },
  },
}

export const borderRadiusTool: ToolMeta = {
  id: 'border-radius',
  name: 'CSS Border Radius',
  title: { en: 'CSS Border Radius', zh: 'CSS 圆角生成' },
  description: { en: 'Shape CSS corners with a live preview.', zh: '可视化调节 CSS 圆角。' },
  mcpDescription:
    'Build a CSS `border-radius` with four corner values. Inputs: `tl`, `tr`, `br`, `bl` (px). Returns the CSS declaration.',
  category: 'Design', icon: '⬭', tags: ['css', 'radius', 'design'], status: 'stable',
  embedPath: '/embed/border-radius', pagePath: '/tools/border-radius',
  examples: [{ en: 'A card with 20px rounded corners.', zh: '一个 20px 圆角的卡片。' }],
  inputSchema: {
    type: 'object',
    properties: { tl: { type: 'number', default: 24 }, tr: { type: 'number', default: 24 }, br: { type: 'number', default: 24 }, bl: { type: 'number', default: 24 }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } },
  },
}

export const bmiCalculatorTool: ToolMeta = {
  id: 'bmi-calculator',
  name: 'BMI Calculator',
  title: { en: 'BMI Calculator', zh: 'BMI 计算器' },
  description: { en: 'Body-mass index with a colored scale.', zh: '带色带的体质指数。' },
  mcpDescription:
    'Compute BMI from weight (kg) and height (cm), returning the value and category (underweight/normal/overweight/obese). Inputs: `weight`, `height`.',
  category: 'Everyday', icon: '⚖️', tags: ['health', 'bmi'], status: 'stable',
  embedPath: '/embed/bmi-calculator', pagePath: '/tools/bmi-calculator',
  examples: [{ en: 'My BMI with 65kg and 175cm?', zh: '65kg、175cm 的 BMI 是多少？' }],
  inputSchema: {
    type: 'object',
    properties: { weight: { type: 'number', description: 'Weight in kg.', default: 65 }, height: { type: 'number', description: 'Height in cm.', default: 175 }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } },
    required: ['weight', 'height'],
  },
}

export const httpStatusTool: ToolMeta = {
  id: 'http-status',
  name: 'HTTP Status Codes',
  title: { en: 'HTTP Status Codes', zh: 'HTTP 状态码' },
  description: { en: 'Color-coded reference for HTTP status codes.', zh: '按类别着色的 HTTP 状态码速查。' },
  mcpDescription:
    'Look up HTTP status codes. Optional `query` filters by code or phrase. Returns matching codes with phrase, category and description. Use when a user asks what an HTTP status code means.',
  category: 'Monitoring', icon: '🚦', tags: ['http', 'status', 'reference'], status: 'stable',
  embedPath: '/embed/http-status', pagePath: '/tools/http-status',
  examples: [{ en: 'What does 429 mean?', zh: '429 是什么含义？' }],
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string', description: 'Code or phrase to search.', default: '' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } },
  },
}

export const diceRollerTool: ToolMeta = {
  id: 'dice-roller',
  name: 'Dice Roller',
  title: { en: 'Dice Roller', zh: '骰子' },
  description: { en: 'Roll cryptographically-random dice and read the total.', zh: '掷骰子（密码学随机）并显示合计。' },
  mcpDescription:
    'Roll dice. Inputs: `count` (1–20) and `sides` (e.g. 6, 20). Returns the individual results and their total. Use for tabletop games or random rolls the user should be able to trust.',
  category: 'Games', icon: '🎲', tags: ['dice', 'random', 'game'], status: 'stable',
  embedPath: '/embed/dice-roller', pagePath: '/tools/dice-roller',
  examples: [{ en: 'Roll 2d6.', zh: '掷两个 6 面骰。' }, { en: 'Roll a d20.', zh: '掷一个 20 面骰。' }],
  inputSchema: {
    type: 'object',
    properties: { count: { type: 'integer', default: 2 }, sides: { type: 'integer', default: 6 }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } },
  },
}

export const worldClockTool: ToolMeta = {
  id: 'world-clock',
  name: 'World Clock',
  title: { en: 'World Clock', zh: '世界时钟' },
  description: { en: 'Live times across major cities with a day/night indicator.', zh: '多城市实时时间与昼夜指示。' },
  mcpDescription:
    'Show the current time in major cities. Optional `zones` (array of timezone ids) limits the list. Returns each city/timezone with its current time and date. Use when a user asks the time somewhere.',
  category: 'Everyday', icon: '🌍', tags: ['time', 'timezone', 'clock'], status: 'stable',
  embedPath: '/embed/world-clock', pagePath: '/tools/world-clock',
  examples: [{ en: 'What time is it in Tokyo and New York?', zh: '东京和纽约现在几点？' }],
  inputSchema: { type: 'object', properties: { zones: { type: 'array', items: { type: 'string' }, description: 'Optional timezone ids.' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } } },
}

export const coinFlipTool: ToolMeta = {
  id: 'coin-flip',
  name: 'Coin Flip',
  title: { en: 'Coin Flip', zh: '抛硬币' },
  description: { en: 'Fair coin flip using the Web Crypto API.', zh: '使用 Web Crypto 的公平抛硬币。' },
  mcpDescription: 'Flip a fair coin. Returns "heads" or "tails". Use for unbiased random binary decisions the user should trust.',
  category: 'Games', icon: '🪙', tags: ['random', 'coin', 'game'], status: 'stable',
  embedPath: '/embed/coin-flip', pagePath: '/tools/coin-flip',
  examples: [{ en: 'Flip a coin.', zh: '抛个硬币。' }],
  inputSchema: { type: 'object', properties: { locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } } },
}

export const tipSplitTool: ToolMeta = {
  id: 'tip-split',
  name: 'Tip & Bill Split',
  title: { en: 'Tip & Bill Split', zh: '小费与分账' },
  description: { en: 'Add a tip and split a bill with a visual breakdown.', zh: '加小费并分账，带可视化比例。' },
  mcpDescription:
    'Compute a tip and split a bill. Inputs: `total`, `tipPercent`, `people`. Returns tip, grand total and per-person amount.',
  category: 'Finance', icon: '🧾', tags: ['tip', 'split', 'bill'], status: 'stable',
  embedPath: '/embed/tip-split', pagePath: '/tools/tip-split',
  examples: [{ en: 'Split a $200 bill 4 ways with 15% tip.', zh: '200 元账单 4 人分，15% 小费。' }],
  inputSchema: { type: 'object', properties: { total: { type: 'number', default: 200 }, tipPercent: { type: 'number', default: 15 }, people: { type: 'integer', default: 4 }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['total'] },
}

export const statisticsTool: ToolMeta = {
  id: 'statistics',
  name: 'Statistics',
  title: { en: 'Statistics', zh: '统计' },
  description: { en: 'Mean, median, standard deviation and a histogram for a data set.', zh: '一组数据的均值、中位数、标准差与直方图。' },
  mcpDescription:
    'Describe a data set. Input: `data` (numbers, as an array or a space/comma-separated string). Returns count, sum, mean, median, std, min, max, quartiles and a histogram. Use when a user wants statistics on numbers.',
  category: 'Data', icon: '📊', tags: ['statistics', 'math', 'data'], status: 'stable',
  embedPath: '/embed/statistics', pagePath: '/tools/statistics',
  examples: [{ en: 'Mean and std of 12 15 9 22 18.', zh: '12 15 9 22 18 的均值与标准差。' }],
  inputSchema: { type: 'object', properties: { data: { type: 'string', description: 'Numbers separated by spaces/commas.' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['data'] },
}

export const primeFactorTool: ToolMeta = {
  id: 'prime-factor',
  name: 'Prime Factorization',
  title: { en: 'Prime Factorization', zh: '质因数分解' },
  description: { en: 'Prime factorization, divisors and primality.', zh: '质因数分解、因数与质数判定。' },
  mcpDescription: 'Factorize an integer into primes. Input: `n`. Returns prime factors with powers, all divisors and whether n is prime.',
  category: 'Math', icon: '🧮', tags: ['math', 'prime', 'factor'], status: 'stable',
  embedPath: '/embed/prime-factor', pagePath: '/tools/prime-factor',
  examples: [{ en: 'Factorize 360.', zh: '把 360 分解质因数。' }],
  inputSchema: { type: 'object', properties: { n: { type: 'integer', default: 360 }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['n'] },
}

export const colorPaletteTool: ToolMeta = {
  id: 'color-palette',
  name: 'Color Palette',
  title: { en: 'Color Palette', zh: '调色板' },
  description: { en: 'Generate a harmonious palette from a base color.', zh: '从基色生成协调配色。' },
  mcpDescription:
    'Generate a 5-color harmonious palette from a base color. Input: `color` (hex). Returns the palette hex values. Use when a user needs a color scheme.',
  category: 'Design', icon: '🎨', tags: ['color', 'palette', 'design'], status: 'stable',
  embedPath: '/embed/color-palette', pagePath: '/tools/color-palette',
  examples: [{ en: 'A palette based on #6366f1.', zh: '以 #6366f1 为基色的配色。' }],
  inputSchema: { type: 'object', properties: { color: { type: 'string', default: '#6366f1' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['color'] },
}

export const bitVisualizerTool: ToolMeta = {
  id: 'bit-visualizer',
  name: 'Bit Visualizer',
  title: { en: 'Bit Visualizer', zh: '位可视化' },
  description: { en: 'See an integer as a grid of bits, with binary/octal/hex.', zh: '以位方块查看整数，附二进制/八进制/十六进制。' },
  mcpDescription: 'Show an integer in base 2/8/10/16 and as a bit array. Inputs: `value` and optional `bits` (8/16/32). Use for bit math or base conversion.',
  category: 'Developer', icon: '🔢', tags: ['bits', 'binary', 'hex'], status: 'stable',
  embedPath: '/embed/bit-visualizer', pagePath: '/tools/bit-visualizer',
  examples: [{ en: 'Show 42 in binary and hex.', zh: '把 42 显示成二进制和十六进制。' }],
  inputSchema: { type: 'object', properties: { value: { type: 'integer', default: 42 }, bits: { type: 'integer', default: 16 }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['value'] },
}

export const matrixCalculatorTool: ToolMeta = {
  id: 'matrix-calculator',
  name: 'Matrix Calculator',
  title: { en: 'Matrix Calculator', zh: '矩阵计算' },
  description: { en: 'Multiply, transpose and take determinants of matrices.', zh: '矩阵乘法、转置与行列式。' },
  mcpDescription: 'Do matrix math. Inputs: `a` and `b` (matrices as newline rows, e.g. "1 2\\n3 4") and `op` ("multiply" | "transpose" | "determinant"). Returns the resulting matrix or scalar.',
  category: 'Math', icon: '🧮', tags: ['matrix', 'math', 'linear-algebra'], status: 'stable',
  embedPath: '/embed/matrix-calculator', pagePath: '/tools/matrix-calculator',
  examples: [{ en: 'Multiply [[1,2],[3,4]] by [[5,6],[7,8]].', zh: '计算 [[1,2],[3,4]] 乘 [[5,6],[7,8]]。' }],
  inputSchema: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' }, op: { type: 'string', enum: ['multiply', 'transpose', 'determinant'], default: 'multiply' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['a'] },
}

export const chineseMoneyTool: ToolMeta = {
  id: 'chinese-money',
  name: 'Amount in Chinese',
  title: { en: 'Amount in Chinese', zh: '金额大写' },
  description: { en: 'Render an amount in Chinese capital numerals, like a receipt.', zh: '以票据样式把金额转成人民币大写。' },
  mcpDescription: 'Convert an amount to Chinese financial capital numerals (人民币大写) and Chinese numerals. Input: `amount`. Use for invoices or cheques.',
  category: 'Finance', icon: '💰', tags: ['finance', 'chinese', 'money'], status: 'stable',
  embedPath: '/embed/chinese-money', pagePath: '/tools/chinese-money',
  examples: [{ en: 'Write 1234.56 in RMB capital letters.', zh: '把 1234.56 写成人民币大写。' }],
  inputSchema: { type: 'object', properties: { amount: { type: 'number', default: 1234.56 }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['amount'] },
}

export const colorBlindnessTool: ToolMeta = {
  id: 'color-blindness',
  name: 'Color Blindness Simulator',
  title: { en: 'Color Blindness Simulator', zh: '色盲模拟' },
  description: { en: 'Preview a color under different color-vision deficiencies.', zh: '预览色觉异常者看到的颜色。' },
  mcpDescription: 'Simulate how a color appears with protanopia/deuteranopia/tritanopia. Input: `color` (hex). Returns the simulated hex values. Use for accessibility checks.',
  category: 'Design', icon: '👁️', tags: ['color', 'accessibility', 'design'], status: 'stable',
  embedPath: '/embed/color-blindness', pagePath: '/tools/color-blindness',
  examples: [{ en: 'How does red look to someone with deuteranopia?', zh: '红色在绿色盲眼里是什么样？' }],
  inputSchema: { type: 'object', properties: { color: { type: 'string', default: '#e11d48' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['color'] },
}

export const randomPickerTool: ToolMeta = {
  id: 'random-picker',
  name: 'Random Picker',
  title: { en: 'Random Picker', zh: '随机抽取' },
  description: { en: 'Spin a wheel to fairly pick from a list.', zh: '转盘公平地从列表抽取。' },
  mcpDescription: 'Pick one item at random from a list using crypto-randomness. Input: `items` (array). Returns the chosen item. Use for fair raffles or decisions.',
  category: 'Games', icon: '🎡', tags: ['random', 'picker', 'game'], status: 'stable',
  embedPath: '/embed/random-picker', pagePath: '/tools/random-picker',
  examples: [{ en: 'Pick one of Alice/Bob/Carol.', zh: '从 Alice/Bob/Carol 里随机抽一个。' }],
  inputSchema: { type: 'object', properties: { items: { type: 'array', items: { type: 'string' } }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['items'] },
}

export const qrGeneratorTool: ToolMeta = {
  id: 'qr-generator',
  name: 'QR Code Generator',
  title: { en: 'QR Code Generator', zh: '二维码生成器' },
  description: { en: 'Generate a QR code from text or a URL.', zh: '把文本或链接生成二维码。' },
  mcpDescription: 'Generate a QR code for a text or URL. Input: `text`. The card renders and lets the user download a PNG. Use when a user wants a scannable QR code.',
  category: 'Design', icon: '⬛', tags: ['qr', 'barcode', 'design'], status: 'stable',
  embedPath: '/embed/qr-generator', pagePath: '/tools/qr-generator',
  examples: [{ en: 'Make a QR code for https://mcp.gholl.com.', zh: '为 https://mcp.gholl.com 生成二维码。' }],
  inputSchema: { type: 'object', properties: { text: { type: 'string', default: 'https://mcp.gholl.com' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['text'] },
}

export const loanCalculatorTool: ToolMeta = {
  id: 'loan-calculator',
  name: 'Loan Calculator',
  title: { en: 'Loan Calculator', zh: '贷款计算器' },
  description: { en: 'Monthly payment, total interest and a balance chart.', zh: '月供、总利息与余额曲线。' },
  mcpDescription: 'Compute a loan. Inputs: `principal`, `rate` (annual %), `months`. Returns monthly payment, total interest, total paid and a balance schedule.',
  category: 'Finance', icon: '🏦', tags: ['loan', 'mortgage', 'finance'], status: 'stable',
  embedPath: '/embed/loan-calculator', pagePath: '/tools/loan-calculator',
  examples: [{ en: 'Monthly payment on a 500k loan at 4.5% over 20 years.', zh: '50 万贷款、4.5%、20 年的月供。' }],
  inputSchema: { type: 'object', properties: { principal: { type: 'number', default: 500000 }, rate: { type: 'number', default: 4.5 }, months: { type: 'integer', default: 240 }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['principal'] },
}

export const compoundInterestTool: ToolMeta = {
  id: 'compound-interest',
  name: 'Compound Interest',
  title: { en: 'Compound Interest', zh: '复利计算' },
  description: { en: 'Project compound growth over time.', zh: '复利增长预测。' },
  mcpDescription: 'Project compound interest. Inputs: `principal`, `rate` (annual %), `years`, `compounds` (per year, default 12). Returns yearly values.',
  category: 'Finance', icon: '📈', tags: ['compound', 'interest', 'finance'], status: 'stable',
  embedPath: '/embed/compound-interest', pagePath: '/tools/compound-interest',
  examples: [{ en: '10k at 7% for 20 years, compounded monthly.', zh: '1 万、7%、20 年、按月复利。' }],
  inputSchema: { type: 'object', properties: { principal: { type: 'number', default: 10000 }, rate: { type: 'number', default: 7 }, years: { type: 'integer', default: 20 }, compounds: { type: 'integer', default: 12 }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['principal'] },
}

export const passwordStrengthTool: ToolMeta = {
  id: 'password-strength',
  name: 'Password Strength',
  title: { en: 'Password Strength', zh: '密码强度' },
  description: { en: 'Estimate password strength and entropy.', zh: '评估密码强度与熵。' },
  mcpDescription: 'Estimate a password strength from its length and character classes. Input: `password`. Returns a 0–4 score, a label and entropy bits. Use to advise users (the value is not stored).',
  category: 'Security', icon: '🔒', tags: ['password', 'security', 'entropy'], status: 'stable',
  embedPath: '/embed/password-strength', pagePath: '/tools/password-strength',
  examples: [{ en: 'How strong is this password?', zh: '这个密码有多强？' }],
  inputSchema: { type: 'object', properties: { password: { type: 'string' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['password'] },
}

export const resistorColorTool: ToolMeta = {
  id: 'resistor-color',
  name: 'Resistor Color Code',
  title: { en: 'Resistor Color Code', zh: '电阻色环' },
  description: { en: 'Decode a 4-band resistor into ohms.', zh: '由四色环解析电阻阻值。' },
  mcpDescription: 'Decode a resistor color code. Input: `bands` (array of color ids: e.g. ["brown","black","red","gold"]). Returns the resistance and tolerance.',
  category: 'Everyday', icon: '🧩', tags: ['electronics', 'resistor', 'reference'], status: 'stable',
  embedPath: '/embed/resistor-color', pagePath: '/tools/resistor-color',
  examples: [{ en: 'brown-black-red-gold = ?', zh: '棕-黑-红-金 是多少欧？' }],
  inputSchema: { type: 'object', properties: { bands: { type: 'array', items: { type: 'string' } }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['bands'] },
}

export const jsonToTableTool: ToolMeta = {
  id: 'json-to-table',
  name: 'JSON to Table',
  title: { en: 'JSON to Table', zh: 'JSON 转表格' },
  description: { en: 'Render JSON as a readable table.', zh: '把 JSON 渲染成表格。' },
  mcpDescription: 'Convert JSON into a table. Input: `json` (string). Handles arrays of objects, arrays of arrays and objects. Returns columns and rows.',
  category: 'Data', icon: '🗂️', tags: ['json', 'table', 'data'], status: 'stable',
  embedPath: '/embed/json-to-table', pagePath: '/tools/json-to-table',
  examples: [{ en: 'Show this JSON as a table.', zh: '把这段 JSON 显示成表格。' }],
  inputSchema: { type: 'object', properties: { json: { type: 'string' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['json'] },
}

export const textDiffTool: ToolMeta = {
  id: 'text-diff',
  name: 'Text Diff',
  title: { en: 'Text Diff', zh: '文本差异' },
  description: { en: 'Line-by-line diff between two texts.', zh: '逐行对比两段文本。' },
  mcpDescription: 'Compute a line diff between two texts. Inputs: `a` and `b`. Returns the diff lines (same/add/del) and counts.',
  category: 'Text', icon: '🆚', tags: ['diff', 'text', 'compare'], status: 'stable',
  embedPath: '/embed/text-diff', pagePath: '/tools/text-diff',
  examples: [{ en: 'What changed between these two versions?', zh: '这两版之间改了什么？' }],
  inputSchema: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['a', 'b'] },
}

export const reactionTestTool: ToolMeta = {
  id: 'reaction-test',
  name: 'Reaction Test',
  title: { en: 'Reaction Test', zh: '反应速度测试' },
  description: { en: 'Interactive reaction-time measurement.', zh: '交互式测量反应速度。' },
  mcpDescription: 'An interactive reaction-time test card. No server computation; the user taps when the panel turns green and the card reports the milliseconds.',
  category: 'Games', icon: '⚡', tags: ['reaction', 'game', 'test'], status: 'stable',
  embedPath: '/embed/reaction-test', pagePath: '/tools/reaction-test',
  examples: [{ en: 'Test my reaction time.', zh: '测一下我的反应速度。' }],
  inputSchema: { type: 'object', properties: { locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } } },
}

export const typingTestTool: ToolMeta = {
  id: 'typing-test',
  name: 'Typing Test',
  title: { en: 'Typing Test', zh: '打字测试' },
  description: { en: 'Measure typing speed and accuracy.', zh: '测量打字速度与正确率。' },
  mcpDescription: 'An interactive typing-speed test card. The user types a sentence and the card reports WPM and accuracy.',
  category: 'Games', icon: '⌨️', tags: ['typing', 'game', 'test'], status: 'stable',
  embedPath: '/embed/typing-test', pagePath: '/tools/typing-test',
  examples: [{ en: 'Test my typing speed.', zh: '测一下我的打字速度。' }],
  inputSchema: { type: 'object', properties: { locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } } },
}

export const markdownPreviewTool: ToolMeta = {
  id: 'markdown-preview',
  name: 'Markdown Preview',
  title: { en: 'Markdown Preview', zh: 'Markdown 预览' },
  description: { en: 'Write Markdown and preview it rendered.', zh: '边写 Markdown 边预览渲染结果。' },
  mcpDescription: 'Render Markdown to HTML. Input: `markdown`. Returns the rendered HTML (headings, lists, code, links, bold/italic). Use when a user wants Markdown rendered.',
  category: 'Text', icon: '📝', tags: ['markdown', 'text', 'preview'], status: 'stable',
  embedPath: '/embed/markdown-preview', pagePath: '/tools/markdown-preview',
  examples: [{ en: 'Render this Markdown.', zh: '渲染这段 Markdown。' }],
  inputSchema: { type: 'object', properties: { markdown: { type: 'string' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['markdown'] },
}

export const csvChartTool: ToolMeta = {
  id: 'csv-chart',
  name: 'CSV to Chart',
  title: { en: 'CSV to Chart', zh: 'CSV 出图' },
  description: { en: 'Chart a CSV instantly (bar or line).', zh: '粘贴 CSV 立即出图（柱状/折线）。' },
  mcpDescription: 'Turn CSV into a chart. Input: `csv` (first row = headers). Returns headers, row count and numeric columns. The card renders a bar/line chart.',
  category: 'Data', icon: '📉', tags: ['csv', 'chart', 'data'], status: 'stable',
  embedPath: '/embed/csv-chart', pagePath: '/tools/csv-chart',
  examples: [{ en: 'Chart this CSV.', zh: '把这个 CSV 画成图。' }],
  inputSchema: { type: 'object', properties: { csv: { type: 'string' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['csv'] },
}

export const totpGeneratorTool: ToolMeta = {
  id: 'totp-generator',
  name: 'TOTP Generator',
  title: { en: 'TOTP Generator', zh: 'TOTP 动态口令' },
  description: { en: 'Generate time-based one-time codes (2FA).', zh: '生成基于时间的动态口令（2FA）。' },
  mcpDescription: 'Generate a TOTP code from a Base32 secret. Inputs: `secret`, optional `digits` (default 6) and `period` (default 30). Returns the current code. Use to verify 2FA setup.',
  category: 'Security', icon: '🛡️', tags: ['totp', '2fa', 'security'], status: 'stable',
  embedPath: '/embed/totp-generator', pagePath: '/tools/totp-generator',
  examples: [{ en: 'Generate a code for this TOTP secret.', zh: '用这个 TOTP 密钥生成口令。' }],
  inputSchema: { type: 'object', properties: { secret: { type: 'string', default: 'JBSWY3DPEHPK3PXP' }, digits: { type: 'integer', default: 6 }, period: { type: 'integer', default: 30 }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['secret'] },
}

export const imageToBase64Tool: ToolMeta = {
  id: 'image-to-base64',
  name: 'Image to Base64',
  title: { en: 'Image to Base64', zh: '图片转 Base64' },
  description: { en: 'Convert an image to a data URI / Base64.', zh: '把图片转成 Data URI / Base64。' },
  mcpDescription: 'An interactive card that converts a chosen image to a data URI / Base64. Runs fully in the browser.',
  category: 'Design', icon: '🖼️', tags: ['image', 'base64', 'data-uri'], status: 'stable',
  embedPath: '/embed/image-to-base64', pagePath: '/tools/image-to-base64',
  examples: [{ en: 'Convert an image to a data URI.', zh: '把图片转成 Data URI。' }],
  inputSchema: { type: 'object', properties: { locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } } },
}

export const imageCompressorTool: ToolMeta = {
  id: 'image-compressor',
  name: 'Image Compressor',
  title: { en: 'Image Compressor', zh: '图片压缩' },
  description: { en: 'Compress an image in the browser.', zh: '在浏览器内压缩图片。' },
  mcpDescription: 'An interactive card that compresses an image with a quality slider and format choice, showing before/after sizes.',
  category: 'Design', icon: '🗜️', tags: ['image', 'compress', 'canvas'], status: 'stable',
  embedPath: '/embed/image-compressor', pagePath: '/tools/image-compressor',
  examples: [{ en: 'Compress this image.', zh: '压缩这张图片。' }],
  inputSchema: { type: 'object', properties: { locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } } },
}

export const faviconGeneratorTool: ToolMeta = {
  id: 'favicon-generator',
  name: 'Favicon Generator',
  title: { en: 'Favicon Generator', zh: '图标生成器' },
  description: { en: 'Turn text or an emoji into a favicon.', zh: '把文字或 emoji 做成图标。' },
  mcpDescription: 'An interactive card that renders a favicon from text/emoji, background, foreground and radius, downloadable as PNG.',
  category: 'Design', icon: '⭐', tags: ['favicon', 'icon', 'canvas'], status: 'stable',
  embedPath: '/embed/favicon-generator', pagePath: '/tools/favicon-generator',
  examples: [{ en: 'Make a favicon from the letter M.', zh: '用字母 M 做一个图标。' }],
  inputSchema: { type: 'object', properties: { locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } } },
}

export const dnsLookupTool: ToolMeta = {
  id: 'dns-lookup',
  name: 'DNS Lookup',
  title: { en: 'DNS Lookup', zh: 'DNS 查询' },
  description: { en: 'Resolve DNS records over DNS-over-HTTPS.', zh: '通过 DoH 解析 DNS 记录。' },
  mcpDescription: 'Resolve DNS records. Inputs: `name` (domain) and optional `type` (A/AAAA/CNAME/MX/TXT/NS). Returns the answer records. Use to check DNS.',
  category: 'Monitoring', icon: '🌐', tags: ['dns', 'network', 'monitoring'], status: 'stable',
  embedPath: '/embed/dns-lookup', pagePath: '/tools/dns-lookup',
  examples: [{ en: 'Look up the A records for mcp.gholl.com.', zh: '查询 mcp.gholl.com 的 A 记录。' }],
  inputSchema: { type: 'object', properties: { name: { type: 'string', default: 'mcp.gholl.com' }, type: { type: 'string', default: 'A' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['name'] },
}

export const httpInspectorTool: ToolMeta = {
  id: 'http-inspector',
  name: 'HTTP Inspector',
  title: { en: 'HTTP Inspector', zh: 'HTTP 响应检查' },
  description: { en: 'Fetch a URL and inspect status, redirects and headers.', zh: '请求网址并查看状态、重定向与响应头。' },
  mcpDescription: 'Fetch a URL server-side and return its HTTP status, the redirect chain and response headers. Input: `url`. Use to debug HTTP responses (which a browser cannot do cross-origin).',
  category: 'Monitoring', icon: '🔍', tags: ['http', 'headers', 'monitoring'], status: 'stable',
  embedPath: '/embed/http-inspector', pagePath: '/tools/http-inspector',
  examples: [{ en: 'Inspect the headers of https://mcp.gholl.com.', zh: '检查 https://mcp.gholl.com 的响应头。' }],
  inputSchema: { type: 'object', properties: { url: { type: 'string', default: 'https://mcp.gholl.com' }, locale: { type: 'string', enum: ['en', 'zh'], default: 'en' } }, required: ['url'] },
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
  trigLabTool,
  geometryLabTool,
  conicSectionsTool,
  jsonFormatterTool,
  unitConverterTool,
  gradientGeneratorTool,
  boxShadowTool,
  borderRadiusTool,
  bmiCalculatorTool,
  httpStatusTool,
  diceRollerTool,
  worldClockTool,
  coinFlipTool,
  tipSplitTool,
  statisticsTool,
  primeFactorTool,
  colorPaletteTool,
  bitVisualizerTool,
  matrixCalculatorTool,
  chineseMoneyTool,
  colorBlindnessTool,
  randomPickerTool,
  qrGeneratorTool,
  loanCalculatorTool,
  compoundInterestTool,
  passwordStrengthTool,
  resistorColorTool,
  jsonToTableTool,
  textDiffTool,
  reactionTestTool,
  typingTestTool,
  markdownPreviewTool,
  csvChartTool,
  totpGeneratorTool,
  imageToBase64Tool,
  imageCompressorTool,
  faviconGeneratorTool,
  dnsLookupTool,
  httpInspectorTool,
]

export function getTool(id: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.id === id)
}
