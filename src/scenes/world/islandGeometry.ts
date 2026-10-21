import { BufferAttribute, BufferGeometry, Color } from 'three'
import { fbm2, mulberry32 } from '../../systems/math'

/**
 * Procedural floating island: a faceted grassy top and a jagged, layered rock
 * underside that tapers to a point. Returns one vertex-coloured geometry.
 */

export interface IslandOptions {
  radiusAt: (angle: number) => number
  depth: number
  seed: number
  segments?: number
  rings?: number
  layers?: number
  grass?: string[]
  rock?: string[]
  /** Optional height function for the top surface (local x, z, normalised radius) */
  heightAt?: (x: number, z: number, rn: number) => number
}

const DEFAULT_GRASS = ['#8fcf6b', '#7cc25c', '#9bd977', '#86c765']
const DEFAULT_ROCK = ['#b8875f', '#a47c63', '#94807f', '#857587', '#786b86']

export function islandGeometry(opts: IslandOptions) {
  const segs = opts.segments ?? 72
  const rings = opts.rings ?? 9
  const layers = opts.layers ?? 8
  const grass = (opts.grass ?? DEFAULT_GRASS).map((c) => new Color(c))
  const rock = (opts.rock ?? DEFAULT_ROCK).map((c) => new Color(c))
  const dirt = new Color('#c9a26b')
  const rand = mulberry32(opts.seed)

  const positions: number[] = []
  const colors: number[] = []
  const tmp = new Color()

  const radii: number[] = []
  for (let s = 0; s < segs; s++) radii.push(opts.radiusAt((s / segs) * Math.PI * 2))

  const height = (x: number, z: number, rn: number) => {
    const base = opts.heightAt ? opts.heightAt(x, z, rn) : 0
    const edge = rn > 0.9 ? -Math.pow((rn - 0.9) / 0.1, 2) * 0.55 : 0
    return base + edge + (fbm2(x * 0.35 + opts.seed, z * 0.35, 2) - 0.5) * 0.12
  }

  // top surface vertices on a polar grid
  const top: [number, number, number][][] = []
  for (let r = 0; r <= rings; r++) {
    const ring: [number, number, number][] = []
    const rn = r / rings
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2
      const rad = radii[s] * rn
      const x = Math.cos(a) * rad
      const z = Math.sin(a) * rad
      ring.push([x, r === 0 ? height(0, 0, 0) : height(x, z, rn), z])
    }
    top.push(ring)
  }

  const pushTri = (a: number[], b: number[], c: number[], col: Color) => {
    positions.push(...a, ...b, ...c)
    for (let i = 0; i < 3; i++) colors.push(col.r, col.g, col.b)
  }

  const grassColor = (x: number, z: number, rn: number) => {
    const n = fbm2(x * 0.12 + 3, z * 0.12 - 7, 3)
    const idx = Math.min(grass.length - 1, Math.floor(n * grass.length * 1.2))
    tmp.copy(grass[Math.max(0, idx)])
    if (rn > 0.93) tmp.lerp(dirt, 0.55)
    const j = (rand() - 0.5) * 0.035
    tmp.r += j
    tmp.g += j
    tmp.b += j
    return tmp
  }

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const s1 = (s + 1) % segs
      const a = top[r][s]
      const b = top[r][s1]
      const c = top[r + 1][s]
      const d = top[r + 1][s1]
      const rn = (r + 0.5) / rings
      // counter-clockwise when seen from above (+Y)
      if (r === 0) {
        pushTri(a, d, c, grassColor(c[0], c[2], rn))
      } else {
        pushTri(a, d, c, grassColor(c[0], c[2], rn))
        pushTri(a, b, d, grassColor(b[0], b[2], rn))
      }
    }
  }

  // underside: layered rings shrinking to a tip
  const under: [number, number, number][][] = [top[rings]]
  const tip: [number, number, number] = [rand() * 0.6 - 0.3, -opts.depth * 1.05, rand() * 0.6 - 0.3]
  for (let l = 1; l < layers; l++) {
    const t = l / layers
    const ring: [number, number, number][] = []
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2
      const jag = 0.75 + rand() * 0.5
      const shrink = Math.pow(1 - t, 0.9) * jag
      const rad = radii[s] * shrink * (l === 1 ? 1.04 : 1)
      const y = -opts.depth * Math.pow(t, 1.15) * (0.85 + fbm2(Math.cos(a) * 2 + l, Math.sin(a) * 2, 2) * 0.35) - 0.6
      ring.push([Math.cos(a) * rad, y, Math.sin(a) * rad])
    }
    under.push(ring)
  }
  for (let l = 0; l < layers; l++) {
    const band = rock[Math.min(rock.length - 1, Math.floor((l / layers) * rock.length))]
    for (let s = 0; s < segs; s++) {
      const s1 = (s + 1) % segs
      const a = under[l][s]
      const b = under[l][s1]
      tmp.copy(band)
      const j = (rand() - 0.5) * 0.06
      tmp.r += j
      tmp.g += j
      tmp.b += j
      if (l === 0) tmp.lerp(dirt, 0.25)
      // outward-facing winding
      if (l === layers - 1) {
        pushTri(a, b, tip, tmp)
      } else {
        const c = under[l + 1][s]
        const d = under[l + 1][s1]
        pushTri(a, d, c, tmp)
        pushTri(a, b, d, tmp)
      }
    }
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geo.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  return geo
}

/** Simple wobbly circle radius for small islets */
export function circleRadius(radius: number, seed: number) {
  return (a: number) => radius * (0.85 + fbm2(Math.cos(a) * 1.3 + seed, Math.sin(a) * 1.3 + seed, 2) * 0.3)
}
