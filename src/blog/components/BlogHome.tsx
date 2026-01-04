import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BlogLayout } from './BlogLayout'
import { ArticleCard } from './ArticleCard'
import type { Article, ArticleIndex } from '../types'

const categoryInfo = {
  'background-removal': {
    title: 'Background Removal',
    description: 'Learn how to remove backgrounds from images with AI',
    icon: '✨'
  },
  'watermark-removal': {
    title: 'Watermark Removal',
    description: 'Remove watermarks, logos and text from images',
    icon: '💧'
  },
  'fake-transparency': {
    title: 'Fake Transparency',
    description: 'Fix checkerboard backgrounds from AI-generated images',
    icon: '🔲'
  },
  'compression': {
    title: 'Image Compression',
    description: 'Compress images and optimize for web',
    icon: '📦'
  },
  'resize': {
    title: 'Image Resize',
    description: 'Resize images for any platform or purpose',
    icon: '📐'
  }
}

export function BlogHome() {
  const { lang } = useParams<{ lang: string }>()
  const currentLang = lang || 'en'
  const [articles, setArticles] = useState<Article[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    // Load article index
    fetch(`/content/blog/index/${currentLang}.json`)
      .then(res => res.json())
      .then((data: ArticleIndex) => {
        setArticles(data.articles.slice(0, 12)) // Show latest 12
        setCategoryCounts(data.categoryCounts || {})
      })
      .catch(() => {
        // Fallback to empty
        setArticles([])
      })

    // Update SEO
    document.title = 'Blog | FixPic - Image Editing Tutorials & Tips'
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Learn image editing tips, tutorials and best practices. Guides on background removal, watermark removal, image compression and more.')
    }
  }, [currentLang])

  return (
    <BlogLayout>
      <div className="blog-home">
        <h1>FixPic Blog</h1>
        <p className="blog-home-subtitle">
          Tutorials, tips and guides for image editing
        </p>

        <div className="blog-categories">
          {Object.entries(categoryInfo).map(([id, info]) => (
            <Link
              key={id}
              to={`/${currentLang}/blog/${id}`}
              className="blog-category-card"
            >
              <span style={{ fontSize: '32px' }}>{info.icon}</span>
              <h3>{info.title}</h3>
              <p>{info.description}</p>
              <div className="article-count">
                {categoryCounts[id] || 0} articles
              </div>
            </Link>
          ))}
        </div>

        <div className="blog-articles-section">
          <h2>Latest Articles</h2>
          <div className="blog-articles-grid">
            {articles.map(article => (
              <ArticleCard key={article.slug} article={article} lang={currentLang} />
            ))}
          </div>
        </div>
      </div>
    </BlogLayout>
  )
}
