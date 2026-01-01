import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))

        // Check for error
        const errorParam = params.get('error') || hashParams.get('error')
        const errorDescription = params.get('error_description') || hashParams.get('error_description')

        if (errorParam) {
          setError(errorDescription || errorParam)
          return
        }

        // Handle PKCE code exchange
        const code = params.get('code')
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setError(exchangeError.message)
            return
          }
          if (data.session) {
            // Success! Redirect to home
            navigate('/', { replace: true })
            return
          }
        }

        // Check for hash tokens (implicit flow / magic link)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setError(sessionError.message)
            return
          }

          if (data.session) {
            navigate('/', { replace: true })
            return
          }
        }

        // If no code or tokens, check if session already exists
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          navigate('/', { replace: true })
          return
        }

        // Nothing worked
        setError('Login failed. Please try again.')
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An unexpected error occurred')
      }
    }

    // Small delay to ensure Supabase client is ready
    const timer = setTimeout(handleAuthCallback, 100)
    return () => clearTimeout(timer)
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
