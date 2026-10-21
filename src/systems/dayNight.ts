import { Color, Vector3 } from 'three'
import { invLerp, lerp } from './math'

/**
 * Day-night cycle. One `phase` value (0 dawn → 0.33 day → 0.66 sunset → 1 night)
 * drives sky, fog, lights, window glow, stars and colour grading.
 */

interface Palette {
  t: number
  skyTop: string
  skyHorizon: string
  skyBottom: string
  fog: string
  sun: string
  sunIntensity: number
  sunDir: [number, number, number]
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  stars: number
  night: number
  sunVisible: number
  bloom: number
  saturation: number
  exposure: number
}

const PALETTES: Palette[] = [
  {
    t: 0,
    skyTop: '#6f86c8',
    skyHorizon: '#ffb48c',
    skyBottom: '#f6c9b8',
    fog: '#f1b9a2',
    sun: '#ffc79a',
    sunIntensity: 1.7,
    sunDir: [0.5, 0.16, -0.85],
    hemiSky: '#c3cdff',
    hemiGround: '#b08578',
    hemiIntensity: 1.0,
    stars: 0.08,
    night: 0.08,
    sunVisible: 1,
    bloom: 0.55,
    saturation: 0.08,
    exposure: 1.0,
  },
  {
    t: 0.3,
    skyTop: '#3b8be0',
    skyHorizon: '#c4e6ff',
    skyBottom: '#e8f6ff',
    fog: '#c2e1f6',
    sun: '#fff2dc',
    sunIntensity: 2.6,
    sunDir: [0.35, 0.88, 0.32],
    hemiSky: '#d2eaff',
    hemiGround: '#83935c',
    hemiIntensity: 1.15,
    stars: 0,
    night: 0,
    sunVisible: 1,
    bloom: 0.35,
    saturation: 0.1,
    exposure: 1.0,
  },
  {
    t: 0.5,
    skyTop: '#4c86d4',
    skyHorizon: '#ffe0b8',
    skyBottom: '#ffe9d2',
    fog: '#ead7c0',
    sun: '#ffe1b0',
    sunIntensity: 2.3,
    sunDir: [-0.45, 0.5, -0.55],
    hemiSky: '#ffe6cc',
    hemiGround: '#7f7a55',
    hemiIntensity: 1.05,
    stars: 0,
    night: 0,
    sunVisible: 1,
    bloom: 0.4,
    saturation: 0.12,
    exposure: 1.0,
  },
  {
    t: 0.64,
    skyTop: '#4d4c94',
    skyHorizon: '#ff8a5c',
    skyBottom: '#ffb07a',
    fog: '#e8927a',
    sun: '#ff9c5c',
    sunIntensity: 2.0,
    sunDir: [-0.66, 0.1, -0.74],
    hemiSky: '#ffb79c',
    hemiGround: '#8a6070',
    hemiIntensity: 0.85,
    stars: 0.05,
    night: 0.35,
    sunVisible: 1,
    bloom: 0.7,
    saturation: 0.18,
    exposure: 1.02,
  },
  {
    t: 0.8,
    skyTop: '#1b1f4d',
    skyHorizon: '#7d4a78',
    skyBottom: '#4a3058',
    fog: '#4b3a63',
    sun: '#9fb6ff',
    sunIntensity: 0.6,
    sunDir: [-0.55, 0.5, -0.62],
    hemiSky: '#646aa8',
    hemiGround: '#3b3156',
    hemiIntensity: 0.6,
    stars: 0.65,
    night: 0.85,
    sunVisible: 0,
    bloom: 1.0,
    saturation: 0.08,
    exposure: 1.05,
  },
  {
    t: 1,
    skyTop: '#060a1e',
    skyHorizon: '#1e2856',
    skyBottom: '#141a3c',
    fog: '#151c40',
    sun: '#adc2ff',
    sunIntensity: 0.75,
    sunDir: [-0.6, 0.48, -0.62],
    hemiSky: '#4d5c9e',
    hemiGround: '#2f2b52',
    hemiIntensity: 0.5,
    stars: 1,
    night: 1,
    sunVisible: 0,
    bloom: 1.15,
    saturation: 0.05,
    exposure: 1.08,
  },
]

const parsed = PALETTES.map((p) => ({
  ...p,
  c: {
    skyTop: new Color(p.skyTop),
    skyHorizon: new Color(p.skyHorizon),
    skyBottom: new Color(p.skyBottom),
    fog: new Color(p.fog),
    sun: new Color(p.sun),
    hemiSky: new Color(p.hemiSky),
    hemiGround: new Color(p.hemiGround),
  },
  dir: new Vector3(...p.sunDir).normalize(),
}))

export const env = {
  phase: 0,
  skyTop: new Color(),
  skyHorizon: new Color(),
  skyBottom: new Color(),
  fog: new Color(),
  sun: new Color(),
  sunIntensity: 1,
  sunDir: new Vector3(0, 1, 0),
  /** Fixed direction of the sun disc in the sky (for the shader) */
  sunDiscDir: new Vector3(0, 1, 0),
  moonDir: new Vector3(-0.66, 0.27, -0.7).normalize(),
  hemiSky: new Color(),
  hemiGround: new Color(),
  hemiIntensity: 1,
  stars: 0,
  night: 0,
  sunVisible: 1,
  bloom: 0.5,
  saturation: 0,
  exposure: 1,
}

export function sampleDay(phase: number) {
  const p = Math.min(1, Math.max(0, phase))
  let i = 0
  while (i < parsed.length - 2 && p > parsed[i + 1].t) i++
  const a = parsed[i]
  const b = parsed[i + 1]
  const k = invLerp(a.t, b.t, p)
  env.phase = p
  env.skyTop.lerpColors(a.c.skyTop, b.c.skyTop, k)
  env.skyHorizon.lerpColors(a.c.skyHorizon, b.c.skyHorizon, k)
  env.skyBottom.lerpColors(a.c.skyBottom, b.c.skyBottom, k)
  env.fog.lerpColors(a.c.fog, b.c.fog, k)
  env.sun.lerpColors(a.c.sun, b.c.sun, k)
  env.hemiSky.lerpColors(a.c.hemiSky, b.c.hemiSky, k)
  env.hemiGround.lerpColors(a.c.hemiGround, b.c.hemiGround, k)
  env.sunDir.lerpVectors(a.dir, b.dir, k).normalize()
  env.sunIntensity = lerp(a.sunIntensity, b.sunIntensity, k)
  env.hemiIntensity = lerp(a.hemiIntensity, b.hemiIntensity, k)
  env.stars = lerp(a.stars, b.stars, k)
  env.night = lerp(a.night, b.night, k)
  env.sunVisible = lerp(a.sunVisible, b.sunVisible, k)
  env.bloom = lerp(a.bloom, b.bloom, k)
  env.saturation = lerp(a.saturation, b.saturation, k)
  env.exposure = lerp(a.exposure, b.exposure, k)
  // the visible sun disc follows the light until sunset, then sinks below the horizon
  if (env.sunVisible > 0.01) env.sunDiscDir.copy(env.sunDir)
  return env
}

sampleDay(0)
