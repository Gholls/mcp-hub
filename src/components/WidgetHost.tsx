import { useEffect, useMemo } from 'react'
import type { Locale } from '@shared/types.ts'
import { McpBridgeContext, useMcpApp } from '../lib/mcp-app.ts'
import WidgetErrorBoundary from './WidgetErrorBoundary.tsx'
import type { WidgetComponent } from '../widgets/registry.ts'

export interface WidgetHostProps {
  widgetId: string
  /** The widget to render (resolved from the registry, or inlined per-embed). */
  component: WidgetComponent
  /** Parameter values from the query string or tool input. */
  params?: Record<string, unknown>
  /** Locale supplied by the page, used until the MCP host reports one. */
  localeHint?: Locale
}

/**
 * Renders a single widget with the MCP bridge, locale and embed styling.
 *
 * Shared by the `/embed/:id` route and the per-widget single-file builds used
 * for MCP Apps UI resources. It intentionally does not import the widget
 * registry so embed bundles don't pull in every other widget.
 */
export default function WidgetHost({ widgetId, component: Widget, params, localeHint }: WidgetHostProps) {
  const bridge = useMcpApp()
  const { hostContext, toolInput } = bridge

  const inputLocale = typeof toolInput?.locale === 'string' ? toolInput.locale : undefined
  const locale: Locale = (hostContext?.locale ?? inputLocale ?? localeHint ?? 'en')
    .toLowerCase()
    .startsWith('zh')
    ? 'zh'
    : 'en'

  const initial = useMemo(
    () => ({ ...(params ?? {}), ...(toolInput ?? {}) }),
    [params, toolInput],
  )

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dataset.hostTheme = hostContext?.theme ?? 'dark'
    document.body.dataset.embed = 'true'
    return () => {
      delete document.body.dataset.embed
    }
  }, [locale, hostContext?.theme])

  return (
    <McpBridgeContext.Provider value={bridge}>
      <div className={bridge.embedded ? 'p-2' : 'min-h-screen p-3'} data-widget={widgetId}>
        <WidgetErrorBoundary>
          <Widget locale={locale} initial={initial} />
        </WidgetErrorBoundary>
      </div>
    </McpBridgeContext.Provider>
  )
}
