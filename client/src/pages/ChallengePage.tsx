import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import type { Challenge, SportCode } from '../types'
import { usePhysicsEngine, InputState } from '../hooks/usePhysicsEngine'
import styles from './ChallengePage.module.css'

const SPORT_ICONS: Record<SportCode, string> = {
  snowboard: '🏂', ski: '⛷️', wingsuit: '🦅', paraglider: '🪂',
}

const TRICKS: Record<SportCode, { name: string; key: string }[]> = {
  snowboard: [
    { name: 'Method Grab',      key: 'Z' },
    { name: 'Cab 900',          key: 'X' },
    { name: 'Double Cork 1080', key: 'C' },
  ],
  ski: [
    { name: 'Safety Grab', key: 'Z' },
    { name: 'Rodeo 540',   key: 'X' },
    { name: 'Switch 720',  key: 'C' },
  ],
  wingsuit: [
    { name: 'Proximity Line', key: 'Z' },
    { name: 'Barrel Roll',    key: 'X' },
    { name: 'Loop',           key: 'C' },
  ],
  paraglider: [
    { name: 'Thermal Spiral', key: 'Z' },
    { name: 'Wing Over',      key: 'X' },
    { name: 'SAT',            key: 'C' },
  ],
}

export default function ChallengePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [sport, setSport] = useState<SportCode>('snowboard')
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [lastTrick, setLastTrick] = useState<string | null>(null)
  const [trickFeed, setTrickFeed] = useState<{ name: string; score: number; id: number }[]>([])

  const { update, reset, state: physState } = usePhysicsEngine(sport)
  const inputRef = useRef<InputState>({
    left: false, right: false, up: false, down: false,
    jump: false, trick1: false, trick2: false, trick3: false, brake: false,
  })
  const rafRef    = useRef<number>(0)
  const startRef  = useRef<number>(0)
  const timerRef  = useRef<ReturnType<typeof setInterval>>()
  const trickIdRef = useRef(0)

  const [hud, setHud] = useState({ speed: 0, altitude: 0, combo: 0, comboScore: 0, airborne: false })

  useEffect(() => {
    if (id) axios.get(`/api/challenges/${id}`).then(r => setChallenge(r.data)).catch(() => {})
  }, [id])

  // Keyboard input
  useEffect(() => {
    const KEY_MAP: Record<string, keyof InputState> = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      ' ': 'jump', KeyZ: 'trick1', KeyX: 'trick2', KeyC: 'trick3', ShiftLeft: 'brake',
    }
    const down = (e: KeyboardEvent) => {
      const k = KEY_MAP[e.key] || KEY_MAP[e.code]
      if (k) { inputRef.current[k] = true; e.preventDefault() }
    }
    const up = (e: KeyboardEvent) => {
      const k = KEY_MAP[e.key] || KEY_MAP[e.code]
      if (k) inputRef.current[k] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const gameLoop = useCallback(() => {
    const now = performance.now()
    const dt = Math.min((now - startRef.current) / 1000, 0.05)
    startRef.current = now

    const inp = inputRef.current
    const prev = physState.current
    const next = update(inp, dt)

    // Reset trick keys after consuming
    if (inp.trick1 && next.trickActive) {
      setLastTrick(TRICKS[sport][0].name)
      const score = Math.round(50 * (1 + next.combo * 0.5))
      const tid = ++trickIdRef.current
      setTrickFeed(f => [{ name: TRICKS[sport][0].name, score, id: tid }, ...f.slice(0, 5)])
      inputRef.current.trick1 = false
    }
    if (inp.trick2 && next.trickActive) {
      setLastTrick(TRICKS[sport][1].name)
      const score = Math.round(100 * (1 + next.combo * 0.5))
      const tid = ++trickIdRef.current
      setTrickFeed(f => [{ name: TRICKS[sport][1].name, score, id: tid }, ...f.slice(0, 5)])
      inputRef.current.trick2 = false
    }
    if (inp.trick3 && next.trickActive) {
      setLastTrick(TRICKS[sport][2]?.name ?? 'Trick')
      const score = Math.round(200 * (1 + next.combo * 0.5))
      const tid = ++trickIdRef.current
      setTrickFeed(f => [{ name: TRICKS[sport][2].name, score, id: tid }, ...f.slice(0, 5)])
      inputRef.current.trick3 = false
    }

    setHud({
      speed:      Math.round(next.speed),
      altitude:   Math.round(next.position[1]),
      combo:      next.combo,
      comboScore: Math.round(next.comboScore),
      airborne:   next.airborne,
    })

    // Auto-finish after 120s
    if (elapsedMs >= 120_000) { endRun(); return }

    rafRef.current = requestAnimationFrame(gameLoop)
  }, [update, sport, physState, elapsedMs])

  const startRun = () => {
    reset()
    setFinished(false)
    setElapsedMs(0)
    setTrickFeed([])
    setRunning(true)
    startRef.current = performance.now()
    timerRef.current = setInterval(() => setElapsedMs(p => p + 100), 100)
    rafRef.current = requestAnimationFrame(gameLoop)
  }

  const endRun = useCallback(async () => {
    cancelAnimationFrame(rafRef.current)
    clearInterval(timerRef.current)
    setRunning(false)
    setFinished(true)

    const score = hud.comboScore + Math.max(0, 120_000 - elapsedMs) / 10
    const medal = score >= (challenge?.gold_target ?? 99999)   ? 'gold'
                : score >= (challenge?.silver_target ?? 99999) ? 'silver'
                : score >= (challenge?.bronze_target ?? 0)     ? 'bronze'
                : null

    if (id && medal) {
      await axios.post(`/api/challenges/${id}/complete`, {
        score, time_ms: elapsedMs, medal,
      }).catch(() => {})
    }
  }, [hud.comboScore, elapsedMs, challenge, id])

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${(s % 60).toString().padStart(2, '0')}.${(ms % 1000).toString().slice(0, 1)}`
  }

  if (!challenge) return (
    <div className={styles.loading}>
      <span className="animate-spin">⟳</span> Loading challenge…
    </div>
  )

  const finalScore = Math.round(hud.comboScore + Math.max(0, 120_000 - elapsedMs) / 10)

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.topBar}>
        <button className="btn btn-ghost" onClick={() => navigate('/world')}>← Back</button>
        <div className={styles.challengeInfo}>
          <h1 className={`font-title ${styles.challengeTitle}`}>{challenge.name}</h1>
          <div className={styles.challengeMeta}>
            <span>{challenge.region_name}</span>
            <span>·</span>
            <span>{challenge.sport_name}</span>
            <span>·</span>
            <span style={{ textTransform: 'capitalize' }}>{challenge.difficulty}</span>
          </div>
        </div>
        <div className={styles.medals}>
          <span className="medal-bronze">🥉 {challenge.bronze_target ?? 1000}</span>
          <span className="medal-silver">🥈 {challenge.silver_target ?? 3000}</span>
          <span className="medal-gold">🥇 {challenge.gold_target ?? 6000}</span>
        </div>
      </div>

      {/* Sport selector (pre-start only) */}
      {!running && !finished && (
        <div className={styles.setup}>
          <p className={styles.desc}>{challenge.description}</p>
          <div className={styles.sportPicker}>
            <p className={styles.sportPickerLabel}>Choose your sport</p>
            <div className={styles.sportBtns}>
              {(['snowboard','ski','wingsuit','paraglider'] as SportCode[]).map(s => (
                <button key={s}
                  className={`${styles.sportBtn} ${sport === s ? styles.sportBtnActive : ''}`}
                  onClick={() => setSport(s)}>
                  {SPORT_ICONS[s]} {s}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controls}>
            <h4>Controls</h4>
            <div className={styles.controlGrid}>
              {[
                ['← →', 'Turn'],
                ['↑ ↓', 'Lean'],
                ['Space', 'Jump'],
                ['Shift', 'Brake'],
                ['Z', TRICKS[sport][0].name],
                ['X', TRICKS[sport][1].name],
                ['C', TRICKS[sport][2]?.name ?? '–'],
              ].map(([k, v]) => (
                <div key={k} className={styles.controlRow}>
                  <kbd className={styles.kbd}>{k}</kbd>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.85rem 2.5rem' }} onClick={startRun}>
            🏂 Start Run
          </button>
        </div>
      )}

      {/* Game HUD */}
      {running && (
        <div className={styles.gameArea}>
          {/* Simulated 3D viewport */}
          <div className={styles.viewport}>
            <svg viewBox="0 0 800 450" className={styles.scene}>
              <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#040c1a" />
                  <stop offset="100%" stopColor="#0a1e38" />
                </linearGradient>
                <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a3355" />
                  <stop offset="100%" stopColor="#0d1f35" />
                </linearGradient>
              </defs>

              {/* Sky */}
              <rect width="800" height="450" fill="url(#sky)" />

              {/* Stars */}
              {Array.from({ length: 30 }, (_, i) => (
                <circle key={i} cx={(i * 137.5) % 800} cy={(i * 73) % 180}
                  r={0.8 + (i % 3) * 0.5} fill="white" opacity={0.3 + (i % 5) * 0.14} />
              ))}

              {/* Mountain peaks */}
              <path d="M0 320 L100 160 L200 260 L300 80 L400 220 L500 100 L600 240 L700 140 L800 280 L800 450 L0 450Z"
                fill="url(#snow)" />
              <path d="M0 380 L130 270 L260 340 L390 200 L520 300 L650 230 L800 320 L800 450 L0 450Z"
                fill="#0a192e" opacity="0.9" />

              {/* Ground */}
              <rect x="0" y="380" width="800" height="70" fill="#0c1b2e" />

              {/* Speed-blur lines */}
              {hud.speed > 80 && Array.from({ length: 12 }, (_, i) => (
                <line key={i}
                  x1={Math.random() * 800} y1={200 + i * 20}
                  x2={Math.random() * 800 + 50} y2={202 + i * 20}
                  stroke="rgba(0,200,255,0.15)" strokeWidth="1"
                  opacity={Math.min(1, (hud.speed - 80) / 120)} />
              ))}

              {/* Player character */}
              <g transform="translate(400, 350)">
                {sport === 'wingsuit' || sport === 'paraglider' ? (
                  // Airborne character
                  <g>
                    <ellipse cx="0" cy={hud.airborne ? -60 : -5} rx="25" ry="8"
                      fill="rgba(0,200,255,0.3)" stroke="var(--c-accent)" strokeWidth="1" />
                    <circle cx="0" cy={hud.airborne ? -72 : -18} r="8" fill="#e8f0fe" />
                    <rect x="-12" y={hud.airborne ? -68 : -14} width="24" height="14"
                      rx="3" fill="#1a4a7a" />
                    {sport === 'wingsuit' && (
                      <>
                        <line x1="-12" y1={hud.airborne ? -62 : -8} x2="-30" y2={hud.airborne ? -48 : 6} stroke="#00c8ff" strokeWidth="2" />
                        <line x1="12" y1={hud.airborne ? -62 : -8} x2="30" y2={hud.airborne ? -48 : 6} stroke="#00c8ff" strokeWidth="2" />
                      </>
                    )}
                  </g>
                ) : (
                  // Ground character
                  <g>
                    <circle cx="0" cy="-22" r="8" fill="#e8f0fe" />
                    <rect x="-10" y="-14" width="20" height="16" rx="3" fill="#1a4a7a" />
                    <rect x="-14" y="2" width="28" height="6" rx="2" fill="#00c8ff" />
                    {/* Skis/board */}
                    <rect x="-18" y="6" width="36" height="4" rx="2"
                      fill={sport === 'snowboard' ? '#ff6b00' : '#00e67a'} />
                  </g>
                )}
              </g>

              {/* Snow particles */}
              {Array.from({ length: 20 }, (_, i) => (
                <circle key={i}
                  cx={(Date.now() / 20 + i * 200) % 800}
                  cy={100 + (i * 53) % 250}
                  r={1 + (i % 3)}
                  fill="white" opacity={0.15 + (i % 5) * 0.06} />
              ))}

              {/* Trick flash */}
              {hud.airborne && hud.combo > 0 && (
                <rect x="0" y="0" width="800" height="450"
                  fill="rgba(0,200,255,0.04)" />
              )}
            </svg>

            {/* HUD overlays */}
            <div className={styles.hud}>
              {/* Speed */}
              <div className={styles.hudSpeed}>
                <span className={styles.hudSpeedNum}>{hud.speed}</span>
                <span className={styles.hudSpeedUnit}>km/h</span>
              </div>

              {/* Timer */}
              <div className={styles.hudTimer}>{formatTime(elapsedMs)}</div>

              {/* Altitude */}
              <div className={styles.hudAlt}>
                <span>ALT</span>
                <strong>{hud.altitude}m</strong>
              </div>

              {/* Combo */}
              {hud.combo > 0 && (
                <div className={styles.hudCombo}>
                  <span className={styles.comboX}>x{hud.combo}</span>
                  <span className={styles.comboScore}>{hud.comboScore.toLocaleString()} pts</span>
                </div>
              )}

              {/* Airborne badge */}
              {hud.airborne && (
                <div className={styles.airborneBadge}>✈ AIRBORNE</div>
              )}

              {/* Stop button */}
              <button className="btn btn-danger" onClick={endRun} style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                ■ End Run
              </button>
            </div>

            {/* Trick feed */}
            <div className={styles.trickFeed}>
              {trickFeed.map(t => (
                <div key={t.id} className={styles.trickFeedItem}>
                  <span className={styles.trickName}>{t.name}</span>
                  <span className={styles.trickScore}>+{t.score}</span>
                </div>
              ))}
            </div>
          </div>

          <p className={styles.hint}>Use keyboard arrows to steer · Space to jump · Z/X/C for tricks</p>
        </div>
      )}

      {/* Results */}
      {finished && (
        <div className={styles.results}>
          <div className={styles.resultsCard}>
            <h2 className={`font-title ${styles.resultsTitle}`}>Run Complete</h2>
            <div className={styles.resultScore}>
              <span className={styles.resultScoreNum}>{finalScore.toLocaleString()}</span>
              <span className="text-muted">points</span>
            </div>

            {finalScore >= (challenge.gold_target ?? 99999)   && <div className={styles.medalBig}>🥇 GOLD</div>}
            {finalScore >= (challenge.silver_target ?? 99999) && finalScore < (challenge.gold_target ?? 99999) && <div className={styles.medalBig}>🥈 SILVER</div>}
            {finalScore >= (challenge.bronze_target ?? 0)     && finalScore < (challenge.silver_target ?? 99999) && <div className={styles.medalBig}>🥉 BRONZE</div>}
            {finalScore < (challenge.bronze_target ?? 0)      && <div className={styles.medalBig} style={{ filter: 'grayscale(1)' }}>No Medal</div>}

            <div className={styles.resultStats}>
              <div><span>Time</span><strong>{formatTime(elapsedMs)}</strong></div>
              <div><span>Top Speed</span><strong>{hud.speed} km/h</strong></div>
              <div><span>Max Combo</span><strong>x{hud.combo}</strong></div>
            </div>

            <div className={styles.resultActions}>
              <button className="btn btn-primary" onClick={startRun}>↩ Try Again</button>
              <button className="btn btn-secondary" onClick={() => navigate(`/leaderboard?challenge=${id}`)}>
                🏆 Leaderboard
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/world')}>← World Map</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
