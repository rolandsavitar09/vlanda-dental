import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { ApiError } from '../middleware/error.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const authRouter = Router()

const createToken = (userId: string, role: string) =>
  jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: '7d' })

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body

    if (!name || !email || !password) {
      throw new ApiError(400, 'Nama, email, dan password wajib diisi')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, phone: true, role: true },
    })

    res.status(201).json({ user, token: createToken(user.id, user.role) })
  }),
)

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false

    if (!user || !isValid) {
      throw new ApiError(401, 'Email atau password salah')
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token: createToken(user.id, user.role),
    })
  }),
)

authRouter.post(
  '/admin/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false

    if (!user || !isValid || (user.role !== 'ADMIN' && user.role !== 'DOCTOR')) {
      throw new ApiError(401, 'Akses admin tidak valid')
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token: createToken(user.id, user.role),
    })
  }),
)
