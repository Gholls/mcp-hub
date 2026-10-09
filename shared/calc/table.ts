export interface TableData {
  columns: string[]
  rows: string[][]
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Converts JSON (array of objects, array of arrays, or object) into a table. */
export function toTable(value: unknown): TableData {
  if (Array.isArray(value)) {
    if (value.length === 0) return { columns: [], rows: [] }
    if (value.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
      const columns = [...new Set(value.flatMap((v) => Object.keys(v as Record<string, unknown>)))]
      const rows = value.map((v) => columns.map((c) => stringify((v as Record<string, unknown>)[c])))
      return { columns, rows }
    }
    const width = Math.max(...value.map((v) => (Array.isArray(v) ? v.length : 1)))
    const columns = Array.from({ length: width }, (_, i) => `#${i + 1}`)
    const rows = value.map((v) => (Array.isArray(v) ? v : [v]).map(stringify))
    return { columns, rows }
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    return { columns: ['key', 'value'], rows: entries.map(([k, v]) => [k, stringify(v)]) }
  }
  return { columns: ['value'], rows: [[stringify(value)]] }
}
