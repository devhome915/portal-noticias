import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Portal de Notícias</strong>
        <span>Jornalismo digital com foco em contexto, clareza e cobertura inteligente.</span>
      </div>
      <nav aria-label="Rodapé">
        <Link to="/">Home</Link>
        <Link to="/categorias/games">Games</Link>
        <Link to="/admin/login">Painel</Link>
      </nav>
    </footer>
  )
}
