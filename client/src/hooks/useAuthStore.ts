import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { PlayerProfile } from '../types'

interface AuthState {
  token: string | null
  userId: string | null
  username: string | null
  profile: PlayerProfile | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  fetchProfile: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      username: null,
      profile: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await axios.post('/api/auth/login', { email, password })
          set({ token: data.token, userId: data.userId, username: data.username, isLoading: false })
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          await get().fetchProfile()
        } catch (e: unknown) {
          const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed'
          set({ isLoading: false, error: msg })
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await axios.post('/api/auth/register', { username, email, password })
          set({ token: data.token, userId: data.userId, username: data.username, isLoading: false })
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          await get().fetchProfile()
        } catch (e: unknown) {
          const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed'
          set({ isLoading: false, error: msg })
        }
      },

      logout: () => {
        set({ token: null, userId: null, username: null, profile: null })
        delete axios.defaults.headers.common['Authorization']
      },

      fetchProfile: async () => {
        const token = get().token
        if (!token) return
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        try {
          const { data } = await axios.get('/api/profile/me')
          set({ profile: data })
        } catch { /* silent */ }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'peakrush-auth', partialize: (s) => ({ token: s.token, userId: s.userId, username: s.username }) }
  )
)
