import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SEO } from '../../components/SEO'
import { StructuredData } from '../../components/StructuredData'

export function MidjourneyTransparent() {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language
  const langLink = (path: string) => `/${currentLang}${path}`

  return (
    <>
      <SEO
        title={t('guides.midjourneyTransparent.seo.title')}
        description={t('guides.midjourneyTransparent.seo.description')}
        keywords={t('guides.midjourneyTransparent.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}/guides/midjourney-transparent`}
        ogImage="/og-remove-transparency.png"
      />
      <StructuredData type="removeFakeTransparency" />

      <div className="guide-page">
        <article className="guide-content">
          <h1>{t('guides.midjourneyTransparent.title')}</h1>

          <section className="guide-intro">
            <p>{t('guides.midjourneyTransparent.intro')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.midjourneyTransparent.problem.title')}</h2>
            <p>{t('guides.midjourneyTransparent.problem.content')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.midjourneyTransparent.why.title')}</h2>
            <p>{t('guides.midjourneyTransparent.why.content')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.midjourneyTransparent.solution.title')}</h2>
            <ol className="guide-steps">
              <li>{t('guides.midjourneyTransparent.solution.step1')}</li>
              <li>{t('guides.midjourneyTransparent.solution.step2')}</li>
              <li>{t('guides.midjourneyTransparent.solution.step3')}</li>
              <li>{t('guides.midjourneyTransparent.solution.step4')}</li>
            </ol>
          </section>

          <section className="guide-section">
            <h2>{t('guides.midjourneyTransparent.prompts.title')}</h2>
            <ul className="guide-benefits-list">
              <li>{t('guides.midjourneyTransparent.prompts.tip1')}</li>
              <li>{t('guides.midjourneyTransparent.prompts.tip2')}</li>
              <li>{t('guides.midjourneyTransparent.prompts.tip3')}</li>
              <li>{t('guides.midjourneyTransparent.prompts.tip4')}</li>
            </ul>
          </section>

          <div className="guide-cta">
            <Link to={langLink('/remove-fake-transparency')} className="cta-button">
              {t('guides.midjourneyTransparent.cta')}
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}
