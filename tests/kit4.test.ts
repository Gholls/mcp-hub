import { describe, expect, it } from 'vitest'
import { allBases, bitArray } from '../shared/calc/numbase.ts'
import { determinant, multiply, parseMatrix, transpose } from '../shared/calc/matrix.ts'
import { toChineseMoney, toChineseNumber } from '../shared/calc/chinese-money.ts'
import { simulate } from '../shared/calc/colorblind.ts'

describe('bit visualizer', () => {
  it('converts bases and builds a bit array', () => {
    const bases = allBases('42', 10, [2, 16])
    expect(bases.find((b) => b.base === 2)?.value).toBe('101010')
    expect(bases.find((b) => b.base === 16)?.value).toBe('2A')
    expect(bitArray(42, 8)).toEqual([0, 0, 1, 0, 1, 0, 1, 0])
  })
})

describe('matrix', () => {
  it('parses, multiplies, transposes and takes determinants', () => {
    const a = parseMatrix('1 2\n3 4')
    const b = parseMatrix('5 6\n7 8')
    expect(multiply(a, b)).toEqual([
      [19, 22],
      [43, 50],
    ])
    expect(transpose(a)).toEqual([
      [1, 3],
      [2, 4],
    ])
    expect(determinant(a)).toBe(-2)
    expect(multiply(a, parseMatrix('1 2 3'))).toBeNull()
  })
})

describe('chinese money', () => {
  it('formats capital and plain numerals', () => {
    expect(toChineseMoney(1234.56)).toBe('壹仟贰佰叁拾肆元伍角陆分')
    expect(toChineseMoney(100)).toBe('壹佰元整')
    expect(toChineseNumber(1001)).toBe('一千零一')
  })
})

describe('color blindness', () => {
  it('returns hex variants', () => {
    expect(simulate('#e11d48', 'normal')).toBe('#e11d48')
    expect(simulate('#e11d48', 'deuteranopia')).toMatch(/^#[0-9a-f]{6}$/)
  })
})
