import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { islandGeometry, circleRadius } from './islandGeometry'
import { ISLAND, ISLETS, islandRadiusAt, type IsletDef } from '../../systems/layout'
import { crystalMat, vertexMat } from '../materials'
import { build, G } from '../../systems/geometry'
import { mulberry32 } from '../../systems/math'
import { treeGeometries } from './Town'

export function MainIsland() {
  const geo = useMemo(
    () => islandGeometry({ radiusAt: islandRadiusAt, depth: ISLAND.depth, seed: ISLAND.seed, segments: 84, rings: 10, layers: 9 }),
    [],
  )
  const crystals = useMemo(() => {
    const rand = mulberry32(5)
    const parts = []
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      const r = i === 0 ? 0 : 0.9 + rand() * 0.6
      const s = i === 0 ? 1.6 : 0.6 + rand() * 0.6
      parts.push({
        geo: G.octa(1),
        color: '#ffffff',
        pos: [Math.cos(a) * r, -ISLAND.depth * 1.02 - s * 0.8 - (i === 0 ? 0.6 : 0), Math.sin(a) * r] as [number, number, number],
        scale: [s * 0.55, s * 1.6, s * 0.55] as [number, number, number],
        rot: [rand() * 0.5, rand() * 3, rand() * 0.5] as [number, number, number],
      })
    }
    return build(parts, 0)
  }, [])
  const floaters = useRef<Group>(null)
  const rocks = useMemo(() => {
    const rand = mulberry32(8)
    return Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + rand()
      const r = 18 + rand() * 12
      return {
        pos: [Math.cos(a) * r, -8 - rand() * 14, Math.sin(a) * r] as [number, number, number],
        s: 0.8 + rand() * 1.6,
        rot: rand() * 3,
        speed: 0.3 + rand() * 0.4,
      }
    })
  }, [])
  const rockGeo = useMemo(() => build([{ geo: G.ico(1, 0), color: '#8a7266' }, { geo: G.ico(0.7, 0), color: '#86c765', pos: [0, 0.5, 0], scale: [1.1, 0.35, 1.1] }]), [])

  useFrame(({ clock }) => {
    const g = floaters.current
    if (!g) return
    const t = clock.elapsedTime
    g.children.forEach((c, i) => {
      c.position.y = rocks[i].pos[1] + Math.sin(t * rocks[i].speed + i) * 0.6
      c.rotation.y = rocks[i].rot + t * 0.05
    })
  })

  return (
    <group>
      <mesh geometry={geo} material={vertexMat} receiveShadow castShadow />
      <mesh geometry={crystals} material={crystalMat} />
      <group ref={floaters}>
        {rocks.map((r, i) => (
          <mesh key={i} geometry={rockGeo} material={vertexMat} position={r.pos} scale={r.s} castShadow />
        ))}
      </group>
    </group>
  )
}

function Islet({ def }: { def: IsletDef }) {
  const geo = useMemo(
    () => islandGeometry({ radiusAt: circleRadius(def.radius, def.seed), depth: def.radius * 1.5, seed: def.seed, segments: 28, rings: 4, layers: 5 }),
    [def],
  )
  const deco = useMemo(() => {
    const rand = mulberry32(def.seed * 31)
    const { round, pine } = treeGeometries()
    const parts: Parameters<typeof build>[0] = []
    for (let i = 0; i < def.trees; i++) {
      const a = rand() * Math.PI * 2
      const r = (0.25 + rand() * 0.5) * def.radius
      const s = 0.7 + rand() * 0.6
      parts.push({ geo: rand() > 0.5 ? round : pine, color: '#ffffff', pos: [Math.cos(a) * r, 0, Math.sin(a) * r], scale: s })
    }
    if (def.house) {
      parts.push({ geo: G.box(2, 1.8, 2), color: '#f3e3c3', pos: [0, 0.9, 0] })
      parts.push({ geo: G.gable(2.3, 1.2, 2.4), color: '#d9674e', pos: [0, 1.8, 0] })
      parts.push({ geo: G.box(0.5, 0.9, 0.06), color: '#7a5236', pos: [0, 0.45, 1.01] })
    }
    return build(parts, 0.02)
  }, [def])
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = def.pos[1] + Math.sin(clock.elapsedTime * 0.4 + def.seed) * 0.5
  })
  return (
    <group ref={ref} position={def.pos}>
      <mesh geometry={geo} material={vertexMat} receiveShadow />
      <mesh geometry={deco} material={vertexMat} castShadow />
    </group>
  )
}

export function Islets() {
  return (
    <>
      {ISLETS.map((d, i) => (
        <Islet key={i} def={d} />
      ))}
    </>
  )
}
