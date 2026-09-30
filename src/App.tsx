import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Home from './pages/Home.tsx'
import ToolPage from './pages/ToolPage.tsx'
import EmbedPage from './pages/EmbedPage.tsx'
import NotFound from './pages/NotFound.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/embed/:widgetId" element={<EmbedPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tools/:widgetId" element={<ToolPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
