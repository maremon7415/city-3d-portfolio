# Presenting portfolio content inside the 3D scene (R3F 9 + drei 10.7.9)

Scope: how to replace the glass HTML cards (`src/ui/Journey.tsx`, `.card` in `src/styles/global.css`) with content that lives in the world, and how to move the camera and reveal that content so it feels smooth. Everything below is checked against the installed versions in `/home/user/city-3d-portfolio/node_modules`. Items marked **VERIFIED** were run in a swiftshader browser or read from installed source in this session.

---

## 0. TL;DR: decisions for the implementation stage

1. **Text engine: drei `<Text>` (troika-three-text 0.52.5) for almost all text.** It is crisp SDF text, one draw call per block, laid out in a worker, and supports kerning, ligatures, `maxWidth` wrapping, `clipRect`, outline and stroke, `curveRadius` and `colorRanges`. Add **Text3D** only for the hero name, and only if you want physical letters. Use a **CanvasTexture** for Bengali and for the terminal screen. Keep drei **`<Html>` out of the journey**: it is what makes the content look pasted on.
2. **Placement: "stop-anchored slots."** Each stop's text lives in world space. Its position comes from NDC slots (e.g. upper-left third) unprojected from that stop's camera pose at the current aspect ratio. Text is then always legible and never overlaps the subject on any screen. It still has real parallax and depth while the camera flies in and out. Code in §3.2.
3. **Reveal: one GPU shader per text block, driven by one uniform.** A per-glyph rise, scale and fade reads troika's `aTroikaGlyphBounds` / `uTroikaTotalBounds` through a base-material `onBeforeCompile`. **VERIFIED** working, screenshots in `scratchpad/shots/proto-troika-r*.png`. Titles **trigger** a timed reveal when the camera settles. Story text **scrubs** with scroll. Use `clipRect` for masked line rise-ins (**VERIFIED**).
4. **Camera: the camera must settle before anything is read.**
   - Replace the exponential `lerp(damp(3.6))` with critically damped springs (`maath/easing` `damp3`, about 1 KB gz).
   - Add **Lenis Snap** (`lenis/snap`, already installed, about 2 KB gz) on the hold centres.
   - Use arc-length parametrisation in travel runs.
   - Add a "rack focus": TiltShift blur goes to 0 during holds.
   - Add FOV breathing, plus slight bank on fast travel.
   - Inspect mode blends a second pose over the journey pose instead of mounting a competing controller. `CameraControls` stays optional.
5. **Screenshots in-world:** use real portfolio3 WebPs on the existing building screen planes, downsized to 1024 px.
   - On the screen: a rounded-corner shader with a de-zoom reveal, a crossfade slideshow, and an optional auto-scroll for tall captures.
   - "Open case study" uses a **screen-to-DOM handoff**: the DOM sheet starts clipped exactly to the projected 3D screen rectangle, then expands. The seam disappears. Long-form reading and forms stay DOM, but only when the user asks for them.
6. **Accessibility: the DOM stays the spine.**
   - The `[data-stop]` panels keep driving scroll length and stop measurement. They become visually hidden but readable by screen readers and focusable.
   - An `aria-live` caption announces each stop.
   - DOM focus is mirrored onto 3D focus rings.
   - Reduced motion: cuts instead of flights, fades instead of glyph motion.
   - The 2D site (`FlatSite`) remains the complete alternative.
7. **Packages:**
   - Required: nothing new. troika, camera-controls and maath are already transitive dependencies of drei.
   - Declare `troika-three-text@^0.52.4` and `maath@^0.10.8` as direct dependencies so you import them without duplicates.
   - Avoid `@react-three/uikit`: 377 KB gz measured.
   - Avoid `@react-three/a11y`: last release May 2022, uses zustand 3.
   - Avoid `@theatre/r3f`: inactive since 2023.
8. **Font gotcha (VERIFIED):** the `scratchpad/fontprobe/*.ttf` files from the design stage are **WOFF2 inside** (magic `wOF2`). troika rejects them with `Error: woff2 fonts not supported`. Real TTFs are now in `scratchpad/fontreal/`:

   | Font | TTF | gzip |
   |---|---|---|
   | FunnelDisplay-600 | 23.9 KB | 13.8 KB |
   | Inter-400 | 66.4 KB | 31.4 KB |
   | JetBrainsMono-400 | 57.4 KB | 27.7 KB |

   Ship those, or the `.woff` files, which are valid zlib WOFF.

---

## 1. What exists in the installed drei 10.7.9 and how it fits

| drei piece | What it does (installed source) | Verdict for this project |
|---|---|---|
| `Text` (core/Text.js) | troika `Text` as a primitive. Props listed in `Text.d.ts`: `characters, font, fontSize, maxWidth, lineHeight, letterSpacing, textAlign, anchorX/Y, clipRect, depthOffset, direction, outline*, stroke*, fillOpacity, sdfGlyphSize (default 64), glyphGeometryDetail, onSync`. It **always suspends** on `preloadFont({font, characters})`, keyed `['troika-text', font, characters]`. Any non-string child, such as a material, is attached to the mesh. | **Primary text engine.** Wrap each chapter in its own `<Suspense fallback={null}>` (see §11 #4). |
| `Text3D` | `TextGeometry` from a typeface JSON (facetype.js). Props are `font`, `size`, `depth`, `bevel*`, `curveSegments`, `letterSpacing`, `lineHeight`. No kerning and no ligatures. Each glyph costs hundreds to thousands of triangles. | Hero name or giant numerals only, using a JSON subset of about 10 KB. Optional. |
| `Html` (web/Html.js) | DOM positioned per frame. `transform` uses CSS `matrix3d`. `occlude` either raycasts against objects every frame or uses `'blending'`, which places the DOM behind the canvas and draws an `opacity:0` `NoBlending` mesh to punch a hole. **In transform mode it ignores the camera view offset**: it uses only `projectionMatrix.elements[5]` and centres the perspective, so it misaligns under the current `setViewOffset` lens shift. **VERIFIED** by reading the source. | **Do not use for journey content.** It is never tone mapped, never fogged, never part of bloom or tilt-shift, and costs per-frame style writes. That is the "pasted card" look. Keep it only for Play-mode debug labels if at all. |
| `Billboard` (`follow`, `lockX/Y/Z`) | Faces the camera. | Skill node labels, Play-mode labels. Use `lockX`/`lockZ` so labels stay upright. |
| `ScreenSizer` | Rescales a subtree every frame so 1 unit is about 1 px. | Constant-size node labels and hotspots (skills tree, About objects). |
| `Float` | Bobbing and rotation noise. | Gentle life on floating signs and holograms. Disable under reduced motion. |
| `Image` | Mesh plus `ImageMaterial` with `radius` (rounded corners), `zoom`, `grayscale`, `toneMapped`, `transparent`, `opacity`. | Photo frame (developer portrait) and screenshot cards. Animate `zoom` 1.25→1 for portfolio3's de-zoom reveal. |
| `useTexture` | TextureLoader plus `gl.initTexture()` so the upload happens at load, not on first view. `.preload(url)` and `.clear(url)` are available. | Load screenshots. Call `useTexture.preload` when the visitor is one chapter away. |
| `Decal` | Projects a texture onto a mesh. | Logos and stickers on buildings or the rocket. Small polish. |
| `RenderTexture` | Renders a portal scene into an FBO every frame (`frames=Infinity` by default). Has a UV event compute so you can click inside it. | A live mini-scene on a screen, e.g. an animated 3D logo. Use `frames={1}` for static scenes. It costs a full extra render while live. |
| `MeshPortalMaterial` | RenderTexture plus a blend quad. With `blur`, it builds an SDF mask using `readRenderTargetPixels` (a GPU stall at mount). Renders the portal scene each frame while visible. | A "window into a project world" for at most one hero project, e.g. Dent-Assist or San Uni. Treat as optional wow. Each live portal is an extra scene render. |
| `Hud` | Renders a separate scene after a given `renderPriority`: it calls `clearDepth()` then `gl.render(hudScene, camera)`. With priority 1 it also renders the default scene itself. | Use `renderPriority={2}`, so it draws **after** `EffectComposer`, which renders at priority 1 (verified in `@react-three/postprocessing`). Good for exact-colour editorial type (§2.3). Never use priority 1 here. |
| `View` | Scissored multi-viewport rendering tied to DOM rects. | Not needed (single full-screen canvas). |
| `ScrollControls` / `useScroll` | Its own scroll container. | **Do not adopt.** Lenis plus ScrollTrigger plus the DOM spine are already better and accessible. |
| `CameraControls` (camera-controls 3.1.2) | Spring-smoothed controls. Key methods: `setLookAt(...6, transition)`, `lerpLookAt(A6, B6, t)`, `fitToBox(box, transition, {padding*})`, `setFocalOffset`, `smoothTime`, events `rest` and `transitionstart`. | Optional for inspect mode. Transitions are spring-based (`smoothTime`), not eased tweens. To get designed easing, tween `t` with GSAP and call `lerpLookAt(..., t, false)`. 10.2 KB gz. |
| `MotionPathControls` | Moves an object along `curves` by `offset` with damping and a focus target. | Not better than the existing `cameraPath.ts`. Skip. |
| `Mask` / `useMask` | Stencil masking. | **Unusable as configured**: the Canvas has `gl={{ stencil:false }}` and the composer has no stencil buffer. Use `clipRect` or shader masks. |
| `PerformanceMonitor`, `AdaptiveDpr` | Already used. | Keep. Text visibility culling (§8) helps them. |

---

## 2. Diegetic text: options and trade-offs

### 2.1 Comparison

| | troika SDF (`<Text>`) | CanvasTexture text | drei `Html transform` / CSS3D | `Text3D` extruded | MSDF atlas (three-msdf-text-utils) | `@react-three/uikit` |
|---|---|---|---|---|---|---|
| Crisp at any distance | Yes: SDF, `fwidth` AA. Use `sdfGlyphSize` 128 for mega type. | Only if the canvas is rendered at ≥ 2× on-screen px. Blurry when magnified. | Yes (browser text). Blurry on some GPUs per the drei docs (fix: scale 0.5 parent / 2× child). | Yes (geometry). Needs MSAA (high tier has 4×). | Yes, sharp corners. | Yes (MSDF). |
| Looks part of the world (fog, light, post, occlusion) | Yes: patches any three material, including lit `MeshStandardMaterial`. | Yes | **No**: always on top of or behind the canvas. Blending-mode holes are fragile under the composer. | Yes, plus shadows and physics. | Yes | Yes |
| Layout (wrap, align, letter-spacing, line-height) | Good: `maxWidth`, `textAlign`, `lineHeight`, `letterSpacing`, `textIndent`, `overflowWrap`. | Manual (`measureText`). | Full CSS. | Manual, no kerning. | Basic BMFont layout. | Flexbox (yoga). |
| Bengali / Indic shaping | **Broken. VERIFIED**: "হ্যালো" renders as "হযালো" with a detached ো; "স্বাগতম" loses the conjunct; ি is not reordered. | **Correct. VERIFIED**: browser HarfBuzz. | Correct | Broken | Broken | Same SDF/MSDF limitation |
| Font file | .ttf/.otf/.woff only. **No .woff2.** | Any web font (load with `FontFace` first). | Any | facetype JSON | Pre-generated atlas plus JSON per font. | Pre-generated MSDF |
| Per-glyph animation | Yes: GPU shader on glyph bounds (**VERIFIED**), `clipRect`, `colorRanges`, splitting into lines or words. | Redraw the canvas (CPU plus upload). | GSAP SplitText (DOM). | Per-glyph meshes possible. | Shader | Limited |
| Cost | About 41.5 KB gz lib (measured). 1 draw call per block. Atlas texture per font. Layout in a worker. | One texture upload per redraw, about 0.6 MB per 512×320. | Per-frame DOM style writes. Raycast occlusion per element per frame. | Triangles; JSON size grows with charset. | 10.7 KB gz plus atlas PNGs | **377 KB gz measured** |
| Mobile | Excellent | OK if few redraws | Janky with many elements, plus iOS compositing issues | OK for a few glyphs | Good | Heavy |

**Verdict:**
- troika covers about 90% of the content.
- CanvasTexture covers Bengali, emoji and the terminal.
- Text3D covers only the hero name.
- No DOM-in-3D during the journey.

The prototype is `scratchpad/proto/index.html` (vanilla three r186 + troika 0.52.5 via import map). Run it with `python3 -m http.server 8765` in `scratchpad/proto` and `node scratchpad/tools/proto-shot.cjs`.

### 2.2 Legibility rules for in-world type

- **Size in CSS px, not world units.** At hold distance `d`: `worldPerPx = 2·d·tan(fov/2) / viewportCssHeight`. Then `fontSize = targetPx × worldPerPx`.
  - Target px on desktop: display 72–140 px, title 34–44 px, body 16–18 px, mono eyebrow 12–13 px.
  - Target px on mobile: display 44–64 px, title 28–32 px, body 15–16 px, mono 11–12 px.
  - Browser zoom changes `innerHeight`, so this formula automatically honours page zoom (an accessibility win).
- **Floor of about 12 px on screen.** Below that, SDF AA turns faint and shimmers while the camera moves. Show small text only during holds.
- **Face the stop camera.** Keep the text plane within about 20° of the camera's image plane at the hold. Grazing angles kill legibility. The slot system in §3.2 orients the plane to the stop camera's quaternion, plus at most a 6–10° yaw toward the subject for an "in-world" feel.
- **Contrast against a busy low-poly background.** In order of preference:
  1. Place text against sky or a plain wall, by choosing the slot.
  2. Add a diegetic backplate: signboard, billboard or holo panel.
  3. Use a troika outline halo, `outlineWidth: '4%'`, `outlineBlur: '30%'`, `outlineOpacity: .35`, dark.
  4. Under `prefers-contrast: more`, force backplates.
- **Day→night.** Text materials should follow `env` / `live.night`: dark ink on light plates by day, emissive cream by night. Bloom at night is free glow.
- **Post stack interactions (from `Effects.tsx`):**
  - **TiltShift2** (`blur .09, taper .6`, focus band at vertical centre) blurs the top and bottom bands. Text there is soft. Animate the blur to 0 during holds (rack focus, §4.6), or keep text in the middle 60%.
  - **Bloom** `luminanceThreshold .82`: cream `#f2eee6` text (linear luminance about .86) glows faintly. Keep body text below about .75 luminance unless glow is intended (design doc §6).
  - **ToneMapping ACES** shifts brand hexes. Use the pre-compensated linear colours from `design-language.md` §6, or put editorial type in the Hud (§2.3).
- **Sides and sorting.** troika's default material is `DoubleSide` + `transparent` (verified in `Text.js`).
  - World text should use `side: FrontSide` so mirrored text never shows from behind during flights.
  - Set `depthWrite={false}` and give it an explicit `renderOrder` (above clouds and water) to avoid transparency sort flicker.
- **Fog:** keep `fog` on for diegetic signage, and off (`fog={false}` on the material) for the active stop's headline.

### 2.3 Two render tiers

- **Tier A, diegetic (main scene, inside the composer).** Signboards, screens, ring text, labels, monolith numerals. These are lit, fogged, tone mapped and occluded. This is the default.
- **Tier B, editorial (drei `<Hud renderPriority={2}>`, after the composer).** Use it for a few kinetic headlines that must show exact brand colours and never blur. Hud children can use the **main camera** with world coordinates, so they still parallax with the scene, but they draw on top of everything (depth is cleared).
  - Use `toneMapped={false}`.
  - Caveat: the default framebuffer has `antialias:false`, so any **geometry** in the Hud aliases. SDF text and SDF-shaped quads (rounded rect via `fwidth`) are fine. Use the Hud sparingly: overused, it is just HTML cards again.

### 2.4 Bengali

- Never send Bengali through troika.
- Draw it once to a `CanvasTexture` after `await new FontFace('NotoBn','url(/fonts/NotoSansBengali-600.woff2)').load()`. Use canvas ≥ 2× on-screen px, `anisotropy 8`, `SRGBColorSpace`. Map it onto a plane, or use it as `alphaMap` on a lit material.
- Alternatively pre-render to PNG/KTX2 as Jesse Zhou does for his in-world text.
- The bilingual greeting (Hello → হ্যালো → স্বাগতম) can be three canvas planes crossfaded in-world, or stay in the DOM preloader.

### 2.5 Cheap "depth" for display type without Text3D

- Stack 6–10 troika copies of the same string offset in −z, each a shade darker. This is fake extrusion, about 10 draw calls, and keeps kerning.
- Or use `strokeWidth` with `fillOpacity:0` for portfolio3's outline numerals ("01 / 04").
- Text3D is only worth it for letters that physically exist on the island, for example ones the drone can knock over in Play Mode (Bruno Simon's signature move).

---

## 3. Placement: where text lives

### 3.1 Principles

- **Hold and read.** In-world text is readable only from roughly one pose, so every text block belongs to a stop. It reveals after the camera settles and dissolves as the camera leaves. Set `visible=false` outside the stop window: that saves draw calls and prevents mirrored or garbled text mid-flight.
- **Progressive disclosure.** At most about 25 words per stop in-world: kicker, title, one-line tagline, 3 chips, 1–2 CTAs. Deep content (problem, solution, results, stack details) goes in a user-initiated case-study view (§6.4).
- **Diegetic carriers per chapter.** Text sits on something rather than floating in a void:

  | Chapter | Carriers |
  |---|---|
  | Intro | Sky-written mega name; signpost at the plaza |
  | Projects | Billboard / signboard next to each building, plus the building screen |
  | Skills | Curved ring text on the circuit platform (`curveRadius`); node tags (`Billboard` + `ScreenSizer`) |
  | About | Chalkboard or whiteboard on the wall; photo frame (drei `Image`); desk monitor terminal (canvas) |
  | Timeline | Milestone posts along the bridge |
  | Finale | Gantry banner and contact terminal screen |

### 3.2 Stop-anchored camera-space slots (the key technique)

Define each block's slot in **NDC of the stop camera**. At resize or measure time, convert it to a world anchor for the current aspect ratio and lens shift. The text then exists in the world, with depth, parallax and lighting, yet it lands exactly where the composition wants it on every screen size. The lens shift (`setViewOffset`) is honoured automatically because the slot is unprojected through the real projection matrix.

```ts
// src/systems/slots.ts
import { PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { sampleCamera } from './cameraPath'
import { journey } from './scroll'

const tmp = new PerspectiveCamera()
const fwd = new Vector3(), dir = new Vector3(), pos = new Vector3(), tgt = new Vector3()

export interface Slot { ndc: [number, number]; distance: number } // e.g. { ndc: [-0.55, 0.35], distance: 9 }
export interface Placed { position: Vector3; quaternion: Quaternion; worldPerPx: number; widthWorld: number }

/** World placement for a slot of a stop, for the live camera's current fov/aspect/view offset. */
export function placeSlot(stopId: string, slot: Slot, live: PerspectiveCamera): Placed | null {
  const r = journey.stops.get(stopId)
  if (!r) return null
  sampleCamera(r.start + (r.end - r.start) * 0.35, pos, tgt) // pose ~1/3 into the hold (drift is small)
  // apply the same portrait pull-back JourneyCamera applies (keep this in one shared helper)
  const aspect = live.aspect
  if (aspect < 1) pos.sub(tgt).multiplyScalar(1 + (1 / aspect - 1) * 0.42).add(tgt)
  tmp.copy(live)                       // copies fov, aspect, near/far and the view offset
  tmp.position.copy(pos)
  tmp.lookAt(tgt)
  tmp.updateMatrixWorld()
  tmp.getWorldDirection(fwd)
  dir.set(slot.ndc[0], slot.ndc[1], 0.5).unproject(tmp).sub(pos).normalize()
  const position = pos.clone().addScaledVector(dir, slot.distance / dir.dot(fwd))
  const fullH = tmp.view?.enabled ? tmp.view.fullHeight : innerHeight
  const worldPerPx = (2 * slot.distance * Math.tan((tmp.fov * Math.PI) / 360)) / fullH
  const widthWorld = worldPerPx * (tmp.view?.enabled ? tmp.view.fullWidth : innerWidth)
  return { position, quaternion: tmp.quaternion.clone(), worldPerPx, widthWorld }
}
```

**Usage:**
- Recompute on `journey.version` change (ScrollTrigger refresh), on resize, and on orientation change.
- `fontSize = 40 * placed.worldPerPx`.
- `maxWidth = Math.min(560, innerWidth * 0.86) * placed.worldPerPx`.

**Slot presets:**
- Desktop (aspect > 1.1): left column `ndc [-0.62, 0.30]` with `anchorX:'left'`, subject on the right third.
- Portrait (< 0.85): top band `ndc [-0.86, 0.78]` with `anchorY:'top'`, subject in the lower half. Keep the existing `sy` lens shift, or tune it.

**Sightline:** keep `distance` smaller than the camera-to-subject distance, so nothing sits between the camera and the text. Optionally run a one-off raycast from the stop camera to the 4 slot corners at build time and warn in `?debug` if a mesh intersects.

### 3.3 Labels attached to objects (skills nodes, About objects)

- Replace the DOM chips in `SkillsGarden.tsx` and `AboutWorkshop.tsx` with `<Billboard lockX lockZ>` + `<ScreenSizer scale={…}>` + `<Text>` on a rounded-rect SDF backplate. They then bloom, fog and occlude naturally, and cost about 1–2 draw calls each.
- Group names go around the platform rim with `curveRadius` (negative radius = convex outward).

---

## 4. Camera choreography

### 4.1 What the current camera does, and why it can feel floaty or jerky

Read from `src/scenes/JourneyCamera.tsx`, `src/systems/cameraPath.ts` and `src/systems/scroll.ts`:

1. **Double smoothing.** Lenis `lerp .085` smooths scroll, then the camera does `position.lerp(pos, 1-exp(-3.6·dt))`. That stacks about 0.3 s plus about 0.28 s time constants: a laggy, floaty response. Also, **exponential smoothing has no ease-in**. Velocity jumps on the first frame after input, so a wheel flick gives a lurch followed by a long tail.
2. **Position and look target are smoothed independently.** When the target moves fast relative to the camera, the view swings.
3. **CatmullRom is sampled in index space.** `u = (j + local)/(n-1)` with `getPoint`. Segments of different lengths get different speeds, so speed changes at each waypoint inside one eased travel run.
4. The **lens shift** exists only to dodge the cards. Once the cards are gone it becomes a composition tool: keep a mild shift if wanted, and feed it into the slots.
5. Holds drift linearly from `pos`→`pos2` (Ken Burns). That is good: keep it.

### 4.2 Recommended pattern: scroll-scrubbed path, spring follower, snapped holds

- **Keep scroll-scrubbing** (progress → pose). It is reversible, accessible and matches the DOM spine.
  - A GSAP timeline per segment is no better here, because the path is measured from the DOM.
  - Pure time-based "next chapter" transitions (fullpage-style) break native scroll, keyboard and screen-reader navigation.
- **Follower: critically damped spring** (Unity SmoothDamp) in place of the exponential lerp. It has continuous velocity, so it eases in and out:

```ts
import { damp3 } from 'maath/easing'   // maath 0.10.8 is installed via drei; declare it as a direct dependency
// in useFrame, replacing cam.position.lerp(pos,k) / look.current.lerp(target,k)
const st = reduced ? 0.0001 : 0.26            // seconds to ~reach target; one stage of smoothing only
damp3(cam.position, pos, st, dt)
damp3(look.current, target, st * 1.15, dt)    // look slightly lazier → no swing
cam.lookAt(look.current)
```

- **Lower Lenis smoothing** so there is just one main smoothing stage: Lenis `lerp: 0.12` (wheel) plus the spring above.
- **Holds plus Lenis Snap.** Snap to the centre of each measured hold:

```ts
import Snap from 'lenis/snap'                 // shipped inside lenis 1.3.x, ~2 KB gz
const snap = new Snap(lenis, { type: 'proximity', distanceThreshold: '30%', duration: 1.1,
  easing: (t) => 1 - Math.pow(1 - t, 4), debounce: 260 })
let removers: (() => void)[] = []
function syncSnaps() {               // call at the end of measure()
  removers.forEach((r) => r()); removers = []
  const max = document.documentElement.scrollHeight - innerHeight
  journey.stops.forEach(({ start, end }) => removers.push(snap.add(((start + end) / 2) * max)))
}
```

  Use `proximity`, not `mandatory`, so long travel still scrolls freely. Stop the snap in Play Mode and while the modal is open.
- **Arc-length inside travel runs.** Precompute cumulative lengths of `posCurve` (`getLengths(400)`). Map the eased run fraction to distance, then distance to `u` with `curve.getUtoTmapping(0, distance)`. Speed is then smooth across waypoints.
- **Easing per run.**
  - `easeInOutCubic` is fine. A longer settle feels more premium: `CustomEase.create('cam', '0.65,0,0.2,1')`. GSAP 3.15 includes CustomEase (free) at `gsap/CustomEase`.
  - Arrival holds should feel like `expo.out` (fast approach, long settle). Snap easing `1-(1-t)^4` gives that.
  - portfolio3's house ease `0.22,1,0.36,1` is right for UI and text reveals, not for long flights.
- **Mobile resize jitter:** `ScrollTrigger.config({ ignoreMobileResize: true })`. Otherwise the address bar showing or hiding re-measures the stops and the camera jumps.

### 4.3 Focus / inspect state (click a building, the desk or the rocket)

Prefer **pose blending inside the existing JourneyCamera** over mounting `CameraControls` next to it. Two controllers writing the same camera is the classic source of jitter.

```ts
// store: inspect: { pos: V3; target: V3; id: string } | null ; live.inspectW: number (0..1)
// enter: lenis.stop(); snap.stop(); gsap.to(live, { inspectW: 1, duration: 1.4, ease: 'expo.inOut' })
// exit (Esc / back / scroll attempt): gsap.to(live, { inspectW: 0, duration: 1.1, ease: 'power3.inOut', onComplete: () => { lenis.start(); snap.start() } })
// in useFrame, after sampleCamera(...)
if (live.inspectW > 0 && inspect) {
  const w = live.inspectW
  pos.lerp(tmpA.set(...inspect.pos), w)
  target.lerp(tmpB.set(...inspect.target), w)
  // small, springy orbit under the pointer while inspecting (±12° yaw, ±6° pitch), not free orbit
}
```

- **Compute the inspect pose from the object's bounds, not hand-tuned numbers.** For a screen of width `w` and height `h` that must fill `fill` (e.g. 0.8) of the view:
  - `dist = max(h / (2·tan(vfov/2)), w / (2·tan(hfov/2)·aspect…)) / fill`
  - This is what camera-controls' `fitToBox(box, true, {paddingLeft…})` does. It keeps portrait phones framed correctly.
- **If full orbit is ever needed,** mount drei `<CameraControls makeDefault>` only while inspecting:
  - Start it from the current pose with `setLookAt(…cur, false)`.
  - Then either tween `t` with GSAP into `lerpLookAt(cur6, insp6, t, false)` to get designed easing (its native transitions are springs with `smoothTime`, default .25), or call `setLookAt(…insp, true)` with `smoothTime = .6`.
  - Limit `minAzimuthAngle`/`maxAzimuthAngle`/`minPolarAngle` and disable dolly.
- Henry Heffernan's monitor zoom is the reference feel. His `Camera.ts` uses TWEEN `Quintic.InOut` for keyframe moves, `BezierEasing(0.13, 0.99, 0, 1)` for the zoom into the monitor, and `Exponential.Out` (2.5 s) back to idle.

### 4.4 Premium micro-motion (cheap, big impact)

- **FOV breathing:** `fov = baseFov + clamp(live.velocity,0,1) * 4`, springed. It widens slightly during fast travel and settles at holds. Call `updateProjectionMatrix()` only when the change is > 0.01.
- **Bank on curves:** roll = `-clamp(lateralAccel)*0.05 rad`, springed. Set `cam.up` or rotate around the forward axis after `lookAt`. Drone feel.
- **Pointer parallax:** already present. Under 0.9 world units is right. Disable while inspecting and under reduced motion (already handled).
- **Hold drift:** keep `pos→pos2` (Ken Burns) and make it slightly eased (`smoothstep`) instead of linear.

### 4.5 Takeoff

Already a 3.4 s time-based rise. Make the hero text reveal **chained** to it, so it starts when the rise is about 70% done, instead of being visible from frame 0.

### 4.6 Rack focus

The tilt-shift is the miniature look during flights. At a hold it blurs text in the upper and lower bands. Fix:

```ts
// Effects.tsx — keep a ref to TiltShift2 and drive its blur uniform
tilt.current.blur = lerp(0.09, 0.0, holdWeight)   // holdWeight 0..1 from the active stop phase
```

The effect is a cinematic focus pull on arrival. It also stops TiltShift blur from muddying the screenshots.

### 4.7 Reduced motion

- Replace flights with **cuts**. When `stopIndex` changes, fade a full-screen quad (or the canvas opacity) to the sky colour over 180 ms, jump the camera to the new stop pose, and fade back.
- No FOV breathing, bank or parallax.
- Text uses opacity fades only, with no glyph motion.
- Lenis is already disabled.

---

## 5. Revealing text in sync with the camera

### 5.1 One phase function drives everything

```ts
// src/systems/phase.ts
export type Phase = 'before' | 'arriving' | 'holding' | 'leaving' | 'after'
export function stopPhase(id: string, p = live.progress, lead = 0.02) {
  const r = journey.stops.get(id); if (!r) return { phase: 'before' as Phase, t: 0, hold: 0 }
  if (p < r.start - lead) return { phase: 'before' as Phase, t: 0, hold: 0 }
  if (p < r.start) return { phase: 'arriving' as Phase, t: invLerp(r.start - lead, r.start, p), hold: 0 }
  if (p <= r.end) return { phase: 'holding' as Phase, t: invLerp(r.start, r.end, p), hold: 1 }
  if (p < r.end + lead) return { phase: 'leaving' as Phase, t: invLerp(r.end, r.end + lead, p), hold: 0 }
  return { phase: 'after' as Phase, t: 1, hold: 0 }
}
```

### 5.2 Triggered for titles, scrubbed for story text

- **Titles, kickers, chips, CTAs: triggered.**
  - On entering `holding` and when `|live.velocity| < 0.25` (the visitor is not flying past), play `gsap.to(uReveal, { value: 1, duration: 1.1, ease: 'em' })`, where `em` = CustomEase `0.22,1,0.36,1`.
  - On `leaving`, run a fast exit: 0.45 s, `power2.in`, rising up and fading.
  - Timed reveals feel consistent whether the visitor scrolls slowly or quickly. That is the "premium" quality. Scrubbed headline glyphs look mechanical.
- **Story paragraphs ("scrub text"): scrubbed.** Words light from 0.16 to 1 opacity with `t` (portfolio3 signature #5), using the same shader with an `uScrub` uniform and a step instead of a rise.
- **Stagger order** comes from glyph position, so multi-line blocks reveal left-to-right and top-to-bottom: `order = colK·0.75 + lineK·0.25`. Use about 28 ms per char-equivalent for display (`spread ≈ .25`) to match portfolio3.

### 5.3 GPU per-glyph reveal for troika (VERIFIED)

This works because troika's derived material calls the **base material's `onBeforeCompile` first** (`troika-three-utils/src/DerivedMaterial.js` line 114) and declares `aTroikaGlyphBounds` and `uTroikaTotalBounds` in the vertex shader. Code injected at `#include <begin_vertex>` therefore sees the already-positioned glyph quad. **Do not use `aTroikaGlyphIndex` for ordering**: it holds the *atlas* index, not reading order.

```ts
// src/scenes/text/glyphReveal.ts
import { MeshBasicMaterial, type IUniform, type ColorRepresentation } from 'three'

export function glyphRevealMaterial(u: { uReveal: IUniform<number> }, color: ColorRepresentation, o = { rise: 0.6, spread: 0.25, scaleFrom: 0.55 }) {
  const m = new MeshBasicMaterial({ color, transparent: true, depthWrite: false })
  m.onBeforeCompile = (s) => {
    s.uniforms.uReveal = u.uReveal
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uReveal;\nvarying float vReveal;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec2 gC = (aTroikaGlyphBounds.xy + aTroikaGlyphBounds.zw) * 0.5;
        vec4 tb = uTroikaTotalBounds;
        float lineK = (tb.w - gC.y) / max(1e-4, tb.w - tb.y);
        float colK  = (gC.x - tb.x) / max(1e-4, tb.z - tb.x);
        float order = clamp(colK * 0.75 + lineK * 0.25, 0.0, 1.0);
        float t = clamp((uReveal * (1.0 + ${o.spread.toFixed(3)}) - order) / ${o.spread.toFixed(3)}, 0.0, 1.0);
        t = 1.0 - pow(1.0 - t, 3.0);
        float gh = aTroikaGlyphBounds.w - aTroikaGlyphBounds.y;
        transformed.y -= (1.0 - t) * ${o.rise.toFixed(3)} * max(gh, 0.3);
        transformed.xy = mix(gC, transformed.xy, mix(${o.scaleFrom.toFixed(3)}, 1.0, t));
        vReveal = t;`)
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vReveal;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.a *= vReveal;')
  }
  m.customProgramCacheKey = () => 'glyph-reveal-v1'
  return m
}
```

```tsx
const u = useMemo(() => ({ uReveal: { value: 0 } }), [])
const mat = useMemo(() => glyphRevealMaterial(u, '#f2eee6'), [u])
<Text font={FONTS.display} material={mat} fontSize={size} lineHeight={0.84} letterSpacing={-0.058}
      colorRanges={{ 0: '#f2eee6', 9: '#ff4a2e' }} anchorX="left" anchorY="top">{'Md. Emon\nMiah.'}</Text>
// reveal: gsap.to(u.uReveal, { value: 1, duration: 1.1, ease: 'em' })
```

- The program is shared by every block with the same cache key: one compile.
- One uniform per block, no re-sync, no CPU work per frame.
- The same base works for a lit `MeshStandardMaterial` (signboards that receive light). Inject at the same chunks.
- **Gotcha (VERIFIED):** when `colorRanges` is set without key `0`, glyphs before the first key render **black**. Always include `0:`.

### 5.4 Masked line rise-in with `clipRect` (VERIFIED)

Use one `<Text>` per line. The line sits in a group whose y=0 is the mask line. Move the text down by `rise` and set `clipRect = [-1e3, rise, 1e3, 1e3]` (text-local coordinates). As `rise → 0` the letters emerge from the mask line. This exactly matches portfolio3's "chars rise 112%→0 inside overflow masks". `clipRect` changes are uniform-only (`uTroikaClipRect`), so they are cheap every frame.

### 5.5 Other reveal and "alive" tricks

- **Scramble / decode** (Igloo Inc does this with SDF offsets): swap characters in the `text` prop at 30–40 ms ticks for mono eyebrows. Each change is a worker re-layout, so it suits short strings only.
- **Slot-machine rotating words** (portfolio3 #12): 2 lines in a `clipRect` window, swap `text` while hidden.
- **Underline or laser sweep:** a thin quad whose `scale.x` follows `uReveal`.
- **Exit:** rise up and fade (`uReveal` from 1 to 0 with a mirrored order), or dissolve with noise in the fragment.

---

## 6. Project screenshots in the world

### 6.1 Options

| Option | Look | Cost | Use |
|---|---|---|---|
| **Texture on the existing building screen planes** (`ProjectsDistrict.tsx` `screenMat`) | Billboard or monitor | 1 texture per shot | **Default.** Swap the procedural `drawDemo` canvas for real screenshots, and keep `drawDemo` as a fallback "live" shimmer layer. |
| drei `Image` (`radius`, `zoom`, `grayscale`) | Floating frames, gallery wall | 1 draw call each | Photo frame in the About room; "3 shots fan out" on inspect. |
| Custom screen shader | Rounded corners, scanline or reflection layers, crossfade between 2 maps, auto-scroll of tall captures (`uv.y += t`) | 1 draw call | Hero screens. Henry Heffernan layers additive smudge or reflection textures over his screen for realism (`MonitorScreen.ts`: additive layers at .12/.5/.1 opacity). |
| `RenderTexture` | A live mini R3F scene on the screen | Full extra render while live | Only for 1 special screen; use `frames={1}` when static. |
| `MeshPortalMaterial` | A "window" into a project world with parallax | Extra scene render each frame; SDF stall when `blur` is set | One hero "portal" at most, on desktop high tier only. |
| `Html transform occlude="blending"` / CSS3D iframe | Real interactive DOM on a 3D monitor (Henry's OS) | DOM compositing. Hole-punch needs canvas alpha to survive the composer (Bloom and mip blur can bleed into the hole). Transform mode ignores view offset. | **Not for the journey.** If ever used (e.g. an interactive terminal on the desk monitor), remove the lens shift and test with the composer first. A canvas-texture terminal with a hidden `<input>` is the safer route. |

### 6.2 Texture budget

- portfolio3 shots are mostly 1280×853, with San Uni at 1600×1111 and the GKEC hero at 2978×1408. One 1280×853 RGBA8 texture with mipmaps is about **5.8 MB GPU**. At 1024×683 it is about **3.7 MB**.
- 4 hero projects × 3 shots ≈ 45 MB at 1024 px. That is fine on desktop. On low tier, load only the active and next project and `useTexture.clear` the rest.
- Settings: `colorSpace = SRGBColorSpace`, `anisotropy = min(8, gl.capabilities.getMaxAnisotropy())` (screens are viewed at an angle in flights), keep mipmaps.
- Preload the next chapter's textures on idle: `useTexture.preload` when `chapter` is one before. `useTexture` already calls `gl.initTexture`, so the upload does not hitch at reveal.
- KTX2 (ETC1S/UASTC, as Bruno Simon uses) cuts GPU memory 4–8×, but adds the basis transcoder (wasm about 200 KB). Optional, only if low-tier memory becomes a problem.
- Screens are emissive "displays". ACES makes them slightly duller, so keep the existing `color(1.15,…)` boost or a small saturation lift in the screen shader. Do not chase pixel-exact colour in-world. The case-study view shows exact colours.

### 6.3 Screen shader sketch (rounded corners plus crossfade plus de-zoom)

```glsl
// fragment (MeshBasicMaterial onBeforeCompile or ShaderMaterial; toneMapped stays default)
uniform sampler2D uA, uB; uniform float uMix, uZoom, uRadius, uAspect, uReveal;
vec2 z = (vUv - 0.5) / uZoom + 0.5;                          // de-zoom 1.25 → 1 on reveal
vec4 c = mix(texture2D(uA, z), texture2D(uB, z), smoothstep(0.0, 1.0, uMix));
vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0); vec2 b = vec2(uAspect, 1.0) * 0.5 - uRadius;
float d = length(max(abs(p) - b, 0.0)) - uRadius;           // rounded-rect SDF
float a = 1.0 - smoothstep(0.0, fwidth(d) * 1.5, d);
a *= smoothstep(0.0, 0.08, uReveal - (1.0 - vUv.y));        // wipe-down reveal synced to the stop
gl_FragColor = vec4(c.rgb, a);
```

Drive `uMix` with a 3.5 s slideshow timer while holding, `uZoom` with `gsap.to(…, 1, 1.8, 'em')` on arrival, and `uReveal` with the phase.

### 6.4 "Open case study": screen-to-DOM handoff (hide the seam)

1. Click the screen or the 3D CTA. The camera inspect blend frames the screen (§4.3).
2. When `inspectW > 0.85`, project the screen plane's 4 corners with `Vector3.project(camera)`, convert to CSS px, and take the bounding rect.
3. Mount the case-study sheet (the existing `ProjectModal`) with the same screenshot as its hero image and `clip-path: inset(top right bottom left round 12px)` equal to that rect. Animate to `inset(0)` over 0.9 s `expo.inOut`. The 3D screen appears to expand into the page.
4. Close reverses: clip back to the projected rect, then blend the camera back.

The DOM is right here: long reading, links, focus trap, find-in-page, a real `<form>` in ContactTerminal. It appears only on request, so the journey itself stays card-free.

---

## 7. Accessibility while the visuals are in 3D

1. **Keep the DOM spine.** `Journey.tsx` keeps rendering every `[data-stop]` panel with full semantic content (h1/h2, lists, links, buttons) in the same order. It still drives scroll length and `measure()`. Panels become visually hidden but stay in layout, so the heights still produce scroll distance:
   - Each panel keeps its height (spacer).
   - Its content block uses an `.sr-only`-style clip, except when focused (`.sr-only-focusable`, see below).
   - **Do not use `display:none` or `aria-hidden`.**
2. **Focus mirroring.** On `focusin` inside a panel:
   - Call `scrollToStop(panel.dataset.stop)`.
   - Set `store.focus3d = element.dataset.target`. The matching 3D button or label shows a visible focus ring: an accent outline quad plus a slight lift.
   - Enter or Space on the DOM button runs the same action as clicking the mesh. The canvas stays `aria-hidden` (it already is).
   - Optionally reveal the focused DOM control as a small visible chip at the bottom (`:focus-visible`) for sighted keyboard users. This is the only DOM that appears, and only on keyboard focus.
3. **Live captions.** One `aria-live="polite"` region (visually hidden) is updated when the active stop changes, debounced 400 ms. Example: "Projects, 1 of 4: San Uni Academy. Fintech LMS. Press Enter to open the case study." Never announce during fast flights (velocity gate).
4. **Reduced motion.** See §4.7. Also no slideshow autoplay (manual arrows), and no `Float` bobbing.
5. **Contrast and zoom.**
   - `prefers-contrast: more` forces backplates and outlines on every text block.
   - Text sized from CSS px (§2.2) follows browser zoom.
   - Add a "Text size" toggle (1× / 1.25× / 1.5× multiplier on `targetPx`) in the nav overflow menu.
6. **Captions mode / 2D mode.** A nav toggle "Show text panel" brings back a minimal **bottom caption bar** (not the old card) for visitors who cannot read in-world text. `FlatSite` (2D) stays the full alternative, the WebGL-crash fallback (`SceneBoundary`), and the "Skip to content" target. All three already exist or are cheap.
7. **Hover-only info.** About tooltips must also work by tap and focus (already pinnable). 3D buttons need `≥ 44×44 CSS px` hit areas: use invisible larger hit meshes, or `meshBounds` for cheap raycasts.
8. **SEO and no-JS.** The real text stays in the DOM (spine plus FlatSite), so it is crawlable. Nothing important exists only in WebGL.
9. **Do not adopt `@react-three/a11y`.** Last release 3.0.0 was 2022-05-15, it depends on zustand ^3 and was never updated for R3F 9 / React 19. The DOM spine above does the same job without the dependency.

---

## 8. Mobile strategies

- **Framing.**
  - Compute stop poses from subject bounds and aspect ratio (fit-to-sphere: `d = r / sin(min(vfov,hfov)/2)`). This replaces the crude `1 + (1/aspect-1)*0.42` pull-back.
  - Portrait composition: text slot in the top band, subject in the lower half (slots §3.2).
  - FOV stays 58 on portrait (existing).
- **Less text per stop:** title, tagline, 3 chips, 1 CTA. Everything else goes in the case-study sheet. Body text in-world only if ≥ 15 CSS px.
- **Input.**
  - Taps, not hovers.
  - Use `onClick` with the existing `e.delta > 8` drag guard.
  - Hit areas ≥ 44 px (invisible planes).
  - No pinch or orbit in the journey. Inspect-mode orbit only with a deliberate drag.
- **Scroll.**
  - Lenis touch (native momentum) plus `Snap` `proximity`.
  - `ScrollTrigger.config({ ignoreMobileResize: true })`.
  - Use `100svh` units for spacer panels so the address bar does not change the stops.
  - Re-run `measure()` plus slots on `orientationchange`.
- **Performance budget (low tier).**
  - Existing measures: DPR ≤ 1.25, no shadows, no TiltShift.
  - Text: `visible=false` outside the active chapter. Each `<Text>` is 1 draw call, so keep under 40 visible.
  - Textures: 1024 px max, active plus next project only.
  - No `RenderTexture` or `MeshPortalMaterial`. Canvas textures redraw at ≤ 15 fps and only when on screen (the existing 24 fps distance gate becomes a visibility gate).
- **Fonts:** about 74 KB gz for 3 faces, preloaded during the loader through troika `preloadFont` with the Latin charset. Subsetting Inter to Basic Latin plus punctuation roughly halves it (`pyftsubset … --unicodes=U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+00B7`).
- **Shader compile hitch:** `gl.compile` only walks **visible** objects (verified `traverseVisible` in three r186 `WebGLRenderer.compile`). Mount all text with `fillOpacity 0` and visible during `SceneReady`, or call `gl.compileAsync`, so the first reveal does not stall.

---

## 9. Precedents and what to take from each

| Site | Technique (sourced) | Take for this project |
|---|---|---|
| **Bruno Simon** (2026 rebuild, Awwwards case study) | "Avoid traditional HTML UI as much as possible." Recreates clicks, scroll, keyboard and touch in 3D. Labels are world-anchored: leaderboard by the start line, counters above the cookie oven. Instancing, KTX2 ETC1S/UASTC, Draco, an automatic low preset on mobile (no DoF, smaller shadow maps). | Diegetic carriers for every piece of text. Physical hero letters for Play Mode. Low-tier preset discipline. |
| **Henry Heffernan** (`henryjeff/portfolio-website`, `MonitorScreen.ts` / `Camera.ts`) | CSS3D iframe of his OS **behind** the WebGL canvas. An `opacity:0` `NoBlending` GL plane punches the hole so 3D occludes the DOM. Additive smudge and reflection texture layers over the screen. Keyframed camera with TWEEN `Quintic.InOut`, `BezierEasing(0.13,0.99,0,1)` for the monitor zoom, `Exponential.Out` back. | Inspect "zoom into the screen" feel and eases; screen realism layers. The DOM-on-screen idea becomes our screen-to-DOM handoff, which is safer with our composer. |
| **Igloo Inc** (Awwwards Developer Site of the Year 2024, Bureaux) | UI built in **WebGL**: SDF text, scramble by offsetting the SDF texture, glitch in a shader because DOM clip and mask is heavier. Shader compile and texture loading are staged at start and in the background. | Validates all-WebGL UI as premium. SDF scramble for mono eyebrows. Staged compiles. |
| **Jesse Zhou** (ramen shop) | All in-scene text is graphics, `.ktx2` textures on in-world signs and screens. The camera moves between fixed views. | Canvas or pre-rendered textures for special type (Bengali, signage art). Fixed, designed views = our holds. |
| **Codrops "Cinematic 3D scroll experiences with GSAP"** (Nov 2025) | GSAP as "director": ScrollTrigger plus SplitText orchestrate camera moves and text beats over a fixed canvas. | The beats idea: one progress drives camera, text and env. Our text beats are in WebGL instead of SplitText DOM. |

---

## 10. Packages

| Package | Status | Size (measured: rolldown, minified, three/react external, gzip -9) | Action |
|---|---|---|---|
| `troika-three-text` 0.52.5 | Transitive via drei, **not in the current build** (no `<Text>` used yet) | 115 KB min / **41.5 KB gz**, plus a worker blob | Add as a direct dependency (`^0.52.4`, same as drei) for `preloadFont`. |
| `maath` 0.10.8 (`maath/easing`) | Transitive via drei | 2.8 KB min / **1.1 KB gz** | Add as a direct dependency. |
| `lenis/snap` | Inside the installed lenis 1.3.27 | 5.8 KB min / **2.0 KB gz** | Use. |
| `gsap/CustomEase`, `gsap/SplitText` | Inside gsap 3.15 (free) | small | CustomEase for `em` and `cam` eases. SplitText only for DOM fallbacks. |
| `camera-controls` 3.1.2 (drei `CameraControls`) | Transitive | 44.7 KB min / **10.2 KB gz** | Optional (inspect with full orbit). Pose blending needs none. |
| `three-msdf-text-utils` 1.5.0 | n/a | 29.6 KB min / 10.7 KB gz, plus offline atlas per font | Skip. troika is better here: runtime glyphs, kerning, wrapping. |
| `@react-three/uikit` 1.0.77 | n/a | 686 KB min / **377 KB gz** (yoga-layout, msdf generator, zod 4) | **Avoid.** |
| `@react-three/a11y` 3.0.0 | Last published 2022-05-15, zustand ^3 | 274 KB unpacked | **Avoid.** |
| `@theatre/r3f` 0.7.x | No release since 2023 | n/a | **Avoid.** |
| facetype.js (offline) | Tool, not a runtime dependency | JSON subset about 10 KB | Only if the Text3D hero is chosen. |

Current build for reference (gzip): three/r3f/drei/postprocessing chunk `geometry-*.js` 243 KB, `Experience-*.js` 48 KB, `index-*.js` 125 KB, `PlayMode-*.js` 847 KB (lazy, Rapier). The text stack adds about 45 KB gz of JS plus about 74 KB of fonts.

---

## 11. Gotchas checklist (verified in this session)

1. **Mislabelled fonts.** `scratchpad/fontprobe/*.ttf` are WOFF2 (`wOF2` magic), because fontTools' instancer keeps the input flavour. troika fails with "woff2 fonts not supported". Fix: `f = TTFont(p); f.flavor = None; f.save(out)` (`scratchpad/tools/real-ttf.py`). Real files are in `scratchpad/fontreal/`. Always check the first 4 bytes are `00 01 00 00` (or `OTTO`).
2. **`colorRanges` needs key 0**, or the preceding glyphs render black.
3. **drei `Html transform` ignores `setViewOffset`.** It misaligns while the lens shift is on.
4. **drei `<Text>` suspends at mount** (`suspend(preloadFont)`). A Text mounted later, without a local `<Suspense>`, suspends the whole R3F Canvas tree, which blanks the scene. Wrap each chapter in `<Suspense fallback={null}>`, preload fonts during the loader, and don't pass per-instance `characters` (that creates a new suspend key).
5. **No stencil.** The Canvas uses `stencil:false` and the composer has no stencil buffer, so drei `<Mask>` will not work. Use `clipRect` or shader masks.
6. **TiltShift2 blurs the top and bottom bands.** Rack-focus to 0 at holds.
7. **Bloom threshold .82.** Cream text glows; keep body luminance about .75.
8. **troika has no Indic shaping** (ya-phala, reph, pre-base matra reordering). Use canvas for Bengali.
9. **`gl.compile` only compiles visible objects.** Keep text visible at opacity 0 during `SceneReady`.
10. **troika defaults to `DoubleSide` + `transparent`.** Set `FrontSide`, `depthWrite:false` and a `renderOrder` for world text.
11. **Hud `renderPriority` must be ≥ 2** with `EffectComposer` (priority 1). At 1, Hud renders the default scene itself.
12. **`aTroikaGlyphIndex` is an atlas index**, not reading order. Order glyphs by `aTroikaGlyphBounds`.
13. **postprocessing override materials.** If DepthOfField, N8AO or a NormalPass is ever added, set `OverrideMaterialManager.workaroundEnabled = true` (troika README). The current stack does not need it.

---

## 12. Suggested build order for the next stage

1. **Fonts and loader.**
   - Put real TTF/WOFF files in `public/fonts`.
   - Add `src/scenes/text/fonts.ts` with `FONTS` and `preloadFonts()`.
   - Wire it into the loader progress and `SceneReady`.
2. **Text kit.**
   - `WorldText` (brand presets, px sizing, day/night colour, FrontSide, renderOrder).
   - `glyphRevealMaterial`.
   - `useStopPhase`.
   - `placeSlot`.
   - A rounded-rect SDF backplate.
3. **Camera.**
   - Spring follower.
   - Snap.
   - Arc-length runs.
   - Rack focus.
   - FOV breathing.
   - Reduced-motion cuts.
   - Pose-blend inspect.
4. **Journey DOM to spine.** Hide the cards visually (sr-only content, spacer heights kept), plus the aria-live captions and focus mirroring. Remove or retune the lens shift.
5. **Chapter by chapter.**
   - Intro: sky name, kicker, CTAs.
   - Projects: real screenshots on screens, signboards, 3D CTA, inspect, screen-to-DOM case study.
   - Skills: ring text and node tags.
   - About: chalkboard, photo frame, canvas terminal.
   - Finale: gantry banner, contact screen to ContactTerminal.
6. **Mobile pass.** Slots, framing, hit areas, budgets. Then a **Playwright pass**: re-shoot every stop at 1280×720 and 390×844 with the existing tools and pixel-check text legibility and contrast.

---

## Sources

- drei and troika sources read locally: `node_modules/@react-three/drei/core/{Text,Hud,RenderTexture,MeshPortalMaterial,ScreenSizer,Texture}.js`, `web/Html.js`, `troika-three-text/{README.md,src/Text.js,src/GlyphsGeometry.js,src/TextDerivedMaterial.js}`, `troika-three-utils/src/DerivedMaterial.js`, `camera-controls/dist/index.d.ts`, `lenis/dist/lenis-snap.d.ts`, `@react-three/postprocessing/dist/index.js`, `three/src/renderers/WebGLRenderer.js`.
- [Bruno Simon portfolio case study (Awwwards)](https://www.awwwards.com/brunos-portfolio-case-study.html)
- [Meet the speakers of the first Three.js Conference (Codrops)](https://tympanus.net/codrops/2026/07/16/meet-the-speakers-of-the-first-three-js-conference/)
- [Henry Heffernan portfolio repo](https://github.com/henryjeff/portfolio-website); raw `src/Application/World/MonitorScreen.ts` and `src/Application/Camera/Camera.ts` read via raw.githubusercontent.com
- [Igloo Inc case study (Awwwards)](https://www.awwwards.com/igloo-inc-case-study.html); [Awwwards WebGL collection listing the SOTY 2024](https://www.awwwards.com/du-haihang/collections/webgl-animations/)
- [Jesse Zhou ramen shop (Codrops Collective #701)](https://tympanus.net/codrops/collective/collective-701/); [Medium write-up noting the text is KTX2 graphics](https://medium.com/@harshadwani/quickly-create-a-3-d-interactive-responsive-portfolio-website-c1c6ef6c715d)
- [How to Build Cinematic 3D Scroll Experiences with GSAP (Codrops, Nov 2025)](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/)
- [drei MeshPortalMaterial docs](https://drei.docs.pmnd.rs/portals/mesh-portal-material); [drei Html docs](https://drei.docs.pmnd.rs/misc/html)
- [three.js forum: iframe on laptop screen / CSS3D occlusion](https://discourse.threejs.org/t/i-have-laptop-model-and-i-try-to-apply-iframe-into-the-screen-how-do-i-do-it/68690)
- [@theatre/r3f on npm](https://npmjs.com/package/@theatre/r3f); [Snyk maintenance status for theatre](https://security.snyk.io/package/npm/theatre)
- [R3F v9 migration guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)
- npm registry (`npm view`) for `@react-three/a11y`, `@react-three/uikit`, `@pmndrs/uikit`, `three-msdf-text-utils`. Bundle sizes were measured locally with rolldown (`scratchpad/sizes`).
