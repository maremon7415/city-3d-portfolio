import { useEffect, useState, type FormEvent } from 'react'
import { profile } from '../content'
import { useStore } from '../state/store'
import { Modal } from './Modal'
import { audio } from '../systems/audio'

const BOOT = ['> establishing uplink to ground control…', '> rocket telemetry: nominal', `> routing to ${profile.name.toLowerCase()}@island … ok`, '> ready. say hello 👋']

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function ContactTerminal() {
  const open = useStore((s) => s.contactOpen)
  const setOpen = useStore((s) => s.openContact)
  const reduced = useStore((s) => s.reducedMotion)
  const [lines, setLines] = useState<string[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  useEffect(() => {
    if (!open) return
    setStatus('idle')
    if (reduced) {
      setLines(BOOT)
      return
    }
    setLines([])
    const timers = BOOT.map((l, i) =>
      window.setTimeout(() => {
        setLines((prev) => [...prev, l])
        audio.type()
      }, 180 + i * 260),
    )
    return () => timers.forEach(clearTimeout)
  }, [open, reduced])

  const close = () => {
    audio.close()
    setOpen(false)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      audio.error()
      return
    }
    setStatus('sending')
    if (profile.formEndpoint) {
      try {
        const res = await fetch(profile.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error(String(res.status))
        setStatus('sent')
        audio.success()
      } catch {
        setStatus('error')
        audio.error()
      }
    } else {
      const subject = encodeURIComponent(`Hello from ${form.name} (via your island)`)
      const body = encodeURIComponent(`${form.message}\n\n— ${form.name} <${form.email}>`)
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`
      setStatus('sent')
      audio.success()
    }
  }

  return (
    <Modal open={open} onClose={close} labelledBy="terminal-title" className="terminal-modal">
      <div className="term">
        <div className="term-bar">
          <span className="dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <h2 id="terminal-title">contact.sh</h2>
          <button className="icon-btn" onClick={close} aria-label="Close contact terminal">
            ✕
          </button>
        </div>
        <div className="term-body">
          <div className="term-log" aria-live="polite">
            {lines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
          {status === 'sent' ? (
            <div className="term-done">
              <pre aria-hidden="true">{`     /\\
    /  \\
   | () |
   |    |
  /|    |\\
 /_|_  _|_\\
   /_\\/_\\
    ****`}</pre>
              <p>&gt; message launched. I usually reply within a day or two. Thank you!</p>
              <button className="btn ghost" onClick={close}>
                Back to the island
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="term-form" noValidate>
              <label>
                <span>&gt; name:</span>
                <input data-autofocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required onKeyDown={() => audio.type()} />
              </label>
              <label>
                <span>&gt; email:</span>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required onKeyDown={() => audio.type()} />
              </label>
              <label className="full">
                <span>&gt; message:</span>
                <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required onKeyDown={() => audio.type()} />
              </label>
              <div className="term-actions">
                <button className="btn primary" type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'transmitting…' : 'send_message() 🚀'}
                </button>
                <a className="term-alt" href={`mailto:${profile.email}`}>
                  or email {profile.email}
                </a>
              </div>
              {status === 'error' && <p className="term-error">&gt; transmission failed. Try the email link instead.</p>}
            </form>
          )}
        </div>
      </div>
    </Modal>
  )
}
