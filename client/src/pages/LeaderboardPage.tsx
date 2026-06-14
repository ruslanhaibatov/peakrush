import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import type { LeaderboardEntry } from '../types'
import { useAuthStore } from '../hooks/useAuthStore'
import styles from './LeaderboardPage.module.css'

type Tab = 'global' | 'friends' | 'challenge'

const SPORT_ICONS: Record<string, string> = { snowboard: '🏂', ski: '⛷️', wingsuit: '🦅', paraglider: '🪂' }

export default function LeaderboardPage() {
  const [params] = useSearchParams()
  const challengeId = params.get('challenge')
  const [tab, setTab]       = useState<Tab>(challengeId ? 'challenge' : 'global')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank]   = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const { username } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      try {
        if (tab === 'global') {
          const r = await axios.get('/api/leaderboard/global')
          setEntries(r.data)
        } else if (tab === 'friends') {
          const r = await axios.get('/api/leaderboard/friends')
          setEntries(r.data)
        } else if (tab === 'challenge' && challengeId) {
          const [r, me] = await Promise.all([
            axios.get(`/api/leaderboard/challenge/${challengeId}`),
            axios.get(`/api/leaderboard/challenge/${challengeId}/me`),
          ])
          setEntries(r.data)
          setMyRank(me.data)
        }
      } catch { setEntries([]) }
      setLoading(false)
    }
    load()
  }, [tab, challengeId])

  const formatTime = (ms: number) => {
    if (!ms) return '—'
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`font-title ${styles.title}`}>Leaderboards</h1>
        <p className="text-muted">Compete with the world's best riders</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab==='global'    ? styles.active : ''}`} onClick={()=>setTab('global')}>🌍 Global</button>
        <button className={`${styles.tab} ${tab==='friends'   ? styles.active : ''}`} onClick={()=>setTab('friends')}>👥 Friends</button>
        {challengeId && (
          <button className={`${styles.tab} ${tab==='challenge' ? styles.active : ''}`} onClick={()=>setTab('challenge')}>🎯 This Challenge</button>
        )}
      </div>

      {/* My rank (challenge tab) */}
      {tab === 'challenge' && myRank && (
        <div className={styles.myRank}>
          <span>Your Rank</span>
          <strong>#{myRank.rank}</strong>
          <span>{myRank.score?.toLocaleString()} pts</span>
          <span>{formatTime(myRank.time_ms)}</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className={styles.loading}><span className="animate-spin">⟳</span> Loading…</div>
      ) : entries.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏆</div>
          <p>No entries yet. Be the first!</p>
          <button className="btn btn-primary" onClick={() => navigate('/world')}>Go Ride</button>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Rider</th>
                <th>Sport</th>
                <th>Level</th>
                {tab === 'challenge' ? (
                  <>
                    <th>Score</th>
                    <th>Time</th>
                  </>
                ) : (
                  <th>Total XP</th>
                )}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const rank = (e as LeaderboardEntry & { rank?: number }).rank ?? i + 1
                const isMe = e.username === username
                return (
                  <tr key={e.id ?? i}
                    className={`${styles.row} ${isMe ? styles.rowMe : ''}`}
                    onClick={() => navigate(`/profile/${(e as LeaderboardEntry & {id: string}).id}`)}>
                    <td>
                      <span className={`${styles.rank} ${rank<=3 ? styles[`rank${rank}`] : ''}`}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rider}>
                        <div className={styles.avatar}>{e.username[0].toUpperCase()}</div>
                        <span className={styles.riderName}>{e.username}{isMe ? ' (you)' : ''}</span>
                      </div>
                    </td>
                    <td><span className={styles.sport}>{SPORT_ICONS[e.fav_sport]} {e.fav_sport}</span></td>
                    <td><span className={styles.level}>Lv {e.level}</span></td>
                    {tab === 'challenge' ? (
                      <>
                        <td><strong className="text-accent">{e.score?.toLocaleString()}</strong></td>
                        <td>{formatTime(e.time_ms)}</td>
                      </>
                    ) : (
                      <td><strong className="text-accent">{(e as unknown as {xp: number}).xp?.toLocaleString() ?? '—'}</strong></td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
