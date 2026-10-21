import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, DoubleSide, InstancedMesh, MeshLambertMaterial, Object3D } from 'three'
import { mulberry32 } from '../../systems/math'

/** A small flock circling the island — three instanced meshes, flapping wings. */
const COUNT = 9

function wingGeometry(side: 1 | -1) {
  const g = new BufferGeometry()
  // a single low-poly triangle, hinged at the body
  const v = new Float32Array([0, 0, 0.18, side * 0.9, 0, -0.05, 0, 0, -0.22])
  g.setAttribute('position', new BufferAttribute(v, 3))
  g.computeVertexNormals()
  return g
}

export function Birds() {
  const body = useRef<InstancedMesh>(null)
  const left = useRef<InstancedMesh>(null)
  const right = useRef<InstancedMesh>(null)
  const mat = useMemo(() => new MeshLambertMaterial({ color: '#3d3a52', side: DoubleSide, flatShading: true }), [])
  const geos = useMemo(() => {
    const b = new BufferGeometry()
    b.setAttribute('position', new BufferAttribute(new Float32Array([0, 0.06, 0.4, 0.1, 0, -0.3, -0.1, 0, -0.3, 0, -0.05, 0.4, 0.1, 0, -0.3, -0.1, 0, -0.3]), 3))
    b.computeVertexNormals()
    return { body: b, left: wingGeometry(1), right: wingGeometry(-1) }
  }, [])
  const birds = useMemo(() => {
    const r = mulberry32(77)
    return Array.from({ length: COUNT }, (_, i) => ({
      radius: 30 + r() * 14,
      height: 14 + r() * 12,
      speed: 0.08 + r() * 0.05,
      phase: (i / COUNT) * 0.9 + r() * 0.2,
      flap: 6 + r() * 3,
      bob: r() * 10,
    }))
  }, [])
  const o = useMemo(() => new Object3D(), [])
  const w = useMemo(() => new Object3D(), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    birds.forEach((b, i) => {
      const a = t * b.speed + b.phase
      o.position.set(Math.cos(a) * b.radius, b.height + Math.sin(t * 0.7 + b.bob) * 1.2, Math.sin(a) * b.radius + 6)
      // face along the circle's tangent
      o.rotation.set(0, -a, Math.sin(t * 0.5 + i) * 0.15)
      o.scale.setScalar(1.3)
      o.updateMatrix()
      body.current!.setMatrixAt(i, o.matrix)
      const flap = Math.sin(t * b.flap + i) * 0.7
      for (const [mesh, side] of [
        [left.current!, 1],
        [right.current!, -1],
      ] as const) {
        w.position.copy(o.position)
        w.rotation.copy(o.rotation)
        w.scale.copy(o.scale)
        w.rotateZ(flap * side)
        w.updateMatrix()
        mesh.setMatrixAt(i, w.matrix)
      }
    })
    for (const m of [body.current!, left.current!, right.current!]) m.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={body} args={[geos.body, mat, COUNT]} frustumCulled={false} />
      <instancedMesh ref={left} args={[geos.left, mat, COUNT]} frustumCulled={false} />
      <instancedMesh ref={right} args={[geos.right, mat, COUNT]} frustumCulled={false} />
    </>
  )
}
