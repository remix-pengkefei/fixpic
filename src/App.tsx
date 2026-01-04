import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as Sentry from '@sentry/react'
import { languages } from './i18n'
import './App.css'

type Tool = 'ai-remove-bg' | 'remove-watermark' | 'remove-bg' | 'compress' | 'resize'

// URL 路径与工具 ID 映射
const urlToTool: Record<string, Tool> = {
  'ai-remove-background': 'ai-remove-bg',
  'remove-watermark': 'remove-watermark',
  'remove-fake-transparency': 'remove-bg',
  'compress': 'compress',
  'resize': 'resize'
}

const toolToUrl: Record<Tool, string> = {
  'ai-remove-bg': 'ai-remove-background',
  'remove-watermark': 'remove-watermark',
  'remove-bg': 'remove-fake-transparency',
  'compress': 'compress',
  'resize': 'resize'
}

const supportedLangs = [
  'en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'it', 'ru',
  'vi', 'th', 'id', 'ms', 'tr', 'nl', 'el', 'cs', 'hu', 'uk', 'ar'
]

interface PendingFile {
  file: File
  preview: string
}

interface ProcessedImage {
  original: File
  result: Blob
  originalSize: number
  resultSize: number
  preview: string
}

function App() {
  const { t, i18n } = useTranslation()
  const { lang, tool } = useParams<{ lang: string; tool: string }>()
  const navigate = useNavigate()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  // 从 URL 解析当前工具
  const activeTool: Tool = tool && urlToTool[tool] ? urlToTool[tool] : 'ai-remove-bg'

  // 同步 URL 语言到 i18n
  useEffect(() => {
    if (lang && supportedLangs.includes(lang) && lang !== i18n.language) {
      i18n.changeLanguage(lang)
      localStorage.setItem('fixpic-language', lang)
    }
  }, [lang, i18n])
  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState<number | null>(null)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [results, setResults] = useState<ProcessedImage[]>([])
  const [error, setError] = useState<string | null>(null)

  // AI 背景移除状态
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [aiProcessing, setAiProcessing] = useState(false)

  // 去水印状态
  const [wmUploadedImage, setWmUploadedImage] = useState<string | null>(null)
  const [wmUploadedFile, setWmUploadedFile] = useState<File | null>(null)
  const [wmResultImage, setWmResultImage] = useState<string | null>(null)
  const [wmProcessing, setWmProcessing] = useState(false)
  const [wmRemoveText, setWmRemoveText] = useState(false)

  // 压缩选项
  const [quality, setQuality] = useState(85)
  const [outputFormat, setOutputFormat] = useState<'webp' | 'png' | 'jpeg'>('webp')

  // 尺寸调整选项
  const [resizeWidth, setResizeWidth] = useState<number | null>(null)
  const [resizeHeight, setResizeHeight] = useState<number | null>(null)
  const [keepAspectRatio, setKeepAspectRatio] = useState(true)
  const [resizeFormat, setResizeFormat] = useState<'webp' | 'png' | 'jpeg'>('png')
  const [resizeQuality] = useState(100)

  // 清理预览 URL
  useEffect(() => {
    return () => {
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
      results.forEach(r => URL.revokeObjectURL(r.preview))
    }
  }, [])

  // 动态更新 SEO 元数据
  useEffect(() => {
    // 获取当前工具的 URL 名称
    const currentToolUrl = toolToUrl[activeTool]
    // 尝试获取工具特定的 SEO 内容，如果没有则使用默认
    const toolTitle = t(`seo.tools.${currentToolUrl}.title`, { defaultValue: '' }) || t('seo.title')
    const toolDescription = t(`seo.tools.${currentToolUrl}.description`, { defaultValue: '' }) || t('seo.description')

    document.title = toolTitle
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', toolDescription)
    }
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', toolTitle)
    }
    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) {
      ogDescription.setAttribute('content', toolDescription)
    }
    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    if (twitterTitle) {
      twitterTitle.setAttribute('content', toolTitle)
    }
    const twitterDescription = document.querySelector('meta[name="twitter:description"]')
    if (twitterDescription) {
      twitterDescription.setAttribute('content', toolDescription)
    }
    // 更新 html lang 属性
    document.documentElement.lang = lang || i18n.language

    // 更新 canonical URL
    const currentUrl = `https://fix-pic.com/${lang || 'en'}/${currentToolUrl}`
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (canonicalLink) {
      canonicalLink.href = currentUrl
    }

    // 更新 og:url
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) {
      ogUrl.setAttribute('content', currentUrl)
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
      link.href = `https://fix-pic.com/${langCode}/${currentToolUrl}`
      document.head.appendChild(link)
    })

    // 添加 x-default
    const xDefaultLink = document.createElement('link')
    xDefaultLink.rel = 'alternate'
    xDefaultLink.hreflang = 'x-default'
    xDefaultLink.href = `https://fix-pic.com/en/${currentToolUrl}`
    document.head.appendChild(xDefaultLink)

    // 更新 JSON-LD 结构化数据
    const toolNames: Record<string, { en: string; type: string }> = {
      'ai-remove-background': { en: 'AI Background Remover', type: 'ImageEditorApplication' },
      'remove-watermark': { en: 'AI Watermark Remover', type: 'ImageEditorApplication' },
      'remove-fake-transparency': { en: 'Fake Transparency Remover', type: 'ImageEditorApplication' },
      'compress': { en: 'Image Compressor', type: 'ImageEditorApplication' },
      'resize': { en: 'Image Resizer', type: 'ImageEditorApplication' }
    }

    const toolInfo = toolNames[currentToolUrl] || toolNames['ai-remove-background']

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': `${currentUrl}#app`,
          name: `FixPic - ${toolInfo.en}`,
          description: toolDescription,
          url: currentUrl,
          applicationCategory: toolInfo.type,
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          },
          provider: {
            '@type': 'Organization',
            name: 'FixPic',
            url: 'https://fix-pic.com'
          }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'FixPic',
              item: 'https://fix-pic.com'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: toolInfo.en,
              item: currentUrl
            }
          ]
        }
      ]
    }

    let jsonLdScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script')
      jsonLdScript.type = 'application/ld+json'
      document.head.appendChild(jsonLdScript)
    }
    jsonLdScript.textContent = JSON.stringify(jsonLd)
  }, [i18n.language, t, activeTool, lang])

  // AI 背景移除
  const aiRemoveBackground = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/remove-bg', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process image')
    }

    if (data.status === 'success') {
      return data.output
    }

    if (data.status === 'processing' && data.id) {
      return await pollForResult(data.id)
    }

    throw new Error('Unexpected response')
  }, [])

  // 轮询获取结果
  const pollForResult = async (id: string): Promise<string> => {
    const maxAttempts = 60
    let attempts = 0

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000))

      const response = await fetch(`/api/remove-bg/${id}`)
      const data = await response.json()

      if (data.status === 'success') {
        return data.output
      }

      if (data.status === 'failed') {
        throw new Error(data.error || 'Processing failed')
      }

      attempts++
    }

    throw new Error('Processing timeout')
  }

  // 处理 AI 背景移除
  const handleAiRemoveBg = useCallback(async () => {
    if (!uploadedFile) return

    setAiProcessing(true)
    setError(null)
    setResultImage(null)

    try {
      const result = await aiRemoveBackground(uploadedFile)
      setResultImage(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed'
      setError(errorMessage)
      Sentry.captureException(err, {
        tags: { api: 'ai-remove-background' },
        extra: { fileName: uploadedFile.name, fileSize: uploadedFile.size }
      })
    } finally {
      setAiProcessing(false)
    }
  }, [uploadedFile, aiRemoveBackground])

  // 去水印 API
  const removeWatermark = useCallback(async (file: File, removeText: boolean): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)
    if (removeText) {
      formData.append('remove_text', 'true')
    }

    const response = await fetch('/api/remove-watermark', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process image')
    }

    if (data.status === 'success') {
      return data.output
    }

    throw new Error('Unexpected response')
  }, [])

  // 处理去水印
  const handleRemoveWatermark = useCallback(async () => {
    if (!wmUploadedFile) return

    setWmProcessing(true)
    setError(null)
    setWmResultImage(null)

    try {
      const result = await removeWatermark(wmUploadedFile, wmRemoveText)
      setWmResultImage(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed'
      setError(errorMessage)
      Sentry.captureException(err, {
        tags: { api: 'remove-watermark' },
        extra: { fileName: wmUploadedFile.name, fileSize: wmUploadedFile.size, removeText: wmRemoveText }
      })
    } finally {
      setWmProcessing(false)
    }
  }, [wmUploadedFile, wmRemoveText, removeWatermark])

  // 下载去水印结果
  const downloadWmResult = useCallback(async () => {
    if (!wmResultImage || !wmUploadedFile) return

    try {
      const response = await fetch(wmResultImage)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const baseName = wmUploadedFile.name.replace(/\.[^.]+$/, '')
      link.download = `${baseName}_no_watermark.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      const link = document.createElement('a')
      const baseName = wmUploadedFile.name.replace(/\.[^.]+$/, '')
      link.download = `${baseName}_no_watermark.png`
      link.href = wmResultImage
      link.click()
    }
  }, [wmResultImage, wmUploadedFile])

  // 下载 AI 结果
  const downloadAiResult = useCallback(async () => {
    if (!resultImage || !uploadedFile) return

    try {
      const response = await fetch(resultImage)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const baseName = uploadedFile.name.replace(/\.[^.]+$/, '')
      link.download = `${baseName}_no_bg.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      const link = document.createElement('a')
      const baseName = uploadedFile.name.replace(/\.[^.]+$/, '')
      link.download = `${baseName}_no_bg.png`
      link.href = resultImage
      link.click()
    }
  }, [resultImage, uploadedFile])

  // 去除假透明背景
  const removeFakeTransparency = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        const sampleSize = Math.min(20, Math.floor(Math.min(canvas.width, canvas.height) / 10))
        let minVal = 255
        let grayCount = 0
        let totalSamples = 0

        const sampleCorner = (startX: number, startY: number) => {
          for (let y = startY; y < startY + sampleSize && y < canvas.height; y++) {
            for (let x = startX; x < startX + sampleSize && x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4
              const r = data[idx], g = data[idx + 1], b = data[idx + 2]
              const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
              if (diff < 20) {
                grayCount++
                minVal = Math.min(minVal, r, g, b)
              }
              totalSamples++
            }
          }
        }

        sampleCorner(0, 0)
        sampleCorner(canvas.width - sampleSize, 0)
        sampleCorner(0, canvas.height - sampleSize)
        sampleCorner(canvas.width - sampleSize, canvas.height - sampleSize)

        const isGrayBg = grayCount / totalSamples > 0.7
        const threshold = isGrayBg ? Math.max(150, minVal - 10) : 220

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const isGray = r > threshold && g > threshold && b > threshold
          const isSimilar = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20
          if (isGray && isSimilar) {
            data[i + 3] = 0
          }
        }

        ctx.putImageData(imageData, 0, 0)
        canvas.toBlob(blob => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, 'image/png')
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }, [])

  // 压缩图片
  const compressImage = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)

        const mimeType = outputFormat === 'webp' ? 'image/webp'
          : outputFormat === 'png' ? 'image/png' : 'image/jpeg'
        const q = outputFormat === 'png' ? undefined : quality / 100

        canvas.toBlob(blob => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, mimeType, q)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }, [quality, outputFormat])

  // 调整尺寸
  const resizeImage = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        let width = resizeWidth || img.width
        let height = resizeHeight || img.height

        if (keepAspectRatio) {
          if (resizeWidth && !resizeHeight) {
            height = Math.round(img.height * (resizeWidth / img.width))
          } else if (resizeHeight && !resizeWidth) {
            width = Math.round(img.width * (resizeHeight / img.height))
          } else if (resizeWidth && resizeHeight) {
            const ratio = Math.min(resizeWidth / img.width, resizeHeight / img.height)
            width = Math.round(img.width * ratio)
            height = Math.round(img.height * ratio)
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        const mimeType = resizeFormat === 'webp' ? 'image/webp'
          : resizeFormat === 'png' ? 'image/png' : 'image/jpeg'
        const q = resizeFormat === 'png' ? undefined : resizeQuality / 100

        canvas.toBlob(blob => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, mimeType, q)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }, [resizeWidth, resizeHeight, keepAspectRatio, resizeFormat, resizeQuality])

  // 添加文件到待处理列表
  const addFiles = useCallback((files: FileList | File[]) => {
    const newPending: PendingFile[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      newPending.push({
        file,
        preview: URL.createObjectURL(file)
      })
    }
    setPendingFiles(prev => [...prev, ...newPending])
  }, [])

  // 处理单个文件
  const processSingleFile = useCallback(async (index: number) => {
    const pending = pendingFiles[index]
    if (!pending) return

    setProcessingIndex(index)
    try {
      const result = activeTool === 'remove-bg'
        ? await removeFakeTransparency(pending.file)
        : activeTool === 'resize'
        ? await resizeImage(pending.file)
        : await compressImage(pending.file)

      setResults(prev => [...prev, {
        original: pending.file,
        result,
        originalSize: pending.file.size,
        resultSize: result.size,
        preview: URL.createObjectURL(result)
      }])

      setPendingFiles(prev => prev.filter((_, i) => i !== index))
    } catch (err) {
      console.error('处理失败:', pending.file.name, err)
      Sentry.captureException(err, {
        tags: { api: activeTool },
        extra: { fileName: pending.file.name, fileSize: pending.file.size }
      })
    }
    setProcessingIndex(null)
  }, [pendingFiles, activeTool, removeFakeTransparency, compressImage, resizeImage])

  // 批量处理所有文件
  const processAllFiles = useCallback(async () => {
    setProcessing(true)
    const newResults: ProcessedImage[] = []

    for (let i = 0; i < pendingFiles.length; i++) {
      const pending = pendingFiles[i]
      setProcessingIndex(i)
      try {
        const result = activeTool === 'remove-bg'
          ? await removeFakeTransparency(pending.file)
          : activeTool === 'resize'
          ? await resizeImage(pending.file)
          : await compressImage(pending.file)

        newResults.push({
          original: pending.file,
          result,
          originalSize: pending.file.size,
          resultSize: result.size,
          preview: URL.createObjectURL(result)
        })
      } catch (err) {
        console.error('处理失败:', pending.file.name, err)
        Sentry.captureException(err, {
          tags: { api: activeTool, batch: true },
          extra: { fileName: pending.file.name, fileSize: pending.file.size }
        })
      }
    }

    setResults(prev => [...prev, ...newResults])
    setPendingFiles([])
    setProcessingIndex(null)
    setProcessing(false)
  }, [pendingFiles, activeTool, removeFakeTransparency, compressImage, resizeImage])

  // 移除待处理文件
  const removePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // 清空待处理列表
  const clearPendingFiles = useCallback(() => {
    pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
    setPendingFiles([])
  }, [pendingFiles])

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      if (activeTool === 'ai-remove-bg') {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith('image/')) {
          setUploadedFile(file)
          setUploadedImage(URL.createObjectURL(file))
          setResultImage(null)
          setError(null)
        }
      } else if (activeTool === 'remove-watermark') {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith('image/')) {
          setWmUploadedFile(file)
          setWmUploadedImage(URL.createObjectURL(file))
          setWmResultImage(null)
          setError(null)
        }
      } else {
        addFiles(e.dataTransfer.files)
      }
    }
  }, [addFiles, activeTool])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (activeTool === 'ai-remove-bg') {
        const file = e.target.files[0]
        if (file.type.startsWith('image/')) {
          setUploadedFile(file)
          setUploadedImage(URL.createObjectURL(file))
          setResultImage(null)
          setError(null)
        }
      } else if (activeTool === 'remove-watermark') {
        const file = e.target.files[0]
        if (file.type.startsWith('image/')) {
          setWmUploadedFile(file)
          setWmUploadedImage(URL.createObjectURL(file))
          setWmResultImage(null)
          setError(null)
        }
      } else {
        addFiles(e.target.files)
      }
      e.target.value = ''
    }
  }, [addFiles, activeTool])

  // 下载单个文件
  const downloadFile = useCallback((result: ProcessedImage) => {
    const link = document.createElement('a')
    const ext = activeTool === 'remove-bg' ? 'png'
      : activeTool === 'resize' ? resizeFormat
      : outputFormat
    const baseName = result.original.name.replace(/\.[^.]+$/, '')
    link.download = `${baseName}_processed.${ext}`
    link.href = result.preview
    link.click()
  }, [activeTool, outputFormat, resizeFormat])

  // 下载全部
  const downloadAll = useCallback(() => {
    results.forEach(r => downloadFile(r))
  }, [results, downloadFile])

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${bytes} B`
  }

  // 切换工具时清理状态并导航
  const switchTool = useCallback((newTool: Tool) => {
    const currentLang = lang && supportedLangs.includes(lang) ? lang : 'en'
    navigate(`/${currentLang}/${toolToUrl[newTool]}`)
    setResults([])
    clearPendingFiles()
    setUploadedImage(null)
    setUploadedFile(null)
    setResultImage(null)
    setWmUploadedImage(null)
    setWmUploadedFile(null)
    setWmResultImage(null)
    setError(null)
  }, [clearPendingFiles, lang, navigate])

  const changeLanguage = (lng: string) => {
    const currentTool = toolToUrl[activeTool]
    navigate(`/${lng}/${currentTool}`)
    setShowLanguageMenu(false)
  }

  const currentLang = languages.find(l => l.code === (lang || i18n.language)) || languages.find(l => l.code === 'en')!

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">F</span>
            <span className="logo-text">ix-Pic</span>
          </div>
          <p className="tagline">{t('app.tagline')}</p>
        </div>
        <div className="header-right">
          <Link to={`/${lang || 'en'}/blog`} className="blog-link">
            Blog
          </Link>
          <div className="language-switcher">
          <button
            className="language-btn"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <span className="lang-flag">{currentLang.flag}</span>
            <span className="lang-name">{currentLang.name}</span>
            <span className="lang-arrow">▼</span>
          </button>
          {showLanguageMenu && (
            <div className="language-menu">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  <span className="lang-flag">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
          </div>
        </div>
      </header>

      {/* Tool Selector */}
      <div className="tool-selector">
        <button
          className={`tool-btn ${activeTool === 'ai-remove-bg' ? 'active' : ''}`}
          onClick={() => switchTool('ai-remove-bg')}
        >
          <span className="tool-icon">✨</span>
          <span>{t('tools.aiRemoveBg')}</span>
        </button>
        <button
          className={`tool-btn ${activeTool === 'remove-watermark' ? 'active' : ''}`}
          onClick={() => switchTool('remove-watermark')}
        >
          <span className="tool-icon">💧</span>
          <span>{t('tools.removeWatermark')}</span>
        </button>
        <button
          className={`tool-btn ${activeTool === 'remove-bg' ? 'active' : ''}`}
          onClick={() => switchTool('remove-bg')}
        >
          <span className="tool-icon">🔲</span>
          <span>{t('tools.removeFakeTransparency')}</span>
        </button>
        <button
          className={`tool-btn ${activeTool === 'compress' ? 'active' : ''}`}
          onClick={() => switchTool('compress')}
        >
          <span className="tool-icon">📦</span>
          <span>{t('tools.compress')}</span>
        </button>
        <button
          className={`tool-btn ${activeTool === 'resize' ? 'active' : ''}`}
          onClick={() => switchTool('resize')}
        >
          <span className="tool-icon">📐</span>
          <span>{t('tools.resize')}</span>
        </button>
      </div>

      {/* Tool Description */}
      <div className="tool-description">
        {activeTool === 'ai-remove-bg' ? (
          <p>{t('descriptions.aiRemoveBg')}</p>
        ) : activeTool === 'remove-watermark' ? (
          <p>{t('descriptions.removeWatermark')}</p>
        ) : activeTool === 'remove-bg' ? (
          <p>{t('descriptions.removeFakeTransparency')}</p>
        ) : activeTool === 'resize' ? (
          <p>{t('descriptions.resize')}</p>
        ) : (
          <p>{t('descriptions.compress')}</p>
        )}
      </div>

      {/* AI Remove Background Tool */}
      {activeTool === 'ai-remove-bg' && (
        <div className="ai-remove-bg-container">
          <div className="ai-panels">
            {/* Upload Panel */}
            <div className="ai-panel">
              <div className="ai-panel-header">
                <h3>{t('upload.title')}</h3>
              </div>
              <div
                className={`ai-upload-zone ${isDragging ? 'dragging' : ''} ${uploadedImage ? 'has-image' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('ai-file-input')?.click()}
              >
                <input
                  id="ai-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Uploaded" className="ai-preview-image" />
                ) : (
                  <div className="ai-upload-placeholder">
                    <div className="ai-upload-icon">📤</div>
                    <p>{t('upload.dragDrop')}</p>
                    <p className="ai-upload-hint">{t('upload.dragDropHint')}</p>
                  </div>
                )}
              </div>
              <button
                className="ai-process-btn"
                onClick={handleAiRemoveBg}
                disabled={!uploadedFile || aiProcessing}
              >
                {aiProcessing ? (
                  <>
                    <span className="spinner-inline"></span>
                    {t('process.processing')}
                  </>
                ) : (
                  <>✨ {t('process.removeBackground')}</>
                )}
              </button>
            </div>

            {/* Result Panel */}
            <div className="ai-panel">
              <div className="ai-panel-header">
                <h3>{t('process.result')}</h3>
                {resultImage && (
                  <button className="ai-download-btn" onClick={downloadAiResult}>
                    {t('process.download')}
                  </button>
                )}
              </div>
              <div className="ai-result-zone">
                {aiProcessing ? (
                  <div className="ai-processing">
                    <div className="spinner"></div>
                    <p>{t('process.aiProcessing')}</p>
                    <p className="ai-processing-hint">{t('process.processingHint')}</p>
                  </div>
                ) : resultImage ? (
                  <img src={resultImage} alt="Result" className="ai-result-image" />
                ) : error ? (
                  <div className="ai-error">
                    <p>{t('process.failed')}</p>
                    <p className="ai-error-detail">{error}</p>
                  </div>
                ) : (
                  <div className="ai-result-placeholder">
                    <div className="ai-result-icon">🖼️</div>
                    <p>{t('process.resultPlaceholder')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Watermark Tool */}
      {activeTool === 'remove-watermark' && (
        <div className="ai-remove-bg-container">
          {/* Options */}
          <div className="options" style={{ marginBottom: '20px' }}>
            <div className="option-group">
              <label>{t('options.removeText')}</label>
              <div className="format-btns">
                <button
                  className={wmRemoveText ? 'active' : ''}
                  onClick={() => setWmRemoveText(true)}
                >
                  {t('options.yes')}
                </button>
                <button
                  className={!wmRemoveText ? 'active' : ''}
                  onClick={() => setWmRemoveText(false)}
                >
                  {t('options.no')}
                </button>
              </div>
            </div>
          </div>

          <div className="ai-panels">
            {/* Upload Panel */}
            <div className="ai-panel">
              <div className="ai-panel-header">
                <h3>{t('upload.title')}</h3>
              </div>
              <div
                className={`ai-upload-zone ${isDragging ? 'dragging' : ''} ${wmUploadedImage ? 'has-image' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('wm-file-input')?.click()}
              >
                <input
                  id="wm-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {wmUploadedImage ? (
                  <img src={wmUploadedImage} alt="Uploaded" className="ai-preview-image" />
                ) : (
                  <div className="ai-upload-placeholder">
                    <div className="ai-upload-icon">📤</div>
                    <p>{t('upload.dragDrop')}</p>
                    <p className="ai-upload-hint">{t('upload.dragDropHint')}</p>
                  </div>
                )}
              </div>
              <button
                className="ai-process-btn"
                onClick={handleRemoveWatermark}
                disabled={!wmUploadedFile || wmProcessing}
              >
                {wmProcessing ? (
                  <>
                    <span className="spinner-inline"></span>
                    {t('process.processing')}
                  </>
                ) : (
                  <>💧 {t('process.removeWatermark')}</>
                )}
              </button>
            </div>

            {/* Result Panel */}
            <div className="ai-panel">
              <div className="ai-panel-header">
                <h3>{t('process.result')}</h3>
                {wmResultImage && (
                  <button className="ai-download-btn" onClick={downloadWmResult}>
                    {t('process.download')}
                  </button>
                )}
              </div>
              <div className="ai-result-zone">
                {wmProcessing ? (
                  <div className="ai-processing">
                    <div className="spinner"></div>
                    <p>{t('process.aiProcessing')}</p>
                    <p className="ai-processing-hint">{t('process.processingHint')}</p>
                  </div>
                ) : wmResultImage ? (
                  <img src={wmResultImage} alt="Result" className="ai-result-image" />
                ) : error ? (
                  <div className="ai-error">
                    <p>{t('process.failed')}</p>
                    <p className="ai-error-detail">{error}</p>
                  </div>
                ) : (
                  <div className="ai-result-placeholder">
                    <div className="ai-result-icon">🖼️</div>
                    <p>{t('process.resultPlaceholder')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Options for compress tool */}
      {activeTool === 'compress' && (
        <div className="options">
          <div className="option-group">
            <label>{t('options.outputFormat')}</label>
            <div className="format-btns">
              {(['webp', 'jpeg', 'png'] as const).map(fmt => (
                <button
                  key={fmt}
                  className={outputFormat === fmt ? 'active' : ''}
                  onClick={() => setOutputFormat(fmt)}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="option-group">
            <label>
              {t('options.compression')} {outputFormat === 'png'
                ? ''
                : `${quality}%${quality >= 80 ? ` (${t('options.highQuality')})` : quality >= 50 ? ` (${t('options.slightLoss')})` : ` (${t('options.poorQuality')})`}`}
            </label>
            {outputFormat === 'png' ? (
              <div style={{ fontSize: '12px', color: '#999' }}>{t('options.pngLossless')}</div>
            ) : (
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
              />
            )}
          </div>
        </div>
      )}

      {/* Options for resize tool */}
      {activeTool === 'resize' && (
        <div className="options">
          <div className="option-group">
            <label>{t('options.width')}</label>
            <div className="width-input">
              <input
                type="number"
                placeholder={t('options.auto')}
                value={resizeWidth || ''}
                onChange={e => setResizeWidth(e.target.value ? Number(e.target.value) : null)}
              />
              <span>{t('options.px')}</span>
            </div>
          </div>

          <div className="option-group">
            <label>{t('options.height')}</label>
            <div className="width-input">
              <input
                type="number"
                placeholder={t('options.auto')}
                value={resizeHeight || ''}
                onChange={e => setResizeHeight(e.target.value ? Number(e.target.value) : null)}
              />
              <span>{t('options.px')}</span>
            </div>
          </div>

          <div className="option-group">
            <label>{t('options.keepAspectRatio')}</label>
            <div className="format-btns">
              <button
                className={keepAspectRatio ? 'active' : ''}
                onClick={() => setKeepAspectRatio(true)}
              >
                {t('options.yes')}
              </button>
              <button
                className={!keepAspectRatio ? 'active' : ''}
                onClick={() => setKeepAspectRatio(false)}
              >
                {t('options.no')}
              </button>
            </div>
          </div>

          <div className="option-group">
            <label>{t('options.outputFormat')}</label>
            <div className="format-btns">
              {(['png', 'webp', 'jpeg'] as const).map(fmt => (
                <button
                  key={fmt}
                  className={resizeFormat === fmt ? 'active' : ''}
                  onClick={() => setResizeFormat(fmt)}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone for other tools */}
      {activeTool !== 'ai-remove-bg' && activeTool !== 'remove-watermark' && (
        <>
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div className="drop-icon">
              {activeTool === 'remove-bg' ? '🖼️' : activeTool === 'resize' ? '📐' : '📁'}
            </div>
            <p className="drop-text">{t('upload.dropHere')}</p>
            <p className="drop-hint">{t('upload.batchHint')}</p>
          </div>

          {/* Pending Files */}
          {pendingFiles.length > 0 && (
            <div className="pending-section">
              <div className="pending-header">
                <h3>{t('pending.title')} ({pendingFiles.length})</h3>
                <div className="pending-actions">
                  <button className="clear-btn" onClick={clearPendingFiles}>
                    {t('pending.clear')}
                  </button>
                  <button
                    className="process-all-btn"
                    onClick={processAllFiles}
                    disabled={processing}
                  >
                    {processing ? t('pending.processing') : t('pending.processAll')}
                  </button>
                </div>
              </div>

              <div className="pending-grid">
                {pendingFiles.map((p, i) => (
                  <div key={i} className={`pending-card ${processingIndex === i ? 'processing' : ''}`}>
                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removePendingFile(i) }}>×</button>
                    <div className="pending-preview">
                      <img src={p.preview} alt={p.file.name} />
                      {processingIndex === i && (
                        <div className="pending-overlay">
                          <div className="spinner-small"></div>
                        </div>
                      )}
                    </div>
                    <div className="pending-info">
                      <p className="pending-name">{p.file.name}</p>
                      <p className="pending-size">{formatSize(p.file.size)}</p>
                    </div>
                    <button
                      className="process-btn"
                      onClick={() => processSingleFile(i)}
                      disabled={processing || processingIndex !== null}
                    >
                      {t('pending.process')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="results">
              <div className="results-header">
                <h3>{t('results.title')} ({results.length})</h3>
                <button className="download-all-btn" onClick={downloadAll}>
                  {t('results.downloadAll')}
                </button>
              </div>

              <div className="results-grid">
                {results.map((r, i) => (
                  <div key={i} className="result-card">
                    <div className="result-preview">
                      <img src={r.preview} alt={r.original.name} />
                    </div>
                    <div className="result-info">
                      <p className="result-name">{r.original.name}</p>
                      <p className="result-size">
                        {formatSize(r.originalSize)} → {formatSize(r.resultSize)}
                        <span className={r.resultSize < r.originalSize ? 'saved' : 'increased'}>
                          {r.resultSize < r.originalSize
                            ? ` (${t('results.saved')} ${Math.round((1 - r.resultSize / r.originalSize) * 100)}%)`
                            : ` (${t('results.increased')} ${Math.round((r.resultSize / r.originalSize - 1) * 100)}%)`
                          }
                        </span>
                      </p>
                    </div>
                    <button className="download-btn" onClick={() => downloadFile(r)}>
                      {t('results.download')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>{t('app.footer')}</p>
      </footer>
    </div>
  )
}

export default App
