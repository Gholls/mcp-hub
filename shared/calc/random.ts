function randomUint32(): number {
  const b = new Uint32Array(1)
  crypto.getRandomValues(b)
  return b[0]
}

export function coinFlip(): 'heads' | 'tails' {
  return randomUint32() % 2 === 0 ? 'heads' : 'tails'
}

export function randomInt(maxExclusive: number): number {
  return randomUint32() % Math.max(1, Math.floor(maxExclusive))
}

export function pickOne<T>(list: T[]): T | undefined {
  return list.length ? list[randomInt(list.length)] : undefined
}
