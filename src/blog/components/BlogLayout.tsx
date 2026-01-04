import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { languages } from '../../i18n'
import './Blog.css'

interface BlogLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

const categories = [
  { id: 'background-removal', tool: 'ai-remove-bg' },
  { id: 'watermark-removal', tool: 'remove-watermark' },
  { id: 'fake-transparency', tool: 'remove-bg' },
  { id: 'compression', tool: 'compress' },
  { id: 'resize', tool: 'resize' }
]

export function BlogLayout({ children, title: _title, description: _description }: BlogLayoutProps) {
  const { t } = useTranslation()
  const { lang } = useParams<{ lang: string }>()
  const currentLang = lang || 'en'

  const currentLangInfo = languages.find(l => l.code === currentLang) || languages[0]

  return (
    <div className="blog-layout">
      <header className="blog-header">
        <div className="blog-header-content">
          <Link to={`/${currentLang}/ai-remove-background`} className="blog-logo">
            <span className="logo-icon">F</span>
            <span className="logo-text">ix-Pic</span>
          </Link>
          <nav className="blog-nav">
            <Link to={`/${currentLang}/blog`} className="blog-nav-link">Blog</Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/${currentLang}/blog/${cat.id}`}
                className="blog-nav-link"
              >
                {t(`blog.categories.${cat.id}`, cat.id.replace('-', ' '))}
              </Link>
            ))}
          </nav>
          <Link to={`/${currentLang}/ai-remove-background`} className="blog-cta">
            Try Free Tool
          </Link>
        </div>
      </header>

      <main className="blog-main">
        {children}
      </main>

      <footer className="blog-footer">
        <div className="blog-footer-content">
          <div className="blog-footer-section">
            <h4>Tools</h4>
            <Link to={`/${currentLang}/ai-remove-background`}>AI Background Removal</Link>
            <Link to={`/${currentLang}/remove-watermark`}>Watermark Removal</Link>
            <Link to={`/${currentLang}/remove-fake-transparency`}>Fake Transparency Fix</Link>
            <Link to={`/${currentLang}/compress`}>Image Compression</Link>
            <Link to={`/${currentLang}/resize`}>Image Resize</Link>
          </div>
          <div className="blog-footer-section">
            <h4>Blog Categories</h4>
            {categories.map(cat => (
              <Link key={cat.id} to={`/${currentLang}/blog/${cat.id}`}>
                {cat.id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Link>
            ))}
          </div>
          <div className="blog-footer-section">
            <h4>Language</h4>
            <span>{currentLangInfo.flag} {currentLangInfo.name}</span>
          </div>
        </div>
        <div className="blog-footer-bottom">
          <p>&copy; 2025 FixPic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
