import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { languages } from '../i18n'

export function UserMenu() {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Get current language from URL
  const pathParts = location.pathname.split('/').filter(Boolean)
  const validLangCodes = languages.map(l => l.code)
  const urlLang = pathParts[0] && validLangCodes.includes(pathParts[0]) ? pathParts[0] : null
  const currentLang = urlLang || i18n.language || 'en'
  const langLink = (path: string) => `/${currentLang}${path}`

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-menu-btn" onClick={() => setShowMenu(!showMenu)}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="user-avatar" />
        ) : (
          <div className="user-avatar-placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="user-name">{displayName}</span>
        <span className="user-menu-arrow">▼</span>
      </button>

      {showMenu && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <p className="user-menu-email">{user.email}</p>
          </div>
          <div className="user-menu-items">
            <button onClick={() => { setShowMenu(false); navigate(langLink('/history')) }}>
              {t('user.history')}
            </button>
            <hr />
            <button onClick={signOut} className="logout-btn">
              {t('user.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
