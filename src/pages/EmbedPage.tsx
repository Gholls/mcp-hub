import { useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import type { Locale } from '@shared/types.ts'
import { getWidget } from '../widgets/registry.ts'
import { McpBridgeContext, useMcpApp } from '../lib/mcp-app.ts'
import WidgetErrorBoundary from '../components/WidgetErrorBoundary.tsx'

export default function EmbedPage() {
  const { widgetId = '' } = useParams()
  const [search] = useSearchParams()
  const Widget = getWidget(widgetId)
  const bridge = useMcpApp()
  const { hostContext, toolInput } = bridge

  const queryLocale = search.get('locale')
  const hostLocale = hostContext?.locale
  const locale: Locale =
    (hostLocale ?? queryLocale ?? 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en'

  const initial = useMemo(() => {
    const entries: Record<string, unknown> = {}
    search.forEach((value, key) => {
      entries[key] = value
    })
    return { ...entries, ...(toolInput ?? {}) }
  }, [search, toolInput])

  useEffect(() => {
    document.documentElement.lang = locale
    document.body.dataset.embed = 'true'
    document.documentElement.dataset.hostTheme = hostContext?.theme ?? 'dark'
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
      <div className="min-h-screen p-3">
        <WidgetErrorBoundary>
          <Widget locale={locale} initial={initial} />
        </WidgetErrorBoundary>
      </div>
    </McpBridgeContext.Provider>
  )
}
