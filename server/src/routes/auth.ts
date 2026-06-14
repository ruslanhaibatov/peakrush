import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../db'

export const authRouter = Router()

authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' })
  }
  try {
    const existing = await query(
      'SELECT id FROM users WHERE username=$1 OR email=$2',
      [username, email]
    )
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already taken' })
    }
    const hash = await bcrypt.hash(password, 12)
    const [user] = await query<{ id: string }>(
      'INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id',
      [username, email, hash]
    )
    await query(
      'INSERT INTO player_profiles (user_id, display_name) VALUES ($1,$2)',
      [user.id, username]
    )
    const token = jwt.sign(
      { userId: user.id, username },
      process.env.JWT_SECRET || 'peakrush_secret',
      { expiresIn: '7d' }
    )
    res.status(201).json({ token, userId: user.id, username })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }
  try {
    const [user] = await query<{ id: string; username: string; password_hash: string; is_banned: boolean }>(
      'SELECT id, username, password_hash, is_banned FROM users WHERE email=$1',
      [email]
    )
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    if (user.is_banned) return res.status(403).json({ error: 'Account suspended' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    await query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id])

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'peakrush_secret',
      { expiresIn: '7d' }
    )
    res.json({ token, userId: user.id, username: user.username })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login failed' })
  }
})
