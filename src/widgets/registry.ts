import type { ComponentType } from 'react'
import type { Locale } from '@shared/types.ts'
import VramCalcWidget from './vram-calc/index.tsx'

/** Props every embeddable widget receives from the host. */
export interface WidgetProps {
  locale: Locale
  /** Initial parameter values, typically passed by an AI agent via query string or tool input. */
  initial: Record<string, unknown>
}

export type WidgetComponent = ComponentType<WidgetProps>

/**
 * Maps a tool id to its interactive component. Widgets are intentionally
 * framework-local so the same component renders both on the site (`/tools/:id`)
 * and inside the MCP sandbox iframe (`/embed/:id`).
 */
export const WIDGETS: Record<string, WidgetComponent> = {
  'vram-calc': VramCalcWidget,
}

export function getWidget(id: string): WidgetComponent | undefined {
  return WIDGETS[id]
}
