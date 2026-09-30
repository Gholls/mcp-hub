export type Precision = 'fp16' | 'int8' | 'int4'
export type KvPrecision = 'fp16' | 'int8'

export interface VramInput {
  /** Model size in billions of parameters. */
  modelParamsB: number
  /** Weight quantization precision. */
  precision: Precision
  /** Context window length in tokens. */
  contextLength: number
  /** Concurrent sequences (batch size). */
  batchSize: number
  /** KV-cache precision. */
  kvPrecision: KvPrecision
  /** Optional architecture overrides; derived heuristically when omitted. */
  layers?: number
  kvHeads?: number
  headDim?: number
  /** Number of GPUs to shard the model across (tensor parallel). */
  tensorParallel: number
}

export interface VramBreakdown {
  weightsGB: number
  kvCacheGB: number
  activationsGB: number
  overheadGB: number
  totalGB: number
}

export interface Architecture {
  layers: number
  hiddenSize: number
  kvHeads: number
  headDim: number
  attentionHeads: number
}

export interface GpuSpec {
  id: string
  name: string
  vramGB: number
}

export interface GpuRecommendation extends GpuSpec {
  count: number
  totalVramGB: number
  utilization: number
  fits: boolean
}

export interface VramEstimate extends VramBreakdown {
  weightsBytesPerParam: number
  kvBytesPerElement: number
  architecture: Architecture
  recommendations: GpuRecommendation[]
  commands: {
    vllm: string
    ollama: string
  }
}

export const GPU_CATALOG: GpuSpec[] = [
  { id: 'rtx3090', name: 'RTX 3090', vramGB: 24 },
  { id: 'rtx4090', name: 'RTX 4090', vramGB: 24 },
  { id: 'l40s', name: 'NVIDIA L40S', vramGB: 48 },
  { id: 'a100-40', name: 'A100 40GB', vramGB: 40 },
  { id: 'a100-80', name: 'A100 80GB', vramGB: 80 },
  { id: 'h100-80', name: 'H100 80GB', vramGB: 80 },
  { id: 'h200-141', name: 'H200 141GB', vramGB: 141 },
]

export const WEIGHT_BYTES_PER_PARAM: Record<Precision, number> = {
  fp16: 2,
  int8: 1,
  int4: 0.5,
}

export const KV_BYTES_PER_ELEMENT: Record<KvPrecision, number> = {
  fp16: 2,
  int8: 1,
}

const clampPositive = (value: number, fallback: number): number =>
  Number.isFinite(value) && value > 0 ? value : fallback

/** Round to a friendly step (e.g. multiples of 8) to mimic real model configs. */
function roundTo(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step)
}

/**
 * Heuristic architecture inference from parameter count, anchored on widely used
 * dense open models (Llama-2/3, Mistral, Qwen). These are estimates intended for
 * capacity planning, not exact per-model figures — callers can override.
 */
export function inferArchitecture(modelParamsB: number): Architecture {
  const p = clampPositive(modelParamsB, 7)
  const hiddenSize = roundTo(4096 * Math.pow(p / 7, 0.3), 256)
  const layers = Math.max(8, Math.round(10 * Math.log2(p) + 4))
  const headDim = 128
  const attentionHeads = Math.max(8, Math.round(hiddenSize / headDim))
  const kvHeads = Math.max(4, Math.round(attentionHeads / 4))
  return { layers, hiddenSize, kvHeads, headDim, attentionHeads }
}

function paramsToCommand(paramsB: number): string {
  if (paramsB >= 1) return `${paramsB}B`
  return `${Math.round(paramsB * 1000)}M`
}

function vllmQuantFlag(precision: Precision): string {
  switch (precision) {
    case 'int4':
      return '--quantization awq'
    case 'int8':
      return '--quantization bitsandbytes'
    default:
      return '--dtype float16'
  }
}

function ollamaQuantTag(precision: Precision): string {
  switch (precision) {
    case 'int4':
      return 'q4_K_M'
    case 'int8':
      return 'q8_0'
    default:
      return 'fp16'
  }
}

export function estimateVram(input: VramInput): VramEstimate {
  const modelParamsB = clampPositive(input.modelParamsB, 7)
  const contextLength = clampPositive(input.contextLength, 8192)
  const batchSize = clampPositive(input.batchSize, 1)
  const tensorParallel = Math.max(1, Math.round(clampPositive(input.tensorParallel, 1)))

  const inferred = inferArchitecture(modelParamsB)
  const architecture: Architecture = {
    layers: Math.max(1, Math.round(input.layers ?? inferred.layers)),
    hiddenSize: inferred.hiddenSize,
    kvHeads: Math.max(1, Math.round(input.kvHeads ?? inferred.kvHeads)),
    headDim: Math.max(1, Math.round(input.headDim ?? inferred.headDim)),
    attentionHeads: inferred.attentionHeads,
  }

  const weightBytes = WEIGHT_BYTES_PER_PARAM[input.precision]
  const kvBytes = KV_BYTES_PER_ELEMENT[input.kvPrecision]

  const GIB = 1024 ** 3
  const weightsGB = ((modelParamsB * 1e9 * weightBytes) / GIB) * 1.1 // +10% for buffers
  const kvCacheGB =
    (batchSize * contextLength * 2 * architecture.layers * architecture.kvHeads * architecture.headDim * kvBytes) /
    GIB
  const activationsGB = 1.5 + weightsGB * 0.05
  const overheadGB = 0.5
  const totalGB = weightsGB + kvCacheGB + activationsGB + overheadGB

  const recommendations: GpuRecommendation[] = GPU_CATALOG.map((gpu) => {
    const count = Math.max(tensorParallel, Math.ceil(totalGB / (gpu.vramGB * 0.9)))
    const totalVramGB = count * gpu.vramGB
    const utilization = totalGB / totalVramGB
    return { ...gpu, count, totalVramGB, utilization, fits: utilization <= 0.9 }
  }).sort((a, b) => {
    if (a.fits !== b.fits) return a.fits ? -1 : 1
    if (a.count !== b.count) return a.count - b.count
    return a.totalVramGB - b.totalVramGB
  })

  const sizeTag = paramsToCommand(modelParamsB).toLowerCase()
  const vllm =
    `vllm serve your-org/your-model-${sizeTag} \\\n` +
    `  --tensor-parallel-size ${tensorParallel} \\\n` +
    `  ${vllmQuantFlag(input.precision)} \\\n` +
    `  --max-model-len ${Math.round(contextLength)} \\\n` +
    `  --gpu-memory-utilization 0.90`
  const ollama = `ollama run your-model:${sizeTag}-${ollamaQuantTag(input.precision)}`

  return {
    weightsGB,
    kvCacheGB,
    activationsGB,
    overheadGB,
    totalGB,
    weightsBytesPerParam: weightBytes,
    kvBytesPerElement: kvBytes,
    architecture,
    recommendations,
    commands: { vllm, ollama },
  }
}
