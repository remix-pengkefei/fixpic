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

export function Resize() {
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

  const [resizeWidth, setResizeWidth] = useState<number | null>(null)
  const [resizeHeight, setResizeHeight] = useState<number | null>(null)
  const [keepAspectRatio, setKeepAspectRatio] = useState(true)
  const [resizeFormat, setResizeFormat] = useState<'webp' | 'png' | 'jpeg'>('png')
  const [resizeQuality, setResizeQuality] = useState(100)

  useEffect(() => {
    return () => {
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
      results.forEach(r => URL.revokeObjectURL(r.preview))
    }
  }, [])

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
      const result = await resizeImage(pending.file)
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
  }, [pendingFiles, resizeImage])

  const processAllFiles = useCallback(async () => {
    setProcessing(true)
    const newResults: ProcessedImage[] = []

    for (let i = 0; i < pendingFiles.length; i++) {
      const pending = pendingFiles[i]
      setProcessingIndex(i)
      try {
        const result = await resizeImage(pending.file)
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
  }, [pendingFiles, resizeImage])

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
    link.download = `${baseName}_resized.${resizeFormat}`
    link.href = result.preview
    link.click()
  }, [resizeFormat])

  const downloadAll = useCallback(() => {
    results.forEach(r => downloadFile(r))
  }, [results, downloadFile])

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${bytes} B`
  }

  const getQualityLabel = () => {
    if (resizeQuality >= 80) return t('resize.options.qualityHigh')
    if (resizeQuality >= 50) return t('resize.options.qualityMedium')
    return t('resize.options.qualityLow')
  }

  return (
    <>
      <SEO
        title={t('resize.seo.title')}
        description={t('resize.seo.description')}
        keywords={t('resize.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}/resize`}
        ogImage="/og-resize.png"
      />
      <StructuredData type="resize" />

      <div className="tool-page">
        <div className="tool-header">
          <h1>{t('resize.title')}</h1>
          <p className="tool-desc">{t('resize.desc')}</p>
        </div>

        {/* Options */}
        <div className="options">
          <div className="option-group">
            <label>{t('resize.options.width')}</label>
            <div className="width-input">
              <input
                type="number"
                placeholder={t('resize.options.auto')}
                value={resizeWidth || ''}
                onChange={e => setResizeWidth(e.target.value ? Number(e.target.value) : null)}
              />
              <span>px</span>
            </div>
          </div>

          <div className="option-group">
            <label>{t('resize.options.height')}</label>
            <div className="width-input">
              <input
                type="number"
                placeholder={t('resize.options.auto')}
                value={resizeHeight || ''}
                onChange={e => setResizeHeight(e.target.value ? Number(e.target.value) : null)}
              />
              <span>px</span>
            </div>
          </div>

          <div className="option-group">
            <label>{t('resize.options.keepAspectRatio')}</label>
            <div className="format-btns">
              <button
                className={keepAspectRatio ? 'active' : ''}
                onClick={() => setKeepAspectRatio(true)}
              >
                {t('resize.options.yes')}
              </button>
              <button
                className={!keepAspectRatio ? 'active' : ''}
                onClick={() => setKeepAspectRatio(false)}
              >
                {t('resize.options.no')}
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {keepAspectRatio ? t('resize.options.keepRatioHint') : t('resize.options.noKeepRatioHint')}
            </div>
          </div>

          <div className="option-group">
            <label>{t('resize.options.format')}</label>
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

          <div className="option-group" style={{ marginLeft: '16px', minWidth: '160px' }}>
            <label>
              {t('resize.options.quality')} {resizeFormat === 'png' ? '' : `${resizeQuality}% (${getQualityLabel()})`}
            </label>
            {resizeFormat === 'png' ? (
              <div style={{ fontSize: '12px', color: '#999' }}>{t('resize.options.pngNote')}</div>
            ) : (
              <input
                type="range"
                min="10"
                max="100"
                value={resizeQuality}
                onChange={e => setResizeQuality(Number(e.target.value))}
              />
            )}
          </div>
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
          <div className="drop-icon">📐</div>
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
                  <div className="result-preview">
                    <img src={r.preview} alt={r.original.name} loading="lazy" />
                  </div>
                  <div className="result-info">
                    <p className="result-name">{r.original.name}</p>
                    <p className="result-size">
                      {formatSize(r.originalSize)} → {formatSize(r.resultSize)}
                      <span className={r.resultSize < r.originalSize ? 'saved' : 'increased'}>
                        {r.resultSize < r.originalSize
                          ? ` (-${Math.round((1 - r.resultSize / r.originalSize) * 100)}%)`
                          : ` (+${Math.round((r.resultSize / r.originalSize - 1) * 100)}%)`
                        }
                      </span>
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
            <li>{t('resize.instructions.step1')}</li>
            <li>{t('resize.instructions.step2')}</li>
            <li>{t('resize.instructions.step3')}</li>
            <li>{t('resize.instructions.step4')}</li>
          </ol>
          <h3>{t('resize.sizeReference.title')}</h3>
          <ul>
            <li><strong>{t('resize.sizeReference.avatar').split('：')[0]}</strong>：{t('resize.sizeReference.avatar').split('：')[1]}</li>
            <li><strong>{t('resize.sizeReference.wechat').split('：')[0]}</strong>：{t('resize.sizeReference.wechat').split('：')[1]}</li>
            <li><strong>{t('resize.sizeReference.ecommerce').split('：')[0]}</strong>：{t('resize.sizeReference.ecommerce').split('：')[1]}</li>
            <li><strong>{t('resize.sizeReference.banner').split('：')[0]}</strong>：{t('resize.sizeReference.banner').split('：')[1]}</li>
          </ul>
        </section>

        {/* Related Content */}
        <section className="related-content">
          <div className="related-tools">
            <h3>{t('common.relatedTools')}</h3>
            <div className="related-tools-grid">
              <Link to={langLink('/compress')} className="related-tool-card">
                <span className="related-tool-icon">📦</span>
                <span>{t('nav.compress')}</span>
              </Link>
              <Link to={langLink('/remove-fake-transparency')} className="related-tool-card">
                <span className="related-tool-icon">🔲</span>
                <span>{t('nav.removeFakeTransparency')}</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
