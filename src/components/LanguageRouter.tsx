import { useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { languages, loadLanguage } from '../i18n'

const validLangCodes = languages.map(l => l.code)

export function LanguageRouter({ children }: { children: React.ReactNode }) {
  const { lang } = useParams<{ lang: string }>()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (lang && validLangCodes.includes(lang)) {
      // URL has valid language, ensure resources are loaded and i18n is synced
      // This handles direct URL access and browser back/forward navigation
      if (i18n.language !== lang) {
        loadLanguage(lang)
          .then(() => i18n.changeLanguage(lang))
          .catch((err) => console.error('Failed to load language:', lang, err))
      }
    }
  }, [lang, i18n])

  return <>{children}</>
}

// Component to redirect from non-language paths to language-prefixed paths
export function LanguageRedirect({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean)

    // If no language prefix, redirect to language-prefixed URL
    if (pathParts.length === 0 || !validLangCodes.includes(pathParts[0])) {
      const detectedLang = i18n.language || 'en'
      const newPath = pathParts.length === 0
        ? `/${detectedLang}`
        : `/${detectedLang}/${pathParts.join('/')}`
      navigate(newPath, { replace: true })
    }
  }, [location.pathname, i18n.language, navigate])

  return <>{children}</>
}
