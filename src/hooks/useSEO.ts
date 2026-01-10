import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tool } from '../types'
import { toolToUrl, supportedLangs } from '../types'

const toolNames: Record<string, { en: string; type: string }> = {
  'ai-remove-background': { en: 'AI Background Remover', type: 'ImageEditorApplication' },
  'remove-watermark': { en: 'AI Watermark Remover', type: 'ImageEditorApplication' },
  'remove-fake-transparency': { en: 'Fake Transparency Remover', type: 'ImageEditorApplication' },
  'compress': { en: 'Image Compressor', type: 'ImageEditorApplication' },
  'resize': { en: 'Image Resizer', type: 'ImageEditorApplication' }
}

export function useSEO(activeTool: Tool, lang: string | undefined) {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    const currentToolUrl = toolToUrl[activeTool]
    const toolTitle = t(`seo.tools.${currentToolUrl}.title`, { defaultValue: '' }) || t('seo.title')
    const toolDescription = t(`seo.tools.${currentToolUrl}.description`, { defaultValue: '' }) || t('seo.description')

    document.title = toolTitle

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', toolDescription)
    }

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', toolTitle)
    }

    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) {
      ogDescription.setAttribute('content', toolDescription)
    }

    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    if (twitterTitle) {
      twitterTitle.setAttribute('content', toolTitle)
    }

    const twitterDescription = document.querySelector('meta[name="twitter:description"]')
    if (twitterDescription) {
      twitterDescription.setAttribute('content', toolDescription)
    }

    document.documentElement.lang = lang || i18n.language

    const currentUrl = `https://fix-pic.com/${lang || 'en'}/${currentToolUrl}`
    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (canonicalLink) {
      canonicalLink.href = currentUrl
    }

    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) {
      ogUrl.setAttribute('content', currentUrl)
    }

    // 移除旧的 hreflang 标签
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove())

    // 添加新的 hreflang 标签
    supportedLangs.forEach(langCode => {
      const link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = langCode
      link.href = `https://fix-pic.com/${langCode}/${currentToolUrl}`
      document.head.appendChild(link)
    })

    // 添加 x-default
    const xDefaultLink = document.createElement('link')
    xDefaultLink.rel = 'alternate'
    xDefaultLink.hreflang = 'x-default'
    xDefaultLink.href = `https://fix-pic.com/en/${currentToolUrl}`
    document.head.appendChild(xDefaultLink)

    // 更新 JSON-LD 结构化数据
    const toolInfo = toolNames[currentToolUrl] || toolNames['ai-remove-background']

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': `${currentUrl}#app`,
          name: `FixPic - ${toolInfo.en}`,
          description: toolDescription,
          url: currentUrl,
          applicationCategory: toolInfo.type,
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          },
          provider: {
            '@type': 'Organization',
            name: 'FixPic',
            url: 'https://fix-pic.com'
          }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'FixPic',
              item: 'https://fix-pic.com'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: toolInfo.en,
              item: currentUrl
            }
          ]
        }
      ]
    }

    let jsonLdScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script')
      jsonLdScript.type = 'application/ld+json'
      document.head.appendChild(jsonLdScript)
    }
    jsonLdScript.textContent = JSON.stringify(jsonLd)
  }, [i18n.language, t, activeTool, lang])
}
