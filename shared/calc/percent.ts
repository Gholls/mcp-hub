export function percentOf(percent: number, value: number): number {
  return (percent / 100) * value
}

export function whatPercent(part: number, whole: number): number {
  return whole === 0 ? NaN : (part / whole) * 100
}

export function percentChange(from: number, to: number): number {
  return from === 0 ? NaN : ((to - from) / Math.abs(from)) * 100
}

export function discounted(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100)
}

export function withTax(price: number, taxPercent: number): number {
  return price * (1 + taxPercent / 100)
}

export function round(n: number, digits = 4): number {
  const f = 10 ** digits
  return Math.round(n * f) / f
}
