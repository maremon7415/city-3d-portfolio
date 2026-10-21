import { useEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { aboutItems, profile, projects, skillGroups, shards } from '../content'
import { initScroll, refreshScroll, scrollToChapter } from '../systems/scroll'
import { useStore } from '../state/store'
import { audio } from '../systems/audio'
import { smoothstep } from '../systems/math'

function useReveal(container: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = container.current
    if (!root) return
    const triggers = Array.from(root.querySelectorAll<HTMLElement>('[data-stop]')).map((panel, i) => {
      const card = panel.querySelector<HTMLElement>('.card')
      return ScrollTrigger.create({
        trigger: panel,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          if (!card) return
          const p = self.progress
          const isFirst = i === 0
          const v = (isFirst ? 1 : smoothstep(0.1, 0.3, p)) * (1 - smoothstep(0.72, 0.9, p))
          card.style.setProperty('--reveal', v.toFixed(3))
          card.style.pointerEvents = v > 0.5 ? 'auto' : 'none'
          card.toggleAttribute('inert', v < 0.05)
        },
      })
    })
    ScrollTrigger.refresh()
    return () => triggers.forEach((t) => t.kill())
  }, [container])
}

function Hero() {
  const setMode = useStore((s) => s.setMode)
  const entered = useStore((s) => s.entered)
  return (
    <div className={`card hero-card ${entered ? 'is-in' : ''}`} style={{ ['--reveal' as string]: 1 }}>
      <p className="kicker">
        <span className="dot" /> {profile.availability}
      </p>
      <h1 className="hero-name">
        <span className="sr-only">{profile.name} — </span>
        <span aria-hidden="true" className="hero-letters">
          {profile.name.split('').map((ch, i) => (
            <span key={i} style={{ ['--i' as string]: i }}>
              {ch}
            </span>
          ))}
        </span>
      </h1>
      <p className="hero-title">{profile.title}</p>
      <p className="hero-intro">{profile.intro}</p>
      <div className="actions">
        <button
          className="btn primary"
          onClick={() => {
            audio.whoosh()
            scrollToChapter('projects')
          }}
        >
          Start the journey <span aria-hidden="true">↓</span>
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            audio.click()
            setMode('play')
          }}
        >
          Jump into Play Mode <span aria-hidden="true">🎮</span>
        </button>
      </div>
      <p className="scroll-hint" aria-hidden="true">
        <span className="mouse" /> Scroll to fly
      </p>
    </div>
  )
}

function ProjectCard({ index }: { index: number }) {
  const p = projects[index]
  const openProject = useStore((s) => s.openProject)
  return (
    <article className="card project-card" aria-labelledby={`proj-${p.id}`} style={{ ['--accent' as string]: p.accent }}>
      <p className="kicker">
        {index === 0 ? 'Chapter 02 · Projects district — ' : ''}
        Project {index + 1}/{projects.length} · {p.year}
      </p>
      <h2 id={`proj-${p.id}`}>{p.title}</h2>
      <p className="tagline">{p.tagline}</p>
      <p className="body">{p.description}</p>
      <ul className="tags" aria-label="Tech stack">
        {p.tech.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="meta">{p.role}</p>
      <div className="actions">
        <button
          className="btn primary"
          onClick={() => {
            audio.open()
            openProject(p.id)
          }}
        >
          <span aria-hidden="true">▶</span> Open live demo
        </button>
        {p.liveUrl && (
          <a className="btn ghost" href={p.liveUrl} target="_blank" rel="noreferrer">
            Visit site <span aria-hidden="true">↗</span>
          </a>
        )}
        {p.codeUrl && (
          <a className="btn ghost" href={p.codeUrl} target="_blank" rel="noreferrer">
            Code <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      <p className="hint" aria-hidden="true">
        Tip: click the building
      </p>
    </article>
  )
}

function SkillsCard() {
  return (
    <article className="card skills-card" aria-labelledby="skills-title">
      <p className="kicker">Chapter 03 · Skills circuit</p>
      <h2 id="skills-title">The stack, wired up</h2>
      <p className="body">Each branch of the circuit tree is a part of my toolkit. Keep scrolling and watch every node power on.</p>
      <div className="skill-groups">
        {skillGroups.map((g) => (
          <div key={g.name} className="skill-group" style={{ ['--c' as string]: g.color }}>
            <h3>{g.name}</h3>
            <ul>
              {g.skills.map((s) => (
                <li key={s.name}>
                  <span>{s.name}</span>
                  <span className="meter" role="img" aria-label={`${Math.round(s.level * 100)}% proficiency`}>
                    <i style={{ width: `${s.level * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  )
}

function AboutCard() {
  const setHovered = useStore((s) => s.setHoveredAbout)
  const setPinned = useStore((s) => s.setPinnedAbout)
  const pinned = useStore((s) => s.pinnedAbout)
  return (
    <article className="card about-card" aria-labelledby="about-title">
      <p className="kicker">Chapter 04 · The workshop</p>
      <h2 id="about-title">About {profile.name}</h2>
      <p className="body">
        {profile.title} based in {profile.location}. Hover the objects in the room — or pick one below — to hear their story.
      </p>
      <ul className="about-list">
        {aboutItems.map((a) => (
          <li key={a.id}>
            <button
              className={`about-item ${pinned === a.id ? 'is-active' : ''}`}
              aria-pressed={pinned === a.id}
              onMouseEnter={() => setHovered(a.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(a.id)}
              onBlur={() => setHovered(null)}
              onClick={() => {
                audio.click()
                setPinned(pinned === a.id ? null : a.id)
              }}
            >
              <strong>{a.title}</strong>
              <span>{a.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </article>
  )
}

function FinaleCard() {
  const setMode = useStore((s) => s.setMode)
  const launch = useStore((s) => s.launchRocket)
  const progress = useStore((s) => s.progress)
  return (
    <article className="card finale-card" aria-labelledby="finale-title">
      <p className="kicker">Chapter 05 · Launch pad</p>
      <h2 id="finale-title">Let&apos;s build something together</h2>
      <p className="body">
        Got a project, a role or just a question? Fire the rocket and the contact terminal opens. Or take the controls and explore the island yourself.
      </p>
      <div className="actions">
        <button
          className="btn primary"
          onClick={() => {
            audio.rocket()
            launch()
          }}
        >
          Launch contact rocket <span aria-hidden="true">🚀</span>
        </button>
        <button
          className="btn accent"
          onClick={() => {
            audio.click()
            setMode('play')
          }}
        >
          Enter Play Mode <span aria-hidden="true">🎮</span>
        </button>
      </div>
      {progress.shards.length > 0 && (
        <p className="meta">
          Your island progress: {progress.shards.length}/{shards.length} shards · {progress.eggs.length} easter eggs
        </p>
      )}
      <ul className="socials">
        {profile.resumeUrl && (
          <li>
            <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
              Résumé (PDF)
            </a>
          </li>
        )}
        {profile.socials
          .filter((s) => s.url)
          .map((s) => (
            <li key={s.label}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label} <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
      </ul>
    </article>
  )
}

export function Journey({ hidden }: { hidden: boolean }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => initScroll(), [])
  useReveal(ref)
  useEffect(() => {
    // fonts change card heights, which moves every camera stop — re-measure once they land
    document.fonts?.ready.then(() => refreshScroll())
  }, [])

  return (
    <main id="journey" ref={ref} className={`journey ${hidden ? 'is-hidden' : ''}`} aria-hidden={hidden || undefined}>
      <section data-chapter="intro" className="chapter" aria-label="Introduction">
        <div data-stop="start" className="panel panel--hero">
          <Hero />
        </div>
        <div className="travel travel--long" aria-hidden="true" />
      </section>
      <section data-chapter="projects" className="chapter" aria-label="Projects">
        {projects.slice(0, 4).map((p, i) => (
          <div key={p.id}>
            <div data-stop={`project-${i}`} className="panel">
              <ProjectCard index={i} />
            </div>
            {i < 3 && <div className="travel" aria-hidden="true" />}
          </div>
        ))}
        <div className="travel" aria-hidden="true" />
      </section>
      <section data-chapter="skills" className="chapter" aria-label="Skills">
        <div data-stop="skills" className="panel panel--tall">
          <SkillsCard />
        </div>
        <div className="travel" aria-hidden="true" />
      </section>
      <section data-chapter="about" className="chapter" aria-label="About">
        <div data-stop="about" className="panel panel--tall">
          <AboutCard />
        </div>
        <div className="travel" aria-hidden="true" />
      </section>
      <section data-chapter="finale" className="chapter" aria-label="Contact">
        <div data-stop="finale" className="panel panel--end">
          <FinaleCard />
        </div>
      </section>
    </main>
  )
}
