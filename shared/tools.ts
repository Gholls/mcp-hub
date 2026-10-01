import type { ToolMeta } from './types.ts'

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
]

export function getTool(id: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.id === id)
}
