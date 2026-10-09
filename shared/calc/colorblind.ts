import { parseColor, rgbToHex } from './color.ts'

export type CvdType = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'

export const CVD_TYPES: { id: CvdType; label: { en: string; zh: string } }[] = [
  { id: 'normal', label: { en: 'Normal', zh: '正常' } },
  { id: 'protanopia', label: { en: 'Protanopia', zh: '红色盲' } },
  { id: 'deuteranopia', label: { en: 'Deuteranopia', zh: '绿色盲' } },
  { id: 'tritanopia', label: { en: 'Tritanopia', zh: '蓝色盲' } },
]

const MATRICES: Record<Exclude<CvdType, 'normal'>, number[][]> = {
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758],
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525],
  ],
}

export function simulate(hex: string, type: CvdType): string {
  if (type === 'normal') return hex
  const rgb = parseColor(hex)
  if (!rgb) return hex
  const m = MATRICES[type]
  const [r, g, b] = [rgb.r, rgb.g, rgb.b]
  const out = m.map((row) => Math.min(255, Math.max(0, Math.round(row[0] * r + row[1] * g + row[2] * b))))
  return rgbToHex({ r: out[0], g: out[1], b: out[2] })
}
