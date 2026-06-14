import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { query } from '../db'

export const challengesRouter = Router()
challengesRouter.use(authMiddleware)

challengesRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { region, sport, type } = req.query
  let sql = `SELECT c.*, r.name AS region_name, s.name AS sport_name
             FROM challenges c
             JOIN regions r ON r.id = c.region_id
             JOIN sports s ON s.id = c.sport_id
             WHERE 1=1`
  const params: unknown[] = []
  if (region) { params.push(region); sql += ` AND c.region_id=$${params.length}` }
  if (sport)  { params.push(sport);  sql += ` AND c.sport_id=$${params.length}` }
  if (type)   { params.push(type);   sql += ` AND c.type=$${params.length}` }
  sql += ' ORDER BY c.difficulty, c.name'
  const rows = await query(sql, params)
  res.json(rows)
})

challengesRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const [challenge] = await query(
    `SELECT c.*, r.name AS region_name, s.name AS sport_name
     FROM challenges c
     JOIN regions r ON r.id = c.region_id
     JOIN sports s ON s.id = c.sport_id
     WHERE c.id=$1`,
    [req.params.id]
  )
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' })
  res.json(challenge)
})

challengesRouter.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  const { score, time_ms, medal } = req.body
  const challengeId = req.params.id

  const [existing] = await query<{ score: number }>(
    'SELECT score FROM player_challenge_records WHERE user_id=$1 AND challenge_id=$2',
    [req.userId, challengeId]
  )

  if (existing) {
    if (score > existing.score) {
      await query(
        `UPDATE player_challenge_records SET score=$1, time_ms=$2, medal=$3,
         attempts=attempts+1, achieved_at=NOW() WHERE user_id=$4 AND challenge_id=$5`,
        [score, time_ms, medal, req.userId, challengeId]
      )
    } else {
      await query(
        'UPDATE player_challenge_records SET attempts=attempts+1 WHERE user_id=$1 AND challenge_id=$2',
        [req.userId, challengeId]
      )
    }
  } else {
    await query(
      `INSERT INTO player_challenge_records (user_id, challenge_id, medal, score, time_ms)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.userId, challengeId, medal, score, time_ms]
    )
    const [ch] = await query<{ xp_reward: number; coin_reward: number }>(
      'SELECT xp_reward, coin_reward FROM challenges WHERE id=$1',
      [challengeId]
    )
    if (ch) {
      await query(
        `UPDATE player_profiles SET xp=xp+$1, coins=coins+$2, updated_at=NOW() WHERE user_id=$3`,
        [ch.xp_reward, ch.coin_reward, req.userId]
      )
    }
  }

  // Upsert leaderboard
  await query(
    `INSERT INTO leaderboard_entries (challenge_id, user_id, score, time_ms)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (challenge_id, user_id)
     DO UPDATE SET score=GREATEST(leaderboard_entries.score, $3),
                   time_ms=CASE WHEN $3 > leaderboard_entries.score THEN $4 ELSE leaderboard_entries.time_ms END,
                   created_at=NOW()`,
    [challengeId, req.userId, score, time_ms]
  )

  res.json({ ok: true })
})

challengesRouter.get('/daily/today', async (_req, res: Response) => {
  const [daily] = await query(
    `SELECT dc.*, c.name, c.description, c.type, r.name AS region_name, s.name AS sport_name
     FROM daily_challenges dc
     JOIN challenges c ON c.id = dc.challenge_id
     JOIN regions r ON r.id = c.region_id
     JOIN sports s ON s.id = c.sport_id
     WHERE dc.date = CURRENT_DATE`
  )
  res.json(daily || null)
})
