import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { sampleCamera } from '../systems/cameraPath'
import { sampleDay, env } from '../systems/dayNight'
import { live, useStore } from '../state/store'
import { damp } from '../systems/math'
import { audio } from '../systems/audio'
import { shake } from './finale/Finale'

/** Flies the camera along the scroll-driven path and drives the day-night cycle. */
export function JourneyCamera() {
  const reduced = useStore((s) => s.reducedMotion)
  const entered = useStore((s) => s.entered)
  const enteredAt = useRef(-1)
  const pos = useMemo(() => new Vector3(), [])
  const target = useMemo(() => new Vector3(), [])
  const look = useRef(new Vector3())
  const smoothPointer = useRef({ x: 0, y: 0 })
  const initialised = useRef(false)
  const tmp = useMemo(() => ({ fwd: new Vector3(), right: new Vector3(), up: new Vector3(0, 1, 0) }), [])

  useFrame((state, dt) => {
    const cam = state.camera as PerspectiveCamera
    const day = sampleCamera(live.progress, pos, target)

    const aspect = state.size.width / state.size.height
    const fov = aspect < 0.8 ? 58 : aspect < 1.2 ? 52 : 45
    if (cam.fov !== fov) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
    // shift the lens so the subject sits clear of the cards: right of them on desktop, above them on phones
    const { width, height } = state.size
    const sx = aspect > 1.1 ? -Math.round(width * 0.14) : 0
    const sy = aspect < 0.85 ? Math.round(height * 0.17) : 0
    const v = cam.view
    if (!v || !v.enabled || v.offsetX !== sx || v.offsetY !== sy || v.fullWidth !== width || v.fullHeight !== height) {
      cam.setViewOffset(width, height, sx, sy, width, height)
    }

    // portrait screens: pull back so the subject still fits
    if (aspect < 1) pos.sub(target).multiplyScalar(1 + (1 / aspect - 1) * 0.42).add(target)

    // gentle pointer parallax
    if (!reduced) {
      const sp = smoothPointer.current
      sp.x += (live.pointer.x - sp.x) * damp(3, dt)
      sp.y += (live.pointer.y - sp.y) * damp(3, dt)
      tmp.fwd.subVectors(target, pos).normalize()
      tmp.right.crossVectors(tmp.fwd, tmp.up).normalize()
      pos.addScaledVector(tmp.right, sp.x * 0.9).addScaledVector(tmp.up, sp.y * 0.5)
    }

    // takeoff: before entering, wait low in the clouds; after, rise into the first shot
    if (entered && enteredAt.current < 0) enteredAt.current = state.clock.elapsedTime
    const fly = !entered ? 0 : reduced ? 1 : Math.min(1, (state.clock.elapsedTime - enteredAt.current) / 3.4)
    if (fly < 1 && live.progress < 0.02) {
      const e = 1 - Math.pow(1 - fly, 3)
      pos.x += (1 - e) * -10
      pos.y += (1 - e) * -15
      pos.z += (1 - e) * 24
      target.y += (1 - e) * -6
    }

    if (!initialised.current) {
      cam.position.copy(pos)
      look.current.copy(target)
      initialised.current = true
      live.dayPhase = day
    }
    const k = damp(reduced ? 14 : 3.6, dt)
    cam.position.lerp(pos, k)
    look.current.lerp(target, k)
    cam.lookAt(look.current)
    if (shake.amount > 0 && !reduced) {
      cam.position.x += (Math.random() - 0.5) * shake.amount
      cam.position.y += (Math.random() - 0.5) * shake.amount
    }

    live.dayPhase += (day - live.dayPhase) * damp(2.5, dt)
    sampleDay(live.dayPhase)
    live.night = env.night
    audio.setWind(live.velocity)
  }, -2)

  return null
}
