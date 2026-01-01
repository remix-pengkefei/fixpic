import { useState, useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { languages } from '../i18n'
import { useAuth } from '../contexts/AuthContext'
import { extendImage } from '../lib/pixelbin'
import type { ExtendOptions } from '../lib/pixelbin'

export function ImageExtender() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { user } = useAuth()

  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'
  const langLink = (path: string) => `/${currentLang}${path}`

  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [inputFile, setInputFile] = useState<File | null>(null)
  const [inputPreview, setInputPreview] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  const [top, setTop] = useState(50)
  const [right, setRight] = useState(50)
  const [bottom, setBottom] = useState(50)
  const [left, setLeft] = useState(50)
  const [bgColor, setBgColor] = useState('ffffff')
  const [borderType, setBorderType] = useState<'constant' | 'replicate' | 'reflect' | 'wrap'>('constant')

  useEffect(() => {
    return () => {
      if (inputPreview) URL.revokeObjectURL(inputPreview)
      if (result) URL.revokeObjectURL(result)
    }
  }, [inputPreview, result])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setInputFile(file)
    setInputPreview(URL.createObjectURL(file))
    setResult('')
    setError('')
  }, [])

  const processImage = useCallback(async () => {
    if (!inputFile) return
    setProcessing(true)
    setError('')

    try {
      const options: ExtendOptions = {
        top,
        right,
        bottom,
        left,
        backgroundColor: bgColor,
        borderType,
      }
      const response = await extendImage(inputFile, options)
      if (response.success && response.url) {
        setResult(response.url)
      } else {
        setError(response.error || 'Processing failed')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setProcessing(false)
    }
  }, [inputFile, top, right, bottom, left, bgColor, borderType])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const downloadResult = useCallback(async () => {
    if (!result) return
    const response = await fetch(result)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `extended-${Date.now()}.png`
    link.click()
    URL.revokeObjectURL(url)
  }, [result])

  const resetTool = useCallback(() => {
    setInputFile(null)
    setInputPreview('')
    setResult('')
    setError('')
  }, [])

  if (!user) {
    return (
      <>
        <SEO
          title={t('extender.title', 'Image Extender - Expand Image Borders')}
          description={t('extender.description', 'Extend and pad image borders with custom colors or smart fill. Perfect for social media and print.')}
          keywords="image extender, extend image, pad image, expand borders"
          canonicalUrl={`/${currentLang}/image-extender`}
        />
        <StructuredData type="home" />
        <div className="tool-page">
          <h1>{t('extender.title', 'Image Extender')}</h1>
          <p className="tool-description">{t('extender.description', 'Extend and pad image borders with custom colors or smart fill.')}</p>
          <div className="login-required-box">
            <div className="login-icon">🔒</div>
            <h2>{t('auth.loginRequired', 'Login Required')}</h2>
            <p>{t('auth.loginToUse', 'Please login to use this AI tool')}</p>
            <Link to={langLink('/')} className="btn-primary">{t('auth.login', 'Login')}</Link>
          </div>
          <div className="features-section">
            <h2>{t('extender.features', 'Features')}</h2>
            <div className="features-grid">
              <div className="feature-card"><div className="feature-icon">↔️</div><h3>{t('extender.feature1Title', 'Custom Padding')}</h3><p>{t('extender.feature1Desc', 'Add padding to any side independently')}</p></div>
              <div className="feature-card"><div className="feature-icon">🎨</div><h3>{t('extender.feature2Title', 'Color Fill')}</h3><p>{t('extender.feature2Desc', 'Choose any background color')}</p></div>
              <div className="feature-card"><div className="feature-icon">🔄</div><h3>{t('extender.feature3Title', 'Smart Fill')}</h3><p>{t('extender.feature3Desc', 'Replicate, reflect, or wrap edges')}</p></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO title={t('extender.title', 'Image Extender')} description={t('extender.description', 'Extend image borders')} keywords="image extender, extend, pad" canonicalUrl={`/${currentLang}/image-extender`} />
      <StructuredData type="home" />
      <div className="tool-page">
        <h1>{t('extender.title', 'Image Extender')}</h1>
        <p className="tool-description">{t('extender.description', 'Extend and pad image borders with custom colors or smart fill.')}</p>

        {!inputFile ? (
          <div className={`upload-area ${isDragging ? 'dragging' : ''}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => document.getElementById('extender-file-input')?.click()}>
            <input id="extender-file-input" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            <div className="upload-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg></div>
            <p>{t('upload.dragDrop', 'Drag & drop your image here')}</p>
            <p className="upload-hint">{t('upload.or', 'or click to select')}</p>
          </div>
        ) : (
          <div className="editor-container">
            <div className="options-panel">
              <div className="option-group">
                <label>{t('extender.padding', 'Padding (px)')}</label>
                <div className="padding-grid">
                  <div className="padding-row"><span>Top:</span><input type="number" min="0" max="500" value={top} onChange={(e) => setTop(parseInt(e.target.value) || 0)} disabled={processing} /></div>
                  <div className="padding-row"><span>Right:</span><input type="number" min="0" max="500" value={right} onChange={(e) => setRight(parseInt(e.target.value) || 0)} disabled={processing} /></div>
                  <div className="padding-row"><span>Bottom:</span><input type="number" min="0" max="500" value={bottom} onChange={(e) => setBottom(parseInt(e.target.value) || 0)} disabled={processing} /></div>
                  <div className="padding-row"><span>Left:</span><input type="number" min="0" max="500" value={left} onChange={(e) => setLeft(parseInt(e.target.value) || 0)} disabled={processing} /></div>
                </div>
              </div>
              <div className="option-group">
                <label>{t('extender.fillType', 'Fill Type')}</label>
                <div className="option-buttons">
                  {(['constant', 'replicate', 'reflect', 'wrap'] as const).map(bt => (
                    <button key={bt} className={`option-btn ${borderType === bt ? 'active' : ''}`} onClick={() => setBorderType(bt)} disabled={processing}>
                      {bt.charAt(0).toUpperCase() + bt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {borderType === 'constant' && (
                <div className="option-group">
                  <label>{t('extender.bgColor', 'Background Color')}</label>
                  <div className="color-picker-row">
                    <input type="color" value={`#${bgColor}`} onChange={(e) => setBgColor(e.target.value.replace('#', ''))} disabled={processing} />
                    <span>#{bgColor}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="editor-main">
              <div className="preview-section"><h3>{t('common.original', 'Original')}</h3><div className="preview-box"><img src={inputPreview} alt="Original" /></div></div>
              {result && <div className="preview-section"><h3>{t('common.result', 'Result')}</h3><div className="preview-box"><img src={result} alt="Result" /></div></div>}
            </div>

            <div className="action-buttons">
              {!processing && !result && <button className="btn-primary" onClick={processImage}>{t('extender.extend', 'Extend Image')}</button>}
              {processing && <div className="processing-status"><div className="spinner"></div><span>{t('extender.processing', 'Extending...')}</span></div>}
              {result && <button className="btn-primary" onClick={downloadResult}>{t('common.download', 'Download')}</button>}
              <button className="btn-secondary" onClick={resetTool}>{t('common.newImage', 'New Image')}</button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        <div className="features-section">
          <h2>{t('extender.features', 'Features')}</h2>
          <div className="features-grid">
            <div className="feature-card"><div className="feature-icon">↔️</div><h3>{t('extender.feature1Title', 'Custom Padding')}</h3><p>{t('extender.feature1Desc', 'Add padding to any side')}</p></div>
            <div className="feature-card"><div className="feature-icon">🎨</div><h3>{t('extender.feature2Title', 'Color Fill')}</h3><p>{t('extender.feature2Desc', 'Choose background color')}</p></div>
            <div className="feature-card"><div className="feature-icon">🔄</div><h3>{t('extender.feature3Title', 'Smart Fill')}</h3><p>{t('extender.feature3Desc', 'Replicate or reflect edges')}</p></div>
          </div>
        </div>
      </div>

      <style>{`
        .login-required-box { text-align: center; padding: 48px; background: #f8f9fa; border-radius: 16px; margin: 32px 0; }
        .login-icon { font-size: 48px; margin-bottom: 16px; }
        .login-required-box h2 { margin-bottom: 8px; }
        .login-required-box p { color: #666; margin-bottom: 24px; }
        .options-panel { display: flex; flex-wrap: wrap; gap: 24px; padding: 16px; background: #f8f9fa; border-radius: 12px; margin-bottom: 24px; }
        .option-group { flex: 1; min-width: 200px; }
        .option-group label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333; }
        .padding-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .padding-row { display: flex; align-items: center; gap: 8px; }
        .padding-row span { min-width: 50px; font-size: 13px; }
        .padding-row input { width: 80px; padding: 6px; border: 1px solid #e0e0e0; border-radius: 4px; }
        .option-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .option-btn { padding: 8px 16px; border: 2px solid #e0e0e0; background: #fff; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .option-btn:hover { border-color: #667eea; }
        .option-btn.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-color: transparent; }
        .option-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .color-picker-row { display: flex; align-items: center; gap: 12px; }
        .color-picker-row input[type="color"] { width: 40px; height: 40px; border: none; border-radius: 8px; cursor: pointer; }
        .feature-icon { font-size: 32px; margin-bottom: 12px; }
        .editor-main { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 768px) { .editor-main { grid-template-columns: 1fr; } }
        .preview-section h3 { margin-bottom: 12px; font-size: 14px; color: #666; }
        .preview-box { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: #f5f5f5; aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center; }
        .preview-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .action-buttons { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 24px; }
        .processing-status { display: flex; align-items: center; gap: 12px; color: #666; }
        .spinner { width: 24px; height: 24px; border: 3px solid #e0e0e0; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-message { color: #dc3545; padding: 12px; background: #fff5f5; border-radius: 8px; margin-top: 12px; }
        .features-section { margin-top: 48px; padding-top: 32px; border-top: 1px solid #e0e0e0; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-top: 24px; }
        .feature-card { padding: 24px; background: #f8f9fa; border-radius: 12px; text-align: center; }
        .feature-card h3 { margin-bottom: 12px; font-size: 18px; }
        .feature-card p { color: #666; line-height: 1.6; }
      `}</style>
    </>
  )
}
