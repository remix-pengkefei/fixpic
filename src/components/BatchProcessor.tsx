import { useTranslation } from 'react-i18next'
import type { Tool, PendingFile, ProcessedImage } from '../types'
import { formatSize } from '../utils/imageProcessing'

interface BatchProcessorProps {
  activeTool: Tool
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  pendingFiles: PendingFile[]
  results: ProcessedImage[]
  processing: boolean
  processingIndex: number | null
  onProcessSingle: (index: number) => void
  onProcessAll: () => void
  onRemovePending: (index: number) => void
  onClearPending: () => void
  onDownloadFile: (result: ProcessedImage) => void
  onDownloadAll: () => void
}

export function BatchProcessor({
  activeTool,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  pendingFiles,
  results,
  processing,
  processingIndex,
  onProcessSingle,
  onProcessAll,
  onRemovePending,
  onClearPending,
  onDownloadFile,
  onDownloadAll,
}: BatchProcessorProps) {
  const { t } = useTranslation()

  const getDropIcon = () => {
    if (activeTool === 'remove-bg') return '🖼️'
    if (activeTool === 'resize') return '📐'
    return '📁'
  }

  return (
    <>
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          multiple
          onChange={onFileSelect}
          style={{ display: 'none' }}
        />
        <div className="drop-icon">{getDropIcon()}</div>
        <p className="drop-text">{t('upload.dropHere')}</p>
        <p className="drop-hint">{t('upload.batchHint')}</p>
      </div>

      {/* Pending Files */}
      {pendingFiles.length > 0 && (
        <div className="pending-section">
          <div className="pending-header">
            <h3>{t('pending.title')} ({pendingFiles.length})</h3>
            <div className="pending-actions">
              <button className="clear-btn" onClick={onClearPending}>
                {t('pending.clear')}
              </button>
              <button
                className="process-all-btn"
                onClick={onProcessAll}
                disabled={processing}
              >
                {processing ? t('pending.processing') : t('pending.processAll')}
              </button>
            </div>
          </div>

          <div className="pending-grid">
            {pendingFiles.map((p, i) => (
              <div key={i} className={`pending-card ${processingIndex === i ? 'processing' : ''}`}>
                <button className="remove-btn" onClick={(e) => { e.stopPropagation(); onRemovePending(i) }}>×</button>
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
                  onClick={() => onProcessSingle(i)}
                  disabled={processing || processingIndex !== null}
                >
                  {t('pending.process')}
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
            <h3>{t('results.title')} ({results.length})</h3>
            <button className="download-all-btn" onClick={onDownloadAll}>
              {t('results.downloadAll')}
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
                        ? ` (${t('results.saved')} ${Math.round((1 - r.resultSize / r.originalSize) * 100)}%)`
                        : ` (${t('results.increased')} ${Math.round((r.resultSize / r.originalSize - 1) * 100)}%)`
                      }
                    </span>
                  </p>
                </div>
                <button className="download-btn" onClick={() => onDownloadFile(r)}>
                  {t('results.download')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
