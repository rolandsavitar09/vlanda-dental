import { Router } from 'express'
import fs from 'node:fs'
import multer from 'multer'
import path from 'node:path'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { ApiError } from '../middleware/error.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getParam } from '../utils/request.js'

export const articlesRouter = Router()

fs.mkdirSync('uploads/articles', { recursive: true })

const storage = multer.diskStorage({
  destination: 'uploads/articles',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${file.fieldname}${ext}`)
  },
})

const upload = multer({ storage })

const createSlug = (title: string) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const createUniqueSlug = async (title: string, ignoredId?: string) => {
  const baseSlug = createSlug(title)
  let slug = baseSlug
  let counter = 2

  while (
    await prisma.article.findFirst({
      where: {
        slug,
        ...(ignoredId ? { id: { not: ignoredId } } : {}),
      },
    })
  ) {
    slug = `${baseSlug}-${counter}`
    counter += 1
  }

  return slug
}

articlesRouter.get(
  '/admin',
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const articles = await prisma.article.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })

    res.json(articles)
  }),
)

articlesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })

    res.json(articles)
  }),
)

articlesRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { title, excerpt, content, category, isPublished } = req.body

    if (!title || !excerpt || !content || !category) {
      throw new ApiError(400, 'Judul, ringkasan, isi, dan kategori wajib diisi')
    }

    const shouldPublish = isPublished === 'true' || isPublished === true
    const article = await prisma.article.create({
      data: {
        authorId: req.user?.userId,
        title,
        slug: await createUniqueSlug(title),
        excerpt,
        content,
        category,
        imageUrl: req.file ? `/uploads/articles/${req.file.filename}` : undefined,
        isPublished: shouldPublish,
        publishedAt: shouldPublish ? new Date() : undefined,
      },
    })

    res.status(201).json(article)
  }),
)

articlesRouter.put(
  '/:id',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const { title, isPublished, ...payload } = req.body
    const shouldPublish = isPublished === undefined ? undefined : isPublished === 'true' || isPublished === true

    const article = await prisma.article.update({
      where: { id: getParam(req.params.id, 'id') },
      data: {
        ...payload,
        ...(title ? { title, slug: await createUniqueSlug(title, getParam(req.params.id, 'id')) } : {}),
        ...(req.file ? { imageUrl: `/uploads/articles/${req.file.filename}` } : {}),
        ...(shouldPublish === undefined
          ? {}
          : { isPublished: shouldPublish, publishedAt: shouldPublish ? new Date() : null }),
      },
    })

    res.json(article)
  }),
)

articlesRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.article.delete({
      where: { id: getParam(req.params.id, 'id') },
    })

    res.status(204).send()
  }),
)
