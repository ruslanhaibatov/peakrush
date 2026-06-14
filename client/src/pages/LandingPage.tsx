import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore'
import styles from './LandingPage.module.css'

const SPORTS = [
  { icon: '🏂', label: 'Snowboard', desc: 'Carve untouched powder at 180 km/h' },
  { icon: '⛷️', label: 'Ski',       desc: '220 km/h twin-tip freeride mastery' },
  { icon: '🦅', label: 'Wingsuit',  desc: 'Skim cliffs at 300 km/h — inches to spare' },
  { icon: '🪂', label: 'Paraglider',desc: 'Soar on thermals above 4,800m peaks' },
]

const FEATURES = [
  { icon: '🌍', title: 'Seamless Open World', desc: '500 km² of mountain terrain — no loading screens, ever.' },
  { icon: '🌨️', title: 'Dynamic Weather',    desc: 'Real-time blizzards, aurora, and fog that reshape every run.' },
  { icon: '👻', title: 'Ghost System',        desc: 'Race any player\'s ghost — friends, rivals, world records.' },
  { icon: '🏆', title: 'Live Leaderboards',  desc: 'Global & friends rankings updated the moment you land.' },
  { icon: '🎮', title: 'Trick Engine',        desc: '200+ tricks, infinite combos, proximity multipliers.' },
  { icon: '🤝', title: 'Co-op Sessions',     desc: 'Ride with 8 friends in real-time across any region.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { token } = useAuthStore()

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>Open World Extreme Sports</div>
          <h1 className={styles.heroTitle}>
            PEAK<span className={styles.heroAccent}>RUSH</span>
          </h1>
          <p className={styles.heroSub}>
            500 km² of living mountain. Four sports. Zero limits.
          </p>
          <div className={styles.heroCtas}>
            {token ? (
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Continue Playing
              </button>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => navigate('/auth?mode=register')}>
                  Start Free
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/auth?mode=login')}>
                  Sign In
                </button>
              </>
            )}
            <button className="btn btn-ghost" onClick={() => navigate('/concept')}>
              Game Concept ↗
            </button>
          </div>
        </div>

        <div className={styles.heroStats}>
          {[
            { n: '500', u: 'km²', l: 'Open World' },
            { n: '300', u: 'km/h', l: 'Top Speed' },
            { n: '200+', u: '', l: 'Tricks' },
            { n: '8', u: 'players', l: 'Co-op' },
          ].map(s => (
            <div key={s.l} className={styles.heroStat}>
              <span className={styles.heroStatNum}>{s.n}<sup>{s.u}</sup></span>
              <span className={styles.heroStatLabel}>{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sports ── */}
      <section className={styles.section}>
        <h2 className={`${styles.sectionTitle} font-title`}>Choose Your Weapon</h2>
        <div className={styles.sportsGrid}>
          {SPORTS.map(s => (
            <div key={s.label} className={styles.sportCard}>
              <div className={styles.sportIcon}>{s.icon}</div>
              <h3 className={styles.sportName}>{s.label}</h3>
              <p className={styles.sportDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className={`${styles.section} ${styles.sectionDark}`}>
        <h2 className={`${styles.sectionTitle} font-title`}>Built Different</h2>
        <div className={styles.featuresGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h4 className={styles.featureTitle}>{f.title}</h4>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <h2 className={`${styles.ctaTitle} font-title`}>
          THE MOUNTAIN IS WAITING
        </h2>
        <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.9rem 2.5rem' }}
          onClick={() => navigate(token ? '/dashboard' : '/auth?mode=register')}>
          {token ? 'Go to Dashboard' : 'Create Free Account'}
        </button>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerLogo}>🏔 PEAKRUSH</span>
        <span className={styles.footerCopy}>© 2025 PeakRush. All rights reserved.</span>
        <div className={styles.footerLinks}>
          <button className="btn btn-ghost" onClick={() => navigate('/concept')}>Game Concept</button>
        </div>
      </footer>
    </div>
  )
}
