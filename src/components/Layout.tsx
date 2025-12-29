import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { languages } from '../i18n'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { t, i18n } = useTranslation()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find(l => l.code === i18n.language) || languages[2] // default to English

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setShowLangMenu(false)
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo-link">
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
                  className={`lang-option ${lang.code === i18n.language ? 'active' : ''}`}
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
            to="/remove-fake-transparency"
            className={location.pathname === '/remove-fake-transparency' ? 'active' : ''}
          >
            {t('nav.removeFakeTransparency')}
          </Link>
          <Link
            to="/compress"
            className={location.pathname === '/compress' ? 'active' : ''}
          >
            {t('nav.compress')}
          </Link>
          <Link
            to="/resize"
            className={location.pathname === '/resize' ? 'active' : ''}
          >
            {t('nav.resize')}
          </Link>
        </nav>
      )}

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <Link to="/remove-fake-transparency">{t('nav.removeFakeTransparency')}</Link>
          <Link to="/compress">{t('nav.compress')}</Link>
          <Link to="/resize">{t('nav.resize')}</Link>
        </div>
        <p>{t('footer.description')}</p>
      </footer>
    </div>
  )
}
