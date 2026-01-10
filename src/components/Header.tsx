import { useTranslation } from 'react-i18next'
import { languages } from '../i18n'

interface HeaderProps {
  lang: string | undefined
  showLanguageMenu: boolean
  setShowLanguageMenu: (show: boolean) => void
  onLanguageChange: (lang: string) => void
}

export function Header({ lang, showLanguageMenu, setShowLanguageMenu, onLanguageChange }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const currentLang = languages.find(l => l.code === (lang || i18n.language)) || languages.find(l => l.code === 'en')!

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-icon">F</span>
          <span className="logo-text">ix-Pic</span>
        </div>
        <p className="tagline">{t('app.tagline')}</p>
      </div>
      <div className="header-right">
        <div className="language-switcher">
          <button
            className="language-btn"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <span className="lang-flag">{currentLang.flag}</span>
            <span className="lang-name">{currentLang.name}</span>
            <span className="lang-arrow">▼</span>
          </button>
          {showLanguageMenu && (
            <div className="language-menu">
              {languages.map(language => (
                <button
                  key={language.code}
                  className={`language-option ${language.code === i18n.language ? 'active' : ''}`}
                  onClick={() => onLanguageChange(language.code)}
                >
                  <span className="lang-flag">{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
