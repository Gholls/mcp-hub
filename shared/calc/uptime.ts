export interface UptimeSample {
  /** Unix ms timestamp. */
  t: number
  /** Round-trip latency in ms. */
  latencyMs: number
  ok: boolean
}

export interface UptimeSummary {
  uptimePercent: number
  avgLatencyMs: number
  p95LatencyMs: number
  minLatencyMs: number
  maxLatencyMs: number
  failures: number
  samples: number
}

export function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deterministic pseudo 24h latency series derived from the endpoint string.
 * It is illustrative sample data used to draw the dashboard before any real
 * probes are available.
 */
export function synthesizeSeries(
  seedInput: string,
  hours = 24,
  intervalMinutes = 30,
  now = Date.now(),
): UptimeSample[] {
  const rand = mulberry32(hashString(seedInput || 'default'))
  const base = 60 + Math.floor(rand() * 180)
  const count = Math.floor((hours * 60) / intervalMinutes)
  const samples: UptimeSample[] = []
  for (let i = count - 1; i >= 0; i--) {
    const t = now - i * intervalMinutes * 60_000
    const wave = Math.sin(i / 4) * 25 + Math.sin(i / 11) * 15
    const jitter = (rand() - 0.5) * 40
    const spike = rand() > 0.94 ? 200 + rand() * 400 : 0
    const ok = !(rand() > 0.985)
    samples.push({
      t,
      latencyMs: Math.max(8, Math.round(base + wave + jitter + spike)),
      ok,
    })
  }
  return samples
}

export function summarize(samples: UptimeSample[]): UptimeSummary {
  if (samples.length === 0) {
    return { uptimePercent: 100, avgLatencyMs: 0, p95LatencyMs: 0, minLatencyMs: 0, maxLatencyMs: 0, failures: 0, samples: 0 }
  }
  const okSamples = samples.filter((s) => s.ok)
  const latencies = okSamples.map((s) => s.latencyMs).sort((a, b) => a - b)
  const sum = latencies.reduce((a, b) => a + b, 0)
  const p95Index = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))
  return {
    uptimePercent: (okSamples.length / samples.length) * 100,
    avgLatencyMs: latencies.length ? sum / latencies.length : 0,
    p95LatencyMs: latencies.length ? latencies[p95Index] : 0,
    minLatencyMs: latencies.length ? latencies[0] : 0,
    maxLatencyMs: latencies.length ? latencies[latencies.length - 1] : 0,
    failures: samples.length - okSamples.length,
    samples: samples.length,
  }
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
