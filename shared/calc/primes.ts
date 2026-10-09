export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false
  if (n % 2 === 0) return n === 2
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false
  return true
}

export function primeFactors(n: number): number[] {
  const factors: number[] = []
  let value = Math.abs(Math.floor(n))
  for (let p = 2; p * p <= value; p++) {
    while (value % p === 0) {
      factors.push(p)
      value /= p
    }
  }
  if (value > 1) factors.push(value)
  return factors
}

export function factorize(n: number): { factor: number; power: number }[] {
  const out: { factor: number; power: number }[] = []
  for (const f of primeFactors(n)) {
    const last = out[out.length - 1]
    if (last && last.factor === f) last.power += 1
    else out.push({ factor: f, power: 1 })
  }
  return out
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y) [x, y] = [y, x % y]
  return x
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return Math.abs(Math.round(a) * Math.round(b)) / gcd(a, b)
}

export function divisors(n: number): number[] {
  const value = Math.abs(Math.round(n))
  const out: number[] = []
  for (let i = 1; i * i <= value; i++) {
    if (value % i === 0) {
      out.push(i)
      if (i !== value / i) out.push(value / i)
    }
  }
  return out.sort((a, b) => a - b)
}
