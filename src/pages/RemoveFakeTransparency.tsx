import { useState, useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { languages } from '../i18n'

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

export function RemoveFakeTransparency() {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  // Get current language from URL
  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'
  const langLink = (path: string) => `/${currentLang}${path}`
  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState<number | null>(null)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [results, setResults] = useState<ProcessedImage[]>([])

  useEffect(() => {
    return () => {
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
      results.forEach(r => URL.revokeObjectURL(r.preview))
    }
  }, [])

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

        // Sample corners to detect checkerboard pattern
        const sampleSize = Math.min(50, Math.floor(Math.min(canvas.width, canvas.height) / 10))
        const grayValues: number[] = []

        const sampleCorner = (startX: number, startY: number) => {
          for (let y = startY; y < startY + sampleSize && y < canvas.height; y++) {
            for (let x = startX; x < startX + sampleSize && x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4
              const r = data[idx], g = data[idx + 1], b = data[idx + 2]
              const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
              // Only consider grayscale pixels (R ≈ G ≈ B)
              if (diff < 15) {
                const avg = Math.round((r + g + b) / 3)
                grayValues.push(avg)
              }
            }
          }
        }

        sampleCorner(0, 0)
        sampleCorner(canvas.width - sampleSize, 0)
        sampleCorner(0, canvas.height - sampleSize)
        sampleCorner(canvas.width - sampleSize, canvas.height - sampleSize)

        // Find the two most common gray values (checkerboard colors)
        const histogram: Record<number, number> = {}
        for (const val of grayValues) {
          // Group into buckets of 10 to handle slight variations
          const bucket = Math.round(val / 10) * 10
          histogram[bucket] = (histogram[bucket] || 0) + 1
        }

        // Sort by frequency and get top 2 values
        const sortedBuckets = Object.entries(histogram)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([val]) => parseInt(val))

        // Determine thresholds based on detected checkerboard colors
        let lowThreshold = 160  // Default for dark gray
        let highThreshold = 255 // Default for light gray

        if (sortedBuckets.length >= 2) {
          const [val1, val2] = sortedBuckets.sort((a, b) => a - b)
          // Set thresholds with generous margin to catch edge pixels
          lowThreshold = Math.max(val1 - 30, 140)
          highThreshold = Math.min(val2 + 20, 255)
        } else if (sortedBuckets.length === 1) {
          // Single color background
          const val = sortedBuckets[0]
          lowThreshold = Math.max(val - 30, 140)
          highThreshold = Math.min(val + 20, 255)
        }

        // Remove pixels that fall within the checkerboard color range
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const avg = (r + g + b) / 3
          const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
          const minChannel = Math.min(r, g, b)

          // Check if pixel is grayscale-ish and within checkerboard color range
          // For nearly gray pixels (diff < 35), use standard check
          // For slightly tinted pixels (diff < 50), only remove if min channel is still high (light tint)
          const isNearlyGray = diff < 35
          const isLightTinted = diff < 50 && minChannel > 140
          const isInRange = avg >= lowThreshold && avg <= highThreshold

          if ((isNearlyGray || isLightTinted) && isInRange) {
            data[i + 3] = 0 // Make transparent
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

  const processSingleFile = useCallback(async (index: number) => {
    const pending = pendingFiles[index]
    if (!pending) return

    setProcessingIndex(index)
    try {
      const result = await removeFakeTransparency(pending.file)
      setResults(prev => [...prev, {
        original: pending.file,
        result,
        originalSize: pending.file.size,
        resultSize: result.size,
        preview: URL.createObjectURL(result)
      }])
      setPendingFiles(prev => prev.filter((_, i) => i !== index))
    } catch (err) {
      console.error('Processing failed:', pending.file.name, err)
    }
    setProcessingIndex(null)
  }, [pendingFiles, removeFakeTransparency])

  const processAllFiles = useCallback(async () => {
    setProcessing(true)
    const newResults: ProcessedImage[] = []

    for (let i = 0; i < pendingFiles.length; i++) {
      const pending = pendingFiles[i]
      setProcessingIndex(i)
      try {
        const result = await removeFakeTransparency(pending.file)
        newResults.push({
          original: pending.file,
          result,
          originalSize: pending.file.size,
          resultSize: result.size,
          preview: URL.createObjectURL(result)
        })
      } catch (err) {
        console.error('Processing failed:', pending.file.name, err)
      }
    }

    setResults(prev => [...prev, ...newResults])
    setPendingFiles([])
    setProcessingIndex(null)
    setProcessing(false)
  }, [pendingFiles, removeFakeTransparency])

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
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
      e.target.value = ''
    }
  }, [addFiles])

  const downloadFile = useCallback((result: ProcessedImage) => {
    const link = document.createElement('a')
    const baseName = result.original.name.replace(/\.[^.]+$/, '')
    link.download = `${baseName}_transparent.png`
    link.href = result.preview
    link.click()
  }, [])

  const downloadAll = useCallback(() => {
    results.forEach(r => downloadFile(r))
  }, [results, downloadFile])

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${bytes} B`
  }

  return (
    <>
      <SEO
        title={t('removeFakeTransparency.seo.title')}
        description={t('removeFakeTransparency.seo.description')}
        keywords={t('removeFakeTransparency.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}/remove-fake-transparency`}
        ogImage="/og-remove-transparency.png"
      />
      <StructuredData type="removeFakeTransparency" />

      <div className="tool-page">
        <div className="tool-header">
          <h1>{t('removeFakeTransparency.title')}</h1>
          <p className="tool-desc">{t('removeFakeTransparency.desc')}</p>
        </div>

        {/* Drop Zone */}
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
          <div className="drop-icon">🖼️</div>
          <p className="drop-text">{t('common.dragDropText')}</p>
          <p className="drop-hint">{t('common.dragDropHint')}</p>
        </div>

        {/* Pending Files */}
        {pendingFiles.length > 0 && (
          <div className="pending-section">
            <div className="pending-header">
              <h3>{t('common.pending')} ({pendingFiles.length})</h3>
              <div className="pending-actions">
                <button className="clear-btn" onClick={clearPendingFiles}>{t('common.clear')}</button>
                <button className="process-all-btn" onClick={processAllFiles} disabled={processing}>
                  {processing ? t('common.processing') : t('common.processAll')}
                </button>
              </div>
            </div>
            <div className="pending-grid">
              {pendingFiles.map((p, i) => (
                <div key={i} className={`pending-card ${processingIndex === i ? 'processing' : ''}`}>
                  <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removePendingFile(i) }}>×</button>
                  <div className="pending-preview">
                    <img src={p.preview} alt={p.file.name} loading="lazy" />
                    {processingIndex === i && (
                      <div className="pending-overlay"><div className="spinner-small"></div></div>
                    )}
                  </div>
                  <div className="pending-info">
                    <p className="pending-name">{p.file.name}</p>
                    <p className="pending-size">{formatSize(p.file.size)}</p>
                  </div>
                  <button className="process-btn" onClick={() => processSingleFile(i)} disabled={processing || processingIndex !== null}>
                    {t('common.process')}
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
              <h3>{t('common.completed')} ({results.length})</h3>
              <button className="download-all-btn" onClick={downloadAll}>{t('common.downloadAll')}</button>
            </div>
            <div className="results-grid">
              {results.map((r, i) => (
                <div key={i} className="result-card">
                  <div className="result-preview checkerboard">
                    <img src={r.preview} alt={r.original.name} loading="lazy" />
                  </div>
                  <div className="result-info">
                    <p className="result-name">{r.original.name}</p>
                    <p className="result-size">
                      {formatSize(r.originalSize)} → {formatSize(r.resultSize)}
                    </p>
                  </div>
                  <button className="download-btn" onClick={() => downloadFile(r)}>{t('common.download')}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <section className="tool-instructions">
          <h2>{t('common.instructions')}</h2>
          <ol>
            <li>{t('removeFakeTransparency.instructions.step1')}</li>
            <li>{t('removeFakeTransparency.instructions.step2')}</li>
            <li>{t('removeFakeTransparency.instructions.step3')}</li>
          </ol>
          <h3>{t('removeFakeTransparency.useCases.title')}</h3>
          <ul>
            <li>{t('removeFakeTransparency.useCases.case1')}</li>
            <li>{t('removeFakeTransparency.useCases.case2')}</li>
            <li>{t('removeFakeTransparency.useCases.case3')}</li>
            <li>{t('removeFakeTransparency.useCases.case4')}</li>
          </ul>
        </section>

        {/* Related Content */}
        <section className="related-content">
          <div className="related-guides">
            <h3>{t('common.relatedGuides')}</h3>
            <Link to={langLink('/guides/remove-ai-checkerboard')} className="related-link">
              {t('guides.aiCheckerboard.title')} →
            </Link>
          </div>
          <div className="related-tools">
            <h3>{t('common.relatedTools')}</h3>
            <div className="related-tools-grid">
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
