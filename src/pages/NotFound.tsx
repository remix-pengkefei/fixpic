import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { languages } from '../i18n'

export function NotFound() {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  // Get current language from URL
  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'

  const langLink = (path: string) => `/${currentLang}${path}`

  return (
    <>
      <SEO
        title="404 - Page Not Found | FixPic"
        description="The page you're looking for doesn't exist. Return to FixPic to use our free image processing tools."
        canonicalUrl={`https://fix-pic.com/${currentLang}`}
      />

      <div className="not-found-page">
        <div className="not-found-content">
          <div className="not-found-icon">404</div>
          <h1>{t('notFound.title', 'Page Not Found')}</h1>
          <p>{t('notFound.description', "Sorry, the page you're looking for doesn't exist or has been moved.")}</p>

          <div className="not-found-actions">
            <Link to={langLink('')} className="not-found-home-btn">
              {t('notFound.goHome', 'Go to Homepage')}
            </Link>
          </div>

          <div className="not-found-tools">
            <h2>{t('notFound.tryTools', 'Try our tools:')}</h2>
            <div className="not-found-tools-grid">
              <Link to={langLink('/remove-fake-transparency')} className="not-found-tool-card">
                <span className="tool-icon">🔲</span>
                <span>{t('nav.removeFakeTransparency')}</span>
              </Link>
              <Link to={langLink('/compress')} className="not-found-tool-card">
                <span className="tool-icon">📦</span>
                <span>{t('nav.compress')}</span>
              </Link>
              <Link to={langLink('/resize')} className="not-found-tool-card">
                <span className="tool-icon">📐</span>
                <span>{t('nav.resize')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
