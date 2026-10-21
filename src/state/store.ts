import { create } from 'zustand'
import { shards } from '../content'

export type Mode = 'journey' | 'play' | 'flat'
export type Quality = 'high' | 'low'

export interface PlayProgress {
  shards: string[]
  eggs: string[]
  bugs: string[]
  bestRing: number | null
  rewardSeen: boolean
}

export interface Toast {
  id: number
  kind: 'shard' | 'egg' | 'challenge' | 'info' | 'reward'
  title: string
  text: string
}

const PROGRESS_KEY = 'island-city:progress:v1'
const SOUND_KEY = 'island-city:sound'

const emptyProgress = (): PlayProgress => ({ shards: [], eggs: [], bugs: [], bestRing: null, rewardSeen: false })

function loadProgress(): PlayProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return emptyProgress()
    return { ...emptyProgress(), ...JSON.parse(raw) }
  } catch {
    return emptyProgress()
  }
}

function saveProgress(p: PlayProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
  } catch {
    /* private mode — progress just won't persist */
  }
}

function loadSound() {
  try {
    return localStorage.getItem(SOUND_KEY) === 'on'
  } catch {
    return false
  }
}

const params = new URLSearchParams(location.search)
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

interface State {
  mode: Mode
  entered: boolean
  sceneReady: boolean
  quality: Quality
  reducedMotion: boolean
  debug: boolean
  soundOn: boolean
  chapter: number
  activeProject: string | null
  contactOpen: boolean
  hoveredAbout: string | null
  pinnedAbout: string | null
  retro: boolean
  rocketLaunchAt: number
  progress: PlayProgress
  toasts: Toast[]
  ringRun: { active: boolean; next: number; startedAt: number; lastTime: number | null }
  nearRocket: boolean

  setMode: (m: Mode) => void
  enter: () => void
  setSceneReady: () => void
  setQuality: (q: Quality) => void
  toggleSound: (on?: boolean) => void
  setChapter: (c: number) => void
  openProject: (id: string | null) => void
  openContact: (open: boolean) => void
  setHoveredAbout: (id: string | null) => void
  setPinnedAbout: (id: string | null) => void
  toggleRetro: () => void
  launchRocket: () => void
  collectShard: (id: string) => boolean
  findEgg: (id: string, title: string, text: string) => void
  squashBug: (id: string) => void
  setRingRun: (r: Partial<State['ringRun']>) => void
  finishRing: (time: number) => void
  markRewardSeen: () => void
  resetProgress: () => void
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  setNearRocket: (v: boolean) => void
}

let toastId = 0

export const useStore = create<State>((set, get) => ({
  mode: params.get('mode') === '2d' ? 'flat' : 'journey',
  entered: false,
  sceneReady: false,
  quality: 'high',
  reducedMotion,
  debug: params.has('debug'),
  soundOn: loadSound(),
  chapter: 0,
  activeProject: null,
  contactOpen: false,
  hoveredAbout: null,
  pinnedAbout: null,
  retro: false,
  rocketLaunchAt: 0,
  progress: loadProgress(),
  toasts: [],
  ringRun: { active: false, next: 0, startedAt: 0, lastTime: null },
  nearRocket: false,

  setMode: (mode) => set({ mode }),
  enter: () => set({ entered: true }),
  setSceneReady: () => set({ sceneReady: true }),
  setQuality: (quality) => set({ quality }),
  toggleSound: (on) => {
    const next = on ?? !get().soundOn
    try {
      localStorage.setItem(SOUND_KEY, next ? 'on' : 'off')
    } catch {
      /* ignore */
    }
    set({ soundOn: next })
  },
  setChapter: (chapter) => {
    if (get().chapter !== chapter) set({ chapter })
  },
  openProject: (activeProject) => set({ activeProject }),
  openContact: (contactOpen) => set({ contactOpen }),
  setHoveredAbout: (hoveredAbout) => set({ hoveredAbout }),
  setPinnedAbout: (pinnedAbout) => set({ pinnedAbout }),
  toggleRetro: () => set({ retro: !get().retro }),
  launchRocket: () => set({ rocketLaunchAt: performance.now() }),

  collectShard: (id) => {
    const p = get().progress
    if (p.shards.includes(id)) return false
    const progress = { ...p, shards: [...p.shards, id] }
    saveProgress(progress)
    set({ progress })
    const shard = shards.find((s) => s.id === id)
    if (shard) {
      get().pushToast({
        kind: 'shard',
        title: `Data shard ${progress.shards.length}/${shards.length} · ${shard.title}`,
        text: shard.text,
      })
    }
    return true
  },
  findEgg: (id, title, text) => {
    const p = get().progress
    if (p.eggs.includes(id)) return
    const progress = { ...p, eggs: [...p.eggs, id] }
    saveProgress(progress)
    set({ progress })
    get().pushToast({ kind: 'egg', title: `Easter egg found · ${title}`, text })
  },
  squashBug: (id) => {
    const p = get().progress
    if (p.bugs.includes(id)) return
    const progress = { ...p, bugs: [...p.bugs, id] }
    saveProgress(progress)
    set({ progress })
  },
  setRingRun: (r) => set({ ringRun: { ...get().ringRun, ...r } }),
  finishRing: (time) => {
    const p = get().progress
    const best = p.bestRing === null ? time : Math.min(p.bestRing, time)
    const progress = { ...p, bestRing: best }
    saveProgress(progress)
    set({ progress, ringRun: { active: false, next: 0, startedAt: 0, lastTime: time } })
  },
  markRewardSeen: () => {
    const progress = { ...get().progress, rewardSeen: true }
    saveProgress(progress)
    set({ progress })
  },
  resetProgress: () => {
    const progress = emptyProgress()
    saveProgress(progress)
    set({ progress })
  },
  pushToast: (t) => {
    const toast = { ...t, id: ++toastId }
    set({ toasts: [...get().toasts.slice(-2), toast] })
    window.setTimeout(() => get().dismissToast(toast.id), t.kind === 'reward' ? 12000 : 5200)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  setNearRocket: (nearRocket) => {
    if (get().nearRocket !== nearRocket) set({ nearRocket })
  },
}))

/**
 * Per-frame values that change every tick. Kept outside React state on purpose:
 * the render loop reads them directly so scrolling never triggers React re-renders.
 */
export const live = {
  /** Smoothed scroll progress 0..1 across the whole journey. */
  progress: 0,
  /** Scroll velocity (normalised), drives wind sound and camera sway. */
  velocity: 0,
  /** Day phase 0 dawn → 1 deep night, derived from progress. */
  dayPhase: 0,
  /** 0..1 how "night" it is — lights turn on with this. */
  night: 0,
  pointer: { x: 0, y: 0 },
  /** Play Mode drone state for HUD/minimap. */
  player: { x: 0, y: 0, z: 0, yaw: 0, speed: 0 },
  /** Per-chapter local progress (0..1) keyed by chapter id. */
  chapterT: { intro: 0, projects: 0, skills: 0, about: 0, finale: 0 } as Record<string, number>,
}
