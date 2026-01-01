import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { languages } from '../i18n'
import { autoRemoveWatermark } from '../api'
import { saveHistory } from '../services/history'

interface ProcessedImage {
  original: File
  result: Blob
  originalSize: number
  resultSize: number
  preview: string
  watermarkDetected: boolean
}

interface PendingFile {
  file: File
  preview: string
}

export function RemoveWatermark() {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  // Get current language from URL
  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'
  const langLink = (path: string) => `/${currentLang}${path}`

  // State
  const [isDragging, setIsDragging] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [processing, setProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<ProcessedImage[]>([])

  // Ref to always have latest pendingFiles
  const pendingFilesRef = useRef<PendingFile[]>([])
  pendingFilesRef.current = pendingFiles

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length > 0) {
      const newPendingFiles = imageFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      setPendingFiles(prev => [...prev, ...newPendingFiles])
    }
  }, [])

  // Drop handlers
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
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files)
      e.target.value = ''
    }
  }, [handleFileSelect])

  // Process single image
  const processImage = useCallback(async (file: File) => {
    setProcessingStatus(t('watermark.detecting'))

    try {
      const response = await autoRemoveWatermark({ image: file })

      if (!response.success) {
        throw new Error(response.error || 'Processing failed')
      }

      // Convert data URL to blob
      const imageData = response.image!
      // 处理有无 data URL 前缀的情况
      const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData
      if (!base64) {
        throw new Error('Invalid image data')
      }
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'image/png' })

      return {
        original: file,
        result: blob,
        originalSize: file.size,
        resultSize: blob.size,
        preview: URL.createObjectURL(blob),
        watermarkDetected: response.watermark_detected ?? false
      }
    } catch (err) {
      console.error('Processing failed:', err)
      throw err
    }
  }, [t])

  // Process all pending files
  const processAll = useCallback(async () => {
    const files = pendingFilesRef.current
    if (files.length === 0 || processing) return

    setProcessing(true)
    setCurrentIndex(0)

    for (let i = 0; i < files.length; i++) {
      setCurrentIndex(i)
      setProcessingStatus(`${t('common.processing')} (${i + 1}/${files.length})`)

      try {
        const result = await processImage(files[i].file)
        setResults(prev => [...prev, result])
        // Save to history
        saveHistory({
          tool_type: 'watermark',
          original_filename: files[i].file.name,
          original_size: files[i].file.size,
          result_size: result.resultSize
        })
      } catch (err) {
        console.error(`Failed to process ${files[i].file.name}:`, err)
      }
    }

    // Revoke preview URLs
    files.forEach(p => URL.revokeObjectURL(p.preview))
    setPendingFiles([])
    setProcessing(false)
    setProcessingStatus('')
  }, [processing, processImage, t])

  // Remove pending file
  const removePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => {
      const toRemove = prev[index]
      if (toRemove) URL.revokeObjectURL(toRemove.preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // Download handlers
  const downloadFile = useCallback((result: ProcessedImage) => {
    const link = document.createElement('a')
    const baseName = result.original.name.replace(/\.[^.]+$/, '')
    link.download = `${baseName}_no_watermark.png`
    link.href = result.preview
    link.click()
  }, [])

  const downloadAll = useCallback(() => {
    results.forEach(r => downloadFile(r))
  }, [results, downloadFile])

  const clearResults = useCallback(() => {
    results.forEach(r => URL.revokeObjectURL(r.preview))
    setResults([])
  }, [results])

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${bytes} B`
  }

  // Cleanup
  useEffect(() => {
    return () => {
      results.forEach(r => URL.revokeObjectURL(r.preview))
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
    }
  }, [results, pendingFiles])

  return (
    <>
      <SEO
        title={t('watermark.seo.title')}
        description={t('watermark.seo.description')}
        keywords={t('watermark.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}/remove-watermark`}
        ogImage="/og-watermark.png"
      />
      <StructuredData type="removeWatermark" />

      <div className="tool-page watermark-page">
        <div className="tool-header">
          <h1>{t('watermark.title')}</h1>
          <p className="tool-desc">{t('watermark.desc')}</p>
        </div>

        {/* Drop Zone */}
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('watermark-file-input')?.click()}
        >
          <input
            id="watermark-file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          <div className="drop-icon">🔍</div>
          <p className="drop-text">{t('watermark.dropText')}</p>
          <p className="drop-hint">{t('watermark.dropHint')}</p>
        </div>

        {/* Pending Files */}
        {pendingFiles.length > 0 && (
          <div className="pending-files">
            <div className="pending-header">
              <h3>{t('common.pending')} ({pendingFiles.length})</h3>
              <button
                className="process-all-btn"
                onClick={processAll}
                disabled={processing}
              >
                {processing
                  ? `${processingStatus || t('common.processing')} (${currentIndex + 1}/${pendingFiles.length})`
                  : t('common.processAll')
                }
              </button>
            </div>
            <div className="pending-grid">
              {pendingFiles.map((p, index) => (
                <div key={index} className={`pending-card ${currentIndex === index && processing ? 'processing' : ''}`}>
                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      removePendingFile(index)
                    }}
                  >
                    ×
                  </button>
                  <div className="pending-preview">
                    <img src={p.preview} alt={p.file.name} loading="lazy" />
                    {currentIndex === index && processing && (
                      <div className="pending-overlay"><div className="spinner-small"></div></div>
                    )}
                  </div>
                  <div className="pending-info">
                    <p className="pending-name">{p.file.name}</p>
                    <p className="pending-size">{formatSize(p.file.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="results">
            <div className="results-header">
              <h3>{t('common.completed')} ({results.length})</h3>
              <div className="results-actions">
                <button className="download-all-btn" onClick={downloadAll}>
                  {t('common.downloadAll')}
                </button>
                <button className="clear-btn" onClick={clearResults}>
                  {t('common.clear')}
                </button>
              </div>
            </div>
            <div className="results-grid">
              {results.map((r, i) => (
                <div key={i} className="result-card">
                  <div className="result-preview">
                    <img src={r.preview} alt={r.original.name} loading="lazy" />
                    {!r.watermarkDetected && (
                      <div className="no-watermark-badge">{t('watermark.noWatermark')}</div>
                    )}
                  </div>
                  <div className="result-info">
                    <p className="result-name">{r.original.name}</p>
                    <p className="result-size">
                      {formatSize(r.originalSize)} → {formatSize(r.resultSize)}
                    </p>
                  </div>
                  <button className="download-btn" onClick={() => downloadFile(r)}>
                    {t('common.download')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <section className="tool-instructions">
          <h2>{t('common.instructions')}</h2>
          <ol>
            <li>{t('watermark.instructions.step1')}</li>
            <li>{t('watermark.instructions.step2')}</li>
            <li>{t('watermark.instructions.step3')}</li>
          </ol>
          <h3>{t('watermark.tips.title')}</h3>
          <ul>
            <li>{t('watermark.tips.tip1')}</li>
            <li>{t('watermark.tips.tip2')}</li>
            <li>{t('watermark.tips.tip3')}</li>
          </ul>
        </section>

        {/* Related Content */}
        <section className="related-content">
          <div className="related-tools">
            <h3>{t('common.relatedTools')}</h3>
            <div className="related-tools-grid">
              <Link to={langLink('/remove-fake-transparency')} className="related-tool-card">
                <span className="related-tool-icon">🔲</span>
                <span>{t('nav.removeFakeTransparency')}</span>
              </Link>
              <Link to={langLink('/compress')} className="related-tool-card">
                <span className="related-tool-icon">📦</span>
                <span>{t('nav.compress')}</span>
              </Link>
              <Link to={langLink('/resize')} className="related-tool-card">
                <span className="related-tool-icon">📐</span>
                <span>{t('nav.resize')}</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
