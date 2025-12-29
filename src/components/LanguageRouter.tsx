import { useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { languages } from '../i18n'

const validLangCodes = languages.map(l => l.code)

export function LanguageRouter({ children }: { children: React.ReactNode }) {
  const { lang } = useParams<{ lang: string }>()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (lang && validLangCodes.includes(lang)) {
      // URL has valid language, sync with i18n
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang)
      }
    }
  }, [lang, i18n])

  // Sync URL when language changes via dropdown
  useEffect(() => {
    const handleLanguageChange = (newLang: string) => {
      const currentPath = location.pathname
      const pathParts = currentPath.split('/').filter(Boolean)

      // Check if first part is a language code
      if (pathParts.length > 0 && validLangCodes.includes(pathParts[0])) {
        // Replace language in URL
        pathParts[0] = newLang
        navigate('/' + pathParts.join('/'), { replace: true })
      } else if (pathParts.length === 0) {
        // Root path, add language
        navigate(`/${newLang}`, { replace: true })
      } else {
        // No language in URL, prepend it
        navigate(`/${newLang}/${pathParts.join('/')}`, { replace: true })
      }
    }

    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n, navigate, location.pathname])

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
