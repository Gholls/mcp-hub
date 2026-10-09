import { describe, expect, it } from 'vitest'
import { buildBorderRadius, buildBoxShadow, buildGradient } from '../shared/calc/design.ts'

describe('gradient', () => {
  it('builds linear and radial gradients', () => {
    expect(buildGradient(135, '#6366f1', '#22d3ee')).toBe('linear-gradient(135deg, #6366f1, #22d3ee)')
    expect(buildGradient(0, '#000', '#fff', 'radial')).toBe('radial-gradient(circle, #000, #fff)')
  })
})

describe('box shadow', () => {
  it('builds a shadow with and without inset', () => {
    expect(buildBoxShadow({ x: 0, y: 12, blur: 24, spread: -6, color: '#00000055', inset: false })).toBe('0px 12px 24px -6px #00000055')
    expect(buildBoxShadow({ x: 0, y: 0, blur: 4, spread: 0, color: '#000', inset: true })).toBe('inset 0px 0px 4px 0px #000')
  })
})

describe('border radius', () => {
  it('builds four-corner radius', () => {
    expect(buildBorderRadius(1, 2, 3, 4)).toBe('1px 2px 3px 4px')
  })
})
