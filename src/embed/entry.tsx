import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Replaced per widget by `scripts/build-embeds.mjs` (Vite alias) so each bundle
// only contains the widget it needs.
import Widget from 'virtual:gholl-widget'
import WidgetHost from '../components/WidgetHost.tsx'
import { I18nProvider } from '../lib/i18n.tsx'
import '../index.css'

const widgetId = __GHOLL_WIDGET_ID__

const params: Record<string, unknown> = {}
new URLSearchParams(window.location.search).forEach((value, key) => {
  params[key] = value
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <WidgetHost
        widgetId={widgetId}
        component={Widget}
        params={params}
        localeHint={params.locale === 'zh' ? 'zh' : 'en'}
      />
    </I18nProvider>
  </StrictMode>,
)
