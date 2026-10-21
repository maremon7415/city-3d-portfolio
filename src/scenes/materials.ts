import { Color, DoubleSide, MeshBasicMaterial, MeshLambertMaterial } from 'three'
import { env } from '../systems/dayNight'

/**
 * Shared materials. Everything low-poly uses one vertex-coloured Lambert material,
 * so the whole city is a handful of shader programs. Night-reactive materials are
 * updated once per frame in `updateMaterials`.
 */

export const vertexMat = new MeshLambertMaterial({ vertexColors: true, flatShading: true })
export const vertexMatDouble = new MeshLambertMaterial({ vertexColors: true, flatShading: true, side: DoubleSide })

/** Windows: dark glass by day, warm light by night (per-instance colour decides lit/unlit). */
export const windowMat = new MeshBasicMaterial({ color: '#2f4a66', toneMapped: false })
/** Street lamp heads and other warm bulbs. */
export const bulbMat = new MeshBasicMaterial({ color: '#ffe2a8', toneMapped: false })
/** The voxel name sign. */
export const signMat = new MeshLambertMaterial({ color: '#fff8ee', emissive: '#ffd9a0', emissiveIntensity: 0, flatShading: true })
/** Cyan crystals / tech glow. */
export const crystalMat = new MeshBasicMaterial({ color: new Color('#7ff3ff').multiplyScalar(2.2), toneMapped: false })
/** Blinking red aircraft light. */
export const beaconMat = new MeshBasicMaterial({ color: new Color('#ff4d4d').multiplyScalar(3), toneMapped: false })

const glassDay = new Color('#38597a')
const glassNight = new Color('#ffc977').multiplyScalar(2.6)
const bulbDay = new Color('#d9d2c0')
const bulbNight = new Color('#ffdc9a').multiplyScalar(4)

export function updateMaterials(time: number) {
  const n = env.night
  // windows ramp on through sunset with a slight flicker of life
  const k = Math.min(1, Math.max(0, (n - 0.2) / 0.6))
  windowMat.color.copy(glassDay).lerp(glassNight, k)
  bulbMat.color.copy(bulbDay).lerp(bulbNight, Math.min(1, Math.max(0, (n - 0.3) / 0.5)))
  signMat.emissiveIntensity = Math.max(0, (n - 0.4) / 0.6) * 1.6
  beaconMat.color.setRGB(3, 0.3, 0.3).multiplyScalar(Math.sin(time * 3) > 0.2 ? 1 : 0.08)
}
