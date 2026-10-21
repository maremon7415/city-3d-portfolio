import type { Quality } from '../state/store'

/** Initial quality guess. PerformanceMonitor refines it at runtime. */
export function detectQuality(): Quality {
  const params = new URLSearchParams(location.search)
  const forced = params.get('quality')
  if (forced === 'low' || forced === 'high') return forced
  const coarse = matchMedia('(pointer: coarse)').matches
  const small = Math.min(screen.width, screen.height) < 820
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  if ((coarse && small) || cores <= 4 || memory <= 4) return 'low'
  return 'high'
}

export const isTouch = () => matchMedia('(pointer: coarse)').matches
