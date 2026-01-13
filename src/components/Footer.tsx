import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="footer">
      <p>{t('app.footer')}</p>
    </footer>
  )
}
