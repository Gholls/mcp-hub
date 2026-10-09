import { hslToRgb, parseColor, rgbToHex, rgbToHsl } from './color.ts'

/** Generates a harmonious 5-color palette from a base color. */
export function paletteFrom(baseHex: string): string[] {
  const rgb = parseColor(baseHex) ?? { r: 99, g: 102, b: 241 }
  const base = rgbToHsl(rgb)
  const rotations = [0, 30, 60, 180, 210]
  return rotations.map((rot, i) => {
    const h = (base.h + rot) % 360
    const s = Math.min(100, Math.max(20, base.s + (i - 2) * 6))
    const l = Math.min(92, Math.max(12, base.l + (i - 2) * 8))
    return rgbToHex(hslToRgb({ h, s, l }))
  })
}

export function bestForeground(hex: string): '#000000' | '#ffffff' {
  const rgb = parseColor(hex)
  if (!rgb) return '#ffffff'
  const channel = (c: number) => {
    const cs = c / 255
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
  }
  const luminance = 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  return luminance > 0.4 ? '#000000' : '#ffffff'
}
