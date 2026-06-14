import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { query } from '../db'

export const regionsRouter = Router()
regionsRouter.use(authMiddleware)

regionsRouter.get('/', async (_req, res: Response) => {
  const rows = await query(`SELECT * FROM regions ORDER BY unlock_level`)
  res.json(rows)
})

regionsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const [region] = await query('SELECT * FROM regions WHERE id=$1', [req.params.id])
  if (!region) return res.status(404).json({ error: 'Region not found' })

  const weather = await query(
    `SELECT * FROM weather_log WHERE region_id=$1 AND ended_at IS NULL LIMIT 1`,
    [req.params.id]
  )
  const challenges = await query(
    `SELECT c.id, c.name, c.type, c.difficulty, s.name AS sport_name
     FROM challenges c JOIN sports s ON s.id=c.sport_id
     WHERE c.region_id=$1`,
    [req.params.id]
  )
  res.json({ ...region, current_weather: weather[0] || null, challenges })
})
