import { lazy, Suspense, useEffect } from 'react'
import { useStore } from './state/store'
import { Journey } from './ui/Journey'
import { Nav } from './ui/Nav'
import { ProjectModal } from './ui/ProjectModal'
import { ContactTerminal } from './ui/ContactTerminal'
import { Toasts } from './ui/Toasts'
import { FlatSite } from './ui/FlatSite'
import { loader, loaderButtons } from './ui/loader'
import { audio } from './systems/audio'
import { bindGlobalEggs } from './systems/eggs'
import { live } from './state/store'
import { lockScroll } from './systems/scroll'

const Experience = lazy(() => import('./scenes/Experience').then((m) => ({ default: m.Experience })))
const PlayHud = lazy(() => import('./ui/PlayHud'))

export function App() {
  const mode = useStore((s) => s.mode)
  const entered = useStore((s) => s.entered)
  const sceneReady = useStore((s) => s.sceneReady)
  const soundOn = useStore((s) => s.soundOn)
  const chapter = useStore((s) => s.chapter)

  // warm up the Play Mode chunk (physics) while the visitor reads the last chapters
  useEffect(() => {
    if (chapter < 3) return
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200))
    idle(() => void import('./scenes/play/PlayMode'))
  }, [chapter])

  // sound follows the store (store changes happen inside click handlers = user gestures)
  useEffect(() => {
    audio.setEnabled(soundOn && entered)
  }, [soundOn, entered])

  // loader → enter flow
  useEffect(() => {
    const { enter, enterSound, skip } = loaderButtons()
    const go = (withSound: boolean) => {
      if (withSound) useStore.getState().toggleSound(true)
      useStore.getState().enter()
      loader.hide()
    }
    const onEnter = () => go(false)
    const onEnterSound = () => go(true)
    const onSkip = () => {
      useStore.getState().setMode('flat')
      useStore.getState().enter()
      loader.hide()
    }
    enter?.addEventListener('click', onEnter)
    enterSound?.addEventListener('click', onEnterSound)
    skip?.addEventListener('click', onSkip)
    return () => {
      enter?.removeEventListener('click', onEnter)
      enterSound?.removeEventListener('click', onEnterSound)
      skip?.removeEventListener('click', onSkip)
    }
  }, [])

  useEffect(() => {
    if (mode === 'flat' && !entered) {
      useStore.getState().enter()
      loader.set(1, 'Ready')
      loader.hide()
    }
  }, [mode, entered])

  useEffect(() => {
    if (!sceneReady) return
    loader.onReady(() => {
      loaderButtons().enter?.focus({ preventScroll: true })
    })
  }, [sceneReady])

  // keep the page still until the visitor enters
  useEffect(() => {
    if (mode === 'flat') return lockScroll(false)
    lockScroll(!entered || mode === 'play')
  }, [entered, mode])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      live.pointer.x = (e.clientX / innerWidth) * 2 - 1
      live.pointer.y = -((e.clientY / innerHeight) * 2 - 1)
    }
    addEventListener('pointermove', onMove, { passive: true })
    const unbindEggs = bindGlobalEggs()
    return () => {
      removeEventListener('pointermove', onMove)
      unbindEggs()
    }
  }, [])

  return (
    <>
      <a className="skip-link" href="#flat-main" onClick={(e) => {
        e.preventDefault()
        useStore.getState().setMode('flat')
      }}>
        Skip to content
      </a>
      {mode !== 'flat' && (
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      )}
      {mode !== 'flat' && <Journey hidden={mode === 'play'} />}
      {mode !== 'flat' && <Nav />}
      {mode === 'play' && (
        <Suspense fallback={null}>
          <PlayHud />
        </Suspense>
      )}
      {mode === 'flat' && <FlatSite />}
      <ProjectModal />
      <ContactTerminal />
      <Toasts />
    </>
  )
}
