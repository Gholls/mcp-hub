export type Matrix = number[][]

export function parseMatrix(text: string): Matrix {
  return text
    .split(/[\n;]/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => row.split(/[\s,]+/).map(Number).filter((n) => Number.isFinite(n)))
    .filter((row) => row.length > 0)
}

export function formatMatrix(m: Matrix): string {
  return m.map((row) => row.map((v) => (Math.round(v * 1e6) / 1e6).toString()).join(' ')).join('\n')
}

export function transpose(m: Matrix): Matrix {
  if (m.length === 0) return []
  return m[0].map((_, c) => m.map((row) => row[c] ?? 0))
}

export function multiply(a: Matrix, b: Matrix): Matrix | null {
  if (a.length === 0 || b.length === 0) return null
  if (a[0].length !== b.length) return null
  const out: Matrix = []
  for (let i = 0; i < a.length; i++) {
    out[i] = []
    for (let j = 0; j < b[0].length; j++) {
      let s = 0
      for (let k = 0; k < b.length; k++) s += a[i][k] * b[k][j]
      out[i][j] = s
    }
  }
  return out
}

export function determinant(m: Matrix): number | null {
  const n = m.length
  if (n === 0 || m.some((row) => row.length !== n)) return null
  if (n === 1) return m[0][0]
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0]
  let det = 0
  for (let c = 0; c < n; c++) {
    const minor = m.slice(1).map((row) => row.filter((_, j) => j !== c))
    det += (c % 2 === 0 ? 1 : -1) * m[0][c] * (determinant(minor) ?? 0)
  }
  return det
}
