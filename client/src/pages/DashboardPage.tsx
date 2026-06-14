import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../hooks/useAuthStore'
import type { Highlight, GameSession, Achievement } from '../types'
import styles from './DashboardPage.module.css'

const XP_PER_LEVEL = 1000

function xpToNextLevel(xp: number) {
  return XP_PER_LEVEL - (xp % XP_PER_LEVEL)
}

export default function DashboardPage() {
  const { profile, username } = useAuthStore()
  const navigate = useNavigate()
  const [feed, setFeed]     = useState<Highlight[]>([])
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [recent, setRecent] = useState<Achievement[]>([])

  useEffect(() => {
    axios.get('/api/social/feed?limit=4').then(r => setFeed(r.data)).catch(() => {})
    axios.get('/api/sessions/public').then(r => setSessions(r.data.slice(0,4))).catch(() => {})
    axios.get('/api/achievements/me').then(r => setRecent(r.data.filter((a: Achievement) => a.unlocked_at).slice(0,3))).catch(() => {})
  }, [])

  if (!profile) return <div className={styles.loading}><span className="animate-spin">⟳</span> Loading…</div>

  const xpProgress = ((profile.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={`${styles.welcome} font-title`}>Welcome back, {username}</h1>
          <p className={styles.subtitle}>The mountain is ready. Are you?</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/world')}>
          🗺️ Open World Map
        </button>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        {[
          { icon: '⚡', label: 'Level',         value: profile.level,                        unit: '' },
          { icon: '🏎️', label: 'Top Speed',     value: profile.highest_speed.toFixed(0),      unit: ' km/h' },
          { icon: '📏', label: 'Distance',       value: profile.total_distance.toFixed(1),     unit: ' km' },
          { icon: '🌀', label: 'Tricks Landed',  value: profile.total_tricks,                  unit: '' },
          { icon: '⏱️', label: 'Airtime',        value: (profile.total_airtime / 60).toFixed(1), unit: ' min' },
          { icon: '⏳', label: 'Play Time',      value: profile.playtime_hours.toFixed(1),     unit: ' h' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statIcon}>{s.icon}</span>
            <span className={styles.statValue}>{s.value}{s.unit}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* XP bar */}
      <div className={`card ${styles.xpCard}`}>
        <div className={styles.xpHeader}>
          <span>Level {profile.level}</span>
          <span className="text-muted">{xpToNextLevel(profile.xp)} XP to Level {profile.level + 1}</span>
        </div>
        <div className={styles.xpTrack}>
          <div className={styles.xpFill} style={{ width: `${xpProgress}%` }} />
        </div>
        <div className={styles.xpCoins}>
          <span>💰 {profile.coins} Coins</span>
          <span>💎 {profile.premium_coins} Premium</span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Social Feed */}
        <div className="card">
          <div className={styles.cardHeader}>
            <h3>🎿 Latest Highlights</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/social')}>See All</button>
          </div>
          {feed.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>No highlights yet. Be the first!</p>
          ) : feed.map(h => (
            <div key={h.id} className={styles.feedItem}>
              <div className={styles.feedAvatar}>{h.username[0].toUpperCase()}</div>
              <div className={styles.feedContent}>
                <strong>{h.username}</strong>
                <span className="text-muted"> · {h.sport_name} · {h.region_name}</span>
                <p className={styles.feedTitle}>{h.title}</p>
              </div>
              <span className={styles.feedLikes}>❤️ {h.likes}</span>
            </div>
          ))}
        </div>

        {/* Sessions */}
        <div className="card">
          <div className={styles.cardHeader}>
            <h3>🤝 Open Sessions</h3>
            <button className="btn btn-secondary" onClick={() => navigate('/world')}>Join</button>
          </div>
          {sessions.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>No open sessions. Create one!</p>
          ) : sessions.map(s => (
            <div key={s.id} className={styles.sessionItem}>
              <div>
                <span className={styles.sessionType}>{s.session_type}</span>
                <span className={styles.sessionRegion}>{s.region_name}</span>
              </div>
              <div className={styles.sessionMeta}>
                <span>{s.host_name}</span>
                <span className={styles.sessionPlayers}>{s.current_count}/{s.max_players} 👥</span>
              </div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="card">
          <div className={styles.cardHeader}>
            <h3>🏅 Recent Achievements</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/profile')}>All</button>
          </div>
          {recent.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>No achievements yet. Keep riding!</p>
          ) : recent.map(a => (
            <div key={a.id} className={styles.achItem}>
              <span className={`${styles.achRarity} rarity-${a.rarity}`}>{rarityIcon(a.rarity)}</span>
              <div>
                <strong>{a.name}</strong>
                <p className={styles.achDesc}>{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function rarityIcon(r: string) {
  return { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡' }[r] || '⚪'
}
