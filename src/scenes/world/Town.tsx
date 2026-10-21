import { useLayoutEffect, useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, InstancedMesh, Matrix4, Object3D, Vector3 } from 'three'
import { LAMPS, PATHS, TOWN, DISTRICTS } from '../../systems/layout'
import { build, G } from '../../systems/geometry'
import { bulbMat, vertexMat, windowMat } from '../materials'
import { mulberry32 } from '../../systems/math'
import { useStore } from '../../state/store'

const WALLS = ['#f6e7cb', '#f2d0a9', '#d3e6ea', '#f4cdc6', '#e7e0f3']
const ROOFS = ['#d9674e', '#4f7cac', '#3f8f7a', '#c2554a', '#8a63b0']

let treeCache: { round: BufferGeometry; pine: BufferGeometry } | null = null
export function treeGeometries() {
  if (treeCache) return treeCache
  const round = build([
    { geo: G.cyl(0.12, 0.18, 1.1, 6), color: '#8a5a3b', pos: [0, 0.55, 0] },
    { geo: G.ico(0.85, 0), color: '#6fbf5a', pos: [0, 1.65, 0] },
    { geo: G.ico(0.55, 0), color: '#86cf63', pos: [0.35, 2.1, 0.15] },
  ])
  const pine = build([
    { geo: G.cyl(0.1, 0.15, 0.8, 6), color: '#7a4f34', pos: [0, 0.4, 0] },
    { geo: G.cone(0.9, 1.5, 7), color: '#3f9a63', pos: [0, 1.35, 0] },
    { geo: G.cone(0.65, 1.2, 7), color: '#4fae6e', pos: [0, 2.1, 0] },
  ])
  treeCache = { round, pine }
  return treeCache
}

function Houses() {
  const bodies = useRef<InstancedMesh>(null)
  const roofs = useRef<InstancedMesh>(null)
  const windows = useRef<InstancedMesh>(null)
  const doors = useRef<InstancedMesh>(null)
  const chimneys = useRef<InstancedMesh>(null)

  const bodyGeo = useMemo(() => {
    const g = G.box(1, 1, 1)
    g.translate(0, 0.5, 0)
    return g
  }, [])
  const roofGeo = useMemo(() => G.gable(1, 1, 1), [])
  const winGeo = useMemo(() => G.box(0.34, 0.42, 0.08), [])
  const doorGeo = useMemo(() => G.box(0.5, 0.85, 0.08), [])
  const chimneyGeo = useMemo(() => G.box(0.3, 0.8, 0.3), [])

  const windowSpots = useMemo(() => {
    const rand = mulberry32(3)
    const out: { m: Matrix4; lit: boolean }[] = []
    const o = new Object3D()
    const parent = new Object3D()
    for (const h of TOWN.houses) {
      parent.position.set(...h.pos)
      parent.rotation.set(0, h.rotY, 0)
      parent.updateMatrix()
      const floors = h.h > 2.2 ? 2 : 1
      for (let f = 0; f < floors; f++) {
        const y = 0.75 + f * 1.0 + (floors === 1 ? 0.15 : 0)
        // front, skipping the door slot
        for (const x of [-h.w * 0.3, h.w * 0.3]) {
          o.position.set(x, y + (f === 0 ? 0.1 : 0), h.d / 2 + 0.01)
          o.rotation.set(0, 0, 0)
          o.updateMatrix()
          out.push({ m: new Matrix4().multiplyMatrices(parent.matrix, o.matrix), lit: rand() > 0.25 })
        }
        // sides
        for (const side of [-1, 1]) {
          o.position.set((side * h.w) / 2 + side * 0.01, y, 0)
          o.rotation.set(0, Math.PI / 2, 0)
          o.updateMatrix()
          out.push({ m: new Matrix4().multiplyMatrices(parent.matrix, o.matrix), lit: rand() > 0.4 })
        }
      }
    }
    return out
  }, [])

  useLayoutEffect(() => {
    const o = new Object3D()
    const c = new Color()
    TOWN.houses.forEach((h, i) => {
      o.position.set(...h.pos)
      o.rotation.set(0, h.rotY, 0)
      o.scale.set(h.w, h.h, h.d)
      o.updateMatrix()
      bodies.current!.setMatrixAt(i, o.matrix)
      bodies.current!.setColorAt(i, c.set(WALLS[h.color]))
      o.position.set(h.pos[0], h.h, h.pos[2])
      o.scale.set(h.w * 1.18, h.roof, h.d * 1.14)
      o.updateMatrix()
      roofs.current!.setMatrixAt(i, o.matrix)
      roofs.current!.setColorAt(i, c.set(ROOFS[(h.color + i) % ROOFS.length]))
      // door
      const parent = new Object3D()
      parent.position.set(...h.pos)
      parent.rotation.set(0, h.rotY, 0)
      parent.updateMatrix()
      const d = new Object3D()
      d.position.set(0, 0.42, h.d / 2 + 0.02)
      d.updateMatrix()
      doors.current!.setMatrixAt(i, new Matrix4().multiplyMatrices(parent.matrix, d.matrix))
      d.position.set(h.w * 0.25, h.h + h.roof * 0.55, -h.d * 0.15)
      d.updateMatrix()
      chimneys.current!.setMatrixAt(i, new Matrix4().multiplyMatrices(parent.matrix, d.matrix))
    })
    windowSpots.forEach((w, i) => {
      windows.current!.setMatrixAt(i, w.m)
      windows.current!.setColorAt(i, c.setScalar(w.lit ? 1 : 0.22))
    })
    for (const m of [bodies, roofs, windows, doors, chimneys]) {
      m.current!.instanceMatrix.needsUpdate = true
      if (m.current!.instanceColor) m.current!.instanceColor.needsUpdate = true
      m.current!.computeBoundingSphere()
    }
  }, [windowSpots])

  const n = TOWN.houses.length
  return (
    <group>
      <instancedMesh ref={bodies} args={[bodyGeo, undefined, n]} castShadow receiveShadow>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[roofGeo, undefined, n]} castShadow>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={doors} args={[doorGeo, undefined, n]}>
        <meshLambertMaterial color="#7a5236" />
      </instancedMesh>
      <instancedMesh ref={chimneys} args={[chimneyGeo, undefined, n]} castShadow>
        <meshLambertMaterial color="#b9a597" flatShading />
      </instancedMesh>
      <instancedMesh ref={windows} args={[winGeo, windowMat, windowSpots.length]} />
    </group>
  )
}

function Trees() {
  const round = useRef<InstancedMesh>(null)
  const pine = useRef<InstancedMesh>(null)
  const quality = useStore((s) => s.quality)
  const geos = useMemo(() => treeGeometries(), [])
  const list = useMemo(() => (quality === 'high' ? TOWN.trees : TOWN.trees.filter((_, i) => i % 3 !== 0)), [quality])
  const roundList = list.filter((t) => t.kind === 0)
  const pineList = list.filter((t) => t.kind === 1)

  useLayoutEffect(() => {
    const o = new Object3D()
    const c = new Color()
    const rand = mulberry32(17)
    const fill = (mesh: InstancedMesh | null, items: typeof list) => {
      if (!mesh) return
      items.forEach((t, i) => {
        o.position.set(...t.pos)
        o.rotation.set(0, rand() * Math.PI * 2, 0)
        o.scale.setScalar(t.scale)
        o.updateMatrix()
        mesh.setMatrixAt(i, o.matrix)
        const v = 0.85 + rand() * 0.25
        mesh.setColorAt(i, c.setRGB(v, v * (0.95 + rand() * 0.1), v * 0.95))
      })
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.computeBoundingSphere()
    }
    fill(round.current, roundList)
    fill(pine.current, pineList)
  }, [roundList, pineList])

  return (
    <>
      <instancedMesh key={`r${roundList.length}`} ref={round} args={[geos.round, vertexMat, roundList.length]} castShadow receiveShadow />
      <instancedMesh key={`p${pineList.length}`} ref={pine} args={[geos.pine, vertexMat, pineList.length]} castShadow receiveShadow />
    </>
  )
}

function Lamps() {
  const posts = useRef<InstancedMesh>(null)
  const heads = useRef<InstancedMesh>(null)
  const postGeo = useMemo(() => {
    const g = build([
      { geo: G.cyl(0.06, 0.09, 2.2, 6), color: '#3d3a48', pos: [0, 1.1, 0] },
      { geo: G.cyl(0.18, 0.22, 0.12, 6), color: '#3d3a48', pos: [0, 0.06, 0] },
      { geo: G.cone(0.24, 0.18, 6), color: '#3d3a48', pos: [0, 2.58, 0] },
    ])
    return g
  }, [])
  const headGeo = useMemo(() => G.ico(0.17, 0), [])
  useLayoutEffect(() => {
    const o = new Object3D()
    LAMPS.forEach((p, i) => {
      o.position.set(...p)
      o.updateMatrix()
      posts.current!.setMatrixAt(i, o.matrix)
      o.position.set(p[0], 2.36, p[2])
      o.updateMatrix()
      heads.current!.setMatrixAt(i, o.matrix)
    })
    posts.current!.instanceMatrix.needsUpdate = true
    heads.current!.instanceMatrix.needsUpdate = true
    posts.current!.computeBoundingSphere()
    heads.current!.computeBoundingSphere()
  }, [])
  return (
    <>
      <instancedMesh ref={posts} args={[postGeo, vertexMat, LAMPS.length]} castShadow />
      <instancedMesh ref={heads} args={[headGeo, bulbMat, LAMPS.length]} />
    </>
  )
}

/** Flat sandy ribbons along the paths + the paved plaza. */
function Paths() {
  const geo = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const sand = new Color('#e6cf9c')
    const edge = new Color('#d4b67e')
    const up = new Vector3(0, 1, 0)
    const pushQuad = (a: Vector3, b: Vector3, c: Vector3, d: Vector3, col: Color) => {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z)
      for (let i = 0; i < 6; i++) colors.push(col.r, col.g, col.b)
    }
    for (const path of PATHS) {
      const curve = new CatmullRomCurve3(path.map((p) => new Vector3(...p)))
      const steps = Math.ceil(curve.getLength() / 0.8)
      const pts = curve.getSpacedPoints(steps)
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i]
        const p1 = pts[i + 1]
        const dir = p1.clone().sub(p0).normalize()
        const side = new Vector3().crossVectors(dir, up).normalize()
        const w = 0.7
        const y = 0.045
        const a = p0.clone().addScaledVector(side, -w).setY(y)
        const b = p0.clone().addScaledVector(side, w).setY(y)
        const c = p1.clone().addScaledVector(side, -w).setY(y)
        const d = p1.clone().addScaledVector(side, w).setY(y)
        pushQuad(a, b, c, d, i % 2 ? sand : edge.clone().lerp(sand, 0.6))
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    g.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
    g.computeVertexNormals()
    return g
  }, [])

  const plaza = useMemo(
    () =>
      build(
        [
          { geo: G.cyl(DISTRICTS.plaza.radius, DISTRICTS.plaza.radius + 0.1, 0.12, 24), color: '#e2d5bd', pos: [0, 0.03, 0] },
          { geo: G.cyl(DISTRICTS.plaza.radius - 0.9, DISTRICTS.plaza.radius - 0.9, 0.13, 24), color: '#d1c1a3', pos: [0, 0.04, 0] },
          { geo: G.cyl(DISTRICTS.plaza.radius - 1.3, DISTRICTS.plaza.radius - 1.3, 0.14, 24), color: '#e8dcc6', pos: [0, 0.045, 0] },
        ],
        0.015,
      ),
    [],
  )

  return (
    <>
      <mesh geometry={geo} material={vertexMat} receiveShadow />
      <mesh geometry={plaza} material={vertexMat} receiveShadow />
    </>
  )
}

export function Town() {
  return (
    <group>
      <Paths />
      <Houses />
      <Trees />
      <Lamps />
    </group>
  )
}
