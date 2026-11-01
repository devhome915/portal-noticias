import crypto from 'node:crypto'

const adminSessions = new Map<string, { username: string; createdAt: number }>()

const getAdminCredentials = () => ({
  username: process.env.ADMIN_USERNAME ?? 'admin',
  password: process.env.ADMIN_PASSWORD ?? 'portal-admin-2026',
})

export function validateAdminCredentials(username: string, password: string) {
  const credentials = getAdminCredentials()
  return username === credentials.username && password === credentials.password
}

export function issueAdminToken(username: string) {
  const token = `portal-admin-${crypto.randomBytes(24).toString('hex')}`
  adminSessions.set(token, { username, createdAt: Date.now() })
  return token
}

export function revokeAdminToken(token: string) {
  adminSessions.delete(token)
}

export function requiresAdminToken(token?: string) {
  if (!token) {
    return false
  }

  return adminSessions.has(token)
}
