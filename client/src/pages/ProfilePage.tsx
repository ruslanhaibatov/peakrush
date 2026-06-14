import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import type { PlayerProfile, Achievement } from '../types'
import { useAuthStore } from '../hooks/useAuthStore'
import styles from './ProfilePage.module.css'

const RARITY_COLORS: Record<string, string> = {
  common: '#aaa', rare: '#00c8ff', epic: '#a855f7', legendary: '#ffd700',
}
const RARITY_ICONS: Record<string, string> = {
  common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡',
}

const SPORT_ICONS: Record<string, string> = {
  snowboard: '🏂', ski: '⛷️', wingsuit: '🦅', paraglider: '🪂',
}

export default function ProfilePage() {
  const { userId } = useParams()
  const { userId: myId, profile: myProfile } = useAuthStore()
  const targetId = userId || myId

  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [username, setUsername] = useState('')
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (!userId || userId === myId) {
          const r = await axios.get('/api/profile/me')
          setProfile(r.data)
          setUsername(r.data.username || '')
        } else {
          const r = await axios.get(`/api/profile/${userId}`)
          setProfile(r.data)
          setUsername(r.data.username || '')
        }
        const ra = await axios.get('/api/achievements/me')
        setAchievements(ra.data)
      } catch { /* ignore */ }
      setLoading(false)
    }
    if (targetId) load()
  }, [targetId, userId, myId])

  const isOwn = !userId || userId === myId
  const p = profile || myProfile

  if (loading) return <div className={styles.loading}><span className="animate-spin">⟳</span></div>
  if (!p) return <div className={styles.loading}>Player not found</div>

  const xpProgress = ((p.xp % 1000) / 1000) * 100
  const unlocked = achievements.filter(a => a.unlocked_at)
  const locked   = achievements.filter(a => !a.unlocked_at)

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{(username || 'R')[0].toUpperCase()}</div>
          <div className={styles.levelBadge}>Lv {p.level}</div>
        </div>
        <div className={styles.heroInfo}>
          <h1 className={`font-title ${styles.name}`}>{username || 'Rider'}</h1>
          <div className={styles.sport}>
            {SPORT_ICONS[p.fav_sport]} Favourite: <strong style={{ textTransform: 'capitalize' }}>{p.fav_sport}</strong>
          </div>
          <div className={styles.xpRow}>
            <div className={styles.xpBar}>
              <div className={styles.xpFill} style={{ width: `${xpProgress}%` }} />
            </div>
            <span className={styles.xpText}>{p.xp.toLocaleString()} XP · {1000 - (p.xp % 1000)} to next level</span>
          </div>
          <div className={styles.coins}>
            <span>💰 {p.coins} Coins</span>
            <span>💎 {p.premium_coins} Premium</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        {[
          { icon: '🏎️', label: 'Top Speed',     value: `${p.highest_speed.toFixed(0)} km/h` },
          { icon: '📏', label: 'Distance',       value: `${p.total_distance.toFixed(1)} km` },
          { icon: '🌀', label: 'Tricks Landed',  value: p.total_tricks },
          { icon: '✈️', label: 'Airtime',        value: `${(p.total_airtime / 60).toFixed(1)} min` },
          { icon: '⬇️', label: 'Highest Drop',  value: `${p.highest_drop.toFixed(0)} m` },
          { icon: '⏳', label: 'Hours Played',  value: `${p.playtime_hours.toFixed(1)} h` },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statIcon}>{s.icon}</span>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={`font-title ${styles.sectionTitle}`}>
            Achievements
            <span className={styles.achCount}>{unlocked.length}/{achievements.length}</span>
          </h2>
        </div>

        {unlocked.length > 0 && (
          <>
            <h4 className={styles.achGroupTitle}>Unlocked</h4>
            <div className={styles.achGrid}>
              {unlocked.map(a => (
                <div key={a.id} className={`${styles.achCard} ${styles.achUnlocked}`} style={{ borderColor: RARITY_COLORS[a.rarity] }}>
                  <span className={styles.achIcon}>{RARITY_ICONS[a.rarity]}</span>
                  <div>
                    <div className={styles.achName} style={{ color: RARITY_COLORS[a.rarity] }}>{a.name}</div>
                    <div className={styles.achDesc}>{a.description}</div>
                    <div className={styles.achXp}>+{a.xp_reward} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {locked.length > 0 && (
          <>
            <h4 className={styles.achGroupTitle} style={{ marginTop: '1.5rem' }}>Locked</h4>
            <div className={styles.achGrid}>
              {locked.map(a => (
                <div key={a.id} className={`${styles.achCard} ${styles.achLocked}`}>
                  <span className={styles.achIcon} style={{ filter: 'grayscale(1) opacity(0.4)' }}>🔒</span>
                  <div>
                    <div className={styles.achName} style={{ color: 'var(--c-muted)' }}>{a.name}</div>
                    <div className={styles.achDesc}>{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
