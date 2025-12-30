import { useState, useCallback, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { languages } from '../i18n'
import { runAIInpainting, runSimpleInpainting } from '../utils/inpainting'

interface ProcessedImage {
  original: File
  result: Blob
  originalSize: number
  resultSize: number
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(30)
  const [processing, setProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [results, setResults] = useState<ProcessedImage[]>([])
  const [maskHistory, setMaskHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Refs
  const imageCanvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return

    setSelectedFile(file)
    setResults([])
    setMaskHistory([])
    setHistoryIndex(-1)

    const url = URL.createObjectURL(file)
    setImagePreview(url)

    const img = new Image()
    img.onload = () => {
      imgRef.current = img

      const imageCanvas = imageCanvasRef.current
      const maskCanvas = maskCanvasRef.current
      if (!imageCanvas || !maskCanvas) return

      // Set canvas size to match image
      imageCanvas.width = img.width
      imageCanvas.height = img.height
      maskCanvas.width = img.width
      maskCanvas.height = img.height

      // Draw image on image canvas
      const ctx = imageCanvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // Clear mask canvas
      const maskCtx = maskCanvas.getContext('2d')!
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)

      // Save initial empty mask state
      const initialMask = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
      setMaskHistory([initialMask])
      setHistoryIndex(0)
    }
    img.src = url
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
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
      e.target.value = ''
    }
  }, [handleFileSelect])

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }, [])

  // Touch support
  const getTouchCoords = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current
    if (!canvas || e.touches.length === 0) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const touch = e.touches[0]

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    }
  }, [])

  // Draw on mask canvas
  const drawMask = useCallback((x: number, y: number) => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    const ctx = maskCanvas.getContext('2d')!
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }, [brushSize])

  // Mouse handlers for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(true)
    const coords = getCanvasCoords(e)
    if (coords) drawMask(coords.x, coords.y)
  }, [getCanvasCoords, drawMask])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const coords = getCanvasCoords(e)
    if (coords) drawMask(coords.x, coords.y)
  }, [isDrawing, getCanvasCoords, drawMask])

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false)
      // Save to history
      const maskCanvas = maskCanvasRef.current
      if (maskCanvas) {
        const ctx = maskCanvas.getContext('2d')!
        const maskData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
        setMaskHistory(prev => [...prev.slice(0, historyIndex + 1), maskData])
        setHistoryIndex(prev => prev + 1)
      }
    }
  }, [isDrawing, historyIndex])

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(true)
    const coords = getTouchCoords(e)
    if (coords) drawMask(coords.x, coords.y)
  }, [getTouchCoords, drawMask])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return
    const coords = getTouchCoords(e)
    if (coords) drawMask(coords.x, coords.y)
  }, [isDrawing, getTouchCoords, drawMask])

  const handleTouchEnd = useCallback(() => {
    handleMouseUp()
  }, [handleMouseUp])

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return

    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)

    const maskCanvas = maskCanvasRef.current
    if (maskCanvas && maskHistory[newIndex]) {
      const ctx = maskCanvas.getContext('2d')!
      ctx.putImageData(maskHistory[newIndex], 0, 0)
    }
  }, [historyIndex, maskHistory])

  // Clear mask
  const handleClearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    const ctx = maskCanvas.getContext('2d')!
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)

    // Save to history
    const emptyMask = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    setMaskHistory(prev => [...prev.slice(0, historyIndex + 1), emptyMask])
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  // Process image with inpainting
  const processImage = useCallback(async () => {
    if (!selectedFile) {
      return
    }
    if (!imgRef.current) {
      alert('Image not loaded yet, please wait...')
      return
    }

    const imageCanvas = imageCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!imageCanvas || !maskCanvas) {
      return
    }

    setProcessing(true)
    setProcessingStatus('Starting...')

    try {
      let resultCanvas: HTMLCanvasElement

      // Try AI inpainting first, fallback to simple if it fails
      try {
        resultCanvas = await runAIInpainting(
          imageCanvas,
          maskCanvas,
          (status) => setProcessingStatus(status)
        )
      } catch (aiError) {
        console.warn('AI inpainting failed, falling back to simple:', aiError)
        setProcessingStatus('AI unavailable, using local processing...')
        resultCanvas = await runSimpleInpainting(
          imageCanvas,
          maskCanvas,
          (status) => setProcessingStatus(status)
        )
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        resultCanvas.toBlob(b => {
          if (b) resolve(b)
          else reject(new Error('Failed to create blob'))
        }, 'image/png')
      })

      // Add to results
      setResults(prev => [...prev, {
        original: selectedFile,
        result: blob,
        originalSize: selectedFile.size,
        resultSize: blob.size,
        preview: URL.createObjectURL(blob)
      }])

      setProcessingStatus('')
    } catch (err) {
      console.error('Inpainting failed:', err)
      alert(t('watermark.error') + '\n' + (err instanceof Error ? err.message : String(err)))
    }

    setProcessing(false)
  }, [selectedFile, t])

  // Download handlers
  const downloadFile = useCallback((result: ProcessedImage) => {
    const link = document.createElement('a')
    const baseName = result.original.name.replace(/\.[^.]+$/, '')
    link.download = `${baseName}_no_watermark.png`
    link.href = result.preview
    link.click()
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${bytes} B`
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      results.forEach(r => URL.revokeObjectURL(r.preview))
    }
  }, [])

  return (
    <>
      <SEO
        title={t('watermark.seo.title')}
        description={t('watermark.seo.description')}
        keywords={t('watermark.seo.keywords')}
        canonicalUrl={`https://fix-pic.com/${currentLang}/remove-watermark`}
        ogImage="/og-watermark.png"
      />
      <StructuredData type="removeFakeTransparency" />

      <div className="tool-page watermark-page">
        <div className="tool-header">
          <h1>{t('watermark.title')}</h1>
          <p className="tool-desc">{t('watermark.desc')}</p>
        </div>

        {/* Drop Zone - only show when no file selected */}
        {!selectedFile && (
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
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
            <div className="drop-icon">🖌️</div>
            <p className="drop-text">{t('watermark.dropText')}</p>
            <p className="drop-hint">{t('watermark.dropHint')}</p>
          </div>
        )}

        {/* Editor Area */}
        {selectedFile && imagePreview && (
          <div className="watermark-editor">
            {/* Controls */}
            <div className="watermark-controls">
              <div className="control-group">
                <label>{t('watermark.brushSize')}: {brushSize}px</label>
                <input
                  type="range"
                  min="10"
                  max="150"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                />
              </div>

              <div className="control-buttons">
                <button onClick={handleUndo} disabled={historyIndex <= 0} className="control-btn">
                  ↶ {t('watermark.undo')}
                </button>
                <button onClick={handleClearMask} className="control-btn">
                  ✕ {t('watermark.clearMask')}
                </button>
                <button
                  onClick={processImage}
                  disabled={processing}
                  className="process-btn primary"
                >
                  {processing ? processingStatus || t('common.processing') : t('watermark.removeWatermark')}
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedFile(null)
                  setImagePreview(null)
                  setMaskHistory([])
                  setHistoryIndex(-1)
                }}
                className="new-image-btn"
              >
                {t('watermark.newImage')}
              </button>
            </div>

            {/* Canvas Container */}
            <div className="canvas-container" ref={containerRef}>
              <p className="canvas-hint">{t('watermark.canvasHint')}</p>
              <div className="canvas-wrapper">
                <canvas ref={imageCanvasRef} className="image-canvas" />
                <canvas
                  ref={maskCanvasRef}
                  className="mask-canvas"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="results">
            <div className="results-header">
              <h3>{t('common.completed')} ({results.length})</h3>
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
            <li>{t('watermark.instructions.step1')}</li>
            <li>{t('watermark.instructions.step2')}</li>
            <li>{t('watermark.instructions.step3')}</li>
            <li>{t('watermark.instructions.step4')}</li>
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
