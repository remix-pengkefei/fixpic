import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getHistory, deleteHistory, clearAllHistory, getToolDisplayName, getToolIcon } from '../services/history'
import type { HistoryRecord } from '../services/history'
import { languages } from '../i18n'

export function History() {
  const { t, i18n } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Get current language from URL
  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'
  const langLink = (path: string) => `/${currentLang}${path}`

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(langLink(''))
      return
    }

    if (user) {
      loadHistory()
    }
  }, [user, authLoading])

  const loadHistory = async () => {
    setLoading(true)
    const data = await getHistory()
    setHistory(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (await deleteHistory(id)) {
      setHistory(prev => prev.filter(h => h.id !== id))
    }
  }

  const handleClearAll = async () => {
    if (window.confirm(t('history.confirmClear'))) {
      if (await clearAllHistory()) {
        setHistory([])
      }
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${bytes} B`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(currentLang, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="history-page">
        <div className="history-loading">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>{t('history.title')}</h1>
        {history.length > 0 && (
          <button className="clear-all-btn" onClick={handleClearAll}>
            {t('history.clearAll')}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="history-empty">
          <div className="empty-icon">📋</div>
          <p>{t('history.empty')}</p>
          <p className="empty-hint">{t('history.emptyHint')}</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map(record => (
            <div key={record.id} className="history-item">
              <div className="history-icon">{getToolIcon(record.tool_type)}</div>
              <div className="history-info">
                <p className="history-filename">{record.original_filename}</p>
                <p className="history-meta">
                  <span className="history-tool">{getToolDisplayName(record.tool_type)}</span>
                  <span className="history-size">
                    {formatSize(record.original_size)}
                    {record.result_size && ` → ${formatSize(record.result_size)}`}
                  </span>
                </p>
                <p className="history-date">{formatDate(record.created_at)}</p>
              </div>
              <button
                className="history-delete-btn"
                onClick={() => handleDelete(record.id)}
                title={t('common.delete')}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
