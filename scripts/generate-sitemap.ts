import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const DOMAIN = 'https://fix-pic.com'

const allLanguages = [
  'en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'it', 'ru',
  'vi', 'th', 'id', 'ms', 'tr', 'nl', 'el', 'cs', 'hu', 'uk', 'ar'
]

const tools = [
  'ai-remove-background',
  'remove-watermark',
  'remove-fake-transparency',
  'compress',
  'resize'
]

const categories = [
  'background-removal',
  'watermark-removal',
  'fake-transparency',
  'compression',
  'resize'
]

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generateToolsSitemap(): string {
  const now = new Date().toISOString().split('T')[0]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'

  // Generate URLs for each tool in each language
  for (const tool of tools) {
    for (const lang of allLanguages) {
      xml += '  <url>\n'
      xml += `    <loc>${DOMAIN}/${lang}/${tool}</loc>\n`
      xml += `    <lastmod>${now}</lastmod>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.9</priority>\n'

      // Add hreflang alternates
      for (const altLang of allLanguages) {
        xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${DOMAIN}/${altLang}/${tool}"/>\n`
      }
      xml += '  </url>\n'
    }
  }

  xml += '</urlset>'
  return xml
}

function generateBlogSitemap(lang: string, indexDir: string): string | null {
  const indexPath = path.join(indexDir, `${lang}.json`)

  if (!fs.existsSync(indexPath)) {
    return null
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'

  // Blog home page
  xml += '  <url>\n'
  xml += `    <loc>${DOMAIN}/${lang}/blog</loc>\n`
  xml += `    <lastmod>${index.updatedAt.split('T')[0]}</lastmod>\n`
  xml += '    <changefreq>daily</changefreq>\n'
  xml += '    <priority>0.8</priority>\n'
  for (const altLang of allLanguages) {
    xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${DOMAIN}/${altLang}/blog"/>\n`
  }
  xml += '  </url>\n'

  // Category pages
  for (const category of categories) {
    xml += '  <url>\n'
    xml += `    <loc>${DOMAIN}/${lang}/blog/${category}</loc>\n`
    xml += `    <lastmod>${index.updatedAt.split('T')[0]}</lastmod>\n`
    xml += '    <changefreq>daily</changefreq>\n'
    xml += '    <priority>0.7</priority>\n'
    for (const altLang of allLanguages) {
      xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${DOMAIN}/${altLang}/blog/${category}"/>\n`
    }
    xml += '  </url>\n'
  }

  // Article pages
  for (const article of index.articles) {
    xml += '  <url>\n'
    xml += `    <loc>${DOMAIN}/${lang}/blog/${article.category}/${escapeXml(article.slug)}</loc>\n`
    xml += `    <lastmod>${article.updatedAt.split('T')[0]}</lastmod>\n`
    xml += '    <changefreq>monthly</changefreq>\n'
    xml += '    <priority>0.6</priority>\n'
    // Add hreflang alternates for all languages
    for (const altLang of allLanguages) {
      xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${DOMAIN}/${altLang}/blog/${article.category}/${escapeXml(article.slug)}"/>\n`
    }
    xml += '  </url>\n'
  }

  xml += '</urlset>'
  return xml
}

function generateSitemapIndex(sitemapFiles: string[]): string {
  const now = new Date().toISOString().split('T')[0]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  for (const file of sitemapFiles) {
    xml += '  <sitemap>\n'
    xml += `    <loc>${DOMAIN}/${file}</loc>\n`
    xml += `    <lastmod>${now}</lastmod>\n`
    xml += '  </sitemap>\n'
  }

  xml += '</sitemapindex>'
  return xml
}

function main() {
  console.log('Generating sitemaps...\n')

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const publicDir = path.join(__dirname, '../public')
  const indexDir = path.join(__dirname, '../content/blog/index')

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  const sitemapFiles: string[] = []

  // Generate tools sitemap
  console.log('Generating tools sitemap...')
  const toolsSitemap = generateToolsSitemap()
  fs.writeFileSync(path.join(publicDir, 'sitemap-tools.xml'), toolsSitemap)
  sitemapFiles.push('sitemap-tools.xml')
  console.log(`  ✓ Tools sitemap: ${tools.length * allLanguages.length} URLs`)

  // Generate blog sitemaps for each language
  console.log('\nGenerating blog sitemaps...')
  let totalBlogUrls = 0

  for (const lang of allLanguages) {
    const blogSitemap = generateBlogSitemap(lang, indexDir)
    if (blogSitemap) {
      const filename = `sitemap-blog-${lang}.xml`
      fs.writeFileSync(path.join(publicDir, filename), blogSitemap)
      sitemapFiles.push(filename)

      const index = JSON.parse(fs.readFileSync(path.join(indexDir, `${lang}.json`), 'utf-8'))
      const urlCount = 1 + categories.length + index.articles.length // home + categories + articles
      totalBlogUrls += urlCount
      console.log(`  ✓ ${lang}: ${urlCount} URLs`)
    }
  }

  // Generate sitemap index
  console.log('\nGenerating sitemap index...')
  const sitemapIndex = generateSitemapIndex(sitemapFiles)
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapIndex)

  // Update robots.txt
  console.log('Updating robots.txt...')
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml
`
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt)

  console.log(`\n✅ Complete!`)
  console.log(`  - Sitemap index: ${sitemapFiles.length} sitemaps`)
  console.log(`  - Tools URLs: ${tools.length * allLanguages.length}`)
  console.log(`  - Blog URLs: ${totalBlogUrls}`)
  console.log(`  - Total URLs: ${tools.length * allLanguages.length + totalBlogUrls}`)
}

main()
