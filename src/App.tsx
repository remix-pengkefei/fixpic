import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout } from './components/Layout'
import { LanguageRouter } from './components/LanguageRouter'
import './App.css'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const RemoveFakeTransparency = lazy(() => import('./pages/RemoveFakeTransparency').then(m => ({ default: m.RemoveFakeTransparency })))
const Compress = lazy(() => import('./pages/Compress').then(m => ({ default: m.Compress })))
const Resize = lazy(() => import('./pages/Resize').then(m => ({ default: m.Resize })))

// Guide pages for long-tail SEO
const RemoveAICheckerboard = lazy(() => import('./pages/guides/RemoveAICheckerboard').then(m => ({ default: m.RemoveAICheckerboard })))
const CompressWithoutQualityLoss = lazy(() => import('./pages/guides/CompressWithoutQualityLoss').then(m => ({ default: m.CompressWithoutQualityLoss })))
const ConvertToWebP = lazy(() => import('./pages/guides/ConvertToWebP').then(m => ({ default: m.ConvertToWebP })))
const BatchCompress = lazy(() => import('./pages/guides/BatchCompress').then(m => ({ default: m.BatchCompress })))
const MidjourneyTransparent = lazy(() => import('./pages/guides/MidjourneyTransparent').then(m => ({ default: m.MidjourneyTransparent })))

// 404 page
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="loader-spinner"></div>
    </div>
  )
}

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
    <Suspense fallback={<PageLoader />}>
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

        {/* Guide pages for long-tail SEO */}
        <Route path="/:lang/guides/remove-ai-checkerboard" element={<LanguageRouter><RemoveAICheckerboard /></LanguageRouter>} />
        <Route path="/:lang/guides/compress-without-quality-loss" element={<LanguageRouter><CompressWithoutQualityLoss /></LanguageRouter>} />
        <Route path="/:lang/guides/convert-to-webp" element={<LanguageRouter><ConvertToWebP /></LanguageRouter>} />
        <Route path="/:lang/guides/batch-compress" element={<LanguageRouter><BatchCompress /></LanguageRouter>} />
        <Route path="/:lang/guides/midjourney-transparent" element={<LanguageRouter><MidjourneyTransparent /></LanguageRouter>} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
