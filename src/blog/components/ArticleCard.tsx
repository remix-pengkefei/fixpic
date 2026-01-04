import { Link } from 'react-router-dom'
import type { Article } from '../types'

interface ArticleCardProps {
  article: Article
  lang: string
}

const categoryIcons: Record<string, string> = {
  'background-removal': '✨',
  'watermark-removal': '💧',
  'fake-transparency': '🔲',
  'compression': '📦',
  'resize': '📐'
}

export function ArticleCard({ article, lang }: ArticleCardProps) {
  const icon = categoryIcons[article.category] || '📄'

  return (
    <Link
      to={`/${lang}/blog/${article.category}/${article.slug}`}
      className="article-card"
    >
      <div className="article-card-image">
        <span className="placeholder-icon">{icon}</span>
      </div>
      <div className="article-card-content">
        <div className="article-card-category">
          {article.category.replace('-', ' ')}
        </div>
        <h3 className="article-card-title">{article.title}</h3>
        <p className="article-card-description">
          {article.description.slice(0, 120)}...
        </p>
        <div className="article-card-meta">
          {article.readingTime} min read
        </div>
      </div>
    </Link>
  )
}
