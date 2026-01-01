import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SEO } from '../../components/SEO'
import { StructuredData } from '../../components/StructuredData'

export function RemoveWatermarkGuide() {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language
  const langLink = (path: string) => `/${currentLang}${path}`

  return (
    <>
      <SEO
        title={t('guides.removeWatermark.seo.title')}
        description={t('guides.removeWatermark.seo.description')}
        keywords={t('guides.removeWatermark.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}/guides/remove-watermark`}
        ogImage="/og-watermark.png"
      />
      <StructuredData type="removeWatermark" />

      <div className="guide-page">
        <article className="guide-content">
          <h1>{t('guides.removeWatermark.title')}</h1>

          <section className="guide-intro">
            <p>{t('guides.removeWatermark.intro')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.removeWatermark.whatIs.title')}</h2>
            <p>{t('guides.removeWatermark.whatIs.content')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.removeWatermark.howItWorks.title')}</h2>
            <p>{t('guides.removeWatermark.howItWorks.content')}</p>
            <ul className="guide-features-list">
              <li>{t('guides.removeWatermark.howItWorks.feature1')}</li>
              <li>{t('guides.removeWatermark.howItWorks.feature2')}</li>
              <li>{t('guides.removeWatermark.howItWorks.feature3')}</li>
            </ul>
          </section>

          <section className="guide-section">
            <h2>{t('guides.removeWatermark.steps.title')}</h2>
            <ol className="guide-steps">
              <li>{t('guides.removeWatermark.steps.step1')}</li>
              <li>{t('guides.removeWatermark.steps.step2')}</li>
              <li>{t('guides.removeWatermark.steps.step3')}</li>
              <li>{t('guides.removeWatermark.steps.step4')}</li>
            </ol>
          </section>

          <section className="guide-section">
            <h2>{t('guides.removeWatermark.bestFor.title')}</h2>
            <p>{t('guides.removeWatermark.bestFor.content')}</p>
            <ul className="guide-tools-list">
              <li>{t('guides.removeWatermark.bestFor.item1')}</li>
              <li>{t('guides.removeWatermark.bestFor.item2')}</li>
              <li>{t('guides.removeWatermark.bestFor.item3')}</li>
              <li>{t('guides.removeWatermark.bestFor.item4')}</li>
            </ul>
          </section>

          <section className="guide-section">
            <h2>{t('guides.removeWatermark.tips.title')}</h2>
            <ul className="guide-tips-list">
              <li>{t('guides.removeWatermark.tips.tip1')}</li>
              <li>{t('guides.removeWatermark.tips.tip2')}</li>
              <li>{t('guides.removeWatermark.tips.tip3')}</li>
            </ul>
          </section>

          <div className="guide-cta">
            <Link to={langLink('/remove-watermark')} className="cta-button">
              {t('guides.removeWatermark.cta')}
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}
