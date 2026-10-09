import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Home from './pages/Home.tsx'

const ToolPage = lazy(() => import('./pages/ToolPage.tsx'))
const EmbedPage = lazy(() => import('./pages/EmbedPage.tsx'))
const CategoryPage = lazy(() => import('./pages/CategoryPage.tsx'))
const NotFound = lazy(() => import('./pages/NotFound.tsx'))

function RouteFallback() {
  return <div className="min-h-[60vh]" aria-hidden />
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/embed/:widgetId" element={<EmbedPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tools/:widgetId" element={<ToolPage />} />
          <Route path="/:categorySlug" element={<CategoryPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
