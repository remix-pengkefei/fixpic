import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { languages, loadLanguage } from '../i18n'
import { Breadcrumb } from './Breadcrumb'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  // Get current language from URL or i18n
  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLangCode = urlLang || i18n.language || 'en'

  // Helper to create language-prefixed links
  const langLink = (path: string) => `/${currentLangCode}${path}`

  // Check if current page is home
  const isHome = pathParts.length <= 1 || (pathParts.length === 1 && validLangCodes.includes(pathParts[0]))

  // Get current page path without language prefix
  const currentPage = urlLang ? '/' + pathParts.slice(1).join('/') : location.pathname

  const currentLang = languages.find(l => l.code === currentLangCode) || languages.find(l => l.code === 'en')!

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLanguage = async (code: string) => {
    setShowLangMenu(false)

    // Load language resources first, then navigate
    try {
      await loadLanguage(code)
      await i18n.changeLanguage(code)
    } catch (err) {
      console.error('Failed to load language:', code, err)
    }

    // Navigate to the same page with new language prefix
    const newPath = `/${code}${currentPage === '/' ? '' : currentPage}`
    navigate(newPath)
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <Link to={langLink('')} className="logo-link">
          <div className="logo">
            <span className="logo-icon">F</span>
            <span className="logo-text">ix-Pic</span>
          </div>
        </Link>
        <p className="tagline">{t('header.tagline')}</p>

        {/* Language Switcher */}
        <div className="lang-switcher" ref={langMenuRef}>
          <button
            className="lang-btn"
            onClick={() => setShowLangMenu(!showLangMenu)}
          >
            <span className="lang-flag">{currentLang.flag}</span>
            <span className="lang-name">{currentLang.name}</span>
            <span className="lang-arrow">▼</span>
          </button>
          {showLangMenu && (
            <div className="lang-menu">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  className={`lang-option ${lang.code === currentLangCode ? 'active' : ''}`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  <span className="lang-flag">{lang.flag}</span>
                  <span className="lang-name">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Navigation - show on tool pages */}
      {!isHome && (
        <nav className="tool-nav">
          <Link
            to={langLink('/remove-fake-transparency')}
            className={currentPage === '/remove-fake-transparency' ? 'active' : ''}
          >
            {t('nav.removeFakeTransparency')}
          </Link>
          <Link
            to={langLink('/compress')}
            className={currentPage === '/compress' ? 'active' : ''}
          >
            {t('nav.compress')}
          </Link>
          <Link
            to={langLink('/resize')}
            className={currentPage === '/resize' ? 'active' : ''}
          >
            {t('nav.resize')}
          </Link>
          <Link
            to={langLink('/remove-watermark')}
            className={currentPage === '/remove-watermark' ? 'active' : ''}
          >
            {t('nav.removeWatermark')}
          </Link>
        </nav>
      )}

      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <Link to={langLink('/remove-fake-transparency')}>{t('nav.removeFakeTransparency')}</Link>
          <Link to={langLink('/compress')}>{t('nav.compress')}</Link>
          <Link to={langLink('/resize')}>{t('nav.resize')}</Link>
          <Link to={langLink('/remove-watermark')}>{t('nav.removeWatermark')}</Link>
        </div>
        <p>{t('footer.description')}</p>
      </footer>
    </div>
  )
}
