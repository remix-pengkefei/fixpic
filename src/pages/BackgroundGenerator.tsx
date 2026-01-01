import { useState, useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { languages } from '../i18n'
import { useAuth } from '../contexts/AuthContext'
import { generateBg } from '../lib/pixelbin'
import type { GenerateBgOptions } from '../lib/pixelbin'

export function BackgroundGenerator() {
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

  // 选项状态
  const [prompt, setPrompt] = useState('')
  const [focus, setFocus] = useState<'Product' | 'Background'>('Product')

  // 预设背景提示
  const presetPrompts = [
    { key: 'studio', label: t('bgGenerator.preset.studio', 'Professional Studio'), prompt: 'Professional studio lighting with clean white background' },
    { key: 'nature', label: t('bgGenerator.preset.nature', 'Natural Outdoor'), prompt: 'Beautiful natural outdoor setting with soft sunlight and green leaves' },
    { key: 'office', label: t('bgGenerator.preset.office', 'Modern Office'), prompt: 'Modern office environment with clean desk and professional atmosphere' },
    { key: 'gradient', label: t('bgGenerator.preset.gradient', 'Soft Gradient'), prompt: 'Soft gradient background with pastel colors' },
    { key: 'marble', label: t('bgGenerator.preset.marble', 'Marble Surface'), prompt: 'Elegant marble surface with luxury feel' },
    { key: 'cityscape', label: t('bgGenerator.preset.cityscape', 'City Skyline'), prompt: 'Modern city skyline at sunset with beautiful colors' },
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
    if (!inputFile || !prompt.trim()) {
      setError(t('bgGenerator.promptRequired', 'Please enter a background description'))
      return
    }

    setProcessing(true)
    setError('')

    try {
      const options: GenerateBgOptions = {
        prompt: prompt.trim(),
        focus,
      }
      const response = await generateBg(inputFile, options)

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
  }, [inputFile, prompt, focus, t])

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

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

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
    link.download = `ai-background-${Date.now()}.png`
    link.click()
    URL.revokeObjectURL(url)
  }, [result])

  const resetTool = useCallback(() => {
    setInputFile(null)
    setInputPreview('')
    setResult('')
    setError('')
    setPrompt('')
  }, [])

  // 未登录时显示登录提示
  if (!user) {
    return (
      <>
        <SEO
          title={t('bgGenerator.title', 'AI Background Generator - Create Custom Backgrounds')}
          description={t('bgGenerator.description', 'Generate custom AI backgrounds for your photos. Perfect for product photography and creative projects.')}
          keywords="AI background generator, background generator, AI background, photo background, product photography"
          canonicalUrl={`/${currentLang}/background-generator`}
        />
        <StructuredData type="home" />

        <div className="tool-page">
          <h1>{t('bgGenerator.title', 'AI Background Generator')}</h1>
          <p className="tool-description">
            {t('bgGenerator.description', 'Generate custom AI backgrounds for your photos. Perfect for product photography and creative projects.')}
          </p>

          <div className="login-required-box">
            <div className="login-icon">🔒</div>
            <h2>{t('auth.loginRequired', 'Login Required')}</h2>
            <p>{t('auth.loginToUse', 'Please login to use this AI tool')}</p>
            <Link to={langLink('/')} className="btn-primary">
              {t('auth.login', 'Login')}
            </Link>
          </div>

          <div className="features-section">
            <h2>{t('bgGenerator.features', 'Features')}</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎨</div>
                <h3>{t('bgGenerator.feature1Title', 'Text-to-Background')}</h3>
                <p>{t('bgGenerator.feature1Desc', 'Describe your ideal background and AI creates it')}</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📸</div>
                <h3>{t('bgGenerator.feature2Title', 'Product Focus')}</h3>
                <p>{t('bgGenerator.feature2Desc', 'Keep your product sharp while generating backgrounds')}</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🖼️</div>
                <h3>{t('bgGenerator.feature3Title', 'Preset Styles')}</h3>
                <p>{t('bgGenerator.feature3Desc', 'Choose from professional preset backgrounds')}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title={t('bgGenerator.title', 'AI Background Generator - Create Custom Backgrounds')}
        description={t('bgGenerator.description', 'Generate custom AI backgrounds for your photos. Perfect for product photography and creative projects.')}
        keywords="AI background generator, background generator, AI background, photo background, product photography"
        canonicalUrl={`/${currentLang}/background-generator`}
      />
      <StructuredData type="home" />

      <div className="tool-page">
        <h1>{t('bgGenerator.title', 'AI Background Generator')}</h1>
        <p className="tool-description">
          {t('bgGenerator.description', 'Generate custom AI backgrounds for your photos. Perfect for product photography and creative projects.')}
        </p>

        {!inputFile ? (
          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('bg-gen-file-input')?.click()}
          >
            <input
              id="bg-gen-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div className="upload-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p>{t('upload.dragDrop', 'Drag & drop your image here')}</p>
            <p className="upload-hint">{t('upload.or', 'or click to select')}</p>
            <p className="upload-formats">PNG, JPG, JPEG, WEBP</p>
          </div>
        ) : (
          <div className="editor-container">
            {/* 选项面板 */}
            <div className="options-panel">
              <div className="option-group full-width">
                <label>{t('bgGenerator.prompt', 'Background Description')}</label>
                <textarea
                  className="prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('bgGenerator.promptPlaceholder', 'Describe the background you want, e.g., "Professional studio with soft lighting"')}
                  disabled={processing}
                  rows={3}
                />
              </div>

              <div className="option-group full-width">
                <label>{t('bgGenerator.presets', 'Quick Presets')}</label>
                <div className="preset-buttons">
                  {presetPrompts.map((preset) => (
                    <button
                      key={preset.key}
                      className={`preset-btn ${prompt === preset.prompt ? 'active' : ''}`}
                      onClick={() => setPrompt(preset.prompt)}
                      disabled={processing}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <label>{t('bgGenerator.focus', 'Focus')}</label>
                <div className="option-buttons">
                  <button
                    className={`option-btn ${focus === 'Product' ? 'active' : ''}`}
                    onClick={() => setFocus('Product')}
                    disabled={processing}
                  >
                    {t('bgGenerator.focusProduct', 'Product')}
                  </button>
                  <button
                    className={`option-btn ${focus === 'Background' ? 'active' : ''}`}
                    onClick={() => setFocus('Background')}
                    disabled={processing}
                  >
                    {t('bgGenerator.focusBackground', 'Background')}
                  </button>
                </div>
              </div>
            </div>

            {/* 预览区域 */}
            <div className="editor-main">
              <div className="preview-section">
                <h3>{t('common.original', 'Original')}</h3>
                <div className="preview-box">
                  <img src={inputPreview} alt="Original" />
                </div>
              </div>

              {result && (
                <div className="preview-section">
                  <h3>{t('common.result', 'Result')}</h3>
                  <div className="preview-box">
                    <img src={result} alt="Result" />
                  </div>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="action-buttons">
              {!processing && !result && (
                <button className="btn-primary" onClick={processImage} disabled={!prompt.trim()}>
                  {t('bgGenerator.generate', 'Generate Background')}
                </button>
              )}

              {processing && (
                <div className="processing-status">
                  <div className="spinner"></div>
                  <span>{t('bgGenerator.processing', 'Generating background...')}</span>
                </div>
              )}

              {result && (
                <>
                  <button className="btn-primary" onClick={downloadResult}>
                    {t('common.download', 'Download')}
                  </button>
                  <button className="btn-secondary" onClick={() => setResult('')}>
                    {t('bgGenerator.regenerate', 'Regenerate')}
                  </button>
                </>
              )}

              <button className="btn-secondary" onClick={resetTool}>
                {t('common.newImage', 'New Image')}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        <div className="features-section">
          <h2>{t('bgGenerator.features', 'Features')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>{t('bgGenerator.feature1Title', 'Text-to-Background')}</h3>
              <p>{t('bgGenerator.feature1Desc', 'Describe your ideal background and AI creates it')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>{t('bgGenerator.feature2Title', 'Product Focus')}</h3>
              <p>{t('bgGenerator.feature2Desc', 'Keep your product sharp while generating backgrounds')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🖼️</div>
              <h3>{t('bgGenerator.feature3Title', 'Preset Styles')}</h3>
              <p>{t('bgGenerator.feature3Desc', 'Choose from professional preset backgrounds')}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-required-box {
          text-align: center;
          padding: 48px;
          background: #f8f9fa;
          border-radius: 16px;
          margin: 32px 0;
        }
        .login-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .login-required-box h2 {
          margin-bottom: 8px;
        }
        .login-required-box p {
          color: #666;
          margin-bottom: 24px;
        }
        .options-panel {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .option-group {
          flex: 1;
          min-width: 200px;
        }
        .option-group.full-width {
          flex-basis: 100%;
        }
        .option-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #333;
        }
        .prompt-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          font-family: inherit;
        }
        .prompt-input:focus {
          border-color: #667eea;
          outline: none;
        }
        .prompt-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }
        .preset-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .preset-btn {
          padding: 8px 16px;
          border: 2px solid #e0e0e0;
          background: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .preset-btn:hover {
          border-color: #667eea;
        }
        .preset-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }
        .preset-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .option-buttons {
          display: flex;
          gap: 8px;
        }
        .option-btn {
          padding: 8px 20px;
          border: 2px solid #e0e0e0;
          background: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .option-btn:hover {
          border-color: #667eea;
        }
        .option-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }
        .option-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .upload-formats {
          font-size: 12px;
          color: #999;
          margin-top: 8px;
        }
        .feature-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        .editor-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .editor-main {
            grid-template-columns: 1fr;
          }
        }
        .preview-section h3 {
          margin-bottom: 12px;
          font-size: 14px;
          color: #666;
        }
        .preview-box {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview-box img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 24px;
        }
        .processing-status {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #666;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e0e0e0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .error-message {
          color: #dc3545;
          padding: 12px;
          background: #fff5f5;
          border-radius: 8px;
          margin-top: 12px;
        }
        .features-section {
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid #e0e0e0;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }
        .feature-card {
          padding: 24px;
          background: #f8f9fa;
          border-radius: 12px;
          text-align: center;
        }
        .feature-card h3 {
          margin-bottom: 12px;
          font-size: 18px;
        }
        .feature-card p {
          color: #666;
          line-height: 1.6;
        }
      `}</style>
    </>
  )
}
