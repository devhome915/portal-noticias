import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import adminRoutes from './routes/adminRoutes.js'
import publicRoutes from './routes/publicRoutes.js'

export const app = express()

app.use(cors({ origin: env.frontendUrl, credentials: true }))
app.use(helmet())
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))
app.disable('x-powered-by')

app.use('/api', publicRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFoundHandler)
app.use(errorHandler)
