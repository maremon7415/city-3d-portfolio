import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3,
  Euler,
  TorusGeometry,
  OctahedronGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Tiny "procedural modelling kit". Parts are positioned, tinted via vertex colours and
 * merged into a single geometry, so a whole building is one draw call.
 */

export interface Part {
  geo: BufferGeometry
  color: string | number
  pos?: [number, number, number]
  rot?: [number, number, number]
  scale?: [number, number, number] | number
}

const tmpColor = new Color()
const m = new Matrix4()
const q = new Quaternion()
const e = new Euler()
const s = new Vector3()
const p = new Vector3()

export function colorize(geo: BufferGeometry, color: string | number, jitter = 0, seed = 1) {
  const g = geo.index ? geo.toNonIndexed() : geo
  const count = g.attributes.position.count
  const arr = new Float32Array(count * 3)
  tmpColor.set(color)
  let r = seed
  for (let i = 0; i < count; i += 3) {
    // per-face jitter gives the low-poly faceted look
    r = (r * 16807) % 2147483647
    const j = jitter ? ((r / 2147483647) - 0.5) * jitter : 0
    for (let k = 0; k < 3 && i + k < count; k++) {
      arr[(i + k) * 3] = Math.min(1, Math.max(0, tmpColor.r + j))
      arr[(i + k) * 3 + 1] = Math.min(1, Math.max(0, tmpColor.g + j))
      arr[(i + k) * 3 + 2] = Math.min(1, Math.max(0, tmpColor.b + j))
    }
  }
  g.setAttribute('color', new BufferAttribute(arr, 3))
  return g
}

export function build(parts: Part[], jitter = 0.03): BufferGeometry {
  const geos = parts.map((part, i) => {
    const g = colorize(part.geo.clone(), part.color, jitter, i + 3)
    const sc = part.scale ?? 1
    s.set(...(typeof sc === 'number' ? ([sc, sc, sc] as [number, number, number]) : sc))
    p.set(...(part.pos ?? [0, 0, 0]))
    q.setFromEuler(e.set(...(part.rot ?? [0, 0, 0])))
    m.compose(p, q, s)
    g.applyMatrix4(m)
    // drop uvs so every part has identical attributes
    g.deleteAttribute('uv')
    return g
  })
  const merged = mergeGeometries(geos, false)!
  merged.computeVertexNormals()
  merged.computeBoundingSphere()
  return merged
}

// Shared primitive shapes (low segment counts on purpose)
export const G = {
  box: (w = 1, h = 1, d = 1) => new BoxGeometry(w, h, d),
  cyl: (rt = 0.5, rb = 0.5, h = 1, seg = 8) => new CylinderGeometry(rt, rb, h, seg),
  cone: (r = 0.5, h = 1, seg = 6) => new ConeGeometry(r, h, seg),
  ico: (r = 0.5, detail = 0) => new IcosahedronGeometry(r, detail),
  sphere: (r = 0.5, w = 8, h = 6) => new SphereGeometry(r, w, h),
  torus: (r = 1, t = 0.1, rs = 6, ts = 16) => new TorusGeometry(r, t, rs, ts),
  octa: (r = 0.5) => new OctahedronGeometry(r, 0),
  /** 4-sided pyramid roof, base at y=0 */
  roof: (w: number, h: number, d: number) => {
    const g = new ConeGeometry(Math.SQRT1_2, 1, 4, 1)
    g.rotateY(Math.PI / 4)
    g.translate(0, 0.5, 0)
    g.scale(w, h, d)
    return g
  },
  /** gabled roof (triangular prism along Z), base at y=0, ridge at y=h */
  gable: (w: number, h: number, d: number) => {
    const g = new CylinderGeometry(0.5, 0.5, 1, 3, 1)
    g.rotateX(-Math.PI / 2)
    g.translate(0, 0.25, 0)
    g.scale(w / 0.866, h / 0.75, d)
    return g
  },
}

/** Make a geometry flat-shaded by un-indexing and recomputing normals. */
export function faceted(geo: BufferGeometry) {
  const g = geo.index ? geo.toNonIndexed() : geo
  g.computeVertexNormals()
  return g
}
