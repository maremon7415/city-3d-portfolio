import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { profile, projects, skillGroups, aboutItems } from './src/content.ts'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Fills SEO tags from src/content.ts and injects a full static HTML version of the
 * portfolio into <noscript>, so crawlers and no-JS visitors still get everything.
 */
function portfolioHtml(): Plugin {
  const title = `${profile.name} — ${profile.title}`
  const description = `${profile.intro} Fly through a floating island city of projects, then play.`
  const noscript = `
    <main style="max-width:720px;margin:40px auto;padding:0 20px;font-family:system-ui,sans-serif;color:#f6efe6;line-height:1.6">
      <h1>${esc(profile.name)}</h1>
      <p><strong>${esc(profile.title)}</strong> · ${esc(profile.location)}</p>
      <p>${esc(profile.intro)}</p>
      <h2>Projects</h2>
      <ul>${projects
        .map(
          (p) =>
            `<li><strong>${esc(p.title)}</strong> — ${esc(p.tagline)}. ${esc(p.description)} <em>${esc(p.tech.join(', '))}</em>${
              p.liveUrl ? ` <a href="${esc(p.liveUrl)}">Live</a>` : ''
            }${p.codeUrl ? ` <a href="${esc(p.codeUrl)}">Code</a>` : ''}</li>`,
        )
        .join('')}</ul>
      <h2>Skills</h2>
      <ul>${skillGroups.map((g) => `<li><strong>${esc(g.name)}:</strong> ${esc(g.skills.map((s) => s.name).join(', '))}</li>`).join('')}</ul>
      <h2>About</h2>
      <ul>${aboutItems.map((a) => `<li><strong>${esc(a.title)}:</strong> ${esc(a.text)}</li>`).join('')}</ul>
      <h2>Contact</h2>
      <p><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>${profile.socials
        .filter((s) => s.url)
        .map((s) => ` · <a href="${esc(s.url)}">${esc(s.label)}</a>`)
        .join('')}</p>
    </main>`
  return {
    name: 'portfolio-html',
    transformIndexHtml(html) {
      return html
        .replaceAll('%PORTFOLIO_TITLE%', esc(title))
        .replaceAll('%PORTFOLIO_DESCRIPTION%', esc(description))
        .replaceAll('%PORTFOLIO_URL%', profile.siteUrl.replace(/\/$/, ''))
        .replaceAll('%PORTFOLIO_NAME%', esc(profile.name))
        .replace('%PORTFOLIO_NOSCRIPT%', noscript)
    },
  }
}

export default defineConfig({
  plugins: [react(), portfolioHtml()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2500,
  },
})
