import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function LoginSuccessToast() {
  const location = useLocation()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('login') !== 'success') return

    setVisible(true)
    params.delete('login')
    const query = params.toString()
    navigate(`${location.pathname}${query ? `?${query}` : ''}${location.hash}`, { replace: true })
  }, [location.hash, location.pathname, location.search, navigate])

  useEffect(() => {
    if (!visible) return
    const timeoutId = window.setTimeout(() => setVisible(false), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [visible])

  if (!visible) return null

  return (
    <div className="login-success-toast" role="status">
      <span>Você entrou no portal e já pode reagir e comentar.</span>
      <span className="login-success-progress" aria-hidden="true" />
    </div>
  )
}
