/**
 * 博客文章翻译脚本
 *
 * 将博客文章翻译到所有支持的语言
 * 流程：英语(源) → GPT翻译 → 其他语言
 * 或：中文(源) → GPT润色 → 英语 → GPT翻译 → 其他语言
 *
 * 用法：
 *   # 翻译所有英文文章到所有语言
 *   OPENAI_API_KEY=xxx npx tsx scripts/translate-blog.ts
 *
 *   # 只翻译到日语
 *   OPENAI_API_KEY=xxx npx tsx scripts/translate-blog.ts --lang=ja
 *
 *   # 翻译特定分类
 *   OPENAI_API_KEY=xxx npx tsx scripts/translate-blog.ts --category=background-removal
 *
 *   # 翻译特定文章
 *   OPENAI_API_KEY=xxx npx tsx scripts/translate-blog.ts --slug=4k-image-background-removal
 *
 *   # 从中文源文件翻译
 *   OPENAI_API_KEY=xxx npx tsx scripts/translate-blog.ts --source=zh-CN
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  createOpenAIClient,
  polishChineseToEnglish,
  translateEnglishToLanguage,
  SUPPORTED_LANGUAGES,
} from './gpt-translator'

const BLOG_DIR = path.join(process.cwd(), 'content/blog/articles')
const INDEX_DIR = path.join(process.cwd(), 'content/blog/index')

interface BlogArticle {
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

interface BlogIndex {
  articles: Array<{
    slug: string
    category: string
    title: string
    description: string
    publishedAt: string
    readingTime: number
  }>
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  const result: {
    targetLang?: string
    category?: string
    slug?: string
    sourceLang: string
  } = {
    sourceLang: 'en',
  }

  for (const arg of args) {
    if (arg.startsWith('--lang=')) {
      result.targetLang = arg.split('=')[1]
    } else if (arg.startsWith('--category=')) {
      result.category = arg.split('=')[1]
    } else if (arg.startsWith('--slug=')) {
      result.slug = arg.split('=')[1]
    } else if (arg.startsWith('--source=')) {
      result.sourceLang = arg.split('=')[1]
    }
  }

  return result
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// SEO 优化的翻译上下文
function getSEOContext(article: BlogArticle, field: 'title' | 'description' | 'content' | 'keywords') {
  const categoryMap: Record<string, string> = {
    'background-removal': 'AI background removal, transparent PNG, photo editing',
    'watermark-removal': 'watermark remover, logo removal, image cleanup',
    'fake-transparency': 'fake transparency fix, checkerboard background, Midjourney PNG',
    'compression': 'image compression, file size reduction, WebP conversion',
    'resize': 'image resize, dimension adjustment, photo scaling',
  }

  const categoryKeywords = categoryMap[article.category] || 'image processing, photo editing'

  const contexts: Record<string, string> = {
    title: `SEO-optimized blog title for an image processing tool.
Requirements:
- Include primary keyword naturally (related to: ${categoryKeywords})
- Keep it compelling and click-worthy
- Optimal length: 50-60 characters
- Should rank well in search engines`,

    description: `SEO meta description for a blog article about ${article.category}.
Requirements:
- Include target keywords: ${categoryKeywords}
- Create urgency or curiosity to improve CTR
- Optimal length: 150-160 characters
- Mention "free", "online", "AI" if applicable`,

    content: `SEO-optimized blog content for an image processing tool website.
Requirements:
- Naturally incorporate keywords: ${categoryKeywords}
- Use clear headings and subheadings (preserve markdown format)
- Include calls-to-action encouraging tool usage
- Write in an engaging, helpful tone
- Optimize for featured snippets where applicable`,

    keywords: `SEO keywords for ${article.category} image tool. Generate comma-separated keywords that:
- Include long-tail variations
- Cover user search intent
- Are relevant to the target language's search patterns`
  }

  return contexts[field]
}

// 翻译单篇文章
async function translateArticle(
  client: ReturnType<typeof createOpenAIClient>,
  article: BlogArticle,
  targetLangCode: string,
  isFromChinese: boolean
): Promise<BlogArticle> {
  const baseContext = `Blog article for an image processing tool website. Category: ${article.category}`

  let englishTitle = article.title
  let englishDescription = article.description
  let englishContent = article.content
  let englishKeywords = article.keywords

  // 如果源是中文，先润色到英语（带 SEO 优化）
  if (isFromChinese) {
    console.log('    润色到英语 (SEO优化)...')

    englishTitle = await polishChineseToEnglish(client, article.title, getSEOContext(article, 'title'))
    await delay(300)

    englishDescription = await polishChineseToEnglish(client, article.description, getSEOContext(article, 'description'))
    await delay(300)

    englishContent = await polishChineseToEnglish(client, article.content, getSEOContext(article, 'content'))
    await delay(300)

    // 翻译关键词
    const keywordsText = article.keywords.join(', ')
    const translatedKeywords = await polishChineseToEnglish(client, keywordsText, getSEOContext(article, 'keywords'))
    englishKeywords = translatedKeywords.split(',').map(k => k.trim())
    await delay(300)
  }

  // 如果目标是英语，直接返回
  if (targetLangCode === 'en') {
    return {
      ...article,
      lang: 'en',
      title: englishTitle,
      description: englishDescription,
      keywords: englishKeywords,
      content: englishContent,
      updatedAt: new Date().toISOString(),
    }
  }

  // 繁体中文特殊处理：直接从简体中文转换（SEO优化）
  if (targetLangCode === 'zh-TW' && isFromChinese) {
    console.log(`    转换到繁体中文 (SEO优化)...`)
    const twTitleContext = getSEOContext(article, 'title') + '\nConvert Simplified Chinese to Traditional Chinese, adapting for Taiwan/HK audience search habits.'
    const twDescContext = getSEOContext(article, 'description') + '\nConvert to Traditional Chinese with Taiwan/HK SEO optimization.'
    const twContentContext = getSEOContext(article, 'content') + '\nConvert to Traditional Chinese, use Taiwan/HK terminology.'
    const twKeywordsContext = getSEOContext(article, 'keywords') + '\nUse Traditional Chinese keywords popular in Taiwan/HK searches.'

    const translatedTitle = await translateEnglishToLanguage(client, article.title, 'zh-TW', twTitleContext)
    await delay(300)

    const translatedDescription = await translateEnglishToLanguage(client, article.description, 'zh-TW', twDescContext)
    await delay(300)

    const translatedContent = await translateEnglishToLanguage(client, article.content, 'zh-TW', twContentContext)
    await delay(300)

    const keywordsText = article.keywords.join(', ')
    const translatedKeywordsText = await translateEnglishToLanguage(client, keywordsText, 'zh-TW', twKeywordsContext)
    const translatedKeywords = translatedKeywordsText.split(',').map(k => k.trim())

    return {
      ...article,
      lang: 'zh-TW',
      title: translatedTitle,
      description: translatedDescription,
      keywords: translatedKeywords,
      content: translatedContent,
      updatedAt: new Date().toISOString(),
    }
  }

  // 翻译到目标语言（带 SEO 优化）
  console.log(`    翻译到 ${targetLangCode} (SEO优化)...`)

  const translatedTitle = await translateEnglishToLanguage(client, englishTitle, targetLangCode, getSEOContext(article, 'title'))
  await delay(300)

  const translatedDescription = await translateEnglishToLanguage(client, englishDescription, targetLangCode, getSEOContext(article, 'description'))
  await delay(300)

  const translatedContent = await translateEnglishToLanguage(client, englishContent, targetLangCode, getSEOContext(article, 'content'))
  await delay(300)

  // 翻译关键词（SEO优化）
  const keywordsText = englishKeywords.join(', ')
  const translatedKeywordsText = await translateEnglishToLanguage(client, keywordsText, targetLangCode, getSEOContext(article, 'keywords'))
  const translatedKeywords = translatedKeywordsText.split(',').map(k => k.trim())
  await delay(300)

  return {
    ...article,
    lang: targetLangCode,
    title: translatedTitle,
    description: translatedDescription,
    keywords: translatedKeywords,
    content: translatedContent,
    updatedAt: new Date().toISOString(),
  }
}

// 获取所有文章
function getArticles(sourceLang: string, category?: string, slug?: string): BlogArticle[] {
  const langDir = path.join(BLOG_DIR, sourceLang)
  if (!fs.existsSync(langDir)) {
    console.error(`源语言目录不存在: ${langDir}`)
    return []
  }

  const articles: BlogArticle[] = []
  const categories = category
    ? [category]
    : fs.readdirSync(langDir).filter(f => fs.statSync(path.join(langDir, f)).isDirectory())

  for (const cat of categories) {
    const catDir = path.join(langDir, cat)
    if (!fs.existsSync(catDir)) continue

    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'))

    for (const file of files) {
      const articleSlug = file.replace('.json', '')
      if (slug && articleSlug !== slug) continue

      const content = fs.readFileSync(path.join(catDir, file), 'utf-8')
      articles.push(JSON.parse(content))
    }
  }

  return articles
}

// 保存文章
function saveArticle(article: BlogArticle): void {
  const langDir = path.join(BLOG_DIR, article.lang)
  const catDir = path.join(langDir, article.category)

  // 确保目录存在
  if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true })
  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true })

  const filePath = path.join(catDir, `${article.slug}.json`)
  fs.writeFileSync(filePath, JSON.stringify(article, null, 2) + '\n')
}

// 更新索引文件
function updateIndex(lang: string): void {
  const langDir = path.join(BLOG_DIR, lang)
  if (!fs.existsSync(langDir)) return

  const index: BlogIndex = { articles: [] }
  const categories = fs.readdirSync(langDir).filter(f => fs.statSync(path.join(langDir, f)).isDirectory())

  for (const cat of categories) {
    const catDir = path.join(langDir, cat)
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'))

    for (const file of files) {
      const content = fs.readFileSync(path.join(catDir, file), 'utf-8')
      const article: BlogArticle = JSON.parse(content)

      index.articles.push({
        slug: article.slug,
        category: article.category,
        title: article.title,
        description: article.description,
        publishedAt: article.publishedAt,
        readingTime: article.readingTime,
      })
    }
  }

  // 按发布日期排序
  index.articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  // 保存索引
  const indexPath = path.join(INDEX_DIR, `${lang}.json`)
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n')
  console.log(`已更新索引: ${indexPath}`)
}

async function main() {
  const args = parseArgs()
  const isFromChinese = args.sourceLang === 'zh-CN'

  console.log(`源语言: ${args.sourceLang}`)
  console.log(`翻译模式: ${isFromChinese ? '中文 → 英语 → 目标语言' : '英语 → 目标语言'}`)

  // 获取源文章
  const articles = getArticles(args.sourceLang, args.category, args.slug)
  console.log(`找到 ${articles.length} 篇文章`)

  if (articles.length === 0) {
    console.log('没有找到需要翻译的文章')
    return
  }

  // 创建 OpenAI 客户端
  const client = createOpenAIClient()
  console.log('OpenAI 客户端已创建\n')

  // 确定目标语言
  let targetLanguages = SUPPORTED_LANGUAGES.filter(lang => lang.code !== args.sourceLang)

  if (args.targetLang) {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === args.targetLang)
    if (!lang) {
      console.error(`不支持的语言代码: ${args.targetLang}`)
      process.exit(1)
    }
    targetLanguages = [lang]
  }

  // 翻译文章
  const updatedLangs = new Set<string>()

  for (const article of articles) {
    console.log(`\n处理文章: ${article.slug} (${article.category})`)

    // 如果从中文翻译，先生成英语版本
    if (isFromChinese) {
      console.log('  → 翻译到 English (en)')
      const englishArticle = await translateArticle(client, article, 'en', true)
      saveArticle(englishArticle)
      console.log(`    已保存: ${englishArticle.slug}.json`)
      updatedLangs.add('en')
      await delay(1000)
    }

    // 翻译到其他语言
    for (const lang of targetLanguages) {
      if (lang.code === 'en' && isFromChinese) continue // 已处理

      console.log(`  → 翻译到 ${lang.name} (${lang.code})`)

      try {
        const translatedArticle = await translateArticle(client, article, lang.code, isFromChinese)
        saveArticle(translatedArticle)
        console.log(`    已保存: ${translatedArticle.slug}.json`)
        updatedLangs.add(lang.code)
        await delay(1000)
      } catch (error) {
        console.error(`    翻译失败:`, error)
      }
    }
  }

  // 更新索引
  console.log('\n更新索引文件...')
  for (const lang of updatedLangs) {
    updateIndex(lang)
  }

  console.log('\n翻译完成!')
}

main().catch(console.error)
