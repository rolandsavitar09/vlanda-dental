import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { ApiError } from './error.js'

type TokenPayload = {
  userId: string
  role: string
}

export type AuthedRequest = Request & {
  user?: TokenPayload
}

export const requireAuth = async (req: AuthedRequest, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    next(new ApiError(401, 'Token login diperlukan'))
    return
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    })

    if (!user || user.role !== payload.role) {
      next(new ApiError(401, 'Token login tidak valid'))
      return
    }

    req.user = payload
    next()
  } catch {
    next(new ApiError(401, 'Token login tidak valid'))
  }
}

export const requireAdmin = (req: AuthedRequest, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'DOCTOR') {
    next(new ApiError(403, 'Akses admin diperlukan'))
    return
  }

  next()
}
