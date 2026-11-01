import type { NextFunction, Request, Response } from 'express'

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.',
  })
}

export function errorHandler(
  error: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = error.status ?? 500

  res.status(status).json({
    success: false,
    message: error.message || 'Erro interno do servidor.',
  })
}
