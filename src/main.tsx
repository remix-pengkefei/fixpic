import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import './i18n'
import './index.css'
import App from './App.tsx'

// 初始化 Sentry 错误监控
Sentry.init({
  dsn: "https://2599f26441c97006303c8e20d38949fb@o4510651679375360.ingest.us.sentry.io/4510652342337536",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // 性能监控采样率
  tracesSampleRate: 0.1,
  // Session Replay 采样率
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

// 暴露 Sentry 到全局用于调试
;(window as unknown as { Sentry: typeof Sentry }).Sentry = Sentry

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
        {/* Tool routes */}
        <Route path="/:lang/:tool" element={<App />} />
        <Route path="/:lang" element={<Navigate to={`/${getDefaultLang()}/ai-remove-background`} replace />} />
        <Route path="/" element={<Navigate to={`/${getDefaultLang()}/ai-remove-background`} replace />} />
        <Route path="*" element={<Navigate to={`/${getDefaultLang()}/ai-remove-background`} replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
