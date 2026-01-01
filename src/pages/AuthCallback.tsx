import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for error in URL first
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))

    const errorParam = params.get('error') || hashParams.get('error')
    const errorDescription = params.get('error_description') || hashParams.get('error_description')

    if (errorParam) {
      setError(errorDescription || errorParam)
      return
    }

    // Subscribe to auth state changes
    // Supabase with detectSessionInUrl: true will automatically handle the code exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth callback event:', event)

        if (event === 'SIGNED_IN' && session) {
          // Successfully logged in
          navigate('/', { replace: true })
        }
      }
    )

    // Also check if session already exists (in case event fired before we subscribed)
    const checkSession = async () => {
      // Wait for Supabase to process the URL
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        navigate('/', { replace: true })
      } else {
        // Wait a bit more and check again
        await new Promise(resolve => setTimeout(resolve, 1500))

        const { data: { session: retrySession } } = await supabase.auth.getSession()

        if (retrySession) {
          navigate('/', { replace: true })
        } else {
          setError('Login failed. Please try again.')
        }
      }
    }

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
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
