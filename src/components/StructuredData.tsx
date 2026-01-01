import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface StructuredDataProps {
  type: 'home' | 'removeFakeTransparency' | 'compress' | 'resize' | 'removeWatermark'
}

export function StructuredData({ type }: StructuredDataProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  useEffect(() => {
    // Remove existing structured data
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove())

    const scripts: object[] = []

    // WebSite schema (for all pages)
    scripts.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "FixPic",
      "url": "https://fix-pic.com",
      "description": t('home.seo.description'),
      "inLanguage": lang,
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://fix-pic.com/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    })

    // Organization schema
    scripts.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "FixPic",
      "url": "https://fix-pic.com",
      "logo": "https://fix-pic.com/logo.png",
      "sameAs": []
    })

    if (type === 'home') {
      // SoftwareApplication schema for the main site
      scripts.push({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "FixPic",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": t('home.seo.description'),
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "1000"
        }
      })

      // FAQPage schema
      scripts.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": t('home.faq.q1.question'),
            "acceptedAnswer": {
              "@type": "Answer",
              "text": t('home.faq.q1.answer')
            }
          },
          {
            "@type": "Question",
            "name": t('home.faq.q2.question'),
            "acceptedAnswer": {
              "@type": "Answer",
              "text": t('home.faq.q2.answer')
            }
          },
          {
            "@type": "Question",
            "name": t('home.faq.q3.question'),
            "acceptedAnswer": {
              "@type": "Answer",
              "text": t('home.faq.q3.answer')
            }
          },
          {
            "@type": "Question",
            "name": t('home.faq.q4.question'),
            "acceptedAnswer": {
              "@type": "Answer",
              "text": t('home.faq.q4.answer')
            }
          }
        ]
      })
    }

    if (type === 'removeFakeTransparency') {
      // HowTo schema for Remove Fake Transparency
      scripts.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": t('removeFakeTransparency.title'),
        "description": t('removeFakeTransparency.desc'),
        "image": "https://fix-pic.com/og-remove-transparency.png",
        "totalTime": "PT1M",
        "tool": {
          "@type": "HowToTool",
          "name": "FixPic Remove Fake Transparency Tool"
        },
        "step": [
          {
            "@type": "HowToStep",
            "name": t('removeFakeTransparency.instructions.step1'),
            "text": t('removeFakeTransparency.instructions.step1'),
            "position": 1
          },
          {
            "@type": "HowToStep",
            "name": t('removeFakeTransparency.instructions.step2'),
            "text": t('removeFakeTransparency.instructions.step2'),
            "position": 2
          },
          {
            "@type": "HowToStep",
            "name": t('removeFakeTransparency.instructions.step3'),
            "text": t('removeFakeTransparency.instructions.step3'),
            "position": 3
          }
        ]
      })

      // SoftwareApplication for this specific tool
      scripts.push({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": t('removeFakeTransparency.title') + " - FixPic",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": t('removeFakeTransparency.seo.description')
      })
    }

    if (type === 'compress') {
      // HowTo schema for Compress
      scripts.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": t('compress.title'),
        "description": t('compress.desc'),
        "image": "https://fix-pic.com/og-compress.png",
        "totalTime": "PT1M",
        "tool": {
          "@type": "HowToTool",
          "name": "FixPic Image Compression Tool"
        },
        "step": [
          {
            "@type": "HowToStep",
            "name": t('compress.instructions.step1'),
            "text": t('compress.instructions.step1'),
            "position": 1
          },
          {
            "@type": "HowToStep",
            "name": t('compress.instructions.step2'),
            "text": t('compress.instructions.step2'),
            "position": 2
          },
          {
            "@type": "HowToStep",
            "name": t('compress.instructions.step3'),
            "text": t('compress.instructions.step3'),
            "position": 3
          },
          {
            "@type": "HowToStep",
            "name": t('compress.instructions.step4'),
            "text": t('compress.instructions.step4'),
            "position": 4
          }
        ]
      })

      // SoftwareApplication for compress tool
      scripts.push({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": t('compress.title') + " - FixPic",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": t('compress.seo.description')
      })
    }

    if (type === 'resize') {
      // HowTo schema for Resize
      scripts.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": t('resize.title'),
        "description": t('resize.desc'),
        "image": "https://fix-pic.com/og-resize.png",
        "totalTime": "PT1M",
        "tool": {
          "@type": "HowToTool",
          "name": "FixPic Image Resize Tool"
        },
        "step": [
          {
            "@type": "HowToStep",
            "name": t('resize.instructions.step1'),
            "text": t('resize.instructions.step1'),
            "position": 1
          },
          {
            "@type": "HowToStep",
            "name": t('resize.instructions.step2'),
            "text": t('resize.instructions.step2'),
            "position": 2
          },
          {
            "@type": "HowToStep",
            "name": t('resize.instructions.step3'),
            "text": t('resize.instructions.step3'),
            "position": 3
          },
          {
            "@type": "HowToStep",
            "name": t('resize.instructions.step4'),
            "text": t('resize.instructions.step4'),
            "position": 4
          }
        ]
      })

      // SoftwareApplication for resize tool
      scripts.push({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": t('resize.title') + " - FixPic",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": t('resize.seo.description')
      })
    }

    if (type === 'removeWatermark') {
      // HowTo schema for Remove Watermark
      scripts.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": t('watermark.title'),
        "description": t('watermark.desc'),
        "image": "https://fix-pic.com/og-watermark.png",
        "totalTime": "PT2M",
        "tool": {
          "@type": "HowToTool",
          "name": "FixPic AI Watermark Remover"
        },
        "step": [
          {
            "@type": "HowToStep",
            "name": t('watermark.instructions.step1'),
            "text": t('watermark.instructions.step1'),
            "position": 1
          },
          {
            "@type": "HowToStep",
            "name": t('watermark.instructions.step2'),
            "text": t('watermark.instructions.step2'),
            "position": 2
          },
          {
            "@type": "HowToStep",
            "name": t('watermark.instructions.step3'),
            "text": t('watermark.instructions.step3'),
            "position": 3
          }
        ]
      })

      // SoftwareApplication for watermark removal tool
      scripts.push({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": t('watermark.title') + " - FixPic",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": t('watermark.seo.description'),
        "featureList": [
          "AI-powered watermark detection",
          "Automatic text recognition (OCR)",
          "High-quality image restoration",
          "Support for multiple languages"
        ]
      })
    }

    // Add BreadcrumbList for non-home pages
    if (type !== 'home') {
      const breadcrumbMap: Record<string, { name: string; url: string }> = {
        'removeFakeTransparency': {
          name: t('nav.removeFakeTransparency'),
          url: 'https://fix-pic.com/remove-fake-transparency'
        },
        'compress': {
          name: t('nav.compress'),
          url: 'https://fix-pic.com/compress'
        },
        'resize': {
          name: t('nav.resize'),
          url: 'https://fix-pic.com/resize'
        },
        'removeWatermark': {
          name: t('nav.removeWatermark'),
          url: 'https://fix-pic.com/remove-watermark'
        }
      }

      const current = breadcrumbMap[type]
      if (current) {
        scripts.push({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "FixPic",
              "item": "https://fix-pic.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": current.name,
              "item": current.url
            }
          ]
        })
      }
    }

    // Insert all scripts
    scripts.forEach(data => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(data)
      document.head.appendChild(script)
    })

    return () => {
      document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove())
    }
  }, [type, t, lang])

  return null
}
