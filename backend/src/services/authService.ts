import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'

const SESSION_TTL_MS = 8 * 60 * 60 * 1000
const adminSessions = new Map<string, { username: string; expiresAt: number }>()

type AdminPasswordHash = {
  salt: Buffer
  hash: Buffer
}

function getAdminPasswordHash(): AdminPasswordHash | null {
  const encoded = env.adminPasswordHash
  if (!encoded) {
    return null
  }

  const match = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/i.exec(encoded)
  if (!match) {
    return null
  }

  return {
    salt: Buffer.from(match[1], 'hex'),
    hash: Buffer.from(match[2], 'hex'),
  }
}

export function hashAdminPassword(password: string, salt = randomBytes(16)) {
  const hash = scryptSync(password, salt, 64)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function isAdminAuthConfigured() {
  return Boolean(env.adminUsername?.trim() && getAdminPasswordHash())
}

export function validateAdminCredentials(username: string, password: string) {
  const configuredUsername = env.adminUsername?.trim()
  const passwordHash = getAdminPasswordHash()

  if (!configuredUsername || !passwordHash) {
    return false
  }

  const suppliedUsername = Buffer.from(username)
  const expectedUsername = Buffer.from(configuredUsername)
  const usernameMatches =
    suppliedUsername.length === expectedUsername.length &&
    timingSafeEqual(suppliedUsername, expectedUsername)

  const suppliedPasswordHash = scryptSync(password, passwordHash.salt, passwordHash.hash.length)
  const passwordMatches = timingSafeEqual(suppliedPasswordHash, passwordHash.hash)

  return usernameMatches && passwordMatches
}

export function issueAdminToken(username: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + SESSION_TTL_MS
  adminSessions.set(token, { username, expiresAt })
  return { token, expiresAt }
}

export function revokeAdminToken(token: string) {
  adminSessions.delete(token)
}

export function getAdminSession(token?: string) {
  if (!token) {
    return null
  }

  const session = adminSessions.get(token)
  if (!session) {
    return null
  }

  if (session.expiresAt <= Date.now()) {
    adminSessions.delete(token)
    return null
  }

  return session
}

export function requiresAdminToken(token?: string) {
  return Boolean(getAdminSession(token))
}
