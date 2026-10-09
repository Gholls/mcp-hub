export interface LoanRow {
  month: number
  principal: number
  interest: number
  balance: number
}

export interface LoanResult {
  monthly: number
  totalPaid: number
  totalInterest: number
  schedule: LoanRow[]
}

export function loan(principal: number, annualRatePercent: number, months: number): LoanResult {
  const n = Math.max(1, Math.round(months))
  const monthlyRate = annualRatePercent / 100 / 12
  const monthly =
    monthlyRate === 0
      ? principal / n
      : (principal * monthlyRate * (1 + monthlyRate) ** n) / ((1 + monthlyRate) ** n - 1)

  const schedule: LoanRow[] = []
  let balance = principal
  let totalInterest = 0
  for (let m = 1; m <= n; m++) {
    const interest = balance * monthlyRate
    const principalPart = monthly - interest
    balance = Math.max(0, balance - principalPart)
    totalInterest += interest
    schedule.push({ month: m, principal: principalPart, interest, balance })
  }
  return {
    monthly: round2(monthly),
    totalPaid: round2(principal + totalInterest),
    totalInterest: round2(totalInterest),
    schedule,
  }
}

export function compound(
  principal: number,
  annualRatePercent: number,
  years: number,
  compoundsPerYear = 12,
): { year: number; value: number }[] {
  const periods = Math.max(1, Math.round(compoundsPerYear))
  const rate = annualRatePercent / 100 / periods
  const out: { year: number; value: number }[] = [{ year: 0, value: round2(principal) }]
  let value = principal
  for (let y = 1; y <= years; y++) {
    for (let p = 0; p < periods; p++) value *= 1 + rate
    out.push({ year: y, value: round2(value) })
  }
  return out
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}
