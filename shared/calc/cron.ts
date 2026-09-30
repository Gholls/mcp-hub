export interface CronField {
  /** Original source token. */
  source: string
  /** Expanded sorted set of matching values. */
  values: number[]
  /** True when the field was `*` (unrestricted). */
  wildcard: boolean
}

export interface ParsedCron {
  fields: [CronField, CronField, CronField, CronField, CronField]
  valid: boolean
  error?: string
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
}

const DOW_NAMES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
}

interface FieldSpec {
  min: number
  max: number
  names?: Record<string, number>
}

const SPECS: FieldSpec[] = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day of month
  { min: 1, max: 12, names: MONTH_NAMES }, // month
  { min: 0, max: 6, names: DOW_NAMES }, // day of week
]

function resolveToken(token: string, names?: Record<string, number>): number {
  const upper = token.toUpperCase()
  if (names && upper in names) return names[upper]
  const n = Number(token)
  if (!Number.isFinite(n)) throw new Error(`Invalid value "${token}"`)
  return n
}

function expandField(source: string, spec: FieldSpec): CronField {
  const wildcard = source.trim() === '*'
  const values = new Set<number>()

  for (const part of source.split(',')) {
    const [rangePart, stepPart] = part.split('/')
    const step = stepPart ? Number(stepPart) : 1
    if (!Number.isInteger(step) || step < 1) throw new Error(`Invalid step "${part}"`)

    let start: number
    let end: number
    if (rangePart === '*') {
      start = spec.min
      end = spec.max
    } else if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-')
      start = resolveToken(a, spec.names)
      end = resolveToken(b, spec.names)
    } else {
      start = resolveToken(rangePart, spec.names)
      end = stepPart ? spec.max : start
    }

    if (start < spec.min || end > spec.max || start > end) {
      throw new Error(`Out of range "${part}" (allowed ${spec.min}-${spec.max})`)
    }
    for (let v = start; v <= end; v += step) values.add(v)
  }

  return { source, values: [...values].sort((a, b) => a - b), wildcard }
}

function emptyFields(): ParsedCron['fields'] {
  const field = (): CronField => ({ source: '*', values: [], wildcard: true })
  return [field(), field(), field(), field(), field()]
}

export function parseCron(expression: string): ParsedCron {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) {
    return { fields: emptyFields(), valid: false, error: `Expected 5 fields, got ${parts.length}` }
  }
  try {
    const fields: ParsedCron['fields'] = [
      expandField(parts[0], SPECS[0]),
      expandField(parts[1], SPECS[1]),
      expandField(parts[2], SPECS[2]),
      expandField(parts[3], SPECS[3]),
      expandField(parts[4], SPECS[4]),
    ]
    return { fields, valid: true }
  } catch (err) {
    return {
      fields: emptyFields(),
      valid: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

const DOW_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DOW_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function describeCron(cron: ParsedCron, locale: 'en' | 'zh'): string {
  if (!cron.valid) return locale === 'zh' ? '无效的 Cron 表达式' : 'Invalid cron expression'
  const [minute, hour, dom, month, dow] = cron.fields
  const list = (f: CronField) => f.values.join(', ')
  const pad = (n: number) => String(n).padStart(2, '0')

  if (locale === 'zh') {
    const time =
      minute.wildcard && hour.wildcard
        ? '每分钟'
        : minute.wildcard
          ? `每小时的第 ${list(minute)} 分钟`
          : hour.wildcard
            ? `每小时的 ${list(minute)} 分`
            : `${hour.values.map((h) => pad(h)).join(', ')}:${minute.values.map((m) => pad(m)).join(', ')}`
    const day = dom.wildcard && dow.wildcard
      ? '每天'
      : dom.wildcard
        ? `${dow.values.map((d) => DOW_ZH[d]).join('、')}`
        : `每月 ${list(dom)} 号`
    const mon = month.wildcard ? '' : `${month.values.join(',')} 月`
    return `${mon}${day} ${time} 执行`
  }

  const time =
    minute.wildcard && hour.wildcard
      ? 'every minute'
      : minute.wildcard
        ? `every hour at minute ${list(minute)}`
        : hour.wildcard
          ? `at minute ${list(minute)} of every hour`
          : `at ${hour.values.map((h) => pad(h)).join(', ')}:${minute.values.map((m) => pad(m)).join(', ')}`
  const day = dom.wildcard && dow.wildcard
    ? 'every day'
    : dom.wildcard
      ? `on ${dow.values.map((d) => DOW_EN[d]).join(', ')}`
      : `on day ${list(dom)} of the month`
  const mon = month.wildcard ? '' : `in ${month.values.join(', ')} `
  return `${mon}${day} ${time}`.trim()
}

function fieldMatches(field: CronField, value: number): boolean {
  return field.values.includes(value)
}

/** Returns the next `count` fire times strictly after `from`. */
export function nextRuns(cron: ParsedCron, count = 5, from = new Date()): Date[] {
  if (!cron.valid) return []
  const results: Date[] = []
  const cursor = new Date(from.getTime())
  cursor.setSeconds(0, 0)
  cursor.setMinutes(cursor.getMinutes() + 1)

  const maxDays = 366 * 5
  const dayStart = new Date(cursor.getTime())
  dayStart.setHours(0, 0, 0, 0)
  const [minute, hour, dom, month, dow] = cron.fields

  for (let dayOffset = 0; dayOffset <= maxDays && results.length < count; dayOffset++) {
    const day = new Date(dayStart.getTime())
    day.setDate(day.getDate() + dayOffset)
    if (!fieldMatches(month, day.getMonth() + 1)) continue

    const domOk = !dom.wildcard ? fieldMatches(dom, day.getDate()) : null
    const dowOk = !dow.wildcard ? fieldMatches(dow, day.getDay()) : null
    const dayOk =
      domOk === null && dowOk === null
        ? true
        : domOk === null
          ? (dowOk as boolean)
          : dowOk === null
            ? domOk
            : domOk || dowOk
    if (!dayOk) continue

    for (const h of hour.values) {
      for (const m of minute.values) {
        const candidate = new Date(day.getTime())
        candidate.setHours(h, m, 0, 0)
        if (candidate.getTime() <= from.getTime()) continue
        results.push(candidate)
        if (results.length >= count) break
      }
      if (results.length >= count) break
    }
  }
  return results
}

export const CRON_PRESETS: { expr: string; label: string }[] = [
  { expr: '*/5 * * * *', label: 'Every 5 minutes' },
  { expr: '0 * * * *', label: 'Hourly' },
  { expr: '30 9 * * 1-5', label: 'Weekdays 09:30' },
  { expr: '0 0 1 * *', label: 'Monthly' },
]
