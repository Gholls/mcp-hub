import { describe, expect, it } from 'vitest'
import {
  ECHARTS_DEFAULT_OPTION,
  ECHARTS_OPTION_GUIDE,
  parseOption,
  summarizeOption,
  withDarkTheme,
} from '../shared/calc/echarts.ts'

describe('ECHARTS_OPTION_GUIDE', () => {
  it('covers the common chart types', () => {
    for (const type of ['line', 'bar', 'pie', 'radar', 'scatter', 'sankey', 'funnel', 'gauge']) {
      expect(ECHARTS_OPTION_GUIDE).toContain(type)
    }
  })
  it('the default option is a valid line chart', () => {
    const summary = summarizeOption(ECHARTS_DEFAULT_OPTION)
    expect(summary.chartTypes).toEqual(['line'])
    expect(summary.points).toBe(5)
  })
})

describe('parseOption', () => {
  it('accepts an object as-is', () => {
    const option = { series: [{ type: 'bar', data: [1, 2] }] }
    expect(parseOption(option).option).toBe(option)
  })
  it('parses a JSON string', () => {
    const result = parseOption('{"series":[{"type":"line","data":[1]}]}')
    expect(result.option).toEqual({ series: [{ type: 'line', data: [1] }] })
  })
  it('rejects empty, non-object and malformed input', () => {
    expect(parseOption(undefined).error).toBeTruthy()
    expect(parseOption('').error).toBeTruthy()
    expect(parseOption('[1,2]').error).toBeTruthy()
    expect(parseOption('{bad').error).toBeTruthy()
    expect(parseOption(42).error).toBeTruthy()
  })
})

describe('summarizeOption', () => {
  it('reports chart types, series and points', () => {
    const summary = summarizeOption({
      title: { text: 'Revenue' },
      series: [
        { type: 'bar', data: [1, 2, 3] },
        { type: 'line', data: [4, 5] },
      ],
    })
    expect(summary.chartTypes).toEqual(['bar', 'line'])
    expect(summary.seriesCount).toBe(2)
    expect(summary.points).toBe(5)
    expect(summary.title).toBe('Revenue')
  })

  it('falls back to xAxis categories and counts sankey nodes', () => {
    expect(summarizeOption({ xAxis: { data: ['a', 'b', 'c'] }, series: [] }).points).toBe(3)
    expect(summarizeOption({ series: [{ type: 'sankey', nodes: [{}, {}], links: [] }] }).points).toBe(2)
  })
})

describe('withDarkTheme', () => {
  it('fills dark defaults without mutating the input', () => {
    const input = { series: [{ type: 'line', data: [1] }], xAxis: { type: 'category' } }
    const themed = withDarkTheme(input)
    expect(themed.backgroundColor).toBe('transparent')
    expect((themed.xAxis as Record<string, unknown>).axisLabel).toMatchObject({ color: '#94a3b8' })
    // original untouched
    expect((input.xAxis as Record<string, unknown>).axisLabel).toBeUndefined()
  })

  it('keeps user-provided values', () => {
    const themed = withDarkTheme({
      xAxis: { axisLabel: { color: '#ff0000' } },
      textStyle: { color: '#00ff00' },
    })
    expect((themed.xAxis as Record<string, unknown>).axisLabel).toMatchObject({ color: '#ff0000' })
    expect(themed.textStyle).toMatchObject({ color: '#00ff00' })
  })

  it('handles arrays of axes', () => {
    const themed = withDarkTheme({
      yAxis: [{ type: 'value' }, { type: 'log' }],
    })
    const axes = themed.yAxis as Record<string, unknown>[]
    expect(axes).toHaveLength(2)
    expect(axes[0].axisLine).toBeTruthy()
    expect(axes[1].splitLine).toBeTruthy()
  })
})
