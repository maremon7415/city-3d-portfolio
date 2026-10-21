import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Color, InstancedMesh, MeshBasicMaterial, Object3D, Vector3 } from 'three'
import { skillGroups } from '../../content'
import { DISTRICTS } from '../../systems/layout'
import { build, G, type Part } from '../../systems/geometry'
import { vertexMat } from '../materials'
import { live, useStore } from '../../state/store'
import { clamp, damp, smoothstep } from '../../systems/math'

/**
 * Skills chapter: a "circuit tree". Each skill group is a branch, each skill a glowing
 * node. Copper traces on the circuit-board platform feed energy into the trunk, and
 * nodes light up one by one as the visitor scrolls through the chapter.
 */

const TOTAL = skillGroups.reduce((a, g) => a + g.skills.length, 0)

interface Node {
  name: string
  group: number
  color: string
  level: number
  pos: Vector3
  /** ground trace endpoint */
  edge: Vector3
  order: number
}

function layoutNodes() {
  const nodes: Node[] = []
  const G2 = skillGroups.length
  let order = 0
  skillGroups.forEach((g, gi) => {
    const a = (gi / G2) * Math.PI * 2 + 0.4
    const n = g.skills.length
    g.skills.forEach((s, si) => {
      const spread = (si - (n - 1) / 2) * 0.5
      const ang = a + spread
      const r = 2.5 + (si % 2) * 1.1
      const y = 4.7 + si * 0.45 + (si % 2) * 0.4
      nodes.push({
        name: s.name,
        group: gi,
        color: g.color,
        level: s.level,
        pos: new Vector3(Math.cos(ang) * r, y, Math.sin(ang) * r),
        edge: new Vector3(Math.cos(ang) * 5.7, 0.52, Math.sin(ang) * 5.7),
        order: order++,
      })
    })
  })
  return nodes
}

export function SkillsGarden() {
  const nodes = useMemo(layoutNodes, [])
  const nodeMesh = useRef<InstancedMesh>(null)
  const pulseMesh = useRef<InstancedMesh>(null)
  const traceMesh = useRef<InstancedMesh>(null)
  const chapter = useStore((s) => s.chapter)
  const mode = useStore((s) => s.mode)
  const labelsVisible = mode === 'journey' && chapter === 2

  const base = useMemo(() => {
    const parts: Part[] = [
      { geo: G.cyl(6.3, 6.6, 0.5, 24), color: '#b9a597', pos: [0, 0.25, 0] },
      { geo: G.cyl(6.0, 6.0, 0.06, 24), color: '#1d4a45', pos: [0, 0.52, 0] },
      // trunk
      { geo: G.cyl(0.45, 0.85, 4.4, 7), color: '#7a5236', pos: [0, 2.7, 0] },
      { geo: G.cyl(0.9, 1.2, 0.5, 7), color: '#6b4f3a', pos: [0, 0.75, 0] },
    ]
    // chips around the rim
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2
      parts.push({ geo: G.box(0.9, 0.18, 0.6), color: '#222831', pos: [Math.cos(a) * 4.4, 0.62, Math.sin(a) * 4.4], rot: [0, -a, 0] })
    }
    return build(parts)
  }, [])

  const branches = useMemo(() => {
    const parts: Part[] = []
    const top = new Vector3(0, 4.6, 0)
    for (const n of nodes) {
      const dir = n.pos.clone().sub(top)
      const len = dir.length()
      const mid = top.clone().addScaledVector(dir, 0.5)
      const o = new Object3D()
      o.position.copy(mid)
      o.lookAt(n.pos)
      o.rotateX(Math.PI / 2)
      parts.push({ geo: G.cyl(0.07, 0.16, len, 5), color: '#80583c', pos: [mid.x, mid.y, mid.z], rot: [o.rotation.x, o.rotation.y, o.rotation.z] })
    }
    return build(parts)
  }, [nodes])

  const nodeMat = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), [])
  const traceMat = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), [])
  const pulseMat = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), [])
  const nodeGeo = useMemo(() => G.ico(0.3, 0), [])
  const traceGeo = useMemo(() => G.box(1, 0.04, 0.1), [])
  const pulseGeo = useMemo(() => G.ico(0.09, 0), [])

  // traces: each is a box from trunk base to the rim, oriented along its angle
  useLayoutEffect(() => {
    const o = new Object3D()
    nodes.forEach((n, i) => {
      const from = new Vector3(n.edge.x * 0.18, 0.56, n.edge.z * 0.18)
      const mid = from.clone().lerp(n.edge, 0.5)
      o.position.copy(mid)
      o.rotation.set(0, -Math.atan2(n.edge.z, n.edge.x), 0)
      o.scale.set(from.distanceTo(n.edge), 1, 1)
      o.updateMatrix()
      traceMesh.current!.setMatrixAt(i, o.matrix)
    })
    traceMesh.current!.instanceMatrix.needsUpdate = true
    traceMesh.current!.computeBoundingSphere()
  }, [nodes])

  const lit = useRef(nodes.map(() => 0))
  // label DOM nodes live in drei <Html> portals (outside the R3F tree), so we drive them from here
  const labelEls = useRef<(HTMLDivElement | null)[]>([])
  const tmpObj = useMemo(() => new Object3D(), [])
  const c = useMemo(() => new Color(), [])
  const dim = useMemo(() => new Color('#3a3f52'), [])
  const copper = useMemo(() => new Color('#a8743f'), [])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const ct = mode === 'play' ? 1 : live.chapterT.skills ?? 0
    nodes.forEach((n, i) => {
      // stagger: the chapter's first ~70% of scroll lights every node in order
      const threshold = (n.order / nodes.length) * 0.6 + 0.02
      const target = ct > threshold ? 1 : 0
      lit.current[i] += (target - lit.current[i]) * damp(6, dt)
      const k = clamp(lit.current[i])
      const s = (0.5 + n.level * 0.6) * (0.55 + k * 0.45) * (1 + Math.sin(t * 3 + i) * 0.05 * k)
      tmpObj.position.copy(n.pos)
      tmpObj.position.y += Math.sin(t * 1.2 + i) * 0.06
      tmpObj.rotation.set(t * 0.4 + i, t * 0.3, 0)
      tmpObj.scale.setScalar(s)
      tmpObj.updateMatrix()
      nodeMesh.current!.setMatrixAt(i, tmpObj.matrix)
      c.set(n.color).multiplyScalar(0.55 + k * 1.25)
      nodeMesh.current!.setColorAt(i, c.lerp(dim, 1 - k))
      c.set(n.color).multiplyScalar(1.8)
      traceMesh.current!.setColorAt(i, c.lerp(copper, 1 - k))
      // energy pulse travels from the rim to the trunk along lit traces
      const p = (t * 0.5 + i * 0.37) % 1
      tmpObj.position.set(n.edge.x * (1 - p * 0.82), 0.6, n.edge.z * (1 - p * 0.82))
      tmpObj.scale.setScalar(k * (0.6 + Math.sin(p * Math.PI) * 0.8))
      tmpObj.rotation.set(0, 0, 0)
      tmpObj.updateMatrix()
      pulseMesh.current!.setMatrixAt(i, tmpObj.matrix)
      c.set(n.color).multiplyScalar(3)
      pulseMesh.current!.setColorAt(i, c)
    })
    labelEls.current.forEach((el, i) => {
      if (!el) return
      const threshold = (i / TOTAL) * 0.6 + 0.02
      el.style.opacity = String(smoothstep(threshold, threshold + 0.05, ct) * (1 - smoothstep(0.92, 1, ct)))
    })
    for (const m of [nodeMesh.current!, traceMesh.current!, pulseMesh.current!]) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  })

  const p = DISTRICTS.skills.pos
  return (
    <group position={p}>
      <mesh geometry={base} material={vertexMat} castShadow receiveShadow />
      <mesh geometry={branches} material={vertexMat} castShadow />
      <instancedMesh ref={nodeMesh} args={[nodeGeo, nodeMat, nodes.length]} frustumCulled={false} />
      <instancedMesh ref={traceMesh} args={[traceGeo, traceMat, nodes.length]} frustumCulled={false} />
      <instancedMesh ref={pulseMesh} args={[pulseGeo, pulseMat, nodes.length]} frustumCulled={false} />
      {labelsVisible &&
        nodes.map((n) => (
          <Html key={n.name} position={[n.pos.x, n.pos.y + 0.55, n.pos.z]} center distanceFactor={7} zIndexRange={[20, 0]} className="skill-label-wrap">
            <SkillLabel node={n} register={(el) => void (labelEls.current[n.order] = el)} />
          </Html>
        ))}
    </group>
  )
}

function SkillLabel({ node, register }: { node: Node; register: (el: HTMLDivElement | null) => void }) {
  return (
    <div ref={register} className="skill-label" style={{ ['--c' as string]: node.color, opacity: 0 }}>
      {node.name}
    </div>
  )
}
