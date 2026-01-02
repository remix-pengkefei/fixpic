# Changelog

## [1.1.0] - 2026-01-03

### SEO 优化版本

#### 新增功能
- **URL 路由系统**: 实现 `/{lang}/{tool}` 格式的 SEO 友好 URL
  - 支持 22 种语言 × 5 个工具 = 110 个可索引页面
  - 浏览器前进/后退正常工作
  - 分享链接包含语言和工具信息

- **多语言 SEO 内容**: 为每个工具添加独立的本地化 SEO 标题和描述
  - 支持语言: en, zh-CN, zh-TW, ja, ko, es, pt, fr, de, it, ru, vi, th, id, ms, tr, nl, el, cs, hu, uk, ar
  - 每个工具页面都有针对性的 title 和 meta description

- **动态 SEO 元数据**:
  - 动态更新 `<title>` 标签
  - 动态更新 `<meta name="description">`
  - 动态更新 `<link rel="canonical">`
  - 动态更新 Open Graph 标签 (og:title, og:description, og:url)
  - 动态更新 Twitter Card 标签

- **JSON-LD 结构化数据**:
  - WebApplication schema (类型: ImageEditorApplication)
  - BreadcrumbList schema 面包屑导航
  - 免费工具的 Offer schema

- **Sitemap**: 包含 110 个 URL 的完整站点地图，带 hreflang 多语言标记

#### 工具列表
1. AI 抠图 (ai-remove-background) - Replicate API
2. AI 去水印 (remove-watermark) - Dewatermark.ai API
3. 去假透明 (remove-fake-transparency) - 本地处理
4. 图片压缩 (compress) - 本地处理
5. 调整尺寸 (resize) - 本地处理

#### 技术栈
- React 19 + TypeScript
- React Router DOM 7
- i18next 国际化
- Vite 7 构建
- Cloudflare Pages 部署

---

## [1.0.0] - 2026-01-02

### 初始版本
- 基础图片处理功能
- 22 种语言支持
- 5 个核心工具
