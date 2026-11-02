import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { getAdminSession } from '../services/authService.js'

export const ADMIN_SESSION_COOKIE = 'portal_admin_session'

export function getAdminTokenFromRequest(req: Request) {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) {
    return undefined
  }

  const cookie = cookieHeader
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${ADMIN_SESSION_COOKIE}=`))

  return cookie?.slice(ADMIN_SESSION_COOKIE.length + 1)
}

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
