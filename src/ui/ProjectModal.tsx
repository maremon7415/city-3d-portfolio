import { useEffect, useRef, useState } from 'react'
import { projects } from '../content'
import { useStore } from '../state/store'
import { Modal } from './Modal'
import { DEMO_H, DEMO_W, drawDemo } from '../scenes/projects/demoScreen'
import { audio } from '../systems/audio'

function DemoCanvas({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const project = projects.find((p) => p.id === id)!
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let raf = 0
    const start = performance.now()
    const loop = () => {
      drawDemo(ctx, project, (performance.now() - start) / 1000)
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [project])
  return <canvas ref={ref} width={DEMO_W} height={DEMO_H} className="demo-canvas" aria-label={`Animated preview of ${project.title}`} role="img" />
}

export function ProjectModal() {
  const id = useStore((s) => s.activeProject)
  const open = useStore((s) => s.openProject)
  const [live, setLive] = useState(false)
  const idx = projects.findIndex((p) => p.id === id)
  const p = idx >= 0 ? projects[idx] : null

  useEffect(() => setLive(false), [id])

  const close = () => {
    audio.close()
    open(null)
  }
  const go = (d: number) => {
    audio.click()
    open(projects[(idx + d + projects.length) % projects.length].id)
  }

  return (
    <Modal open={!!p} onClose={close} labelledBy="project-modal-title" className="project-modal">
      {p && (
        <div className="pm" style={{ ['--accent' as string]: p.accent }}>
          <div className="pm-screen">
            {live && p.embedUrl ? (
              <iframe src={p.embedUrl} title={`${p.title} live demo`} loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
            ) : (
              <DemoCanvas id={p.id} />
            )}
            {p.embedUrl && !live && (
              <button className="btn primary pm-run" onClick={() => setLive(true)}>
                ▶ Run the real app here
              </button>
            )}
          </div>
          <div className="pm-info">
            <p className="kicker">
              Project {idx + 1}/{projects.length} · {p.year} · {p.role}
            </p>
            <h2 id="project-modal-title">{p.title}</h2>
            <p className="tagline">{p.tagline}</p>
            <p className="body">{p.description}</p>
            <ul className="tags" aria-label="Tech stack">
              {p.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="actions">
              {p.liveUrl && (
                <a className="btn primary" href={p.liveUrl} target="_blank" rel="noreferrer" data-autofocus>
                  Visit live site ↗
                </a>
              )}
              {p.codeUrl && (
                <a className="btn ghost" href={p.codeUrl} target="_blank" rel="noreferrer">
                  Source code ↗
                </a>
              )}
            </div>
            <div className="pm-nav">
              <button className="icon-btn" onClick={() => go(-1)} aria-label="Previous project">
                ←
              </button>
              <button className="icon-btn" onClick={() => go(1)} aria-label="Next project">
                →
              </button>
            </div>
          </div>
          <button className="icon-btn modal-close" onClick={close} aria-label="Close project">
            ✕
          </button>
        </div>
      )}
    </Modal>
  )
}
