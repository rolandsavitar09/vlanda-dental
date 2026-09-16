import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { errorHandler, notFound } from './middleware/error.js'
import { apiRoutes } from './routes/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const app = express()

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://vlanda-dental.vercel.app',
      'https://vlanda-dental-admin.vercel.app',
    ],
  }),
)
app.use(express.json())
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', apiRoutes)
app.use(notFound)
app.use(errorHandler)
