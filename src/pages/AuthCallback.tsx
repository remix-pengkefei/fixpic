import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))

        console.log('Auth callback - URL:', window.location.href)
        console.log('Auth callback - search params:', window.location.search)
        console.log('Auth callback - hash:', window.location.hash)

        // Check for error in URL
        const errorParam = params.get('error') || hashParams.get('error')
        const errorDescription = params.get('error_description') || hashParams.get('error_description')

        if (errorParam) {
          console.error('Auth error:', errorParam, errorDescription)
          setError(errorDescription || errorParam)
          return
        }

        // Method 1: Handle PKCE code (if present in query params)
        const code = params.get('code')
        if (code) {
          console.log('Found code in URL, exchanging...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Code exchange failed:', exchangeError.message)
            // Don't return error yet, try other methods
          } else if (data.session) {
            console.log('Code exchange successful!')
            navigate('/', { replace: true })
            return
          }
        }

        // Method 2: Handle implicit flow tokens (if present in hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        if (accessToken) {
          console.log('Found access_token in hash, setting session...')
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })
          if (sessionError) {
            console.error('Set session failed:', sessionError.message)
          } else if (data.session) {
            console.log('Session set successfully!')
            navigate('/', { replace: true })
            return
          }
        }

        // Method 3: Check if session was auto-detected by Supabase
        console.log('Checking for existing session...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('Session found!')
          navigate('/', { replace: true })
          return
        }

        // Nothing worked
        console.error('All auth methods failed')
        setError('Login failed. Please try again.')
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An unexpected error occurred')
      }
    }

    handleAuth()
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
