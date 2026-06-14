import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore'
import styles from './Layout.module.css'

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',    icon: '⛰️' },
  { to: '/world',      label: 'World Map',     icon: '🗺️' },
  { to: '/leaderboard',label: 'Leaderboard',  icon: '🏆' },
  { to: '/social',     label: 'Social',        icon: '🎿' },
  { to: '/profile',    label: 'Profile',       icon: '👤' },
]

export default function Layout() {
  const { username, profile, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo} onClick={() => navigate('/dashboard')}>
          <span className={styles.logoIcon}>🏔</span>
          <span className={styles.logoText}>PEAK<br/>RUSH</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.navIcon}>{n.icon}</span>
              <span className={styles.navLabel}>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {profile && (
            <div className={styles.levelBadge}>
              <span className={styles.levelNum}>Lv {profile.level}</span>
              <div className={styles.xpBar}>
                <div
                  className={styles.xpFill}
                  style={{ width: `${((profile.xp % 1000) / 1000) * 100}%` }}
                />
              </div>
            </div>
          )}
          <div className={styles.userRow}>
            <span className={styles.userName}>{username}</span>
            <button className={`btn btn-ghost ${styles.logoutBtn}`} onClick={handleLogout}>
              ↩ Out
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
