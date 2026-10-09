import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { withDarkTheme, type EChartsOption } from '@shared/calc/echarts.ts'

export function useECharts(option: EChartsOption | undefined, onClick?: (params: unknown) => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const clickRef = useRef(onClick)

  useEffect(() => {
    clickRef.current = onClick
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart
    chart.on('click', (params: unknown) => clickRef.current?.(params))
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(el)
    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !option) return
    chart.setOption(withDarkTheme(option), { notMerge: true, lazyUpdate: true })
    chart.resize()
  }, [option])

  return containerRef
}
