export interface CsvData {
  headers: string[]
  rows: string[][]
}

export function parseCsv(text: string): CsvData {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') {
      field += ch
    }
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  const clean = rows.filter((r) => r.some((c) => c.trim() !== ''))
  return { headers: clean[0] ?? [], rows: clean.slice(1) }
}

export function numericColumnIndexes(data: CsvData): number[] {
  const indexes: number[] = []
  for (let c = 0; c < data.headers.length; c++) {
    const sample = data.rows.slice(0, 20).map((r) => r[c])
    if (sample.length && sample.every((v) => v !== undefined && v.trim() !== '' && Number.isFinite(Number(v)))) {
      indexes.push(c)
    }
  }
  return indexes
}
