import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { languages } from '../i18n'

export function Home() {
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
        title={t('home.seo.title')}
        description={t('home.seo.description')}
        keywords={t('home.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}`}
      />
      <StructuredData type="home" />

      <div className="home-page">
        <section className="hero">
          <h1>{t('home.hero.title')}</h1>
          <p className="hero-desc">{t('home.hero.desc')}</p>
        </section>

        <section className="tools-grid">
          <Link to={langLink('/remove-fake-transparency')} className="tool-card">
            <div className="tool-card-icon">🔲</div>
            <h2>{t('home.tools.removeFakeTransparency.title')}</h2>
            <p>{t('home.tools.removeFakeTransparency.desc')}</p>
            <span className="tool-card-btn">{t('common.useNow')}</span>
          </Link>

          <Link to={langLink('/compress')} className="tool-card">
            <div className="tool-card-icon">📦</div>
            <h2>{t('home.tools.compress.title')}</h2>
            <p>{t('home.tools.compress.desc')}</p>
            <span className="tool-card-btn">{t('common.useNow')}</span>
          </Link>

          <Link to={langLink('/resize')} className="tool-card">
            <div className="tool-card-icon">📐</div>
            <h2>{t('home.tools.resize.title')}</h2>
            <p>{t('home.tools.resize.desc')}</p>
            <span className="tool-card-btn">{t('common.useNow')}</span>
          </Link>
        </section>

        <section className="features">
          <h2>{t('home.features.title')}</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <h3>{t('home.features.privacy.title')}</h3>
              <p>{t('home.features.privacy.desc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <h3>{t('home.features.fast.title')}</h3>
              <p>{t('home.features.fast.desc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <h3>{t('home.features.free.title')}</h3>
              <p>{t('home.features.free.desc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <h3>{t('home.features.crossPlatform.title')}</h3>
              <p>{t('home.features.crossPlatform.desc')}</p>
            </div>
          </div>
        </section>

        <section className="faq">
          <h2>{t('home.faq.title')}</h2>
          <div className="faq-list">
            <details className="faq-item">
              <summary>{t('home.faq.q1.question')}</summary>
              <p>{t('home.faq.q1.answer')}</p>
            </details>
            <details className="faq-item">
              <summary>{t('home.faq.q2.question')}</summary>
              <p>{t('home.faq.q2.answer')}</p>
            </details>
            <details className="faq-item">
              <summary>{t('home.faq.q3.question')}</summary>
              <p>{t('home.faq.q3.answer')}</p>
            </details>
            <details className="faq-item">
              <summary>{t('home.faq.q4.question')}</summary>
              <p>{t('home.faq.q4.answer')}</p>
            </details>
          </div>
        </section>
      </div>
    </>
  )
}
