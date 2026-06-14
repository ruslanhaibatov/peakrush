export interface User {
  id: string
  username: string
  email: string
  avatar_url?: string
  country_code?: string
  created_at: string
}

export interface PlayerProfile {
  id: string
  user_id: string
  display_name: string
  level: number
  xp: number
  coins: number
  premium_coins: number
  total_distance: number
  total_airtime: number
  total_tricks: number
  highest_speed: number
  highest_drop: number
  fav_sport: SportCode
  playtime_hours: number
}

export type SportCode = 'snowboard' | 'ski' | 'wingsuit' | 'paraglider'

export interface Sport {
  id: number
  code: SportCode
  name: string
  description: string
}

export interface Region {
  id: number
  code: string
  name: string
  description: string
  altitude_min: number
  altitude_max: number
  area_km2: number
  difficulty: 'beginner' | 'intermediate' | 'expert' | 'extreme'
  is_locked: boolean
  unlock_level: number
  thumbnail_url?: string
  current_weather?: WeatherEvent
  challenges?: Challenge[]
}

export interface Challenge {
  id: string
  region_id: number
  sport_id: number
  type: 'race' | 'trick' | 'exploration' | 'survival' | 'ghost' | 'multiplayer'
  name: string
  description: string
  difficulty: string
  xp_reward: number
  coin_reward: number
  bronze_target: number
  silver_target: number
  gold_target: number
  region_name?: string
  sport_name?: string
}

export interface LeaderboardEntry {
  id: string
  challenge_id: string
  challenge_name: string
  username: string
  level: number
  fav_sport: SportCode
  score: number
  time_ms: number
  created_at: string
  rank: number
}

export interface Achievement {
  id: number
  code: string
  name: string
  description: string
  xp_reward: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlocked_at?: string
}

export interface Highlight {
  id: string
  user_id: string
  username: string
  avatar_url?: string
  title: string
  description?: string
  sport_name?: string
  region_name?: string
  likes: number
  views: number
  created_at: string
}

export interface GearItem {
  id: number
  sport_id: number
  category: string
  name: string
  brand: string
  description: string
  stat_speed: number
  stat_agility: number
  stat_stability: number
  stat_airtime: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  coin_price?: number
  premium_price?: number
  unlock_level: number
}

export interface GameSession {
  id: string
  host_user_id: string
  host_name: string
  region_id: number
  region_name: string
  session_type: 'freeride' | 'race' | 'trick_battle' | 'exploration'
  max_players: number
  current_count: number
  is_public: boolean
  status: 'waiting' | 'active' | 'finished'
  created_at: string
}

export interface WeatherEvent {
  event_type: 'clear' | 'snowfall' | 'blizzard' | 'fog' | 'storm' | 'aurora'
  intensity: number
  wind_speed: number
  temperature: number
}

// Physics types
export interface PhysicsState {
  position: [number, number, number]
  velocity: [number, number, number]
  rotation: [number, number, number]
  speed: number         // km/h
  airborne: boolean
  grounded: boolean
  trickActive: boolean
  combo: number
  comboScore: number
}

export interface TrickInput {
  name: string
  baseScore: number
  multiplier: number
  sport: SportCode
}
