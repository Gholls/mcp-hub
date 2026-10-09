export interface Stats {
  count: number
  sum: number
  mean: number
  median: number
  min: number
  max: number
  std: number
  p25: number
  p75: number
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

export function describe(numbers: number[]): Stats | null {
  const nums = numbers.filter((n) => Number.isFinite(n))
  if (nums.length === 0) return null
  const sorted = [...nums].sort((a, b) => a - b)
  const sum = nums.reduce((a, b) => a + b, 0)
  const mean = sum / nums.length
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length
  return {
    count: nums.length,
    sum,
    mean,
    median: percentile(sorted, 0.5),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    std: Math.sqrt(variance),
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
  }
}

export interface Bin {
  from: number
  to: number
  count: number
}

export function histogram(numbers: number[], bins = 10): Bin[] {
  const nums = numbers.filter((n) => Number.isFinite(n))
  if (nums.length === 0) return []
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const width = (max - min) / bins || 1
  const out: Bin[] = Array.from({ length: bins }, (_, i) => ({
    from: min + i * width,
    to: min + (i + 1) * width,
    count: 0,
  }))
  for (const n of nums) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((n - min) / width)))
    out[idx].count++
  }
  return out
}

export function parseNumbers(text: string): number[] {
  return text
    .split(/[\s,;]+/)
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n))
}
