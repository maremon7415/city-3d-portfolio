import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Accessible modal: focus trap, Esc to close, restores focus, locks background scroll. */
export function Modal({ open, onClose, labelledBy, className = '', children }: { open: boolean; onClose: () => void; labelledBy: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement
    const el = ref.current
    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])') ?? []).filter((n) => !n.hasAttribute('disabled'))
    requestAnimationFrame(() => (el?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Tab') {
        const f = focusables()
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    document.documentElement.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.documentElement.classList.remove('modal-open')
      ;(lastFocus.current as HTMLElement | null)?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()} onWheel={(e) => e.stopPropagation()} data-lenis-prevent>
      <div ref={ref} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
