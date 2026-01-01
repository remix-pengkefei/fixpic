import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))

        // Check for error in URL
        const errorParam = params.get('error') || hashParams.get('error')
        const errorDescription = params.get('error_description') || hashParams.get('error_description')

        if (errorParam) {
          console.error('Auth error from URL:', errorParam, errorDescription)
          setError(errorDescription || errorParam)
          return
        }

        // Handle PKCE code exchange (Magic Link flow)
        const code = params.get('code')
        if (code) {
          console.log('Exchanging code for session...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setError(exchangeError.message)
            return
          }

          if (data.session) {
            console.log('Login successful!')
            navigate('/', { replace: true })
            return
          }
        }

        // Fallback: check if session already exists
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('Session already exists')
          navigate('/', { replace: true })
          return
        }

        // No code and no session
        setError('Login failed. Please try again.')
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An unexpected error occurred')
      }
    }

    handleAuthCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="auth-callback">
        <div className="auth-callback-error">
          <p>{error}</p>
          <button onClick={() => navigate('/', { replace: true })}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-callback">
      <div className="spinner"></div>
      <p>Logging in...</p>
    </div>
  )
}
