import { useState, useCallback, useEffect } from 'react'
import './App.css'

type Tool = 'remove-bg' | 'compress' | 'resize'

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
  const [activeTool, setActiveTool] = useState<Tool>('remove-bg')
  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState<number | null>(null)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [results, setResults] = useState<ProcessedImage[]>([])

  // 压缩选项
  const [quality, setQuality] = useState(85)
  const [outputFormat, setOutputFormat] = useState<'webp' | 'png' | 'jpeg'>('webp')

  // 尺寸调整选项
  const [resizeWidth, setResizeWidth] = useState<number | null>(null)
  const [resizeHeight, setResizeHeight] = useState<number | null>(null)
  const [keepAspectRatio, setKeepAspectRatio] = useState(true)
  const [resizeFormat, setResizeFormat] = useState<'webp' | 'png' | 'jpeg'>('png')
  const [resizeQuality, setResizeQuality] = useState(100) // 100 表示最高质量

  // 清理预览 URL
  useEffect(() => {
    return () => {
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview))
      results.forEach(r => URL.revokeObjectURL(r.preview))
    }
  }, [])

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

        // 从四角采样检测背景色阈值
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

      // 从待处理列表移除
      setPendingFiles(prev => prev.filter((_, i) => i !== index))
    } catch (err) {
      console.error('处理失败:', pending.file.name, err)
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
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
      e.target.value = '' // 允许重复选择同一文件
    }
  }, [addFiles])

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

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">F</span>
          <span className="logo-text">ix-Pic</span>
        </div>
        <p className="tagline">AI 开发者的图片工具箱</p>
      </header>

      {/* Tool Selector */}
      <div className="tool-selector">
        <button
          className={`tool-btn ${activeTool === 'remove-bg' ? 'active' : ''}`}
          onClick={() => { setActiveTool('remove-bg'); setResults([]); clearPendingFiles() }}
        >
          <span className="tool-icon">🔲</span>
          <span>去除假透明背景</span>
        </button>
        <button
          className={`tool-btn ${activeTool === 'compress' ? 'active' : ''}`}
          onClick={() => { setActiveTool('compress'); setResults([]); clearPendingFiles() }}
        >
          <span className="tool-icon">📦</span>
          <span>图片压缩</span>
        </button>
        <button
          className={`tool-btn ${activeTool === 'resize' ? 'active' : ''}`}
          onClick={() => { setActiveTool('resize'); setResults([]); clearPendingFiles() }}
        >
          <span className="tool-icon">📐</span>
          <span>调整尺寸</span>
        </button>
      </div>

      {/* Tool Description */}
      <div className="tool-description">
        {activeTool === 'remove-bg' ? (
          <p>将 Lovart、Midjourney 等 AI 工具导出的假透明背景（灰白棋盘格）转换为真正的透明 PNG</p>
        ) : activeTool === 'resize' ? (
          <p>精确调整图片尺寸，支持保持宽高比</p>
        ) : (
          <p>压缩图片并转换格式，支持 WebP、PNG、JPEG</p>
        )}
      </div>

      {/* Options for compress tool */}
      {activeTool === 'compress' && (
        <div className="options">
          <div className="option-group">
            <label>输出格式</label>
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
              图片压缩 {outputFormat === 'png'
                ? ''
                : `${quality}%${quality >= 80 ? ' (高质量)' : quality >= 50 ? ' (轻微损失)' : ' (画质较差)'}`}
            </label>
            {outputFormat === 'png' ? (
              <div style={{ fontSize: '12px', color: '#999' }}>PNG 无损，无需压缩</div>
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
            <label>宽度</label>
            <div className="width-input">
              <input
                type="number"
                placeholder="自动"
                value={resizeWidth || ''}
                onChange={e => setResizeWidth(e.target.value ? Number(e.target.value) : null)}
              />
              <span>px</span>
            </div>
          </div>

          <div className="option-group">
            <label>高度</label>
            <div className="width-input">
              <input
                type="number"
                placeholder="自动"
                value={resizeHeight || ''}
                onChange={e => setResizeHeight(e.target.value ? Number(e.target.value) : null)}
              />
              <span>px</span>
            </div>
          </div>

          <div className="option-group">
            <label>保持比例</label>
            <div className="format-btns">
              <button
                className={keepAspectRatio ? 'active' : ''}
                onClick={() => setKeepAspectRatio(true)}
              >
                是
              </button>
              <button
                className={!keepAspectRatio ? 'active' : ''}
                onClick={() => setKeepAspectRatio(false)}
              >
                否
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {keepAspectRatio ? '等比缩放，不变形' : '强制拉伸，可能变形'}
            </div>
          </div>

          <div className="option-group">
            <label>输出格式</label>
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
              图片压缩 {resizeFormat === 'png'
                ? ''
                : `${resizeQuality}%${resizeQuality >= 80 ? ' (高质量)' : resizeQuality >= 50 ? ' (轻微损失)' : ' (画质较差)'}`}
            </label>
            {resizeFormat === 'png' ? (
              <div style={{ fontSize: '12px', color: '#999' }}>PNG 无损，无需压缩</div>
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
      )}

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
        <div className="drop-icon">
          {activeTool === 'remove-bg' ? '🖼️' : activeTool === 'resize' ? '📐' : '📁'}
        </div>
        <p className="drop-text">拖拽图片到这里，或点击选择</p>
        <p className="drop-hint">支持 PNG、JPG、WebP，可批量处理</p>
      </div>

      {/* Pending Files */}
      {pendingFiles.length > 0 && (
        <div className="pending-section">
          <div className="pending-header">
            <h3>待处理文件 ({pendingFiles.length})</h3>
            <div className="pending-actions">
              <button className="clear-btn" onClick={clearPendingFiles}>
                清空
              </button>
              <button
                className="process-all-btn"
                onClick={processAllFiles}
                disabled={processing}
              >
                {processing ? '处理中...' : '全部处理'}
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
                  处理
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
            <h3>处理完成 ({results.length})</h3>
            <button className="download-all-btn" onClick={downloadAll}>
              全部下载
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
                        ? ` (-${Math.round((1 - r.resultSize / r.originalSize) * 100)}%)`
                        : ` (+${Math.round((r.resultSize / r.originalSize - 1) * 100)}%)`
                      }
                    </span>
                  </p>
                </div>
                <button className="download-btn" onClick={() => downloadFile(r)}>
                  下载
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>FixPic - 纯前端处理，图片不上传服务器</p>
      </footer>
    </div>
  )
}

export default App
