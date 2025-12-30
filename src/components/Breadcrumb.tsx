import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { languages } from '../i18n'

interface BreadcrumbItem {
  label: string
  path?: string
}

export function Breadcrumb() {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  // Get current language from URL
  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'

  // Generate breadcrumb items based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'FixPic', path: `/${currentLang}` }
    ]

    // Get path without language prefix
    const pathWithoutLang = pathParts.slice(1)

    if (pathWithoutLang.length === 0) {
      return items
    }

    const firstSegment = pathWithoutLang[0]

    switch (firstSegment) {
      case 'remove-fake-transparency':
        items.push({ label: t('nav.removeFakeTransparency') })
        break
      case 'compress':
        items.push({ label: t('nav.compress') })
        break
      case 'resize':
        items.push({ label: t('nav.resize') })
        break
      case 'guides':
        items.push({ label: t('common.relatedGuides'), path: `/${currentLang}` })
        if (pathWithoutLang[1]) {
          switch (pathWithoutLang[1]) {
            case 'remove-ai-checkerboard':
              items.push({ label: t('guides.aiCheckerboard.title') })
              break
            case 'compress-without-quality-loss':
              items.push({ label: t('guides.compressQuality.title') })
              break
            case 'convert-to-webp':
              items.push({ label: t('guides.convertWebp.title') })
              break
          }
        }
        break
    }

    return items
  }

  const breadcrumbs = getBreadcrumbs()

  // Don't show breadcrumb on home page
  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list" itemScope itemType="https://schema.org/BreadcrumbList">
        {breadcrumbs.map((item, index) => (
          <li
            key={index}
            className="breadcrumb-item"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {item.path && index < breadcrumbs.length - 1 ? (
              <>
                <Link to={item.path} itemProp="item">
                  <span itemProp="name">{item.label}</span>
                </Link>
                <meta itemProp="position" content={String(index + 1)} />
                <span className="breadcrumb-separator">/</span>
              </>
            ) : (
              <>
                <span itemProp="name" className="breadcrumb-current">{item.label}</span>
                <meta itemProp="position" content={String(index + 1)} />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
