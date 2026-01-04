import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './i18n'
import './index.css'
import App from './App.tsx'
import { BlogHome, CategoryPage, ArticlePage } from './blog/components'

// 支持的语言列表
const supportedLangs = [
  'en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'it', 'ru',
  'vi', 'th', 'id', 'ms', 'tr', 'nl', 'el', 'cs', 'hu', 'uk', 'ar'
]

// 获取默认语言
const getDefaultLang = () => {
  const stored = localStorage.getItem('fixpic-language')
  if (stored && supportedLangs.includes(stored)) return stored

  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return browserLang.includes('TW') || browserLang.includes('HK') ? 'zh-TW' : 'zh-CN'
  }
  const mainLang = browserLang.split('-')[0]
  return supportedLangs.includes(mainLang) ? mainLang : 'en'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Blog routes - must be before :tool to avoid conflicts */}
        <Route path="/:lang/blog" element={<BlogHome />} />
        <Route path="/:lang/blog/:category" element={<CategoryPage />} />
        <Route path="/:lang/blog/:category/:slug" element={<ArticlePage />} />

        {/* Tool routes */}
        <Route path="/:lang/:tool" element={<App />} />
        <Route path="/:lang" element={<Navigate to={`/${getDefaultLang()}/ai-remove-background`} replace />} />
        <Route path="/" element={<Navigate to={`/${getDefaultLang()}/ai-remove-background`} replace />} />
        <Route path="*" element={<Navigate to={`/${getDefaultLang()}/ai-remove-background`} replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
