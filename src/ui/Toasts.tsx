import { useStore } from '../state/store'

const ICON = { shard: '◆', egg: '🥚', challenge: '🏁', info: 'ℹ', reward: '🏆' }

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`} role="status">
          <span className="toast-icon" aria-hidden="true">
            {ICON[t.kind]}
          </span>
          <div>
            <strong>{t.title}</strong>
            <p>{t.text}</p>
          </div>
          <button className="toast-x" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
