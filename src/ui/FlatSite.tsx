import { useEffect, useRef } from 'react'
import { aboutItems, profile, projects, skillGroups } from '../content'
import { useStore } from '../state/store'

/**
 * The "skip to content" 2D mode: everything a recruiter needs on one fast, accessible page.
 * No WebGL is mounted while this is visible.
 */
export function FlatSite() {
  const setMode = useStore((s) => s.setMode)
  const openProject = useStore((s) => s.openProject)
  const openContact = useStore((s) => s.openContact)
  const heading = useRef<HTMLHeadingElement>(null)
  const back = () => {
    scrollTo(0, 0)
    setMode('journey')
  }

  useEffect(() => {
    scrollTo(0, 0)
    heading.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="flat">
      <header className="flat-header">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          {profile.name}
        </span>
        <nav aria-label="Sections">
          <a href="#flat-projects">Projects</a>
          <a href="#flat-skills">Skills</a>
          <a href="#flat-about">About</a>
          <a href="#flat-contact">Contact</a>
        </nav>
        <button className="pill-btn accent" onClick={back}>
          Back to 3D <span aria-hidden="true">🏝️</span>
        </button>
      </header>

      <main id="flat-main" className="flat-main">
        <section className="flat-hero" aria-labelledby="flat-title">
          <p className="kicker">
            <span className="dot" /> {profile.availability}
          </p>
          <h1 id="flat-title" ref={heading} tabIndex={-1}>
            {profile.name}
          </h1>
          <p className="hero-title">
            {profile.title} · {profile.location}
          </p>
          <p className="hero-intro">{profile.intro}</p>
          <div className="actions">
            <button className="btn primary" onClick={() => openContact(true)}>
              Contact me
            </button>
            {profile.resumeUrl && (
              <a className="btn ghost" href={profile.resumeUrl} target="_blank" rel="noreferrer">
                Résumé (PDF)
              </a>
            )}
            {profile.socials
              .filter((s) => s.url)
              .map((s) => (
                <a key={s.label} className="btn ghost" href={s.url} target="_blank" rel="noreferrer">
                  {s.label} ↗
                </a>
              ))}
          </div>
        </section>

        <section id="flat-projects" aria-labelledby="flat-projects-title">
          <h2 id="flat-projects-title">Projects</h2>
          <div className="flat-grid">
            {projects.map((p) => (
              <article key={p.id} className="flat-card" style={{ ['--accent' as string]: p.accent }}>
                <p className="kicker">
                  {p.year} · {p.role}
                </p>
                <h3>{p.title}</h3>
                <p className="tagline">{p.tagline}</p>
                <p>{p.description}</p>
                <ul className="tags" aria-label="Tech stack">
                  {p.tech.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <div className="actions">
                  <button className="btn small" onClick={() => openProject(p.id)}>
                    Preview
                  </button>
                  {p.liveUrl && (
                    <a className="btn small ghost" href={p.liveUrl} target="_blank" rel="noreferrer">
                      Live ↗
                    </a>
                  )}
                  {p.codeUrl && (
                    <a className="btn small ghost" href={p.codeUrl} target="_blank" rel="noreferrer">
                      Code ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="flat-skills" aria-labelledby="flat-skills-title">
          <h2 id="flat-skills-title">Skills</h2>
          <div className="flat-grid flat-grid--4">
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
        </section>

        <section id="flat-about" aria-labelledby="flat-about-title">
          <h2 id="flat-about-title">About</h2>
          <dl className="flat-about">
            {aboutItems.map((a) => (
              <div key={a.id}>
                <dt>{a.title}</dt>
                <dd>{a.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="flat-contact" aria-labelledby="flat-contact-title" className="flat-contact">
          <h2 id="flat-contact-title">Let&apos;s build something together</h2>
          <p>
            Email <a href={`mailto:${profile.email}`}>{profile.email}</a> or use the terminal.
          </p>
          <button className="btn primary" onClick={() => openContact(true)}>
            Open contact terminal
          </button>
        </section>
      </main>
      <footer className="flat-footer">
        <p>
          © {new Date().getFullYear()} {profile.name}. Built as a floating island city —{' '}
          <button className="link-btn" onClick={back}>
            fly through it
          </button>
          .
        </p>
      </footer>
    </div>
  )
}
