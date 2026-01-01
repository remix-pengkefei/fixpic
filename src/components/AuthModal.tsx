import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('email')
      setEmail('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setStep('sent')
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>

        <h2>{t('auth.login')}</h2>

        {step === 'email' ? (
          <form onSubmit={handleSendLink} className="auth-form">
            <p className="auth-hint">{t('auth.emailHint')}</p>
            <input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? t('common.loading') : t('auth.sendLink')}
            </button>
          </form>
        ) : (
          <div className="auth-sent">
            <div className="auth-sent-icon">✉️</div>
            <h3>{t('auth.checkInbox')}</h3>
            <p className="auth-sent-text">{t('auth.linkSentTo', { email })}</p>
            <p className="auth-sent-hint">{t('auth.clickLinkHint')}</p>

            {error && <p className="auth-error">{error}</p>}

            <div className="auth-sent-actions">
              <button
                type="button"
                className="auth-resend-btn"
                onClick={handleResend}
                disabled={loading}
              >
                {loading ? t('common.loading') : t('auth.resendLink')}
              </button>
              <button
                type="button"
                className="auth-back-btn"
                onClick={() => { setStep('email'); setError('') }}
              >
                {t('auth.changeEmail')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
