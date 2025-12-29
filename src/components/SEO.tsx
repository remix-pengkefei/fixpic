import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { languages } from '../i18n'

interface SEOProps {
  title: string
  description: string
  keywords?: string
  canonicalUrl?: string
}

// Map language codes to Open Graph locale format
const ogLocaleMap: Record<string, string> = {
  'en': 'en_US',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
  'ja': 'ja_JP',
  'ko': 'ko_KR',
  'es': 'es_ES',
  'pt': 'pt_BR',
  'fr': 'fr_FR',
  'de': 'de_DE',
  'ru': 'ru_RU',
  'it': 'it_IT',
  'id': 'id_ID',
  'vi': 'vi_VN',
  'th': 'th_TH',
  'tr': 'tr_TR',
}

export function SEO({ title, description, keywords, canonicalUrl }: SEOProps) {
  const { i18n } = useTranslation()
  const currentLang = i18n.language

  useEffect(() => {
    // Update HTML lang attribute
    document.documentElement.lang = currentLang

    // Update document title
    document.title = title

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', description)

    // Update meta keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', keywords)
    }

    // Update canonical URL
    if (canonicalUrl) {
      let linkCanonical = document.querySelector('link[rel="canonical"]')
      if (!linkCanonical) {
        linkCanonical = document.createElement('link')
        linkCanonical.setAttribute('rel', 'canonical')
        document.head.appendChild(linkCanonical)
      }
      linkCanonical.setAttribute('href', canonicalUrl)
    }

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    updateOGTag('og:title', title)
    updateOGTag('og:description', description)
    updateOGTag('og:type', 'website')
    updateOGTag('og:locale', ogLocaleMap[currentLang] || 'en_US')
    if (canonicalUrl) {
      updateOGTag('og:url', canonicalUrl)
    }

    // Add alternate locale tags for other languages
    languages.forEach(lang => {
      if (lang.code !== currentLang) {
        const locale = ogLocaleMap[lang.code]
        if (locale) {
          let tag = document.querySelector(`meta[property="og:locale:alternate"][content="${locale}"]`)
          if (!tag) {
            tag = document.createElement('meta')
            tag.setAttribute('property', 'og:locale:alternate')
            tag.setAttribute('content', locale)
            document.head.appendChild(tag)
          }
        }
      }
    })

    // Add hreflang alternate links for SEO
    // First, remove existing hreflang links
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove())

    // Add hreflang links for all languages
    if (canonicalUrl) {
      const baseUrl = canonicalUrl.replace(/\/$/, '')

      languages.forEach(lang => {
        const link = document.createElement('link')
        link.setAttribute('rel', 'alternate')
        link.setAttribute('hreflang', lang.code)
        link.setAttribute('href', `${baseUrl}?lang=${lang.code}`)
        document.head.appendChild(link)
      })

      // Add x-default hreflang
      const defaultLink = document.createElement('link')
      defaultLink.setAttribute('rel', 'alternate')
      defaultLink.setAttribute('hreflang', 'x-default')
      defaultLink.setAttribute('href', baseUrl)
      document.head.appendChild(defaultLink)
    }

    // Update Twitter Card tags
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    updateTwitterTag('twitter:card', 'summary_large_image')
    updateTwitterTag('twitter:title', title)
    updateTwitterTag('twitter:description', description)

  }, [title, description, keywords, canonicalUrl, currentLang])

  return null
}
