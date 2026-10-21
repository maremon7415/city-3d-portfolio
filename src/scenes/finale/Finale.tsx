import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, CanvasTexture, Color, MeshBasicMaterial, SRGBColorSpace, type Group, type Mesh, type PointLight, type Points } from 'three'
import { LAUNCH_PAD, TERMINAL_POS } from '../../systems/layout'
import { build, G } from '../../systems/geometry'
import { bulbMat, beaconMat, vertexMat } from '../materials'
import { useStore } from '../../state/store'
import { env } from '../../systems/dayNight'
import { audio } from '../../systems/audio'
import { mulberry32 } from '../../systems/math'

export const shake = { amount: 0 }

const LAUNCH_DURATION = 3.6

function Rocket() {
  const rocket = useRef<Group>(null)
  const flame = useRef<Mesh>(null)
  const smoke = useRef<Points>(null)
  const launchAt = useStore((s) => s.rocketLaunchAt)
  const openContact = useStore((s) => s.openContact)
  const opened = useRef(0)

  const body = useMemo(
    () =>
      build([
        { geo: G.cyl(0.62, 0.7, 3.6, 12), color: '#f4f1ea', pos: [0, 2.5, 0] },
        { geo: G.cyl(0.64, 0.64, 0.35, 12), color: '#d9674e', pos: [0, 3.6, 0] },
        { geo: G.cone(0.62, 1.7, 12), color: '#d9674e', pos: [0, 5.15, 0] },
        { geo: G.cyl(0.5, 0.62, 0.4, 12), color: '#555d70', pos: [0, 0.55, 0] },
        { geo: G.cyl(0.25, 0.42, 0.45, 10), color: '#3b3f4f', pos: [0, 0.18, 0] },
        { geo: G.cyl(0.3, 0.3, 0.08, 10), color: '#2b2f3c', pos: [0, 3.0, 0.62], rot: [Math.PI / 2, 0, 0] },
        ...[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2
          return { geo: G.box(0.08, 1.2, 0.8), color: '#d9674e', pos: [Math.sin(a) * 0.8, 1.1, Math.cos(a) * 0.8] as [number, number, number], rot: [0, a + Math.PI / 2, 0] as [number, number, number] }
        }),
      ]),
    [],
  )
  const pad = useMemo(
    () =>
      build([
        { geo: G.cyl(2.6, 2.9, 0.45, 16), color: '#8f9bb3', pos: [0, 0.22, 0] },
        { geo: G.cyl(2.2, 2.2, 0.47, 16), color: '#5a6278', pos: [0, 0.23, 0] },
        { geo: G.cyl(1.0, 1.0, 0.48, 16), color: '#ffd36b', pos: [0, 0.24, 0] },
        // gantry
        { geo: G.box(0.35, 7.0, 0.35), color: '#d9674e', pos: [-2.0, 3.5, -0.6] },
        { geo: G.box(0.35, 7.0, 0.35), color: '#d9674e', pos: [-2.0, 3.5, 0.6] },
        ...[1.2, 2.8, 4.4, 6.0].map((y) => ({ geo: G.box(0.2, 0.2, 1.2), color: '#d9674e', pos: [-2.0, y, 0] as [number, number, number] })),
        { geo: G.box(1.3, 0.15, 0.3), color: '#8f9bb3', pos: [-1.35, 4.0, 0] },
      ]),
    [],
  )
  const windowMatR = useMemo(() => new MeshBasicMaterial({ color: new Color('#7ff3ff').multiplyScalar(2), toneMapped: false }), [])
  const flameMat = useMemo(() => new MeshBasicMaterial({ color: new Color('#ffb347').multiplyScalar(4), toneMapped: false, transparent: true, opacity: 0.9 }), [])

  const smokeGeo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(120 * 3), 3))
    return g
  }, [])
  const smokeSeeds = useMemo(() => {
    const r = mulberry32(2)
    return Array.from({ length: 120 }, () => [r() * Math.PI * 2, r(), r()])
  }, [])

  useFrame(({ clock }) => {
    const r = rocket.current
    if (!r) return
    const now = performance.now()
    const since = launchAt ? (now - launchAt) / 1000 : 999
    const launching = since < LAUNCH_DURATION + 3
    let y = 0
    if (since < LAUNCH_DURATION) {
      const k = Math.max(0, since - 0.6)
      y = k * k * 6
      shake.amount = since < 0.6 ? since * 0.25 : Math.max(0, 0.35 - k * 0.08)
    } else if (since < LAUNCH_DURATION + 3) {
      // a fresh rocket grows back on the pad, ready for the next message
      const k = (since - LAUNCH_DURATION) / 3
      shake.amount = 0
      r.visible = k > 0.4
      r.scale.setScalar(Math.min(1, (k - 0.4) / 0.6))
    } else {
      r.visible = true
      r.scale.setScalar(1)
      shake.amount = 0
    }
    r.position.y = y
    r.rotation.y = since < LAUNCH_DURATION ? since * 0.3 : 0
    if (launchAt && since > 1.6 && opened.current !== launchAt) {
      opened.current = launchAt
      openContact(true)
    }
    if (flame.current) {
      const on = since < LAUNCH_DURATION
      flame.current.visible = on
      flame.current.scale.set(1, (0.8 + Math.sin(clock.elapsedTime * 40) * 0.15) * (since < 0.6 ? since * 1.6 : 1.6), 1)
    }
    const pts = smoke.current
    if (pts) {
      pts.visible = launching
      const arr = pts.geometry.attributes.position.array as Float32Array
      smokeSeeds.forEach(([a, s, h], i) => {
        const k = ((since * 0.6 + s) % 1) * Math.min(1, since)
        const rad = 0.4 + k * (2.5 + h * 2)
        arr[i * 3] = Math.cos(a) * rad
        arr[i * 3 + 1] = 0.3 + k * h * 1.5
        arr[i * 3 + 2] = Math.sin(a) * rad
      })
      pts.geometry.attributes.position.needsUpdate = true
    }
  })

  const launch = useStore((s) => s.launchRocket)
  const onClick = () => {
    if (performance.now() - launchAt < (LAUNCH_DURATION + 3) * 1000) return
    audio.rocket()
    launch()
  }

  return (
    <group position={LAUNCH_PAD}>
      <mesh geometry={pad} material={vertexMat} castShadow receiveShadow />
      <points ref={smoke} geometry={smokeGeo} visible={false}>
        <pointsMaterial color="#e8e4f0" size={0.9} transparent opacity={0.6} depthWrite={false} />
      </points>
      <group
        ref={rocket}
        position={[0, 0.45, 0]}
        onClick={(e) => {
          e.stopPropagation()
          if (e.delta > 8) return
          onClick()
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
          audio.hover()
        }}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <mesh geometry={body} material={vertexMat} castShadow />
        <mesh position={[0, 3.0, 0.64]} rotation-x={Math.PI / 2} material={windowMatR}>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 10]} />
        </mesh>
        <mesh ref={flame} position={[0, -0.6, 0]} rotation-x={Math.PI} material={flameMat} visible={false}>
          <coneGeometry args={[0.38, 1.6, 8]} />
        </mesh>
        <mesh position={[0, 6.05, 0]} material={beaconMat}>
          <icosahedronGeometry args={[0.08, 0]} />
        </mesh>
      </group>
    </group>
  )
}

function Terminal() {
  const openContact = useStore((s) => s.openContact)
  const { mat, ctx, tex } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 192
    const tex = new CanvasTexture(c)
    tex.colorSpace = SRGBColorSpace
    return { mat: new MeshBasicMaterial({ map: tex, toneMapped: false, color: new Color(1.4, 1.4, 1.4) }), ctx: c.getContext('2d')!, tex }
  }, [])
  const geo = useMemo(
    () =>
      build([
        { geo: G.box(1.3, 1.0, 0.8), color: '#e8e0cc', pos: [0, 0.5, 0] },
        { geo: G.box(1.5, 1.2, 1.1), color: '#e8e0cc', pos: [0, 1.6, -0.1], rot: [-0.2, 0, 0] },
        { geo: G.box(1.25, 0.95, 0.1), color: '#2b2f3c', pos: [0, 1.65, 0.46], rot: [-0.2, 0, 0] },
        { geo: G.box(1.2, 0.1, 0.5), color: '#cfc6b0', pos: [0, 1.0, 0.45], rot: [0.2, 0, 0] },
      ]),
    [],
  )
  const last = useRef(0)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t - last.current < 0.25) return
    last.current = t
    ctx.fillStyle = '#04140a'
    ctx.fillRect(0, 0, 256, 192)
    ctx.fillStyle = '#5dff9c'
    ctx.font = '700 20px "JetBrains Mono Variable", monospace'
    ctx.fillText('> CONTACT', 18, 44)
    ctx.font = '500 15px "JetBrains Mono Variable", monospace'
    ctx.fillText('  uplink: ready', 18, 80)
    ctx.fillText('  rocket: fueled', 18, 104)
    ctx.fillText(`> click to send${Math.floor(t * 2) % 2 ? '_' : ' '}`, 18, 150)
    tex.needsUpdate = true
  })
  return (
    <group
      position={TERMINAL_POS}
      rotation-y={-0.5}
      onClick={(e) => {
        e.stopPropagation()
        if (e.delta > 8) return
        audio.open()
        openContact(true)
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
        audio.hover()
      }}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <mesh geometry={geo} material={vertexMat} castShadow />
      <mesh position={[0, 1.66, 0.52]} rotation-x={-0.2} material={mat}>
        <planeGeometry args={[1.1, 0.82]} />
      </mesh>
    </group>
  )
}

/** Floodlights so the rocket reads against the night sky. */
function Floodlights() {
  const a = useRef<PointLight>(null)
  const b = useRef<PointLight>(null)
  useFrame(() => {
    const k = Math.max(0, (env.night - 0.3) / 0.7)
    if (a.current) a.current.intensity = 6 + k * 40
    if (b.current) b.current.intensity = 4 + k * 26
  })
  return (
    <group position={LAUNCH_PAD}>
      <pointLight ref={a} position={[3.2, 1.4, 3.2]} color="#ffe2b8" distance={16} decay={1.3} />
      <pointLight ref={b} position={[-2.5, 7.5, 2.5]} color="#a8c4ff" distance={14} decay={1.3} />
    </group>
  )
}

/** Runway lights around the pad blink in sequence at night. */
function PadLights() {
  const g = useRef<Group>(null)
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      c.visible = Math.floor(clock.elapsedTime * 6 - i) % 12 < 6
    })
  })
  return (
    <group ref={g} position={LAUNCH_PAD}>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 3.4, 0.15, Math.sin(a) * 3.4]} material={bulbMat}>
            <icosahedronGeometry args={[0.1, 0]} />
          </mesh>
        )
      })}
    </group>
  )
}

export function Finale() {
  return (
    <>
      <Rocket />
      <Terminal />
      <PadLights />
      <Floodlights />
    </>
  )
}
