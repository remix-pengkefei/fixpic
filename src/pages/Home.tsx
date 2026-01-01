import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { BeforeAfterSlider } from '../components/BeforeAfterSlider'
import { languages } from '../i18n'
import { useAuth } from '../contexts/AuthContext'

// Tool category types
type CategoryKey = 'remove' | 'enhance' | 'generate' | 'edit'

interface Tool {
  path: string
  icon: string
  nameKey: string
  descKey: string
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
}

// Tools organized by category
const toolsByCategory: Record<CategoryKey, Tool[]> = {
  remove: [
    {
      path: '/background-remover',
      icon: '🎨',
      nameKey: 'nav.bgRemover',
      descKey: 'home.tools.bgRemover.shortDesc',
      beforeImage: '/examples/background-before.png',
      afterImage: '/examples/background-after.png',
    },
    {
      path: '/watermark-remover',
      icon: '💧',
      nameKey: 'nav.watermarkRemover',
      descKey: 'home.tools.watermarkRemover.shortDesc',
      beforeImage: '/examples/watermark-before.webp',
      afterImage: '/examples/watermark-after.png',
    },
    {
      path: '/remove-fake-transparency',
      icon: '🔲',
      nameKey: 'nav.removeFakeTransparency',
      descKey: 'home.tools.removeFakeTransparency.shortDesc',
      beforeImage: '/examples/transparency-before.webp',
      afterImage: '/examples/transparency-after.webp',
    },
  ],
  enhance: [
    {
      path: '/image-upscaler',
      icon: '🔍',
      nameKey: 'nav.upscaler',
      descKey: 'home.tools.upscaler.shortDesc',
      beforeImage: '/examples/upscaler-before.webp',
      afterImage: '/examples/upscaler-after.webp',
    },
    {
      path: '/image-sharpener',
      icon: '🔬',
      nameKey: 'nav.sharpener',
      descKey: 'home.tools.sharpener.shortDesc',
      beforeImage: '/examples/sharpener-before.webp',
      afterImage: '/examples/sharpener-after.webp',
    },
    {
      path: '/image-denoiser',
      icon: '🔇',
      nameKey: 'nav.denoiser',
      descKey: 'home.tools.denoiser.shortDesc',
      beforeImage: '/examples/denoiser-before.webp',
      afterImage: '/examples/denoiser-after.webp',
    },
  ],
  generate: [
    {
      path: '/background-generator',
      icon: '✨',
      nameKey: 'nav.bgGenerator',
      descKey: 'home.tools.bgGenerator.shortDesc',
      beforeImage: '/examples/bg-generator-before.png',
      afterImage: '/examples/bg-generator-after.png',
    },
    {
      path: '/shadow-generator',
      icon: '🌓',
      nameKey: 'nav.shadowGen',
      descKey: 'home.tools.shadowGen.shortDesc',
      beforeImage: '/examples/shadow-before.png',
      afterImage: '/examples/shadow-after.png',
    },
    {
      path: '/image-extender',
      icon: '↔️',
      nameKey: 'nav.extender',
      descKey: 'home.tools.extender.shortDesc',
      beforeImage: '/examples/extender-before.webp',
      afterImage: '/examples/extender-after.webp',
    },
  ],
  edit: [
    {
      path: '/smart-crop',
      icon: '✂️',
      nameKey: 'nav.smartCrop',
      descKey: 'home.tools.smartCrop.shortDesc',
      beforeImage: '/examples/smartcrop-before.webp',
      afterImage: '/examples/smartcrop-after.webp',
    },
    {
      path: '/compress',
      icon: '📦',
      nameKey: 'nav.compress',
      descKey: 'home.tools.compress.shortDesc',
      beforeImage: '/examples/compress-before.webp',
      afterImage: '/examples/compress-after.webp',
      beforeLabel: '470 KB',
      afterLabel: '6 KB',
    },
    {
      path: '/resize',
      icon: '📐',
      nameKey: 'nav.resize',
      descKey: 'home.tools.resize.shortDesc',
      beforeImage: '/examples/resize-before.webp',
      afterImage: '/examples/resize-after.webp',
      beforeLabel: '1200×800',
      afterLabel: '600×400',
    },
  ],
}

const categories: { key: CategoryKey; icon: string; labelKey: string }[] = [
  { key: 'remove', icon: '🎨', labelKey: 'home.category.remove' },
  { key: 'enhance', icon: '✨', labelKey: 'home.category.enhance' },
  { key: 'generate', icon: '🖼️', labelKey: 'home.category.generate' },
  { key: 'edit', icon: '📐', labelKey: 'home.category.edit' },
]

export function Home() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { user } = useAuth()
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('remove')

  // Get current language from URL
  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'

  const langLink = (path: string) => `/${currentLang}${path}`

  // Get all tools for quick access grid
  const allTools = Object.values(toolsByCategory).flat()

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
        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">{t('home.hero.title')}</h1>
          <p className="hero-subtitle">{t('home.hero.desc')}</p>
        </section>

        {/* Category Tabs */}
        <section className="category-section">
          <div className="category-tabs">
            {categories.map(cat => (
              <button
                key={cat.key}
                className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-label">
                  {t(cat.labelKey, cat.key === 'remove' ? 'AI Remove' :
                    cat.key === 'enhance' ? 'AI Enhance' :
                    cat.key === 'generate' ? 'AI Generate' : 'Edit Tools')}
                </span>
              </button>
            ))}
          </div>

          {/* Tools in active category */}
          <div className="category-tools">
            {toolsByCategory[activeCategory].map(tool => (
              <Link key={tool.path} to={langLink(tool.path)} className="tool-item">
                <div className="tool-item-preview">
                  <BeforeAfterSlider
                    beforeImage={tool.beforeImage}
                    afterImage={tool.afterImage}
                    beforeLabel={tool.beforeLabel || t('home.showcase.before')}
                    afterLabel={tool.afterLabel || t('home.showcase.after')}
                    beforeAlt={`${t(tool.nameKey)} - Before`}
                    afterAlt={`${t(tool.nameKey)} - After`}
                  />
                </div>
                <div className="tool-item-info">
                  <span className="tool-item-icon">{tool.icon}</span>
                  <h3 className="tool-item-name">{t(tool.nameKey)}</h3>
                  <p className="tool-item-desc">{t(tool.descKey)}</p>
                  <span className="tool-item-cta">{t('common.useNow', 'Use Now')} →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Access Grid - All Tools */}
        <section className="quick-access-section">
          <h2 className="section-title">{t('home.allTools', 'All Tools')}</h2>
          <div className="quick-access-grid">
            {allTools.map(tool => (
              <Link key={tool.path} to={langLink(tool.path)} className="quick-tool">
                <span className="quick-tool-icon">{tool.icon}</span>
                <span className="quick-tool-name">{t(tool.nameKey)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Features Section */}
        {!user && (
          <section className="features-section">
            <div className="features-list">
              <div className="feature-badge">
                <span className="feature-icon">🔒</span>
                <div className="feature-text">
                  <span className="feature-title">{t('home.features.privacy.title')}</span>
                  <span className="feature-desc">{t('home.features.privacy.desc', 'Your images are processed securely')}</span>
                </div>
              </div>
              <div className="feature-badge">
                <span className="feature-icon">⚡</span>
                <div className="feature-text">
                  <span className="feature-title">{t('home.features.fast.title')}</span>
                  <span className="feature-desc">{t('home.features.fast.desc', 'Process in seconds with AI')}</span>
                </div>
              </div>
              <div className="feature-badge">
                <span className="feature-icon">💰</span>
                <div className="feature-text">
                  <span className="feature-title">{t('home.features.free.title')}</span>
                  <span className="feature-desc">{t('home.features.free.desc', 'Free to use, no hidden fees')}</span>
                </div>
              </div>
              <div className="feature-badge">
                <span className="feature-icon">📱</span>
                <div className="feature-text">
                  <span className="feature-title">{t('home.features.crossPlatform.title')}</span>
                  <span className="feature-desc">{t('home.features.crossPlatform.desc', 'Works on any device')}</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
