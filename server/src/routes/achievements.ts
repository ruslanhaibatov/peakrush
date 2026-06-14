import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { query } from '../db'

export const achievementsRouter = Router()
achievementsRouter.use(authMiddleware)

achievementsRouter.get('/', async (_req, res: Response) => {
  const rows = await query('SELECT * FROM achievements ORDER BY rarity, name')
  res.json(rows)
})

achievementsRouter.get('/me', async (req: AuthRequest, res: Response) => {
  const rows = await query(
    `SELECT a.*, pa.unlocked_at
     FROM achievements a
     LEFT JOIN player_achievements pa ON pa.achievement_id=a.id AND pa.user_id=$1
     ORDER BY pa.unlocked_at DESC NULLS LAST, a.name`,
    [req.userId]
  )
  res.json(rows)
})

achievementsRouter.post('/unlock', async (req: AuthRequest, res: Response) => {
  const { code } = req.body
  const [ach] = await query<{ id: number; xp_reward: number }>(
    'SELECT id, xp_reward FROM achievements WHERE code=$1', [code]
  )
  if (!ach) return res.status(404).json({ error: 'Achievement not found' })

  const [existing] = await query(
    'SELECT id FROM player_achievements WHERE user_id=$1 AND achievement_id=$2',
    [req.userId, ach.id]
  )
  if (existing) return res.json({ already_unlocked: true })

  await query(
    'INSERT INTO player_achievements (user_id, achievement_id) VALUES ($1,$2)',
    [req.userId, ach.id]
  )
  await query(
    'UPDATE player_profiles SET xp=xp+$1, updated_at=NOW() WHERE user_id=$2',
    [ach.xp_reward, req.userId]
  )
  res.status(201).json({ unlocked: true, xp_gained: ach.xp_reward })
})
