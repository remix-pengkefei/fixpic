import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('email')
      setEmail('')
      setCode('')
      setError('')
      setCountdown(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setStep('code')
      setCountdown(60)
    }
    setLoading(false)
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code) return

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    })

    if (error) {
      setError(error.message)
    } else {
      onClose()
    }
    setLoading(false)
  }

  const handleResendCode = async () => {
    if (countdown > 0) return

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setCountdown(60)
    }
    setLoading(false)
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>

        <h2>{t('auth.login')}</h2>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="auth-form">
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
              {loading ? t('common.loading') : t('auth.sendCode')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="auth-form">
            <p className="auth-hint">{t('auth.codeHint', { email })}</p>
            <input
              type="text"
              placeholder={t('auth.enterCode')}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
              maxLength={6}
              className="auth-code-input"
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit-btn" disabled={loading || code.length < 6}>
              {loading ? t('common.loading') : t('auth.verify')}
            </button>

            <p className="auth-resend">
              {countdown > 0 ? (
                <span>{t('auth.resendIn', { seconds: countdown })}</span>
              ) : (
                <button type="button" onClick={handleResendCode} disabled={loading}>
                  {t('auth.resendCode')}
                </button>
              )}
            </p>

            <button
              type="button"
              className="auth-back-btn"
              onClick={() => { setStep('email'); setCode(''); setError('') }}
            >
              {t('auth.changeEmail')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
