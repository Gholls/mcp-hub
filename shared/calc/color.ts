export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  h: number
  s: number
  l: number
}

export interface ColorInfo {
  valid: boolean
  error?: string
  hex?: string
  rgb?: Rgb
  hsl?: Hsl
  luminance?: number
  contrastWhite?: number
  contrastBlack?: number
  aaWhite?: boolean
  aaaWhite?: boolean
  aaBlack?: boolean
  aaaBlack?: boolean
  bestTextColor?: 'black' | 'white'
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function clampByte(value: number): number {
  return Math.round(clamp(value, 0, 255))
}

function parseHex(input: string): Rgb | null {
  const hex = input.replace(/^#/, '')
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null
  if (hex.length === 3 || hex.length === 4) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    }
  }
  if (hex.length === 6 || hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    }
  }
  return null
}

function parseRgbFn(input: string): Rgb | null {
  const match = /^rgba?\(([^)]+)\)$/i.exec(input.trim())
  if (!match) return null
  const parts = match[1].split(/[,/\s]+/).filter(Boolean).map(Number)
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null
  return { r: clampByte(parts[0]), g: clampByte(parts[1]), b: clampByte(parts[2]) }
}

function parseHslFn(input: string): Rgb | null {
  const match = /^hsla?\(([^)]+)\)$/i.exec(input.trim())
  if (!match) return null
  const parts = match[1].split(/[,/\s]+/).filter(Boolean)
  if (parts.length < 3) return null
  const h = Number(parts[0].replace('deg', ''))
  const s = Number(parts[1].replace('%', ''))
  const l = Number(parts[2].replace('%', ''))
  if ([h, s, l].some((n) => Number.isNaN(n))) return null
  return hslToRgb({ h, s, l })
}

export function parseColor(input: string): Rgb | null {
  const value = input.trim()
  if (!value) return null
  if (value.startsWith('#')) return parseHex(value)
  if (/^rgba?\(/i.test(value)) return parseRgbFn(value)
  if (/^hsla?\(/i.test(value)) return parseHslFn(value)
  if (/^[0-9a-fA-F]{3,8}$/.test(value)) return parseHex(value)
  return null
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((c) => clampByte(c).toString(16).padStart(2, '0')).join('')}`
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
        break
      case gn:
        h = ((bn - rn) / d + 2) * 60
        break
      default:
        h = ((rn - gn) / d + 4) * 60
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = ((h % 360) + 360) % 360 / 360
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100
  if (sn === 0) {
    const v = Math.round(ln * 255)
    return { r: v, g: v, b: v }
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tn = t
    if (tn < 0) tn += 1
    if (tn > 1) tn -= 1
    if (tn < 1 / 6) return p + (q - p) * 6 * tn
    if (tn < 1 / 2) return q
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6
    return p
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  }
}

/** WCAG relative luminance. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (c: number) => {
    const cs = c / 255
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

export function analyzeColor(input: string): ColorInfo {
  const rgb = parseColor(input)
  if (!rgb) return { valid: false, error: `Could not parse color: "${input}"` }

  const white = contrastRatio(rgb, { r: 255, g: 255, b: 255 })
  const black = contrastRatio(rgb, { r: 0, g: 0, b: 0 })
  const round = (n: number) => Math.round(n * 100) / 100

  return {
    valid: true,
    hex: rgbToHex(rgb),
    rgb,
    hsl: rgbToHsl(rgb),
    luminance: Math.round(relativeLuminance(rgb) * 1000) / 1000,
    contrastWhite: round(white),
    contrastBlack: round(black),
    aaWhite: white >= 4.5,
    aaaWhite: white >= 7,
    aaBlack: black >= 4.5,
    aaaBlack: black >= 7,
    bestTextColor: white >= black ? 'white' : 'black',
  }
}

/** Generates a tint/shade scale by mixing toward white and black. */
export function scaleColor(rgb: Rgb, steps = 5): { label: string; hex: string }[] {
  const mix = (target: Rgb, amount: number): Rgb => ({
    r: Math.round(rgb.r + (target.r - rgb.r) * amount),
    g: Math.round(rgb.g + (target.g - rgb.g) * amount),
    b: Math.round(rgb.b + (target.b - rgb.b) * amount),
  })
  const result: { label: string; hex: string }[] = []
  for (let i = steps; i >= 1; i--) {
    const amount = i / (steps + 1)
    result.push({ label: `+${Math.round(amount * 100)}%`, hex: rgbToHex(mix({ r: 255, g: 255, b: 255 }, amount)) })
  }
  result.push({ label: 'base', hex: rgbToHex(rgb) })
  for (let i = 1; i <= steps; i++) {
    const amount = i / (steps + 1)
    result.push({ label: `-${Math.round(amount * 100)}%`, hex: rgbToHex(mix({ r: 0, g: 0, b: 0 }, amount)) })
  }
  return result
}
