import { lazy, Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor, AdaptiveDpr, Stats } from '@react-three/drei'
import { Sky } from './environment/Sky'
import { Lighting } from './environment/Lighting'
import { Clouds } from './environment/Clouds'
import { Effects } from './environment/Effects'
import { MainIsland, Islets } from './world/Island'
import { Town } from './world/Town'
import { Water } from './world/Water'
import { Landmarks } from './intro/Landmarks'
import { ProjectsDistrict } from './projects/ProjectsDistrict'
import { SkillsGarden } from './skills/SkillsGarden'
import { AboutWorkshop } from './about/AboutWorkshop'
import { Finale } from './finale/Finale'
import { JourneyCamera } from './JourneyCamera'
import { updateMaterials } from './materials'
import { useStore } from '../state/store'
import { loader } from '../ui/loader'

const PlayMode = lazy(() => import('./play/PlayMode'))
export const preloadPlayMode = () => import('./play/PlayMode')

function EnvDriver() {
  useFrame(({ clock }) => updateMaterials(clock.elapsedTime), -1)
  return null
}

/** Compiles every shader up-front, then tells the loader we're ready. */
function SceneReady() {
  const { gl, scene, camera } = useThree()
  const setSceneReady = useStore((s) => s.setSceneReady)
  const frames = useRef(0)
  const done = useRef(false)
  useEffect(() => {
    loader.set(0.72, 'Compiling shaders')
    const id = requestAnimationFrame(() => {
      try {
        gl.compile(scene, camera)
      } catch {
        /* compile is an optimisation only */
      }
      loader.set(0.9, 'Lighting the city')
    })
    return () => cancelAnimationFrame(id)
  }, [gl, scene, camera])
  useFrame(() => {
    if (done.current) return
    frames.current++
    if (frames.current > 3) {
      done.current = true
      setSceneReady()
      loader.set(1, 'Ready')
    }
  })
  return null
}

export function Experience() {
  const quality = useStore((s) => s.quality)
  const mode = useStore((s) => s.mode)
  const debug = useStore((s) => s.debug)
  const setQuality = useStore((s) => s.setQuality)

  return (
    <Canvas
      className="scene-canvas"
      aria-hidden="true"
      dpr={[1, quality === 'high' ? 1.75 : 1.25]}
      shadows={quality === 'high' ? 'soft' : false}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 45, near: 0.3, far: 1200, position: [-46, -7, 64] }}
      onCreated={() => loader.set(0.6, 'Building the island')}
    >
      <PerformanceMonitor flipflops={2} onDecline={() => setQuality('low')} />
      <AdaptiveDpr pixelated={false} />
      {debug && <Stats />}
      <EnvDriver />
      <Sky />
      <Lighting />
      <Clouds />
      <MainIsland />
      <Islets />
      <Water />
      <Town />
      <Landmarks />
      <ProjectsDistrict />
      <SkillsGarden />
      <AboutWorkshop />
      <Finale />
      {mode === 'journey' && <JourneyCamera />}
      {mode === 'play' && (
        <Suspense fallback={null}>
          <PlayMode />
        </Suspense>
      )}
      <Effects />
      <SceneReady />
    </Canvas>
  )
}
