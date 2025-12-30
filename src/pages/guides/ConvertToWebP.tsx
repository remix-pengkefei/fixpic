import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SEO } from '../../components/SEO'
import { StructuredData } from '../../components/StructuredData'

export function ConvertToWebP() {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language
  const langLink = (path: string) => `/${currentLang}${path}`

  return (
    <>
      <SEO
        title={t('guides.convertWebp.seo.title')}
        description={t('guides.convertWebp.seo.description')}
        keywords={t('guides.convertWebp.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}/guides/convert-to-webp`}
        ogImage="/og-compress.png"
      />
      <StructuredData type="compress" />

      <div className="guide-page">
        <article className="guide-content">
          <h1>{t('guides.convertWebp.title')}</h1>

          <section className="guide-intro">
            <p>{t('guides.convertWebp.intro')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.convertWebp.whatIs.title')}</h2>
            <p>{t('guides.convertWebp.whatIs.content')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.convertWebp.advantages.title')}</h2>
            <ul className="guide-benefits-list">
              <li>{t('guides.convertWebp.advantages.adv1')}</li>
              <li>{t('guides.convertWebp.advantages.adv2')}</li>
              <li>{t('guides.convertWebp.advantages.adv3')}</li>
              <li>{t('guides.convertWebp.advantages.adv4')}</li>
            </ul>
          </section>

          <section className="guide-section">
            <h2>{t('guides.convertWebp.howTo.title')}</h2>
            <ol className="guide-steps">
              <li>{t('guides.convertWebp.howTo.step1')}</li>
              <li>{t('guides.convertWebp.howTo.step2')}</li>
              <li>{t('guides.convertWebp.howTo.step3')}</li>
              <li>{t('guides.convertWebp.howTo.step4')}</li>
            </ol>
          </section>

          <section className="guide-section">
            <h2>{t('guides.convertWebp.compatibility.title')}</h2>
            <p>{t('guides.convertWebp.compatibility.content')}</p>
          </section>

          <div className="guide-cta">
            <Link to={langLink('/compress')} className="cta-button">
              {t('guides.convertWebp.cta')}
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}
