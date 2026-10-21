import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
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

/** If the 3D scene ever crashes, fall back to the 2D site instead of a blank page. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error('3D scene failed, switching to 2D mode', error)
    const s = useStore.getState()
    s.setMode('flat')
    s.pushToast({ kind: 'info', title: 'Switched to the 2D version', text: 'The 3D city could not start on this device, so here is the fast 2D version.' })
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

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

  useEffect(() => {
    document.documentElement.classList.toggle('is-playing', mode === 'play')
  }, [mode])

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
        <SceneBoundary>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </SceneBoundary>
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
