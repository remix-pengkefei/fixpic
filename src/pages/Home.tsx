import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { BeforeAfterSlider } from '../components/BeforeAfterSlider'
import { languages } from '../i18n'
import { useAuth } from '../contexts/AuthContext'
import { getHistory } from '../services/history'
import type { HistoryRecord } from '../services/history'

export function Home() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { user } = useAuth()
  const [recentHistory, setRecentHistory] = useState<HistoryRecord[]>([])

  // Get current language from URL
  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'

  const langLink = (path: string) => `/${currentLang}${path}`

  // Fetch recent history for logged-in users
  useEffect(() => {
    if (user) {
      getHistory(5).then(setRecentHistory).catch(console.error)
    }
  }, [user])

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${bytes} B`
  }

  const getToolIcon = (toolType: string) => {
    switch (toolType) {
      case 'watermark': return '🔍'
      case 'compress': return '📦'
      case 'resize': return '📐'
      case 'transparency': return '🔲'
      case 'background': return '🎨'
      default: return '🖼️'
    }
  }

  const getToolName = (toolType: string) => {
    switch (toolType) {
      case 'watermark': return t('nav.removeWatermark')
      case 'compress': return t('nav.compress')
      case 'resize': return t('nav.resize')
      case 'transparency': return t('nav.removeFakeTransparency')
      case 'background': return t('nav.changeBackground', 'AI Background')
      default: return toolType
    }
  }

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
        {/* Logged-in user: Dashboard view */}
        {user ? (
          <>
            <section className="dashboard-hero">
              <h1>{t('home.dashboard.welcome', { name: user.user_metadata?.name || user.email?.split('@')[0] || t('auth.user') })}</h1>
              <p className="dashboard-desc">{t('home.dashboard.desc')}</p>
            </section>

            {/* Tool Cards Grid */}
            <section className="dashboard-tools">
              <h2>{t('home.dashboard.tools')}</h2>
              <div className="tool-cards-grid">
                <Link to={langLink('/remove-watermark')} className="tool-card">
                  <span className="tool-card-icon">🔍</span>
                  <span className="tool-card-name">{t('nav.removeWatermark')}</span>
                  <span className="tool-card-desc">{t('home.tools.watermark.shortDesc', 'AI-powered watermark removal')}</span>
                </Link>
                <Link to={langLink('/change-background')} className="tool-card">
                  <span className="tool-card-icon">🎨</span>
                  <span className="tool-card-name">{t('nav.changeBackground', 'AI Background')}</span>
                  <span className="tool-card-desc">{t('home.tools.background.shortDesc', 'Remove or change background')}</span>
                </Link>
                <Link to={langLink('/remove-fake-transparency')} className="tool-card">
                  <span className="tool-card-icon">🔲</span>
                  <span className="tool-card-name">{t('nav.removeFakeTransparency')}</span>
                  <span className="tool-card-desc">{t('home.tools.removeFakeTransparency.shortDesc', 'Remove checkerboard background')}</span>
                </Link>
                <Link to={langLink('/compress')} className="tool-card">
                  <span className="tool-card-icon">📦</span>
                  <span className="tool-card-name">{t('nav.compress')}</span>
                  <span className="tool-card-desc">{t('home.tools.compress.shortDesc', 'Compress & convert to WebP')}</span>
                </Link>
                <Link to={langLink('/resize')} className="tool-card">
                  <span className="tool-card-icon">📐</span>
                  <span className="tool-card-name">{t('nav.resize')}</span>
                  <span className="tool-card-desc">{t('home.tools.resize.shortDesc', 'Resize images precisely')}</span>
                </Link>
                <Link to={langLink('/history')} className="tool-card tool-card-secondary">
                  <span className="tool-card-icon">📋</span>
                  <span className="tool-card-name">{t('nav.history')}</span>
                  <span className="tool-card-desc">{t('home.dashboard.viewHistory')}</span>
                </Link>
              </div>
            </section>

            {/* Recent History */}
            {recentHistory.length > 0 && (
              <section className="dashboard-history">
                <div className="section-header">
                  <h2>{t('home.dashboard.recentHistory')}</h2>
                  <Link to={langLink('/history')} className="view-all-link">{t('common.viewAll')}</Link>
                </div>
                <div className="history-list-compact">
                  {recentHistory.map((record) => (
                    <div key={record.id} className="history-item-compact">
                      <span className="history-icon">{getToolIcon(record.tool_type)}</span>
                      <div className="history-info">
                        <span className="history-filename">{record.original_filename}</span>
                        <span className="history-meta">
                          {getToolName(record.tool_type)} · {formatSize(record.original_size)}
                          {record.result_size && ` → ${formatSize(record.result_size)}`}
                        </span>
                      </div>
                      <span className="history-time">
                        {new Date(record.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          /* Not logged in: Effect showcase view */
          <>
            <section className="hero">
              <h1>{t('home.hero.title')}</h1>
              <p className="hero-desc">{t('home.hero.desc')}</p>
            </section>

            {/* Tool Effect Showcases */}
            <section className="effects-showcase">
              {/* Remove Watermark */}
              <div id="section-watermark" className="effect-item">
                <div className="effect-preview">
                  <BeforeAfterSlider
                    beforeImage="/examples/watermark-before.png"
                    afterImage="/examples/watermark-after.png"
                    beforeLabel={t('home.showcase.before')}
                    afterLabel={t('home.showcase.after')}
                    beforeAlt="Image with watermark"
                    afterAlt="Image without watermark"
                  />
                </div>
                <div className="effect-info">
                  <h3>{t('home.tools.watermark.title')}</h3>
                  <p>{t('home.tools.watermark.shortDesc')}</p>
                  <Link to={langLink('/remove-watermark')} className="effect-btn">
                    {t('common.useNow')}
                  </Link>
                </div>
              </div>

              {/* Change Background */}
              <div id="section-background" className="effect-item">
                <div className="effect-preview">
                  <BeforeAfterSlider
                    beforeImage="/examples/background-before.png"
                    afterImage="/examples/background-after.png"
                    beforeLabel={t('home.showcase.before')}
                    afterLabel={t('home.showcase.after')}
                    beforeAlt="Image with original background"
                    afterAlt="Image with new background"
                  />
                </div>
                <div className="effect-info">
                  <h3>{t('home.tools.background.title')}</h3>
                  <p>{t('home.tools.background.shortDesc')}</p>
                  <Link to={langLink('/change-background')} className="effect-btn">
                    {t('common.useNow')}
                  </Link>
                </div>
              </div>

              {/* Remove Fake Transparency */}
              <div id="section-transparency" className="effect-item">
                <div className="effect-preview">
                  <BeforeAfterSlider
                    beforeImage="/examples/transparency-before.png"
                    afterImage="/examples/transparency-after.png"
                    beforeLabel={t('home.showcase.before')}
                    afterLabel={t('home.showcase.after')}
                    beforeAlt={t('home.showcase.transparency.beforeAlt')}
                    afterAlt={t('home.showcase.transparency.afterAlt')}
                  />
                </div>
                <div className="effect-info">
                  <h3>{t('home.tools.removeFakeTransparency.title')}</h3>
                  <p>{t('home.tools.removeFakeTransparency.shortDesc')}</p>
                  <Link to={langLink('/remove-fake-transparency')} className="effect-btn">
                    {t('common.useNow')}
                  </Link>
                </div>
              </div>

              {/* Compress */}
              <div id="section-compress" className="effect-item">
                <div className="effect-preview">
                  <BeforeAfterSlider
                    beforeImage="/examples/compress-before.png"
                    afterImage="/examples/compress-after.webp"
                    beforeLabel="470 KB"
                    afterLabel="6 KB"
                    beforeAlt={t('home.showcase.compress.beforeAlt')}
                    afterAlt={t('home.showcase.compress.afterAlt')}
                  />
                </div>
                <div className="effect-info">
                  <h3>{t('home.tools.compress.title')}</h3>
                  <p>{t('home.tools.compress.shortDesc')}</p>
                  <Link to={langLink('/compress')} className="effect-btn">
                    {t('common.useNow')}
                  </Link>
                </div>
              </div>

              {/* Resize */}
              <div id="section-resize" className="effect-item">
                <div className="effect-preview">
                  <BeforeAfterSlider
                    beforeImage="/examples/resize-before.png"
                    afterImage="/examples/resize-after.png"
                    beforeLabel="1200×800"
                    afterLabel="600×400"
                    beforeAlt={t('home.showcase.resize.beforeAlt')}
                    afterAlt={t('home.showcase.resize.afterAlt')}
                  />
                </div>
                <div className="effect-info">
                  <h3>{t('home.tools.resize.title')}</h3>
                  <p>{t('home.tools.resize.shortDesc')}</p>
                  <Link to={langLink('/resize')} className="effect-btn">
                    {t('common.useNow')}
                  </Link>
                </div>
              </div>
            </section>

            {/* Features - compact */}
            <section className="features-compact">
              <div className="features-row">
                <div className="feature-badge">
                  <span>🔒</span>
                  <span>{t('home.features.privacy.title')}</span>
                </div>
                <div className="feature-badge">
                  <span>⚡</span>
                  <span>{t('home.features.fast.title')}</span>
                </div>
                <div className="feature-badge">
                  <span>💰</span>
                  <span>{t('home.features.free.title')}</span>
                </div>
                <div className="feature-badge">
                  <span>📱</span>
                  <span>{t('home.features.crossPlatform.title')}</span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  )
}
