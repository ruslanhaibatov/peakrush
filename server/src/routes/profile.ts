import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { query } from '../db'

export const profileRouter = Router()
profileRouter.use(authMiddleware)

profileRouter.get('/me', async (req: AuthRequest, res: Response) => {
  const [profile] = await query(
    `SELECT u.username, u.email, u.avatar_url, u.country_code, u.created_at,
            pp.*
     FROM users u
     JOIN player_profiles pp ON pp.user_id = u.id
     WHERE u.id = $1`,
    [req.userId]
  )
  if (!profile) return res.status(404).json({ error: 'Profile not found' })
  res.json(profile)
})

profileRouter.get('/:userId', async (req: AuthRequest, res: Response) => {
  const [profile] = await query(
    `SELECT u.username, u.avatar_url, u.country_code,
            pp.level, pp.xp, pp.fav_sport, pp.highest_speed,
            pp.total_distance, pp.total_airtime, pp.total_tricks, pp.playtime_hours
     FROM users u
     JOIN player_profiles pp ON pp.user_id = u.id
     WHERE u.id = $1 AND u.is_banned = FALSE`,
    [req.params.userId]
  )
  if (!profile) return res.status(404).json({ error: 'Player not found' })
  res.json(profile)
})

profileRouter.patch('/me', async (req: AuthRequest, res: Response) => {
  const { display_name, fav_sport, country_code } = req.body
  await query(
    `UPDATE player_profiles SET display_name=COALESCE($1,display_name),
     fav_sport=COALESCE($2,fav_sport), updated_at=NOW() WHERE user_id=$3`,
    [display_name, fav_sport, req.userId]
  )
  if (country_code) {
    await query('UPDATE users SET country_code=$1 WHERE id=$2', [country_code, req.userId])
  }
  res.json({ ok: true })
})

profileRouter.post('/me/stat', async (req: AuthRequest, res: Response) => {
  const { speed, distance, airtime, tricks } = req.body
  await query(
    `UPDATE player_profiles SET
       highest_speed  = GREATEST(highest_speed, COALESCE($1,0)),
       total_distance = total_distance + COALESCE($2,0),
       total_airtime  = total_airtime  + COALESCE($3,0),
       total_tricks   = total_tricks   + COALESCE($4,0),
       updated_at = NOW()
     WHERE user_id=$5`,
    [speed, distance, airtime, tricks, req.userId]
  )
  res.json({ ok: true })
})
