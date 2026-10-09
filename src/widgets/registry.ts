import { lazy } from 'react'
import type { ComponentType } from 'react'
import type { Locale } from '@shared/types.ts'

/** Props every embeddable widget receives from the host. */
export interface WidgetProps {
  locale: Locale
  /** Initial parameter values, typically passed by an AI agent via query string or tool input. */
  initial: Record<string, unknown>
}

export type WidgetComponent = ComponentType<WidgetProps>

/**
 * Lazily-loaded widget components, keyed by tool id. Each `import()` becomes its
 * own chunk, so the home gallery never downloads widget code it isn't showing.
 * The per-widget embed bundles inject `virtual:gholl-widget` instead.
 */
export const WIDGETS: Record<string, WidgetComponent> = {
  'vram-calc': lazy(() => import('./vram-calc/index.tsx')),
  'cron-debugger': lazy(() => import('./cron-debugger/index.tsx')),
  'schema-viewer': lazy(() => import('./schema-viewer/index.tsx')),
  'api-uptime': lazy(() => import('./api-uptime/index.tsx')),
  'chrono-energy': lazy(() => import('./chrono-energy/index.tsx')),
  'jwt-decoder': lazy(() => import('./jwt-decoder/index.tsx')),
  'hash-generator': lazy(() => import('./hash-generator/index.tsx')),
  'color-studio': lazy(() => import('./color-studio/index.tsx')),
  gomoku: lazy(() => import('./gomoku/index.tsx')),
  echarts: lazy(() => import('./echarts/index.tsx')),
  'function-grapher': lazy(() => import('./function-grapher/index.tsx')),
  'trig-lab': lazy(() => import('./trig-lab/index.tsx')),
  'geometry-lab': lazy(() => import('./geometry-lab/index.tsx')),
  'conic-sections': lazy(() => import('./conic-sections/index.tsx')),
  'json-formatter': lazy(() => import('./json-formatter/index.tsx')),
  'unit-converter': lazy(() => import('./unit-converter/index.tsx')),
  'gradient-generator': lazy(() => import('./gradient-generator/index.tsx')),
  'box-shadow': lazy(() => import('./box-shadow/index.tsx')),
  'border-radius': lazy(() => import('./border-radius/index.tsx')),
  'bmi-calculator': lazy(() => import('./bmi-calculator/index.tsx')),
  'http-status': lazy(() => import('./http-status/index.tsx')),
  'dice-roller': lazy(() => import('./dice-roller/index.tsx')),
  'world-clock': lazy(() => import('./world-clock/index.tsx')),
  'coin-flip': lazy(() => import('./coin-flip/index.tsx')),
  'tip-split': lazy(() => import('./tip-split/index.tsx')),
  statistics: lazy(() => import('./statistics/index.tsx')),
  'prime-factor': lazy(() => import('./prime-factor/index.tsx')),
  'color-palette': lazy(() => import('./color-palette/index.tsx')),
  'bit-visualizer': lazy(() => import('./bit-visualizer/index.tsx')),
  'matrix-calculator': lazy(() => import('./matrix-calculator/index.tsx')),
  'chinese-money': lazy(() => import('./chinese-money/index.tsx')),
  'color-blindness': lazy(() => import('./color-blindness/index.tsx')),
  'random-picker': lazy(() => import('./random-picker/index.tsx')),
  'qr-generator': lazy(() => import('./qr-generator/index.tsx')),
}

export function getWidget(id: string): WidgetComponent | undefined {
  return WIDGETS[id]
}
