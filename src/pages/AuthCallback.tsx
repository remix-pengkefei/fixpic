import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error in URL params
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        if (errorParam) {
          setError(errorDescription || errorParam)
          return
        }

        // Handle PKCE code exchange
        const code = searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Code exchange error:', error)
            setError(error.message)
            return
          }
        }

        // Check for hash tokens (legacy magic link format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        if (accessToken) {
          // Session should be automatically set by Supabase client
          await supabase.auth.getSession()
        }

        // Get the current session to confirm login
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          // Successfully logged in, redirect to home
          navigate('/', { replace: true })
        } else if (!error) {
          // No session and no error, something went wrong
          setError('Login failed. Please try again.')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An unexpected error occurred')
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

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
