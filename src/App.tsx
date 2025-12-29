import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout } from './components/Layout'
import { LanguageRouter } from './components/LanguageRouter'
import { Home } from './pages/Home'
import { RemoveFakeTransparency } from './pages/RemoveFakeTransparency'
import { Compress } from './pages/Compress'
import { Resize } from './pages/Resize'
import './App.css'

// Redirect component that handles initial language detection
function LanguageRedirectHome() {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'en'
  return <Navigate to={`/${lang}`} replace />
}

function LanguageRedirectPage({ page }: { page: string }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'en'
  return <Navigate to={`/${lang}/${page}`} replace />
}

// Wrapper that syncs URL lang param with i18n
function LangRoutes() {
  return (
    <Routes>
      {/* Root redirects to detected language */}
      <Route path="/" element={<LanguageRedirectHome />} />

      {/* Legacy routes without language prefix - redirect */}
      <Route path="/remove-fake-transparency" element={<LanguageRedirectPage page="remove-fake-transparency" />} />
      <Route path="/compress" element={<LanguageRedirectPage page="compress" />} />
      <Route path="/resize" element={<LanguageRedirectPage page="resize" />} />

      {/* Language-prefixed routes */}
      <Route path="/:lang" element={<LanguageRouter><Home /></LanguageRouter>} />
      <Route path="/:lang/remove-fake-transparency" element={<LanguageRouter><RemoveFakeTransparency /></LanguageRouter>} />
      <Route path="/:lang/compress" element={<LanguageRouter><Compress /></LanguageRouter>} />
      <Route path="/:lang/resize" element={<LanguageRouter><Resize /></LanguageRouter>} />

      {/* Catch-all redirect */}
      <Route path="*" element={<LanguageRedirectHome />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <LangRoutes />
      </Layout>
    </BrowserRouter>
  )
}

export default App
