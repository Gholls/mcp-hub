import { describe, expect, it } from 'vitest'
import { estimateVram, inferArchitecture } from '../shared/calc/vram.ts'

describe('estimateVram', () => {
  it('estimates weights near params * bytes * overhead for fp16', () => {
    const result = estimateVram({
      modelParamsB: 7,
      precision: 'fp16',
      contextLength: 4096,
      batchSize: 1,
      kvPrecision: 'fp16',
      tensorParallel: 1,
    })
    // 7B * 2 bytes * 1.1 overhead ≈ 15.35 GiB
    expect(result.weightsGB).toBeGreaterThan(14)
    expect(result.weightsGB).toBeLessThan(17)
    expect(result.totalGB).toBeGreaterThan(result.weightsGB)
  })

  it('reduces weight size with lower precision', () => {
    const base = { modelParamsB: 70, contextLength: 4096, batchSize: 1, kvPrecision: 'fp16' as const, tensorParallel: 1 }
    const fp16 = estimateVram({ ...base, precision: 'fp16' })
    const int8 = estimateVram({ ...base, precision: 'int8' })
    const int4 = estimateVram({ ...base, precision: 'int4' })
    expect(int8.weightsGB).toBeLessThan(fp16.weightsGB)
    expect(int4.weightsGB).toBeLessThan(int8.weightsGB)
  })

  it('grows the KV cache with context and batch size', () => {
    const base = { modelParamsB: 7, precision: 'fp16' as const, kvPrecision: 'fp16' as const, tensorParallel: 1 }
    const small = estimateVram({ ...base, contextLength: 4096, batchSize: 1 })
    const large = estimateVram({ ...base, contextLength: 32768, batchSize: 8 })
    expect(large.kvCacheGB).toBeGreaterThan(small.kvCacheGB * 10)
  })

  it('recommends a configuration that fits', () => {
    const result = estimateVram({
      modelParamsB: 7,
      precision: 'int4',
      contextLength: 8192,
      batchSize: 1,
      kvPrecision: 'fp16',
      tensorParallel: 1,
    })
    const best = result.recommendations.find((r) => r.fits)
    expect(best).toBeDefined()
    expect(result.commands.vllm).toContain('vllm serve')
    expect(result.commands.ollama).toContain('ollama run')
  })

  it('infers a plausible architecture', () => {
    const arch = inferArchitecture(7)
    expect(arch.layers).toBeGreaterThan(20)
    expect(arch.hiddenSize).toBeGreaterThan(2048)
    expect(arch.kvHeads).toBeLessThanOrEqual(arch.attentionHeads)
  })
})
