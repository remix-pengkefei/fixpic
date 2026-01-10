import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as Sentry from '@sentry/react'

import type { Tool, PendingFile, ProcessedImage } from './types'
import { urlToTool, toolToUrl, supportedLangs } from './types'
import { removeFakeTransparency, compressImage, resizeImage } from './utils/imageProcessing'
import { aiRemoveBackground, removeWatermark, downloadImage } from './utils/api'
import { useSEO } from './hooks/useSEO'
import {
  Header,
  ToolSelector,
  Footer,
  AiToolPanel,
  BatchProcessor,
  CompressOptions,
  ResizeOptions,
  WatermarkOptions,
} from './components'
import './App.css'

function App() {
  const { t } = useTranslation()
  const { lang, tool } = useParams<{ lang: string; tool: string }>()
  const navigate = useNavigate()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const activeTool: Tool = tool && urlToTool[tool] ? urlToTool[tool] : 'ai-remove-bg'

  // 同步 URL 语言到 i18n
  const { i18n } = useTranslation()
  useEffect(() => {
    if (lang && supportedLangs.includes(lang) && lang !== i18n.language) {
      i18n.changeLanguage(lang)
      localStorage.setItem('fixpic-language', lang)
    }
  }, [lang, i18n])

  // SEO
  useSEO(activeTool, lang)

  // 通用状态
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AI 抠图状态
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

  // 批量处理状态
  const [processing, setProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState<number | null>(null)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [results, setResults] = useState<ProcessedImage[]>([])

  // 压缩选项
  const [quality, setQuality] = useState(85)
  const [outputFormat, setOutputFormat] = useState<'webp' | 'png' | 'jpeg'>('webp')

  // 调整尺寸选项
  const [resizeWidth, setResizeWidth] = useState<number | null>(null)
  const [resizeHeight, setResizeHeight] = useState<number | null>(null)
  const [keepAspectRatio, setKeepAspectRatio] = useState(true)
  const [resizeFormat, setResizeFormat] = useState<'webp' | 'png' | 'jpeg'>('png')
  const resizeQuality = 100

  // 清理预览 URL
  useEffect(() => {
    return () => {
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
      results.forEach(r => URL.revokeObjectURL(r.preview))
    }
  }, [])

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
  }, [activeTool])

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
  }, [activeTool])

  // AI 抠图处理
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
  }, [uploadedFile])

  // 去水印处理
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
  }, [wmUploadedFile, wmRemoveText])

  // 下载结果
  const downloadAiResult = useCallback(async () => {
    if (!resultImage || !uploadedFile) return
    const baseName = uploadedFile.name.replace(/\.[^.]+$/, '')
    await downloadImage(resultImage, `${baseName}_no_bg.png`)
  }, [resultImage, uploadedFile])

  const downloadWmResult = useCallback(async () => {
    if (!wmResultImage || !wmUploadedFile) return
    const baseName = wmUploadedFile.name.replace(/\.[^.]+$/, '')
    await downloadImage(wmResultImage, `${baseName}_no_watermark.png`)
  }, [wmResultImage, wmUploadedFile])

  // 批量处理相关
  const addFiles = useCallback((files: FileList | File[]) => {
    const newPending: PendingFile[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      newPending.push({ file, preview: URL.createObjectURL(file) })
    }
    setPendingFiles(prev => [...prev, ...newPending])
  }, [])

  const processSingleFile = useCallback(async (index: number) => {
    const pending = pendingFiles[index]
    if (!pending) return
    setProcessingIndex(index)
    try {
      const result = activeTool === 'remove-bg'
        ? await removeFakeTransparency(pending.file)
        : activeTool === 'resize'
        ? await resizeImage(pending.file, resizeWidth, resizeHeight, keepAspectRatio, resizeFormat, resizeQuality)
        : await compressImage(pending.file, outputFormat, quality)

      setResults(prev => [...prev, {
        original: pending.file,
        result,
        originalSize: pending.file.size,
        resultSize: result.size,
        preview: URL.createObjectURL(result)
      }])
      setPendingFiles(prev => prev.filter((_, i) => i !== index))
    } catch (err) {
      Sentry.captureException(err, {
        tags: { api: activeTool },
        extra: { fileName: pending.file.name, fileSize: pending.file.size }
      })
    }
    setProcessingIndex(null)
  }, [pendingFiles, activeTool, resizeWidth, resizeHeight, keepAspectRatio, resizeFormat, resizeQuality, outputFormat, quality])

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
          ? await resizeImage(pending.file, resizeWidth, resizeHeight, keepAspectRatio, resizeFormat, resizeQuality)
          : await compressImage(pending.file, outputFormat, quality)

        newResults.push({
          original: pending.file,
          result,
          originalSize: pending.file.size,
          resultSize: result.size,
          preview: URL.createObjectURL(result)
        })
      } catch (err) {
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
  }, [pendingFiles, activeTool, resizeWidth, resizeHeight, keepAspectRatio, resizeFormat, resizeQuality, outputFormat, quality])

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const clearPendingFiles = useCallback(() => {
    pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
    setPendingFiles([])
  }, [pendingFiles])

  const downloadFile = useCallback((result: ProcessedImage) => {
    const link = document.createElement('a')
    const ext = activeTool === 'remove-bg' ? 'png' : activeTool === 'resize' ? resizeFormat : outputFormat
    const baseName = result.original.name.replace(/\.[^.]+$/, '')
    link.download = `${baseName}_processed.${ext}`
    link.href = result.preview
    link.click()
  }, [activeTool, outputFormat, resizeFormat])

  const downloadAll = useCallback(() => {
    results.forEach(r => downloadFile(r))
  }, [results, downloadFile])

  // 切换工具
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

  const changeLanguage = useCallback((lng: string) => {
    navigate(`/${lng}/${toolToUrl[activeTool]}`)
    setShowLanguageMenu(false)
  }, [activeTool, navigate])

  // 工具描述
  const getToolDescription = () => {
    const descriptionKeys: Record<Tool, string> = {
      'ai-remove-bg': 'descriptions.aiRemoveBg',
      'remove-watermark': 'descriptions.removeWatermark',
      'remove-bg': 'descriptions.removeFakeTransparency',
      'compress': 'descriptions.compress',
      'resize': 'descriptions.resize',
    }
    return t(descriptionKeys[activeTool])
  }

  return (
    <div className="app">
      <Header
        lang={lang}
        showLanguageMenu={showLanguageMenu}
        setShowLanguageMenu={setShowLanguageMenu}
        onLanguageChange={changeLanguage}
      />

      <ToolSelector activeTool={activeTool} onToolChange={switchTool} />

      <div className="tool-description">
        <p>{getToolDescription()}</p>
      </div>

      {/* AI 抠图 */}
      {activeTool === 'ai-remove-bg' && (
        <AiToolPanel
          uploadedImage={uploadedImage}
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={handleFileSelect}
          inputId="ai-file-input"
          processing={aiProcessing}
          onProcess={handleAiRemoveBg}
          processButtonIcon="✨"
          processButtonTextKey="process.removeBackground"
          disabled={!uploadedFile}
          resultImage={resultImage}
          onDownload={downloadAiResult}
          error={error}
        />
      )}

      {/* 去水印 */}
      {activeTool === 'remove-watermark' && (
        <AiToolPanel
          uploadedImage={wmUploadedImage}
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={handleFileSelect}
          inputId="wm-file-input"
          processing={wmProcessing}
          onProcess={handleRemoveWatermark}
          processButtonIcon="💧"
          processButtonTextKey="process.removeWatermark"
          disabled={!wmUploadedFile}
          resultImage={wmResultImage}
          onDownload={downloadWmResult}
          error={error}
          optionsNode={<WatermarkOptions removeText={wmRemoveText} setRemoveText={setWmRemoveText} />}
        />
      )}

      {/* 压缩选项 */}
      {activeTool === 'compress' && (
        <CompressOptions
          quality={quality}
          setQuality={setQuality}
          outputFormat={outputFormat}
          setOutputFormat={setOutputFormat}
        />
      )}

      {/* 调整尺寸选项 */}
      {activeTool === 'resize' && (
        <ResizeOptions
          resizeWidth={resizeWidth}
          setResizeWidth={setResizeWidth}
          resizeHeight={resizeHeight}
          setResizeHeight={setResizeHeight}
          keepAspectRatio={keepAspectRatio}
          setKeepAspectRatio={setKeepAspectRatio}
          resizeFormat={resizeFormat}
          setResizeFormat={setResizeFormat}
        />
      )}

      {/* 批量处理（去假透明、压缩、调整尺寸） */}
      {activeTool !== 'ai-remove-bg' && activeTool !== 'remove-watermark' && (
        <BatchProcessor
          activeTool={activeTool}
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={handleFileSelect}
          pendingFiles={pendingFiles}
          results={results}
          processing={processing}
          processingIndex={processingIndex}
          onProcessSingle={processSingleFile}
          onProcessAll={processAllFiles}
          onRemovePending={removePendingFile}
          onClearPending={clearPendingFiles}
          onDownloadFile={downloadFile}
          onDownloadAll={downloadAll}
        />
      )}

      <Footer lang={lang} />
    </div>
  )
}

export default App
