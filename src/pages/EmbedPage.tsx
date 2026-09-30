import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import WidgetHost from '../components/WidgetHost.tsx'

export default function EmbedPage() {
  const { widgetId = '' } = useParams()
  const [search] = useSearchParams()

  const params = useMemo(() => {
    const entries: Record<string, unknown> = {}
    search.forEach((value, key) => {
      entries[key] = value
    })
    return entries
  }, [search])

  const localeHint = search.get('locale') === 'zh' ? 'zh' : 'en'

  return <WidgetHost widgetId={widgetId} params={params} localeHint={localeHint} />
}
