export interface BandColor {
  id: string
  label: { en: string; zh: string }
  hex: string
  digit?: number
  multiplier?: number
  tolerance?: number
}

export const BAND_COLORS: BandColor[] = [
  { id: 'black', label: { en: 'Black', zh: '黑' }, hex: '#111827', digit: 0, multiplier: 1 },
  { id: 'brown', label: { en: 'Brown', zh: '棕' }, hex: '#7c4a1e', digit: 1, multiplier: 10, tolerance: 1 },
  { id: 'red', label: { en: 'Red', zh: '红' }, hex: '#dc2626', digit: 2, multiplier: 100, tolerance: 2 },
  { id: 'orange', label: { en: 'Orange', zh: '橙' }, hex: '#f97316', digit: 3, multiplier: 1000 },
  { id: 'yellow', label: { en: 'Yellow', zh: '黄' }, hex: '#facc15', digit: 4, multiplier: 10000 },
  { id: 'green', label: { en: 'Green', zh: '绿' }, hex: '#16a34a', digit: 5, multiplier: 100000, tolerance: 0.5 },
  { id: 'blue', label: { en: 'Blue', zh: '蓝' }, hex: '#2563eb', digit: 6, multiplier: 1000000, tolerance: 0.25 },
  { id: 'violet', label: { en: 'Violet', zh: '紫' }, hex: '#7c3aed', digit: 7, multiplier: 10000000, tolerance: 0.1 },
  { id: 'gray', label: { en: 'Gray', zh: '灰' }, hex: '#9ca3af', digit: 8, multiplier: 100000000, tolerance: 0.05 },
  { id: 'white', label: { en: 'White', zh: '白' }, hex: '#e5e7eb', digit: 9, multiplier: 1000000000 },
  { id: 'gold', label: { en: 'Gold', zh: '金' }, hex: '#d4af37', tolerance: 5 },
  { id: 'silver', label: { en: 'Silver', zh: '银' }, hex: '#cbd5e1', tolerance: 10 },
]

export function colorById(id: string): BandColor | undefined {
  return BAND_COLORS.find((c) => c.id === id)
}

export interface ResistorResult {
  ohms: number
  formatted: string
  tolerance?: number
}

/** 4-band resistor: digit, digit, multiplier, tolerance. */
export function decodeResistor(bands: string[]): ResistorResult | null {
  if (bands.length < 3) return null
  const [b1, b2, b3, b4] = bands.map(colorById)
  if (!b1 || !b2 || !b3 || b1.digit === undefined || b2.digit === undefined || b3.multiplier === undefined) return null
  const ohms = (b1.digit * 10 + b2.digit) * b3.multiplier
  return { ohms, formatted: formatOhms(ohms), tolerance: b4?.tolerance }
}

export function formatOhms(ohms: number): string {
  if (ohms >= 1e9) return `${round(ohms / 1e9)} GΩ`
  if (ohms >= 1e6) return `${round(ohms / 1e6)} MΩ`
  if (ohms >= 1e3) return `${round(ohms / 1e3)} kΩ`
  return `${round(ohms)} Ω`
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
