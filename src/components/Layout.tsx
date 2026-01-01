import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { languages, loadLanguage } from '../i18n'
import { Breadcrumb } from './Breadcrumb'
import { useAuth } from '../contexts/AuthContext'
import { AuthModal } from './AuthModal'
import { UserMenu } from './UserMenu'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, loading } = useAuth()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLangCode = urlLang || i18n.language || 'en'
  const langLink = (path: string) => `/${currentLangCode}${path}`
  const isHome = pathParts.length <= 1 || (pathParts.length === 1 && validLangCodes.includes(pathParts[0]))
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
    try {
      await loadLanguage(code)
      await i18n.changeLanguage(code)
    } catch (err) {
      console.error('Failed to load language:', code, err)
    }
    const newPath = `/${code}${currentPage === '/' ? '' : currentPage}`
    navigate(newPath)
  }

  const navItems = [
    { path: '/remove-watermark', label: t('nav.removeWatermark') },
    { path: '/change-background', label: t('nav.changeBackground', 'AI Background') },
    { path: '/remove-fake-transparency', label: t('nav.removeFakeTransparency') },
    { path: '/compress', label: t('nav.compress') },
    { path: '/resize', label: t('nav.resize') },
  ]

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="pr-header">
        <div className="pr-header-inner">
          {/* Logo */}
          <Link to={langLink('')} className="pr-logo">
            <span className="pr-logo-icon">F</span>
            <span className="pr-logo-text">ixPic</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="pr-nav">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={langLink(item.path)}
                className={`pr-nav-link ${currentPage === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="pr-header-actions">
            {/* Language Switcher */}
            <div className="pr-lang" ref={langMenuRef}>
              <button className="pr-lang-btn" onClick={() => setShowLangMenu(!showLangMenu)}>
                <span>{currentLang.flag}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {showLangMenu && (
                <div className="pr-lang-menu">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      className={`pr-lang-option ${lang.code === currentLangCode ? 'active' : ''}`}
                      onClick={() => changeLanguage(lang.code)}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth */}
            {!loading && (
              user ? (
                <UserMenu />
              ) : (
                <button className="pr-login-btn" onClick={() => setShowAuthModal(true)}>
                  {t('auth.login')}
                </button>
              )
            )}

            {/* Mobile Menu Toggle */}
            <button className="pr-mobile-toggle" onClick={() => setShowMobileNav(!showMobileNav)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showMobileNav ? (
                  <path d="M6 6l12 12M6 18L18 6" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileNav && (
          <nav className="pr-mobile-nav">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={langLink(item.path)}
                className={`pr-mobile-nav-link ${currentPage === item.path ? 'active' : ''}`}
                onClick={() => setShowMobileNav(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Breadcrumb */}
      {!isHome && <Breadcrumb />}

      {/* Main Content */}
      <main className="pr-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="pr-footer">
        <div className="pr-footer-inner">
          <div className="pr-footer-brand">
            <Link to={langLink('')} className="pr-footer-logo">
              <span className="pr-logo-icon">F</span>
              <span className="pr-logo-text">ixPic</span>
            </Link>
            <p className="pr-footer-desc">{t('footer.description')}</p>
          </div>
          <div className="pr-footer-links">
            <div className="pr-footer-col">
              <h4>{t('footer.tools', 'Tools')}</h4>
              {navItems.map(item => (
                <Link key={item.path} to={langLink(item.path)}>{item.label}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="pr-footer-bottom">
          <p>© {new Date().getFullYear()} FixPic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
