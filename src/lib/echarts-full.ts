import { use as registerModules } from 'echarts/core'
import { FunnelChart, GaugeChart, PieChart, RadarChart, SankeyChart } from 'echarts/charts'
import { AxisPointerComponent, RadarComponent, ToolboxComponent } from 'echarts/components'
import './echarts-slim.ts'

/**
 * Chart surface for the generic `echarts` widget, which renders agent-authored
 * options and therefore needs every type advertised by ECHARTS_OPTION_GUIDE.
 * Importing this module registers the slim cartesian core as a side effect.
 */
registerModules([
  PieChart,
  RadarChart,
  SankeyChart,
  FunnelChart,
  GaugeChart,
  RadarComponent,
  ToolboxComponent,
  AxisPointerComponent,
])

export { init } from './echarts-slim.ts'
export type { ECharts } from './echarts-slim.ts'
