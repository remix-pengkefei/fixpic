import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SEO } from '../../components/SEO'
import { StructuredData } from '../../components/StructuredData'

export function BatchCompress() {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language
  const langLink = (path: string) => `/${currentLang}${path}`

  return (
    <>
      <SEO
        title={t('guides.batchCompress.seo.title')}
        description={t('guides.batchCompress.seo.description')}
        keywords={t('guides.batchCompress.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}/guides/batch-compress`}
        ogImage="/og-compress.png"
      />
      <StructuredData type="compress" />

      <div className="guide-page">
        <article className="guide-content">
          <h1>{t('guides.batchCompress.title')}</h1>

          <section className="guide-intro">
            <p>{t('guides.batchCompress.intro')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.batchCompress.whyBatch.title')}</h2>
            <ul className="guide-benefits-list">
              <li>{t('guides.batchCompress.whyBatch.reason1')}</li>
              <li>{t('guides.batchCompress.whyBatch.reason2')}</li>
              <li>{t('guides.batchCompress.whyBatch.reason3')}</li>
              <li>{t('guides.batchCompress.whyBatch.reason4')}</li>
            </ul>
          </section>

          <section className="guide-section">
            <h2>{t('guides.batchCompress.howTo.title')}</h2>
            <ol className="guide-steps">
              <li>{t('guides.batchCompress.howTo.step1')}</li>
              <li>{t('guides.batchCompress.howTo.step2')}</li>
              <li>{t('guides.batchCompress.howTo.step3')}</li>
              <li>{t('guides.batchCompress.howTo.step4')}</li>
              <li>{t('guides.batchCompress.howTo.step5')}</li>
            </ol>
          </section>

          <section className="guide-section">
            <h2>{t('guides.batchCompress.tips.title')}</h2>
            <ul className="guide-benefits-list">
              <li>{t('guides.batchCompress.tips.tip1')}</li>
              <li>{t('guides.batchCompress.tips.tip2')}</li>
              <li>{t('guides.batchCompress.tips.tip3')}</li>
              <li>{t('guides.batchCompress.tips.tip4')}</li>
            </ul>
          </section>

          <div className="guide-cta">
            <Link to={langLink('/compress')} className="cta-button">
              {t('guides.batchCompress.cta')}
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}
