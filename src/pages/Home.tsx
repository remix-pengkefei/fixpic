import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { BeforeAfterSlider } from '../components/BeforeAfterSlider'
import { languages } from '../i18n'
import { useAuth } from '../contexts/AuthContext'

export function Home() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { user } = useAuth()

  // Get current language from URL
  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'

  const langLink = (path: string) => `/${currentLang}${path}`

  // All tools with their showcase images and anchor IDs
  const tools = [
    {
      path: '/background-remover',
      anchor: 'tool-background-remover',
      icon: '🎨',
      name: t('nav.bgRemover', 'Background Remover'),
      desc: t('home.tools.bgRemover.shortDesc', 'Remove image backgrounds with AI'),
      beforeImage: '/examples/background-before.png',
      afterImage: '/examples/background-after.png',
    },
    {
      path: '/image-upscaler',
      anchor: 'tool-image-upscaler',
      icon: '🔍',
      name: t('nav.upscaler', 'Image Upscaler'),
      desc: t('home.tools.upscaler.shortDesc', 'Enlarge images up to 4x'),
      beforeImage: '/examples/upscaler-before.webp',
      afterImage: '/examples/upscaler-after.webp',
    },
    {
      path: '/watermark-remover',
      anchor: 'tool-watermark-remover',
      icon: '💧',
      name: t('nav.watermarkRemover', 'Watermark Remover'),
      desc: t('home.tools.watermarkRemover.shortDesc', 'Remove watermarks and logos'),
      beforeImage: '/examples/watermark-before.webp',
      afterImage: '/examples/watermark-after.png',
    },
    {
      path: '/background-generator',
      anchor: 'tool-background-generator',
      icon: '✨',
      name: t('nav.bgGenerator', 'Background Generator'),
      desc: t('home.tools.bgGenerator.shortDesc', 'Generate AI backgrounds'),
      beforeImage: '/examples/bg-generator-before.png',
      afterImage: '/examples/bg-generator-after.png',
    },
    {
      path: '/image-sharpener',
      anchor: 'tool-image-sharpener',
      icon: '🔬',
      name: t('nav.sharpener', 'Image Sharpener'),
      desc: t('home.tools.sharpener.shortDesc', 'Sharpen blurry images'),
      beforeImage: '/examples/sharpener-before.webp',
      afterImage: '/examples/sharpener-after.webp',
    },
    {
      path: '/image-denoiser',
      anchor: 'tool-image-denoiser',
      icon: '🔇',
      name: t('nav.denoiser', 'Image Denoiser'),
      desc: t('home.tools.denoiser.shortDesc', 'Remove noise and artifacts'),
      beforeImage: '/examples/denoiser-before.webp',
      afterImage: '/examples/denoiser-after.webp',
    },
    {
      path: '/shadow-generator',
      anchor: 'tool-shadow-generator',
      icon: '🌓',
      name: t('nav.shadowGen', 'Shadow Generator'),
      desc: t('home.tools.shadowGen.shortDesc', 'Add realistic shadows'),
      beforeImage: '/examples/shadow-before.png',
      afterImage: '/examples/shadow-after.png',
    },
    {
      path: '/smart-crop',
      anchor: 'tool-smart-crop',
      icon: '✂️',
      name: t('nav.smartCrop', 'Smart Crop'),
      desc: t('home.tools.smartCrop.shortDesc', 'AI-powered smart cropping'),
      beforeImage: '/examples/smartcrop-before.webp',
      afterImage: '/examples/smartcrop-after.webp',
    },
    {
      path: '/image-extender',
      anchor: 'tool-image-extender',
      icon: '↔️',
      name: t('nav.extender', 'Image Extender'),
      desc: t('home.tools.extender.shortDesc', 'Extend image borders'),
      beforeImage: '/examples/extender-before.webp',
      afterImage: '/examples/extender-after.webp',
    },
    {
      path: '/remove-fake-transparency',
      anchor: 'tool-remove-fake-transparency',
      icon: '🔲',
      name: t('nav.removeFakeTransparency'),
      desc: t('home.tools.removeFakeTransparency.shortDesc', 'Remove checkerboard background'),
      beforeImage: '/examples/transparency-before.webp',
      afterImage: '/examples/transparency-after.webp',
    },
    {
      path: '/compress',
      anchor: 'tool-compress',
      icon: '📦',
      name: t('nav.compress'),
      desc: t('home.tools.compress.shortDesc', 'Compress & convert to WebP'),
      beforeImage: '/examples/compress-before.webp',
      afterImage: '/examples/compress-after.webp',
      beforeLabel: '470 KB',
      afterLabel: '6 KB',
    },
    {
      path: '/resize',
      anchor: 'tool-resize',
      icon: '📐',
      name: t('nav.resize'),
      desc: t('home.tools.resize.shortDesc', 'Resize images precisely'),
      beforeImage: '/examples/resize-before.webp',
      afterImage: '/examples/resize-after.webp',
      beforeLabel: '1200×800',
      afterLabel: '600×400',
    },
  ]

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
        <section className="hero">
          <h1>{t('home.hero.title')}</h1>
          <p className="hero-desc">{t('home.hero.desc')}</p>
        </section>

        {/* Tools Showcase */}
        {user ? (
          // Logged-in: Show tool cards grid
          <section className="tools-section">
            <h2>{t('nav.tools', 'Tools')}</h2>
            <div className="tool-cards-grid">
              {tools.map(tool => (
                <Link key={tool.path} to={langLink(tool.path)} className="tool-card">
                  <span className="tool-card-icon">{tool.icon}</span>
                  <span className="tool-card-name">{tool.name}</span>
                  <span className="tool-card-desc">{tool.desc}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          // Not logged-in: Show effect showcases with BeforeAfterSlider
          <section className="effects-showcase">
            {tools.map(tool => (
              <div key={tool.path} id={tool.anchor} className="effect-item">
                <div className="effect-preview">
                  <BeforeAfterSlider
                    beforeImage={tool.beforeImage}
                    afterImage={tool.afterImage}
                    beforeLabel={tool.beforeLabel || t('home.showcase.before')}
                    afterLabel={tool.afterLabel || t('home.showcase.after')}
                    beforeAlt={`${tool.name} - Before`}
                    afterAlt={`${tool.name} - After`}
                  />
                </div>
                <div className="effect-info">
                  <h3>{tool.name}</h3>
                  <p>{tool.desc}</p>
                  <Link to={langLink(tool.path)} className="effect-btn">
                    {t('common.useNow')}
                  </Link>
                </div>
              </div>
            ))}
          </section>
        )}

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
      </div>
    </>
  )
}
