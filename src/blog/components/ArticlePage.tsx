import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BlogLayout } from './BlogLayout'
import { ArticleCard } from './ArticleCard'
import type { Article } from '../types'

const toolUrls: Record<string, string> = {
  'ai-remove-bg': 'ai-remove-background',
  'remove-watermark': 'remove-watermark',
  'remove-bg': 'remove-fake-transparency',
  'compress': 'compress',
  'resize': 'resize'
}

export function ArticlePage() {
  const { lang, category, slug } = useParams<{ lang: string; category: string; slug: string }>()
  const currentLang = lang || 'en'
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/content/blog/articles/${currentLang}/${category}/${slug}.json`)
      .then(res => res.json())
      .then((data: Article) => {
        setArticle(data)
        setLoading(false)

        // Update SEO
        document.title = data.title
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) {
          metaDesc.setAttribute('content', data.description)
        }

        // 更新 html lang
        document.documentElement.lang = currentLang

        // 更新 canonical URL
        const currentUrl = `https://fix-pic.com/${currentLang}/blog/${category}/${slug}`
        let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
        if (canonicalLink) {
          canonicalLink.href = currentUrl
        }

        // 动态更新 hreflang 标签
        const supportedLanguages = [
          'en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'it', 'ru',
          'vi', 'th', 'id', 'ms', 'tr', 'nl', 'el', 'cs', 'hu', 'uk', 'ar'
        ]

        // 移除旧的 hreflang 标签
        document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove())

        // 添加新的 hreflang 标签
        supportedLanguages.forEach(langCode => {
          const link = document.createElement('link')
          link.rel = 'alternate'
          link.hreflang = langCode
          link.href = `https://fix-pic.com/${langCode}/blog/${category}/${slug}`
          document.head.appendChild(link)
        })

        // 添加 x-default
        const xDefaultLink = document.createElement('link')
        xDefaultLink.rel = 'alternate'
        xDefaultLink.hreflang = 'x-default'
        xDefaultLink.href = `https://fix-pic.com/en/blog/${category}/${slug}`
        document.head.appendChild(xDefaultLink)

        // Load related articles
        if (data.relatedArticles?.length) {
          Promise.all(
            data.relatedArticles.slice(0, 3).map(relSlug =>
              fetch(`/content/blog/articles/${currentLang}/${category}/${relSlug}.json`)
                .then(res => res.json())
                .catch(() => null)
            )
          ).then(results => {
            setRelatedArticles(results.filter(Boolean) as Article[])
          })
        }
      })
      .catch(() => {
        setArticle(null)
        setLoading(false)
      })
  }, [currentLang, category, slug])

  if (loading) {
    return (
      <BlogLayout>
        <div className="article-page">
          <p style={{ textAlign: 'center', padding: '48px', color: '#718096' }}>
            Loading...
          </p>
        </div>
      </BlogLayout>
    )
  }

  if (!article) {
    return (
      <BlogLayout>
        <div className="article-page">
          <h1>Article Not Found</h1>
          <p>The article you're looking for doesn't exist.</p>
          <Link to={`/${currentLang}/blog`}>Back to Blog</Link>
        </div>
      </BlogLayout>
    )
  }

  const toolUrl = toolUrls[article.tool] || 'ai-remove-background'

  return (
    <BlogLayout title={article.title} description={article.description}>
      <article className="article-page">
        <nav className="article-breadcrumb">
          <Link to={`/${currentLang}/blog`}>Blog</Link>
          <span>/</span>
          <Link to={`/${currentLang}/blog/${category}`}>
            {category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Link>
          <span>/</span>
          <span>{article.title}</span>
        </nav>

        <header className="article-header">
          <h1>{article.title}</h1>
          <div className="article-meta">
            <span>{article.readingTime} min read</span>
            <span>Updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
          </div>
        </header>

        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(article.content) }}
        />

        <div className="article-cta">
          <h3>Ready to try it yourself?</h3>
          <p>Use FixPic's free online tool to process your images instantly.</p>
          <Link to={`/${currentLang}/${toolUrl}`}>
            Try Free Tool Now
          </Link>
        </div>

        {relatedArticles.length > 0 && (
          <div className="related-articles">
            <h3>Related Articles</h3>
            <div className="blog-articles-grid">
              {relatedArticles.map(relArticle => (
                <ArticleCard key={relArticle.slug} article={relArticle} lang={currentLang} />
              ))}
            </div>
          </div>
        )}
      </article>
    </BlogLayout>
  )
}

// Simple markdown parser (can be replaced with remark)
function parseMarkdown(md: string): string {
  return md
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gim, (match) => {
      if (match.startsWith('<')) return match
      return `<p>${match}</p>`
    })
}
