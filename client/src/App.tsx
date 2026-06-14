import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from './hooks/useAuthStore'

import LandingPage      from './pages/LandingPage'
import AuthPage         from './pages/AuthPage'
import DashboardPage    from './pages/DashboardPage'
import WorldMapPage     from './pages/WorldMapPage'
import ChallengePage    from './pages/ChallengePage'
import LeaderboardPage  from './pages/LeaderboardPage'
import ProfilePage      from './pages/ProfilePage'
import SocialPage       from './pages/SocialPage'
import GameConceptPage  from './pages/GameConceptPage'
import Layout           from './components/Layout'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/auth" replace />
}

export default function App() {
  const { token, fetchProfile } = useAuthStore()

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchProfile()
    }
  }, [token, fetchProfile])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/auth"     element={<AuthPage />} />
        <Route path="/concept"  element={<GameConceptPage />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/dashboard"          element={<DashboardPage />} />
          <Route path="/world"              element={<WorldMapPage />} />
          <Route path="/challenge/:id"      element={<ChallengePage />} />
          <Route path="/leaderboard"        element={<LeaderboardPage />} />
          <Route path="/profile"            element={<ProfilePage />} />
          <Route path="/profile/:userId"    element={<ProfilePage />} />
          <Route path="/social"             element={<SocialPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
