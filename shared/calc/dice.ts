export type Rng = () => number

function cryptoRng(): number {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] / 4294967296
}

export function rollDie(sides = 6, rng: Rng = cryptoRng): number {
  const s = Math.max(2, Math.floor(sides))
  return 1 + Math.floor(rng() * s)
}

export function rollDice(count = 2, sides = 6, rng: Rng = cryptoRng): number[] {
  const n = Math.max(1, Math.min(20, Math.floor(count)))
  return Array.from({ length: n }, () => rollDie(sides, rng))
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}
