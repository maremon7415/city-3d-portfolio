import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { live, useStore } from '../state/store'
import { chapters } from '../content'
import { clamp } from './math'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll system: Lenis smooth scroll + GSAP ScrollTrigger.
 * The HTML overlay defines the journey: every `[data-stop]` panel is a camera stop and
 * every `[data-chapter]` section is a chapter. We measure them on refresh so the camera
 * path always lines up with the text, whatever the viewport size.
 */

export interface Range {
  start: number
  end: number
}

export const journey = {
  stops: new Map<string, Range>(),
  chapters: new Map<string, Range>(),
  version: 0,
}

let lenis: Lenis | null = null

function measure() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
  const vh = innerHeight
  journey.stops.clear()
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-stop]'))
  panels.forEach((el, i) => {
    const top = el.getBoundingClientRect().top + scrollY
    const h = el.offsetHeight
    const anchor = top + h / 2 - vh / 2
    const hold = Math.max(0, (h - vh) / 2) * 0.9 + vh * 0.06
    let start = clamp((anchor - hold) / max)
    let end = clamp((anchor + hold) / max)
    if (i === 0) start = 0
    if (i === panels.length - 1) end = 1
    journey.stops.set(el.dataset.stop!, { start, end })
  })
  journey.chapters.clear()
  document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el) => {
    const top = el.getBoundingClientRect().top + scrollY
    journey.chapters.set(el.dataset.chapter!, {
      start: clamp((top - vh * 0.5) / max),
      end: clamp((top + el.offsetHeight - vh * 0.5) / max),
    })
  })
  journey.version++
}

function onProgress(p: number, velocity: number) {
  live.progress = clamp(p)
  live.velocity = clamp(Math.abs(velocity) / 60)
  let idx = 0
  chapters.forEach((c, i) => {
    const r = journey.chapters.get(c.id)
    if (!r) return
    live.chapterT[c.id] = clamp((live.progress - r.start) / Math.max(0.0001, r.end - r.start))
    if (live.progress >= r.start - 0.001) idx = i
  })
  useStore.getState().setChapter(idx)
}

export function initScroll() {
  const reduced = useStore.getState().reducedMotion
  ScrollTrigger.addEventListener('refresh', measure)

  let removeNative: (() => void) | null = null
  let tick: ((time: number) => void) | null = null

  if (!reduced) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.4 })
    lenis.on('scroll', (l: Lenis) => {
      ScrollTrigger.update()
      onProgress(l.progress, l.velocity)
    })
    tick = (time: number) => lenis?.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
  } else {
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
      onProgress(scrollY / max, 0)
    }
    addEventListener('scroll', onScroll, { passive: true })
    removeNative = () => removeEventListener('scroll', onScroll)
  }

  measure()
  ScrollTrigger.refresh()
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
  onProgress(scrollY / max, 0)

  return () => {
    ScrollTrigger.removeEventListener('refresh', measure)
    if (tick) gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
    removeNative?.()
  }
}

export function refreshScroll() {
  ScrollTrigger.refresh()
}

export function scrollToTarget(target: string | number, immediate = false) {
  const reduced = useStore.getState().reducedMotion
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : null
  if (lenis) {
    lenis.scrollTo(el ?? (target as number), { immediate: immediate || reduced, duration: 2.2, offset: 0 })
  } else {
    const y = el ? el.getBoundingClientRect().top + scrollY : (target as number)
    scrollTo({ top: y, behavior: immediate || reduced ? 'auto' : 'smooth' })
  }
}

/** Scroll so the given stop's panel sits in the middle of its hold range. */
export function scrollToStop(id: string) {
  const r = journey.stops.get(id)
  if (!r) return
  const max = document.documentElement.scrollHeight - innerHeight
  scrollToTarget(((r.start + r.end) / 2) * max)
}

export function scrollToChapter(id: string) {
  if (id === 'intro') return scrollToTarget(0)
  const first = document.querySelector<HTMLElement>(`[data-chapter="${id}"] [data-stop]`)
  if (first?.dataset.stop) scrollToStop(first.dataset.stop)
}

export function lockScroll(locked: boolean) {
  if (locked) {
    lenis?.stop()
    document.documentElement.classList.add('scroll-locked')
  } else {
    document.documentElement.classList.remove('scroll-locked')
    lenis?.start()
  }
}
