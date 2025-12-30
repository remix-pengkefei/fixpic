import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SEO } from '../../components/SEO'
import { StructuredData } from '../../components/StructuredData'

export function RemoveAICheckerboard() {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language
  const langLink = (path: string) => `/${currentLang}${path}`

  return (
    <>
      <SEO
        title={t('guides.aiCheckerboard.seo.title')}
        description={t('guides.aiCheckerboard.seo.description')}
        keywords={t('guides.aiCheckerboard.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}/guides/remove-ai-checkerboard`}
        ogImage="/og-remove-transparency.png"
      />
      <StructuredData type="removeFakeTransparency" />

      <div className="guide-page">
        <article className="guide-content">
          <h1>{t('guides.aiCheckerboard.title')}</h1>

          <section className="guide-intro">
            <p>{t('guides.aiCheckerboard.intro')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.aiCheckerboard.whatIs.title')}</h2>
            <p>{t('guides.aiCheckerboard.whatIs.content')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.aiCheckerboard.whyHappens.title')}</h2>
            <p>{t('guides.aiCheckerboard.whyHappens.content')}</p>
          </section>

          <section className="guide-section">
            <h2>{t('guides.aiCheckerboard.howToFix.title')}</h2>
            <ol className="guide-steps">
              <li>{t('guides.aiCheckerboard.howToFix.step1')}</li>
              <li>{t('guides.aiCheckerboard.howToFix.step2')}</li>
              <li>{t('guides.aiCheckerboard.howToFix.step3')}</li>
              <li>{t('guides.aiCheckerboard.howToFix.step4')}</li>
            </ol>
          </section>

          <section className="guide-section">
            <h2>{t('guides.aiCheckerboard.tools.title')}</h2>
            <p>{t('guides.aiCheckerboard.tools.content')}</p>
            <ul className="guide-tools-list">
              <li>Midjourney</li>
              <li>DALL-E</li>
              <li>Stable Diffusion</li>
              <li>Leonardo AI</li>
              <li>Lovart</li>
            </ul>
          </section>

          <div className="guide-cta">
            <Link to={langLink('/remove-fake-transparency')} className="cta-button">
              {t('guides.aiCheckerboard.cta')}
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}
