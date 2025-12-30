import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Only import English as fallback - other languages load on demand
import en from './locales/en.json'

export const languages = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇭🇰' },
]

// Lazy loaders for each language
const localeLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  'zh-CN': () => import('./locales/zh-CN.json'),
  'zh-TW': () => import('./locales/zh-TW.json'),
  ja: () => import('./locales/ja.json'),
  ko: () => import('./locales/ko.json'),
  es: () => import('./locales/es.json'),
  pt: () => import('./locales/pt.json'),
  fr: () => import('./locales/fr.json'),
  de: () => import('./locales/de.json'),
  ru: () => import('./locales/ru.json'),
  it: () => import('./locales/it.json'),
  id: () => import('./locales/id.json'),
  vi: () => import('./locales/vi.json'),
  th: () => import('./locales/th.json'),
  tr: () => import('./locales/tr.json'),
}

// Load language resources on demand
export async function loadLanguage(lng: string): Promise<void> {
  if (lng === 'en' || i18n.hasResourceBundle(lng, 'translation')) {
    return
  }

  const loader = localeLoaders[lng]
  if (loader) {
    const resources = await loader()
    i18n.addResourceBundle(lng, 'translation', resources.default, true, true)
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

// Load initial language if not English
const detectedLng = i18n.language || 'en'
if (detectedLng !== 'en') {
  loadLanguage(detectedLng)
}

export default i18n
