import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import WidgetHost from './components/WidgetHost.tsx'
import { I18nProvider } from './lib/i18n.tsx'
import './index.css'

const bootstrap = window.__GHOLL__

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      {bootstrap?.widgetId ? (
        <WidgetHost
          widgetId={bootstrap.widgetId}
          params={bootstrap.params}
          localeHint={bootstrap.locale}
        />
      ) : (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
    </I18nProvider>
  </StrictMode>,
)
