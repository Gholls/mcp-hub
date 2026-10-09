import { describe, expect, it } from 'vitest'
import {
  circleMeasures,
  classifyQuadrilateral,
  polygonArea,
  polygonPerimeter,
  triangleMeasures,
} from '../shared/calc/geometry.ts'

describe('triangleMeasures', () => {
  it('measures a 3-4-5 right triangle', () => {
    const m = triangleMeasures([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 4 }])
    expect(m.sides[0]).toBeCloseTo(5, 6)
    expect(m.sides[1]).toBeCloseTo(4, 6)
    expect(m.sides[2]).toBeCloseTo(3, 6)
    expect(m.isRight).toBe(true)
    expect(m.area).toBeCloseTo(6, 6)
    expect(m.perimeter).toBeCloseTo(12, 6)
    expect(m.angles.reduce((a, b) => a + b, 0)).toBeCloseTo(180, 3)
  })

  it('detects equilateral triangles', () => {
    const m = triangleMeasures([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: 3.4641 }])
    expect(m.isEquilateral).toBe(true)
    expect(m.isRight).toBe(false)
  })
})

describe('quadrilaterals', () => {
  it('classifies square, rectangle and parallelogram', () => {
    expect(classifyQuadrilateral([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }])).toBe('square')
    expect(classifyQuadrilateral([{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 4 }, { x: 0, y: 4 }])).toBe('rectangle')
    expect(classifyQuadrilateral([{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 8, y: 4 }, { x: 2, y: 4 }])).toBe('parallelogram')
  })

  it('computes area and perimeter', () => {
    const square = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]
    expect(polygonArea(square)).toBeCloseTo(16, 6)
    expect(polygonPerimeter(square)).toBeCloseTo(16, 6)
  })
})

describe('circleMeasures', () => {
  it('computes diameter, circumference and area', () => {
    const m = circleMeasures(3)
    expect(m.diameter).toBe(6)
    expect(m.circumference).toBeCloseTo(2 * Math.PI * 3, 6)
    expect(m.area).toBeCloseTo(Math.PI * 9, 6)
  })
})
