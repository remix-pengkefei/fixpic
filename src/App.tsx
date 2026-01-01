import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { LanguageRouter } from './components/LanguageRouter'
import './App.css'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const RemoveFakeTransparency = lazy(() => import('./pages/RemoveFakeTransparency').then(m => ({ default: m.RemoveFakeTransparency })))
const Compress = lazy(() => import('./pages/Compress').then(m => ({ default: m.Compress })))
const Resize = lazy(() => import('./pages/Resize').then(m => ({ default: m.Resize })))
const RemoveWatermark = lazy(() => import('./pages/RemoveWatermark').then(m => ({ default: m.RemoveWatermark })))
const ChangeBackground = lazy(() => import('./pages/ChangeBackground').then(m => ({ default: m.ChangeBackground })))

// AI Tools (Pixelbin)
const ImageUpscaler = lazy(() => import('./pages/ImageUpscaler').then(m => ({ default: m.ImageUpscaler })))
const WatermarkRemover = lazy(() => import('./pages/WatermarkRemover').then(m => ({ default: m.WatermarkRemover })))
const BackgroundGenerator = lazy(() => import('./pages/BackgroundGenerator').then(m => ({ default: m.BackgroundGenerator })))
const ImageSharpener = lazy(() => import('./pages/ImageSharpener').then(m => ({ default: m.ImageSharpener })))
const ImageDenoiser = lazy(() => import('./pages/ImageDenoiser').then(m => ({ default: m.ImageDenoiser })))
const ShadowGenerator = lazy(() => import('./pages/ShadowGenerator').then(m => ({ default: m.ShadowGenerator })))
const SmartCrop = lazy(() => import('./pages/SmartCrop').then(m => ({ default: m.SmartCrop })))
const ImageExtender = lazy(() => import('./pages/ImageExtender').then(m => ({ default: m.ImageExtender })))

// Guide pages for long-tail SEO
const RemoveAICheckerboard = lazy(() => import('./pages/guides/RemoveAICheckerboard').then(m => ({ default: m.RemoveAICheckerboard })))
const CompressWithoutQualityLoss = lazy(() => import('./pages/guides/CompressWithoutQualityLoss').then(m => ({ default: m.CompressWithoutQualityLoss })))
const ConvertToWebP = lazy(() => import('./pages/guides/ConvertToWebP').then(m => ({ default: m.ConvertToWebP })))
const BatchCompress = lazy(() => import('./pages/guides/BatchCompress').then(m => ({ default: m.BatchCompress })))
const MidjourneyTransparent = lazy(() => import('./pages/guides/MidjourneyTransparent').then(m => ({ default: m.MidjourneyTransparent })))
const RemoveWatermarkGuide = lazy(() => import('./pages/guides/RemoveWatermark').then(m => ({ default: m.RemoveWatermarkGuide })))

// 404 page
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })))

// Auth callback page
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(m => ({ default: m.AuthCallback })))

// History page
const History = lazy(() => import('./pages/History').then(m => ({ default: m.History })))

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
        <Route path="/remove-watermark" element={<LanguageRedirectPage page="remove-watermark" />} />
        <Route path="/change-background" element={<LanguageRedirectPage page="change-background" />} />
        <Route path="/background-remover" element={<LanguageRedirectPage page="background-remover" />} />
        <Route path="/image-upscaler" element={<LanguageRedirectPage page="image-upscaler" />} />
        <Route path="/watermark-remover" element={<LanguageRedirectPage page="watermark-remover" />} />
        <Route path="/background-generator" element={<LanguageRedirectPage page="background-generator" />} />
        <Route path="/image-sharpener" element={<LanguageRedirectPage page="image-sharpener" />} />
        <Route path="/image-denoiser" element={<LanguageRedirectPage page="image-denoiser" />} />
        <Route path="/shadow-generator" element={<LanguageRedirectPage page="shadow-generator" />} />
        <Route path="/smart-crop" element={<LanguageRedirectPage page="smart-crop" />} />
        <Route path="/image-extender" element={<LanguageRedirectPage page="image-extender" />} />

        {/* Language-prefixed routes */}
        <Route path="/:lang" element={<LanguageRouter><Home /></LanguageRouter>} />
        <Route path="/:lang/remove-fake-transparency" element={<LanguageRouter><RemoveFakeTransparency /></LanguageRouter>} />
        <Route path="/:lang/compress" element={<LanguageRouter><Compress /></LanguageRouter>} />
        <Route path="/:lang/resize" element={<LanguageRouter><Resize /></LanguageRouter>} />
        <Route path="/:lang/remove-watermark" element={<LanguageRouter><RemoveWatermark /></LanguageRouter>} />
        <Route path="/:lang/change-background" element={<LanguageRouter><ChangeBackground /></LanguageRouter>} />

        {/* AI Tools (Pixelbin) */}
        <Route path="/:lang/background-remover" element={<LanguageRouter><ChangeBackground /></LanguageRouter>} />
        <Route path="/:lang/image-upscaler" element={<LanguageRouter><ImageUpscaler /></LanguageRouter>} />
        <Route path="/:lang/watermark-remover" element={<LanguageRouter><WatermarkRemover /></LanguageRouter>} />
        <Route path="/:lang/background-generator" element={<LanguageRouter><BackgroundGenerator /></LanguageRouter>} />
        <Route path="/:lang/image-sharpener" element={<LanguageRouter><ImageSharpener /></LanguageRouter>} />
        <Route path="/:lang/image-denoiser" element={<LanguageRouter><ImageDenoiser /></LanguageRouter>} />
        <Route path="/:lang/shadow-generator" element={<LanguageRouter><ShadowGenerator /></LanguageRouter>} />
        <Route path="/:lang/smart-crop" element={<LanguageRouter><SmartCrop /></LanguageRouter>} />
        <Route path="/:lang/image-extender" element={<LanguageRouter><ImageExtender /></LanguageRouter>} />

        {/* Guide pages for long-tail SEO */}
        <Route path="/:lang/guides/remove-ai-checkerboard" element={<LanguageRouter><RemoveAICheckerboard /></LanguageRouter>} />
        <Route path="/:lang/guides/compress-without-quality-loss" element={<LanguageRouter><CompressWithoutQualityLoss /></LanguageRouter>} />
        <Route path="/:lang/guides/convert-to-webp" element={<LanguageRouter><ConvertToWebP /></LanguageRouter>} />
        <Route path="/:lang/guides/batch-compress" element={<LanguageRouter><BatchCompress /></LanguageRouter>} />
        <Route path="/:lang/guides/midjourney-transparent" element={<LanguageRouter><MidjourneyTransparent /></LanguageRouter>} />
        <Route path="/:lang/guides/remove-watermark" element={<LanguageRouter><RemoveWatermarkGuide /></LanguageRouter>} />

        {/* History page */}
        <Route path="/:lang/history" element={<LanguageRouter><History /></LanguageRouter>} />

        {/* Auth callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <LangRoutes />
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
