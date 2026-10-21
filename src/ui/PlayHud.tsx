import { useEffect, useRef, useState } from 'react'
import { shards } from '../content'
import { live, useStore } from '../state/store'
import { input } from '../systems/input'
import { audio } from '../systems/audio'
import { BUG_SPOTS, DISTRICTS, ISLETS, LAUNCH_PAD, PROJECT_SLOTS, SHARD_SPOTS, islandRadiusAt } from '../systems/layout'
import { isTouch } from '../systems/quality'
import { SoundToggle } from './Nav'

const EGG_TOTAL = 4

function Joystick() {
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const active = useRef(-1)
  const move = (e: React.PointerEvent) => {
    if (active.current !== e.pointerId || !base.current) return
    const r = base.current.getBoundingClientRect()
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > 1) {
      dx /= len
      dy /= len
    }
    input.joyX = dx
    input.joyY = -dy
    setKnob({ x: dx, y: dy })
  }
  const end = () => {
    active.current = -1
    input.joyX = 0
    input.joyY = 0
    setKnob({ x: 0, y: 0 })
  }
  return (
    <div
      ref={base}
      className="joystick"
      onPointerDown={(e) => {
        active.current = e.pointerId
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      aria-hidden="true"
    >
      <div className="knob" style={{ transform: `translate(${knob.x * 34}px, ${knob.y * 34}px)` }} />
    </div>
  )
}

function HoldButton({ label, onChange, className = '' }: { label: string; onChange: (down: boolean) => void; className?: string }) {
  return (
    <button
      className={`hold-btn ${className}`}
      onPointerDown={(e) => {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        onChange(true)
      }}
      onPointerUp={() => onChange(false)}
      onPointerCancel={() => onChange(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )
}

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null)
  const collected = useStore((s) => s.progress.shards)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const S = c.width
    const scale = S / 200
    const toMap = (x: number, z: number) => [S / 2 + x * scale, S / 2 + (z - 6) * scale] as const
    let raf = 0
    let last = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 90) return
      last = now
      ctx.clearRect(0, 0, S, S)
      ctx.save()
      ctx.beginPath()
      ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = 'rgba(12,16,40,0.72)'
      ctx.fillRect(0, 0, S, S)
      // islands
      ctx.fillStyle = '#7cc25c'
      ctx.beginPath()
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2
        const r = islandRadiusAt(a)
        const [x, y] = toMap(Math.cos(a) * r, Math.sin(a) * r)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.fill()
      ctx.fillStyle = '#5f9a4c'
      for (const isl of [...ISLETS, { pos: DISTRICTS.finale.pos, radius: DISTRICTS.finale.radius }]) {
        const [x, y] = toMap(isl.pos[0], isl.pos[2])
        ctx.beginPath()
        ctx.arc(x, y, isl.radius * scale, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#f4f1ea'
      for (const s of PROJECT_SLOTS) {
        const [x, y] = toMap(s.pos[0], s.pos[2])
        ctx.fillRect(x - 2.5, y - 2.5, 5, 5)
      }
      {
        const [x, y] = toMap(LAUNCH_PAD[0], LAUNCH_PAD[2])
        ctx.fillStyle = '#ff9f6b'
        ctx.font = '12px sans-serif'
        ctx.fillText('🚀', x - 6, y + 4)
      }
      // shards (hidden-room shard is a secret, so not shown)
      shards.forEach((sh, i) => {
        if (collected.includes(sh.id) || i === SHARD_SPOTS.length - 1) return
        const p = SHARD_SPOTS[i]
        const [x, y] = toMap(p[0], p[2])
        ctx.fillStyle = '#7ff3ff'
        ctx.beginPath()
        ctx.moveTo(x, y - 3.5)
        ctx.lineTo(x + 2.5, y)
        ctx.lineTo(x, y + 3.5)
        ctx.lineTo(x - 2.5, y)
        ctx.fill()
      })
      // player
      const [px, py] = toMap(live.player.x, live.player.z)
      ctx.translate(px, py)
      ctx.rotate(-live.player.yaw)
      ctx.fillStyle = '#ffd36b'
      ctx.beginPath()
      ctx.moveTo(0, -7)
      ctx.lineTo(5, 5)
      ctx.lineTo(0, 2.5)
      ctx.lineTo(-5, 5)
      ctx.fill()
      ctx.restore()
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2)
      ctx.stroke()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [collected])
  return <canvas ref={ref} width={150} height={150} className="minimap" aria-hidden="true" />
}

function RingTimer() {
  const run = useStore((s) => s.ringRun)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!run.active) return
    let raf = 0
    const tick = () => {
      if (ref.current) ref.current.textContent = ((performance.now() - run.startedAt) / 1000).toFixed(1)
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [run.active, run.startedAt])
  if (!run.active) return null
  return (
    <div className="ring-timer" role="timer">
      <span className="label">Ring {run.next}/9</span>
      <span ref={ref} className="time">
        0.0
      </span>
      <span className="unit">s</span>
    </div>
  )
}

export default function PlayHud() {
  const progress = useStore((s) => s.progress)
  const setMode = useStore((s) => s.setMode)
  const nearRocket = useStore((s) => s.nearRocket)
  const launch = useStore((s) => s.launchRocket)
  const reset = useStore((s) => s.resetProgress)
  const [help, setHelp] = useState(true)
  const touch = isTouch()

  useEffect(() => {
    const exit = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (e.key === 'Escape' && !document.querySelector('.modal')) setMode('journey')
      if (e.key === 'h' || e.key === 'H' || e.key === '?') setHelp((v) => !v)
    }
    addEventListener('keydown', exit)
    const t = window.setTimeout(() => setHelp(false), 9000)
    return () => {
      removeEventListener('keydown', exit)
      clearTimeout(t)
    }
  }, [setMode])

  return (
    <div className="hud" role="region" aria-label="Play Mode controls">
      <div className="hud-stats">
        <div className="stat" title="Data shards">
          <span className="ic shard" aria-hidden="true">
            ◆
          </span>
          <b>{progress.shards.length}</b>/{shards.length}
          <span className="sr-only"> data shards</span>
        </div>
        <div className="stat" title="Bugs squashed">
          <span aria-hidden="true">🐞</span>
          <b>{progress.bugs.length}</b>/{BUG_SPOTS.length}
          <span className="sr-only"> bugs squashed</span>
        </div>
        <div className="stat" title="Easter eggs">
          <span aria-hidden="true">🥚</span>
          <b>{progress.eggs.length}</b>/{EGG_TOTAL}
          <span className="sr-only"> easter eggs</span>
        </div>
        {progress.bestRing !== null && (
          <div className="stat" title="Best ring time">
            <span aria-hidden="true">🏁</span>
            <b>{progress.bestRing.toFixed(1)}s</b>
          </div>
        )}
      </div>

      <div className="hud-actions">
        <SoundToggle />
        <button className="icon-btn" onClick={() => setHelp((v) => !v)} aria-label="Controls help" aria-expanded={help}>
          ?
        </button>
        <button
          className="pill-btn"
          onClick={() => {
            audio.close()
            setMode('journey')
          }}
        >
          Exit <span className="kbd">Esc</span>
        </button>
      </div>

      <RingTimer />

      {nearRocket && (
        <button
          className="prompt"
          onClick={() => {
            audio.rocket()
            launch()
          }}
        >
          {touch ? 'Tap' : 'Press F'} to launch the contact rocket <span aria-hidden="true">🚀</span>
        </button>
      )}

      {help && (
        <div className="help-card" role="dialog" aria-label="How to play">
          <h2>How to play</h2>
          {touch ? (
            <ul>
              <li>Left stick — fly</li>
              <li>Drag right side — look around</li>
              <li>▲ ▼ — up / down · ⚡ boost</li>
            </ul>
          ) : (
            <ul>
              <li>
                <span className="kbd">W A S D</span> fly · <span className="kbd">Shift</span> boost
              </li>
              <li>
                <span className="kbd">Space</span>/<span className="kbd">E</span> up · <span className="kbd">C</span>/<span className="kbd">Q</span> down
              </li>
              <li>Drag mouse or ← → to look · wheel to zoom</li>
              <li>
                <span className="kbd">F</span> interact · <span className="kbd">R</span> reset · <span className="kbd">H</span> help
              </li>
            </ul>
          )}
          <p>Collect {shards.length} data shards · race the sky rings · squash 6 bugs · find 4 secrets (one is below the clouds…)</p>
          <div className="actions">
            <button className="btn primary small" onClick={() => setHelp(false)}>
              Let&apos;s fly
            </button>
            {(progress.shards.length > 0 || progress.eggs.length > 0) && (
              <button
                className="btn ghost small"
                onClick={() => {
                  if (confirm('Reset all Play Mode progress?')) reset()
                }}
              >
                Reset progress
              </button>
            )}
          </div>
        </div>
      )}

      {!touch && <Minimap />}

      {touch && (
        <>
          <Joystick />
          <div className="touch-buttons">
            <HoldButton label="▲" onChange={(d) => (input.joyUp = d ? 1 : 0)} />
            <HoldButton label="▼" onChange={(d) => (input.joyUp = d ? -1 : 0)} />
            <HoldButton label="⚡" className="boost" onChange={(d) => (input.boost = d)} />
          </div>
        </>
      )}
    </div>
  )
}
