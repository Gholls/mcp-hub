export interface TimestampInfo {
  valid: boolean
  error?: string
  ms: number
  seconds: number
  iso: string
  utc: string
  local: string
  relative: string
}

export function formatInZone(ms: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'medium',
      hour12: false,
    }).format(new Date(ms))
  } catch {
    return new Date(ms).toString()
  }
}

function relative(ms: number, now: number): string {
  const diff = Math.round((ms - now) / 1000)
  const abs = Math.abs(diff)
  const unit = abs < 60 ? ['second', 1] : abs < 3600 ? ['minute', 60] : abs < 86400 ? ['hour', 3600] : ['day', 86400]
  const value = Math.round(diff / (unit[1] as number))
  try {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(value, unit[0] as Intl.RelativeTimeFormatUnit)
  } catch {
    return `${diff}s`
  }
}

export function parseTimestamp(input: string, now = Date.now()): TimestampInfo {
  const raw = input.trim()
  let ms: number
  if (/^-?\d+$/.test(raw)) {
    const n = Number(raw)
    ms = Math.abs(n) < 1e12 ? n * 1000 : n
  } else {
    const parsed = Date.parse(raw)
    if (Number.isNaN(parsed)) {
      return { valid: false, error: 'Unrecognized date/time', ms: 0, seconds: 0, iso: '', utc: '', local: '', relative: '' }
    }
    ms = parsed
  }
  return {
    valid: true,
    ms,
    seconds: Math.floor(ms / 1000),
    iso: new Date(ms).toISOString(),
    utc: new Date(ms).toUTCString(),
    local: new Date(ms).toLocaleString(),
    relative: relative(ms, now),
  }
}
