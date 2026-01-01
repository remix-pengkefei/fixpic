import { useState, useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEO } from '../components/SEO'
import { StructuredData } from '../components/StructuredData'
import { languages } from '../i18n'
import { changeBgAI } from '../api'

interface BackgroundResult {
  image: string
  prompt: string
}

export function ChangeBackground() {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'
  const langLink = (path: string) => `/${currentLang}${path}`

  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [inputFile, setInputFile] = useState<File | null>(null)
  const [inputPreview, setInputPreview] = useState<string>('')
  const [transparentResult, setTransparentResult] = useState<string>('')
  const [backgrounds, setBackgrounds] = useState<BackgroundResult[]>([])
  const [selectedBg, setSelectedBg] = useState<number>(-1) // -1 = transparent
  const [error, setError] = useState<string>('')

  useEffect(() => {
    return () => {
      if (inputPreview) URL.revokeObjectURL(inputPreview)
    }
  }, [inputPreview])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return

    setInputFile(file)
    setInputPreview(URL.createObjectURL(file))
    setTransparentResult('')
    setBackgrounds([])
    setSelectedBg(-1)
    setError('')
  }, [])

  const processImage = useCallback(async () => {
    if (!inputFile) return

    setProcessing(true)
    setError('')

    try {
      const result = await changeBgAI({ image: inputFile, numBackgrounds: 6 })

      if (result.success) {
        setTransparentResult(result.transparent || '')
        setBackgrounds(result.backgrounds || [])
        setSelectedBg(-1)
      } else {
        setError(result.error || 'Processing failed')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setProcessing(false)
    }
  }, [inputFile])

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

  const downloadResult = useCallback(() => {
    const imageData = selectedBg === -1 ? transparentResult : backgrounds[selectedBg]?.image
    if (!imageData) return

    const link = document.createElement('a')
    link.href = imageData
    link.download = `background-changed-${Date.now()}.png`
    link.click()
  }, [selectedBg, transparentResult, backgrounds])

  const currentResult = selectedBg === -1 ? transparentResult : backgrounds[selectedBg]?.image

  return (
    <>
      <SEO
        title={t('changeBg.title', 'AI Background Changer - Auto Generate Matching Backgrounds')}
        description={t('changeBg.description', 'Automatically remove background and generate AI-powered matching backgrounds for your photos. Perfect for e-commerce and portraits.')}
        keywords="background remover, AI background, change background, photo editor, e-commerce photo"
        canonicalUrl={`/${currentLang}/change-background`}
      />
      <StructuredData type="home" />

      <div className="tool-page">
        <nav className="breadcrumb">
          <Link to={langLink('/')}>{t('home.title', 'Home')}</Link>
          <span>/</span>
          <span>{t('changeBg.title', 'AI Background Changer')}</span>
        </nav>

        <h1>{t('changeBg.title', 'AI Background Changer')}</h1>
        <p className="tool-description">
          {t('changeBg.description', 'Automatically remove background and generate AI-powered matching backgrounds for your photos. Perfect for e-commerce products and portrait photos.')}
        </p>

        {!inputFile ? (
          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
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
          </div>
        ) : (
          <div className="editor-container">
            <div className="editor-main">
              <div className="preview-section">
                <h3>{t('changeBg.original', 'Original')}</h3>
                <div className="preview-box">
                  <img src={inputPreview} alt="Original" />
                </div>
              </div>

              {currentResult && (
                <div className="preview-section">
                  <h3>{t('changeBg.result', 'Result')}</h3>
                  <div className="preview-box checkerboard">
                    <img src={currentResult} alt="Result" />
                  </div>
                </div>
              )}
            </div>

            {backgrounds.length > 0 && (
              <div className="backgrounds-grid">
                <h3>{t('changeBg.selectBackground', 'Select Background')}</h3>
                <div className="bg-options">
                  <div
                    className={`bg-option ${selectedBg === -1 ? 'selected' : ''}`}
                    onClick={() => setSelectedBg(-1)}
                  >
                    <div className="bg-preview checkerboard">
                      {transparentResult && <img src={transparentResult} alt="Transparent" />}
                    </div>
                    <span>{t('changeBg.transparent', 'Transparent')}</span>
                  </div>

                  {backgrounds.map((bg, index) => (
                    <div
                      key={index}
                      className={`bg-option ${selectedBg === index ? 'selected' : ''}`}
                      onClick={() => setSelectedBg(index)}
                    >
                      <div className="bg-preview">
                        <img src={bg.image} alt={`Background ${index + 1}`} />
                      </div>
                      <span>{t('changeBg.background', 'Background')} {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="action-buttons">
              {!processing && !backgrounds.length && (
                <button className="btn-primary" onClick={processImage}>
                  {t('changeBg.generate', 'Generate Backgrounds')}
                </button>
              )}

              {processing && (
                <div className="processing-status">
                  <div className="spinner"></div>
                  <span>{t('changeBg.processing', 'Generating AI backgrounds... This may take 30-60 seconds')}</span>
                </div>
              )}

              {currentResult && (
                <button className="btn-primary" onClick={downloadResult}>
                  {t('download', 'Download')}
                </button>
              )}

              <button
                className="btn-secondary"
                onClick={() => {
                  setInputFile(null)
                  setInputPreview('')
                  setTransparentResult('')
                  setBackgrounds([])
                  setError('')
                }}
              >
                {t('changeBg.newImage', 'New Image')}
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="features-section">
          <h2>{t('changeBg.features', 'Features')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>{t('changeBg.feature1Title', 'Auto Subject Detection')}</h3>
              <p>{t('changeBg.feature1Desc', 'AI automatically detects the main subject in your photo')}</p>
            </div>
            <div className="feature-card">
              <h3>{t('changeBg.feature2Title', 'Smart Background Generation')}</h3>
              <p>{t('changeBg.feature2Desc', 'Generate 6 matching backgrounds based on your image content')}</p>
            </div>
            <div className="feature-card">
              <h3>{t('changeBg.feature3Title', 'E-commerce Ready')}</h3>
              <p>{t('changeBg.feature3Desc', 'Perfect for product photos and professional portraits')}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .editor-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
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

        .checkerboard {
          background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }

        .backgrounds-grid {
          margin-top: 16px;
        }

        .backgrounds-grid h3 {
          margin-bottom: 16px;
          font-size: 16px;
        }

        .bg-options {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }

        .bg-option {
          cursor: pointer;
          border: 2px solid transparent;
          border-radius: 8px;
          padding: 8px;
          transition: all 0.2s;
        }

        .bg-option:hover {
          border-color: #ddd;
        }

        .bg-option.selected {
          border-color: #007bff;
          background: #f0f7ff;
        }

        .bg-preview {
          aspect-ratio: 1;
          border-radius: 4px;
          overflow: hidden;
          background: #f5f5f5;
          margin-bottom: 8px;
        }

        .bg-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bg-option span {
          font-size: 12px;
          color: #666;
          display: block;
          text-align: center;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
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
          border-top-color: #007bff;
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
