import { init, use as registerModules } from 'echarts/core'
import { BarChart, LineChart, ScatterChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

/**
 * Tree-shaken echarts surface shared by the widgets that draw cartesian series.
 * Explicit registration (instead of `import * as echarts`) keeps the unused
 * chart types out of every chunk that renders a chart; the generic `echarts`
 * widget, which accepts arbitrary user options, widens this in
 * `./echarts-full.ts`. The set must stay in sync with SUPPORTED_ECHARTS_TYPES.
 */
registerModules([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
])

export { init }
export type { ECharts } from 'echarts/core'
