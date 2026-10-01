import { describe, expect, it } from 'vitest'
import {
  analyzeColor,
  contrastRatio,
  parseColor,
  rgbToHex,
  rgbToHsl,
  scaleColor,
} from '../shared/calc/color.ts'

describe('parseColor', () => {
  it('parses hex forms', () => {
    expect(parseColor('#6366f1')).toEqual({ r: 99, g: 102, b: 241 })
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseColor('6366f1')).toEqual({ r: 99, g: 102, b: 241 })
  })

  it('parses rgb() and hsl()', () => {
    expect(parseColor('rgb(99,102,241)')).toEqual({ r: 99, g: 102, b: 241 })
    const hsl = parseColor('hsl(239,84%,67%)')
    expect(hsl).toBeTruthy()
    expect(hsl!.r).toBeGreaterThan(80)
  })

  it('rejects nonsense', () => {
    expect(parseColor('hello')).toBeNull()
    expect(parseColor('')).toBeNull()
  })
})

describe('conversions', () => {
  it('round-trips hex', () => {
    expect(rgbToHex({ r: 99, g: 102, b: 241 })).toBe('#6366f1')
  })
  it('converts to hsl', () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 })
    expect(hsl).toEqual({ h: 0, s: 100, l: 50 })
  })
})

describe('contrast', () => {
  it('is 21:1 for black on white', () => {
    const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })
    expect(Math.round(ratio)).toBe(21)
  })
  it('is ~1:1 for identical colors', () => {
    expect(contrastRatio({ r: 10, g: 20, b: 30 }, { r: 10, g: 20, b: 30 })).toBeCloseTo(1, 5)
  })
})

describe('analyzeColor', () => {
  it('returns wcag flags and best text color', () => {
    const white = analyzeColor('#ffffff')
    expect(white.aaBlack).toBe(true)
    expect(white.aaWhite).toBe(false)
    expect(white.bestTextColor).toBe('black')
    const black = analyzeColor('#000000')
    expect(black.bestTextColor).toBe('white')
    expect(black.aaWhite).toBe(true)
  })

  it('flags invalid input', () => {
    expect(analyzeColor('nope').valid).toBe(false)
  })
})

describe('scaleColor', () => {
  it('produces a tint/shade scale centered on the base', () => {
    const scale = scaleColor({ r: 99, g: 102, b: 241 }, 4)
    expect(scale).toHaveLength(9)
    expect(scale[4]).toEqual({ label: 'base', hex: '#6366f1' })
  })
})
