import { useStore } from '../state/store'
import { audio } from './audio'

/**
 * Global easter eggs: the Konami code (retro pixel mode) and a message for
 * developers who open the console.
 */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']

export function bindGlobalEggs() {
  let idx = 0
  const onKey = (e: KeyboardEvent) => {
    idx = e.code === KONAMI[idx] ? idx + 1 : e.code === KONAMI[0] ? 1 : 0
    if (idx === KONAMI.length) {
      idx = 0
      const s = useStore.getState()
      s.toggleRetro()
      audio.success()
      s.findEgg('konami', 'Retro mode', '↑↑↓↓←→←→BA — 8-bit city unlocked. Enter the code again to switch back.')
    }
  }
  addEventListener('keydown', onKey)

  const w = window as unknown as { island?: unknown }
  w.island = {
    secret() {
      useStore.getState().findEgg('console', 'Console explorer', 'You read the source of the sky. Respect. Say hi via the contact rocket.')
      return '🛰️  Egg logged. Check the screen.'
    },
    retro() {
      useStore.getState().toggleRetro()
      return 'Toggled retro mode.'
    },
  }
  console.log(
    '%c🏝️ Floating Island City%c\nBuilt with React Three Fiber, GSAP, Lenis & Rapier — zero downloaded 3D models.\nCurious? Type %cisland.secret()%c for an easter egg.',
    'font: 700 18px system-ui; color: #ffb48c',
    'font: 13px system-ui; color: inherit',
    'font: 600 13px monospace; color: #7ff3ff',
    'font: 13px system-ui; color: inherit',
  )

  return () => removeEventListener('keydown', onKey)
}
