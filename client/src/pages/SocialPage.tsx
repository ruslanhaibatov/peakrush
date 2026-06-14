import { useEffect, useState } from 'react'
import axios from 'axios'
import type { Highlight } from '../types'
import styles from './SocialPage.module.css'

const SPORT_ICONS: Record<string, string> = { snowboard: '🏂', ski: '⛷️', wingsuit: '🦅', paraglider: '🪂' }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function SocialPage() {
  const [feed, setFeed]   = useState<Highlight[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<Set<string>>(new Set())

  useEffect(() => {
    axios.get('/api/social/feed?limit=30')
      .then(r => setFeed(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLike = async (id: string) => {
    if (liked.has(id)) return
    await axios.post(`/api/social/highlight/${id}/like`).catch(() => {})
    setLiked(s => new Set([...s, id]))
    setFeed(f => f.map(h => h.id === id ? { ...h, likes: h.likes + 1 } : h))
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`font-title ${styles.title}`}>Community Feed</h1>
        <p className="text-muted">Latest highlights from riders around the world</p>
      </div>

      {loading ? (
        <div className={styles.loading}><span className="animate-spin">⟳</span> Loading…</div>
      ) : feed.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎿</div>
          <p>No highlights yet. Complete a challenge to post one!</p>
        </div>
      ) : (
        <div className={styles.feed}>
          {feed.map(h => (
            <div key={h.id} className={styles.card}>
              {/* Card header */}
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{h.username[0].toUpperCase()}</div>
                <div className={styles.riderInfo}>
                  <strong className={styles.riderName}>{h.username}</strong>
                  <span className={styles.meta}>
                    {h.sport_name && <>{SPORT_ICONS[h.sport_name.toLowerCase()] ?? '🏔'} {h.sport_name}</>}
                    {h.region_name && <> · {h.region_name}</>}
                  </span>
                </div>
                <span className={styles.time}>{timeAgo(h.created_at)}</span>
              </div>

              {/* Clip placeholder */}
              <div className={styles.clip}>
                <div className={styles.clipBg}>
                  <div className={styles.clipOverlay}>
                    <span className={styles.clipPlay}>▶</span>
                    <span className={styles.clipSport}>{h.sport_name}</span>
                  </div>
                  {/* Minimal SVG mountain scene */}
                  <svg viewBox="0 0 500 220" width="100%">
                    <rect width="500" height="220" fill="#040c1a" />
                    <path d="M0 220 L80 100 L160 160 L240 40 L320 140 L400 70 L500 150 L500 220Z" fill="#0d1f35" />
                    <path d="M0 220 L100 150 L200 190 L300 110 L400 180 L500 130 L500 220Z" fill="#0a1828" />
                    <circle cx="420" cy="30" r="18" fill="rgba(255,220,100,0.15)" />
                    <circle cx="420" cy="30" r="10" fill="rgba(255,220,100,0.4)" />
                  </svg>
                </div>
              </div>

              {/* Title & actions */}
              <div className={styles.cardBody}>
                <h3 className={styles.highlightTitle}>{h.title}</h3>
                {h.description && <p className={styles.highlightDesc}>{h.description}</p>}
                <div className={styles.actions}>
                  <button
                    className={`${styles.likeBtn} ${liked.has(h.id) ? styles.liked : ''}`}
                    onClick={() => handleLike(h.id)}>
                    {liked.has(h.id) ? '❤️' : '🤍'} {h.likes}
                  </button>
                  <span className={styles.views}>👁 {h.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
