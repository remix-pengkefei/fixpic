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
        ogImage="/og-image.png"
      />
      <StructuredData type="home" />

      <div className="home-page">
        {/* Hero Section */}
        <section className="hero">
          <h1>{t('home.hero.title')}</h1>
          <p className="hero-desc">{t('home.hero.desc')}</p>
        </section>

        {/* All Tools Section */}
        <section className="tools-section">
          <h2>{t('nav.tools', 'Tools')}</h2>
          <div className="tool-cards-grid">
            <Link to={langLink('/background-remover')} className="tool-card">
              <span className="tool-card-icon">🎨</span>
              <span className="tool-card-name">{t('nav.bgRemover', 'Background Remover')}</span>
              <span className="tool-card-desc">{t('home.tools.bgRemover.shortDesc', 'Remove image backgrounds with AI')}</span>
            </Link>
            <Link to={langLink('/image-upscaler')} className="tool-card">
              <span className="tool-card-icon">🔍</span>
              <span className="tool-card-name">{t('nav.upscaler', 'Image Upscaler')}</span>
              <span className="tool-card-desc">{t('home.tools.upscaler.shortDesc', 'Enlarge images up to 4x')}</span>
            </Link>
            <Link to={langLink('/watermark-remover')} className="tool-card">
              <span className="tool-card-icon">💧</span>
              <span className="tool-card-name">{t('nav.watermarkRemover', 'Watermark Remover')}</span>
              <span className="tool-card-desc">{t('home.tools.watermarkRemover.shortDesc', 'Remove watermarks and logos')}</span>
            </Link>
            <Link to={langLink('/background-generator')} className="tool-card">
              <span className="tool-card-icon">✨</span>
              <span className="tool-card-name">{t('nav.bgGenerator', 'Background Generator')}</span>
              <span className="tool-card-desc">{t('home.tools.bgGenerator.shortDesc', 'Generate AI backgrounds')}</span>
            </Link>
            <Link to={langLink('/image-sharpener')} className="tool-card">
              <span className="tool-card-icon">🔬</span>
              <span className="tool-card-name">{t('nav.sharpener', 'Image Sharpener')}</span>
              <span className="tool-card-desc">{t('home.tools.sharpener.shortDesc', 'Sharpen blurry images')}</span>
            </Link>
            <Link to={langLink('/image-denoiser')} className="tool-card">
              <span className="tool-card-icon">🔇</span>
              <span className="tool-card-name">{t('nav.denoiser', 'Image Denoiser')}</span>
              <span className="tool-card-desc">{t('home.tools.denoiser.shortDesc', 'Remove noise and artifacts')}</span>
            </Link>
            <Link to={langLink('/shadow-generator')} className="tool-card">
              <span className="tool-card-icon">🌓</span>
              <span className="tool-card-name">{t('nav.shadowGen', 'Shadow Generator')}</span>
              <span className="tool-card-desc">{t('home.tools.shadowGen.shortDesc', 'Add realistic shadows')}</span>
            </Link>
            <Link to={langLink('/smart-crop')} className="tool-card">
              <span className="tool-card-icon">✂️</span>
              <span className="tool-card-name">{t('nav.smartCrop', 'Smart Crop')}</span>
              <span className="tool-card-desc">{t('home.tools.smartCrop.shortDesc', 'AI-powered smart cropping')}</span>
            </Link>
            <Link to={langLink('/image-extender')} className="tool-card">
              <span className="tool-card-icon">↔️</span>
              <span className="tool-card-name">{t('nav.extender', 'Image Extender')}</span>
              <span className="tool-card-desc">{t('home.tools.extender.shortDesc', 'Extend image borders')}</span>
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
      </div>
    </>
  )
}
