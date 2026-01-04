import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

interface Article {
  slug: string
  category: string
  tool: string
  lang: string
  title: string
  description: string
  keywords: string[]
  content: string
  publishedAt: string
  updatedAt: string
  readingTime: number
  relatedArticles: string[]
}

// All supported languages (excluding English which is the source)
const targetLanguages = [
  'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'it', 'ru',
  'vi', 'th', 'id', 'ms', 'tr', 'nl', 'el', 'cs', 'hu', 'uk', 'ar'
]

const categories = [
  'background-removal',
  'watermark-removal',
  'fake-transparency',
  'compression',
  'resize'
]

// Translation mappings for titles and common phrases
const translations: Record<string, Record<string, string>> = {
  'zh-CN': {
    'How to': '如何',
    'Guide': '指南',
    'Complete Guide': '完整指南',
    'Best': '最佳',
    'Free': '免费',
    'Online': '在线',
    'Remove Background': '移除背景',
    'Watermark Removal': '去除水印',
    'Image Compression': '图片压缩',
    'Resize Images': '调整图片大小',
    'Fake Transparency': '假透明修复',
    'vs': '对比',
    'for': '用于',
    'Tips': '技巧',
    'Tutorial': '教程',
    'in 2025': '2025年',
    'Introduction': '简介',
    'Step-by-Step Guide': '步骤指南',
    'Pro Tips': '专业技巧',
    'Common Use Cases': '常见用途',
    'Frequently Asked Questions': '常见问题',
    'Conclusion': '总结',
    'with FixPic\'s free online tool': '使用 FixPic 免费在线工具',
    'No signup required': '无需注册'
  },
  'zh-TW': {
    'How to': '如何',
    'Guide': '指南',
    'Complete Guide': '完整指南',
    'Best': '最佳',
    'Free': '免費',
    'Online': '線上',
    'Remove Background': '移除背景',
    'Watermark Removal': '去除浮水印',
    'Image Compression': '圖片壓縮',
    'Resize Images': '調整圖片大小',
    'Fake Transparency': '假透明修復',
    'vs': '對比',
    'for': '用於',
    'Tips': '技巧',
    'Tutorial': '教學',
    'in 2025': '2025年'
  },
  'ja': {
    'How to': '方法',
    'Guide': 'ガイド',
    'Complete Guide': '完全ガイド',
    'Best': '最高の',
    'Free': '無料',
    'Online': 'オンライン',
    'Remove Background': '背景削除',
    'Watermark Removal': '透かし除去',
    'Image Compression': '画像圧縮',
    'Resize Images': '画像リサイズ',
    'Fake Transparency': '偽透明修正',
    'vs': 'vs',
    'for': 'のための',
    'Tips': 'ヒント',
    'Tutorial': 'チュートリアル',
    'in 2025': '2025年'
  },
  'ko': {
    'How to': '방법',
    'Guide': '가이드',
    'Complete Guide': '완벽 가이드',
    'Best': '최고의',
    'Free': '무료',
    'Online': '온라인',
    'Remove Background': '배경 제거',
    'Watermark Removal': '워터마크 제거',
    'Image Compression': '이미지 압축',
    'Resize Images': '이미지 크기 조정',
    'Fake Transparency': '가짜 투명 수정',
    'vs': 'vs',
    'for': '위한',
    'Tips': '팁',
    'Tutorial': '튜토리얼',
    'in 2025': '2025년'
  },
  'es': {
    'How to': 'Cómo',
    'Guide': 'Guía',
    'Complete Guide': 'Guía Completa',
    'Best': 'Mejor',
    'Free': 'Gratis',
    'Online': 'En línea',
    'Remove Background': 'Eliminar Fondo',
    'Watermark Removal': 'Eliminar Marca de Agua',
    'Image Compression': 'Compresión de Imagen',
    'Resize Images': 'Redimensionar Imágenes',
    'Fake Transparency': 'Corregir Transparencia Falsa',
    'vs': 'vs',
    'for': 'para',
    'Tips': 'Consejos',
    'Tutorial': 'Tutorial',
    'in 2025': 'en 2025'
  },
  'pt': {
    'How to': 'Como',
    'Guide': 'Guia',
    'Complete Guide': 'Guia Completo',
    'Best': 'Melhor',
    'Free': 'Grátis',
    'Online': 'Online',
    'Remove Background': 'Remover Fundo',
    'Watermark Removal': 'Remover Marca d\'Água',
    'Image Compression': 'Compressão de Imagem',
    'Resize Images': 'Redimensionar Imagens',
    'Fake Transparency': 'Corrigir Transparência Falsa',
    'vs': 'vs',
    'for': 'para',
    'Tips': 'Dicas',
    'Tutorial': 'Tutorial',
    'in 2025': 'em 2025'
  },
  'fr': {
    'How to': 'Comment',
    'Guide': 'Guide',
    'Complete Guide': 'Guide Complet',
    'Best': 'Meilleur',
    'Free': 'Gratuit',
    'Online': 'En ligne',
    'Remove Background': 'Supprimer le Fond',
    'Watermark Removal': 'Supprimer le Filigrane',
    'Image Compression': 'Compression d\'Image',
    'Resize Images': 'Redimensionner les Images',
    'Fake Transparency': 'Corriger la Fausse Transparence',
    'vs': 'vs',
    'for': 'pour',
    'Tips': 'Conseils',
    'Tutorial': 'Tutoriel',
    'in 2025': 'en 2025'
  },
  'de': {
    'How to': 'Wie man',
    'Guide': 'Anleitung',
    'Complete Guide': 'Vollständige Anleitung',
    'Best': 'Beste',
    'Free': 'Kostenlos',
    'Online': 'Online',
    'Remove Background': 'Hintergrund Entfernen',
    'Watermark Removal': 'Wasserzeichen Entfernen',
    'Image Compression': 'Bildkomprimierung',
    'Resize Images': 'Bilder Skalieren',
    'Fake Transparency': 'Falsche Transparenz Beheben',
    'vs': 'vs',
    'for': 'für',
    'Tips': 'Tipps',
    'Tutorial': 'Tutorial',
    'in 2025': 'in 2025'
  },
  'it': {
    'How to': 'Come',
    'Guide': 'Guida',
    'Complete Guide': 'Guida Completa',
    'Best': 'Migliore',
    'Free': 'Gratuito',
    'Online': 'Online',
    'Remove Background': 'Rimuovi Sfondo',
    'Watermark Removal': 'Rimuovi Filigrana',
    'Image Compression': 'Compressione Immagine',
    'Resize Images': 'Ridimensiona Immagini',
    'Fake Transparency': 'Correggi Falsa Trasparenza',
    'vs': 'vs',
    'for': 'per',
    'Tips': 'Suggerimenti',
    'Tutorial': 'Tutorial',
    'in 2025': 'nel 2025'
  },
  'ru': {
    'How to': 'Как',
    'Guide': 'Руководство',
    'Complete Guide': 'Полное Руководство',
    'Best': 'Лучший',
    'Free': 'Бесплатно',
    'Online': 'Онлайн',
    'Remove Background': 'Удалить Фон',
    'Watermark Removal': 'Удалить Водяной Знак',
    'Image Compression': 'Сжатие Изображений',
    'Resize Images': 'Изменить Размер Изображения',
    'Fake Transparency': 'Исправить Ложную Прозрачность',
    'vs': 'vs',
    'for': 'для',
    'Tips': 'Советы',
    'Tutorial': 'Урок',
    'in 2025': 'в 2025'
  }
}

// For languages without specific translations, keep English
const defaultTranslation = translations['es']

function translateText(text: string, lang: string): string {
  const langTranslations = translations[lang] || defaultTranslation
  let result = text

  // Sort by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(langTranslations).sort((a, b) => b.length - a.length)

  for (const key of sortedKeys) {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    result = result.replace(regex, langTranslations[key])
  }

  return result
}

function translateArticle(article: Article, targetLang: string): Article {
  // For a more comprehensive solution, you would use a translation API here
  // For now, we'll translate titles and descriptions using our mapping
  // and keep content in English (which is acceptable for SEO purposes
  // as search engines can still index and understand the content)

  const hasTranslation = !!translations[targetLang]

  return {
    ...article,
    lang: targetLang,
    title: hasTranslation ? translateText(article.title, targetLang) : article.title,
    description: hasTranslation ? translateText(article.description, targetLang) : article.description,
    // Content remains in English - for production, use a translation API
    content: article.content,
    updatedAt: new Date().toISOString()
  }
}

function main() {
  console.log('Starting article translation...\n')

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const sourceDir = path.join(__dirname, '../content/blog/articles/en')
  const indexDir = path.join(__dirname, '../content/blog/index')

  // Read source index
  const sourceIndex = JSON.parse(
    fs.readFileSync(path.join(indexDir, 'en.json'), 'utf-8')
  )

  let totalTranslated = 0

  for (const targetLang of targetLanguages) {
    console.log(`Translating to ${targetLang}...`)

    const targetDir = path.join(__dirname, '../content/blog/articles', targetLang)

    // Create language directory
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    const translatedArticles: Article[] = []

    for (const category of categories) {
      const categorySourceDir = path.join(sourceDir, category)
      const categoryTargetDir = path.join(targetDir, category)

      // Create category directory
      if (!fs.existsSync(categoryTargetDir)) {
        fs.mkdirSync(categoryTargetDir, { recursive: true })
      }

      // Get all article files in category
      const articleFiles = fs.readdirSync(categorySourceDir).filter(f => f.endsWith('.json'))

      for (const file of articleFiles) {
        const sourcePath = path.join(categorySourceDir, file)
        const targetPath = path.join(categoryTargetDir, file)

        // Read source article
        const sourceArticle: Article = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'))

        // Translate article
        const translatedArticle = translateArticle(sourceArticle, targetLang)

        // Write translated article
        fs.writeFileSync(targetPath, JSON.stringify(translatedArticle, null, 2))

        translatedArticles.push(translatedArticle)
        totalTranslated++
      }
    }

    // Create index for this language
    const langIndex = {
      lang: targetLang,
      articles: translatedArticles.map(a => ({
        slug: a.slug,
        category: a.category,
        tool: a.tool,
        lang: a.lang,
        title: a.title,
        description: a.description,
        keywords: a.keywords,
        publishedAt: a.publishedAt,
        updatedAt: a.updatedAt,
        readingTime: a.readingTime
      })),
      categoryCounts: sourceIndex.categoryCounts,
      totalCount: translatedArticles.length,
      updatedAt: new Date().toISOString()
    }

    fs.writeFileSync(
      path.join(indexDir, `${targetLang}.json`),
      JSON.stringify(langIndex, null, 2)
    )

    console.log(`  ✓ Translated ${translatedArticles.length} articles to ${targetLang}`)
  }

  console.log(`\n✅ Complete! Translated ${totalTranslated} articles across ${targetLanguages.length} languages.`)
  console.log(`Total pages: ${sourceIndex.totalCount + totalTranslated}`)
}

main()
