import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { getAdminSession } from '../services/authService.js'

export const AUTH_SESSION_COOKIE = 'portal_session'
export const LEGACY_ADMIN_SESSION_COOKIE = 'portal_admin_session'

export function getAuthTokenFromRequest(req: Request) {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) {
    return undefined
  }

  const cookies = cookieHeader
    .split(';')
    .map((value) => value.trim())
  const cookie = cookies.find((value) => value.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?? cookies.find((value) => value.startsWith(`${LEGACY_ADMIN_SESSION_COOKIE}=`))

  if (!cookie) return undefined
  const cookieName = cookie.startsWith(`${AUTH_SESSION_COOKIE}=`) ? AUTH_SESSION_COOKIE : LEGACY_ADMIN_SESSION_COOKIE
  return cookie.slice(cookieName.length + 1)
}

export const getAdminTokenFromRequest = getAuthTokenFromRequest

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = getAdminTokenFromRequest(req)

  if (!getAdminSession(token)) {
    return res.status(401).json({
      success: false,
      message: 'Sessão de administrador inválida ou expirada.',
    })
  }

  return next()
}

export function requireAdminCsrf(req: Request, res: Response, next: NextFunction) {
  const origin = req.get('origin')
  let requestOrigin: string | undefined

  try {
    requestOrigin = origin ? new URL(origin).origin : undefined
  } catch {
    requestOrigin = undefined
  }

  if (!requestOrigin || requestOrigin !== new URL(env.frontendUrl).origin) {
    return res.status(403).json({
      success: false,
      message: 'Origem da solicitação não autorizada.',
    })
  }

  return next()
}
