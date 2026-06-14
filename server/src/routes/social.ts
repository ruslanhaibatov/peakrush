import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { query } from '../db'

export const socialRouter = Router()
socialRouter.use(authMiddleware)

// Feed
socialRouter.get('/feed', async (req: AuthRequest, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string || '20'), 50)
  const rows = await query(
    `SELECT h.*, u.username, u.avatar_url, s.name AS sport_name, r.name AS region_name
     FROM highlights h
     JOIN users u ON u.id = h.user_id
     LEFT JOIN sports s ON s.id = h.sport_id
     LEFT JOIN regions r ON r.id = h.region_id
     WHERE h.is_public = TRUE
     ORDER BY h.created_at DESC LIMIT $1`,
    [limit]
  )
  res.json(rows)
})

// Post highlight
socialRouter.post('/highlight', async (req: AuthRequest, res: Response) => {
  const { title, description, sport_id, region_id, replay_id, clip_url } = req.body
  const [row] = await query<{ id: string }>(
    `INSERT INTO highlights (user_id, title, description, sport_id, region_id, replay_id, clip_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [req.userId, title, description, sport_id, region_id, replay_id, clip_url]
  )
  res.status(201).json({ id: row.id })
})

// Like
socialRouter.post('/highlight/:id/like', async (req: AuthRequest, res: Response) => {
  await query('UPDATE highlights SET likes=likes+1 WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

// Friends
socialRouter.get('/friends', async (req: AuthRequest, res: Response) => {
  const rows = await query(
    `SELECT u.id, u.username, u.avatar_url, pp.level, pp.fav_sport,
            f.status, f.requester
     FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.requester=$1 THEN f.addressee ELSE f.requester END
     JOIN player_profiles pp ON pp.user_id = u.id
     WHERE (f.requester=$1 OR f.addressee=$1) AND f.status='accepted'`,
    [req.userId]
  )
  res.json(rows)
})

socialRouter.post('/friends/request', async (req: AuthRequest, res: Response) => {
  const { targetUserId } = req.body
  const [existing] = await query(
    `SELECT id FROM friendships WHERE (requester=$1 AND addressee=$2) OR (requester=$2 AND addressee=$1)`,
    [req.userId, targetUserId]
  )
  if (existing) return res.status(409).json({ error: 'Friendship already exists' })
  await query(
    `INSERT INTO friendships (requester, addressee, status) VALUES ($1,$2,'pending')`,
    [req.userId, targetUserId]
  )
  res.status(201).json({ ok: true })
})

socialRouter.patch('/friends/:friendshipId/accept', async (req: AuthRequest, res: Response) => {
  await query(
    `UPDATE friendships SET status='accepted' WHERE id=$1 AND addressee=$2`,
    [req.params.friendshipId, req.userId]
  )
  res.json({ ok: true })
})
