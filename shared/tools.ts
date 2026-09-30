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

/**
 * The single source of truth for every tool shipped by mcp.gholl.com.
 *
 * One definition powers three surfaces:
 *   1. the human-facing catalog + landing pages (`/`, `/tools/:id`)
 *   2. the sandboxed widget iframes (`/embed/:id`)
 *   3. the MCP server tool list + `/.well-known/mcp.json` discovery document
 */
export const TOOLS: ToolMeta[] = [vramCalcTool]

export function getTool(id: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.id === id)
}
