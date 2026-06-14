# peakrush 🏔

open-world extreme sports game — web concept & full-stack implementation.  
four sports · five regions · 500 km² of seamless alpine terrain.

---

## что это

peakrush — оригинальная концепция игры в жанре open-world экстремального спорта.  
включает полный стек: react-фронтенд, node.js api, postgresql базу данных, socket.io мультиплеер и python-микросервис для сжатия ghost-реплеев и анти-чита.

**виды спорта:**
- 🏂 сноуборд — карвинг, парк, бэккантри
- ⛷️ лыжи — твин-тип фрирайд, скорость до 220 км/ч
- 🦅 вингсьют — пролёт в 10 см от скал, 300 км/ч
- 🪂 параплан — термики, высотное парение

**регионы:**
- the spine of europe — главный альпийский хаб (доступен с 1 lvl)
- freeride peak — крутые кулуары 60° (lvl 10)
- arctic bowl — полярные ночи и пурга (lvl 25)
- volcano range — вулканический снег (lvl 18)
- coastal cliffs — вингсьют над океаном (lvl 30)

---

## стек технологий

| слой | технологии |
|------|-----------|
| frontend | react 18 · typescript · vite · three.js · zustand · framer-motion |
| backend | node.js · express · typescript · socket.io |
| database | postgresql 16 · sql (schema + views) |
| realtime | socket.io (20 hz позиции, чат, трюки) |
| python | flask · zstandard · anti-cheat микросервис |
| ci/cd | github actions |
| стили | css modules · css custom properties |

---

## структура проекта

```
peakrush/
├── client/                   # react frontend
│   ├── src/
│   │   ├── pages/            # все страницы
│   │   │   ├── LandingPage   # главная / hero
│   │   │   ├── AuthPage      # вход / регистрация
│   │   │   ├── DashboardPage # дашборд игрока
│   │   │   ├── WorldMapPage  # карта мира / выбор региона
│   │   │   ├── ChallengePage # игровой хад + физика + трюки
│   │   │   ├── LeaderboardPage
│   │   │   ├── ProfilePage
│   │   │   ├── SocialPage    # лента хайлайтов
│   │   │   └── GameConceptPage # полный GDD
│   │   ├── hooks/
│   │   │   ├── useAuthStore.ts       # zustand auth
│   │   │   └── usePhysicsEngine.ts   # физика всех видов спорта
│   │   ├── components/
│   │   │   └── Layout.tsx    # сайдбар + навигация
│   │   ├── types/index.ts    # все typescript-типы
│   │   └── styles/globals.css
│   └── package.json
│
├── server/                   # node.js + express api
│   └── src/
│       ├── index.ts          # точка входа + socket.io
│       ├── db.ts             # postgresql pool
│       ├── middleware/auth.ts # jwt
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── profile.ts
│       │   ├── challenges.ts
│       │   ├── leaderboard.ts
│       │   ├── regions.ts
│       │   ├── social.ts
│       │   ├── sessions.ts
│       │   └── achievements.ts
│       └── socket/handlers.ts # мультиплеер хэндлеры
│
├── database/
│   └── schema.sql            # полная схема postgresql (14 таблиц + views)
│
├── scripts/
│   ├── anticheat_service.py  # flask микросервис (порт 5100)
│   └── requirements.txt
│
└── .github/workflows/ci.yml  # github actions
```

---

## быстрый старт

### требования

- node.js ≥ 20
- postgresql 16
- python 3.12 (для античита)

### 1. клонировать и установить зависимости

```bash
git clone https://github.com/yourname/peakrush.git
cd peakrush
npm run install:all
```

### 2. настроить postgresql

```bash
createdb peakrush
psql -d peakrush -f database/schema.sql
```

### 3. создать `.env` в папке `server/`

```env
PORT=4000
CLIENT_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=peakrush
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
```

### 4. запустить все сервисы

```bash
# фронтенд + бэкенд одновременно
npm run dev

# python античит (опционально)
cd scripts
pip install -r requirements.txt
python anticheat_service.py
```

- фронтенд: http://localhost:3000  
- api: http://localhost:4000  
- python: http://localhost:5100  

---

## api endpoints

### auth
| метод | путь | описание |
|-------|------|----------|
| POST | `/api/auth/register` | регистрация |
| POST | `/api/auth/login` | вход |

### profile
| метод | путь | описание |
|-------|------|----------|
| GET | `/api/profile/me` | мой профиль |
| GET | `/api/profile/:id` | профиль игрока |
| PATCH | `/api/profile/me` | обновить профиль |
| POST | `/api/profile/me/stat` | записать статы после рана |

### challenges
| метод | путь | описание |
|-------|------|----------|
| GET | `/api/challenges` | список (фильтр: region, sport, type) |
| GET | `/api/challenges/:id` | детали челленджа |
| POST | `/api/challenges/:id/complete` | записать результат |
| GET | `/api/challenges/daily/today` | дневной челлендж |

### leaderboard
| метод | путь | описание |
|-------|------|----------|
| GET | `/api/leaderboard/challenge/:id` | топ по челленджу |
| GET | `/api/leaderboard/global` | глобальный рейтинг по xp |
| GET | `/api/leaderboard/friends` | рейтинг среди друзей |

### social
| метод | путь | описание |
|-------|------|----------|
| GET | `/api/social/feed` | лента хайлайтов |
| POST | `/api/social/highlight` | опубликовать хайлайт |
| POST | `/api/social/highlight/:id/like` | лайк |
| GET | `/api/social/friends` | список друзей |
| POST | `/api/social/friends/request` | запрос в друзья |

### sessions (мультиплеер)
| метод | путь | описание |
|-------|------|----------|
| GET | `/api/sessions/public` | открытые сессии |
| POST | `/api/sessions` | создать сессию |
| POST | `/api/sessions/:id/join` | войти в сессию |

### achievements
| метод | путь | описание |
|-------|------|----------|
| GET | `/api/achievements` | все ачивки |
| GET | `/api/achievements/me` | мои ачивки |
| POST | `/api/achievements/unlock` | разблокировать |

---

## socket.io события

```
player:joined     — игрок зашёл в сессию
player:left       — игрок вышел
player:move       — позиция (20 Гц)
player:moved      — broadcast позиции
trick:landed      — трюк выполнен
trick:broadcast   — broadcast трюка
chat:message      — чат
ghost:request     — вызов на ghost-race
```

---

## база данных

14 таблиц + 2 view:

```
users · player_profiles · sports · regions · challenges
player_challenge_records · leaderboard_entries · tricks
gear_items · player_inventory · ghost_replays · highlights
friendships · game_sessions · session_participants
achievements · player_achievements · weather_log · daily_challenges

views: v_leaderboard_full · v_player_stats
```

---

## физика (usePhysicsEngine.ts)

каждый вид спорта имеет отдельный конфиг:

```typescript
snowboard: { maxSpeed: 180, acceleration: 12, turnRate: 2.8, jumpForce: 8 }
ski:       { maxSpeed: 220, acceleration: 15, turnRate: 3.2, jumpForce: 9 }
wingsuit:  { maxSpeed: 300, liftCoeff: 0.72, gravityMult: 0.25 }
paraglider:{ maxSpeed:  60, liftCoeff: 0.95, gravityMult: 0.08 }
```

симулируется: наклон склона, трение по типу снега, подъёмная сила, аэродинамическое сопротивление, угловой момент при трюках, приземление.

---

## python античит

```bash
# проверить скорость и телепорты
curl -X POST http://localhost:5100/validate \
  -H "Content-Type: application/json" \
  -d '{"sport":"wingsuit","keyframes":[{"t":0,"x":0,"y":2000,"z":0,"speed":150}]}'

# сжать реплей
curl -X POST http://localhost:5100/compress \
  -H "Content-Type: application/json" \
  -d '{"keyframes":[...]}'
```

---

## github actions

ci запускается на каждый push в `main` / `develop`:

1. **client** — `npm run lint` + `npm run build`
2. **server** — `npm run build`
3. **python** — импорт-проверка
4. **db-lint** — прогон `schema.sql` на чистой postgresql 16

---

## управление в игре

| кнопка | действие |
|--------|----------|
| ← → | поворот |
| ↑ ↓ | наклон |
| пробел | прыжок |
| shift | тормоз |
| z | трюк 1 |
| x | трюк 2 |
| c | трюк 3 |

---

## лицензия

mit — делай что хочешь, ссылка на авторство приветствуется.
