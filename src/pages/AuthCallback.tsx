import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error)
      }

      // Redirect to home page after auth
      navigate('/', { replace: true })
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="auth-callback">
      <div className="spinner"></div>
      <p>Authenticating...</p>
    </div>
  )
}
