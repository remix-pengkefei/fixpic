import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

export function UserMenu() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
            <button onClick={() => { /* TODO: history page */ }}>
              {t('user.history')}
            </button>
            <button onClick={() => { /* TODO: settings page */ }}>
              {t('user.settings')}
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
