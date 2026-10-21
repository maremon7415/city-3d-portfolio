/**
 * Procedural WebAudio engine — every sound on the site is synthesised at runtime,
 * so there are zero audio files to download. Muted by default; the context is only
 * created after the visitor turns sound on (a user gesture, as browsers require).
 */

const PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83] // D major pentatonic
const CHORDS = [
  [50, 57, 62, 64, 66], // Dmaj9
  [43, 55, 59, 62, 66], // Gmaj7
  [47, 54, 57, 62, 64], // Bm11
  [45, 52, 57, 59, 64], // Aadd9
]

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

class AudioEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private music!: GainNode
  private sfx!: GainNode
  private reverb!: ConvolverNode
  private reverbSend!: GainNode
  private padFilter!: BiquadFilterNode
  private windGain!: GainNode
  private windFilter!: BiquadFilterNode
  private engineOsc: OscillatorNode | null = null
  private engineOsc2: OscillatorNode | null = null
  private engineGain: GainNode | null = null
  private engineFilter: BiquadFilterNode | null = null
  private noiseBuffer!: AudioBuffer
  private timer = 0
  private nextChordAt = 0
  private nextSparkleAt = 0
  private chordIndex = 0
  private day = 0
  enabled = false

  private ensure() {
    if (this.ctx) return this.ctx
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()
    this.ctx = ctx

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 4
    comp.connect(ctx.destination)

    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(comp)

    this.reverb = ctx.createConvolver()
    this.reverb.buffer = this.impulse(2.8)
    const reverbOut = ctx.createGain()
    reverbOut.gain.value = 0.55
    this.reverb.connect(reverbOut).connect(this.master)
    this.reverbSend = ctx.createGain()
    this.reverbSend.gain.value = 1
    this.reverbSend.connect(this.reverb)

    this.music = ctx.createGain()
    this.music.gain.value = 0.32
    this.padFilter = ctx.createBiquadFilter()
    this.padFilter.type = 'lowpass'
    this.padFilter.frequency.value = 1800
    this.padFilter.Q.value = 0.4
    this.padFilter.connect(this.music)
    this.music.connect(this.master)
    const musicSend = ctx.createGain()
    musicSend.gain.value = 0.5
    this.music.connect(musicSend).connect(this.reverbSend)

    this.sfx = ctx.createGain()
    this.sfx.gain.value = 0.7
    this.sfx.connect(this.master)

    // white noise source shared by wind, whooshes and impacts
    this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = this.noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    const wind = ctx.createBufferSource()
    wind.buffer = this.noiseBuffer
    wind.loop = true
    this.windFilter = ctx.createBiquadFilter()
    this.windFilter.type = 'bandpass'
    this.windFilter.frequency.value = 500
    this.windFilter.Q.value = 0.7
    this.windGain = ctx.createGain()
    this.windGain.gain.value = 0.015
    wind.connect(this.windFilter).connect(this.windGain).connect(this.master)
    wind.start()

    return ctx
  }

  private impulse(seconds: number) {
    const ctx = this.ctx!
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
    }
    return buf
  }

  setEnabled(on: boolean) {
    this.enabled = on
    if (on) {
      const ctx = this.ensure()
      if (!ctx) return
      void ctx.resume()
      this.master.gain.cancelScheduledValues(ctx.currentTime)
      this.master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4)
      if (!this.timer) {
        this.nextChordAt = ctx.currentTime + 0.1
        this.nextSparkleAt = ctx.currentTime + 2
        this.timer = window.setInterval(() => this.schedule(), 200)
      }
    } else if (this.ctx) {
      const ctx = this.ctx
      this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.15)
      window.clearInterval(this.timer)
      this.timer = 0
      window.setTimeout(() => {
        if (!this.enabled) void ctx.suspend()
      }, 600)
    }
  }

  private schedule() {
    const ctx = this.ctx
    if (!ctx || !this.enabled) return
    const now = ctx.currentTime
    if (now + 0.3 > this.nextChordAt) {
      this.playChord(CHORDS[this.chordIndex % CHORDS.length], this.nextChordAt, 9)
      this.chordIndex++
      this.nextChordAt += 8
    }
    if (now + 0.3 > this.nextSparkleAt) {
      const note = PENTA[Math.floor(Math.random() * PENTA.length)] + (this.day > 0.75 ? -12 : 0)
      this.tone(mtof(note), this.nextSparkleAt, 2.2, 0.035, 'sine', true, this.music)
      this.nextSparkleAt += 1.2 + Math.random() * (this.day > 0.75 ? 3.5 : 2.2)
    }
  }

  private playChord(notes: number[], at: number, dur: number) {
    const ctx = this.ctx!
    notes.forEach((n, i) => {
      for (const detune of [-6, 5]) {
        const osc = ctx.createOscillator()
        osc.type = i === 0 ? 'sine' : 'triangle'
        osc.frequency.value = mtof(n)
        osc.detune.value = detune
        const g = ctx.createGain()
        const peak = (i === 0 ? 0.05 : 0.022) * (1 - i * 0.06)
        g.gain.setValueAtTime(0, at)
        g.gain.linearRampToValueAtTime(peak, at + 3)
        g.gain.setValueAtTime(peak, at + dur - 4)
        g.gain.linearRampToValueAtTime(0, at + dur)
        osc.connect(g).connect(this.padFilter)
        osc.start(at)
        osc.stop(at + dur + 0.1)
      }
    })
  }

  private tone(freq: number, at: number, dur: number, gain: number, type: OscillatorType, reverb = false, bus?: AudioNode, slideTo?: number) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, at)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur * 0.8)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(gain, at + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    osc.connect(g).connect(bus ?? this.sfx)
    if (reverb) g.connect(this.reverbSend)
    osc.start(at)
    osc.stop(at + dur + 0.05)
  }

  private noise(at: number, dur: number, gain: number, type: BiquadFilterType, f0: number, f1: number, q = 1) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const f = ctx.createBiquadFilter()
    f.type = type
    f.Q.value = q
    f.frequency.setValueAtTime(f0, at)
    f.frequency.exponentialRampToValueAtTime(f1, at + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(gain, at + dur * 0.3)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    src.connect(f).connect(g).connect(this.sfx)
    src.start(at, Math.random())
    src.stop(at + dur + 0.05)
  }

  private get live() {
    return this.enabled && this.ctx && this.ctx.state === 'running' ? this.ctx : null
  }

  // ───────────── continuous controls ─────────────

  setDay(phase: number) {
    this.day = phase
    const ctx = this.live
    if (!ctx) return
    const cutoff = 2400 - phase * 1700
    this.padFilter.frequency.setTargetAtTime(cutoff, ctx.currentTime, 1.5)
  }

  setWind(v: number) {
    const ctx = this.live
    if (!ctx) return
    this.windGain.gain.setTargetAtTime(0.012 + v * 0.09, ctx.currentTime, 0.25)
    this.windFilter.frequency.setTargetAtTime(380 + v * 900, ctx.currentTime, 0.25)
  }

  /** Drone engine hum. Pass null to stop. */
  setEngine(speed: number | null) {
    const ctx = this.live
    if (speed === null || !ctx) {
      if (this.engineGain && this.ctx) {
        const g = this.engineGain
        const o = this.engineOsc
        const o2 = this.engineOsc2
        g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1)
        window.setTimeout(() => {
          o?.stop()
          o2?.stop()
        }, 500)
        this.engineGain = null
        this.engineOsc = null
        this.engineOsc2 = null
      }
      return
    }
    if (!this.engineGain) {
      this.engineOsc = ctx.createOscillator()
      this.engineOsc.type = 'sawtooth'
      this.engineOsc2 = ctx.createOscillator()
      this.engineOsc2.type = 'square'
      this.engineFilter = ctx.createBiquadFilter()
      this.engineFilter.type = 'lowpass'
      this.engineFilter.Q.value = 2
      this.engineGain = ctx.createGain()
      this.engineGain.gain.value = 0
      const g2 = ctx.createGain()
      g2.gain.value = 0.15
      this.engineOsc.connect(this.engineFilter)
      this.engineOsc2.connect(g2).connect(this.engineFilter)
      this.engineFilter.connect(this.engineGain).connect(this.sfx)
      this.engineOsc.start()
      this.engineOsc2.start()
    }
    const t = ctx.currentTime
    this.engineOsc!.frequency.setTargetAtTime(70 + speed * 90, t, 0.1)
    this.engineOsc2!.frequency.setTargetAtTime(280 + speed * 360, t, 0.1)
    this.engineFilter!.frequency.setTargetAtTime(300 + speed * 1300, t, 0.1)
    this.engineGain.gain.setTargetAtTime(0.035 + speed * 0.06, t, 0.1)
  }

  // ───────────── one-shots ─────────────

  hover() {
    const ctx = this.live
    if (!ctx) return
    this.tone(1320, ctx.currentTime, 0.09, 0.035, 'sine', false, undefined, 1760)
  }

  click() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    this.tone(660, t, 0.12, 0.09, 'triangle', false, undefined, 990)
    this.noise(t, 0.04, 0.04, 'highpass', 4000, 6000)
  }

  open() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    this.tone(mtof(74), t, 0.35, 0.06, 'sine', true)
    this.tone(mtof(81), t + 0.07, 0.45, 0.06, 'sine', true)
    this.noise(t, 0.4, 0.05, 'bandpass', 400, 2400, 0.8)
  }

  close() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    this.tone(mtof(81), t, 0.25, 0.05, 'sine')
    this.tone(mtof(74), t + 0.06, 0.3, 0.05, 'sine')
  }

  whoosh() {
    const ctx = this.live
    if (!ctx) return
    this.noise(ctx.currentTime, 0.9, 0.12, 'bandpass', 250, 1800, 1.2)
  }

  shard() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    ;[76, 80, 83, 88].forEach((n, i) => this.tone(mtof(n), t + i * 0.06, 0.6, 0.07, 'triangle', true))
  }

  ring() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    this.tone(520, t, 0.35, 0.08, 'sine', true, undefined, 1400)
    this.noise(t, 0.3, 0.05, 'highpass', 2000, 6000)
  }

  success() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    ;[62, 66, 69, 74, 78, 81].forEach((n, i) => this.tone(mtof(n), t + i * 0.09, 0.9, 0.07, 'triangle', true))
  }

  bump() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    this.tone(140, t, 0.2, 0.18, 'sine', false, undefined, 55)
    this.noise(t, 0.12, 0.08, 'lowpass', 900, 200)
  }

  splat() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    this.tone(480, t, 0.18, 0.12, 'square', false, undefined, 70)
    this.noise(t, 0.2, 0.12, 'lowpass', 3000, 300)
  }

  quack() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    for (const off of [0, 0.22]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(760, t + off)
      osc.frequency.exponentialRampToValueAtTime(380, t + off + 0.16)
      const f = ctx.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = 1300
      f.Q.value = 2.5
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t + off)
      g.gain.linearRampToValueAtTime(0.18, t + off + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.18)
      osc.connect(f).connect(g).connect(this.sfx)
      osc.start(t + off)
      osc.stop(t + off + 0.2)
    }
  }

  meow() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(520, t)
    osc.frequency.linearRampToValueAtTime(820, t + 0.12)
    osc.frequency.exponentialRampToValueAtTime(430, t + 0.45)
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 3
    f.frequency.setValueAtTime(900, t)
    f.frequency.linearRampToValueAtTime(1600, t + 0.15)
    f.frequency.linearRampToValueAtTime(800, t + 0.45)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.12, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    osc.connect(f).connect(g).connect(this.sfx)
    osc.start(t)
    osc.stop(t + 0.55)
  }

  rocket() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    this.noise(t, 3.4, 0.35, 'lowpass', 160, 1400, 0.7)
    this.tone(48, t, 3.2, 0.25, 'sine', false, undefined, 90)
  }

  type() {
    const ctx = this.live
    if (!ctx) return
    this.noise(ctx.currentTime, 0.03, 0.05, 'highpass', 3000 + Math.random() * 2000, 5000)
  }

  error() {
    const ctx = this.live
    if (!ctx) return
    const t = ctx.currentTime
    this.tone(220, t, 0.12, 0.06, 'square')
    this.tone(180, t + 0.13, 0.16, 0.06, 'square')
  }
}

export const audio = new AudioEngine()
