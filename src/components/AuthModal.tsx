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
  const [code, setCode] = useState(['', '', '', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('email')
      setEmail('')
      setCode(['', '', '', '', '', '', '', ''])
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')

    // Use email type to get a code instead of magic link
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
      // Focus first code input
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
    setLoading(false)
  }

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 8 digits entered
    if (value && index === 7 && newCode.every(d => d !== '')) {
      handleVerifyCode(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (pastedData.length === 8) {
      const newCode = pastedData.split('')
      setCode(newCode)
      handleVerifyCode(pastedData)
    }
  }

  const handleVerifyCode = async (otpCode: string) => {
    setLoading(true)
    setError('')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email'
    })

    if (verifyError) {
      setError(verifyError.message)
      setCode(['', '', '', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } else if (data.session) {
      // Success! Close modal
      onClose()
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    setCode(['', '', '', '', '', '', '', ''])

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
      inputRefs.current[0]?.focus()
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
          <div className="auth-code">
            <p className="auth-code-hint">{t('auth.codeSentTo', { email })}</p>

            <div className="auth-code-inputs" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className="auth-code-input"
                  disabled={loading}
                />
              ))}
            </div>

            {error && <p className="auth-error">{error}</p>}

            {loading && <p className="auth-loading">{t('auth.verifying')}</p>}

            <div className="auth-code-actions">
              <button
                type="button"
                className="auth-resend-btn"
                onClick={handleResend}
                disabled={loading}
              >
                {t('auth.resendCode')}
              </button>
              <button
                type="button"
                className="auth-back-btn"
                onClick={() => { setStep('email'); setError(''); setCode(['', '', '', '', '', '', '', '']) }}
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
