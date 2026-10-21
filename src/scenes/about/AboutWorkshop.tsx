import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { CanvasTexture, MeshBasicMaterial, SRGBColorSpace, type Group, type Mesh, type PointLight } from 'three'
import { aboutItems, type AboutModel } from '../../content'
import { DISTRICTS } from '../../systems/layout'
import { build, G, type Part } from '../../systems/geometry'
import { bulbMat, vertexMat, windowMat } from '../materials'
import { useStore } from '../../state/store'
import { env } from '../../systems/dayNight'
import { audio } from '../../systems/audio'
import { damp } from '../../systems/math'
import { KEYFRAMES } from '../../systems/cameraPath'

type V = [number, number, number]

/** Where each object sits inside the room (local coords) and where its tooltip anchors. */
const SLOTS: Record<AboutModel, { pos: V; anchor: V }> = {
  computer: { pos: [-0.6, 0.3, -2.3], anchor: [-0.6, 2.5, -2.3] },
  books: { pos: [-3.05, 0.3, -1.4], anchor: [-3.0, 3.1, -1.4] },
  gamepad: { pos: [-2.9, 0.3, 1.2], anchor: [-2.6, 1.6, 1.2] },
  coffee: { pos: [0.55, 1.16, -2.15], anchor: [0.55, 1.9, -2.15] },
  plant: { pos: [2.6, 0.3, -2.3], anchor: [2.6, 2.3, -2.3] },
  guitar: { pos: [2.9, 0.3, -1.0], anchor: [2.9, 2.6, -1.0] },
  cat: { pos: [1.0, 0.33, 0.6], anchor: [1.0, 1.3, 0.6] },
}

function modelParts(model: AboutModel): Part[] {
  switch (model) {
    case 'computer':
      return [
        { geo: G.box(2.4, 0.12, 1.0), color: '#a8754c', pos: [0, 0.82, 0] },
        { geo: G.box(0.1, 0.8, 0.9), color: '#7a5236', pos: [-1.1, 0.4, 0] },
        { geo: G.box(0.1, 0.8, 0.9), color: '#7a5236', pos: [1.1, 0.4, 0] },
        { geo: G.box(1.3, 0.82, 0.08), color: '#2b2f3c', pos: [0, 1.42, -0.28] },
        { geo: G.box(0.12, 0.3, 0.12), color: '#2b2f3c', pos: [0, 1.0, -0.28] },
        { geo: G.box(0.9, 0.04, 0.3), color: '#e5e2dc', pos: [0, 0.9, 0.12] },
        { geo: G.box(0.14, 0.04, 0.2), color: '#e5e2dc', pos: [0.62, 0.9, 0.12] },
        // chair
        { geo: G.box(0.7, 0.1, 0.7), color: '#4f7cac', pos: [0, 0.55, 0.9] },
        { geo: G.box(0.7, 0.8, 0.1), color: '#4f7cac', pos: [0, 1.0, 1.22] },
        { geo: G.cyl(0.05, 0.05, 0.5, 5), color: '#333', pos: [0, 0.27, 0.9] },
      ]
    case 'books': {
      const parts: Part[] = [
        { geo: G.box(0.55, 2.5, 1.7), color: '#6b4f3a', pos: [0, 1.25, 0] },
        { geo: G.box(0.5, 2.4, 1.55), color: '#3d2c22', pos: [0.04, 1.25, 0] },
      ]
      const colors = ['#d9674e', '#4f7cac', '#ffd36b', '#3f8f7a', '#c9a7ff', '#f2f2f2', '#ff9f6b']
      for (let shelf = 0; shelf < 4; shelf++) {
        parts.push({ geo: G.box(0.52, 0.06, 1.6), color: '#6b4f3a', pos: [0.02, 0.15 + shelf * 0.6, 0] })
        let z = -0.7
        let i = shelf * 3
        while (z < 0.65) {
          const w = 0.09 + ((i * 37) % 5) * 0.02
          const h = 0.34 + ((i * 53) % 4) * 0.04
          parts.push({ geo: G.box(0.32, h, w), color: colors[i % colors.length], pos: [0.08, 0.18 + shelf * 0.6 + h / 2, z + w / 2], rot: [(i % 7 === 0 ? 0.2 : 0), 0, 0] })
          z += w + 0.015
          i++
        }
      }
      return parts
    }
    case 'gamepad':
      return [
        // couch
        { geo: G.box(1.0, 0.45, 2.3), color: '#c2554a', pos: [0, 0.23, 0] },
        { geo: G.box(0.32, 0.75, 2.3), color: '#a9473e', pos: [-0.36, 0.6, 0] },
        { geo: G.box(1.0, 0.35, 0.25), color: '#a9473e', pos: [0, 0.55, -1.15] },
        { geo: G.box(1.0, 0.35, 0.25), color: '#a9473e', pos: [0, 0.55, 1.15] },
        // gamepad
        { geo: G.box(0.46, 0.1, 0.24), color: '#2b2f3c', pos: [0.15, 0.52, 0.2], rot: [0, 0.4, 0] },
        { geo: G.cyl(0.09, 0.09, 0.1, 6), color: '#2b2f3c', pos: [0.0, 0.52, 0.05], rot: [0, 0.4, 0] },
        { geo: G.cyl(0.09, 0.09, 0.1, 6), color: '#2b2f3c', pos: [0.3, 0.52, 0.35], rot: [0, 0.4, 0] },
        { geo: G.ico(0.035, 0), color: '#ff5f57', pos: [0.24, 0.58, 0.24] },
        { geo: G.ico(0.035, 0), color: '#28c840', pos: [0.2, 0.58, 0.3] },
        { geo: G.ico(0.035, 0), color: '#7cc4ff', pos: [0.28, 0.58, 0.2] },
      ]
    case 'coffee':
      return [
        { geo: G.cyl(0.11, 0.1, 0.22, 10), color: '#f4f1ea', pos: [0, 0.11, 0] },
        { geo: G.cyl(0.095, 0.095, 0.02, 10), color: '#5b3a24', pos: [0, 0.21, 0] },
        { geo: G.torus(0.06, 0.018, 4, 8), color: '#f4f1ea', pos: [0.12, 0.11, 0], rot: [0, 0, 0] },
      ]
    case 'plant':
      return [
        { geo: G.cyl(0.32, 0.24, 0.55, 8), color: '#d97a5a', pos: [0, 0.27, 0] },
        { geo: G.cyl(0.29, 0.29, 0.05, 8), color: '#5b3a24', pos: [0, 0.53, 0] },
        { geo: G.cone(0.3, 1.1, 5), color: '#4fae6e', pos: [0, 1.1, 0] },
        { geo: G.cone(0.22, 0.9, 5), color: '#3f9a63', pos: [0.22, 0.95, 0.1], rot: [0.3, 0, -0.5] },
        { geo: G.cone(0.22, 0.9, 5), color: '#5fbf7a', pos: [-0.2, 0.95, -0.1], rot: [-0.3, 0, 0.5] },
        { geo: G.cone(0.2, 0.8, 5), color: '#4fae6e', pos: [0.05, 0.9, -0.24], rot: [-0.5, 0, 0] },
      ]
    case 'guitar':
      return [
        { geo: G.cyl(0.36, 0.36, 0.12, 10), color: '#d99a4e', pos: [0, 0.6, 0], rot: [Math.PI / 2, 0, 0] },
        { geo: G.cyl(0.28, 0.28, 0.12, 10), color: '#d99a4e', pos: [0, 1.0, 0], rot: [Math.PI / 2, 0, 0] },
        { geo: G.cyl(0.1, 0.1, 0.13, 8), color: '#3d2c22', pos: [0, 0.82, 0.01], rot: [Math.PI / 2, 0, 0] },
        { geo: G.box(0.08, 0.9, 0.05), color: '#5b3a24', pos: [0, 1.6, 0] },
        { geo: G.box(0.14, 0.2, 0.06), color: '#3d2c22', pos: [0, 2.1, 0] },
      ]
    case 'cat':
      return [
        { geo: G.sphere(0.5, 8, 6), color: '#e8a25a', pos: [0, 0.2, 0], scale: [1, 0.55, 0.7] },
        { geo: G.sphere(0.22, 8, 6), color: '#e8a25a', pos: [0.48, 0.28, 0.08] },
        { geo: G.cone(0.08, 0.16, 4), color: '#d48b45', pos: [0.5, 0.5, 0.0], rot: [0, 0, -0.2] },
        { geo: G.cone(0.08, 0.16, 4), color: '#d48b45', pos: [0.5, 0.5, 0.18], rot: [0, 0, -0.2] },
        { geo: G.cyl(0.06, 0.05, 0.7, 5), color: '#d48b45', pos: [-0.45, 0.1, 0.25], rot: [Math.PI / 2, 0.6, 0] },
        { geo: G.box(0.1, 0.04, 0.05), color: '#3a2a1a', pos: [0.69, 0.3, 0.02] },
      ]
  }
}

function Tooltip({ title, text, show }: { title: string; text: string; show: boolean }) {
  return (
    <div className={`about-tip ${show ? 'is-on' : ''}`} role="tooltip">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

function Item({ id, model, title, text, children }: { id: string; model: AboutModel; title: string; text: string; children?: ReactNode }) {
  const geo = useMemo(() => build(modelParts(model)), [model])
  const group = useRef<Group>(null)
  const hint = useRef<Mesh>(null)
  const hovered = useStore((s) => s.hoveredAbout === id)
  const pinned = useStore((s) => s.pinnedAbout === id)
  const chapter = useStore((s) => s.chapter)
  const mode = useStore((s) => s.mode)
  const setHovered = useStore((s) => s.setHoveredAbout)
  const setPinned = useStore((s) => s.setPinnedAbout)
  const findEgg = useStore((s) => s.findEgg)
  const clicks = useRef(0)
  const slot = SLOTS[model]
  const active = hovered || pinned

  useFrame(({ clock }, dt) => {
    const g = group.current
    if (g) {
      const s = active ? 1.08 : 1
      g.scale.setScalar(g.scale.x + (s - g.scale.x) * damp(12, dt))
      if (model === 'cat') g.scale.y *= 1 + Math.sin(clock.elapsedTime * 2.2) * 0.025
    }
    if (hint.current) {
      hint.current.visible = chapter === 3 && mode === 'journey' && !active
      hint.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 4 + slot.pos[0]) * 0.25)
    }
  })

  return (
    <group>
      <group
        ref={group}
        position={slot.pos}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(id)
          document.body.style.cursor = 'pointer'
          audio.hover()
        }}
        onPointerOut={() => {
          setHovered(null)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          audio.click()
          setPinned(pinned ? null : id)
          if (model === 'cat') {
            clicks.current++
            audio.meow()
            if (clicks.current === 5) findEgg('cat', 'Cat whisperer', 'You booped the senior reviewer five times. It approved your PR. Just this once.')
          }
        }}
      >
        <mesh geometry={geo} material={vertexMat} castShadow receiveShadow />
        {children}
      </group>
      <mesh ref={hint} position={[slot.anchor[0], slot.anchor[1] - 0.3, slot.anchor[2]]} material={bulbMat}>
        <icosahedronGeometry args={[0.07, 0]} />
      </mesh>
      {(active || (mode === 'journey' && chapter === 3)) && (
        <Html position={slot.anchor} center distanceFactor={9} zIndexRange={[30, 10]}>
          <Tooltip title={title} text={text} show={active} />
        </Html>
      )}
    </group>
  )
}

function Steam() {
  const g = useRef<Group>(null)
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      const k = (clock.elapsedTime * 0.5 + i / 3) % 1
      c.position.set(Math.sin(k * 6 + i) * 0.05, 0.25 + k * 0.6, 0)
      c.scale.setScalar((1 - k) * 0.9)
    })
  })
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <icosahedronGeometry args={[0.05, 0]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function MonitorScreen() {
  const { mat, ctx, tex } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 160
    const tex = new CanvasTexture(c)
    tex.colorSpace = SRGBColorSpace
    return { mat: new MeshBasicMaterial({ map: tex, toneMapped: false }), ctx: c.getContext('2d')!, tex }
  }, [])
  const last = useRef(0)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t - last.current < 0.15) return
    last.current = t
    ctx.fillStyle = '#10141f'
    ctx.fillRect(0, 0, 256, 160)
    const colors = ['#c792ea', '#82aaff', '#c3e88d', '#ffcb6b', '#89ddff']
    const offset = Math.floor(t * 3)
    for (let i = 0; i < 9; i++) {
      const seed = (i + offset) * 9301
      ctx.fillStyle = colors[seed % colors.length]
      const indent = (seed % 3) * 14
      ctx.fillRect(12 + indent, 14 + i * 16, 30 + (seed % 140), 7)
    }
    tex.needsUpdate = true
  })
  return (
    <mesh position={[0, 1.42, -0.235]} material={mat}>
      <planeGeometry args={[1.18, 0.7]} />
    </mesh>
  )
}

export function AboutWorkshop() {
  const lamp = useRef<PointLight>(null)
  const ceiling = useRef<PointLight>(null)
  const shell = useMemo(
    () =>
      build([
        { geo: G.box(7.2, 0.3, 6.2), color: '#c89a6a', pos: [0, 0.15, 0] },
        { geo: G.box(7.2, 0.12, 6.2), color: '#b98a5a', pos: [0, 0.02, 0] },
        { geo: G.box(7.2, 3.6, 0.25), color: '#f2e6d0', pos: [0, 2.1, -3.1] },
        { geo: G.box(0.25, 3.6, 6.2), color: '#eadcc3', pos: [-3.6, 2.1, 0] },
        { geo: G.box(7.3, 0.18, 0.35), color: '#8a6a4f', pos: [0, 3.95, -3.1] },
        { geo: G.box(0.35, 0.18, 6.3), color: '#8a6a4f', pos: [-3.6, 3.95, 0] },
        { geo: G.box(7.2, 0.2, 0.3), color: '#8a6a4f', pos: [0, 0.4, -2.95] },
        // rug
        { geo: G.cyl(1.4, 1.4, 0.03, 16), color: '#c75b5b', pos: [1.0, 0.315, 0.5] },
        { geo: G.cyl(1.0, 1.0, 0.035, 16), color: '#e7a35e', pos: [1.0, 0.32, 0.5] },
        // window frame + poster
        { geo: G.box(1.6, 1.3, 0.1), color: '#8a6a4f', pos: [1.6, 2.4, -2.98] },
        { geo: G.box(0.08, 1.2, 0.9), color: '#2b2f3c', pos: [-3.45, 2.4, 1.1] },
        { geo: G.box(0.06, 1.05, 0.75), color: '#ff9f6b', pos: [-3.42, 2.4, 1.1] },
        // floor lamp
        { geo: G.cyl(0.25, 0.3, 0.06, 8), color: '#333744', pos: [1.15, 0.33, -2.6] },
        { geo: G.cyl(0.03, 0.03, 2.0, 5), color: '#333744', pos: [1.15, 1.3, -2.6] },
        { geo: G.cyl(0.25, 0.4, 0.4, 8), color: '#f6e7cb', pos: [1.15, 2.4, -2.6] },
      ]),
    [],
  )

  const target = KEYFRAMES.find((k) => k.id === 'about')!.pos
  const p = DISTRICTS.about.pos
  // rotate the room so its open corner faces the camera stop
  const rotY = Math.atan2(target[0] - p[0], target[2] - p[2]) - Math.PI / 4

  useFrame(() => {
    const k = Math.max(0, Math.min(1, (env.night - 0.25) / 0.5))
    if (lamp.current) lamp.current.intensity = k * 20
    if (ceiling.current) ceiling.current.intensity = 3 + k * 19
  })

  return (
    <group position={p} rotation-y={rotY}>
      <mesh geometry={shell} material={vertexMat} castShadow receiveShadow />
      <mesh position={[1.6, 2.4, -2.92]} material={windowMat}>
        <planeGeometry args={[1.35, 1.05]} />
      </mesh>
      <mesh position={[1.15, 2.3, -2.6]} material={bulbMat}>
        <icosahedronGeometry args={[0.12, 0]} />
      </mesh>
      <pointLight ref={lamp} position={[1.15, 2.2, -2.3]} color="#ffc27a" distance={10} decay={1.4} intensity={0} />
      <pointLight ref={ceiling} position={[-0.5, 3.6, -0.6]} color="#ffd9a8" distance={11} decay={1.3} intensity={4} />
      {aboutItems.map((it) => (
        <Item key={it.id} {...it}>
          {it.model === 'computer' && <MonitorScreen />}
          {it.model === 'coffee' && <Steam />}
        </Item>
      ))}
    </group>
  )
}
