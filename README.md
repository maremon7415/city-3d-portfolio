# city-3d-portfolio

**Floating Island City: a scroll-to-play 3D portfolio.** You scroll, and the camera flies over a low-poly island city while the sky turns from dawn to night. Projects come up as buildings with live demos on their screens. At the end the city becomes a small game you fly through with a drone.

> **Scroll → Journey → Play.** It's an experience, not just a portfolio page.

- **Zero downloaded 3D assets.** Every model, cloud, waterfall, sound and the loading screen is generated in code, so the first load stays small.
- **Accessible by default.** There's a full 2D mode, keyboard navigation, `prefers-reduced-motion` support, and every piece of text is real HTML.

---

## The journey (6 chapters)

| # | Chapter | What happens |
|---|---------|--------------|
| 1 | **Loading** | A voxel island builds itself block by block as the progress bar fills. It paints before any JS loads. |
| 2 | **Takeoff** (dawn) | The camera rises from the cloud sea up to the island. Your name sits on the hill in voxel letters. |
| 3 | **Projects district** (day → sunset) | Each project is a building that rises out of the ground. Its screen runs an animated demo. Click a building to open the project modal. |
| 4 | **Skills circuit** (sunset) | A circuit tree. Each skill node powers up as you scroll, and energy pulses run along the copper traces. |
| 5 | **About workshop** (dusk) | A cozy cut-away room. Hover an object (desk, books, gamepad, coffee, plant, cat) to read its story. |
| 6 | **Finale** (night) | Launch the rocket to open the contact terminal, or press **Play**. |

## Play Mode

Explore → collect → unlock → discover.

- **Drone flight** uses Rapier physics.
  - Desktop: `WASD` to fly, `Space`/`E` up, `C`/`Q` down, `Shift` boost. Drag the mouse or use `←` `→` to look, and scroll to zoom.
  - Mobile: virtual joystick to fly, drag on the right side to look, plus up/down/boost buttons.
- **12 data shards.** Each one shows a fact or a short story about you.
- **Mini challenges:**
  - Sky ring time trial (9 rings, best time is saved)
  - Bug hunt (squash 6 glitchy bugs)
- **4 easter eggs.** Hints: something lives below the clouds, the cat likes attention, ↑↑↓↓←→←→BA works, and the browser console has a message.
- **100% reward:** fireworks and a hidden message.
- **Contact from inside the game:** fly to the rocket and press `F`.
- Play Mode is optional. Progress is saved in `localStorage`.

## Make it yours

**Edit [`src/content.ts`](src/content.ts).** Everything personal lives in that one file:

- name and title
- projects, with their live and code links, accent colour, demo style and building style
- skills
- about stories
- shard facts
- social links, résumé, email and contact form endpoint

The 3D city, the 2D mode, the SEO tags and the `<noscript>` fallback are all generated from it. Fields marked `TODO` are placeholders, and setting a value to an empty string hides that link or button.

**Contact form.** Set `profile.formEndpoint` to a Formspree, Getform or Basin URL. The form then POSTs JSON. Without an endpoint, it opens a pre-filled `mailto:`.

**Live demo inside a building.** Set a project's `embedUrl` to a site that allows iframing, and the modal gets a "Run the real app here" button.

**Social preview.** Run `npm run og` with the dev server running to regenerate `public/og-image.jpg` from the real scene.

## Tech stack

| Job | Tool |
|-----|------|
| 3D scene | React Three Fiber + drei (Three.js) |
| Scroll camera | GSAP ScrollTrigger + a scroll-measured Catmull-Rom camera path |
| Smooth scroll | Lenis |
| Physics (Play Mode) | Rapier (`@react-three/rapier`), lazy-loaded |
| Post-processing | `postprocessing`: bloom, tilt-shift depth of field, colour grading, vignette, ACES |
| Audio | Hand-written procedural WebAudio engine (no audio files) |
| State | Zustand |
| Build | Vite + TypeScript |
| Hosting | Vercel (`vercel.json` included) |

## Project structure

```
src/
  content.ts            ← all personal content
  scenes/               ← one folder per chapter + world + environment + play
    environment/        sky shader, lighting, clouds, post-processing
    world/              procedural island generator, town (instanced), waterfall
    intro/              voxel name sign, windmill, fountain, bridge
    projects/           project buildings + animated demo screens
    skills/             circuit tree
    about/              workshop room
    finale/             rocket + terminal
    play/               Play Mode (physics, drone, shards, rings, bugs, secrets)
  systems/              scroll, camera path, day-night, audio, input, layout, quality
  ui/                   HTML overlay: journey cards, nav, modals, terminal, HUD, 2D mode
  state/                zustand store + per-frame live values
```

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run preview    # serve the production build
```

URL flags:

| Flag | Effect |
|------|--------|
| `?mode=2d` | Opens the simple 2D version |
| `?quality=low` or `?quality=high` | Forces a quality tier |
| `?debug` | Shows an FPS meter |

## Performance

- **Fewer draw calls.** Houses, trees, lamps, windows and clouds are instanced. Buildings and props are merged into single vertex-coloured meshes, so there's one material for most of the world.
- **Small initial load.** The 3D chunk loads behind the loading screen. Rapier physics (about 850 KB gz) loads only when Play Mode starts.
- **Adaptive quality.** The quality tier is detected from the device and adjusted at runtime with `PerformanceMonitor` and adaptive DPR.
  - Low tier: no shadows, fewer clouds and trees, bloom only.
- **No wasted canvas work.** Demo screens redraw at about 24 fps, and only when the camera is close.

## Accessibility

- A "Skip to content" link and the **2D** button switch to a plain, fast HTML page. No WebGL is mounted in that mode.
- All project, skill, about and contact information is real HTML.
- The canvas is `aria-hidden`.
- Modals trap focus, close with `Esc` and restore focus when they close.
- Focus is always visible.
- `prefers-reduced-motion` turns off smooth scrolling, parallax, bounces and camera shake.

## Deploy

Push to GitHub, import the repo in Vercel, and keep the defaults (Vite). Then update `profile.siteUrl` in `src/content.ts` so the Open Graph tags point at your domain.
