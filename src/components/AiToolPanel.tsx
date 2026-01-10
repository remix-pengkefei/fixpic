import { useTranslation } from 'react-i18next'

interface AiToolPanelProps {
  // 上传相关
  uploadedImage: string | null
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  inputId: string
  // 处理相关
  processing: boolean
  onProcess: () => void
  processButtonIcon: string
  processButtonTextKey: string
  disabled: boolean
  // 结果相关
  resultImage: string | null
  onDownload: () => void
  error: string | null
  // 选项（可选）
  optionsNode?: React.ReactNode
}

export function AiToolPanel({
  uploadedImage,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  inputId,
  processing,
  onProcess,
  processButtonIcon,
  processButtonTextKey,
  disabled,
  resultImage,
  onDownload,
  error,
  optionsNode,
}: AiToolPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="ai-remove-bg-container">
      {optionsNode}

      <div className="ai-panels">
        {/* Upload Panel */}
        <div className="ai-panel">
          <div className="ai-panel-header">
            <h3>{t('upload.title')}</h3>
          </div>
          <div
            className={`ai-upload-zone ${isDragging ? 'dragging' : ''} ${uploadedImage ? 'has-image' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <input
              id={inputId}
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              style={{ display: 'none' }}
            />
            {uploadedImage ? (
              <img src={uploadedImage} alt="Uploaded" className="ai-preview-image" />
            ) : (
              <div className="ai-upload-placeholder">
                <div className="ai-upload-icon">📤</div>
                <p>{t('upload.dragDrop')}</p>
                <p className="ai-upload-hint">{t('upload.dragDropHint')}</p>
              </div>
            )}
          </div>
          <button
            className="ai-process-btn"
            onClick={onProcess}
            disabled={disabled || processing}
          >
            {processing ? (
              <>
                <span className="spinner-inline"></span>
                {t('process.processing')}
              </>
            ) : (
              <>{processButtonIcon} {t(processButtonTextKey)}</>
            )}
          </button>
        </div>

        {/* Result Panel */}
        <div className="ai-panel">
          <div className="ai-panel-header">
            <h3>{t('process.result')}</h3>
            {resultImage && (
              <button className="ai-download-btn" onClick={onDownload}>
                {t('process.download')}
              </button>
            )}
          </div>
          <div className="ai-result-zone">
            {processing ? (
              <div className="ai-processing">
                <div className="spinner"></div>
                <p>{t('process.aiProcessing')}</p>
                <p className="ai-processing-hint">{t('process.processingHint')}</p>
              </div>
            ) : resultImage ? (
              <img src={resultImage} alt="Result" className="ai-result-image" />
            ) : error ? (
              <div className="ai-error">
                <p>{t('process.failed')}</p>
                <p className="ai-error-detail">{error}</p>
              </div>
            ) : (
              <div className="ai-result-placeholder">
                <div className="ai-result-icon">🖼️</div>
                <p>{t('process.resultPlaceholder')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
