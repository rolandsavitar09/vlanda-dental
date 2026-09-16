import { Router } from 'express'
import fs from 'node:fs'
import multer from 'multer'
import path from 'node:path'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { ApiError } from '../middleware/error.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getParam } from '../utils/request.js'

export const doctorsRouter = Router()

fs.mkdirSync('uploads/doctors', { recursive: true })

const storage = multer.diskStorage({
  destination: 'uploads/doctors',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${file.fieldname}${ext}`)
  },
})

const upload = multer({ storage })

doctorsRouter.get(
  '/admin',
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const doctors = await prisma.doctor.findMany({ orderBy: { name: 'asc' } })
    res.json(doctors)
  }),
)

doctorsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const doctors = await prisma.doctor.findMany({
      orderBy: { name: 'asc' },
      where: { isActive: true },
    })
    res.json(doctors)
  }),
)

doctorsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    const { name, role, photoUrl, note, isActive } = req.body

    if (!name) throw new ApiError(400, 'Nama dokter wajib diisi')

    const doctor = await prisma.doctor.create({
      data: {
        name,
        role,
        photoUrl: req.file ? `/uploads/doctors/${req.file.filename}` : photoUrl,
        note,
        isActive: isActive === undefined ? true : isActive === true || isActive === 'true',
      },
    })

    res.status(201).json(doctor)
  }),
)

doctorsRouter.put(
  '/:id',
  requireAuth,
  requireAdmin,
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    const { name, role, photoUrl, note, isActive } = req.body
    const doctor = await prisma.doctor.update({
      where: { id: getParam(req.params.id, 'id') },
      data: {
        ...(name ? { name } : {}),
        ...(role ? { role } : {}),
        ...(photoUrl === undefined ? {} : { photoUrl }),
        ...(req.file ? { photoUrl: `/uploads/doctors/${req.file.filename}` } : {}),
        ...(note === undefined ? {} : { note }),
        ...(isActive === undefined ? {} : { isActive: isActive === true || isActive === 'true' }),
      },
    })

    res.json(doctor)
  }),
)

doctorsRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.doctor.update({
      where: { id: getParam(req.params.id, 'id') },
      data: { isActive: false },
    })

    res.status(204).send()
  }),
)
