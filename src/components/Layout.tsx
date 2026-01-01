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

// Tool categories for navigation
const toolCategories = [
  {
    key: 'remove',
    labelKey: 'home.category.remove',
    defaultLabel: 'AI Remove',
    tools: [
      { path: '/background-remover', labelKey: 'nav.bgRemover', icon: '🎨' },
      { path: '/watermark-remover', labelKey: 'nav.watermarkRemover', icon: '💧' },
      { path: '/remove-fake-transparency', labelKey: 'nav.removeFakeTransparency', icon: '🔲' },
    ],
  },
  {
    key: 'enhance',
    labelKey: 'home.category.enhance',
    defaultLabel: 'AI Enhance',
    tools: [
      { path: '/image-upscaler', labelKey: 'nav.upscaler', icon: '🔍' },
      { path: '/image-sharpener', labelKey: 'nav.sharpener', icon: '🔬' },
      { path: '/image-denoiser', labelKey: 'nav.denoiser', icon: '🔇' },
    ],
  },
  {
    key: 'generate',
    labelKey: 'home.category.generate',
    defaultLabel: 'AI Generate',
    tools: [
      { path: '/background-generator', labelKey: 'nav.bgGenerator', icon: '✨' },
      { path: '/shadow-generator', labelKey: 'nav.shadowGen', icon: '🌓' },
      { path: '/image-extender', labelKey: 'nav.extender', icon: '↔️' },
    ],
  },
  {
    key: 'edit',
    labelKey: 'home.category.edit',
    defaultLabel: 'Edit Tools',
    tools: [
      { path: '/smart-crop', labelKey: 'nav.smartCrop', icon: '✂️' },
      { path: '/compress', labelKey: 'nav.compress', icon: '📦' },
      { path: '/resize', labelKey: 'nav.resize', icon: '📐' },
    ],
  },
]

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, loading } = useAuth()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showToolsMenu, setShowToolsMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const toolsMenuRef = useRef<HTMLDivElement>(null)

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
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setShowMobileMenu(false)
  }, [location.pathname])

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

  // Logged-in layout with sidebar
  if (user) {
    return (
      <div className="app-dashboard">
        {/* Sidebar */}
        <aside className={`dash-sidebar ${showMobileMenu ? 'open' : ''}`}>
          <Link to={langLink('')} className="dash-logo">
            <span className="dash-logo-icon">F</span>
            <span className="dash-logo-text">ixPic</span>
          </Link>

          <nav className="dash-nav">
            {toolCategories.map(category => (
              <div key={category.key} className="dash-nav-section">
                <span className="dash-nav-label">{t(category.labelKey, category.defaultLabel)}</span>
                {category.tools.map(tool => (
                  <Link
                    key={tool.path}
                    to={langLink(tool.path)}
                    className={`dash-nav-item ${currentPage === tool.path ? 'active' : ''}`}
                  >
                    <span className="dash-nav-icon">{tool.icon}</span>
                    <span>{t(tool.labelKey)}</span>
                  </Link>
                ))}
              </div>
            ))}

            <div className="dash-nav-section">
              <span className="dash-nav-label">{t('user.account', 'Account')}</span>
              <Link
                to={langLink('/history')}
                className={`dash-nav-item ${currentPage === '/history' ? 'active' : ''}`}
              >
                <span className="dash-nav-icon">📋</span>
                <span>{t('nav.history')}</span>
              </Link>
            </div>
          </nav>

          <div className="dash-sidebar-footer">
            {/* Language Switcher */}
            <div className="dash-lang" ref={langMenuRef}>
              <button className="dash-lang-btn" onClick={() => setShowLangMenu(!showLangMenu)}>
                <span>{currentLang.flag}</span>
                <span>{currentLang.name}</span>
              </button>
              {showLangMenu && (
                <div className="dash-lang-menu">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      className={`dash-lang-option ${lang.code === currentLangCode ? 'active' : ''}`}
                      onClick={() => changeLanguage(lang.code)}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <UserMenu />
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="dash-mobile-header">
          <button className="dash-menu-toggle" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <Link to={langLink('')} className="dash-mobile-logo">
            <span className="dash-logo-icon">F</span>
            <span className="dash-logo-text">ixPic</span>
          </Link>
          <div style={{ width: 40 }} />
        </div>

        {/* Overlay for mobile */}
        {showMobileMenu && (
          <div className="dash-overlay" onClick={() => setShowMobileMenu(false)} />
        )}

        {/* Main Content Area */}
        <main className="dash-main">
          {!isHome && <Breadcrumb />}
          <div className="dash-content">
            {children}
          </div>
        </main>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    )
  }

  // Non-logged-in layout
  return (
    <div className="app-layout">
      {/* Header */}
      <header className="pr-header">
        <div className="pr-header-inner">
          <Link to={langLink('')} className="pr-logo">
            <span className="pr-logo-icon">F</span>
            <span className="pr-logo-text">ixPic</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="pr-nav-desktop">
            <div className="pr-tools-dropdown" ref={toolsMenuRef}>
              <button
                className="pr-tools-btn"
                onClick={() => setShowToolsMenu(!showToolsMenu)}
              >
                <span>{t('nav.tools', 'Tools')}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {showToolsMenu && (
                <div className="pr-tools-menu">
                  {toolCategories.map(category => (
                    <div key={category.key} className="pr-tools-category">
                      <span className="pr-tools-category-label">
                        {t(category.labelKey, category.defaultLabel)}
                      </span>
                      {category.tools.map(tool => (
                        <Link
                          key={tool.path}
                          to={langLink(tool.path)}
                          className="pr-tools-item"
                          onClick={() => setShowToolsMenu(false)}
                        >
                          <span className="pr-tools-icon">{tool.icon}</span>
                          <span>{t(tool.labelKey)}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="pr-header-actions">
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

            {!loading && (
              <button className="pr-login-btn" onClick={() => setShowAuthModal(true)}>
                {t('auth.login')}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button className="pr-mobile-toggle" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="pr-mobile-nav">
            {toolCategories.map(category => (
              <div key={category.key} className="pr-mobile-category">
                <span className="pr-mobile-category-label">
                  {t(category.labelKey, category.defaultLabel)}
                </span>
                {category.tools.map(tool => (
                  <Link
                    key={tool.path}
                    to={langLink(tool.path)}
                    className="pr-mobile-nav-link"
                  >
                    <span>{tool.icon}</span>
                    <span>{t(tool.labelKey)}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {!isHome && <Breadcrumb />}

      <main className="pr-main">
        {children}
      </main>

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
            {toolCategories.map(category => (
              <div key={category.key} className="pr-footer-col">
                <h4>{t(category.labelKey, category.defaultLabel)}</h4>
                {category.tools.map(tool => (
                  <Link key={tool.path} to={langLink(tool.path)}>{t(tool.labelKey)}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="pr-footer-bottom">
          <p>© {new Date().getFullYear()} FixPic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
