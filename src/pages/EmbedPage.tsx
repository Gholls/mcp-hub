import { Suspense, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import WidgetHost from '../components/WidgetHost.tsx'
import { WidgetSkeleton } from '../components/ui.tsx'
import { getWidget } from '../widgets/registry.ts'

export default function EmbedPage() {
  const { widgetId = '' } = useParams()
  const [search] = useSearchParams()
  const Widget = getWidget(widgetId)

  const params = useMemo(() => {
    const entries: Record<string, unknown> = {}
    search.forEach((value, key) => {
      entries[key] = value
    })
    return entries
  }, [search])

  if (!Widget) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-sm text-slate-400">
        Unknown widget: {widgetId}
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="p-3"><WidgetSkeleton /></div>}>
      <WidgetHost
        widgetId={widgetId}
        component={Widget}
        params={params}
        localeHint={search.get('locale') === 'zh' ? 'zh' : 'en'}
      />
    </Suspense>
  )
}
