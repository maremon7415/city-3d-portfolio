import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, type AmbientLight, type DirectionalLight, type Fog, type HemisphereLight } from 'three'
import { env } from '../../systems/dayNight'
import { live, useStore } from '../../state/store'

const moonFill = new Color('#7d8be0')

/** Sun/moon key light, sky fill and fog — all driven by the day-night env. */
export function Lighting() {
  const sun = useRef<DirectionalLight>(null)
  const hemi = useRef<HemisphereLight>(null)
  const fog = useRef<Fog>(null)
  const ambient = useRef<AmbientLight>(null)
  const quality = useStore((s) => s.quality)
  const scene = useThree((s) => s.scene)

  useFrame(() => {
    const s = sun.current
    if (s) {
      // shadow frustum covers the main island; in Play Mode it follows the drone
      const play = useStore.getState().mode === 'play'
      const fx = play ? Math.round(live.player.x / 6) * 6 : 0
      const fz = play ? Math.round(live.player.z / 6) * 6 : 6
      s.target.position.set(fx, 0, fz)
      s.position.set(fx + env.sunDir.x * 70, Math.max(6, env.sunDir.y * 70), fz + env.sunDir.z * 70)
      s.target.updateMatrixWorld()
      s.color.copy(env.sun)
      s.intensity = env.sunIntensity
    }
    if (hemi.current) {
      hemi.current.color.copy(env.hemiSky)
      hemi.current.groundColor.copy(env.hemiGround)
      hemi.current.intensity = env.hemiIntensity
    }
    if (ambient.current) {
      // soft fill tinted by the sky so shadowed cliffs keep their colour
      ambient.current.color.copy(env.fog).lerp(moonFill, env.night * 0.55)
      ambient.current.intensity = 0.55 + env.night * 0.45
    }
    if (fog.current) fog.current.color.copy(env.fog)
    if (scene.fog !== fog.current && fog.current) scene.fog = fog.current
  })

  const shadows = quality === 'high'
  return (
    <>
      <fog ref={fog} attach="fog" args={['#f1b9a2', 70, 330]} />
      <hemisphereLight ref={hemi} args={['#ffffff', '#666666', 1]} />
      <ambientLight ref={ambient} intensity={0.5} />
      <directionalLight
        ref={sun}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
        shadow-camera-left={-46}
        shadow-camera-right={46}
        shadow-camera-top={46}
        shadow-camera-bottom={-46}
        shadow-camera-near={1}
        shadow-camera-far={200}
      />
    </>
  )
}
