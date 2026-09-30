import { useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import type { Locale } from '@shared/types.ts'
import { getWidget } from '../widgets/registry.ts'

export default function EmbedPage() {
  const { widgetId = '' } = useParams()
  const [search] = useSearchParams()
  const Widget = getWidget(widgetId)

  const locale = (search.get('locale') === 'zh' ? 'zh' : 'en') as Locale

  const initial = useMemo(() => {
    const entries: Record<string, string> = {}
    search.forEach((value, key) => {
      entries[key] = value
    })
    return entries
  }, [search])

  useEffect(() => {
    document.documentElement.lang = locale
    document.body.dataset.embed = 'true'
    return () => {
      delete document.body.dataset.embed
    }
  }, [locale])

  if (!Widget) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-sm text-slate-400">
        Unknown widget: {widgetId}
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3">
      <Widget locale={locale} initial={initial} />
    </div>
  )
}
