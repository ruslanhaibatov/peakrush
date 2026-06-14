import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import type { Region } from '../types'
import { useAuthStore } from '../hooks/useAuthStore'
import styles from './WorldMapPage.module.css'

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner:     '#00e67a',
  intermediate: '#00c8ff',
  expert:       '#ff6b00',
  extreme:      '#ff3b3b',
}

const WEATHER_ICON: Record<string, string> = {
  clear: '☀️', snowfall: '🌨️', blizzard: '❄️', fog: '🌫️', storm: '⛈️', aurora: '🌌',
}

const SPORT_ICONS: Record<string, string> = {
  race: '🏎️', trick: '🤸', exploration: '🗺️', survival: '💀', ghost: '👻', multiplayer: '🤝',
}

export default function WorldMapPage() {
  const [regions, setRegions] = useState<Region[]>([])
  const [selected, setSelected] = useState<Region | null>(null)
  const { profile } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/regions').then(r => setRegions(r.data))
  }, [])

  const handleSelect = async (r: Region) => {
    const { data } = await axios.get(`/api/regions/${r.id}`)
    setSelected(data)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={`font-title ${styles.title}`}>World Map</h1>
          <p className="text-muted">500 km² of seamless alpine terrain</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* SVG Map */}
        <div className={styles.mapWrap}>
          <svg viewBox="0 0 900 540" className={styles.map}>
            {/* Mountain terrain background */}
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#060d1a" />
                <stop offset="100%" stopColor="#0a1a30" />
              </linearGradient>
              <radialGradient id="snowGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,200,255,0.15)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            <rect width="900" height="540" fill="url(#skyGrad)" />

            {/* Terrain silhouette */}
            <path d="M0 540 L0 380 L90 220 L180 310 L270 100 L360 260 L450 60 L540 200 L630 130 L720 280 L810 160 L900 300 L900 540Z"
              fill="#0d1f35" />
            <path d="M0 540 L0 420 L120 300 L200 380 L300 250 L400 360 L500 180 L600 320 L700 200 L800 340 L900 260 L900 540Z"
              fill="#0a1828" opacity="0.8" />

            {/* Snow caps */}
            <path d="M270 100 L250 140 L290 130Z" fill="white" opacity="0.9" />
            <path d="M450 60  L430 110 L470 100Z" fill="white" opacity="0.9" />
            <path d="M630 130 L615 165 L650 155Z" fill="white" opacity="0.9" />
            <path d="M810 160 L795 195 L830 185Z" fill="white" opacity="0.9" />

            {/* Region markers */}
            {[
              { code: 'alps_core',      cx: 280, cy: 280 },
              { code: 'freeride_peak',  cx: 450, cy: 180 },
              { code: 'arctic_bowl',    cx: 150, cy: 390 },
              { code: 'volcano_range',  cx: 640, cy: 310 },
              { code: 'coastal_cliffs', cx: 790, cy: 370 },
            ].map(pos => {
              const region = regions.find(r => r.code === pos.code)
              if (!region) return null
              const locked = region.is_locked || (profile?.level || 1) < region.unlock_level
              const isSelected = selected?.code === pos.code
              return (
                <g key={pos.code} onClick={() => !locked && handleSelect(region)} style={{ cursor: locked ? 'not-allowed' : 'pointer' }}>
                  <circle
                    cx={pos.cx} cy={pos.cy} r={isSelected ? 22 : 16}
                    fill={locked ? '#1a2535' : DIFFICULTY_COLOR[region.difficulty]}
                    fillOpacity={locked ? 0.4 : 0.25}
                    stroke={locked ? '#2a3a4a' : DIFFICULTY_COLOR[region.difficulty]}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className={isSelected ? styles.pulseDot : ''}
                  />
                  {locked ? (
                    <text x={pos.cx} y={pos.cy + 5} textAnchor="middle" fontSize="14" fill="#5a7090">🔒</text>
                  ) : (
                    <text x={pos.cx} y={pos.cy + 5} textAnchor="middle" fontSize="12" fill={DIFFICULTY_COLOR[region.difficulty]}>⛰</text>
                  )}
                  <text x={pos.cx} y={pos.cy + 32} textAnchor="middle" fontSize="9" fill="#8899aa">
                    {region.name.length > 14 ? region.name.slice(0,14)+'…' : region.name}
                  </text>
                </g>
              )
            })}

            {/* Wind lines */}
            {[20,40,60,80,90].map((y, i) => (
              <line key={i} x1={0} y1={y} x2={50 + i * 20} y2={y + 5}
                stroke="rgba(0,200,255,0.08)" strokeWidth="1" />
            ))}
          </svg>

          {/* Legend */}
          <div className={styles.legend}>
            {Object.entries(DIFFICULTY_COLOR).map(([d, c]) => (
              <span key={d} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: c }} />
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className={styles.panel}>
          {selected ? (
            <div className={styles.regionDetail}>
              <div className={styles.regionHeader}>
                <div>
                  <span className={styles.diffBadge} style={{ color: DIFFICULTY_COLOR[selected.difficulty], borderColor: DIFFICULTY_COLOR[selected.difficulty] }}>
                    {selected.difficulty}
                  </span>
                  <h2 className={`font-title ${styles.regionName}`}>{selected.name}</h2>
                </div>
                {selected.current_weather && (
                  <span className={styles.weatherBadge}>
                    {WEATHER_ICON[selected.current_weather.event_type]}
                    {selected.current_weather.temperature?.toFixed(0)}°C
                  </span>
                )}
              </div>

              <p className={styles.regionDesc}>{selected.description}</p>

              <div className={styles.regionStats}>
                <div><span className="text-muted">Area</span><strong>{selected.area_km2} km²</strong></div>
                <div><span className="text-muted">Altitude</span><strong>{selected.altitude_min}–{selected.altitude_max}m</strong></div>
                <div><span className="text-muted">Unlock</span><strong>Lv {selected.unlock_level}</strong></div>
              </div>

              {selected.challenges && selected.challenges.length > 0 && (
                <>
                  <h4 className={styles.challengeHeading}>Challenges ({selected.challenges.length})</h4>
                  <div className={styles.challengeList}>
                    {selected.challenges.map((c) => (
                      <div key={c.id} className={styles.challengeItem}
                        onClick={() => navigate(`/challenge/${c.id}`)}>
                        <span>{SPORT_ICONS[c.type] || '🎯'}</span>
                        <div>
                          <div className={styles.challengeName}>{c.name}</div>
                          <div className={styles.challengeMeta}>{c.sport_name} · {c.type}</div>
                        </div>
                        <span className={styles.challengeArrow}>→</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.panelEmpty}>
              <div className={styles.panelEmptyIcon}>🗺️</div>
              <p>Select a region on the map to explore its challenges, weather, and stats.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
