import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface FooterProps {
  lang: string | undefined
}

export function Footer({ lang }: FooterProps) {
  const { t } = useTranslation()

  return (
    <footer className="footer">
      <p>{t('app.footer')}</p>
      <Link to={`/${lang || 'en'}/blog`} className="footer-blog-link">
        Blog
      </Link>
    </footer>
  )
}
