import type { NextFunction, Request, Response } from 'express'
import { requiresAdminToken } from '../services/authService.js'

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (!requiresAdminToken(token)) {
    return res.status(401).json({
      success: false,
      message: 'Sessão de administrador inválida ou expirada.',
    })
  }

  return next()
}
