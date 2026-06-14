-- PeakRush Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  country_code  CHAR(2),
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  last_login    TIMESTAMPTZ,
  is_banned     BOOLEAN      DEFAULT FALSE,
  ban_reason    TEXT
);

-- ─── PLAYER PROFILES ──────────────────────────────────────────────────────────
CREATE TABLE player_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name    VARCHAR(50),
  level           INT     DEFAULT 1,
  xp              BIGINT  DEFAULT 0,
  coins           INT     DEFAULT 500,
  premium_coins   INT     DEFAULT 0,
  total_distance  FLOAT   DEFAULT 0,   -- km
  total_airtime   FLOAT   DEFAULT 0,   -- seconds
  total_tricks    INT     DEFAULT 0,
  highest_speed   FLOAT   DEFAULT 0,   -- km/h
  highest_drop    FLOAT   DEFAULT 0,   -- meters
  fav_sport       VARCHAR(20) DEFAULT 'snowboard',
  playtime_hours  FLOAT   DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SPORTS ───────────────────────────────────────────────────────────────────
CREATE TABLE sports (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(20) UNIQUE NOT NULL,  -- snowboard, ski, wingsuit, paraglider
  name        VARCHAR(50) NOT NULL,
  description TEXT,
  icon_url    TEXT
);

INSERT INTO sports (code, name, description) VALUES
('snowboard', 'Snowboard', 'Ride the powder with your board strapped to both feet. Master carves, jumps and backcountry lines.'),
('ski', 'Ski', 'Twin-tip freestyle or freeride on two separate planks. Superior edge control and versatility.'),
('wingsuit', 'Wingsuit', 'Strap on a wingsuit and become a human aircraft. Skim cliff faces at 250 km/h.'),
('paraglider', 'Paraglider', 'Catch thermals and explore the mountain from above. Soar for hours above the peaks.');

-- ─── MOUNTAIN REGIONS ─────────────────────────────────────────────────────────
CREATE TABLE regions (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(30) UNIQUE NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  altitude_min  INT,   -- meters
  altitude_max  INT,   -- meters
  area_km2      FLOAT,
  difficulty    VARCHAR(20) CHECK (difficulty IN ('beginner','intermediate','expert','extreme')),
  is_locked     BOOLEAN DEFAULT FALSE,
  unlock_level  INT DEFAULT 1,
  thumbnail_url TEXT
);

INSERT INTO regions (code, name, description, altitude_min, altitude_max, area_km2, difficulty, unlock_level) VALUES
('alps_core',     'The Spine of Europe',    'A vast alpine massif stretching 120 km², bristling with knife-edge ridges, glacier bowls and deep powder trees.', 800, 4808, 120, 'intermediate', 1),
('freeride_peak', 'Freeride Peak',          'The legendary north face with 60-degree couloirs and 800m of continuous vertical. For experts only.',              1200, 3600, 45,  'expert',       10),
('arctic_bowl',   'Arctic Bowl',            'A polar basin where blizzards rage and visibility drops to zero. Master the whiteout.',                             0,    2100, 80,  'extreme',      25),
('volcano_range', 'Volcano Range',          'Active volcanic highlands with obsidian snow-fields and geothermal vents that melt channels through the ice.',     400,  3776, 95,  'expert',       18),
('coastal_cliffs','Coastal Cliffs',         'Sea-level fjords rising to 2000m in under 5 km. Base jump into the ocean from wingsuit launch points.',            0,    2100, 60,  'extreme',      30);

-- ─── CHALLENGES ───────────────────────────────────────────────────────────────
CREATE TABLE challenges (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id      INT REFERENCES regions(id),
  sport_id       INT REFERENCES sports(id),
  type           VARCHAR(30) CHECK (type IN ('race','trick','exploration','survival','ghost','multiplayer')),
  name           VARCHAR(150) NOT NULL,
  description    TEXT,
  difficulty     VARCHAR(20),
  xp_reward      INT DEFAULT 100,
  coin_reward    INT DEFAULT 50,
  bronze_target  FLOAT,   -- time/score threshold
  silver_target  FLOAT,
  gold_target    FLOAT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PLAYER CHALLENGE RECORDS ─────────────────────────────────────────────────
CREATE TABLE player_challenge_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  medal        VARCHAR(10) CHECK (medal IN ('bronze','silver','gold')),
  score        FLOAT,
  time_ms      BIGINT,
  attempts     INT DEFAULT 1,
  achieved_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, challenge_id)
);

-- ─── LEADERBOARDS ─────────────────────────────────────────────────────────────
CREATE TABLE leaderboard_entries (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  score        FLOAT NOT NULL,
  time_ms      BIGINT,
  replay_data  JSONB,  -- ghost replay compressed keyframes
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (challenge_id, user_id)
);

CREATE INDEX idx_leaderboard_score ON leaderboard_entries (challenge_id, score DESC);

-- ─── TRICKS CATALOG ───────────────────────────────────────────────────────────
CREATE TABLE tricks (
  id          SERIAL PRIMARY KEY,
  sport_id    INT REFERENCES sports(id),
  name        VARCHAR(100) NOT NULL,
  category    VARCHAR(30) CHECK (category IN ('grab','spin','flip','combo','grind','stomp')),
  base_score  INT DEFAULT 100,
  difficulty  INT CHECK (difficulty BETWEEN 1 AND 10),
  description TEXT,
  input_desc  TEXT   -- button combo description
);

INSERT INTO tricks (sport_id, name, category, base_score, difficulty, description, input_desc) VALUES
(1,'Method Grab',      'grab',  150, 3, 'Grab heel edge mid-backside rotation','Hold LT + A during jump'),
(1,'Cab 900',          'spin',  800, 8, 'Caballerial 900° spin — fakie to fakie','LT+RT spin + flick RS x2.5'),
(1,'Double Cork 1080', 'flip',  1200, 9,'Double off-axis 1080° — peak big air','LT+A, double RS flip + 3× spin'),
(1,'Nose Press Grind', 'grind', 250, 4, 'Lock nose on natural rock feature',    'RS forward + balance'),
(2,'Safety Grab',      'grab',  120, 2, 'Classic ski grab between the bindings','LT + hold A'),
(2,'Rodeo 540',        'flip',  700, 7, 'Off-axis backflip with 540° rotation', 'Jump + LS back + RT×1.5'),
(3,'Proximity Line',   'combo', 2000,10,'Thread a cliff face within 2m at 220 km/h','Sustained LT pitch-down at speed'),
(4,'Thermal Spiral',   'combo', 500, 5, 'Tight spiral descent inside a thermal', 'Full RS turn + hold');

-- ─── PLAYER GEAR / LOADOUT ────────────────────────────────────────────────────
CREATE TABLE gear_items (
  id             SERIAL PRIMARY KEY,
  sport_id       INT REFERENCES sports(id),
  category       VARCHAR(30) CHECK (category IN ('board','skis','suit','glider','helmet','goggles','boots','poles')),
  name           VARCHAR(100) NOT NULL,
  brand          VARCHAR(80),
  description    TEXT,
  stat_speed     INT DEFAULT 50 CHECK (stat_speed BETWEEN 0 AND 100),
  stat_agility   INT DEFAULT 50,
  stat_stability INT DEFAULT 50,
  stat_airtime   INT DEFAULT 50,
  rarity         VARCHAR(20) CHECK (rarity IN ('common','rare','epic','legendary')),
  coin_price     INT,
  premium_price  INT,
  unlock_level   INT DEFAULT 1,
  thumbnail_url  TEXT
);

-- ─── PLAYER INVENTORY ─────────────────────────────────────────────────────────
CREATE TABLE player_inventory (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  gear_id     INT  REFERENCES gear_items(id),
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  is_equipped BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, gear_id)
);

-- ─── GHOST REPLAYS ────────────────────────────────────────────────────────────
CREATE TABLE ghost_replays (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  sport_id     INT  REFERENCES sports(id),
  region_id    INT  REFERENCES regions(id),
  duration_ms  BIGINT,
  score        FLOAT,
  keyframes    JSONB NOT NULL,   -- [{t, x, y, z, rx, ry, rz, speed}]
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SOCIAL FEED / HIGHLIGHTS ─────────────────────────────────────────────────
CREATE TABLE highlights (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(200),
  description  TEXT,
  replay_id    UUID REFERENCES ghost_replays(id),
  clip_url     TEXT,
  thumbnail_url TEXT,
  sport_id     INT REFERENCES sports(id),
  region_id    INT REFERENCES regions(id),
  likes        INT DEFAULT 0,
  views        INT DEFAULT 0,
  is_public    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_highlights_created ON highlights (created_at DESC);
CREATE INDEX idx_highlights_likes    ON highlights (likes DESC);

-- ─── FRIENDS ──────────────────────────────────────────────────────────────────
CREATE TABLE friendships (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester   UUID REFERENCES users(id) ON DELETE CASCADE,
  addressee   UUID REFERENCES users(id) ON DELETE CASCADE,
  status      VARCHAR(20) CHECK (status IN ('pending','accepted','blocked')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester, addressee)
);

-- ─── SESSIONS (Online Multiplayer Rooms) ──────────────────────────────────────
CREATE TABLE game_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_user_id  UUID REFERENCES users(id),
  region_id     INT  REFERENCES regions(id),
  challenge_id  UUID REFERENCES challenges(id),
  session_type  VARCHAR(30) CHECK (session_type IN ('freeride','race','trick_battle','exploration')),
  max_players   INT DEFAULT 8,
  current_count INT DEFAULT 0,
  is_public     BOOLEAN DEFAULT TRUE,
  password_hash TEXT,
  status        VARCHAR(20) CHECK (status IN ('waiting','active','finished')) DEFAULT 'waiting',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ
);

-- ─── SESSION PARTICIPANTS ─────────────────────────────────────────────────────
CREATE TABLE session_participants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  sport_id    INT  REFERENCES sports(id),
  score       FLOAT,
  placement   INT,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

-- ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE achievements (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(80) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url    TEXT,
  xp_reward   INT DEFAULT 250,
  rarity      VARCHAR(20) CHECK (rarity IN ('common','rare','epic','legendary'))
);

INSERT INTO achievements (code, name, description, xp_reward, rarity) VALUES
('first_drop',        'First Blood',          'Complete your first run',                    100,  'common'),
('speed_demon_200',   'Speed Demon',          'Hit 200 km/h on a snowboard',                500,  'rare'),
('wingsuit_skim_10m', 'Skimming the Edge',    'Fly within 10m of a cliff face for 500m',    750,  'epic'),
('all_regions',       'World Conqueror',      'Unlock all mountain regions',                2000, 'legendary'),
('trick_combo_10k',   'Combo King',           'Land a single trick combo worth 10,000 pts', 1000, 'epic'),
('freeride_marathon', 'Marathon Rider',       'Ski/snowboard 100 km total distance',        500,  'rare'),
('ghost_beaten_50',   'Ghost Buster',         'Beat 50 ghost replays',                      750,  'epic'),
('solar_summit',      'Solar Summit',         'Reach the highest peak at sunrise',          1500, 'legendary');

-- ─── PLAYER ACHIEVEMENTS ──────────────────────────────────────────────────────
CREATE TABLE player_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INT  REFERENCES achievements(id),
  unlocked_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

-- ─── WEATHER EVENTS LOG ───────────────────────────────────────────────────────
CREATE TABLE weather_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id   INT REFERENCES regions(id),
  event_type  VARCHAR(30) CHECK (event_type IN ('clear','snowfall','blizzard','fog','storm','aurora')),
  intensity   FLOAT CHECK (intensity BETWEEN 0 AND 1),
  wind_speed  FLOAT,   -- m/s
  temperature FLOAT,   -- Celsius
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  ended_at    TIMESTAMPTZ
);

-- ─── DAILY CHALLENGES ─────────────────────────────────────────────────────────
CREATE TABLE daily_challenges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id),
  date         DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  bonus_xp     INT DEFAULT 500,
  bonus_coins  INT DEFAULT 200
);

-- ─── VIEWS ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_leaderboard_full AS
SELECT
  le.id,
  le.challenge_id,
  c.name   AS challenge_name,
  u.username,
  pp.level,
  pp.fav_sport,
  le.score,
  le.time_ms,
  le.created_at,
  RANK() OVER (PARTITION BY le.challenge_id ORDER BY le.score DESC) AS rank
FROM leaderboard_entries le
JOIN users u ON u.id = le.user_id
JOIN player_profiles pp ON pp.user_id = le.user_id
JOIN challenges c ON c.id = le.challenge_id;

CREATE OR REPLACE VIEW v_player_stats AS
SELECT
  u.id,
  u.username,
  pp.level,
  pp.xp,
  pp.fav_sport,
  pp.highest_speed,
  pp.total_distance,
  COUNT(DISTINCT pca.achievement_id) AS achievements_count,
  COUNT(DISTINCT pcr.challenge_id)   AS challenges_completed
FROM users u
JOIN player_profiles pp ON pp.user_id = u.id
LEFT JOIN player_achievements pca ON pca.user_id = u.id
LEFT JOIN player_challenge_records pcr ON pcr.user_id = u.id
GROUP BY u.id, u.username, pp.level, pp.xp, pp.fav_sport, pp.highest_speed, pp.total_distance;
