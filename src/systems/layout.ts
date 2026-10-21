import { fbm2, mulberry32 } from './math'
import { projects } from '../content'

/**
 * World layout — single source of truth for where everything sits.
 * Scenes read positions from here, and Play Mode builds its colliders from the same data.
 */

export type V3 = [number, number, number]

export const ISLAND = {
  radius: 27,
  depth: 30,
  seed: 7,
}

/** Irregular island outline radius at a given angle. */
export function islandRadiusAt(angle: number) {
  const n = fbm2(Math.cos(angle) * 1.6 + 10, Math.sin(angle) * 1.6 + 10, 3)
  return ISLAND.radius * (0.86 + n * 0.28)
}

export const DISTRICTS = {
  plaza: { pos: [0, 0, 0] as V3, radius: 5 },
  projects: { center: [12, 0, 0] as V3, arcRadius: 16 },
  skills: { pos: [-13, 0, -11] as V3, radius: 6.2 },
  about: { pos: [-13, 0, 11.5] as V3, radius: 5.5 },
  windmill: { pos: [-21, 0, -1.5] as V3 },
  sign: { pos: [0, 0, -20.5] as V3 },
  pond: { pos: [-5, 0, 1] as V3 },
  finale: { pos: [30, 1.2, 31] as V3, radius: 7.5 },
  hidden: { pos: [4, -58, -6] as V3, radius: 6 },
}

/** River from the pond to the west edge, ending in the waterfall. */
/** Where the rope bridge leaves the main island, heading for the launch islet. */
export const BRIDGE_ANGLE = Math.atan2(31, 30)
export const BRIDGE_HEAD: V3 = [Math.cos(BRIDGE_ANGLE) * 22.5, 0, Math.sin(BRIDGE_ANGLE) * 22.5]

export const RIVER: V3[] = [
  [-6.5, 0, 1.2],
  [-10, 0, 0.4],
  [-14, 0, 0.8],
  [-17.5, 0, 2.6],
  [-21.5, 0, 3.2],
  [-25.6, 0, 3.4],
]

export interface ProjectSlot {
  id: string
  index: number
  pos: V3
  /** Y rotation so the building's screen faces the plaza. */
  rotY: number
  angle: number
  footprint: [number, number]
  height: number
  /** where the journey camera parks for this project (clear sightline guaranteed) */
  cam: V3
  camTarget: V3
}

const PROJECT_ANGLES = [-0.98, -0.33, 0.33, 0.98]

export const PROJECT_SLOTS: ProjectSlot[] = projects.slice(0, 4).map((p, i) => {
  const angle = PROJECT_ANGLES[i]
  const r = DISTRICTS.projects.arcRadius
  const pos: V3 = [Math.cos(angle) * r, 0, Math.sin(angle) * r]
  // building local +Z is its front; rotate so +Z points at the island centre
  const rotY = Math.atan2(-pos[0], -pos[2])
  const heights: Record<string, number> = { tower: 13, dome: 7.5, studio: 8, factory: 7 }
  const height = heights[p.building] ?? 8
  // look at the building's face from an oblique angle, far enough to frame all of it
  const dist = 8 + height * 0.8
  const phi = i % 2 === 0 ? -0.62 : 0.62
  const a = angle + Math.PI + phi
  const mid = height * 0.5
  const cam: V3 = [pos[0] + Math.cos(a) * dist, mid + 2.2, pos[2] + Math.sin(a) * dist]
  return { id: p.id, index: i, pos, rotY, angle, footprint: [5.2, 5.2], height, cam, camTarget: [pos[0], mid, pos[2]] }
})

/** Circles where procedural houses/trees must not spawn. */
const EXCLUSIONS: { x: number; z: number; r: number }[] = [
  { x: 0, z: 0, r: 6.2 },
  { x: DISTRICTS.skills.pos[0], z: DISTRICTS.skills.pos[2], r: 7.6 },
  { x: DISTRICTS.about.pos[0], z: DISTRICTS.about.pos[2], r: 6.8 },
  { x: DISTRICTS.windmill.pos[0], z: DISTRICTS.windmill.pos[2], r: 3.2 },
  { x: DISTRICTS.sign.pos[0], z: DISTRICTS.sign.pos[2], r: 6.5 },
  { x: DISTRICTS.pond.pos[0], z: DISTRICTS.pond.pos[2], r: 3.4 },
  { x: BRIDGE_HEAD[0], z: BRIDGE_HEAD[2], r: 4.5 }, // bridge head
  ...PROJECT_SLOTS.map((s) => ({ x: s.pos[0], z: s.pos[2], r: 5.4 })),
  // keep the camera's spot and its sightline to every project building clear
  ...PROJECT_SLOTS.map((s) => ({ x: s.cam[0], z: s.cam[2], r: 3.6 })),
  { x: -3, z: -1.5, r: 3.5 }, // skills camera
  { x: -6.5, z: 5.5, r: 3.8 }, // about camera
  ...PROJECT_SLOTS.flatMap((s) =>
    [0.15, 0.35, 0.55, 0.75, 1].map((t) => ({ x: s.cam[0] + (s.pos[0] - s.cam[0]) * t * 0.8, z: s.cam[2] + (s.pos[2] - s.cam[2]) * t * 0.8, r: 2.6 })),
  ),
]

function excluded(x: number, z: number, pad = 0) {
  for (const e of EXCLUSIONS) {
    const dx = x - e.x
    const dz = z - e.z
    if (dx * dx + dz * dz < (e.r + pad) * (e.r + pad)) return true
  }
  // river corridor
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, , az] = RIVER[i]
    const [bx, , bz] = RIVER[i + 1]
    const abx = bx - ax
    const abz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz)))
    const px = ax + abx * t - x
    const pz = az + abz * t - z
    if (px * px + pz * pz < (1.8 + pad) * (1.8 + pad)) return true
  }
  return false
}

function insideIsland(x: number, z: number, margin: number) {
  const a = Math.atan2(z, x)
  return Math.hypot(x, z) < islandRadiusAt(a) - margin
}

export interface HouseSpot {
  pos: V3
  rotY: number
  w: number
  d: number
  h: number
  roof: number
  color: number
}

export interface TreeSpot {
  pos: V3
  scale: number
  kind: number
}

function generateTown() {
  const rand = mulberry32(42)
  const houses: HouseSpot[] = []
  const trees: TreeSpot[] = []
  const occupied: { x: number; z: number; r: number }[] = []
  const free = (x: number, z: number, r: number) =>
    occupied.every((o) => (x - o.x) ** 2 + (z - o.z) ** 2 > (o.r + r) ** 2)

  // Houses: loose ring around the plaza plus the outer belt
  let attempts = 0
  while (houses.length < 22 && attempts < 3000) {
    attempts++
    const a = rand() * Math.PI * 2
    const r = 7 + rand() * 16
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (!insideIsland(x, z, 3.2) || excluded(x, z, 1.4) || !free(x, z, 2.4)) continue
    const w = 1.8 + rand() * 1.2
    const d = 1.8 + rand() * 1.0
    houses.push({
      pos: [x, 0, z],
      rotY: Math.atan2(-x, -z) + (rand() - 0.5) * 0.5,
      w,
      d,
      h: 1.4 + rand() * 1.6,
      roof: 0.9 + rand() * 0.6,
      color: Math.floor(rand() * 5),
    })
    occupied.push({ x, z, r: 2.1 })
  }

  attempts = 0
  while (trees.length < 90 && attempts < 6000) {
    attempts++
    const a = rand() * Math.PI * 2
    const r = 4 + Math.sqrt(rand()) * 22
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (!insideIsland(x, z, 1.2) || excluded(x, z, 0.2) || !free(x, z, 0.8)) continue
    trees.push({ pos: [x, 0, z], scale: 0.7 + rand() * 0.7, kind: rand() < 0.55 ? 0 : 1 })
    occupied.push({ x, z, r: 0.7 })
  }
  return { houses, trees }
}

export const TOWN = generateTown()

/** Street lamps along the paths from the plaza to each district. */
export const LAMPS: V3[] = (() => {
  const out: V3[] = []
  const targets: V3[] = [
    ...PROJECT_SLOTS.map((s) => [s.pos[0] * 0.7, 0, s.pos[2] * 0.7] as V3),
    DISTRICTS.skills.pos,
    DISTRICTS.about.pos,
    BRIDGE_HEAD,
  ]
  for (const t of targets) {
    const len = Math.hypot(t[0], t[2])
    const nx = t[0] / len
    const nz = t[2] / len
    const steps = Math.max(1, Math.floor((len - 6) / 5))
    for (let i = 1; i <= steps; i++) {
      const d = 6 + (i / steps) * (len - 8)
      const side = i % 2 === 0 ? 1 : -1
      out.push([nx * d - nz * 1.3 * side, 0, nz * d + nx * 1.3 * side])
    }
  }
  return out
})()

/** Paths from the plaza (drawn as flat ribbons). */
export const PATHS: V3[][] = [
  ...PROJECT_SLOTS.map((s) => [
    [0, 0, 0] as V3,
    [s.pos[0] * 0.5, 0, s.pos[2] * 0.5] as V3,
    [s.pos[0] * 0.78, 0, s.pos[2] * 0.78] as V3,
  ]),
  [[0, 0, 0], [-6, 0, -5], DISTRICTS.skills.pos],
  [[0, 0, 0], [-6, 0, 6], DISTRICTS.about.pos],
  [[0, 0, 0], [BRIDGE_HEAD[0] * 0.45 + 2, 0, BRIDGE_HEAD[2] * 0.45 - 1], [BRIDGE_HEAD[0] * 1.08, 0, BRIDGE_HEAD[2] * 1.08]],
  [[0, 0, 0], [0, 0, -10], [0, 0, -16]],
]

export interface IsletDef {
  pos: V3
  radius: number
  seed: number
  trees: number
  house?: boolean
}

export const ISLETS: IsletDef[] = [
  { pos: [-44, 7, -30], radius: 6, seed: 11, trees: 6, house: true },
  { pos: [40, 13, -34], radius: 4.5, seed: 12, trees: 4 },
  { pos: [48, -5, 16], radius: 6.5, seed: 13, trees: 7, house: true },
  { pos: [-50, -3, 22], radius: 4, seed: 14, trees: 3 },
  { pos: [24, 20, 58], radius: 3.5, seed: 15, trees: 2 },
  { pos: [-18, 16, -52], radius: 5, seed: 16, trees: 5 },
]

// ───────────────────────── Play Mode layout ─────────────────────────

export const SPAWN: V3 = [21, 6, 22]

export interface ShardSpot {
  id: string
  pos: V3
}

export const SHARD_SPOTS: V3[] = [
  [0, 3.2, 4.5], // plaza fountain
  [PROJECT_SLOTS[0].pos[0], PROJECT_SLOTS[0].height + 3, PROJECT_SLOTS[0].pos[2]], // tower roof
  [DISTRICTS.skills.pos[0], 8.5, DISTRICTS.skills.pos[2]], // tree crown
  [-25, -6, 3.4], // behind the waterfall
  [DISTRICTS.windmill.pos[0], 12, DISTRICTS.windmill.pos[2]], // windmill top
  [0, -37, 0], // under the island tip, by the crystals
  [-44, 12, -30], // west islet
  [48, 1, 16], // east islet
  [30, 9.5, 31], // rocket nose
  [DISTRICTS.about.pos[0], 6.5, DISTRICTS.about.pos[2]], // workshop roof
  [24, 24, 58], // far sky islet
  [DISTRICTS.hidden.pos[0], DISTRICTS.hidden.pos[1] + 4, DISTRICTS.hidden.pos[2]], // under the clouds
]

/**
 * Sky ring time-trial course, flown in order: a rolling loop around the island
 * that starts west of the launch islet and skips the arc where the drone spawns.
 */
export const RING_COURSE: { pos: V3; rotY: number }[] = Array.from({ length: 9 }, (_, i) => {
  const theta = ((95 + i * 35) * Math.PI) / 180
  const r = 36 + Math.sin(i * 1.7) * 3
  return {
    pos: [Math.cos(theta) * r, 9 + Math.sin(i * 1.3) * 6, Math.sin(theta) * r] as V3,
    // ring normal follows the loop's tangent (-sin θ, cos θ)
    rotY: Math.atan2(-Math.sin(theta), Math.cos(theta)),
  }
})

/** Bug hunt: bugs wander around these anchors. */
export const BUG_SPOTS: V3[] = [
  [14, 3, 14],
  [-8, 2, -16],
  [20, 9, -14],
  [-24, 4, 12],
  [6, 14, -6],
  [-36, 9, -26],
]

export const RUBBER_DUCK: V3 = [DISTRICTS.hidden.pos[0] + 1.6, DISTRICTS.hidden.pos[1] + 1.4, DISTRICTS.hidden.pos[2] - 1]

export const LAUNCH_PAD: V3 = [DISTRICTS.finale.pos[0], DISTRICTS.finale.pos[1], DISTRICTS.finale.pos[2]]
export const TERMINAL_POS: V3 = [DISTRICTS.finale.pos[0] + 3.6, DISTRICTS.finale.pos[1], DISTRICTS.finale.pos[2] - 1.2]

/** Static colliders for Play Mode — boxes and cylinders built from the layout above. */
export interface BoxCollider {
  kind: 'box'
  pos: V3
  half: V3
  rotY: number
}
export interface CylCollider {
  kind: 'cyl'
  pos: V3
  radius: number
  halfHeight: number
}
export type StaticCollider = BoxCollider | CylCollider

export function buildColliders(): StaticCollider[] {
  const out: StaticCollider[] = []
  out.push({ kind: 'cyl', pos: [0, -0.6, 0], radius: ISLAND.radius * 0.95, halfHeight: 0.6 })
  out.push({ kind: 'cyl', pos: [0, -6, 0], radius: ISLAND.radius * 0.72, halfHeight: 5 })
  out.push({ kind: 'cyl', pos: [0, -16, 0], radius: ISLAND.radius * 0.42, halfHeight: 6 })
  for (const s of PROJECT_SLOTS) {
    out.push({ kind: 'box', pos: [s.pos[0], s.height / 2, s.pos[2]], half: [2.7, s.height / 2, 2.7], rotY: s.rotY })
  }
  for (const h of TOWN.houses) {
    out.push({ kind: 'box', pos: [h.pos[0], (h.h + h.roof) / 2, h.pos[2]], half: [h.w / 2, (h.h + h.roof) / 2, h.d / 2], rotY: h.rotY })
  }
  out.push({ kind: 'cyl', pos: [DISTRICTS.windmill.pos[0], 4.5, DISTRICTS.windmill.pos[2]], radius: 1.6, halfHeight: 4.5 })
  out.push({ kind: 'cyl', pos: [DISTRICTS.skills.pos[0], 3.5, DISTRICTS.skills.pos[2]], radius: 0.8, halfHeight: 3.5 })
  out.push({ kind: 'box', pos: [DISTRICTS.about.pos[0], 0.2, DISTRICTS.about.pos[2]], half: [3.6, 0.2, 3.1], rotY: 0 })
  out.push({ kind: 'cyl', pos: [DISTRICTS.finale.pos[0], DISTRICTS.finale.pos[1] - 0.8, DISTRICTS.finale.pos[2]], radius: DISTRICTS.finale.radius * 0.9, halfHeight: 0.8 })
  out.push({ kind: 'cyl', pos: [LAUNCH_PAD[0], LAUNCH_PAD[1] + 3.5, LAUNCH_PAD[2]], radius: 0.9, halfHeight: 3.5 })
  for (const i of ISLETS) {
    out.push({ kind: 'cyl', pos: [i.pos[0], i.pos[1] - 0.6, i.pos[2]], radius: i.radius * 0.9, halfHeight: 0.6 })
    out.push({ kind: 'cyl', pos: [i.pos[0], i.pos[1] - 3.5, i.pos[2]], radius: i.radius * 0.5, halfHeight: 2.5 })
  }
  out.push({ kind: 'cyl', pos: [DISTRICTS.hidden.pos[0], DISTRICTS.hidden.pos[1] - 0.5, DISTRICTS.hidden.pos[2]], radius: DISTRICTS.hidden.radius, halfHeight: 0.5 })
  return out
}
