import { Link } from 'react-router-dom'
import type { NewsCategory } from '../types/news'

export function SiteHeader({ categories }: { categories: NewsCategory[] }) {
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
        <Link to="/admin/login" className="admin-link">
          Painel
        </Link>
        <button type="button" className="cta-button">
          Assine
        </button>
      </div>
    </header>
  )
}
