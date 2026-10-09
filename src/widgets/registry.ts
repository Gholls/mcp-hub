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
}

export function getWidget(id: string): WidgetComponent | undefined {
  return WIDGETS[id]
}
