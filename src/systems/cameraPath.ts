import { CatmullRomCurve3, Vector3 } from 'three'
import { journey } from './scroll'
import { DISTRICTS, PROJECT_SLOTS, type V3 } from './layout'
import { easeInOutCubic, invLerp, lerp } from './math'

/**
 * The cinematic camera path. Each keyframe either belongs to an HTML panel (`panel: true`,
 * the camera holds there and slowly drifts from pos → pos2 while the visitor reads),
 * or is a fly-through waypoint that only shapes the curve between panels.
 * `day` is the time of day at that keyframe: 0 dawn · 0.33 day · 0.66 sunset · 1 night.
 */

interface Keyframe {
  id: string
  panel: boolean
  pos: V3
  target: V3
  pos2?: V3
  target2?: V3
  day: number
}

function projectFrames(): Keyframe[] {
  return PROJECT_SLOTS.map((s, i) => {
    const [cx, cy, cz] = s.cam
    const [tx, ty, tz] = s.camTarget
    // slow push-in while the visitor reads
    const k = 0.1
    return {
      id: `project-${i}`,
      panel: true,
      pos: [cx, cy, cz] as V3,
      pos2: [cx + (tx - cx) * k, cy - 0.4, cz + (tz - cz) * k] as V3,
      target: [tx, ty, tz] as V3,
      target2: [tx, ty + 0.3, tz] as V3,
      day: 0.24 + i * 0.09,
    }
  })
}

const S = DISTRICTS.skills.pos
const A = DISTRICTS.about.pos
const F = DISTRICTS.finale.pos

export const KEYFRAMES: Keyframe[] = [
  {
    id: 'start',
    panel: true,
    pos: [-46, -7, 64],
    pos2: [-40, -2, 58],
    target: [-2, -6, 0],
    target2: [-2, -3, 0],
    day: 0,
  },
  { id: 'rise', panel: false, pos: [-14, 22, 40], target: [0, 0, 0], day: 0.1 },
  { id: 'overview', panel: false, pos: [2, 30, 18], target: [6, 0, -4], day: 0.17 },
  { id: 'approach', panel: false, pos: [2, 15, -27], target: [8, 5, -14], day: 0.21 },
  ...projectFrames(),
  { id: 'to-skills', panel: false, pos: [7, 15, 6], target: [-10, 3, -8], day: 0.58 },
  {
    id: 'skills',
    panel: true,
    pos: [-1.6, 8.6, -0.8],
    pos2: [-4.2, 6.6, -2.8],
    target: [S[0], 4.2, S[2]],
    target2: [S[0], 4.8, S[2]],
    day: 0.62,
  },
  { id: 'to-about', panel: false, pos: [-2, 9, 4], target: [-12, 2, 10], day: 0.7 },
  {
    id: 'about',
    panel: true,
    pos: [-6, 5.4, 4.6],
    pos2: [-7.6, 4.4, 6.6],
    target: [A[0], 1.6, A[2]],
    target2: [A[0] - 0.4, 1.8, A[2] + 0.2],
    day: 0.77,
  },
  { id: 'to-finale', panel: false, pos: [8, 15, 30], target: [24, 4, 28], day: 0.93 },
  {
    id: 'finale',
    panel: true,
    pos: [F[0] + 12, 6.5, F[2] + 13],
    pos2: [F[0] + 10.5, 4.6, F[2] + 14.5],
    target: [F[0] - 1.5, 5.2, F[2] - 1.5],
    target2: [F[0] - 2, 6.6, F[2] - 2],
    day: 1,
  },
]

interface ControlPoint {
  t: number
  pos: Vector3
  target: Vector3
  day: number
  /** first point of a panel hold */
  panelStart: boolean
  /** last point of a panel hold (same point as start when the hold has no drift) */
  panelEnd: boolean
}

let built = -1
let points: ControlPoint[] = []
let posCurve: CatmullRomCurve3
let targetCurve: CatmullRomCurve3

function build() {
  const out: ControlPoint[] = []
  // first pass: panel keyframes get their hold ranges from the DOM
  const ts: ({ start: number; end: number } | null)[] = KEYFRAMES.map((k) => (k.panel ? journey.stops.get(k.id) ?? null : null))
  // fallback: evenly spread if DOM isn't measured yet
  if (!ts.some(Boolean)) {
    KEYFRAMES.forEach((_, i) => {
      const v = i / (KEYFRAMES.length - 1)
      ts[i] = { start: v, end: v }
    })
  }
  // second pass: waypoints are spaced evenly in the gap between neighbouring panels
  for (let i = 0; i < KEYFRAMES.length; i++) {
    if (ts[i]) continue
    let a = i - 1
    while (a >= 0 && !(KEYFRAMES[a].panel && ts[a])) a--
    let b = i + 1
    while (b < KEYFRAMES.length && !(KEYFRAMES[b].panel && ts[b])) b++
    const from = a >= 0 ? ts[a]!.end : 0
    const to = b < KEYFRAMES.length ? ts[b]!.start : 1
    const count = b - a
    const v = from + ((to - from) * (i - a)) / count
    ts[i] = { start: v, end: v }
  }
  KEYFRAMES.forEach((k, i) => {
    const r = ts[i]!
    const paired = k.panel && r.end > r.start + 1e-4
    out.push({
      t: r.start,
      pos: new Vector3(...k.pos),
      target: new Vector3(...k.target),
      day: k.day,
      panelStart: k.panel,
      panelEnd: k.panel && !paired,
    })
    if (paired) {
      out.push({
        t: r.end,
        pos: new Vector3(...(k.pos2 ?? k.pos)),
        target: new Vector3(...(k.target2 ?? k.target)),
        day: k.day,
        panelStart: false,
        panelEnd: true,
      })
    }
  })
  points = out
  posCurve = new CatmullRomCurve3(out.map((p) => p.pos), false, 'centripetal', 0.5)
  targetCurve = new CatmullRomCurve3(out.map((p) => p.target), false, 'centripetal', 0.5)
  built = journey.version
}

/**
 * Sample the path at scroll progress `p`.
 * Travel between panels is eased as one continuous move; holds are linear drifts.
 */
export function sampleCamera(p: number, outPos: Vector3, outTarget: Vector3): number {
  if (built !== journey.version || !posCurve) build()
  const n = points.length
  if (p <= points[0].t) {
    outPos.copy(points[0].pos)
    outTarget.copy(points[0].target)
    return points[0].day
  }
  if (p >= points[n - 1].t) {
    outPos.copy(points[n - 1].pos)
    outTarget.copy(points[n - 1].target)
    return points[n - 1].day
  }
  // find the current segment
  let j = 0
  while (j < n - 2 && p > points[j + 1].t) j++
  const isHold = points[j].panelStart && !points[j].panelEnd
  let pe = p
  if (!isHold) {
    // find the full travel run [a, b] (panel end → next panel start) and ease across it
    let a = j
    while (a > 0 && !points[a].panelEnd) a--
    let b = j + 1
    while (b < n - 1 && !points[b].panelStart) b++
    const ta = points[a].t
    const tb = points[b].t
    const s = easeInOutCubic(invLerp(ta, tb, p))
    pe = lerp(ta, tb, s)
    j = a
    while (j < b - 1 && pe > points[j + 1].t) j++
  }
  const local = invLerp(points[j].t, points[j + 1].t, pe)
  const u = (j + local) / (n - 1)
  posCurve.getPoint(u, outPos)
  targetCurve.getPoint(u, outTarget)
  return lerp(points[j].day, points[j + 1].day, local)
}

export function stopRange(id: string) {
  return journey.stops.get(id)
}
