import { Router } from 'express'
import fs from 'node:fs'
import multer from 'multer'
import path from 'node:path'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { ApiError } from '../middleware/error.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getParam } from '../utils/request.js'

export const servicesRouter = Router()

fs.mkdirSync('uploads/service-categories', { recursive: true })

const storage = multer.diskStorage({
  destination: 'uploads/service-categories',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${file.fieldname}${ext}`)
  },
})

const upload = multer({ storage })

servicesRouter.get(
  '/admin',
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const categories = await prisma.serviceCategory.findMany({
      include: { services: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
      orderBy: { sortOrder: 'asc' },
    })

    res.json(categories)
  }),
)

servicesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.serviceCategory.findMany({
      include: { services: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
      orderBy: { sortOrder: 'asc' },
    })

    res.json(categories)
  }),
)

servicesRouter.post(
  '/categories',
  requireAuth,
  requireAdmin,
  upload.single('icon'),
  asyncHandler(async (req, res) => {
    const { name, iconKey } = req.body

    if (!name) {
      throw new ApiError(400, 'Nama kategori wajib diisi')
    }

    const lastCategory = await prisma.serviceCategory.findFirst({
      orderBy: { sortOrder: 'desc' },
    })
    const category = await prisma.serviceCategory.create({
      data: {
        name,
        iconKey: req.file ? `/uploads/service-categories/${req.file.filename}` : iconKey || 'tooth',
        sortOrder: (lastCategory?.sortOrder ?? 0) + 1,
      },
      include: { services: true },
    })

    res.status(201).json(category)
  }),
)

servicesRouter.put(
  '/categories/:id',
  requireAuth,
  requireAdmin,
  upload.single('icon'),
  asyncHandler(async (req, res) => {
    const { name, iconKey, sortOrder } = req.body
    const category = await prisma.serviceCategory.update({
      where: { id: getParam(req.params.id, 'id') },
      data: {
        ...(name ? { name } : {}),
        ...(iconKey ? { iconKey } : {}),
        ...(req.file ? { iconKey: `/uploads/service-categories/${req.file.filename}` } : {}),
        ...(sortOrder === undefined ? {} : { sortOrder: Number(sortOrder) }),
      },
      include: { services: true },
    })

    res.json(category)
  }),
)

servicesRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { categoryId, title, description, estimatedDuration, price, isActive } = req.body

    if (!categoryId || !title || !description || !estimatedDuration) {
      throw new ApiError(400, 'Kategori, judul, deskripsi, dan estimasi durasi wajib diisi')
    }

    const lastService = await prisma.service.findFirst({
      orderBy: { sortOrder: 'desc' },
      where: { categoryId },
    })
    const service = await prisma.service.create({
      data: {
        categoryId,
        title,
        description,
        estimatedDuration,
        price,
        isActive: isActive ?? true,
        sortOrder: (lastService?.sortOrder ?? 0) + 1,
      },
      include: { category: true },
    })

    res.status(201).json(service)
  }),
)

servicesRouter.put(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { categoryId, title, description, estimatedDuration, price, isActive } = req.body
    const service = await prisma.service.update({
      where: { id: getParam(req.params.id, 'id') },
      data: {
        ...(categoryId ? { categoryId } : {}),
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(estimatedDuration ? { estimatedDuration } : {}),
        ...(price === undefined ? {} : { price }),
        ...(isActive === undefined ? {} : { isActive }),
      },
      include: { category: true },
    })

    res.json(service)
  }),
)

servicesRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.service.delete({
      where: { id: getParam(req.params.id, 'id') },
    })

    res.status(204).send()
  }),
)
