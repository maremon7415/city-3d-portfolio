import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, InstancedMesh, Object3D, Vector3, type Group } from 'three'
import { BRIDGE_HEAD, DISTRICTS } from '../../systems/layout'
import { build, G } from '../../systems/geometry'
import { bulbMat, signMat, vertexMat } from '../materials'
import { textToBlocks } from './pixelFont'
import { profile } from '../../content'
import { live } from '../../state/store'
import { islandGeometry, circleRadius } from '../world/islandGeometry'

/** Voxel name sign on a grassy mound at the north edge — the intro hero shot. */
function NameSign() {
  const blocksRef = useRef<InstancedMesh>(null)
  const bulbs = useRef<InstancedMesh>(null)
  const group = useRef<Group>(null)
  const { blocks } = useMemo(() => textToBlocks(profile.sign), [])
  const size = 0.62
  const blockGeo = useMemo(() => G.box(size * 0.94, size * 0.94, size * 1.1), [])
  const bulbGeo = useMemo(() => G.ico(0.09, 0), [])
  const mound = useMemo(
    () =>
      build(
        [
          { geo: G.cyl(5.5, 7.5, 1.4, 12), color: '#86c765', pos: [0, 0.2, 0] },
          { geo: G.cyl(3.6, 5.5, 0.8, 12), color: '#7cc25c', pos: [0, 1.2, -0.4] },
        ],
        0.05,
      ),
    [],
  )
  const posts = useMemo(() => {
    const parts: Parameters<typeof build>[0] = []
    const w = textToBlocks(profile.sign).width * size
    for (let x = -w / 2 + 0.6; x <= w / 2; x += w / 4) {
      parts.push({ geo: G.box(0.14, 2.4, 0.14), color: '#6b4f3a', pos: [x, 1.2, -0.55] })
    }
    parts.push({ geo: G.box(w + 0.6, 0.14, 0.14), color: '#6b4f3a', pos: [0, 1.6, -0.55] })
    return build(parts)
  }, [])

  useLayoutEffect(() => {
    const o = new Object3D()
    blocks.forEach(([x, y], i) => {
      o.position.set(x * size, y * size + size / 2, 0)
      o.updateMatrix()
      blocksRef.current!.setMatrixAt(i, o.matrix)
      o.position.set(x * size, y * size + size / 2, size * 0.58)
      o.updateMatrix()
      bulbs.current!.setMatrixAt(i, o.matrix)
    })
    blocksRef.current!.instanceMatrix.needsUpdate = true
    bulbs.current!.instanceMatrix.needsUpdate = true
    blocksRef.current!.computeBoundingSphere()
    bulbs.current!.computeBoundingSphere()
  }, [blocks])

  // letters pop up one by one as the visitor takes off
  useFrame(() => {
    const t = Math.min(1, live.progress * 30 + 0.35)
    if (group.current) group.current.scale.y = 0.0001 + t
  })

  const p = DISTRICTS.sign.pos
  return (
    <group position={p}>
      <mesh geometry={mound} material={vertexMat} receiveShadow castShadow />
      <group position={[0, 1.6, 0]} rotation-x={-0.12}>
        <group ref={group}>
          <instancedMesh ref={blocksRef} args={[blockGeo, signMat, blocks.length]} castShadow />
          <instancedMesh ref={bulbs} args={[bulbGeo, bulbMat, blocks.length]} />
        </group>
        <mesh geometry={posts} material={vertexMat} />
      </group>
    </group>
  )
}

function Windmill() {
  const blades = useRef<Group>(null)
  const body = useMemo(
    () =>
      build([
        { geo: G.cyl(1.0, 1.6, 6.5, 8), color: '#f3ead8', pos: [0, 3.25, 0] },
        { geo: G.cyl(1.7, 1.75, 0.5, 8), color: '#b9a597', pos: [0, 0.25, 0] },
        { geo: G.cone(1.35, 1.8, 8), color: '#c2554a', pos: [0, 7.4, 0] },
        { geo: G.box(0.7, 1.2, 0.1), color: '#7a5236', pos: [0, 0.9, 1.5], rot: [0.1, 0, 0] },
        { geo: G.box(0.45, 0.55, 0.08), color: '#2f4a66', pos: [0, 4.2, 1.25], rot: [0.08, 0, 0] },
        { geo: G.box(0.4, 0.4, 1.3), color: '#7a5236', pos: [0, 6.6, 1.2] },
      ]),
    [],
  )
  const bladeGeo = useMemo(() => {
    const parts: Parameters<typeof build>[0] = []
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2
      parts.push({ geo: G.box(0.18, 4.2, 0.08), color: '#7a5236', pos: [Math.sin(a) * 2.1, Math.cos(a) * 2.1, 0], rot: [0, 0, -a] })
      parts.push({ geo: G.box(0.9, 3.3, 0.04), color: '#f6efe2', pos: [Math.sin(a) * 2.4 + Math.cos(a) * 0.5, Math.cos(a) * 2.4 - Math.sin(a) * 0.5, 0.04], rot: [0, 0, -a] })
    }
    parts.push({ geo: G.cyl(0.3, 0.3, 0.3, 8), color: '#5a4030', rot: [Math.PI / 2, 0, 0] })
    return build(parts)
  }, [])
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * (0.6 + live.velocity * 3)
  })
  const p = DISTRICTS.windmill.pos
  return (
    <group position={p} rotation-y={-Math.PI / 2 + 0.5}>
      <mesh geometry={body} material={vertexMat} castShadow receiveShadow />
      <group ref={blades} position={[0, 6.6, 1.95]}>
        <mesh geometry={bladeGeo} material={vertexMat} castShadow />
      </group>
    </group>
  )
}

function Fountain() {
  const spray = useRef<Group>(null)
  const geo = useMemo(
    () =>
      build([
        { geo: G.cyl(2.0, 2.1, 0.6, 12), color: '#d8cbb2', pos: [0, 0.3, 0] },
        { geo: G.cyl(1.75, 1.75, 0.62, 12), color: '#4fb3e0', pos: [0, 0.33, 0] },
        { geo: G.cyl(0.25, 0.35, 1.6, 8), color: '#d8cbb2', pos: [0, 1.0, 0] },
        { geo: G.cyl(0.85, 0.4, 0.3, 10), color: '#d8cbb2', pos: [0, 1.85, 0] },
        { geo: G.cyl(0.7, 0.7, 0.31, 10), color: '#6cc6ec', pos: [0, 1.88, 0] },
      ]),
    [],
  )
  useFrame(({ clock }) => {
    const g = spray.current
    if (!g) return
    const t = clock.elapsedTime
    g.children.forEach((c, i) => {
      const k = (t * 0.8 + i / g.children.length) % 1
      const a = (i / g.children.length) * Math.PI * 2
      c.position.set(Math.cos(a) * k * 1.1, 2.1 + Math.sin(k * Math.PI) * 0.9 - k * 0.6, Math.sin(a) * k * 1.1)
      c.scale.setScalar(1 - k * 0.6)
    })
  })
  return (
    <group position={DISTRICTS.plaza.pos}>
      <mesh geometry={geo} material={vertexMat} castShadow receiveShadow />
      <group ref={spray}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i}>
            <icosahedronGeometry args={[0.09, 0]} />
            <meshBasicMaterial color="#d9f5ff" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Rope bridge from the south edge to the launch islet. */
function Bridge() {
  const planks = useRef<InstancedMesh>(null)
  const f = DISTRICTS.finale
  const dir = new Vector3(f.pos[0], 0, f.pos[2]).normalize()
  const from = new Vector3(BRIDGE_HEAD[0], -0.2, BRIDGE_HEAD[2])
  const to = new Vector3(f.pos[0], f.pos[1] - 0.2, f.pos[2]).addScaledVector(dir, -(f.radius - 1.4))
  const count = 22
  const curve = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5)
    mid.y -= 1.2
    return new CatmullRomCurve3([from, mid, to])
  }, [])
  const ropes = useMemo(() => {
    const parts: Parameters<typeof build>[0] = []
    for (const side of [-0.85, 0.85]) {
      const pts = curve.getPoints(16).map((p) => p.clone().add(new Vector3(-dir.z * side, 0.9, dir.x * side)))
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]
        const b = pts[i + 1]
        const mid = a.clone().lerp(b, 0.5)
        const len = a.distanceTo(b)
        const o = new Object3D()
        o.position.copy(mid)
        o.lookAt(b)
        o.rotateX(Math.PI / 2)
        parts.push({ geo: G.cyl(0.035, 0.035, len, 4), color: '#c9a979', pos: [mid.x, mid.y, mid.z], rot: [o.rotation.x, o.rotation.y, o.rotation.z] })
      }
      for (const t of [0, 1]) {
        const p = curve.getPoint(t)
        parts.push({ geo: G.cyl(0.1, 0.12, 1.4, 6), color: '#6b4f3a', pos: [p.x - dir.z * side, p.y + 0.5, p.z + dir.x * side] })
      }
    }
    return build(parts)
  }, [curve])
  useLayoutEffect(() => {
    const o = new Object3D()
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count
      const p = curve.getPoint(t)
      const tan = curve.getTangent(t)
      o.position.copy(p)
      o.lookAt(p.clone().add(tan))
      o.rotateZ((i % 3) * 0.02 - 0.02)
      o.updateMatrix()
      planks.current!.setMatrixAt(i, o.matrix)
    }
    planks.current!.instanceMatrix.needsUpdate = true
    planks.current!.computeBoundingSphere()
  }, [curve])
  const plankGeo = useMemo(() => build([{ geo: G.box(1.7, 0.1, 0.42), color: '#a4774f' }]), [])
  return (
    <group>
      <instancedMesh ref={planks} args={[plankGeo, vertexMat, count]} castShadow receiveShadow />
      <mesh geometry={ropes} material={vertexMat} />
    </group>
  )
}

/** The launch islet that the bridge leads to (rocket + terminal sit on top, see Finale). */
function LaunchIslet() {
  const f = DISTRICTS.finale
  const geo = useMemo(() => islandGeometry({ radiusAt: circleRadius(f.radius, 21), depth: 12, seed: 21, segments: 36, rings: 5, layers: 6 }), [])
  return <mesh geometry={geo} material={vertexMat} position={[f.pos[0], f.pos[1], f.pos[2]]} receiveShadow castShadow />
}

export function Landmarks() {
  return (
    <>
      <NameSign />
      <Windmill />
      <Fountain />
      <Bridge />
      <LaunchIslet />
    </>
  )
}
