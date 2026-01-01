import { useState, useEffect, useRef } from 'react'
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
  const codeInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('email')
      setEmail('')
      setCode('')
      setError('')
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
      setTimeout(() => codeInputRef.current?.focus(), 100)
    }
    setLoading(false)
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || code.length < 6) {
      setError(t('auth.codeRequired'))
      return
    }

    setLoading(true)
    setError('')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    })

    if (verifyError) {
      setError(verifyError.message)
      setCode('')
      codeInputRef.current?.focus()
    } else if (data.session) {
      onClose()
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    setCode('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setError('')
      codeInputRef.current?.focus()
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
          <form onSubmit={handleVerifyCode} className="auth-code">
            <p className="auth-code-hint">{t('auth.codeSentTo', { email })}</p>

            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="auth-code-single-input"
              disabled={loading}
              autoComplete="one-time-code"
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit-btn" disabled={loading || !code}>
              {loading ? t('auth.verifying') : t('auth.verify')}
            </button>

            <div className="auth-code-actions">
              <button
                type="button"
                className="auth-link-btn"
                onClick={handleResend}
                disabled={loading}
              >
                {t('auth.resendCode')}
              </button>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => { setStep('email'); setError(''); setCode('') }}
              >
                {t('auth.changeEmail')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
