export interface DateDiff {
  days: number
  weeks: number
  months: number
  years: number
  breakdown: { years: number; months: number; days: number }
  totalDays: number
}

export function diffDates(fromISO: string, toISO: string): DateDiff | null {
  const from = new Date(fromISO)
  const to = new Date(toISO)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null
  const start = from <= to ? from : to
  const end = from <= to ? to : from
  const ms = end.getTime() - start.getTime()
  const totalDays = Math.floor(ms / 86400000)

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return {
    days: totalDays,
    weeks: Math.floor(totalDays / 7),
    months: years * 12 + months,
    years,
    breakdown: { years, months, days },
    totalDays,
  }
}

export function addToDate(iso: string, days: number, months = 0, years = 0): Date | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  result.setMonth(result.getMonth() + months)
  result.setDate(result.getDate() + days)
  return result
}

export function ageFrom(birthISO: string, now = new Date()): number | null {
  const birth = new Date(birthISO)
  if (Number.isNaN(birth.getTime()) || birth > now) return null
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
}

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}
