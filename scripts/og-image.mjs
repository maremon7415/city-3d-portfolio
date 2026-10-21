// Regenerates public/og-image.jpg (1200×630) from the real scene.
// Usage: npm run dev (in another terminal), then `npm run og`.
// Needs Playwright: `npm i -D playwright && npx playwright install chromium`.
const url = process.argv[2] ?? 'http://localhost:5173/?quality=high'
let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error('Playwright not found. Run: npm i -D playwright && npx playwright install chromium')
  process.exit(1)
}
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForSelector('#ld-actions.on', { timeout: 90_000 })
await page.click('#ld-enter')
// let the camera settle and hide the UI chrome for a clean shot
await page.waitForTimeout(3500)
await page.addStyleTag({ content: '.nav,.journey .card:not(.hero-card) .actions,.scroll-hint{display:none!important}' })
await page.waitForTimeout(500)
await page.screenshot({ path: 'public/og-image.jpg', type: 'jpeg', quality: 86 })
await browser.close()
console.log('Saved public/og-image.jpg')
