import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { query } from '../db'

export const leaderboardRouter = Router()
leaderboardRouter.use(authMiddleware)

leaderboardRouter.get('/challenge/:challengeId', async (req: AuthRequest, res: Response) => {
  const limit  = Math.min(parseInt(req.query.limit as string || '50'), 100)
  const offset = parseInt(req.query.offset as string || '0')
  const rows = await query(
    `SELECT * FROM v_leaderboard_full WHERE challenge_id=$1
     ORDER BY rank LIMIT $2 OFFSET $3`,
    [req.params.challengeId, limit, offset]
  )
  res.json(rows)
})

leaderboardRouter.get('/challenge/:challengeId/me', async (req: AuthRequest, res: Response) => {
  const [row] = await query(
    `SELECT * FROM v_leaderboard_full WHERE challenge_id=$1 AND username=(
       SELECT username FROM users WHERE id=$2
     )`,
    [req.params.challengeId, req.userId]
  )
  res.json(row || null)
})

leaderboardRouter.get('/global', async (_req, res: Response) => {
  const rows = await query(
    `SELECT * FROM v_player_stats ORDER BY xp DESC LIMIT 100`
  )
  res.json(rows)
})

leaderboardRouter.get('/friends', async (req: AuthRequest, res: Response) => {
  const rows = await query(
    `SELECT ps.* FROM v_player_stats ps
     WHERE ps.id IN (
       SELECT CASE WHEN f.requester=$1 THEN f.addressee ELSE f.requester END
       FROM friendships f WHERE (f.requester=$1 OR f.addressee=$1) AND f.status='accepted'
     ) OR ps.id=$1
     ORDER BY ps.xp DESC`,
    [req.userId]
  )
  res.json(rows)
})
