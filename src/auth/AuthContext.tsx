import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type PortalUser = {
  email: string
  username: string
  picture?: string
  role: 'admin' | 'reader'
  expiresAt: number
}

type AuthContextValue = {
  user: PortalUser | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'same-origin' })
      const result = await response.json()
      setUser(response.ok && result.success ? result.data as PortalUser : null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    })
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth precisa ser usado dentro de AuthProvider.')
  return value
}
