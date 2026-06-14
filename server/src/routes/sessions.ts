import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { query } from '../db'

export const sessionsRouter = Router()
sessionsRouter.use(authMiddleware)

sessionsRouter.get('/public', async (_req, res: Response) => {
  const rows = await query(
    `SELECT gs.*, r.name AS region_name, u.username AS host_name
     FROM game_sessions gs
     JOIN regions r ON r.id = gs.region_id
     JOIN users u ON u.id = gs.host_user_id
     WHERE gs.is_public=TRUE AND gs.status='waiting' AND gs.password_hash IS NULL
     ORDER BY gs.created_at DESC LIMIT 50`
  )
  res.json(rows)
})

sessionsRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { region_id, challenge_id, session_type, max_players, is_public } = req.body
  const [row] = await query<{ id: string }>(
    `INSERT INTO game_sessions (host_user_id, region_id, challenge_id, session_type, max_players, is_public)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [req.userId, region_id, challenge_id, session_type, max_players || 8, is_public !== false]
  )
  res.status(201).json({ id: row.id })
})

sessionsRouter.post('/:id/join', async (req: AuthRequest, res: Response) => {
  const { sport_id } = req.body
  const [session] = await query<{ max_players: number; current_count: number; status: string }>(
    'SELECT max_players, current_count, status FROM game_sessions WHERE id=$1',
    [req.params.id]
  )
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (session.status !== 'waiting') return res.status(400).json({ error: 'Session not open' })
  if (session.current_count >= session.max_players) return res.status(400).json({ error: 'Session full' })

  await query(
    `INSERT INTO session_participants (session_id, user_id, sport_id) VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING`,
    [req.params.id, req.userId, sport_id]
  )
  await query(
    `UPDATE game_sessions SET current_count=current_count+1 WHERE id=$1`,
    [req.params.id]
  )
  res.json({ ok: true })
})
