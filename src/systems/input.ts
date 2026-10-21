/**
 * Unified Play Mode input: keyboard, mouse look and the on-screen joystick all write here,
 * the drone reads it every frame.
 */
export const input = {
  forward: 0,
  right: 0,
  up: 0,
  boost: false,
  /** accumulated look delta in radians, consumed by the camera each frame */
  lookX: 0,
  lookY: 0,
  /** joystick axes (-1..1), merged with keys */
  joyX: 0,
  joyY: 0,
  joyUp: 0,
  interact: false,
  reset: false,
}

const keys = new Set<string>()

function recompute() {
  const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0)
  const r = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0)
  const u = (keys.has('Space') || keys.has('KeyE') ? 1 : 0) - (keys.has('KeyC') || keys.has('KeyQ') ? 1 : 0)
  input.forward = f
  input.right = r
  input.up = u
  input.boost = keys.has('ShiftLeft') || keys.has('ShiftRight')
}

const PLAY_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyE', 'KeyQ', 'KeyC', 'ShiftLeft', 'ShiftRight', 'KeyF', 'KeyR'])

export function bindPlayInput() {
  let turn = 0
  const onDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
    if (!PLAY_KEYS.has(e.code)) return
    e.preventDefault()
    keys.add(e.code)
    if (e.code === 'KeyF' || e.code === 'Enter') input.interact = true
    if (e.code === 'KeyR') input.reset = true
    if (e.code === 'ArrowLeft') turn = -1
    if (e.code === 'ArrowRight') turn = 1
    recompute()
  }
  const onUp = (e: KeyboardEvent) => {
    keys.delete(e.code)
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') turn = 0
    recompute()
  }
  const onBlur = () => {
    keys.clear()
    turn = 0
    recompute()
  }
  let raf = 0
  const loop = () => {
    if (turn) input.lookX += turn * 0.035
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  addEventListener('keydown', onDown)
  addEventListener('keyup', onUp)
  addEventListener('blur', onBlur)
  return () => {
    cancelAnimationFrame(raf)
    removeEventListener('keydown', onDown)
    removeEventListener('keyup', onUp)
    removeEventListener('blur', onBlur)
    keys.clear()
    recompute()
  }
}
