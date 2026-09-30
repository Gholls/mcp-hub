import { useEffect, useMemo } from 'react'
import type { Locale } from '@shared/types.ts'
import { getWidget } from '../widgets/registry.ts'
import { McpBridgeContext, useMcpApp } from '../lib/mcp-app.ts'
import WidgetErrorBoundary from './WidgetErrorBoundary.tsx'

export interface WidgetHostProps {
  widgetId: string
  /** Parameter values from the query string or an injected bootstrap. */
  params?: Record<string, unknown>
  /** Locale supplied by the host/injection, used until the MCP host reports one. */
  localeHint?: Locale
}

/**
 * Renders a single widget with the MCP bridge, locale and embed styling.
 *
 * Shared by the `/embed/:id` route (humans / iframes) and the standalone
 * bootstrap used when the widget HTML is inlined into an MCP Apps resource.
 */
export default function WidgetHost({ widgetId, params, localeHint }: WidgetHostProps) {
  const Widget = getWidget(widgetId)
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

  if (!Widget) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-sm text-slate-400">
        Unknown widget: {widgetId}
      </div>
    )
  }

  return (
    <McpBridgeContext.Provider value={bridge}>
      <div className={bridge.embedded ? 'p-2' : 'min-h-screen p-3'}>
        <WidgetErrorBoundary>
          <Widget locale={locale} initial={initial} />
        </WidgetErrorBoundary>
      </div>
    </McpBridgeContext.Provider>
  )
}
