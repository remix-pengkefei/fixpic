import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import {
  backgroundRemovalTopics,
  watermarkRemovalTopics,
  fakeTransparencyTopics,
  compressionTopics,
  resizeTopics
} from './article-topics'

interface ArticleTopic {
  slug: string
  title: string
}

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

const categories = [
  { id: 'background-removal', tool: 'ai-remove-bg', topics: backgroundRemovalTopics },
  { id: 'watermark-removal', tool: 'remove-watermark', topics: watermarkRemovalTopics },
  { id: 'fake-transparency', tool: 'remove-bg', topics: fakeTransparencyTopics },
  { id: 'compression', tool: 'compress', topics: compressionTopics },
  { id: 'resize', tool: 'resize', topics: resizeTopics }
]

function generateDescription(title: string, category: string): string {
  const categoryPhrases: Record<string, string[]> = {
    'background-removal': ['Remove background from images', 'AI-powered background removal', 'Get transparent backgrounds instantly'],
    'watermark-removal': ['Remove watermarks easily', 'Clean up images', 'AI watermark removal'],
    'fake-transparency': ['Fix fake transparency', 'Convert checkerboard to real transparency', 'AI art transparency fix'],
    'compression': ['Compress images online', 'Reduce file size', 'Optimize images for web'],
    'resize': ['Resize images online', 'Perfect dimensions', 'Free image resizer']
  }
  const phrases = categoryPhrases[category] || ['Image editing made easy']
  return `${title}. ${phrases[Math.floor(Math.random() * phrases.length)]} with FixPic's free online tool. No signup required.`
}

function generateKeywords(title: string, category: string): string[] {
  const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['with', 'from', 'your', 'the', 'for', 'and', 'how', 'what', 'when', 'best', 'guide', '2025'].includes(w))
  const categoryKeywords: Record<string, string[]> = {
    'background-removal': ['remove background', 'transparent background', 'background remover', 'AI background removal'],
    'watermark-removal': ['remove watermark', 'watermark remover', 'delete watermark', 'erase watermark'],
    'fake-transparency': ['fake transparency', 'checkerboard background', 'AI art transparency', 'transparent PNG'],
    'compression': ['compress images', 'image compression', 'reduce file size', 'optimize images'],
    'resize': ['resize images', 'image resizer', 'change image size', 'image dimensions']
  }
  return [...new Set([...categoryKeywords[category] || [], ...words.slice(0, 3)])]
}

function generateContent(topic: ArticleTopic, category: string, tool: string): string {
  // Generate article content based on category and topic
  const contentGenerators: Record<string, (t: ArticleTopic) => string> = {
    'background-removal': generateBackgroundRemovalContent,
    'watermark-removal': generateWatermarkRemovalContent,
    'fake-transparency': generateFakeTransparencyContent,
    'compression': generateCompressionContent,
    'resize': generateResizeContent
  }
  return contentGenerators[category]?.(topic) || generateGenericContent(topic, category)
}

function generateBackgroundRemovalContent(topic: ArticleTopic): string {
  const sections = [
    `## Introduction\n\n${topic.title} is a common challenge for photographers, e-commerce sellers, and content creators. With the right tools and techniques, you can achieve professional results in seconds.\n\nIn this comprehensive guide, we'll walk you through everything you need to know about ${topic.title.toLowerCase()}.`,

    `## Why Background Removal Matters\n\nClean, professional images make a significant difference in how your content is perceived:\n\n- **E-commerce**: Product photos with clean backgrounds can increase conversion rates by up to 30%\n- **Professional photos**: Headshots and portraits look more polished without distracting backgrounds\n- **Branding**: Consistent backgrounds across your images strengthen brand identity\n- **Versatility**: Transparent backgrounds let you place subjects on any background`,

    `## Step-by-Step Guide\n\n### Step 1: Choose Your Image\n\nSelect a high-quality image for best results. Images with good contrast between the subject and background work best for AI-powered removal.\n\n### Step 2: Upload to FixPic\n\nVisit FixPic's AI Background Removal tool and upload your image. You can:\n- Drag and drop files directly\n- Click to browse your device\n- Paste from clipboard (Ctrl/Cmd + V)\n\n### Step 3: Let AI Do the Work\n\nOur AI automatically detects the subject and removes the background in 2-5 seconds. The technology handles:\n- Complex edges like hair and fur\n- Transparent and semi-transparent objects\n- Multiple subjects in one image\n\n### Step 4: Download Your Result\n\nDownload your image as a PNG with transparency or choose a solid color background. The output maintains your original image resolution.`,

    `## Pro Tips for Best Results\n\n1. **Use high-resolution images** - Higher quality input means better output\n2. **Good lighting helps** - Even lighting reduces problematic shadows\n3. **Contrast matters** - Subject should stand out from the background\n4. **Leave margin space** - Don't crop too close to your subject\n5. **Check the edges** - Zoom in to verify clean edge detection`,

    `## Common Use Cases\n\n### E-commerce Product Photos\nAmazon, eBay, Etsy, and Shopify all benefit from clean product images. Many platforms require or recommend white backgrounds for main product photos.\n\n### Professional Headshots\nLinkedIn profiles, company websites, and business cards often need headshots with consistent backgrounds.\n\n### Marketing Materials\nCreate versatile images for social media, presentations, and promotional content.\n\n### Print on Demand\nDesign t-shirts, stickers, phone cases, and other merchandise with transparent graphics.`,

    `## Frequently Asked Questions\n\n### Is FixPic really free?\nYes! FixPic is 100% free with no signup required. We don't add watermarks or limit your usage.\n\n### How does AI background removal work?\nOur AI uses deep learning trained on millions of images to identify subjects and separate them from backgrounds with pixel-perfect accuracy.\n\n### What image formats are supported?\nWe support PNG, JPG, JPEG, and WebP files up to 10MB.\n\n### Is my data secure?\nAbsolutely. All processing happens in your browser. Your images are never uploaded to our servers.`,

    `## Conclusion\n\n${topic.title} doesn't have to be complicated or time-consuming. With FixPic's AI-powered tool, you can achieve professional results in seconds, completely free.\n\nReady to transform your images? Try our free background removal tool now and see the difference for yourself.`
  ]
  return sections.join('\n\n')
}

function generateWatermarkRemovalContent(topic: ArticleTopic): string {
  const sections = [
    `## Introduction\n\n${topic.title} is a topic that many people search for online. Whether you're working with your own images or exploring legal alternatives, understanding your options is important.\n\nThis guide covers everything you need to know about ${topic.title.toLowerCase()}, including legal considerations and best practices.`,

    `## Understanding Watermarks\n\nWatermarks serve several purposes:\n\n- **Copyright protection**: Photographers and artists use watermarks to protect their work\n- **Branding**: Companies add watermarks to maintain brand presence\n- **Preview protection**: Stock photo sites use watermarks on preview images\n\nBefore removing any watermark, consider whether you have the right to do so.`,

    `## Legal Considerations\n\nWatermark removal raises important legal questions:\n\n### When Removal is Acceptable\n- Removing watermarks from your own images\n- Working with images you've licensed\n- Removing date stamps or camera watermarks from personal photos\n- Educational or personal use in some jurisdictions\n\n### When Removal is NOT Acceptable\n- Removing watermarks to avoid paying for stock photos\n- Commercial use of watermarked images without license\n- Removing copyright notices from others' work`,

    `## How FixPic's Watermark Removal Works\n\n### Step 1: Upload Your Image\n\nSelect an image with a watermark you want to remove. Our tool works best with:\n- Semi-transparent watermarks\n- Text overlays\n- Logo watermarks\n- Date stamps and timestamps\n\n### Step 2: AI Processing\n\nOur AI analyzes the image and intelligently reconstructs the area behind the watermark using advanced inpainting technology.\n\n### Step 3: Download Clean Image\n\nGet your watermark-free image in seconds. The AI preserves textures, colors, and details for natural-looking results.`,

    `## Alternative Options\n\nIf you need images without watermarks, consider these legitimate alternatives:\n\n### Free Stock Photo Sites\n- **Unsplash** - High-quality free photos\n- **Pexels** - Free stock photos and videos\n- **Pixabay** - Large library of free images\n- **Burst by Shopify** - Free commercial-use photos\n\n### Affordable Stock Subscriptions\n- Many stock sites offer affordable monthly plans\n- Educational discounts are often available\n- Consider purchasing individual images`,

    `## Best Practices\n\n1. **Always verify rights** - Ensure you have permission to modify the image\n2. **Keep original files** - Save the original in case you need it\n3. **Use high-quality sources** - Better input produces better results\n4. **Check results carefully** - Zoom in to verify quality`,

    `## Frequently Asked Questions\n\n### Can AI remove any watermark?\nAI works best with semi-transparent and text watermarks. Very large or complex watermarks may not be fully removable.\n\n### Will removing a watermark reduce image quality?\nOur AI is designed to preserve image quality while removing watermarks. Results depend on watermark complexity and placement.\n\n### Is this service free?\nYes, FixPic's watermark removal tool is completely free with no signup required.`,

    `## Conclusion\n\n${topic.title} requires understanding both the technical process and legal implications. FixPic provides a powerful, free tool for legitimate watermark removal needs.\n\nAlways ensure you have the right to modify images before using any watermark removal tool. When in doubt, explore the many free and affordable stock photo alternatives available.`
  ]
  return sections.join('\n\n')
}

function generateFakeTransparencyContent(topic: ArticleTopic): string {
  const sections = [
    `## Introduction\n\n${topic.title} is a common issue encountered when working with AI-generated images. Many AI art tools create images with what appears to be a transparent background, but is actually a rendered checkerboard pattern.\n\nThis guide explains why this happens and how to fix it quickly with FixPic.`,

    `## What is Fake Transparency?\n\nFake transparency occurs when an AI image generator:\n\n- Renders a checkerboard pattern instead of actual alpha channel transparency\n- Creates a gray-white grid background that looks like transparency\n- Exports images as flat JPG/PNG without true transparent pixels\n\n### Why Does This Happen?\n\nAI models are trained on images that often show transparency as a checkerboard pattern (like in Photoshop). The AI learns to reproduce this visual pattern rather than actual transparency data.`,

    `## Common Sources of Fake Transparency\n\n### AI Art Generators\n- **Midjourney** - Often creates checkerboard backgrounds when prompted for transparency\n- **DALL-E** - Similar issues with transparent background requests\n- **Stable Diffusion** - May generate visual transparency patterns\n- **Leonardo AI** - Can produce fake transparency effects\n- **Ideogram** - Transparent background prompts may yield checkerboard\n\n### Design Tools\n- **Lovart** - Exports may contain fake transparency\n- **Canva AI** - Some AI-generated elements have this issue\n- **Adobe Firefly** - Occasional fake transparency in outputs`,

    `## How to Fix Fake Transparency with FixPic\n\n### Step 1: Upload Your Image\n\nUpload the AI-generated image with fake transparency to FixPic's Fake Transparency Removal tool.\n\n### Step 2: Automatic Detection\n\nOur AI automatically detects the checkerboard pattern and identifies which pixels should be transparent.\n\n### Step 3: Convert to Real Transparency\n\nThe tool converts the fake transparency to actual alpha channel transparency, creating a proper PNG with real transparent areas.\n\n### Step 4: Download\n\nDownload your fixed image as a PNG with genuine transparency, ready for use in any project.`,

    `## Use Cases After Fixing Transparency\n\nOnce you've converted fake transparency to real transparency, you can:\n\n### Print on Demand\n- T-shirt designs\n- Sticker production\n- Phone case designs\n- Mug printing\n\n### Digital Design\n- Website graphics\n- Social media content\n- Presentation slides\n- Marketing materials\n\n### Gaming & Apps\n- Game sprites and assets\n- App icons\n- UI elements\n- Character designs`,

    `## Tips for Better Results\n\n1. **High contrast helps** - Clear distinction between checkerboard and subject\n2. **Clean edges** - Well-defined boundaries produce better results\n3. **Avoid blurry areas** - Sharp images convert more accurately\n4. **Check the output** - Zoom in to verify edge quality`,

    `## Preventing Fake Transparency\n\n### Better Prompting\n- Instead of asking for "transparent background," ask for "isolated on white background"\n- Then use a background removal tool to create true transparency\n\n### Post-Processing Workflow\n1. Generate AI image with solid background\n2. Use FixPic's background removal for true transparency\n3. Skip the fake transparency problem entirely`,

    `## Frequently Asked Questions\n\n### How do I know if my image has fake transparency?\nOpen the image in any editor. If you see a checkerboard pattern but the file doesn't have transparency, it's fake transparency.\n\n### Will this work on any checkerboard pattern?\nThe tool is optimized for AI-generated fake transparency patterns. Standard gray-white checkerboards work best.\n\n### Is the quality preserved?\nYes, our AI preserves image quality while converting fake transparency to real transparency.`,

    `## Conclusion\n\n${topic.title} is a quick fix with the right tool. FixPic's Fake Transparency Removal tool automatically detects and converts rendered checkerboard patterns to actual PNG transparency.\n\nStop struggling with fake transparency in your AI art. Try FixPic free and get real transparent backgrounds in seconds.`
  ]
  return sections.join('\n\n')
}

function generateCompressionContent(topic: ArticleTopic): string {
  const sections = [
    `## Introduction\n\n${topic.title} is essential for anyone working with digital images. Whether you're optimizing for web performance, reducing storage needs, or preparing images for email, understanding image compression helps you make better decisions.\n\nThis guide covers everything you need to know about ${topic.title.toLowerCase()}.`,

    `## Why Image Compression Matters\n\nImage file sizes affect many aspects of digital experience:\n\n- **Website Speed**: Large images slow page loading, hurting SEO and user experience\n- **Storage Costs**: Smaller files mean lower storage and bandwidth costs\n- **Email Delivery**: Many email providers limit attachment sizes\n- **Mobile Performance**: Compressed images load faster on mobile networks\n- **Core Web Vitals**: Google considers page speed in search rankings`,

    `## Types of Image Compression\n\n### Lossy Compression\nReduces file size by discarding some image data. Best for:\n- Photos and complex images\n- Web images where small quality loss is acceptable\n- Social media uploads\n\n### Lossless Compression\nReduces file size without any quality loss. Best for:\n- Graphics with text\n- Images that will be edited further\n- When quality is paramount`,

    `## How to Compress Images with FixPic\n\n### Step 1: Upload Your Image\n\nDrag and drop or click to upload. We support:\n- PNG, JPG, JPEG, WebP\n- Files up to 10MB\n- Multiple file formats\n\n### Step 2: Choose Compression Level\n\nSelect your preferred balance between quality and file size:\n- **High Quality**: Minimal compression, best quality\n- **Balanced**: Good compression with maintained quality\n- **Maximum Compression**: Smallest file size\n\n### Step 3: Download Compressed Image\n\nGet your optimized image instantly. Compare the before and after file sizes to see your savings.`,

    `## Image Format Comparison\n\n### JPEG\n- Best for: Photos, complex images\n- Compression: Lossy\n- Transparency: No\n- Typical savings: 60-90%\n\n### PNG\n- Best for: Graphics, screenshots, transparency\n- Compression: Lossless\n- Transparency: Yes\n- Typical savings: 20-50%\n\n### WebP\n- Best for: Web images (modern browsers)\n- Compression: Both lossy and lossless\n- Transparency: Yes\n- Typical savings: 25-34% smaller than JPEG`,

    `## Compression Best Practices\n\n1. **Start with high-quality originals** - You can always compress more later\n2. **Choose the right format** - JPEG for photos, PNG for graphics\n3. **Consider WebP** - Modern format with excellent compression\n4. **Test different settings** - Find your ideal quality/size balance\n5. **Batch process** - Save time by compressing multiple images at once`,

    `## Platform-Specific Guidelines\n\n### WordPress\n- Compress images before upload\n- Use lazy loading for below-fold images\n- Consider using WebP format\n\n### Social Media\n- Platforms re-compress uploads anyway\n- Moderate compression prevents double-compression artifacts\n- Follow platform dimension guidelines\n\n### Email\n- Keep images under 1MB each\n- Total email size under 10MB\n- Consider linking to hosted images`,

    `## Frequently Asked Questions\n\n### How much can I compress without visible quality loss?\nTypically, JPEG quality 80-85 provides excellent results. PNG can often be reduced 30-50% losslessly.\n\n### Will compression affect my image dimensions?\nNo, compression only affects file size. Dimensions remain the same unless you also resize.\n\n### What's the best format for web images?\nWebP offers the best compression for modern browsers. Use JPEG/PNG as fallbacks.\n\n### Is FixPic compression free?\nYes, our image compression tool is completely free with no limits.`,

    `## Conclusion\n\n${topic.title} is a crucial skill for anyone working with digital images. With FixPic's free compression tool, you can optimize images in seconds without sacrificing quality.\n\nStart optimizing your images today and enjoy faster websites, smaller file sizes, and better performance across all your digital platforms.`
  ]
  return sections.join('\n\n')
}

function generateResizeContent(topic: ArticleTopic): string {
  const sections = [
    `## Introduction\n\n${topic.title} is a fundamental image editing task that everyone encounters. Whether you're preparing images for social media, printing, or web use, knowing how to resize correctly ensures your images look their best.\n\nThis comprehensive guide covers everything about ${topic.title.toLowerCase()}.`,

    `## Why Image Dimensions Matter\n\nUsing the correct image dimensions is important for several reasons:\n\n- **Quality**: Wrong dimensions can cause stretching, pixelation, or cropping\n- **Performance**: Oversized images slow down websites and apps\n- **Platform Requirements**: Many platforms have specific size requirements\n- **Print Quality**: Print projects need specific resolutions\n- **Storage**: Unnecessarily large images waste storage space`,

    `## How to Resize Images with FixPic\n\n### Step 1: Upload Your Image\n\nUpload any image to FixPic's free image resizer. We support PNG, JPG, JPEG, and WebP files.\n\n### Step 2: Choose Your Dimensions\n\nEnter your desired dimensions or select from common presets:\n- Custom pixel dimensions\n- Percentage scaling\n- Common social media sizes\n- Print sizes\n\n### Step 3: Adjust Settings\n\n- **Maintain aspect ratio**: Prevent stretching\n- **Fit or Fill**: Choose how to handle different ratios\n- **Quality**: Balance file size and quality\n\n### Step 4: Download\n\nGet your resized image instantly. Free, no watermarks, no signup.`,

    `## Understanding Aspect Ratios\n\nAspect ratio is the relationship between width and height:\n\n### Common Aspect Ratios\n- **1:1** - Square (Instagram posts)\n- **4:3** - Traditional photos, presentations\n- **16:9** - Widescreen, YouTube thumbnails\n- **9:16** - Vertical video, Stories, Reels\n- **2:3** - Portrait photos, Pinterest pins\n\n### Maintaining Aspect Ratio\nWhen resizing, maintaining aspect ratio prevents distortion. Lock the ratio and adjust one dimension; the other updates automatically.`,

    `## Platform Size Guidelines\n\n### Social Media\n- **Instagram Post**: 1080 x 1080 px\n- **Instagram Story**: 1080 x 1920 px\n- **Facebook Post**: 1200 x 630 px\n- **Twitter Post**: 1200 x 675 px\n- **LinkedIn Post**: 1200 x 627 px\n- **Pinterest Pin**: 1000 x 1500 px\n- **YouTube Thumbnail**: 1280 x 720 px\n\n### E-commerce\n- **Amazon**: 1000 x 1000 px minimum\n- **eBay**: 1600 x 1600 px recommended\n- **Shopify**: 2048 x 2048 px maximum`,

    `## Resize vs. Crop: What's the Difference?\n\n### Resizing\n- Changes the overall dimensions\n- Scales the entire image up or down\n- Maintains all original content\n\n### Cropping\n- Removes parts of the image\n- Changes composition and framing\n- Can change aspect ratio\n\n### When to Use Each\n- **Resize** when you need different dimensions but want to keep the full image\n- **Crop** when you want to reframe or focus on specific areas`,

    `## Tips for Quality Resizing\n\n1. **Start large**: Scaling down preserves quality better than scaling up\n2. **Use the right algorithm**: Bicubic for photos, nearest neighbor for pixel art\n3. **Mind the DPI**: 72 DPI for web, 300 DPI for print\n4. **Don't over-enlarge**: Scaling up more than 200% causes noticeable quality loss\n5. **Batch process**: Resize multiple images at once for consistency`,

    `## Resolution and DPI Explained\n\n### DPI (Dots Per Inch)\n- Measures print density\n- 72 DPI: Standard for web/screen\n- 300 DPI: Standard for print\n\n### Megapixels\n- Total pixels in an image\n- Width x Height = Total pixels\n- Example: 4000 x 3000 = 12 megapixels\n\n### File Size\n- Affected by dimensions and compression\n- Larger dimensions = larger files\n- Compression can reduce size significantly`,

    `## Frequently Asked Questions\n\n### Can I make a small image larger without losing quality?\nEnlarging images always loses some quality. AI upscaling can help, but significant enlargement will show artifacts.\n\n### What's the maximum size I can resize to?\nThere's no technical maximum, but larger images use more memory and storage. Resize to what you actually need.\n\n### Will resizing change my image's aspect ratio?\nOnly if you disable "maintain aspect ratio." Keep it enabled to prevent stretching.\n\n### Is FixPic's resize tool free?\nYes, completely free with no signup or watermarks.`,

    `## Conclusion\n\n${topic.title} is simple with the right tool. FixPic's free image resizer gives you precise control over dimensions while maintaining quality.\n\nWhether you're preparing images for social media, e-commerce, or printing, proper resizing ensures your images look professional across all platforms. Try FixPic today and resize images effortlessly.`
  ]
  return sections.join('\n\n')
}

function generateGenericContent(topic: ArticleTopic, category: string): string {
  return `## Introduction\n\n${topic.title} is an important topic for anyone working with digital images. This guide provides comprehensive coverage of everything you need to know.\n\n## Overview\n\nUnderstanding ${topic.title.toLowerCase()} helps you work more efficiently and achieve better results with your images.\n\n## How to Use FixPic\n\nFixPic provides a free, easy-to-use tool for ${category.replace('-', ' ')}. Simply upload your image, let our AI process it, and download your result.\n\n## Conclusion\n\nTry FixPic's free tools today and see how easy image editing can be.`
}

function getRelatedArticles(currentSlug: string, allSlugs: string[], count: number = 3): string[] {
  return allSlugs
    .filter(s => s !== currentSlug)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

function generateArticle(topic: ArticleTopic, category: string, tool: string, allSlugs: string[]): Article {
  const content = generateContent(topic, category, tool)
  const wordCount = content.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)

  const now = new Date().toISOString()

  return {
    slug: topic.slug,
    category,
    tool,
    lang: 'en',
    title: topic.title,
    description: generateDescription(topic.title, category),
    keywords: generateKeywords(topic.title, category),
    content,
    publishedAt: now,
    updatedAt: now,
    readingTime,
    relatedArticles: getRelatedArticles(topic.slug, allSlugs)
  }
}

function main() {
  console.log('Starting article generation...\n')

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const articlesDir = path.join(__dirname, '../content/blog/articles/en')
  const indexDir = path.join(__dirname, '../content/blog/index')

  const allArticles: Article[] = []

  for (const category of categories) {
    const categoryDir = path.join(articlesDir, category.id)

    // Ensure directory exists
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true })
    }

    const allSlugs = category.topics.map(t => t.slug)

    console.log(`Generating ${category.topics.length} articles for ${category.id}...`)

    for (const topic of category.topics) {
      const article = generateArticle(topic, category.id, category.tool, allSlugs)

      // Write article file
      const articlePath = path.join(categoryDir, `${topic.slug}.json`)
      fs.writeFileSync(articlePath, JSON.stringify(article, null, 2))

      allArticles.push(article)
    }

    console.log(`  ✓ Generated ${category.topics.length} articles`)
  }

  // Generate index file
  console.log('\nGenerating index file...')

  const categoryCounts: Record<string, number> = {}
  for (const cat of categories) {
    categoryCounts[cat.id] = cat.topics.length
  }

  const index = {
    lang: 'en',
    articles: allArticles.map(a => ({
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
    categoryCounts,
    totalCount: allArticles.length,
    updatedAt: new Date().toISOString()
  }

  fs.writeFileSync(path.join(indexDir, 'en.json'), JSON.stringify(index, null, 2))

  console.log(`\n✅ Complete! Generated ${allArticles.length} articles.`)
  console.log(`  - Background Removal: ${categoryCounts['background-removal']}`)
  console.log(`  - Watermark Removal: ${categoryCounts['watermark-removal']}`)
  console.log(`  - Fake Transparency: ${categoryCounts['fake-transparency']}`)
  console.log(`  - Compression: ${categoryCounts['compression']}`)
  console.log(`  - Resize: ${categoryCounts['resize']}`)
}

main()
