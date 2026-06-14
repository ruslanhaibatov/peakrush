import { useRef, useCallback } from 'react'
import type { PhysicsState, SportCode } from '../types'

const SPORT_CONFIG: Record<SportCode, {
  maxSpeed: number
  acceleration: number
  drag: number
  turnRate: number
  jumpForce: number
  gravityMult: number
  liftCoeff: number
}> = {
  snowboard: {
    maxSpeed:     180,
    acceleration: 12,
    drag:         0.015,
    turnRate:     2.8,
    jumpForce:    8,
    gravityMult:  1.0,
    liftCoeff:    0,
  },
  ski: {
    maxSpeed:     220,
    acceleration: 15,
    drag:         0.010,
    turnRate:     3.2,
    jumpForce:    9,
    gravityMult:  0.95,
    liftCoeff:    0,
  },
  wingsuit: {
    maxSpeed:     300,
    acceleration: 4,
    drag:         0.008,
    turnRate:     1.5,
    jumpForce:    0,
    gravityMult:  0.25,
    liftCoeff:    0.72,
  },
  paraglider: {
    maxSpeed:     60,
    acceleration: 1,
    drag:         0.04,
    turnRate:     0.8,
    jumpForce:    0,
    gravityMult:  0.08,
    liftCoeff:    0.95,
  },
}

const GRAVITY = -9.81 * 3.6   // convert to km/h-ish units per frame
const TRICK_SCORE_BASE = 100

export interface InputState {
  left: boolean; right: boolean; up: boolean; down: boolean
  jump: boolean; trick1: boolean; trick2: boolean; trick3: boolean
  brake: boolean
}

export function usePhysicsEngine(sport: SportCode) {
  const stateRef = useRef<PhysicsState>({
    position:   [0, 1000, 0],
    velocity:   [0, 0, 0],
    rotation:   [0, 0, 0],
    speed:      0,
    airborne:   false,
    grounded:   true,
    trickActive: false,
    combo:       0,
    comboScore:  0,
  })

  const cfg = SPORT_CONFIG[sport]

  /**
   * Terrain height sample — in a real engine this queries a heightmap.
   * Here we use a procedural approximation for demonstration.
   */
  const sampleTerrain = useCallback((x: number, z: number): number => {
    // Fractal-ish terrain approximation
    const freq1 = 0.002, freq2 = 0.008, freq3 = 0.02
    return (
      800 * Math.sin(x * freq1) * Math.cos(z * freq1) +
      200 * Math.sin(x * freq2 + 1.3) * Math.cos(z * freq2) +
       60 * Math.sin(x * freq3 + 0.7) * Math.cos(z * freq3) +
      1200
    )
  }, [])

  const getSlopeAngle = useCallback((x: number, z: number): number => {
    const delta = 5
    const h0 = sampleTerrain(x, z)
    const hx = sampleTerrain(x + delta, z)
    const hz = sampleTerrain(x, z + delta)
    const dxdy = (hx - h0) / delta
    const dzdy = (hz - h0) / delta
    return Math.atan(Math.sqrt(dxdy * dxdy + dzdy * dzdy)) // radians
  }, [sampleTerrain])

  const update = useCallback((input: InputState, dt: number): PhysicsState => {
    const s = stateRef.current
    const [px, py, pz] = s.position
    const [vx, vy, vz] = s.velocity
    const [rx, ry, rz] = s.rotation

    const terrainY = sampleTerrain(px, pz)
    const onGround  = py <= terrainY + 0.5
    const slope     = getSlopeAngle(px, pz)

    let nvx = vx, nvy = vy, nvz = vz
    let nry = ry

    // ── Turning ────────────────────────────────────────────────────────────────
    if (input.left)  nry -= cfg.turnRate * dt
    if (input.right) nry += cfg.turnRate * dt

    // ── Direction vectors ──────────────────────────────────────────────────────
    const dirX = Math.sin(nry)
    const dirZ = Math.cos(nry)

    // ── Slope-based acceleration ───────────────────────────────────────────────
    const slopeAccel = onGround
      ? cfg.acceleration * Math.sin(slope) * (input.down ? 1.5 : 1)
      : 0

    if (onGround) {
      nvx += dirX * slopeAccel * dt
      nvz += dirZ * slopeAccel * dt
    }

    // ── Brake ─────────────────────────────────────────────────────────────────
    if (input.brake && onGround) {
      nvx *= 0.88
      nvz *= 0.88
    }

    // ── Aerodynamic drag ──────────────────────────────────────────────────────
    const spd = Math.sqrt(nvx * nvx + nvz * nvz)
    const drag = cfg.drag * spd * spd
    if (spd > 0) {
      nvx -= (nvx / spd) * drag * dt
      nvz -= (nvz / spd) * drag * dt
    }

    // ── Speed cap ─────────────────────────────────────────────────────────────
    const horizSpd = Math.sqrt(nvx * nvx + nvz * nvz)
    if (horizSpd > cfg.maxSpeed / 3.6) {
      const scale = (cfg.maxSpeed / 3.6) / horizSpd
      nvx *= scale; nvz *= scale
    }

    // ── Jump ──────────────────────────────────────────────────────────────────
    if (input.jump && onGround && cfg.jumpForce > 0) {
      nvy = cfg.jumpForce * (1 + slope * 2)
    }

    // ── Gravity & lift ────────────────────────────────────────────────────────
    if (!onGround) {
      nvy += GRAVITY * cfg.gravityMult * dt
      // Wingsuit / paraglider lift
      if (cfg.liftCoeff > 0) {
        const liftForce = horizSpd * cfg.liftCoeff * (input.up ? 1.2 : 1.0)
        nvy += liftForce * dt
      }
    } else {
      nvy = Math.max(0, nvy)
    }

    // ── Integrate position ────────────────────────────────────────────────────
    let npx = px + nvx * dt
    let npy = py + nvy * dt
    let npz = pz + nvz * dt

    // Clamp to terrain
    const newTerrainY = sampleTerrain(npx, npz)
    if (npy < newTerrainY) {
      npy = newTerrainY
      nvy = 0
    }

    // ── Trick detection ───────────────────────────────────────────────────────
    let trickActive = s.trickActive
    let combo = s.combo
    let comboScore = s.comboScore

    const airborne = npy > newTerrainY + 1.5

    if (airborne && (input.trick1 || input.trick2 || input.trick3)) {
      trickActive = true
      const score = TRICK_SCORE_BASE * (1 + combo * 0.5)
      combo += 1
      comboScore += score
    }
    if (!airborne && s.airborne) {
      // Just landed
      trickActive = false
      if (!input.trick1 && !input.trick2 && !input.trick3) {
        combo = Math.max(0, combo - 1)
      }
    }

    // ── Roll tilt based on turn ────────────────────────────────────────────────
    const targetRoll = (input.left ? -1 : input.right ? 1 : 0) * 0.25
    const nrz = rz + (targetRoll - rz) * 8 * dt

    const finalSpeed = Math.sqrt(nvx * nvx + nvy * nvy + nvz * nvz) * 3.6 // to km/h

    const next: PhysicsState = {
      position:   [npx, npy, npz],
      velocity:   [nvx, nvy, nvz],
      rotation:   [rx, nry, nrz],
      speed:      finalSpeed,
      airborne,
      grounded:   !airborne,
      trickActive,
      combo,
      comboScore,
    }

    stateRef.current = next
    return next
  }, [cfg, sampleTerrain, getSlopeAngle])

  const reset = useCallback((spawnPos?: [number, number, number]) => {
    const pos = spawnPos || [0, sampleTerrain(0, 0) + 5, 0]
    stateRef.current = {
      position:   pos,
      velocity:   [0, 0, 0],
      rotation:   [0, 0, 0],
      speed:      0,
      airborne:   false,
      grounded:   true,
      trickActive: false,
      combo:       0,
      comboScore:  0,
    }
  }, [sampleTerrain])

  return { update, reset, state: stateRef }
}
