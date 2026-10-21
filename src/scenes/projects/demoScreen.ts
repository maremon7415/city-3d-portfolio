import type { DemoStyle, Project } from '../../content'

/**
 * Animated "live demo" renderer shared by the building screens (as a CanvasTexture)
 * and the project modal (as a plain canvas). Each project style gets its own tiny
 * looping UI so every building shows something alive.
 */

export const DEMO_W = 512
export const DEMO_H = 320

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function chrome(ctx: CanvasRenderingContext2D, p: Project) {
  ctx.fillStyle = '#0f1424'
  ctx.fillRect(0, 0, DEMO_W, DEMO_H)
  ctx.fillStyle = '#1a2136'
  ctx.fillRect(0, 0, DEMO_W, 34)
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(18 + i * 18, 17, 5.5, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.fillStyle = '#262f4a'
  roundRect(ctx, 86, 8, 330, 18, 9)
  ctx.fill()
  ctx.fillStyle = '#9aa6c7'
  ctx.font = '600 11px "JetBrains Mono Variable", monospace'
  ctx.fillText(`${p.id}.app`, 100, 21)
  ctx.fillStyle = p.accent
  ctx.font = '700 12px "Inter Variable", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('LIVE', DEMO_W - 14, 22)
  ctx.textAlign = 'left'
  ctx.beginPath()
  ctx.arc(DEMO_W - 52, 17, 4, 0, Math.PI * 2)
  ctx.fill()
}

function dashboard(ctx: CanvasRenderingContext2D, p: Project, t: number) {
  // KPI tiles
  const kpis = [
    ['Active users', Math.floor(12840 + Math.sin(t * 0.7) * 320)],
    ['Conversion', `${(4.2 + Math.sin(t * 0.5) * 0.3).toFixed(1)}%`],
    ['Latency', `${Math.floor(42 + Math.sin(t * 1.3) * 6)}ms`],
  ]
  kpis.forEach(([label, value], i) => {
    const x = 16 + i * 162
    ctx.fillStyle = '#18203a'
    roundRect(ctx, x, 48, 150, 58, 10)
    ctx.fill()
    ctx.fillStyle = '#7f8bb0'
    ctx.font = '500 11px "Inter Variable", sans-serif'
    ctx.fillText(String(label), x + 12, 68)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 22px "Inter Variable", sans-serif'
    ctx.fillText(String(value), x + 12, 95)
  })
  // line chart
  ctx.fillStyle = '#18203a'
  roundRect(ctx, 16, 118, 310, 186, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(28, 150 + i * 36)
    ctx.lineTo(314, 150 + i * 36)
    ctx.stroke()
  }
  const line = (offset: number, color: string, amp: number) => {
    ctx.beginPath()
    for (let i = 0; i <= 40; i++) {
      const x = 28 + (i / 40) * 286
      const y = 230 - Math.sin(i * 0.35 + t * 1.4 + offset) * amp - Math.sin(i * 0.13 + t * 0.6) * 22 - i * 1.1
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.stroke()
  }
  line(0, p.accent, 18)
  line(2, '#7cc4ff', 10)
  ctx.lineWidth = 1
  // bars
  ctx.fillStyle = '#18203a'
  roundRect(ctx, 338, 118, 158, 186, 10)
  ctx.fill()
  for (let i = 0; i < 6; i++) {
    const h = 40 + (Math.sin(t * 1.8 + i * 0.9) * 0.5 + 0.5) * 100
    ctx.fillStyle = i % 2 ? '#7cc4ff' : p.accent
    roundRect(ctx, 352 + i * 23, 290 - h, 15, h, 4)
    ctx.fill()
  }
}

const CHAT = [
  { me: false, text: 'Did the deploy go out?' },
  { me: true, text: 'Yep! 🚀 Live 2 minutes ago' },
  { me: false, text: 'Load time looks amazing' },
  { me: true, text: 'Edge caching + lazy chunks ✨' },
  { me: false, text: 'Ship it to everyone 🎉' },
]

function chat(ctx: CanvasRenderingContext2D, p: Project, t: number) {
  ctx.fillStyle = '#141a2e'
  ctx.fillRect(0, 34, 130, DEMO_H)
  ;['# general', '# design', '# deploys', '# random'].forEach((c, i) => {
    ctx.fillStyle = i === 2 ? p.accent : '#7f8bb0'
    ctx.font = `${i === 2 ? 700 : 500} 13px "Inter Variable", sans-serif`
    ctx.fillText(c, 16, 64 + i * 28)
  })
  const cycle = 9
  const k = (t % cycle) / cycle
  const shown = Math.floor(k * (CHAT.length + 1.5))
  let y = 56
  CHAT.slice(0, Math.min(shown, CHAT.length)).forEach((m) => {
    ctx.font = '500 14px "Inter Variable", sans-serif'
    const w = ctx.measureText(m.text).width + 24
    const x = m.me ? DEMO_W - 16 - w : 146
    ctx.fillStyle = m.me ? p.accent : '#232c48'
    roundRect(ctx, x, y, w, 32, 14)
    ctx.fill()
    ctx.fillStyle = m.me ? '#1a1020' : '#e8ecf8'
    ctx.fillText(m.text, x + 12, y + 21)
    y += 42
  })
  if (shown < CHAT.length) {
    ctx.fillStyle = '#232c48'
    roundRect(ctx, 146, y, 62, 30, 14)
    ctx.fill()
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.5 * Math.max(0, Math.sin(t * 6 - i))})`
      ctx.beginPath()
      ctx.arc(164 + i * 13, y + 15, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function shop(ctx: CanvasRenderingContext2D, p: Project, t: number) {
  const items = ['Sneaker', 'Backpack', 'Headset', 'Lamp', 'Camera', 'Watch']
  const colors = ['#ff9f6b', '#7cc4ff', '#c9a7ff', '#ffd36b', '#8be28b', '#ff7aa8']
  const active = Math.floor(t / 1.4) % items.length
  items.forEach((name, i) => {
    const x = 16 + (i % 3) * 162
    const y = 48 + Math.floor(i / 3) * 132
    const hover = i === active
    ctx.fillStyle = hover ? '#202a48' : '#18203a'
    roundRect(ctx, x, y - (hover ? 3 : 0), 150, 120, 12)
    ctx.fill()
    ctx.fillStyle = colors[i]
    roundRect(ctx, x + 12, y + 10 - (hover ? 3 : 0), 126, 60, 8)
    ctx.fill()
    ctx.fillStyle = '#e8ecf8'
    ctx.font = '600 13px "Inter Variable", sans-serif'
    ctx.fillText(name, x + 12, y + 90)
    ctx.fillStyle = '#7f8bb0'
    ctx.fillText(`$${(29 + i * 17).toFixed(0)}`, x + 12, y + 108)
    ctx.fillStyle = hover ? p.accent : '#2b3556'
    roundRect(ctx, x + 98, y + 92, 40, 20, 10)
    ctx.fill()
    ctx.fillStyle = hover ? '#0f1424' : '#9aa6c7'
    ctx.font = '700 14px "Inter Variable", sans-serif'
    ctx.fillText('+', x + 114, y + 107)
  })
  // cart badge
  const count = (Math.floor(t / 1.4) % 9) + 1
  ctx.fillStyle = p.accent
  ctx.beginPath()
  ctx.arc(DEMO_W - 82, 17, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0f1424'
  ctx.font = '700 11px "Inter Variable", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(count), DEMO_W - 82, 21)
  ctx.textAlign = 'left'
}

const CODE = [
  ['const ', 'city', ' = ', 'createIsland', '({ seed: 7 })'],
  ['city', '.', 'onScroll', '(', '(p) => camera.fly(p))'],
  ['useFrame', '((', 'state', ') => {'],
  ['  sky', '.', 'phase', ' = ', 'dayNight(progress)'],
  ['  lights', '.', 'night', ' = ', 'smoothstep(0.6, 1, t)'],
  ['})'],
  ['export ', 'default ', 'function ', 'Portfolio', '() {'],
  ['  return ', '<', 'Canvas', '>', '<City />', '</', 'Canvas', '>'],
  ['}'],
  ['// TODO: ship it 🚀'],
]

function code(ctx: CanvasRenderingContext2D, _p: Project, t: number) {
  const palette = ['#c792ea', '#82aaff', '#e8ecf8', '#ffcb6b', '#c3e88d', '#89ddff']
  const total = CODE.length
  const typed = (t * 14) % (total * 22)
  let chars = typed
  ctx.font = '500 15px "JetBrains Mono Variable", monospace'
  CODE.forEach((line, li) => {
    let x = 46
    const y = 62 + li * 25
    ctx.fillStyle = '#4b5577'
    ctx.fillText(String(li + 1).padStart(2, ' '), 12, y)
    line.forEach((tok, ti) => {
      if (chars <= 0) return
      const part = tok.slice(0, Math.max(0, Math.floor(chars)))
      chars -= tok.length
      ctx.fillStyle = line[0].startsWith('//') ? '#5f6b8f' : palette[(ti + li) % palette.length]
      ctx.fillText(part, x, y)
      x += ctx.measureText(part).width
    })
    if (chars > 0 && chars < 4) {
      ctx.fillStyle = Math.sin(t * 8) > 0 ? '#ffffff' : 'transparent'
      ctx.fillRect(x + 2, y - 13, 8, 16)
    }
    chars -= 4
  })
}

function game(ctx: CanvasRenderingContext2D, p: Project, t: number) {
  // tiny parallax flyer — a wink at this very site
  const sky = ctx.createLinearGradient(0, 34, 0, DEMO_H)
  sky.addColorStop(0, '#2a3a7a')
  sky.addColorStop(1, '#ff9a7a')
  ctx.fillStyle = sky
  ctx.fillRect(0, 34, DEMO_W, DEMO_H - 34)
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = ['#5b4f8f', '#3f3a73', '#2a2655'][layer]
    ctx.beginPath()
    ctx.moveTo(0, DEMO_H)
    for (let x = 0; x <= DEMO_W; x += 16) {
      const y = 230 + layer * 26 - Math.sin((x + t * (30 + layer * 40)) * 0.012 + layer) * (24 - layer * 5) - Math.sin((x + t * 50) * 0.03) * 6
      ctx.lineTo(x, y)
    }
    ctx.lineTo(DEMO_W, DEMO_H)
    ctx.fill()
  }
  // coins
  for (let i = 0; i < 6; i++) {
    const x = ((i * 120 - t * 110) % 720 + 720) % 720 - 60
    const y = 120 + Math.sin(i * 1.7) * 40
    ctx.fillStyle = '#7ff3ff'
    ctx.beginPath()
    ctx.moveTo(x, y - 10)
    ctx.lineTo(x + 7, y)
    ctx.lineTo(x, y + 10)
    ctx.lineTo(x - 7, y)
    ctx.fill()
  }
  // drone
  const dy = 140 + Math.sin(t * 2) * 26
  ctx.fillStyle = p.accent
  roundRect(ctx, 140, dy, 44, 16, 6)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(130, dy - 6, 64, 3)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 16px "Inter Variable", sans-serif'
  ctx.fillText(`◆ ${Math.floor(t * 2) % 99}`, 18, 60)
}

const RENDERERS: Record<DemoStyle, (ctx: CanvasRenderingContext2D, p: Project, t: number) => void> = {
  dashboard,
  chat,
  shop,
  code,
  game,
}

export function drawDemo(ctx: CanvasRenderingContext2D, p: Project, t: number) {
  ctx.save()
  chrome(ctx, p)
  ctx.beginPath()
  ctx.rect(0, 34, DEMO_W, DEMO_H - 34)
  ctx.clip()
  RENDERERS[p.demo](ctx, p, t)
  ctx.restore()
  // subtle scanline sheen
  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let y = 0; y < DEMO_H; y += 4) ctx.fillRect(0, y, DEMO_W, 1)
}
