import { useNavigate } from 'react-router-dom'
import styles from './GameConceptPage.module.css'

const SECTIONS = [
  {
    id: 'vision',
    icon: '🏔',
    title: 'Vision & Core Pillars',
    content: `PeakRush is an open-world extreme sports game set across a seamless 500 km² alpine mega-region spanning five distinct biomes: a classic European Alps core, a high-altitude freeride peak, a polar arctic bowl, a volcanic highland, and a coastal fjord with near-vertical cliffs.

The three pillars that define every design decision are Freedom, Speed, and Risk.

Freedom means no loading screens, no invisible walls, and no prescribed routes. Every player can pick any starting position on the map, link any two geographic points with any combination of sports, and share that line as a ghost replay. The mountain belongs to the player.

Speed is the sensory core of the experience. From the first few meters of a 4,800m descent to the final proximity pass at 290 km/h in a wingsuit, the game must make players feel genuinely fast. This is achieved through a physics model that responds to real terrain geometry, dynamic field-of-view scaling, motion blur, audio Doppler effects, and particle systems that adapt to velocity.

Risk is the emotion that gives speed meaning. A poorly-timed grab costs a combo. A mistimed jump costs health. A blizzard spawning mid-descent forces a decision: push through or bail. Every run is a negotiation between performance and survival.`,
  },
  {
    id: 'physics',
    icon: '⚙️',
    title: 'Physics Engine',
    content: `The physics system is sport-specific yet unified under a single rigid-body solver running at 120 Hz on the server (for ghost validation) and client-side prediction at the display framerate.

SNOWBOARD
Edge pressure is simulated per-contact-point across a virtual board mesh. Heel and toe edges have independent friction coefficients that change with snow type (groomed piste, off-piste powder, wind crust, ice). Turn radius scales with speed: slow-speed carves are tight arcs; at 140+ km/h the board prefers straighter lines and resists tight turns. Aerial rotation preserves angular momentum—a 360 started with high rotational input but low jump height will over-rotate. Board camber flexes visually under load.

SKI
Twin-tip skis simulate two independent contact patches. Cross-country binding flex allows heel separation for efficient kick-glide. In the air, the skis can be spread for helicopters or pulled parallel for aerials. Landing physics check both tip and tail contact separately—touching down on tips with high horizontal speed pitches the skier forward into a tomahawk fall.

WINGSUIT
Lift is calculated from the effective angle-of-attack of three wing surfaces (torso, arms). Stall speed is approximately 60 km/h—below that the wingsuit goes into a flat spin. Optimal glide ratio (around 2.5:1) is maintained at 185–210 km/h. Wind direction affects trajectory; experienced players learn to read wind indicators and use tailwinds to extend proximity lines. Proximity scoring multiplies by time spent within 5m of terrain.

PARAGLIDER
A full 9-cell glider model with A, B, C brake lines mapped to left-right turn and pitch. Thermal columns are simulated dynamically based on the terrain's solar exposure (changes with time of day). Players can feel a thermal as a subtle upward acceleration and circle inside it to gain 400+ meters. Speed bar increases forward speed while flattening the glide ratio. Emergency manoeuvres (SIV: Suspension-In-Void) are learnable skills that allow advanced pilots to recover from asymmetric collapses.`,
  },
  {
    id: 'tricks',
    icon: '🤸',
    title: 'Trick & Combo System',
    content: `The trick system has three layers: execution, scoring, and expression.

EXECUTION
Tricks are broken into input phases: initiation (airborne requirement check), hold (correct stick position for a defined window), and release (timing window for clean landing). Missing the release window results in a sketchy landing that halves score. Landing in a switch stance grants a 1.5× bonus. Linking a trick directly into a natural feature (rock nose-press, tree stomp) doubles its value.

SCORING
Base score × style multiplier × combo multiplier × proximity multiplier × weather bonus.
Combo multiplier starts at 1× and adds 0.5 for each landed trick within a 6-second window. Dropping a trick (bailing, crashing, stopping) resets the combo to 0. The proximity multiplier is sport-specific—for wingsuit it's terrain proximity, for snowboard/ski it's trick-off-natural-features density. Weather bonuses are awarded during active blizzards (+20%) and aurora nights (+15%).

TRICK CATALOG (partial)
Snowboard: Ollie, Nollie, Method Grab, Mute Grab, Stalefish, Indy, Tailgrab, Cab, Switch Cab, 360–1440, Backside/Frontside spins, Rodeo, Misty Flip, Cork 5–10, Double Cork, Triple Cork, Nose Press, Tail Press, Blunt.
Ski: Safety, Mute, Truck Driver, Daffey, Japan, 360–1440, Flat Spin 360, Alley-Oop, Switch Rodeo, Bio, Double Bio, Lincoln Loop.
Wingsuit: Proximity Pass, Cliff Shave, Gap Thread, Wing Roll, Full Roll, Flare Out.
Paraglider: Wing-Over, SAT, Spiral Dive, Misty Flip (certified exit).

EXPRESSION
Players can record and upload custom trick sequences as Named Lines, visible as ghost overlays to all players in the region. A community voting system surfaces the most stylish and technical Named Lines to a weekly top 10.`,
  },
  {
    id: 'world',
    icon: '🌍',
    title: 'Open World Design',
    content: `The world is built on a 16-bit heightmap at 4m resolution, covering 500 km². Biome transitions are seamless—there is no moment where snow becomes volcanic rock; it blends over 2–3 km of mixed terrain.

REGION: THE SPINE OF EUROPE (Alps Core, 120 km²)
Altitude 800–4,808m. The main hub region accessible from level 1. Features groomed piste areas for beginners, a mid-mountain terrain park with jumps and rails, and an upper backcountry area with couloirs and seracs. The glacier bowl at 4,200m is the main snowboard/ski arena. A telepherique system provides fast travel to five zones within the region.

REGION: FREERIDE PEAK (45 km²)
Altitude 1,200–3,600m. Steep north-face descents up to 62°. Three legendary named lines: The Guillotine (800m of continuous cliff-banding), The Spine (narrow ridge requiring perfect edge control), and The Void (400m of free-falling cliff band mid-run). Locked until Level 10.

REGION: ARCTIC BOWL (80 km²)
Altitude 0–2,100m. Polar night cycles mean this region can spend 72 in-game hours in darkness. Navigation requires learning landmark silhouettes. Blizzard frequency is highest here (40% of in-game time). The aurora borealis appears during clear nights and triggers global community bonus events. Locked until Level 25.

REGION: VOLCANO RANGE (95 km²)
Altitude 400–3,776m. Obsidian snow on volcanic ash substrate has radically different friction physics—faster straight but ice-like on edges. Geothermal vents create powerful upward air currents ideal for paraglider altitude gain. Some slopes have melted channels requiring slalom technique. Locked until Level 18.

REGION: COASTAL CLIFFS (60 km²)
Altitude 0–2,100m. The vertical drop from cliff summit to ocean surface is the wingsuit arena. A 2.5-second free fall before wing deployment is mandatory. Proximity lines can thread sea stacks before pulling reserve and landing on a small beach. Unique mechanic: tide affects landing beach size. Locked until Level 30.

DYNAMIC WEATHER
Weather is a server-side simulation updated every real-world minute. States: Clear, Light Snow, Heavy Snow, Blizzard, Fog (3 density levels), Electrical Storm (wingsuit restricted), Aurora (paraglider bonus). Weather affects visibility, friction, air density (lift for paraglider/wingsuit), and trick score bonuses. Players receive a 90-second advance warning of approaching blizzards via in-game radio chatter.

TIME OF DAY
A full 24-hour cycle compressed to 2 real hours. Dawn (6–8 AM) provides the most dramatic lighting with long shadows and golden-hour glow on snow. Noon flattens the scene. Dusk creates orange-and-purple gradients ideal for highlight videos. Night reduces visibility but enables star-field rendering and aurora events.`,
  },
  {
    id: 'online',
    icon: '🤝',
    title: 'Online & Multiplayer',
    content: `GHOST SYSTEM
Every run generates a compressed ghost replay: 30Hz keyframe data including position, rotation, velocity, and animation state, stored as JSONB in the database. Ghosts are streamed as a secondary sprite in single-player sessions. Players can set any leaderboard ghost as a constant rival or challenge specific friends' ghosts.

FREERIDE SESSIONS (8 players)
Open-world co-op. All players share the same mountain instance. No objectives—pure social riding. Players appear as full character models. Chat is proximity-based (nearby players hear each other in real-time voice or text). Collaborative trick battles start when two players land within 50m and perform tricks—the one with the higher combo after 30 seconds wins a session score bonus.

RACE MODE (2–8 players)
A defined start gate and finish line. Players choose any sport. Cross-sport races balance by normalising top speed to terrain type—a wingsuit can reach a flat section faster but must deploy which takes 3 seconds, while a snowboarder can maintain edge speed through the deployment zone. Head-to-head only: no blue-shell mechanics.

TRICK BATTLE (2–4 players)
Takes place in a designated zone (terrain park, natural feature cluster). Each player gets 90 seconds of trick time. Scores accumulate. The player with the highest combo total at the end of the session wins. Spectators can vote for "Best Style" independently of score—style points count for 20% of final ranking.

EXPEDITIONS (2–4 players co-op)
Special story-adjacent challenges that require coordination: one player must wingsuit to a high ridge and drop a signal flare; a second player must paraglide to the flare location; a third must complete the ski descent in time. Rewards are expedition-exclusive cosmetics.`,
  },
  {
    id: 'progression',
    icon: '📈',
    title: 'Progression System',
    content: `PLAYER LEVEL (1–100)
XP from challenge completions, trick scores, distance ridden, secrets discovered, and social interactions. Level unlocks: gear slots (fully unlocked by Level 20), region access, challenge tiers, and cosmetic categories. Level is visible globally as a prestige indicator but never a gameplay gate within unlocked regions.

SPORT MASTERY (per sport, 1–50)
Separate mastery track per sport. Mastery improves trick input windows (easier to land), unlocks sport-specific challenges, and earns sport-exclusive cosmetics. At Mastery 50, a sport is "Certified"—the player's ghost appears in gold rather than white for that sport on leaderboards.

CHALLENGE MEDALS
Each challenge awards Bronze/Silver/Gold based on score thresholds. Gold on every challenge in a region unlocks a Platinum Regional Award with exclusive cosmetics. Full Platinum on all regions unlocks the "Summit King/Queen" title.

DAILY CHALLENGES
One rotating daily challenge per sport. 2× XP and bonus coins. A weekly "Expedition" challenge that spans multiple regions and requires 3+ hours of play to complete.

GEAR PROGRESSION
Four gear tiers: Standard, Pro, Elite, Signature. Each tier improves one of four stats: Speed, Agility, Stability, Airtime. Gear is cosmetically distinct per tier. Legendary gear has unique visual effects (particle trails, glow, sound design). No pay-to-win: premium currency purchases cosmetics only. All performance gear earns through gameplay.

SEASONAL EVENTS
Eight-week seasons with a free track (30 tiers) and a premium track (50 tiers). Seasonal cosmetics are exclusive to that season. Season-end global leaderboard determines titles for the following season.`,
  },
  {
    id: 'tech',
    icon: '💻',
    title: 'Technical Architecture',
    content: `RENDERING
Unreal Engine 5 (production target) with Nanite for geometric complexity: the mountain's 500 km² is fully detailed at player-proximity level without LOD pop-in. Lumen provides fully dynamic global illumination—the aurora borealis casts real coloured light on snow. Snow surface is rendered using a custom material that deforms procedurally under player contact (footprints, edge cuts, jump craters persist for 10 in-game minutes before being covered by new snowfall).

SNOW SIMULATION
The snow surface layer is a compute-shader grid at 1m resolution. Powder is modelled as a shallow compressible fluid; fresh powder under 20 cm compresses to base on impact. Wind redistributes surface powder in real time. Avalanche simulation is a safety-off feature in Extreme difficulty regions—a sustained path through a steep slope can trigger a flow that the player must outrun.

AUDIO
Binaural spatial audio with Unreal's MetaSounds system. Wind pitch scales with speed. Snow contact changes from a soft swish (powder) to a hard scrape (ice) based on the underlying surface shader. Trick audio: cloth flap during grabs, whoosh for rotations, stomp on landing. At 200+ km/h the wingsuit produces an authentic fabric-roar at 95 dB with wind noise masking most UI sounds.

NETWORK
WebSocket real-time position sync at 20 Hz for multiplayer sessions (Socket.io / Node.js). Ghost data streamed on request at 30 Hz. Server-side anti-cheat validates speed against physics model—speeds 15% above theoretical maximum are flagged. PostgreSQL stores all persistent data. Redis caches leaderboard top-100 per challenge (5-second TTL).

BACKEND STACK
Node.js + Express API · PostgreSQL 16 · Redis 7 · Socket.io · Python microservice for ghost replay compression (zstd) and anti-cheat physics validation.

CLIENT STACK  
React 18 + TypeScript UI shell · Three.js / @react-three/fiber 3D rendering for web concept · Zustand state management · Vite build system.

MOBILE / CONSOLE
The concept targets PS5, Xbox Series X, and PC as primary platforms. The React web client serves as the companion app: managing profile, viewing leaderboards, browsing the social feed, and configuring loadouts without launching the game.`,
  },
]

export default function GameConceptPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <button className="btn btn-ghost" style={{ marginBottom: '1rem' }} onClick={() => navigate(-1)}>← Back</button>

      <div className={styles.heroSection}>
        <div className={styles.heroTag}>GAME DESIGN DOCUMENT</div>
        <h1 className={`font-title ${styles.heroTitle}`}>
          PEAK<span className={styles.accent}>RUSH</span>
        </h1>
        <p className={styles.heroSub}>
          An original open-world extreme sports concept — four sports, five regions, 500 km² of seamless alpine terrain.
          Inspired by the genre of open-world mountain sports games.
        </p>
        <div className={styles.pillRow}>
          {['🏂 Snowboard', '⛷️ Ski', '🦅 Wingsuit', '🪂 Paraglider'].map(s => (
            <span key={s} className={styles.pill}>{s}</span>
          ))}
        </div>
      </div>

      {/* Table of contents */}
      <nav className={styles.toc}>
        <h3 className={styles.tocTitle}>Contents</h3>
        <div className={styles.tocLinks}>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className={styles.tocLink}>
              {s.icon} {s.title}
            </a>
          ))}
        </div>
      </nav>

      {/* Sections */}
      {SECTIONS.map(s => (
        <section key={s.id} id={s.id} className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>{s.icon}</span>
            <h2 className={`font-title ${styles.sectionTitle}`}>{s.title}</h2>
          </div>
          <div className={styles.sectionBody}>
            {s.content.split('\n\n').map((para, i) => {
              if (/^[A-Z][A-Z\s]+$/.test(para.split('\n')[0])) {
                const [heading, ...rest] = para.split('\n')
                return (
                  <div key={i}>
                    <h4 className={styles.subHeading}>{heading}</h4>
                    <p className={styles.para}>{rest.join('\n')}</p>
                  </div>
                )
              }
              return <p key={i} className={styles.para}>{para}</p>
            })}
          </div>
        </section>
      ))}

      <div className={styles.footer}>
        <button className="btn btn-primary" onClick={() => navigate('/auth?mode=register')}>
          🏔 Play the Web Demo
        </button>
      </div>
    </div>
  )
}
