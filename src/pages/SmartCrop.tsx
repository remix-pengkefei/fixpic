import { useState, useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { languages } from '../i18n'
import { useAuth } from '../contexts/AuthContext'
import { smartCrop } from '../lib/pixelbin'
import type { SmartCropOptions } from '../lib/pixelbin'

export function SmartCrop() {
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

  const [gravity, setGravity] = useState<'object' | 'foreground' | 'face' | 'none'>('object')
  const [aspectRatio, setAspectRatio] = useState('1_1')

  const aspectRatios = [
    { value: '1_1', label: '1:1' },
    { value: '4_3', label: '4:3' },
    { value: '3_4', label: '3:4' },
    { value: '16_9', label: '16:9' },
    { value: '9_16', label: '9:16' },
  ]

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
      const options: SmartCropOptions = {
        gravity,
        aspectRatio,
      }
      const response = await smartCrop(inputFile, options)
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
  }, [inputFile, gravity, aspectRatio])

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
    link.download = `smart-crop-${Date.now()}.png`
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
          title={t('smartCrop.title', 'AI Smart Crop - Intelligent Image Cropping')}
          description={t('smartCrop.description', 'Automatically crop images to focus on the main subject using AI. Perfect for portraits, products, and more.')}
          keywords="smart crop, AI crop, intelligent crop, auto crop"
          canonicalUrl={`/${currentLang}/smart-crop`}
        />
        <StructuredData type="home" />
        <div className="tool-page">
          <h1>{t('smartCrop.title', 'AI Smart Crop')}</h1>
          <p className="tool-description">{t('smartCrop.description', 'Automatically crop images to focus on the main subject using AI.')}</p>
          <div className="login-required-box">
            <div className="login-icon">🔒</div>
            <h2>{t('auth.loginRequired', 'Login Required')}</h2>
            <p>{t('auth.loginToUse', 'Please login to use this AI tool')}</p>
            <Link to={langLink('/')} className="btn-primary">{t('auth.login', 'Login')}</Link>
          </div>
          <div className="features-section">
            <h2>{t('smartCrop.features', 'Features')}</h2>
            <div className="features-grid">
              <div className="feature-card"><div className="feature-icon">🎯</div><h3>{t('smartCrop.feature1Title', 'Subject Detection')}</h3><p>{t('smartCrop.feature1Desc', 'AI detects the main subject automatically')}</p></div>
              <div className="feature-card"><div className="feature-icon">📐</div><h3>{t('smartCrop.feature2Title', 'Aspect Ratios')}</h3><p>{t('smartCrop.feature2Desc', 'Choose from popular aspect ratios')}</p></div>
              <div className="feature-card"><div className="feature-icon">👤</div><h3>{t('smartCrop.feature3Title', 'Face Focus')}</h3><p>{t('smartCrop.feature3Desc', 'Option to focus on faces in portraits')}</p></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO title={t('smartCrop.title', 'AI Smart Crop')} description={t('smartCrop.description', 'Intelligent image cropping with AI')} keywords="smart crop, AI crop" canonicalUrl={`/${currentLang}/smart-crop`} />
      <StructuredData type="home" />
      <div className="tool-page">
        <h1>{t('smartCrop.title', 'AI Smart Crop')}</h1>
        <p className="tool-description">{t('smartCrop.description', 'Automatically crop images to focus on the main subject using AI.')}</p>

        {!inputFile ? (
          <div className={`upload-area ${isDragging ? 'dragging' : ''}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => document.getElementById('smartcrop-file-input')?.click()}>
            <input id="smartcrop-file-input" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            <div className="upload-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg></div>
            <p>{t('upload.dragDrop', 'Drag & drop your image here')}</p>
            <p className="upload-hint">{t('upload.or', 'or click to select')}</p>
          </div>
        ) : (
          <div className="editor-container">
            <div className="options-panel">
              <div className="option-group">
                <label>{t('smartCrop.focus', 'Focus On')}</label>
                <div className="option-buttons">
                  {(['object', 'foreground', 'face', 'none'] as const).map(g => (
                    <button key={g} className={`option-btn ${gravity === g ? 'active' : ''}`} onClick={() => setGravity(g)} disabled={processing}>
                      {t(`smartCrop.gravity.${g}`, g.charAt(0).toUpperCase() + g.slice(1))}
                    </button>
                  ))}
                </div>
              </div>
              <div className="option-group">
                <label>{t('smartCrop.aspectRatio', 'Aspect Ratio')}</label>
                <div className="option-buttons">
                  {aspectRatios.map(ar => (
                    <button key={ar.value} className={`option-btn ${aspectRatio === ar.value ? 'active' : ''}`} onClick={() => setAspectRatio(ar.value)} disabled={processing}>
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="editor-main">
              <div className="preview-section"><h3>{t('common.original', 'Original')}</h3><div className="preview-box"><img src={inputPreview} alt="Original" /></div></div>
              {result && <div className="preview-section"><h3>{t('common.result', 'Result')}</h3><div className="preview-box"><img src={result} alt="Result" /></div></div>}
            </div>

            <div className="action-buttons">
              {!processing && !result && <button className="btn-primary" onClick={processImage}>{t('smartCrop.crop', 'Smart Crop')}</button>}
              {processing && <div className="processing-status"><div className="spinner"></div><span>{t('smartCrop.processing', 'Cropping...')}</span></div>}
              {result && <button className="btn-primary" onClick={downloadResult}>{t('common.download', 'Download')}</button>}
              <button className="btn-secondary" onClick={resetTool}>{t('common.newImage', 'New Image')}</button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        <div className="features-section">
          <h2>{t('smartCrop.features', 'Features')}</h2>
          <div className="features-grid">
            <div className="feature-card"><div className="feature-icon">🎯</div><h3>{t('smartCrop.feature1Title', 'Subject Detection')}</h3><p>{t('smartCrop.feature1Desc', 'AI detects main subject')}</p></div>
            <div className="feature-card"><div className="feature-icon">📐</div><h3>{t('smartCrop.feature2Title', 'Aspect Ratios')}</h3><p>{t('smartCrop.feature2Desc', 'Popular aspect ratios')}</p></div>
            <div className="feature-card"><div className="feature-icon">👤</div><h3>{t('smartCrop.feature3Title', 'Face Focus')}</h3><p>{t('smartCrop.feature3Desc', 'Focus on faces')}</p></div>
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
        .option-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .option-btn { padding: 8px 16px; border: 2px solid #e0e0e0; background: #fff; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .option-btn:hover { border-color: #667eea; }
        .option-btn.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-color: transparent; }
        .option-btn:disabled { opacity: 0.5; cursor: not-allowed; }
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
