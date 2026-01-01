import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { BeforeAfterSlider } from '../components/BeforeAfterSlider'
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
        ogImage="/og-image.png"
      />
      <StructuredData type="home" />

      <div className="home-page">
        <section className="hero">
          <h1>{t('home.hero.title')}</h1>
          <p className="hero-desc">{t('home.hero.desc')}</p>
        </section>

        {/* Quick navigation - minimal pill style */}
        <nav className="tools-quick-nav">
          <a href="#tool-watermark">{t('home.tools.watermark.title')}</a>
          <a href="#tool-transparency">{t('home.tools.removeFakeTransparency.title')}</a>
          <a href="#tool-compress">{t('home.tools.compress.title')}</a>
          <a href="#tool-resize">{t('home.tools.resize.title')}</a>
        </nav>

        <section className="tools-showcase">
          {/* Remove Watermark */}
          <div id="tool-watermark" className="tool-showcase-card">
            <div className="tool-showcase-preview">
              <div className="watermark-demo-placeholder">
                <div className="demo-icon">🖌️</div>
                <p>{t('home.tools.watermark.demoText')}</p>
              </div>
            </div>
            <div className="tool-showcase-content">
              <h2>{t('home.tools.watermark.title')}</h2>
              <p>{t('home.tools.watermark.desc')}</p>
              <Link to={langLink('/remove-watermark')} className="tool-showcase-btn">
                {t('common.useNow')}
              </Link>
            </div>
          </div>

          {/* Remove Fake Transparency */}
          <div id="tool-transparency" className="tool-showcase-card">
            <div className="tool-showcase-preview">
              <BeforeAfterSlider
                beforeImage="/examples/transparency-before.png"
                afterImage="/examples/transparency-after.png"
                beforeLabel={t('home.showcase.before')}
                afterLabel={t('home.showcase.after')}
                beforeAlt={t('home.showcase.transparency.beforeAlt')}
                afterAlt={t('home.showcase.transparency.afterAlt')}
              />
            </div>
            <div className="tool-showcase-content">
              <h2>{t('home.tools.removeFakeTransparency.title')}</h2>
              <p>{t('home.tools.removeFakeTransparency.desc')}</p>
              <Link to={langLink('/remove-fake-transparency')} className="tool-showcase-btn">
                {t('common.useNow')}
              </Link>
            </div>
          </div>

          {/* Compress */}
          <div id="tool-compress" className="tool-showcase-card">
            <div className="tool-showcase-preview">
              <BeforeAfterSlider
                beforeImage="/examples/compress-before.png"
                afterImage="/examples/compress-after.webp"
                beforeLabel="470 KB"
                afterLabel="6 KB"
                beforeAlt={t('home.showcase.compress.beforeAlt')}
                afterAlt={t('home.showcase.compress.afterAlt')}
              />
            </div>
            <div className="tool-showcase-content">
              <h2>{t('home.tools.compress.title')}</h2>
              <p>{t('home.tools.compress.desc')}</p>
              <div className="tool-showcase-stat">
                <span className="stat-value">-98%</span>
                <span className="stat-label">{t('home.showcase.compress.sizeReduction')}</span>
              </div>
              <Link to={langLink('/compress')} className="tool-showcase-btn">
                {t('common.useNow')}
              </Link>
            </div>
          </div>

          {/* Resize */}
          <div id="tool-resize" className="tool-showcase-card">
            <div className="tool-showcase-preview">
              <BeforeAfterSlider
                beforeImage="/examples/resize-before.png"
                afterImage="/examples/resize-after.png"
                beforeLabel="1200×800"
                afterLabel="600×400"
                beforeAlt={t('home.showcase.resize.beforeAlt')}
                afterAlt={t('home.showcase.resize.afterAlt')}
              />
            </div>
            <div className="tool-showcase-content">
              <h2>{t('home.tools.resize.title')}</h2>
              <p>{t('home.tools.resize.desc')}</p>
              <Link to={langLink('/resize')} className="tool-showcase-btn">
                {t('common.useNow')}
              </Link>
            </div>
          </div>
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
