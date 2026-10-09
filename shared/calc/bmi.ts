export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  if (m <= 0) return NaN
  return weightKg / (m * m)
}

export interface BmiCategory {
  key: string
  en: string
  zh: string
  color: string
}

export function bmiCategory(value: number): BmiCategory {
  if (!Number.isFinite(value)) return { key: 'invalid', en: 'Invalid', zh: '无效', color: '#64748b' }
  if (value < 18.5) return { key: 'under', en: 'Underweight', zh: '偏瘦', color: '#38bdf8' }
  if (value < 24) return { key: 'normal', en: 'Normal', zh: '正常', color: '#22c55e' }
  if (value < 28) return { key: 'over', en: 'Overweight', zh: '超重', color: '#f59e0b' }
  return { key: 'obese', en: 'Obese', zh: '肥胖', color: '#ef4444' }
}
