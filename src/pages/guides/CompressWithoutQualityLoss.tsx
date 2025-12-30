import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SEO } from '../../components/SEO'
import { StructuredData } from '../../components/StructuredData'

export function CompressWithoutQualityLoss() {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language
  const langLink = (path: string) => `/${currentLang}${path}`

  return (
    <>
      <SEO
        title={t('guides.compressQuality.seo.title')}
        description={t('guides.compressQuality.seo.description')}
        keywords={t('guides.compressQuality.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}/guides/compress-without-quality-loss`}
        ogImage="/og-compress.png"
      />
      <StructuredData type="compress" />

      <div className="guide-page">
        <article className="guide-content">
          <h1>{t('guides.compressQuality.title')}</h1>

          <section className="guide-intro">
            <p>{t('guides.compressQuality.intro')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.compressQuality.whyCompress.title')}</h2>
            <p>{t('guides.compressQuality.whyCompress.content')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.compressQuality.formats.title')}</h2>
            <ul className="guide-format-list">
              <li>
                <strong>WebP</strong> - {t('guides.compressQuality.formats.webp')}
              </li>
              <li>
                <strong>PNG</strong> - {t('guides.compressQuality.formats.png')}
              </li>
              <li>
                <strong>JPEG</strong> - {t('guides.compressQuality.formats.jpeg')}
              </li>
            </ul>
          </section>

          <section className="guide-section">
            <h2>{t('guides.compressQuality.tips.title')}</h2>
            <ol className="guide-steps">
              <li>{t('guides.compressQuality.tips.tip1')}</li>
              <li>{t('guides.compressQuality.tips.tip2')}</li>
              <li>{t('guides.compressQuality.tips.tip3')}</li>
              <li>{t('guides.compressQuality.tips.tip4')}</li>
            </ol>
          </section>

          <section className="guide-section">
            <h2>{t('guides.compressQuality.benefits.title')}</h2>
            <ul className="guide-benefits-list">
              <li>{t('guides.compressQuality.benefits.benefit1')}</li>
              <li>{t('guides.compressQuality.benefits.benefit2')}</li>
              <li>{t('guides.compressQuality.benefits.benefit3')}</li>
              <li>{t('guides.compressQuality.benefits.benefit4')}</li>
            </ul>
          </section>

          <div className="guide-cta">
            <Link to={langLink('/compress')} className="cta-button">
              {t('guides.compressQuality.cta')}
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}
