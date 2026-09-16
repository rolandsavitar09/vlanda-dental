import { Router } from 'express'
import { articlesRouter } from './articles.routes.js'
import { authRouter } from './auth.routes.js'
import { doctorsRouter } from './doctors.routes.js'
import { reservationsRouter } from './reservations.routes.js'
import { schedulesRouter } from './schedules.routes.js'
import { servicesRouter } from './services.routes.js'
import { usersRouter } from './users.routes.js'

export const apiRoutes = Router()

apiRoutes.use('/auth', authRouter)
apiRoutes.use('/users', usersRouter)
apiRoutes.use('/doctors', doctorsRouter)
apiRoutes.use('/services', servicesRouter)
apiRoutes.use('/schedules', schedulesRouter)
apiRoutes.use('/reservations', reservationsRouter)
apiRoutes.use('/articles', articlesRouter)
