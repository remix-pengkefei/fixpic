export interface Article {
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
  relatedArticles?: string[]
  translations?: Record<string, string>
}

export interface ArticleIndex {
  lang: string
  articles: Article[]
  categoryCounts: Record<string, number>
  totalCount: number
  updatedAt: string
}
