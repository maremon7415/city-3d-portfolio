import { chapters, profile } from '../content'
import { useStore } from '../state/store'
import { scrollToChapter, scrollToTarget } from '../systems/scroll'
import { audio } from '../systems/audio'

export function SoundToggle() {
  const soundOn = useStore((s) => s.soundOn)
  const toggle = useStore((s) => s.toggleSound)
  return (
    <button
      className={`icon-btn sound-btn ${soundOn ? 'is-on' : ''}`}
      onClick={() => {
        toggle()
        // play a confirmation blip once the context is live
        setTimeout(() => audio.click(), 60)
      }}
      aria-pressed={soundOn}
      aria-label={soundOn ? 'Mute sound' : 'Turn sound on'}
      title={soundOn ? 'Mute' : 'Sound on'}
    >
      <span className="bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </button>
  )
}

export function Nav() {
  const chapter = useStore((s) => s.chapter)
  const mode = useStore((s) => s.mode)
  const entered = useStore((s) => s.entered)
  const setMode = useStore((s) => s.setMode)
  if (mode === 'play') return null
  return (
    <header className={`nav ${entered ? 'is-in' : ''}`}>
      <button className="brand" onClick={() => scrollToTarget(0)} aria-label={`${profile.name} — back to top`}>
        <span className="brand-mark" aria-hidden="true">
          ◆
        </span>
        {profile.name}
      </button>
      <nav aria-label="Chapters" className="chapters">
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button
                className={i === chapter ? 'is-active' : ''}
                aria-current={i === chapter ? 'step' : undefined}
                onClick={() => {
                  audio.click()
                  scrollToChapter(c.id)
                }}
              >
                <span className="num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="label">{c.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="nav-actions">
        <SoundToggle />
        <button className="pill-btn" onClick={() => setMode('flat')} title="Simple 2D version — all content, no 3D">
          2D
        </button>
        <button
          className="pill-btn accent"
          onClick={() => {
            audio.click()
            setMode('play')
          }}
        >
          Play <span aria-hidden="true">🎮</span>
        </button>
      </div>
      <div className="progress-rail" aria-hidden="true">
        {chapters.map((c, i) => (
          <i key={c.id} className={i <= chapter ? 'on' : ''} />
        ))}
      </div>
    </header>
  )
}
