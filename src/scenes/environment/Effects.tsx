import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, Pixelation, TiltShift2, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode, type BloomEffect, type HueSaturationEffect } from 'postprocessing'
import { HalfFloatType } from 'three'
import { env } from '../../systems/dayNight'
import { useStore } from '../../state/store'

/**
 * Post-processing stack: bloom for the night lights, tilt-shift depth of field for the
 * miniature-diorama feel, colour grading driven by time of day, vignette and ACES tone
 * mapping. Low quality keeps only bloom + grading.
 */
export function Effects() {
  const quality = useStore((s) => s.quality)
  const retro = useStore((s) => s.retro)
  const mode = useStore((s) => s.mode)
  const bloom = useRef<BloomEffect>(null)
  const hue = useRef<HueSaturationEffect>(null)

  useFrame(() => {
    if (bloom.current) bloom.current.intensity = env.bloom
    if (hue.current) hue.current.saturation = env.saturation
  })

  const high = quality === 'high'
  return (
    <EffectComposer multisampling={high ? 4 : 0} frameBufferType={HalfFloatType}>
      <Bloom ref={bloom} mipmapBlur intensity={0.6} luminanceThreshold={0.82} luminanceSmoothing={0.25} radius={0.72} levels={high ? 7 : 5} />
      {high && mode === 'journey' ? <TiltShift2 blur={0.09} taper={0.6} start={[0, 0.5]} end={[1, 0.5]} samples={8} /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <HueSaturation ref={hue} saturation={0.1} />
      <BrightnessContrast brightness={0.01} contrast={0.07} />
      <Vignette offset={0.28} darkness={0.5} />
      {retro ? <Pixelation granularity={5} /> : <></>}
    </EffectComposer>
  )
}
