import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, Color, InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry, SRGBColorSpace, type Group } from 'three'
import { projects, type BuildingStyle, type Project } from '../../content'
import { PROJECT_SLOTS, type ProjectSlot } from '../../systems/layout'
import { build, G, type Part } from '../../systems/geometry'
import { beaconMat, vertexMat, windowMat } from '../materials'
import { DEMO_H, DEMO_W, drawDemo } from './demoScreen'
import { live, useStore } from '../../state/store'
import { journey } from '../../systems/scroll'
import { audio } from '../../systems/audio'
import { clamp, damp, easeOutBack } from '../../systems/math'

interface Spec {
  parts: Part[]
  windows: [number, number, number, number][] // x, y, z, rotY
  screen: { pos: [number, number, number]; w: number; h: number }
  beacon?: [number, number, number]
}

function towerSpec(accent: string): Spec {
  const parts: Part[] = [
    { geo: G.box(5.2, 1.2, 5.2), color: '#d9cdb8', pos: [0, 0.6, 0] },
    { geo: G.box(3.8, 8.6, 3.8), color: '#9cc3e0', pos: [0, 5.5, 0] },
    { geo: G.box(4.0, 0.25, 4.0), color: '#e9eef5', pos: [0, 9.9, 0] },
    { geo: G.box(2.7, 2.0, 2.7), color: '#b8d4ea', pos: [0, 11, 0] },
    { geo: G.box(2.9, 0.2, 2.9), color: accent, pos: [0, 12.1, 0] },
    { geo: G.cyl(0.06, 0.1, 1.8, 5), color: '#d0d6e0', pos: [0.6, 13.0, 0.4] },
  ]
  // vertical fins
  for (const x of [-1.9, 1.9]) for (const z of [-1.9, 1.9]) parts.push({ geo: G.box(0.22, 8.6, 0.22), color: '#e9eef5', pos: [x, 5.5, z] })
  const windows: Spec['windows'] = []
  for (let f = 0; f < 6; f++) {
    for (let c = -1; c <= 1; c++) {
      const y = 2.0 + f * 1.3
      if (!(y > 3.2 && y < 7.4)) windows.push([c * 1.1, y, 1.92, 0])
      windows.push([c * 1.1, y, -1.92, Math.PI])
      windows.push([1.92, y, c * 1.1, Math.PI / 2])
      windows.push([-1.92, y, c * 1.1, -Math.PI / 2])
    }
  }
  return { parts, windows, screen: { pos: [0, 5.35, 1.95], w: 3.3, h: 2.1 }, beacon: [0.6, 13.95, 0.4] }
}

function domeSpec(accent: string): Spec {
  const dome = new SphereGeometry(2.7, 14, 5, 0, Math.PI * 2, 0, Math.PI / 2)
  dome.scale(1, 0.85, 1)
  const parts: Part[] = [
    { geo: G.cyl(2.9, 3.0, 0.5, 14), color: '#d9cdb8', pos: [0, 0.25, 0] },
    { geo: G.cyl(2.6, 2.6, 3.0, 14), color: '#f4f1ea', pos: [0, 2.0, 0] },
    { geo: G.cyl(2.7, 2.7, 0.25, 14), color: accent, pos: [0, 3.55, 0] },
    { geo: dome, color: '#a9dcd6', pos: [0, 3.6, 0] },
    { geo: G.box(0.7, 2.6, 0.2), color: '#2d3b5c', pos: [0, 5.0, 1.8], rot: [-0.55, 0, 0] },
    { geo: G.cyl(0.05, 0.05, 1.2, 5), color: '#d0d6e0', pos: [-1.6, 6.3, -0.6] },
    // billboard posts
    { geo: G.box(0.16, 2.2, 0.16), color: '#555d70', pos: [-1.5, 1.1, 3.4] },
    { geo: G.box(0.16, 2.2, 0.16), color: '#555d70', pos: [1.5, 1.1, 3.4] },
    { geo: G.box(3.6, 2.3, 0.18), color: '#2a3048', pos: [0, 3.0, 3.33] },
  ]
  const windows: Spec['windows'] = []
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    if (Math.abs(Math.sin(a)) > 0.92 && Math.cos(a) > 0) continue
    windows.push([Math.sin(a) * 2.62, 2.2, Math.cos(a) * 2.62, a])
  }
  return { parts, windows, screen: { pos: [0, 3.0, 3.44], w: 3.3, h: 2.05 }, beacon: [-1.6, 6.95, -0.6] }
}

function studioSpec(accent: string): Spec {
  const parts: Part[] = [
    { geo: G.box(5.2, 0.4, 4.8), color: '#d9cdb8', pos: [0, 0.2, 0] },
    { geo: G.box(4.8, 4.4, 4.2), color: '#e7b98a', pos: [0, 2.6, 0] },
    { geo: G.gable(5.6, 2.8, 4.8), color: '#7d4f6e', pos: [0, 4.8, 0] },
    { geo: G.box(0.6, 1.6, 0.6), color: '#b9a597', pos: [1.5, 6.6, -1.0] },
    { geo: G.box(4.0, 2.6, 0.12), color: '#3a2a3a', pos: [0, 2.75, 2.12] },
    { geo: G.box(1.0, 1.6, 0.14), color: '#5b3d2c', pos: [-1.7, 0.95, 2.13] },
    { geo: G.box(5.0, 0.18, 0.6), color: accent, pos: [0, 4.35, 2.3] },
  ]
  const windows: Spec['windows'] = []
  for (const z of [-1, 0, 1]) {
    windows.push([2.42, 2.4, z * 1.2, Math.PI / 2])
    windows.push([-2.42, 2.4, z * 1.2, -Math.PI / 2])
    windows.push([2.42, 3.7, z * 1.2, Math.PI / 2])
    windows.push([-2.42, 3.7, z * 1.2, -Math.PI / 2])
  }
  windows.push([0, 5.6, 2.2, 0])
  return { parts, windows, screen: { pos: [0.35, 2.75, 2.2], w: 3.1, h: 2.0 } }
}

function factorySpec(accent: string): Spec {
  const parts: Part[] = [
    { geo: G.box(5.4, 0.4, 5.2), color: '#d9cdb8', pos: [0, 0.2, 0] },
    { geo: G.box(5.0, 3.6, 4.6), color: '#d97a5a', pos: [0, 2.2, 0] },
    { geo: G.box(5.1, 0.25, 4.7), color: '#efe6da', pos: [0, 4.05, 0] },
    { geo: G.cyl(0.35, 0.45, 3.4, 8), color: '#9a8a80', pos: [-1.6, 5.6, -1.4] },
    { geo: G.cyl(0.3, 0.4, 2.6, 8), color: '#9a8a80', pos: [-0.6, 5.2, -1.6] },
    { geo: G.cyl(0.4, 0.4, 0.25, 8), color: accent, pos: [-1.6, 7.2, -1.4] },
    { geo: G.box(1.6, 1.8, 0.14), color: '#4a4f62', pos: [1.2, 1.3, 2.33] },
    { geo: G.box(3.6, 2.2, 0.16), color: '#2a3048', pos: [-0.4, 2.6, 2.35] },
  ]
  // saw-tooth roof
  for (let i = 0; i < 3; i++) parts.push({ geo: G.gable(1.6, 1.0, 4.4), color: '#8f9bb3', pos: [-1.6 + i * 1.6, 4.15, 0] })
  const windows: Spec['windows'] = []
  for (let i = 0; i < 4; i++) {
    windows.push([2.52, 2.4, -1.5 + i, Math.PI / 2])
    windows.push([-2.52, 2.4, -1.5 + i, -Math.PI / 2])
    windows.push([-1.8 + i * 1.2, 2.6, -2.32, Math.PI])
  }
  return { parts, windows, screen: { pos: [-0.4, 2.6, 2.45], w: 3.2, h: 1.9 } }
}

const SPECS: Record<BuildingStyle, (accent: string) => Spec> = {
  tower: towerSpec,
  dome: domeSpec,
  studio: studioSpec,
  factory: factorySpec,
}

function Building({ project, slot }: { project: Project; slot: ProjectSlot }) {
  const group = useRef<Group>(null)
  const riser = useRef<Group>(null)
  const windowsRef = useRef<InstancedMesh>(null)
  const [hovered, setHovered] = useState(false)
  const mode = useStore((s) => s.mode)
  const openProject = useStore((s) => s.openProject)
  const reduced = useStore((s) => s.reducedMotion)

  const spec = useMemo(() => SPECS[project.building](project.accent), [project])
  const geo = useMemo(() => build(spec.parts), [spec])
  const winGeo = useMemo(() => G.box(0.42, 0.62, 0.06), [])
  const foundation = useMemo(
    () =>
      build([
        { geo: G.box(5.4, 0.25, 5.4), color: '#cbbfa8', pos: [0, 0.12, 0] },
        { geo: G.cone(0.22, 0.5, 6), color: '#ff8a3d', pos: [2.4, 0.5, 2.4] },
        { geo: G.cone(0.22, 0.5, 6), color: '#ff8a3d', pos: [-2.4, 0.5, 2.4] },
      ]),
    [],
  )

  const { canvas, texture, screenMat } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = DEMO_W
    canvas.height = DEMO_H
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 4
    const screenMat = new MeshBasicMaterial({ map: texture, toneMapped: false, color: new Color(1.15, 1.15, 1.15) })
    return { canvas, texture, screenMat }
  }, [])
  const ctx = useMemo(() => canvas.getContext('2d')!, [canvas])

  useLayoutEffect(() => {
    const o = new Object3D()
    const c = new Color()
    spec.windows.forEach(([x, y, z, r], i) => {
      o.position.set(x, y, z)
      o.rotation.set(0, r, 0)
      o.updateMatrix()
      windowsRef.current!.setMatrixAt(i, o.matrix)
      windowsRef.current!.setColorAt(i, c.setScalar(((i * 7919) % 10) / 10 > 0.2 ? 1 : 0.25))
    })
    windowsRef.current!.instanceMatrix.needsUpdate = true
    if (windowsRef.current!.instanceColor) windowsRef.current!.instanceColor.needsUpdate = true
    windowsRef.current!.computeBoundingSphere()
    drawDemo(ctx, project, 0)
    texture.needsUpdate = true
  }, [spec, ctx, project, texture])

  const rise = useRef(0)
  const lastDraw = useRef(0)

  useFrame(({ clock, camera }, dt) => {
    // reveal when the visitor approaches this project's stop
    const stop = journey.stops.get(`project-${slot.index}`)
    const target = mode === 'play' ? 1 : stop ? (live.progress > stop.start - 0.06 ? 1 : 0) : 1
    rise.current += (target - rise.current) * damp(reduced ? 20 : 3.2, dt)
    const r = clamp(rise.current)
    if (riser.current) {
      const s = reduced ? r : easeOutBack(r)
      riser.current.scale.set(1, Math.max(0.001, s), 1)
      riser.current.visible = r > 0.002
    }
    if (group.current) {
      const hs = hovered ? 1.03 : 1
      group.current.scale.x += (hs - group.current.scale.x) * damp(10, dt)
      group.current.scale.z = group.current.scale.x
    }
    // redraw the demo screen ~24 fps when it's close enough to read
    const t = clock.elapsedTime
    const dist = camera.position.distanceTo(group.current!.position)
    if (r > 0.5 && dist < 45 && t - lastDraw.current > 1 / 24) {
      lastDraw.current = t
      drawDemo(ctx, project, t)
      texture.needsUpdate = true
    }
  })

  const onOver = () => {
    setHovered(true)
    document.body.style.cursor = 'pointer'
    audio.hover()
  }
  const onOut = () => {
    setHovered(false)
    document.body.style.cursor = ''
  }

  return (
    <group ref={group} position={slot.pos} rotation-y={slot.rotY}>
      <mesh geometry={foundation} material={vertexMat} receiveShadow />
      <group ref={riser}>
        <group
          onPointerOver={(e) => {
            e.stopPropagation()
            onOver()
          }}
          onPointerOut={onOut}
          onClick={(e) => {
            e.stopPropagation()
            audio.open()
            openProject(project.id)
          }}
        >
          <mesh geometry={geo} material={vertexMat} castShadow receiveShadow />
          <instancedMesh ref={windowsRef} args={[winGeo, windowMat, spec.windows.length]} />
          <mesh position={spec.screen.pos} material={screenMat}>
            <planeGeometry args={[spec.screen.w, spec.screen.h]} />
          </mesh>
          {spec.beacon && (
            <mesh position={spec.beacon} material={beaconMat}>
              <icosahedronGeometry args={[0.16, 0]} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  )
}

export function ProjectsDistrict() {
  return (
    <>
      {PROJECT_SLOTS.map((slot) => (
        <Building key={slot.id} project={projects[slot.index]} slot={slot} />
      ))}
    </>
  )
}
