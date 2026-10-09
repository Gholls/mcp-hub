export interface TipSplit {
  tip: number
  grandTotal: number
  perPerson: number
  tipPerPerson: number
}

export function splitTip(total: number, tipPercent: number, people: number): TipSplit {
  const n = Math.max(1, Math.floor(people))
  const tip = (total * tipPercent) / 100
  const grandTotal = total + tip
  return {
    tip: round2(tip),
    grandTotal: round2(grandTotal),
    perPerson: round2(grandTotal / n),
    tipPerPerson: round2(tip / n),
  }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}
