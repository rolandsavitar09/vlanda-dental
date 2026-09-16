import type { NextFunction, Request, Response } from 'express'

export class ApiError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route tidak ditemukan: ${req.method} ${req.path}`))
}

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500

  res.status(statusCode).json({
    message: error.message || 'Terjadi kesalahan server',
  })
}
