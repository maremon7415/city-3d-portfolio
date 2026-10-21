import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { BallCollider, CuboidCollider, CylinderCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, MeshBasicMaterial, PerspectiveCamera, SRGBColorSpace, Vector3, type Group, type Mesh, type PointLight, type Points } from 'three'
import { playCopy, shards } from '../../content'
import { BUG_SPOTS, buildColliders, DISTRICTS, LAUNCH_PAD, RING_COURSE, RUBBER_DUCK, SHARD_SPOTS, SPAWN } from '../../systems/layout'
import { build, G } from '../../systems/geometry'
import { crystalMat, vertexMat } from '../materials'
import { live, useStore } from '../../state/store'
import { input, bindPlayInput } from '../../systems/input'
import { audio } from '../../systems/audio'
import { sampleDay, env } from '../../systems/dayNight'
import { damp, mulberry32, noise2 } from '../../systems/math'
import { islandGeometry, circleRadius } from '../world/islandGeometry'

// ───────────────────────── shared play state ─────────────────────────

const player = new Vector3(...SPAWN)
const cam = { yaw: 0, pitch: 0.28, dist: 7.5 }
export const BUG_COUNT = BUG_SPOTS.length
export const RING_COUNT = RING_COURSE.length

// ───────────────────────── particle bursts ─────────────────────────

const BURSTS = 8
const PER_BURST = 28
const burstState = Array.from({ length: BURSTS }, () => ({ t: 99, origin: new Vector3(), color: new Color() }))
let burstCursor = 0
function spawnBurst(pos: Vector3, color: string) {
  const b = burstState[burstCursor++ % BURSTS]
  b.t = 0
  b.origin.copy(pos)
  b.color.set(color).multiplyScalar(3)
}

function Bursts() {
  const ref = useRef<Points>(null)
  const { geo, dirs } = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(BURSTS * PER_BURST * 3), 3))
    g.setAttribute('color', new BufferAttribute(new Float32Array(BURSTS * PER_BURST * 3), 3))
    const r = mulberry32(9)
    const dirs = Array.from({ length: PER_BURST }, () => new Vector3(r() - 0.5, r() - 0.3, r() - 0.5).normalize().multiplyScalar(2 + r() * 3))
    return { geo: g, dirs }
  }, [])
  useFrame((_, dt) => {
    const pos = geo.attributes.position.array as Float32Array
    const col = geo.attributes.color.array as Float32Array
    burstState.forEach((b, bi) => {
      b.t += dt
      const k = Math.min(1, b.t / 1.1)
      for (let i = 0; i < PER_BURST; i++) {
        const o = (bi * PER_BURST + i) * 3
        if (k >= 1) {
          pos[o + 1] = -9999
          continue
        }
        const d = dirs[i]
        const e = 1 - Math.pow(1 - k, 3)
        pos[o] = b.origin.x + d.x * e
        pos[o + 1] = b.origin.y + d.y * e - k * k * 1.5
        pos[o + 2] = b.origin.z + d.z * e
        col[o] = b.color.r * (1 - k)
        col[o + 1] = b.color.g * (1 - k)
        col[o + 2] = b.color.b * (1 - k)
      }
    })
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.35} vertexColors transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </points>
  )
}

// ───────────────────────── static colliders ─────────────────────────

function WorldColliders() {
  const colliders = useMemo(buildColliders, [])
  return (
    <RigidBody type="fixed" colliders={false}>
      {colliders.map((c, i) =>
        c.kind === 'box' ? (
          <CuboidCollider key={i} args={c.half} position={c.pos} rotation={[0, c.rotY, 0]} />
        ) : (
          <CylinderCollider key={i} args={[c.halfHeight, c.radius]} position={c.pos} />
        ),
      )}
    </RigidBody>
  )
}

// ───────────────────────── the drone ─────────────────────────

function Drone() {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<Group>(null)
  const rotors = useRef<Group>(null)
  const { camera } = useThree()
  const look = useRef(new Vector3())
  const tmp = useMemo(() => ({ fwd: new Vector3(), right: new Vector3(), desired: new Vector3(), v: new Vector3(), camPos: new Vector3(), target: new Vector3() }), [])
  const lastBump = useRef(0)
  const setNearRocket = useStore((s) => s.setNearRocket)
  const launchRocket = useStore((s) => s.launchRocket)
  const reduced = useStore((s) => s.reducedMotion)

  const geo = useMemo(
    () =>
      build([
        { geo: G.box(0.9, 0.28, 0.9), color: '#f4f1ea' },
        { geo: G.box(0.5, 0.2, 0.5), color: '#ff9f6b', pos: [0, 0.22, 0] },
        { geo: G.box(0.3, 0.16, 0.12), color: '#2b2f3c', pos: [0, 0.02, -0.5] },
        ...[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4
          return { geo: G.box(0.12, 0.08, 0.9), color: '#555d70', pos: [Math.sin(a) * 0.55, 0.05, Math.cos(a) * 0.55] as [number, number, number], rot: [0, a, 0] as [number, number, number] }
        }),
        ...[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4
          return { geo: G.cyl(0.1, 0.12, 0.18, 6), color: '#3b3f4f', pos: [Math.sin(a) * 0.95, 0.12, Math.cos(a) * 0.95] as [number, number, number] }
        }),
      ]),
    [],
  )
  const rotorGeo = useMemo(() => build([{ geo: G.box(0.75, 0.02, 0.08), color: '#d9dde8' }, { geo: G.box(0.08, 0.02, 0.75), color: '#d9dde8' }]), [])
  const eyeMat = useMemo(() => new MeshBasicMaterial({ color: new Color('#7ff3ff').multiplyScalar(3), toneMapped: false }), [])
  const glow = useRef<PointLight>(null)

  // start the chase camera behind the drone, facing where the journey camera looked
  useEffect(() => {
    // spawn by the launch pad, facing the island
    cam.yaw = Math.atan2(SPAWN[0], SPAWN[2])
    player.set(...SPAWN)
    look.current.copy(player)
    ;(camera as PerspectiveCamera).clearViewOffset()
    const unbind = bindPlayInput()
    // ?debug: window.__teleport(x, y, z, yaw) for testing hard-to-reach spots
    const w = window as unknown as { __teleport?: (x: number, y: number, z: number, yaw?: number) => void }
    if (useStore.getState().debug) {
      w.__teleport = (x, y, z, yaw) => {
        body.current?.setTranslation({ x, y, z }, true)
        body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true)
        if (yaw !== undefined) cam.yaw = yaw
      }
    }
    return () => {
      delete w.__teleport
      unbind()
      audio.setEngine(null)
      setNearRocket(false)
    }
  }, [camera, setNearRocket])

  useFrame((state, dt) => {
    const b = body.current
    if (!b) return
    dt = Math.min(dt, 1 / 20)
    // look input
    cam.yaw -= input.lookX
    cam.pitch = Math.max(-0.35, Math.min(1.15, cam.pitch + input.lookY))
    input.lookX = 0
    input.lookY = 0

    tmp.fwd.set(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw))
    tmp.right.set(-tmp.fwd.z, 0, tmp.fwd.x)
    const f = Math.max(-1, Math.min(1, input.forward + input.joyY))
    const r = Math.max(-1, Math.min(1, input.right + input.joyX))
    const u = Math.max(-1, Math.min(1, input.up + input.joyUp))
    const speed = input.boost ? 24 : 13
    tmp.desired.set(0, 0, 0).addScaledVector(tmp.fwd, f).addScaledVector(tmp.right, r)
    if (tmp.desired.lengthSq() > 1) tmp.desired.normalize()
    tmp.desired.multiplyScalar(speed)
    tmp.desired.y = u * 9

    const t = b.translation()
    player.set(t.x, t.y, t.z)
    // soft world bounds: turbulence pushes you back
    const horiz = Math.hypot(t.x, t.z - 6)
    if (horiz > 92) tmp.desired.addScaledVector(new Vector3(-t.x, 0, 6 - t.z).normalize(), (horiz - 92) * 2)
    if (t.y < -72) tmp.desired.y += (-72 - t.y) * 2
    if (t.y > 55) tmp.desired.y -= (t.y - 55) * 2

    const lv = b.linvel()
    tmp.v.set(lv.x, lv.y, lv.z).lerp(tmp.desired, damp(input.boost ? 2.4 : 3.2, dt))
    b.setLinvel({ x: tmp.v.x, y: tmp.v.y, z: tmp.v.z }, true)

    if (input.reset) {
      input.reset = false
      b.setTranslation({ x: SPAWN[0], y: SPAWN[1], z: SPAWN[2] }, true)
      b.setLinvel({ x: 0, y: 0, z: 0 }, true)
      cam.yaw = Math.atan2(SPAWN[0], SPAWN[2])
    }

    // visual tilt + yaw
    const v = visual.current
    if (v) {
      const localF = tmp.v.dot(tmp.fwd)
      const localR = tmp.v.dot(tmp.right)
      v.rotation.y += (cam.yaw - v.rotation.y) * damp(6, dt)
      v.rotation.x += (-localF * 0.025 - v.rotation.x) * damp(5, dt)
      v.rotation.z += (-localR * 0.03 - v.rotation.z) * damp(5, dt)
      v.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.06
    }
    if (rotors.current) rotors.current.children.forEach((c) => (c.rotation.y += dt * (30 + tmp.v.length() * 2)))
    if (glow.current) glow.current.intensity = 1 + env.night * 6

    const spd = tmp.v.length()
    live.player.x = t.x
    live.player.y = t.y
    live.player.z = t.z
    live.player.yaw = cam.yaw
    live.player.speed = spd
    audio.setEngine(Math.min(1, spd / 24))

    // chase camera
    const cp = Math.cos(cam.pitch)
    tmp.camPos.set(t.x, t.y, t.z).addScaledVector(tmp.fwd, -cam.dist * cp)
    tmp.camPos.y += Math.sin(cam.pitch) * cam.dist + 1.1
    state.camera.position.lerp(tmp.camPos, damp(reduced ? 20 : 7, dt))
    tmp.target.set(t.x, t.y + 0.6, t.z).addScaledVector(tmp.fwd, 2)
    look.current.lerp(tmp.target, damp(10, dt))
    state.camera.lookAt(look.current)

    // rocket proximity
    const near = Math.hypot(t.x - LAUNCH_PAD[0], t.z - LAUNCH_PAD[2]) < 7 && t.y < LAUNCH_PAD[1] + 12
    setNearRocket(near)
    if (input.interact) {
      input.interact = false
      if (near) {
        audio.rocket()
        launchRocket()
      }
    }
  })

  return (
    <RigidBody
      ref={body}
      type="dynamic"
      colliders={false}
      position={SPAWN}
      gravityScale={0}
      linearDamping={0.5}
      lockRotations
      ccd
      canSleep={false}
      onCollisionEnter={() => {
        const now = performance.now()
        if (now - lastBump.current > 350) {
          lastBump.current = now
          audio.bump()
        }
      }}
    >
      <BallCollider args={[0.65]} restitution={0.35} friction={0.1} />
      <group ref={visual}>
        <mesh geometry={geo} material={vertexMat} castShadow />
        <mesh position={[0, 0.02, -0.57]} material={eyeMat}>
          <boxGeometry args={[0.22, 0.06, 0.02]} />
        </mesh>
        <group ref={rotors}>
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4
            return <mesh key={i} geometry={rotorGeo} material={vertexMat} position={[Math.sin(a) * 0.95, 0.23, Math.cos(a) * 0.95]} />
          })}
        </group>
        <pointLight ref={glow} color="#7ff3ff" intensity={1} distance={6} decay={1.5} position={[0, -0.4, 0]} />
      </group>
    </RigidBody>
  )
}

// ───────────────────────── look controls (mouse drag / touch / wheel) ─────────────────────────

function LookControls() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let lx = 0
    let ly = 0
    let id = -1
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.4) return
      dragging = true
      id = e.pointerId
      lx = e.clientX
      ly = e.clientY
    }
    const move = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== id) return
      input.lookX += (e.clientX - lx) * 0.0055
      input.lookY += (e.clientY - ly) * 0.004
      lx = e.clientX
      ly = e.clientY
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId === id) dragging = false
    }
    const wheel = (e: WheelEvent) => {
      cam.dist = Math.max(4, Math.min(16, cam.dist + e.deltaY * 0.01))
    }
    el.addEventListener('pointerdown', down)
    addEventListener('pointermove', move)
    addEventListener('pointerup', up)
    addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', down)
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', up)
      removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl])
  return null
}

// ───────────────────────── collectibles ─────────────────────────

function Shards() {
  const collected = useStore((s) => s.progress.shards)
  const collect = useStore((s) => s.collectShard)
  const group = useRef<Group>(null)
  const beamMat = useMemo(() => new MeshBasicMaterial({ color: new Color('#7ff3ff').multiplyScalar(1.5), transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false }), [])
  const items = useMemo(() => shards.map((s, i) => ({ id: s.id, pos: new Vector3(...SHARD_SPOTS[i % SHARD_SPOTS.length]) })), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current?.children.forEach((c, i) => {
      c.rotation.y = t * 1.5 + i
      c.position.y = items[i].pos.y + Math.sin(t * 2 + i) * 0.25
    })
    for (const it of items) {
      if (collected.includes(it.id)) continue
      if (player.distanceTo(it.pos) < 1.9) {
        if (collect(it.id)) {
          audio.shard()
          spawnBurst(it.pos, '#7ff3ff')
        }
      }
    }
  })

  return (
    <group ref={group}>
      {items.map((it) => (
        <group key={it.id} position={it.pos} visible={!collected.includes(it.id)}>
          <mesh material={crystalMat} scale={[0.45, 0.75, 0.45]}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
          <mesh material={beamMat} position={[0, 12, 0]}>
            <cylinderGeometry args={[0.08, 0.3, 24, 6, 1, true]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Rings() {
  const run = useStore((s) => s.ringRun)
  const setRun = useStore((s) => s.setRingRun)
  const finish = useStore((s) => s.finishRing)
  const push = useStore((s) => s.pushToast)
  const best = useStore((s) => s.progress.bestRing)
  const prevD = useRef<number[]>(RING_COURSE.map(() => 0))
  const meshes = useRef<(Mesh | null)[]>([])
  const mats = useMemo(() => RING_COURSE.map(() => new MeshBasicMaterial({ toneMapped: false, transparent: true })), [])
  const normals = useMemo(() => RING_COURSE.map((r) => new Vector3(Math.sin(r.rotY), 0, Math.cos(r.rotY))), [])
  const centers = useMemo(() => RING_COURSE.map((r) => new Vector3(...r.pos)), [])
  const tmp = useMemo(() => new Vector3(), [])
  const hot = useMemo(() => new Color('#ffd36b').multiplyScalar(3), [])
  const warm = useMemo(() => new Color('#ff9f6b').multiplyScalar(1.4), [])
  const cold = useMemo(() => new Color('#9fb4ff'), [])

  useFrame(({ clock }) => {
    const s = useStore.getState().ringRun
    const next = s.active ? s.next : 0
    RING_COURSE.forEach((_, i) => {
      tmp.copy(player).sub(centers[i])
      const d = tmp.dot(normals[i])
      const radial = tmp.addScaledVector(normals[i], -d).length()
      const crossed = prevD.current[i] !== 0 && Math.sign(d) !== Math.sign(prevD.current[i]) && radial < 2.9
      prevD.current[i] = d
      if (crossed && i === next) {
        audio.ring()
        spawnBurst(centers[i], '#ffd36b')
        if (!s.active) {
          setRun({ active: true, next: 1, startedAt: performance.now() })
          push({ kind: 'challenge', title: 'Sky ring time trial', text: `Go! Fly through all ${RING_COURSE.length} rings in order. Follow the glowing one.` })
        } else if (i === RING_COURSE.length - 1) {
          const time = (performance.now() - s.startedAt) / 1000
          const isBest = best === null || time < best
          finish(time)
          audio.success()
          push({ kind: 'challenge', title: isBest ? 'New best time!' : 'Course complete', text: `${time.toFixed(2)}s${best !== null && !isBest ? ` · best ${best.toFixed(2)}s` : ''}. Fly through the first ring to race again.` })
        } else {
          setRun({ next: i + 1 })
        }
      }
      // abandon a run after 2 minutes
      if (s.active && performance.now() - s.startedAt > 120000) setRun({ active: false, next: 0 })
      const m = mats[i]
      const pulse = 0.75 + Math.sin(clock.elapsedTime * 6) * 0.25
      if (i === next) {
        m.color.copy(hot).multiplyScalar(pulse)
        m.opacity = 1
      } else if (s.active && i === next + 1) {
        m.color.copy(warm)
        m.opacity = 0.8
      } else {
        m.color.copy(cold)
        m.opacity = 0.35
      }
      const mesh = meshes.current[i]
      if (mesh) mesh.rotation.z = clock.elapsedTime * (i === next ? 1.2 : 0.3)
    })
  })

  return (
    <>
      {RING_COURSE.map((r, i) => (
        <group key={i} position={r.pos} rotation-y={r.rotY}>
          <mesh ref={(m) => void (meshes.current[i] = m)} material={mats[i]}>
            <torusGeometry args={[2.6, 0.2, 6, 24]} />
          </mesh>
          {i === 0 && !run.active && (
            <Html center position={[0, 3.6, 0]} distanceFactor={18} zIndexRange={[10, 0]}>
              <div className="world-tag">START · ring trial{best !== null ? ` · best ${best.toFixed(1)}s` : ''}</div>
            </Html>
          )}
        </group>
      ))}
    </>
  )
}

function Bugs() {
  const squashed = useStore((s) => s.progress.bugs)
  const squash = useStore((s) => s.squashBug)
  const push = useStore((s) => s.pushToast)
  const group = useRef<Group>(null)
  const geo = useMemo(
    () =>
      build([
        { geo: G.sphere(0.45, 8, 6), color: '#e0453a', scale: [0.8, 0.6, 1] },
        { geo: G.sphere(0.22, 6, 5), color: '#2b2f3c', pos: [0, 0.05, 0.42] },
        { geo: G.box(0.04, 0.05, 0.8), color: '#2b2f3c', pos: [0, 0.27, 0] },
        ...[-1, 1].flatMap((side) =>
          [-0.2, 0.05, 0.3].map((z) => ({ geo: G.box(0.5, 0.04, 0.04), color: '#2b2f3c', pos: [side * 0.38, -0.1, z] as [number, number, number], rot: [0, 0, side * 0.5] as [number, number, number] })),
        ),
        { geo: G.ico(0.06, 0), color: '#ffffff', pos: [0.12, 0.15, 0.6] },
        { geo: G.ico(0.06, 0), color: '#ffffff', pos: [-0.12, 0.15, 0.6] },
      ]),
    [],
  )
  const pos = useMemo(() => BUG_SPOTS.map((p) => new Vector3(...p)), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const g = group.current
    if (!g) return
    BUG_SPOTS.forEach((a, i) => {
      const id = `b${i}`
      const c = g.children[i]
      if (!c) return
      // jittery "glitch" wander around the anchor
      const nx = (noise2(t * 0.35 + i * 10, 1) - 0.5) * 7
      const nz = (noise2(t * 0.35 + i * 10, 5) - 0.5) * 7
      const ny = Math.sin(t * 1.3 + i) * 0.8
      const glitch = Math.sin(t * 13 + i * 7) > 0.97 ? 0.4 : 0
      pos[i].set(a[0] + nx + glitch, a[1] + ny, a[2] + nz)
      c.position.copy(pos[i])
      c.rotation.y = Math.atan2(nx, nz) + Math.sin(t * 8) * 0.2
      if (!squashed.includes(id) && player.distanceTo(pos[i]) < 1.6) {
        squash(id)
        audio.splat()
        spawnBurst(pos[i], '#ff5f57')
        const n = useStore.getState().progress.bugs.length
        if (n === BUG_SPOTS.length) {
          audio.success()
          push({ kind: 'challenge', title: 'Bug hunt complete!', text: '0 known bugs in production. (For now.)' })
        } else {
          push({ kind: 'info', title: `Bug squashed ${n}/${BUG_SPOTS.length}`, text: 'It was a missing semicolon. Keep hunting!' })
        }
      }
    })
  })

  return (
    <group ref={group}>
      {BUG_SPOTS.map((_, i) => (
        <mesh key={i} geometry={geo} material={vertexMat} visible={!squashed.includes(`b${i}`)} castShadow />
      ))}
    </group>
  )
}

/** Hidden "server room" islet below the cloud sea, with a very important duck. */
function HiddenRoom() {
  const findEgg = useStore((s) => s.findEgg)
  const duck = useRef<Group>(null)
  const lastQuack = useRef(0)
  const leds = useRef<Group>(null)
  const h = DISTRICTS.hidden
  const ground = useMemo(() => islandGeometry({ radiusAt: circleRadius(h.radius, 31), depth: 8, seed: 31, segments: 28, rings: 4, layers: 5, grass: ['#59607a', '#4f566e'], rock: ['#3d3a4f', '#2f2c3d'] }), [h.radius])
  const rack = useMemo(
    () =>
      build([
        { geo: G.box(1.2, 2.6, 0.9), color: '#2b2f3c', pos: [-1.6, 1.3, -1.2] },
        { geo: G.box(1.2, 2.6, 0.9), color: '#2b2f3c', pos: [-0.3, 1.3, -1.6] },
        { geo: G.cyl(0.5, 0.6, 0.5, 8), color: '#59607a', pos: [RUBBER_DUCK[0] - DISTRICTS.hidden.pos[0], 0.25, RUBBER_DUCK[2] - DISTRICTS.hidden.pos[2]] },
      ]),
    [],
  )
  const duckGeo = useMemo(
    () =>
      build([
        { geo: G.sphere(0.45, 8, 6), color: '#ffd84a', scale: [1, 0.75, 1.2] },
        { geo: G.sphere(0.28, 8, 6), color: '#ffd84a', pos: [0, 0.45, 0.32] },
        { geo: G.box(0.22, 0.08, 0.2), color: '#ff8a3d', pos: [0, 0.42, 0.62] },
        { geo: G.ico(0.04, 0), color: '#1a1a1a', pos: [0.12, 0.55, 0.52] },
        { geo: G.ico(0.04, 0), color: '#1a1a1a', pos: [-0.12, 0.55, 0.52] },
      ]),
    [],
  )
  const signMat = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 160
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#0b0f1c'
    ctx.fillRect(0, 0, 512, 160)
    ctx.fillStyle = '#7ff3ff'
    ctx.font = '700 34px "JetBrains Mono Variable", monospace'
    ctx.fillText('/dev/null island', 26, 64)
    ctx.fillStyle = '#9aa6c7'
    ctx.font = '500 22px "JetBrains Mono Variable", monospace'
    ctx.fillText('where the bugs come from 🐛', 26, 112)
    const tex = new CanvasTexture(c)
    tex.colorSpace = SRGBColorSpace
    return new MeshBasicMaterial({ map: tex, toneMapped: false, color: new Color(1.3, 1.3, 1.3) })
  }, [])
  const duckPos = useMemo(() => new Vector3(...RUBBER_DUCK), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (duck.current) {
      duck.current.rotation.y = Math.sin(t * 0.8) * 0.5
      duck.current.position.y = RUBBER_DUCK[1] - h.pos[1] + Math.sin(t * 2) * 0.05
    }
    leds.current?.children.forEach((c, i) => (c.visible = Math.sin(t * (3 + i) + i * 2) > 0))
    if (player.distanceTo(duckPos) < 2.4 && t - lastQuack.current > 2) {
      lastQuack.current = t
      audio.quack()
      findEgg('duck', 'Rubber duck debugging', 'You flew below the clouds and found the duck. Explaining your code to it fixes 100% of bugs.')
    }
  })

  return (
    <group position={h.pos}>
      <mesh geometry={ground} material={vertexMat} />
      <mesh geometry={rack} material={vertexMat} />
      <group ref={duck} position={[RUBBER_DUCK[0] - h.pos[0], 0, RUBBER_DUCK[2] - h.pos[2]]}>
        <mesh geometry={duckGeo} material={vertexMat} />
      </group>
      <group ref={leds}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[i < 5 ? -1.6 : -0.3, 0.6 + (i % 5) * 0.42, i < 5 ? -0.74 : -1.14]} material={crystalMat}>
            <boxGeometry args={[0.5, 0.05, 0.02]} />
          </mesh>
        ))}
      </group>
      <mesh position={[1.4, 1.8, -2.2]} rotation-y={-0.4} material={signMat}>
        <planeGeometry args={[3.2, 1.0]} />
      </mesh>
      <pointLight color="#7ff3ff" intensity={10} distance={14} position={[-1.5, 3, -1.5]} />
      <pointLight color="#ffe6b8" intensity={12} distance={8} position={[RUBBER_DUCK[0] - h.pos[0] + 0.6, 2.4, RUBBER_DUCK[2] - h.pos[2] + 1.2]} />
    </group>
  )
}

/** Fireworks over the city once every shard is found. */
function Fireworks() {
  const done = useStore((s) => s.progress.shards.length >= shards.length)
  const t0 = useRef(0)
  useFrame(({ clock }) => {
    if (!done) return
    const t = clock.elapsedTime
    if (t - t0.current > 0.7) {
      t0.current = t
      const colors = ['#ffd36b', '#ff7aa8', '#7ff3ff', '#8be28b', '#c9a7ff']
      spawnBurst(new Vector3((Math.random() - 0.5) * 40, 22 + Math.random() * 10, (Math.random() - 0.5) * 40), colors[Math.floor(Math.random() * colors.length)])
    }
  })
  return null
}

/** Watches for 100% completion and shows the hidden reward message once. */
function RewardWatcher() {
  const count = useStore((s) => s.progress.shards.length)
  const seen = useStore((s) => s.progress.rewardSeen)
  useEffect(() => {
    if (count >= shards.length && !seen) {
      const s = useStore.getState()
      audio.success()
      s.markRewardSeen()
      s.pushToast({ kind: 'reward', title: playCopy.rewardTitle, text: playCopy.rewardText })
    }
  }, [count, seen])
  return null
}

/** Play Mode has its own slow day-night loop: it starts at night and rolls into a new day. */
function DayCycle() {
  const start = useRef(-1)
  useFrame(({ clock }) => {
    if (start.current < 0) start.current = clock.elapsedTime
    const t = clock.elapsedTime - start.current
    const phase = 0.22 + 0.78 * (0.5 + 0.5 * Math.cos((t / 300) * Math.PI * 2))
    live.dayPhase = phase
    sampleDay(phase)
    live.night = env.night
    audio.setWind(Math.min(1, live.player.speed / 30))
  }, -2)
  return null
}

export default function PlayMode() {
  useEffect(() => {
    useStore.getState().pushToast({ kind: 'info', title: 'Play Mode', text: `Find all ${shards.length} data shards, race the sky rings and squash the bugs. Your progress is saved.` })
  }, [])
  return (
    <>
      <DayCycle />
      <LookControls />
      <Physics gravity={[0, 0, 0]} timeStep="vary">
        <WorldColliders />
        <Drone />
      </Physics>
      <Shards />
      <Rings />
      <Bugs />
      <HiddenRoom />
      <Fireworks />
      <RewardWatcher />
      <Bursts />
    </>
  )
}
