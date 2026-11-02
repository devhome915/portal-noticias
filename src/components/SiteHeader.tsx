import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getDisplayName, getUserInitials } from '../auth/userDisplay'
import type { NewsCategory } from '../types/news'

function UserAvatar({ picture, name }: { picture?: string; name: string }) {
  const [imageFailed, setImageFailed] = useState(false)
  if (!picture || imageFailed) {
    return <span className="auth-avatar auth-avatar-initials" aria-hidden="true">{getUserInitials(name)}</span>
  }
  return <img className="auth-avatar" src={picture} alt="" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
}

export function SiteHeader({ categories }: { categories: NewsCategory[] }) {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Portal de Notícias">
        <span className="brand-mark">P</span>
        <div>
          <strong>Portal</strong>
          <span>de Notícias</span>
        </div>
      </Link>

      <nav aria-label="Menu principal" className="main-nav">
        <Link to="/">Home</Link>
        {categories.map((category) => (
          <Link key={category.id} to={`/categorias/${category.slug}`}>
            {category.name}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        {loading ? <span className="auth-indicator">Verificando acesso...</span> : null}
        {user ? (
          <>
            <span className="auth-profile" title={`${getDisplayName(user.username, user.email)} (${user.email})`}>
              <UserAvatar key={user.picture ?? user.username} picture={user.picture} name={getDisplayName(user.username, user.email)} />
              <span className="auth-indicator">{getDisplayName(user.username, user.email)}</span>
            </span>
            {user.role === 'admin' ? <Link to="/admin/dashboard" className="admin-link">Painel</Link> : null}
            <button type="button" className="admin-link auth-logout" onClick={() => void handleLogout()}>Sair</button>
          </>
        ) : !loading ? (
          <Link to="/admin/login" className="admin-link">Entrar</Link>
        ) : null}
        <button type="button" className="cta-button">
          Assine
        </button>
      </div>
    </header>
  )
}
