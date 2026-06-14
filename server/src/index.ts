import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

import { authRouter } from './routes/auth'
import { profileRouter } from './routes/profile'
import { challengesRouter } from './routes/challenges'
import { leaderboardRouter } from './routes/leaderboard'
import { regionsRouter } from './routes/regions'
import { socialRouter } from './routes/social'
import { sessionsRouter } from './routes/sessions'
import { achievementsRouter } from './routes/achievements'
import { initSocketHandlers } from './socket/handlers'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }))
app.use(compression())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please slow down.' },
})
app.use('/api', limiter)

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRouter)
app.use('/api/profile',      profileRouter)
app.use('/api/challenges',   challengesRouter)
app.use('/api/leaderboard',  leaderboardRouter)
app.use('/api/regions',      regionsRouter)
app.use('/api/social',       socialRouter)
app.use('/api/sessions',     sessionsRouter)
app.use('/api/achievements', achievementsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'PeakRush API' })
})

// ─── Socket handlers ──────────────────────────────────────────────────────────
initSocketHandlers(io)

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`🏔️  PeakRush API running on http://localhost:${PORT}`)
})
