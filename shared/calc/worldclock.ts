import type { LocalizedText } from '../types.ts'

export interface ClockZone {
  id: string
  label: LocalizedText
  tz: string
}

export const CLOCK_ZONES: ClockZone[] = [
  { id: 'utc', label: { en: 'UTC', zh: 'UTC' }, tz: 'UTC' },
  { id: 'la', label: { en: 'Los Angeles', zh: '洛杉矶' }, tz: 'America/Los_Angeles' },
  { id: 'ny', label: { en: 'New York', zh: '纽约' }, tz: 'America/New_York' },
  { id: 'london', label: { en: 'London', zh: '伦敦' }, tz: 'Europe/London' },
  { id: 'paris', label: { en: 'Paris', zh: '巴黎' }, tz: 'Europe/Paris' },
  { id: 'dubai', label: { en: 'Dubai', zh: '迪拜' }, tz: 'Asia/Dubai' },
  { id: 'shanghai', label: { en: 'Shanghai', zh: '上海' }, tz: 'Asia/Shanghai' },
  { id: 'tokyo', label: { en: 'Tokyo', zh: '东京' }, tz: 'Asia/Tokyo' },
  { id: 'sydney', label: { en: 'Sydney', zh: '悉尼' }, tz: 'Australia/Sydney' },
]

export interface ZoneTime {
  time: string
  date: string
  hour: number
  isDay: boolean
}

export function timeInZone(tz: string, now = Date.now()): ZoneTime {
  const date = new Date(now)
  let time = '—'
  let day = '—'
  let hour = 0
  try {
    time = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
    day = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', day: '2-digit', month: 'short' }).format(date)
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).formatToParts(date)
    hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  } catch {
    /* invalid zone */
  }
  return { time, date: day, hour, isDay: hour >= 6 && hour < 18 }
}
