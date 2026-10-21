import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, IcosahedronGeometry, InstancedMesh, MeshLambertMaterial, Object3D } from 'three'
import { mulberry32 } from '../../systems/math'
import { env } from '../../systems/dayNight'
import { useStore } from '../../state/store'

/**
 * Low-poly clouds: a soft "cloud sea" far below the islands plus drifting clusters.
 * Two instanced meshes = two draw calls for every cloud in the sky.
 */
export function Clouds() {
  const quality = useStore((s) => s.quality)
  const sea = useRef<InstancedMesh>(null)
  const puffs = useRef<InstancedMesh>(null)
  const seaGroup = useRef<Object3D>(null)
  const puffGroup = useRef<Object3D>(null)

  const geo = useMemo(() => new IcosahedronGeometry(1, 1), [])
  const mat = useMemo(() => new MeshLambertMaterial({ color: '#ffffff', flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.12 }), [])
  const seaMat = useMemo(() => new MeshLambertMaterial({ color: '#ffffff', flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.18 }), [])

  const seaCount = quality === 'high' ? 220 : 110
  const clusterCount = quality === 'high' ? 22 : 12
  const puffPerCluster = 6

  useLayoutEffect(() => {
    const rand = mulberry32(99)
    const o = new Object3D()
    if (sea.current) {
      for (let i = 0; i < seaCount; i++) {
        const a = rand() * Math.PI * 2
        const r = 10 + Math.sqrt(rand()) * 190
        const s = 6 + rand() * 12
        o.position.set(Math.cos(a) * r, -40 - rand() * 6, Math.sin(a) * r)
        o.scale.set(s * 1.4, s * 0.45, s)
        o.rotation.set(0, rand() * Math.PI, 0)
        o.updateMatrix()
        sea.current.setMatrixAt(i, o.matrix)
      }
      sea.current.instanceMatrix.needsUpdate = true
    }
    if (puffs.current) {
      let k = 0
      for (let c = 0; c < clusterCount; c++) {
        const a = rand() * Math.PI * 2
        const r = 42 + rand() * 120
        const cy = -14 + rand() * 46
        const cx = Math.cos(a) * r
        const cz = Math.sin(a) * r
        const size = 2 + rand() * 3
        for (let p = 0; p < puffPerCluster; p++) {
          const s = size * (0.6 + rand() * 0.7)
          o.position.set(cx + (rand() - 0.5) * size * 3.4, cy + (rand() - 0.3) * size * 0.8, cz + (rand() - 0.5) * size * 1.6)
          o.scale.set(s * 1.3, s * 0.8, s)
          o.rotation.set(rand(), rand() * 3, 0)
          o.updateMatrix()
          puffs.current.setMatrixAt(k++, o.matrix)
        }
      }
      puffs.current.instanceMatrix.needsUpdate = true
    }
  }, [seaCount, clusterCount])

  const tint = useMemo(() => new Color(), [])
  useFrame((_, dt) => {
    if (seaGroup.current) seaGroup.current.rotation.y += dt * 0.004
    if (puffGroup.current) puffGroup.current.rotation.y += dt * 0.008
    // clouds pick up the horizon colour so they glow pink at dawn and go blue at night
    tint.copy(env.skyHorizon).lerp(env.fog, 0.5)
    mat.emissive.copy(tint)
    seaMat.emissive.copy(tint)
    mat.emissiveIntensity = 0.22 + env.night * 0.15
    seaMat.emissiveIntensity = 0.32 + env.night * 0.1
  })

  return (
    <>
      <group ref={seaGroup}>
        <instancedMesh ref={sea} args={[geo, seaMat, seaCount]} frustumCulled={false} />
      </group>
      <group ref={puffGroup}>
        <instancedMesh ref={puffs} args={[geo, mat, clusterCount * puffPerCluster]} frustumCulled={false} />
      </group>
    </>
  )
}
