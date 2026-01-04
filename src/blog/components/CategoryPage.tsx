import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BlogLayout } from './BlogLayout'
import { ArticleCard } from './ArticleCard'
import type { Article, ArticleIndex } from '../types'

const categoryMeta: Record<string, { title: string; description: string; icon: string }> = {
  'background-removal': {
    title: 'Background Removal Tutorials',
    description: 'Learn how to remove backgrounds from product photos, portraits, and any image with AI-powered tools.',
    icon: '✨'
  },
  'watermark-removal': {
    title: 'Watermark Removal Guides',
    description: 'Discover how to remove watermarks, logos, text, and date stamps from your images.',
    icon: '💧'
  },
  'fake-transparency': {
    title: 'Fake Transparency Fixes',
    description: 'Fix checkerboard backgrounds from Midjourney, Lovart and other AI-generated images.',
    icon: '🔲'
  },
  'compression': {
    title: 'Image Compression Tips',
    description: 'Optimize your images for web, reduce file sizes, and convert between formats.',
    icon: '📦'
  },
  'resize': {
    title: 'Image Resize Guides',
    description: 'Resize images for social media, e-commerce, print and more.',
    icon: '📐'
  }
}

export function CategoryPage() {
  const { lang, category } = useParams<{ lang: string; category: string }>()
  const currentLang = lang || 'en'
  const currentCategory = category || 'background-removal'
  const [articles, setArticles] = useState<Article[]>([])

  const meta = categoryMeta[currentCategory] || {
    title: 'Articles',
    description: 'Browse our articles',
    icon: '📄'
  }

  useEffect(() => {
    fetch(`/content/blog/index/${currentLang}.json`)
      .then(res => res.json())
      .then((data: ArticleIndex) => {
        const filtered = data.articles.filter(a => a.category === currentCategory)
        setArticles(filtered)
      })
      .catch(() => setArticles([]))

    // Update SEO
    document.title = `${meta.title} | FixPic Blog`
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', meta.description)
    }
  }, [currentLang, currentCategory, meta])

  return (
    <BlogLayout>
      <div className="category-page">
        <h1>{meta.icon} {meta.title}</h1>
        <p className="category-description">{meta.description}</p>

        <div className="blog-articles-grid">
          {articles.map(article => (
            <ArticleCard key={article.slug} article={article} lang={currentLang} />
          ))}
        </div>

        {articles.length === 0 && (
          <p style={{ textAlign: 'center', color: '#718096', padding: '48px' }}>
            No articles found in this category yet.
          </p>
        )}
      </div>
    </BlogLayout>
  )
}
