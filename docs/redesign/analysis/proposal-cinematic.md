# Proposal: "Director's Cut", the island as a 10-shot film

Angle: **cinematic**. The scroll is edited like a film: deliberate shots, holds and transitions. Content is boxless typography composed into each frame, plus diegetic text on objects in the world. A click or tap on a subject starts an **inspect** move: the camera flies to that object and its details appear in the world.

Inputs used:
- `analysis/content.md` and `content.json` (real portfolio3 content)
- `analysis/design-language.md` (brand and motion)
- `analysis/overlay-audit.md` (what is wrong today, with measurements)
- `analysis/3d-presentation-research.md` (verified techniques)
- the current source in `/home/user/city-3d-portfolio/src`

New measurement for this proposal: the current draw calls per stop, taken from the `?debug` readout on the preview build (high tier, 1440x900, script `scratchpad/tools/drawcalls.cjs`):

| stop | start | p0 | p1 | p2 | p3 | skills | about | finale |
|---|---|---|---|---|---|---|---|---|
| calls | 138 | 139 | 125 | 124 | 131 | 88 | 103 | 163 |
| tris | 69.2k | 68.8k | 65.3k | 64.9k | 68.3k | 61.4k | 62.1k | 72.4k |

---

## 0. TL;DR

1. **Delete every glass box from the journey.** That means:
   - the left content card;
   - the About tooltips and the About list;
   - the skill pills and the meter list;
   - the centre nav pill and the right progress rail;
   - the glass modal.

   Nothing frosted or translucent stays on top of the canvas.
2. **Each stop becomes a "shot".** The camera parks on a subject, and **when the camera has actually settled**, a short, boxless title composition rises into the empty part of the frame:
   - a mono eyebrow;
   - a Funnel Display title with an accent word and a closing period;
   - one line of copy;
   - 2 or 3 big metrics;
   - one or two 3D pill CTAs.

   It leaves fast and upward when the camera departs. **No words are shown in flight.** Travel is pure camera work plus world events ("B-roll").
3. **Details live in the world, on request.** Clicking a building, an object, a skill branch or the launch terminal starts **inspect**: the camera flies to that object, framed from its bounds, and the details appear in place:
   - screenshot gallery on the building screen;
   - problem / built / result lines;
   - stack chips;
   - code snippet on a circuit chip;
   - object captions.

   Long reading (the full case study) and the contact form open as DOM **only when asked**. They animate out of the projected 3D screen rectangle, so there is no seam.
4. **Real content from portfolio3:**
   - Md. Emon Miah, Full-Stack Software Engineer, Dhaka.
   - 4 featured buildings: San Uni Academy, Dent-Assist AI, Hasibul Gaming Point, Esports Arena (GKEC + BOE merged).
   - 3 secondary island props: Bismillah Agro terraces, Quran pavilion, Chit-Chat radio mast.
   - 5 stack branches, with node size = how many projects used the tool.
   - All 8 services, revealed in branch inspect with their code snippets.
   - The About workshop with 7 real objects plus the portrait.
   - **Experience as a tracking shot across the bridge**, with a laser-line timeline.
   - Contact on the launch islet, with the 4 process steps as the **rocket countdown**.

   The testimonials are fictional placeholders, so they are **not used**.
5. **The camera timeline becomes data** (`src/journey/shots.ts`). It is no longer measured from DOM panels.
   - **Travel length is derived from path length**, so peak speeds are even.
   - Arc-length sampling, plus orbit arcs for the project hops.
   - Hermite easing that matches the hold drift, so there is no stop-and-surge.
   - One spring follower.
   - Lenis Snap at the hold centres.
   - Rack focus: the tilt-shift blur goes to 0 at holds.
   - A **framing solver** replaces the `setViewOffset` lens-shift hack and the portrait pull-back. Every shot is composed for 3 aspect classes from data.
6. **Shorter journey: about 12.2 viewport heights of scroll instead of 17.9**, with 10 holds instead of 8. Holds take about 55% of the scroll instead of 28%, and each project hold is 0.6 vh instead of 0.43.
7. **Brand carried over from portfolio3:**
   - warm black, cream and one vermilion accent;
   - Funnel Display mega type with masked per-glyph rises on the house ease `0.22,1,0.36,1`;
   - JetBrains Mono eyebrows with `(Label)`;
   - the terminal identity;
   - the bilingual preloader;
   - the accent + background curtain (only for long jumps);
   - the live Dhaka clock;
   - scrub text and the laser line;
   - grain;
   - zero emoji.
8. **Effort: about 24–27 focused dev days in 5 phases.** Nothing new is strictly required. Add `troika-three-text` and `maath` as direct dependencies, use `lenis/snap` (already installed), and ship baked TTFs (already produced in `scratchpad/fontreal`).

### Short summary in Banglish (for the user)
> Screen er oi 2 ta glass card (bam pasher boro content card ar About er tooltip card) puro tai remove korbo — kono frosted box thakbe na. Prottek stop ekta "shot": camera thamle tarpor boro typography (Md. Emon / Miah. style, Funnel Display, vermilion accent) scene er faka jaygay smoothly uthe ashbe, camera chole gele upore mile jabe. Camera urar shomoy kono lekha thakbe na — shudhu world animation. Building e click/tap korle camera building er screen e zoom korbe — oikhane real screenshot gallery, problem/solution/result, stack — sob 3D tei. Content shob portfolio3 theke real: San Uni Academy, Dent-Assist AI, Hasibul Gaming Point, GKEC+BOE Esports Arena; skills tree te 5 group; About workshop e real 7 ta object + tomar photo; bridge er upor experience timeline; launch pad e contact — brief pathale 04-03-02-01 process countdown diye rocket urbe. Scroll 18.9 theke ~12 screen e komabo, camera movement smooth (stop-and-surge thakbe na). Mobile, accessibility (screen reader, keyboard, reduced motion, 2D mode) shob cover. 5 phase e korbo.

---

## 1. Diagnosis in one paragraph

The "2 weird cards" are **Card #1**, the big frosted navy content card (`.card` in `src/ui/Journey.tsx`), and **Card #2**, the second glass box that repeats its text. That second box is most clearly the About tooltip (`.about-tip`, a drei `<Html>`). At project stops it can also be the building's free-standing browser billboard, or the modal.

They look bad for four reasons:
1. They are 2D web UI pasted over a 3D world. They are never tone-mapped, fogged or occluded.
2. They cover 13–22% of a desktop screen and 36–51% of a phone screen, and they collide with the nav at 1366x657.
3. They move on a different clock from the camera. Cards follow scroll instantly while the camera lags and surges, so **a card is on screen during 73% of all camera travel**.
4. They say everything two or three times: chapter ×3, project ×3.

The fix is not to restyle the cards. **Remove them, and let the camera compose the content into the frame.** (Measurements: `overlay-audit.md` §2–5.)

---

## 2. The concept: rules of the cut

1. **One subject per shot.** Every hold frames one thing: the island, the district, a building, the tree, the room, the bridge, the rocket.
2. **Type is composed, not boxed.** Text sits in the negative space of the frame (sky, a plain wall, open water), chosen per shot by the framing data. No rectangles, no blur, no glass. Legibility comes from:
   - placing text on sky;
   - theme-aware ink (cream at dawn and night, near-black ink in day);
   - a feathered "legibility pocket", a radial darkening with no edges (§8.5).
3. **Words only when the camera is still.** Text is visible only inside holds. It starts revealing only after the camera has **settled** (spring residual + scroll velocity gate), so text never arrives before the camera. That was the audit's main finding.
4. **No words in flight.** Travel is camera language plus world events:
   - buildings rising;
   - the EMON. sign chase-lighting;
   - screens receding;
   - paper-plane drones;
   - the sun moving;
   - the tilt-shift "miniature" blur.
5. **Even pacing.** Travel scroll length is proportional to path length, so every move has a similar peak speed. Moves are C1-continuous with the hold drift: no zero-velocity kinks, no lurches.
6. **Progressive disclosure.** In the shot: about 25 words maximum. In inspect: the details, still in the world. In the case file (DOM, on request): the long read. In 2D mode: everything.
7. **Say it once.** The chapter is named once, in the shot's eyebrow index. The project is named once, by its title composition. Its screen shows the real product, not a repeat of the text.
8. **Diegetic first, editorial second.** Things that belong to the world are **Tier A** and live in the main scene, lit, fogged and occluded: screens, signposts, node tags, object captions, terminals, bridge plaques, countdown numerals. The few headline compositions are **Tier B**: exact brand colour, crisp, drawn in drei `<Hud renderPriority={2}>` after the post stack, but placed in world space so they still parallax with the camera.
9. **Discontinuity is hidden like a cut.** A long jump (palette or progress-tick more than one chapter away, entering Play, opening 2D) uses the portfolio3 accent + background curtain naming the destination. The camera teleports under it. Continuous scrolling never cuts (except under reduced motion, §12).
10. **The DOM is the script, not the picture.** Real semantic DOM is kept for screen readers, keyboard, SEO and 2D. It is generated from the same content and laid out from the same timeline, but it is visually hidden during the journey.

---

## 3. What replaces each current overlay surface

| Current surface (file) | What it becomes | Where it lives |
|---|---|---|
| **Hero block**: kicker, gradient "Emon", title, intro, 2 buttons, "Scroll to fly" (`Hero` in `Journey.tsx`, `.hero-card`) | **Shot 01 title composition**:<br>- mono eyebrow `(Full-stack software engineer)  Dhaka, Bangladesh · UTC+6`;<br>- mega `Md. Emon` / `Miah.` (accent) with a per-glyph masked rise **chained to the takeoff** (starts at 70% of the 3.4 s rise);<br>- role line `Full-stack engineer building` plus a **3D rotating-word prism** in accent;<br>- pitch line (desktop only);<br>- a **curved "SCROLL TO FLY •" ring badge** (tap to fly to Work).<br><br>The two buttons go away: Play and Contact live in the HUD, and scroll is the CTA. The voxel `EMON` sign gains an accent period block and pays off during the crane move as B-roll. | Tier B text in the sky (upper-left on desktop, top band on phones). Contrast target ≥ 4.5:1, achieved by re-keying dawn to a warm-dark upper sky plus exact-colour Hud text. |
| **Left glass card ×7** (`ProjectCard`, `SkillsCard`, `AboutCard`, `FinaleCard`, `.card`) | Per-shot **title compositions** (eyebrow, title, one line, 2–3 metrics, 3D pills) placed through **stop-anchored camera-space slots**. Their depth and parallax are real, and their frame position is set per aspect class. They reveal on settle and exit on departure. Deep content moves to **inspect**. | Tier B (headline group) + Tier A (diegetic details). |
| **Centre nav pill** "01 Takeoff … 05 Contact" (`Nav.tsx .chapters`) | **Removed.** The chapter is named once in each shot eyebrow (`02 · (Selected work)`). Navigation moves to:<br>- the **⌘K command palette** (Chapters / Projects / Actions / Elsewhere);<br>- **chapter ticks** on the progress line. | DOM HUD (minimal, transparent). |
| **Right progress rail** (`.progress-rail`) | **Removed.** Replaced by portfolio3's **2px accent progress line** along the top edge, with 6 chapter ticks. Each tick is a focusable button with an aria-label and a mono hover label on desktop. Jumps scale with distance or use the curtain. | DOM HUD. |
| **Brand "◆ Emon", sound "....", 2D, "Play 🎮" pills** | **HUD:**<br>- left: the portfolio3 **prompt-mark logo** + "Emon Miah";<br>- right: `● Dhaka 14:32` (green ping, live `Asia/Dhaka`), `⌘K`, a **recognisable speaker icon** (lucide speaker / speaker-off as inline SVG), `2D`, `Play`.<br><br>Transparent, 1px hairline pills, no blur, plus a 96px top gradient for legibility. Ink/cream colour follows the time of day. On mobile: logo, clock dot, `Menu` (opens the palette as a sheet), sound. | DOM. |
| **Skill label pills** (drei `<Html>` in `SkillsGarden.tsx`) | **Tier A SDF node tags**: `Billboard` + constant 13px screen size, **depth-tested** (the trunk occludes them), staggered and lit by the scrubbed "power-on". Group names run **curved around the platform rim**. The meter list is gone. **Node radius = number of projects that used the tool** (real data). | World. |
| **About tooltips + About list** (drei `<Html>` `.about-tip`, `AboutCard` list) | **Removed.**<br>- Each real object gets a tiny numbered tag (`01`–`07`, mono 11px) during the hold. This replaces the pulsing hint bulbs.<br>- Click, tap or keyboard focus starts **inspect**: the camera dollies to the object, and its caption appears **beside it as Tier A text on the wall or a paper tag** (Funnel title + 1–2 Inter sentences).<br>- ←/→ cycles objects.<br>- The short bio becomes **scrub text** in the shot composition. | World + Tier B. |
| **Project modal** (`ProjectModal.tsx`, `Modal.tsx`) | **Inspect mode in the world** (gallery on the screen, captions, problem/built/result, stack chips, note link, Live/Code pills). The optional **Case file** is a DOM sheet with the long description, architecture and highlights. It opens via a **screen-to-DOM clip-path handoff** from the projected screen rectangle. It is styled like portfolio3 (solid `--bg-2`, hairlines, radius 22), with no glass and no overshoot pop. | World; DOM only on request. |
| **Toasts** (`Toasts.tsx`) | The portfolio3 **toast pill** (solid, hairline, no blur, bottom-centre, 3 s). In the journey it is used only for "Email copied" and errors. Easter eggs answer **in the world** (a small SDF stamp next to the object) where possible. Shard and egg toasts stay in Play Mode. | DOM (small). |
| **Building "browser-window" billboards** (`demoScreen.ts`, the dome billboard on posts) | **Real portfolio3 screenshots** on screens integrated into each building's facade: rounded-corner shader, de-zoom reveal, crossfade slideshow. The free-standing billboard on posts is removed. The Esports Arena gets a curved LED band instead. | World. |
| **Contact terminal modal** (`ContactTerminal.tsx`) | **The launch terminal is the form.** Its 3D screen idles with `emon@dhaka: ~ $ ./brief_`. Clicking it inspects the terminal, then hands off to a terminal-styled DOM form clipped to the projected screen rectangle (3 portfolio3 steps). Sending it **runs the countdown and launches the rocket**. | World + DOM on request. |

**Net result:** during a normal scroll, the only DOM visible over the canvas is a 2px progress line, a transparent logo and a row of 5 hairline controls.

---

## 4. Chapter and shot list (scroll budget)

**Chapters (6):** 01 Takeoff · 02 Work · 03 Stack & services · 04 About · 05 Experience · 06 Contact.

| # | Shot id | Chapter | Subject | Move in (travel) | Travel vh | Hold vh | Day phase / look |
|---|---|---|---|---|---|---|---|
| 01 | `title` | Takeoff | island + rising sun | time-based takeoff out of the cloud sea (3.4 s) | (time) | 0.50 | 0.00 dawn: vermilion sun, warm-dark upper sky |
| 02 | `work` | Work | the district from above | **crane up** over the north hill; the EMON. sign chase-lights; buildings rise | 1.00 | 0.45 | 0.22 morning cream |
| 03 | `p-sua` | Work | San Uni Academy tower + video wall | **dive** to the first building | 0.50 | 0.60 | 0.28 day |
| 04 | `p-dent` | Work | Dent-Assist clinic | **orbit arc** around the district | 0.55 | 0.60 | 0.33 |
| 05 | `p-hgp` | Work | Hasibul arcade kiosk | orbit arc | 0.55 | 0.60 | 0.38 |
| 06 | `p-arena` | Work | Esports Arena | orbit arc | 0.55 | 0.60 | 0.44 |
| 07 | `stack` | Stack | circuit tree | **swoop** low across the plaza, push in | 0.80 | 0.80 | 0.55 golden hour |
| 08 | `about` | About | workshop cutaway + portrait | **lateral track** into the room | 0.60 | 0.90 | 0.68 sunset interior |
| 09 | `journey` | Experience | rope bridge | short pull-out, then a **tracking hold** across the bridge | 0.45 | 0.90 | 0.84 dusk |
| 10 | `contact` | Contact | rocket on the launch islet | **crane up** onto the islet, low hero angle | 0.50 | 0.70 | 1.00 night (#0a0908) |

**Budget:**
- Holds: 6.65 vh. Travel: 5.50 vh. **Total scroll: about 12.15 vh** (today: 17.9 vh of scroll, 18.9 vh of document).
- At 900p that is about 10,900 px, or about 120 wheel notches (today about 180). With proximity snap, each hold catches the visitor.
- Holds are 55% of the scroll (today 28%).
- Project hold: 0.6 vh (today 0.43), and **text is visible only inside it** (today a card is visible about 0.99 vh around each stop).

**Travel lengths are not hand-typed.** `travel = clamp(arcLength / U_PER_VH, 0.45, 1.2)`, with `U_PER_VH` tuned so that a project hop is about 0.55 vh. The table above is the result for the current geometry. This keeps peak speed within about 1.4x across all moves (today 46 → 178 u/vh, which is 3.9x).

The 4 → 3 → 2 → 1 rhythm of the work chapter (one establishing shot, then 4 near-identical "orbit and settle" beats) is broken up by giving each building a different arrival:
- SUA: dive.
- Dent: arc from the left, low.
- HGP: arc from the right, slightly high, catching the drones.
- Arena: a crane-down reveal over the dome rim.

---

## 5. Shot-by-shot treatment

Notation:
- **W** = wide layout (aspect ≥ 1.25).
- **S** = square (0.8–1.25).
- **T** = tall (< 0.8, phones and portrait tablets including 820x1180).
- Pixel sizes are CSS px on screen, converted to world units per slot (§8.3).
- Copy is **verbatim from portfolio3** unless marked *(new copy — owner to approve)*.

### Shot 01: Title (Takeoff)

- **Preloader (DOM):** the portfolio3 sequence.
  - Greetings: Hello. → হ্যালো. → স্বাগতম. (Bengali stays in the DOM because troika cannot shape it).
  - A `000%` counter driven by **real** load progress (`loader.set`).
  - A 3px accent bar and the caption "Booting the experience".
  - Enter / Enter with sound (no emoji), and "Skip to 2D".
  - Its curved `expo.inOut` lift **is** the first frame of the takeoff.
- **Camera:** the existing 3.4 s rise out of the cloud sea. It ends on a locked-off wide shot:
  - W: island centre at NDC (+0.30, −0.05), sun disc at about (+0.42, +0.22).
  - T: island at (0, −0.30).
- **Composition (Tier B, sky):**
  - eyebrow `(Full-stack software engineer)  Dhaka, Bangladesh · UTC+6`: JBM 12px uppercase, +0.1em, fg-3, accent parentheses.
  - mega `Md. Emon` / `Miah.`: Funnel 600, `clamp(70, min(12.2vw, 22vh), 224)` px, line height 0.84, tracking −0.058em, line 2 in accent via `colorRanges` (key 0 included).
  - role `Full-stack engineer building` + prism [`AI voice agents` · `payment-ready storefronts` · `realtime platforms` · `motion-rich interfaces`]: Inter 20px; prism faces in accent, rotating 90° in 0.9 s `expo.inOut` every 2.6 s.
  - pitch (W/S only, max 44ch, Inter 17px, fg-2): "I turn ideas into fast, secure products: Next.js and Node on the surface, PostgreSQL and MongoDB underneath, and just enough motion to make them unforgettable."
  - Curved badge `SCROLL TO FLY • SCROLL TO FLY •`: JBM, troika `curveRadius`, spinning 20 s around an arrow mesh at bottom centre. Tap or Enter flies to shot 02.
- **Choreography:**

  | element | starts at | motion |
  |---|---|---|
  | eyebrow | takeoff 0.60 | decodes (scramble, 0.5 s) |
  | name | takeoff 0.70 | glyphs rise from 112% inside a `clipRect` mask (28 ms/char, 1.1 s, `em` ease) |
  | role line | +0.25 s | words rise |
  | prism | after its first face lands | starts rotating |
  | pitch | +0.45 s | rise |
  | badge | +0.8 s | fade-scale |

- **Exit:** the first scroll input plays the exit (0.45 s, `power2.in`, upward). The badge stays until the hold ends.
- **B-roll into 02 (1.0 vh crane):**
  - The camera passes over the north hill. The voxel `EMON.` sign **chase-lights left to right** as the camera passes, and the accent period lights last.
  - The palette walks from dawn to cream morning.
  - The tilt-shift miniature blur ramps up.

### Shot 02: Work slate (establishing)

- **Camera:** high three-quarter overview of the whole island.
  - W: district arc right of centre.
  - T: district in the lower 55%.

  The 4 buildings **rise in sequence** (120 ms stagger, `easeOutBack`) during the arrival. The rise is driven by the timeline, not by DOM stops.
- **Composition (Tier B):**
  - eyebrow `02 · (Selected work)`
  - display `Products that` / `*ship* and *scale.*`
  - lead (Inter 17): "Live products across EdTech, digital commerce, AI voice, esports and offline-first apps."
- **World pins (Tier A, 13px, visible only during this hold), each clickable:**
  - `01 San Uni Academy` · `02 Dent-Assist AI` · `03 Hasibul Gaming Point` · `04 Esports Arena` on the buildings;
  - `Bismillah Agro`, `Quran Web App`, `Chit-Chat` in fg-3 on the secondary props;
  - a thin leader line to each.
- **Inspect from here:**
  - A featured pin flies straight to that project's shot.
  - A secondary pin inspects the prop: the camera frames the terraces, pavilion or mast. A small Tier A plaque shows title, subtitle, 2 metrics and Live/Code, and the prop's screen shows the best screenshot.

### Shots 03–06: the four featured projects

**Template** (the same grammar each time, a different arrival each time):
- **Arrival:** the screen "powers on" when the camera is about 85% arrived (scanline wipe, 0.4 s).
- **Settle**, then title composition:
  - eyebrow `01 / 04 · EdTech & LMS · 2025 — 2026` (accent index);
  - title (Funnel 600; W 72–88px, T 44–52px);
  - subtitle (Inter 17, max 2 lines);
  - **3 metrics** (T shows 2): value in Funnel 600 36px over a JBM 11px uppercase label, revealed as a slot roll;
  - pills `Case study` (accent fill), `Live site`, `Code` (or a `Client NDA` chip).
- **Screen (Tier A):**
  - real screenshots;
  - a 1.25 → 1 de-zoom over 1.8 s;
  - crossfade every 3.5 s while holding;
  - a JBM caption strip under the screen: `[Marketplace] Course catalog`.
- **Hold drift:** a 2–3% dolly-in on `smoothstep`, never linear.
- **Departure:** the composition exits first. The **screen recedes** (brightness 0.5, scale 0.93, scrubbed), which is portfolio3's stacked-card move done physically. The camera then arcs on.

**Inspect (per project):**
1. Click the building or screen, the `Case study` pill, or press Enter on the focused spine button.
2. `lenis.stop()` and the snap stops.
3. The camera blends to a pose **computed from the screen's bounds**: the screen fills 78% of the width on W and 92% on T. Move: 1.4 s `expo.inOut`.
4. The composition exits and the in-world details appear:
   - the **full screenshot gallery** on the screen: mesh arrows, ←/→ keys, horizontal swipe on touch, with captions from portfolio3;
   - beside it (W) or below it (T), three labelled lines `PROBLEM` / `BUILT` / `RESULT` (JBM accent labels, Inter 15px), taken from `content.json` `analysis.problem/solution/outcome`, trimmed to about 22 words each;
   - **stack chips**: SDF text on rounded SDF slabs, 6 at most, then `+N`;
   - `Read the note:` and the note title, where one exists (links to emon.pro/notes/…);
   - pills `Full case study` (DOM handoff), `Live`, `Code`, `Close (Esc)`.
5. Exit with Esc, the Close pill, the browser back button (a `history.pushState` per inspect), or any scroll attempt larger than 120px. The return is 1.1 s `power3.inOut`.
6. Inside inspect, `[` / `]` fly directly between project screens (orbit) without leaving inspect.

**Per project:**

| | 03 San Uni Academy | 04 Dent-Assist AI | 05 Hasibul Gaming Point | 06 Esports Arena (GKEC + BOE) |
|---|---|---|---|---|
| eyebrow | `01 / 04 · EdTech & LMS · 2025 — 2026` | `02 / 04 · AI & Voice · 2025` | `03 / 04 · E-commerce · 2024 — 2025` | `04 / 04 · Community · 2024 — 2025` |
| title | `San Uni *Academy.*` | `Dent-Assist *AI.*` | `Hasibul *Gaming Point.*` | `Esports *Arena.*` *(new name — owner to approve)* |
| subtitle | Multi-vendor LMS, merchandise marketplace & HLS video pipeline | Conversational AI voice booking & clinic management engine | High-traffic digital marketplace, ZiniPay gateway & Telegram bot command center | *(new copy)* GKEC Esports and BOE Gaming Club: tournaments, transfer markets and surge-proof signups. |
| metrics (T: first 2) | `HLS` adaptive video · `Stripe + SSLCommerz` split payouts · `GPT-4o-mini` AI tutor | `< 450 ms` voice latency · `Zero` double-bookings · `Prisma / PG` data layer | `10,000+` monthly users · `< 3.2 s` checkout · `< 3 s` code delivery | `2,400+` players · `500 / min` signups · `99.9%` uptime |
| pills | Case study · Live (sanuniacademy.com) · chip `Client NDA` | Case study · Live (unverified host) · Code (dent_assis) | Case study · Live · Code (game-point) | Case study · Live GKEC · Live BOE · Code ×2 |
| screen textures | sua1, sua_vendor, sua_financials (+6 in inspect) | dent_assist1, 2, 3 | game_point1, 3, 2 | **gkec3, boe2 only** (others show real footballers) |
| building (re-skin of the existing spec) | `tower` → lecture tower with a big **video wall** (screen 4.6×3.2); frame tinted violet `#6c5ce7` | `studio` → clinic with a tooth sign and a **voice-waveform ring** (20 bars on the roof, noise-driven) | `factory` → neon arcade kiosk; **paper-plane drones** leave every 3 s carrying a glowing code (the "< 3 s" story told physically) | `dome` → stadium with a **curved LED band** screen and a bracket hologram; billboard on posts removed |
| note link (inspect) | n/a | "Making double-booking impossible at the database level", "Giving a voice agent tools it can't misuse" | "Idempotent payment webhooks: fulfil an order exactly once" | "Surviving signup spikes with React Query" |

Project accent colours appear only on the screen frame, the beacon and the chips. **All typographic accent stays vermilion** (brand rule: one loud colour).

### Shot 07: Stack and services

- **Camera:** swoop low across the plaza and push in to a three-quarter view.
  - W: tree right of centre.
  - T: tree lower half, crown cropped at the top band.

  The occluding lamp post is removed from the sightline (§14).
- **Composition (Tier B):**
  - eyebrow `03 · (Everyday tools & engineering stack)`
  - display `One engineer.` / `The *whole product.*`
  - lead: "From the first schema to the last pixel of motion."
- **World (Tier A):**
  - **5 branches = the 5 portfolio3 stack groups.** Group names run curved around the platform rim (JBM 12px, `curveRadius`): Frontend & interactive UI · Backend & distributed systems · Data modeling & fintech · AI agents & fintech gateways · Cloud, video & infrastructure.
  - **20 curated tools (4 per branch) as nodes.** **Node radius ∝ usedInProjects** (e.g. React 8, Tailwind 8, Next.js 7, TypeScript 6, MongoDB 4, PostgreSQL 3, Vapi 1). Tags are 13px, depth-tested, upright billboards.
  - **Scrubbed power-on.** Accent "laser" traces run from the rim up each branch as the hold progresses (portfolio3 laser line). Nodes ignite in order, so the chapter's scroll is the animation.
  - **LED marquee ring** around the trunk base: row A filled cream, row B outlined (`fillOpacity 0` + stroke), the portfolio3 marquee rows. Speed is boosted by Lenis velocity, with portfolio3's clamp-and-relax.
- **Inspect a branch:**
  - The camera orbits to the branch.
  - A **circuit-chip screen** (CanvasTexture, JetBrains Mono, portfolio3 syntax colours) shows the **service(s) that branch powers**: title, summary, 3–4 points and the **real code snippet with its file name**.
  - Each tool's one-line note and where it shipped appear as Tier A lines (e.g. "Vapi AI — Sub-450ms real-time conversational voice agents · Dent-Assist AI").

  Branch to service mapping (covers all 8):

  | Branch | Services |
  |---|---|
  | Frontend | 01 Full-stack web apps & monorepos |
  | Backend | 06 Realtime platforms |
  | Data | 02 Fintech ledgers & split payouts |
  | AI & gateways | 04 AI voice agents, 05 Payments |
  | Cloud | 03 Video streaming, 07 E2E testing & a11y, 08 Cloud & DevOps |

  The 2 engagement formats and the 4 standards are listed in the palette and in 2D.

### Shot 08: About (the workshop)

- **Camera:** lateral track along the path into the cutaway room. The lamp post that cuts through the room today is removed.
  - W: room right two-thirds.
  - T: room lower 55%.
- **Composition (Tier B):**
  - eyebrow `04 · (About)`
  - **scrub text**, Funnel 600 at t-h3 size (W 30px, T 22px). Words go from 0.16 to 1 opacity with scroll inside the hold (one mesh, one uniform):

    > "I'm Emon, a full-stack engineer in Dhaka. I build fast, secure Next.js products, from payment-automated storefronts to AI voice booking agents, and I care as much about how they feel as how they run."

    On T it plays as 2 beats (sentence 1, then sentence 2) to respect the top-band height.
- **World (Tier A):**
  - The **portrait** (`developer.jpg`, resized to 768px) framed on the wall. It uses portfolio3's clip reveal (bottom-up inset with an inner 1.25 → 1 de-zoom) and a vermilion rim-glow edge.
  - The **desk monitor is the terminal.** A CanvasTexture in JetBrains Mono plays the portfolio3 script at its real timing when the camera settles:

    ```
    $ whoami
    $ cat stack.txt
    $ ./now.sh
    ```

    Clicking it focuses a hidden `<input>` (REPL: `help`, `projects`, `skills`, `now`, `github`, `contact`, and the `sudo` joke).
  - **7 real objects** with numbered tags. Captions are verbatim from `content.md` §13 "Proposed about objects":

    | Object | Caption |
    |---|---|
    | computer | Right now |
    | books | Still studying |
    | robot headset | Agentic AI |
    | gamepad | Player one |
    | trophy / keyboard | Competitive coding |
    | globe | Three languages (the বাংলা word as a CanvasTexture) |
    | plant | Ship small, learn fast |

  - The **fictional coffee, cat and guitar captions are removed.** The meshes can stay as decor without claims, or go: owner's choice. Default: remove the cat's "Senior reviewer" story and the coffee "Fuel" story.
  - A small brass plaque by the shelf reads `27 public repos — github.com/maremon7415`, which is verifiable.
- **Inspect an object:**
  - The camera dollies to it (fit to bounds).
  - Its caption appears **beside it on the wall or a paper tag**: Funnel title 28px + Inter 15px text.
  - ←/→ cycles objects. Esc returns.

### Shot 09: Experience (bridge tracking shot)

- **Camera:** a short pull-out from the room, then a **tracking hold**. The camera moves laterally along the rope bridge, 1:1 with scroll at a slow constant speed. It is a hold in the data, so text is allowed, but the camera keeps moving: the film "tracking shot with signage".

  Three snap points sit inside this hold, one per role post.
- **Composition (Tier B, upper sky):**
  - eyebrow `05 · (Experience)`
  - display `The journey` / `*so far.*`
  - lead: "3 roles since 2024, from Laravel internships to leading front-end modernisation and shipping my own products."
- **World (Tier A):**
  - An **accent laser line** along the bridge handrail **fills with scroll** (portfolio3 ScrubFill timeline, with glow).
  - **3 lantern posts** carry plaques facing the camera path. Each lantern lights when the line reaches it:
    1. `2024 · 3 months` — **Full-Stack Developer Intern**, IBCSX PRIMEx — "Relational schemas, migrations and MVC routes in Laravel."
    2. `2024 — 2025` — **Front-End Developer**, Lilium Info Tech — "Refactored legacy interfaces to the Next.js App Router, improving LCP by 35%."
    3. `2025 — Now` — **Full-Stack Engineer**, Independent — "Payment-automated storefronts, esports platforms and AI voice booking."

    Type: Funnel 28px role, JBM 12px org and date, Inter 15px line.
  - **Education** as smaller stone markers at the bridge ends:
    - start: `Diploma in CSE · Habiganj Polytechnic · 2020 — 2024`
    - end: `B.Sc. CST · Bangladesh University · 2024 — 2028`
  - Languages are already covered by the globe object in About.

### Shot 10: Contact (launch islet)

- **Camera:** end of the bridge, crane up onto the islet, low hero angle on the rocket with the moon behind.
  - W: rocket right of centre.
  - T: rocket lower half.
- **Composition (Tier B, night sky):**
  - eyebrow `06 · (Next chapter)`
  - display `Let's build something` / `*worth shipping.*`
  - lead: "Open to full-time & contract roles. Frontend or full-stack, remote or on-site."
  - **channels** (Inter 17, each a clickable SDF line with a mesh icon, no emoji or glyph arrows):
    - `maremon15@gmail.com` (click copies + toast "Email copied")
    - `WhatsApp +880 1785 892074`
    - `LinkedIn /in/emon15`
    - `GitHub @maremon7415`
  - pill `Start a brief` (accent).
- **World (Tier A):**
  - The **launch terminal** idles: `emon@dhaka: ~ $ ./brief_` with a blinking accent block.
  - The pad floor ring carries **4 outline numerals `04 03 02 01`** with curved labels **Understand · Design · Build · Ship & tune**: portfolio3's process, as the countdown.
- **Brief flow:**
  1. Click the terminal (or the pill). The camera inspects the terminal.
  2. **Handoff:** a terminal-styled DOM form opens clipped exactly to the projected screen rectangle, then grows only as much as needed (desktop: about 560px, still "on" the terminal; phone: full-screen sheet).
  3. The form has portfolio3's 3 steps: *What do you need?* chips / *Tell me about it* + timeline / *Who am I talking to?*. It includes the honeypot field.
  4. Submit posts to `/api/contact` (a Vercel port of portfolio3's route) or to `profile.formEndpoint`.
  5. **On success:** the DOM collapses back into the screen. The terminal prints "Message sent. Thanks, {firstName}. I've got your brief and will reply to {email} by email." Then the **countdown** runs: each numeral fills accent in 0.5 s while its label lights. Then **liftoff** (the existing flame, smoke and shake).
  6. **On 503:** the terminal prints "Your brief is ready." and opens the pre-filled mailto.
- **After liftoff:** a pill `Fly the island yourself` (Play Mode) fades in. Play is also always in the HUD.

---

## 6. Content map: portfolio3 to the world

| portfolio3 content | Where it goes | Notes |
|---|---|---|
| Identity: name, role, Dhaka/UTC+6, availability | Shot 01 composition; HUD clock; shot 10 lead; `content.ts profile` | Replace "Creative Frontend Developer", "freelance", `hello@example.com`, X/Twitter |
| Hero rotating phrases, pitch | Shot 01 prism + pitch | verbatim |
| Preloader greetings (Bengali) | DOM preloader | troika cannot shape Bengali (verified) |
| Logo (prompt mark) | HUD, favicon, optional extruded landmark | SVG paths in `content.md` §1 |
| 4 featured projects | Shots 03–06 + inspect + case file | metrics, screenshots, problem/built/result, notes |
| BOE merged into the Arena | Shot 06 | owner to confirm the name |
| Bismillah Agro, Quran Web App, Chit-Chat | Island props with pins (shot 02) + inspect plaques + palette | Quran shown respectfully: calm pavilion, no playful scripture text |
| 9 featured public repos, 27 repos | About plaque; terminal `github`; palette "Elsewhere" | |
| 5 stack groups / 44 tools | Shot 07 branches; 20 curated nodes; all 44 in inspect lists and in 2D | **no invented levels**; size = project usage |
| 8 services + code snippets | Branch inspect chip screens | full text also in the 2D site |
| Engagements (2), standards (4), FAQ (6) | Palette entries + 2D site | not in the journey (density) |
| Process (4 steps) | Shot 10 countdown ring | "From idea to shipped." |
| Experience (3 roles) + education (2) | Shot 09 bridge posts + markers | |
| Short bio | Shot 08 scrub text | |
| Long bio, "right now", principles, interests, languages | About objects' captions (inspect) | 3 principles: plant (#1); "Type everything, trust nothing" and "Motion with a reason" as two small wall plaques |
| Portrait | Shot 08 frame | |
| Stats (100+ / 8+ / 90+ / 99%) | **Not used** unless the owner confirms | self-reported |
| Testimonials (5) | **Not used** | portfolio3 flags them as fictional placeholders. A reserved slot (a guestbook board by the plaza) can hold real quotes later |
| Notes (6) | Inspect "Read the note" links; palette "Notes" | |
| Contact flow + API | Shot 10 terminal handoff; `api/contact.ts` port | env `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` |
| Play Mode shards (12) | Replace with the 12 real facts in `content.md` §13 | |

---

## 7. Camera system

### 7.1 The timeline is data, not DOM

```ts
// src/journey/shots.ts (shape)
export type AspectClass = 'wide' | 'square' | 'tall'
export interface Shot {
  id: 'title' | 'work' | 'p-sua' | 'p-dent' | 'p-hgp' | 'p-arena' | 'stack' | 'about' | 'journey' | 'contact'
  chapter: 'intro' | 'work' | 'stack' | 'about' | 'journey' | 'contact'
  hold: number                       // vh of scroll at this shot (reading time)
  travelOverride?: number            // vh; default = clamp(arcLength / U_PER_VH, .45, 1.2)
  path: 'spline' | 'orbit' | 'track' // how we get here
  via?: V3[]                         // B-roll waypoints of the move in
  subject: { center: V3; radius: number }
  frame: Record<AspectClass, { ndc: [number, number]; fill: number; yaw: number; pitch: number; horizon?: number }>
  drift: { dolly: number; yaw: number; rise: number }   // Ken Burns during the hold
  day: number
  comp: CompositionId                // which title composition to show
  slot: Record<AspectClass, SlotPreset>
  snaps?: number[]                   // extra snap points inside the hold (bridge)
  inspect?: InspectTargetId[]
}
```

- `src/systems/timeline.ts` turns `shots` and the viewport into `journey.stops` and `journey.chapters`. These are **the same Map shapes as today**, so consumers keep working during migration. The work is pure arithmetic in **svh** units:
  - no `getBoundingClientRect`;
  - no re-measure when fonts land;
  - no stop jumps when the mobile address bar moves (`ScrollTrigger.config({ ignoreMobileResize:true })` is no longer even needed, since ScrollTrigger leaves the journey path).
- The DOM spine (§12) gets **explicit heights from the timeline** (`height: calc(var(--svh) * seg)`), so the scroll length always matches the data.

### 7.2 Path: arc length, orbit arcs, C1 holds

- **Spline moves:** a centripetal Catmull-Rom through `prevHoldEnd → via… → holdStart`, sampled with **`getPointAt` (arc length)**. Today it is `getPoint` in index space, which causes the 104 → 91 → 221 lurch.
- **Orbit moves** (project hops): interpolate in cylindrical coordinates around the plaza origin (θ, r, y). The 4 project slots already sit on r = 16 around the origin (`layout.ts`). The look target moves along the arc of building centres. Every hop becomes a perfect dolly arc.
- **Track moves** (bridge): a straight line along the bridge axis, linear in scroll.
- **Easing that matches the hold drift (no kinks).** Each travel run maps scroll fraction u to distance s with a cubic **Hermite** whose end slopes equal the drift speeds of the neighbouring holds:

  ```
  s(u) = h10(u)·v0 + h01(u)·L + h11(u)·v1
  h10 = u³−2u²+u,  h01 = −2u³+3u²,  h11 = u³−u²
  ```

  v0 and v1 are the drift velocities expressed per unit u. Velocity is continuous at every hold boundary: today it drops from about 5 u/vh to 0 and back. An optional per-shot `bias` skews toward a long settle (fast approach, slow arrival, the expo.out feel). The quintic smootherstep is the fallback where v = 0.
- **Holds** drift with `smoothstep`, not linearly.

### 7.3 Framing solver (replaces `setViewOffset` and the portrait pull-back)

For each shot and the current aspect class:

```ts
const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect)
const fit = Math.min(fovV, fovH)
const dist = subject.radius / Math.sin(fit / 2) / f.fill           // fit-to-sphere
const dir = dirFromYawPitch(f.yaw, f.pitch)                         // camera → subject
pos = subject.center − dir · dist
// put the subject at NDC (nx, ny): rotate the aim by the matching angles
aimYaw = −atan(f.ndc[0] · tan(fovH/2));  aimPitch = atan(f.ndc[1] · tan(fovV/2))
target = pos + rotate(dir, aimYaw, aimPitch) · dist
```

- It runs on resize and orientation change and writes the hold poses. `cameraPath` consumes them.
- It removes:
  - the always-on lens shift (−14% x / +17% y) and its mismatch with the CSS breakpoint, which caused the 820x1180 tablet bug;
  - the `1 + (1/aspect − 1)·0.42` pull-back;
  - `PlayMode`'s `clearViewOffset()` workaround.
- An optional `horizon` value pitches the camera so the **text slot falls on sky** (§8.5).
- **Sightline check:** in `?debug`, a raycast from each hold camera to the subject and to the 4 corners of the text slot warns if a mesh intersects. This is how the lamp posts get caught.

### 7.4 Follower and input

- **One smoothing stage.** Lenis `lerp 0.1` (wheel), then the camera follows with **`maath/easing damp3`**, a critically damped spring:
  - position smoothTime 0.22 s;
  - look target 0.26 s (slightly lazier, so the view does not swing).

  This replaces `lerp(damp(3.6))`, which had no ease-in and stacked with Lenis.
- **Lenis Snap** (`lenis/snap`) in `proximity` mode at each hold centre (and at the bridge post points): threshold 30%, 1.1 s, ease `1 − (1 − t)^4`, debounce 260 ms. It is stopped during inspect, Play, the case file and the palette, and it is off under reduced motion.
- **Micro-motion:**
  - FOV breathing: base + 4° × velocity, springed.
  - Bank: ±2.5° from lateral acceleration on spline and orbit moves.
  - Pointer parallax: ±0.6 u, holds only, off during inspect.
- **Rack focus:** `TiltShift2.blur = 0.09 × (1 − holdW)`. `holdW` ramps 0 → 1 over the last 8% of travel. Flights look miniature, holds are crisp, and text is never blurred by the top and bottom bands.

### 7.5 Inspect (pose blending, no second controller)

- `live.inspectW` (0..1) blends an **inspect pose** (computed from object bounds: screen fill 78% W / 92% T; objects fill 60%) over the journey pose inside `JourneyCamera`.
  - Enter: `gsap.to(live, { inspectW: 1, duration: 1.4, ease: 'expo.inOut' })`.
  - Exit: 1.1 s `power3.inOut`.
- A small springy orbit under the pointer (±10° yaw, ±5° pitch). No free orbit, no dolly.
- `history.pushState` per inspect, so Back exits. Wheel, touch or keys larger than 120px exit instead of scrolling.

### 7.6 Jumps

| Jump | Behaviour |
|---|---|
| ≤ 1 chapter away | Lenis `scrollTo`, duration `clamp(0.6 + 0.35·Δvh, 0.9, 1.8)` s. Today it is a fixed 2.2 s for any distance. |
| > 1 chapter (palette, progress ticks, logo "top") | **Curtain**: accent panel, then background panel 0.09 s later. Each slides up (0.72 s `expo.inOut`, curved arc) with the destination word and index (e.g. `03` / `Stack`) rising from 115%. Under cover: `lenis.scrollTo(target, { immediate: true })` plus a snapped camera. Reveal: 0.85 s. Total about 1.7 s, and no card or text flashes on the way. |

### 7.7 Reduced motion

- **Cuts instead of flights.** When the active shot changes, the canvas fades to the sky colour over 180 ms, the camera jumps to the hold pose, and it fades back.
- No takeoff, FOV, bank, parallax, `Float`, marquee or slideshow autoplay (manual arrows only).
- Text uses a 200 ms opacity fade only.
- Native scroll (Lenis already off) and no snap.
- The rocket launch is shortened to a 1 s lift-and-fade.

---

## 8. Text system and choreography

### 8.1 Two tiers

| Tier | What | How | Why |
|---|---|---|---|
| **A, world** | screens, captions, plaques, node tags, curved rim text, terminals, countdown numerals, pins, bridge plaques | drei `<Text>` (troika SDF) in the main scene. `FrontSide`, `depthWrite:false`, explicit `renderOrder`, fog on. Colours are pre-compensated for ACES (accent `setRGB(1.142, .036, .020)`, accent-2 `(1.448, .142, .044)`, fg-3 `(.202, .179, .146)`). Body text luminance is kept ≤ 0.75 so it does not bloom by accident. | part of the world: lit, fogged, occluded |
| **B, editorial** | the 10 shot compositions (eyebrow, title, lead, metrics, pills, scrub text, prism, badge) | drei `<Hud renderPriority={2}>`, which renders after `EffectComposer` (priority 1). It uses the **main camera** with world-space positions, so it parallaxes exactly like the scene. `toneMapped={false}` because the Canvas is not `flat`. SDF only (the Hud pass has no AA). | exact brand hex, crisp, never bloomed or blurred by tilt-shift |

Bengali and code are drawn on **CanvasTextures**, where browser HarfBuzz shapes them correctly (verified). **No drei `<Html>` anywhere in the journey**: it ignores the view offset and is never post-processed.

### 8.2 Fonts

- **For troika:**
  - Ship the baked **real TTFs** already in `scratchpad/fontreal/`. They were verified as `00 01 00 00` TTF, not mislabelled WOFF2 (the fontprobe files were WOFF2 inside and troika rejects them).

    | File | gzip |
    |---|---|
    | `FunnelDisplay-600.ttf` | 13.8 KB |
    | `Inter-400.ttf` | 31.4 KB |
    | `JetBrainsMono-400.ttf` | 27.7 KB |

  - Optional `Inter-500.ttf` for pill labels.
  - Subset Inter and JBM to Basic Latin + Latin-1 + `– — ‘ ’ “ ” • … ·` with `pyftsubset`, which saves about 40%.
  - Add a build check that the first 4 bytes are `00 01 00 00`.
- **For the DOM:** the 4 original portfolio3 WOFF2 variable files (OFL licence included) via `@font-face`. Drop `@fontsource-variable/bricolage-grotesque`, and drop the fontsource Inter and JetBrains Mono in favour of the portfolio3 files.
- **Preload:** troika `preloadFont({ font, characters })` for every string at load, reported to the loader progress, so no glyph pops after Enter. Do not pass per-instance `characters`, because that creates a new suspend key. **Each chapter's text sits in its own `<Suspense fallback={null}>`**, because drei Text suspends and would otherwise blank the Canvas.
- **String hygiene:** no → ↗ ✕ or emoji in 3D strings, because troika would fetch CDN fallback fonts. Arrows and icons are small meshes. Counters use fixed digit slots, because troika has no `tnum`.

### 8.3 Placement: stop-anchored slots

- Each composition block has a **slot** per aspect class, written in the hold camera's NDC. At resize it is unprojected through the hold pose into world space (code: `3d-presentation-research.md` §3.2, simplified now that there is no lens shift).
- The block is oriented to the hold camera, with at most 8° of yaw toward the subject.
- It sits at distance `d` with `d < subject distance`, so nothing intrudes between camera and text.
- **Size from CSS px:** `worldPerPx = 2·d·tan(fov/2) / innerHeight`, then `fontSize = px · worldPerPx`. This follows browser zoom. Floor: 12px.

| Preset | Text region (NDC) | Subject (NDC) | CTA row |
|---|---|---|---|
| **W** (≥ 1.25) | x −0.86 → −0.08, top at y +0.42 | x +0.30 | under the lead |
| **S** (0.8–1.25) | top band y +0.84 → +0.36, x ±0.86 | y −0.28 | under the lead |
| **T** (< 0.8) | top band from 64px below the top (clears the HUD) to y +0.30, 16px gutters | y −0.32 | bottom thumb zone, y −0.86, above the safe area |

**Px scale:**

| | display | title | lead | mono | metric |
|---|---|---|---|---|---|
| W | 72–140 | 72–88 | 17 | 12–13 | 36 |
| T | 44–56 | 40–52 | 15 | 11 | 28, 2 metrics only |

### 8.4 Choreography: one state machine per composition

```
idle ──enter hold range──▶ arming ──(spring residual < 0.12u AND |lenis.velocity| < 0.3, held 120 ms)──▶ revealing
revealing (timed GSAP, ends ~1.6 s) ──▶ shown ──(leaving hold range OR velocity > 1.2)──▶ exiting (0.45 s) ──▶ idle
arming ──leave range──▶ idle      (fast scroll-through never shows text: no ghosts, no flashes)
```

**Reveal offsets after settle** (house ease `em` = CustomEase `0.22,1,0.36,1`):

| t | element | motion |
|---|---|---|
| 0.00 s | eyebrow | decode scramble, 0.5 s (≤ 24 chars) |
| 0.08 s | title | per-glyph masked rise from 112% (28 ms/char, 1.1 s). GPU shader on `aTroikaGlyphBounds` (verified), or a `clipRect` per line. |
| 0.25 s | lead | per-word rise (38 ms/word, 0.9 s) |
| 0.40 s | metrics | slot roll of the value (0.8 s) + label fade |
| 0.55 s | pills | fade + scale 0.96 → 1 (0.6 s) and a 1px hairline draw-on |
| 0.00–1.8 s | screen | de-zoom 1.25 → 1 + wipe (Tier A) |

- **Scrubbed instead of triggered:** shot 08 story words (0.16 → 1), the shot 07 power-on, the shot 09 laser line.
- **Exit:** reverse order, 0.45 s `power2.in`, rise 30% + fade.
- **World anchoring:** because the block is anchored in the world, it also slides with real parallax as the camera departs. Text and camera are one motion system.
- **Colour fixed at reveal:** a block's ink (cream or near-black) is picked from the shot's day phase when it reveals, and never lerps while being read.

### 8.5 Legibility without boxes

1. **Composition first.** Framing data pitches the camera so the text slot lands on sky, a plain wall or open water (`frame.horizon`).
2. **Theme ink.** Dawn, sunset, dusk and night use cream `#f2eee6`. Morning and day use ink `#12100d` on the cream-keyed sky (portfolio3's light theme).
3. **Legibility pocket.** A Tier B quad behind each block with a feathered rounded-rect SDF alpha:
   - background colour at ≤ 0.32;
   - feather = 30% of block height;
   - **no edges and no blur**, a darkening like a film title over a busy plate;
   - `prefers-contrast: more` raises it to 0.75 and adds a 1px hairline.
4. **Verification.** Playwright samples the luminance behind each slot at every shot, for 5 viewports, and asserts ≥ 4.5:1 for body and ≥ 3:1 for display text. The hero is 1.3–1.7:1 today.

### 8.6 Mid-travel rule

No text. Only these, per move:
- **01 → 02:** EMON. chase lights, sun climbing.
- **02 → 03:** buildings settling, birds.
- **Project hops:** the previous screen recedes; HGP drones; the Dent waveform.
- **06 → 07:** sunset light raking across the plaza, fountain.
- **07 → 08:** the tree's traces cooling.
- **08 → 09:** lanterns waking.
- **09 → 10:** stars appearing, pad floodlights.

---

## 9. Brand carry-over

| portfolio3 | In the 3D site |
|---|---|
| Palette `#0a0908` / `#f2eee6` / `#ff4a2e`, cream light theme | `dayNight.ts` re-keyed: dawn rising-sun (vermilion disc and horizon over a warm-dark sky), morning and day cream (`#efebe3`/`#e7e2d7` fog and sky, no blue), golden, sunset, dusk, night (`#0a0908` → `#191714` with a faint vermilion city glow and cream stars). The cyan crystal and focus colours become accent. `theme-color #0a0908`. |
| Funnel mega + accent word + closing period | Every Tier B title (`Miah.`, `*scale.*`, `*Academy.*`, `*worth shipping.*`); voxel `EMON.` with an accent period block |
| Masked rise-in, 28/38 ms staggers, `0.22,1,0.36,1` | §8.4, GPU per-glyph shader + `clipRect` |
| JetBrains Mono eyebrows, `(Label)` | Every eyebrow; pins; tags; terminals |
| Terminal identity | Desk monitor shell (shot 08); launch terminal brief (shot 10); ⌘K palette |
| Bilingual preloader, `000%`, curved lift | DOM preloader re-skin, lifting into the takeoff |
| Curtain | Long jumps only (§7.6) |
| Live Dhaka clock, green ping | HUD |
| Scrub text | Shot 08 |
| Laser line | Shot 07 traces, shot 09 handrail |
| Rotating words | Shot 01 prism |
| Marquee rows A/B | Shot 07 LED ring |
| Circular badge | Shot 01 scroll ring |
| Outline numerals (process) | Shot 10 countdown |
| Stacked cards recede | Project screens recede on departure |
| Cursor with labels | DOM dot + ring, labelled from R3F hover: View / Inspect / Open / Type / Launch / Drag (fine pointers only) |
| Grain | postprocessing `Noise` overlay ≈ 0.07 (high tier) |
| Zero emoji | All 27 removed; lucide SVG in DOM, meshes in 3D |

---

## 10. DOM layer (what remains, all non-glass)

- **HUD** (`src/ui/Hud.tsx`, replaces `Nav.tsx`): logo + name, clock, ⌘K, sound, 2D, Play, the 2px progress line with chapter ticks, and a top gradient. No `backdrop-filter`.
- **Command palette** (`src/ui/Palette.tsx`): ⌘K or `/`, portfolio3 styling. Groups:
  - Chapters (fly-to);
  - Projects (all 7 → inspect);
  - Notes;
  - Actions (copy email, sound, text size 1×/1.25×/1.5×, captions on/off, 2D, Play, launch rocket);
  - Elsewhere (GitHub, LinkedIn, Facebook, WhatsApp, call, emon.pro).

  It stops Lenis and the snap while open.
- **Curtain** (`src/ui/Curtain.tsx`).
- **Case file** (`src/ui/CaseFile.tsx`, replaces `ProjectModal`/`Modal`): the clip-path handoff from the screen rectangle. Long description, architecture bullets, highlights, all screenshots in a lightbox, links. Focus-trapped, Esc closes and reverses the clip.
- **Brief form** (`ContactTerminal.tsx` rewritten): portfolio3's 3 steps, terminal look, handoff from the 3D terminal.
- **Captions bar** (opt-in from the palette, or forced under `prefers-contrast: more`): a solid `--bg-2` strip at the bottom that mirrors the current shot's text. **Not glass.** For visitors who cannot read in-world text.
- **Toast** pill, **cursor**, **preloader**, **skip link**.

---

## 11. Mobile (390x844 portrait)

- **Framing:** every shot has a hand-checked **T** preset: subject in the lower 55%, text in the top band (64px below the top edge, 16px gutters), CTA in the bottom thumb zone above `env(safe-area-inset-bottom)`. The solver uses `min(vfov, hfov)`, so wide subjects fit the narrow width. FOV stays 58.
- **No bottom sheet, no inner scroll.** Text is at most about 25 words per shot:
  - eyebrow + title (44–52px) + one line (15px) + 2 metrics (28px) + 1 pill;
  - the story plays as 2 beats;
  - pitch hidden;
  - 2 metrics instead of 3.
- **Input:**
  - Taps, not hovers, with the existing `e.delta > 8` drag guard.
  - 3D pills and pins have **invisible hit meshes ≥ 48x48 CSS px** (`meshBounds` raycast).
  - In inspect: horizontal swipe = next or previous screenshot or object, vertical swipe = exit.
  - No pinch or orbit.
- **Scroll:** Lenis touch with native momentum, plus proximity snap. Spine heights in **svh**, so the address bar never moves stops. Recompute slots and framing on `orientationchange` (debounced 150 ms).
- **Brief form:** the handoff becomes a full-screen sheet so the keyboard has room. The 3D terminal mirrors the typing behind it.
- **Low-tier preset** (the existing `PerformanceMonitor` drop, or coarse pointer + `deviceMemory ≤ 4`):
  - DPR ≤ 1.25; no shadows, TiltShift or grain;
  - textures at 768px, only the active project ± 1 resident (`useTexture.clear` the rest);
  - CanvasTexture terminals redraw at ≤ 15 fps and only when on screen;
  - Hud scrims stay (they are cheap).
- **Tablets** (820x1180 and similar) use the **T** preset. The tablet bug disappears because composition is per aspect from data, and the CSS 640px breakpoint no longer drives anything in the journey.

---

## 12. Accessibility

1. **DOM spine** (`src/ui/Spine.tsx`, replaces the visual role of `Journey.tsx`):
   - One `<section data-shot>` per shot, in story order, with full semantic content: h1/h2, the lead, metrics as `<dl>`, real links and buttons (Case study, Live, Code, objects, branches, Start a brief).
   - **Visually hidden** (clip technique) but **not** `display:none` or `aria-hidden`. Heights come from the timeline.
   - The canvas stays `aria-hidden`.
   - Spine and 3D are both generated from `content.ts`, so they cannot drift apart.
2. **Focus mirroring:**
   - `focusin` on a spine control scrolls to its shot if needed and sets `store.focus3d`. The matching mesh shows an **accent focus ring** (outline quad + 4% lift).
   - Enter or Space runs the same action as clicking the mesh.
   - A small solid **focus chip** at the bottom echoes the focused control's label for sighted keyboard users. It is the only DOM that appears, and only on keyboard focus.
3. **Live caption:** one `aria-live="polite"` region updates when a shot reaches `shown`, debounced 400 ms and velocity-gated. Example: "Work, 1 of 4: San Uni Academy. Multi-vendor LMS, merchandise marketplace and HLS video pipeline. Press Enter to inspect."
4. **Keyboard:**
   - Native PageUp/PageDown/Space/arrows, plus snap.
   - `[` / `]` previous/next shot.
   - In inspect: ←/→ gallery or objects, Esc exits.
   - ⌘K palette.
   - Tab order follows the story.
   - Play Mode keys are inactive in the journey.
5. **Reduced motion:** §7.7. The preloader is skipped (as in portfolio3), and every reveal jumps to its final state.
6. **Contrast and zoom:**
   - The contrast gate in §8.5.
   - `prefers-contrast: more` forces pockets at 0.75 and hairlines, and auto-enables the captions bar.
   - Text sized from CSS px follows browser zoom.
   - Palette text-size multiplier 1/1.25/1.5×.
7. **2D mode** (`FlatSite.tsx` rebuilt on portfolio3 tokens): the complete content (all 8 projects, services, standards, process, FAQ, notes, contact form), the theme toggle, and a link to emon.pro. It is also the WebGL-crash fallback (`SceneBoundary`), the skip-link target and the no-JS/SEO content.
8. **Hover-only info is gone:** everything works by tap and focus. Hit areas are ≥ 44px.

---

## 13. Performance budget

**Baseline (measured above):** 88–163 draw calls and 61–72k triangles per stop at high tier. Today's journey also re-blurs `backdrop-filter` regions over the canvas every frame.

| Budget item | Target |
|---|---|
| Frame rate | 60 fps on mid desktop GPUs and recent iPhone/Pixel; ≥ 45 fps on low tier (low preset). Validate on real devices: SwiftShader numbers are not representative. |
| Draw calls at a hold | ≤ base + 30 (max about 190 at the contact shot). Text outside the active shot ± 1 is `visible=false`. One composition is about 8–12 Text meshes + 1 pocket + pills. |
| Triangles | + < 5k (SDF glyphs are 2 triangles each). The Hud pass draws SDF quads only. |
| Main-thread JS per frame | ≤ 3 ms. No DOM reads during scroll; DOM writes only the progress-line `transform` and the clock once per second. No React state per frame (shot changes only at boundaries). Reveals are uniforms driven by GSAP or `useFrame`. |
| Layout jank | Zero. The timeline is computed in svh; no re-measure on fonts; no sticky or `position` animation; no `backdrop-filter`. |
| Text layout | All strings laid out once at load in troika's worker. Scramble only on ≤ 24-char eyebrows. The prism pre-lays out its 4 faces. |
| Shader hitches | Text and screens are mounted visible at opacity 0 during `SceneReady`, then `gl.compileAsync`. Textures are uploaded via `useTexture` (`initTexture`), with the next shot preloaded on idle. |
| GPU memory (screenshots) | High: about 14 textures at 1024px ≈ 52 MB. Low: active ± 1 at 768px ≈ 19 MB. KTX2 later only if needed. |
| Network | JS + about 45 KB gz (troika 41.5, maath 1.1, snap 2.0). Fonts about 73 KB gz (about 50 after subsetting), loaded behind the preloader. About 1 MB WebP for the textures actually used, streamed per chapter. `developer.jpg` → 768px WebP (about 60 KB). |
| Adaptive | The existing `PerformanceMonitor` drops in order: TiltShift → grain → bloom levels → DPR → texture size. |

---

## 14. Engineering plan for this codebase

### 14.1 Architecture

```
content.ts ──▶ journey/shots.ts ──▶ systems/timeline.ts ──▶ journey.stops / chapters (same Map API)
                     │                     │                         │
                     │                     ▼                         ▼
                     │              ui/Spine.tsx (heights)     systems/cameraPath.ts (arc length, orbit, Hermite)
                     ▼                                               │
           systems/framing.ts (per aspect) ─────────────────────────▶ scenes/JourneyCamera.tsx (damp3, FOV, bank, inspect blend)
                     │                                               │
                     ▼                                               ▼
           scenes/text/slots.ts ──▶ scenes/compositions/*.tsx ◀── systems/phase.ts (arming → revealing → shown → exiting)
                                    (Tier B in <Hud renderPriority={2}>, Tier A in scene)
```

### 14.2 New files

- `src/brand.ts`: tokens, ACES-compensated colours, fonts, eases, staggers (`design-language.md` §9).
- `src/journey/shots.ts`: the 10 shots (§4–5).
- `src/systems/timeline.ts`: shots → ranges in svh; `journey.version` bumps only on resize-class or svh change.
- `src/systems/framing.ts`: fit-to-sphere + NDC placement per aspect class; sightline debug.
- `src/systems/phase.ts`: `stopPhase`, `useShot(id)`, the settle detector, the composition state machine.
- `src/systems/inspect.ts`: inspect store, pose-from-bounds, history integration, gesture-to-exit.
- `src/scenes/text/fonts.ts`, `WorldText.tsx` (Tier A presets), `EditorialText.tsx` (Tier B), `glyphReveal.ts` (verified shader), `slots.ts`, `Pocket.tsx` (legibility pocket), `Pill3D.tsx` (SDF pill + hit mesh + focus ring), `RotatingPrism.tsx`, `CurvedText.tsx`, `canvasText.ts` (Bengali, terminals, code chips).
- `src/scenes/compositions/{Title,Slate,Project,Stack,About,Experience,Contact}Comp.tsx`.
- `src/scenes/projects/screenMaterial.ts`: rounded corners, crossfade, de-zoom, wipe, recede.
- `src/scenes/projects/Props.tsx`: Bismillah terraces, Quran pavilion, Chit-Chat mast, with pins.
- `src/scenes/experience/BridgeTimeline.tsx`: laser line, lantern posts, education markers.
- `src/ui/Hud.tsx`, `Palette.tsx`, `Curtain.tsx`, `Cursor.tsx`, `CaseFile.tsx`, `Spine.tsx`, `Captions.tsx`.
- `api/contact.ts` (optional Vercel function, a 1:1 port of portfolio3 `app/api/contact/route.ts`, same env vars) or `profile.formEndpoint`.
- `scripts/assets.mjs`: resize WebPs to 1024 (world) and 1600 (case file); portrait to 768. Uses a `sharp` devDependency, or the Pillow script from the scratchpad.
- `scripts/check-fonts.mjs`: TTF magic-byte assertion.
- `src/ui/DirectorPanel.tsx` (`?director`, dev only): live sliders for each shot's frame, slot and hold, with "copy JSON". It makes the per-aspect tuning of 10 shots × 3 classes practical.

### 14.3 Changed files

| File | Change |
|---|---|
| `src/content.ts` | Real profile, 4 featured + 3 secondary projects with new fields (subtitle, metrics[], screenshots[] with captions, problem/built/result, notes[], isPrivate/privateLabel, frameAccent), 5 stack groups with `usedIn`, services with snippets, process, experience, education, about objects, 12 real shards, contact copy. All emoji removed. `chapters` becomes the 6 new chapters. |
| `src/systems/scroll.ts` | `measure()` and ScrollTrigger removed from the journey path. Timeline-driven `onProgress`; Lenis `lerp 0.1`; Snap; `scrollToShot(id)` with distance-scaled duration or curtain; `live.shot`, `live.holdW`. |
| `src/systems/cameraPath.ts` | Rewritten around shots: arc length (`getPointAt`), orbit and track segments, Hermite with drift matching. `sampleCamera(p, pos, target)` signature kept. |
| `src/scenes/JourneyCamera.tsx` | `damp3` follower, framing poses, **no `setViewOffset`, no portrait pull-back**, FOV breathing, bank, `holdW` → rack focus, inspect blend, reduced-motion cuts, takeoff chained to the title composition. |
| `src/scenes/environment/Effects.tsx` | TiltShift blur driven by `holdW`; `Noise` grain (high tier). Bloom threshold stays 0.82; Tier A body text stays below it. |
| `src/systems/dayNight.ts` | Brand palettes; `env.ink` (text theme) per phase. |
| `src/scenes/projects/ProjectsDistrict.tsx` | Screenshot screens; building re-skins (video wall, waveform ring, drones, LED band); billboard posts removed; rise from the timeline; `drawDemo` kept only as a loading shimmer, deleted in phase 5 if unused. |
| `src/scenes/skills/SkillsGarden.tsx` | `<Html>` removed; 5 groups; usage-sized nodes; SDF tags; curved rim names; accent traces scrubbed by `holdT`; marquee ring; branch inspect chips. |
| `src/scenes/about/AboutWorkshop.tsx` | `<Html>` tooltips and hint bulbs removed; real objects; portrait; terminal monitor; numbered tags; inspect captions. |
| `src/scenes/finale/Finale.tsx` | Terminal brief screen; countdown ring; success and fallback states. |
| `src/scenes/intro/Landmarks.tsx` | `EMON.` period block + chase lights; bridge hooks for the timeline. |
| `src/systems/layout.ts` | `LAMPS` filtered out of every shot's sightline cone (fixes the lamp in front of the About room and the skills tree); positions for props and bridge posts; `PROJECT_SLOTS` from the featured projects. |
| `src/ui/FlatSite.tsx` | Rebuilt on portfolio3 tokens and full content. |
| `src/ui/ContactTerminal.tsx` | 3-step brief, terminal styling, handoff geometry, endpoint + mailto fallback. |
| `src/App.tsx` | New HUD, Spine, Palette, Curtain, CaseFile, Captions. Play chunk preloaded when `live.shot ≥ 'about'`. |
| `src/state/store.ts` | `inspect`, `focus3d`, `captions`, `textScale`, `shot`. `hoveredAbout`/`pinnedAbout` replaced by inspect. |
| `src/scenes/play/PlayMode.tsx` | Drop `clearViewOffset()` (no longer needed); real shards. |
| `src/styles/global.css` | Delete `.card`, `.hero-card`, `.about-tip`, `.skill-label`, `.progress-rail`, `.chapters`, the glass tokens and the sticky/mobile card layout (several hundred of its 1,555 lines). Add portfolio3 tokens, HUD, palette, curtain, case file, spine (sr-only), toast. |
| `index.html` | portfolio3 preloader, `theme-color #0a0908`, font preloads, no emoji. |
| `package.json` | **add** `troika-three-text@^0.52.4`, `maath@^0.10.8` (both already transitive via drei; declared so imports do not duplicate). **remove** `@fontsource-variable/bricolage-grotesque` (and the fontsource Inter/JBM if the portfolio3 WOFF2s are adopted). Optional devDependency `sharp`. |

`public/` gets `fonts/` (TTF for troika, WOFF2 + OFL for the DOM), `assets/projects/*.webp` (resized), and `assets/developer.webp`.

### 14.4 Deleted or retired

- `useReveal` and all per-card ScrollTriggers.
- The sticky card CSS.
- drei `<Html>` in the journey.
- The `chapter === 2/3` mount gates (replaced by `useShot`).
- `src/ui/Modal.tsx` (folded into CaseFile).
- The fixed 2.2 s `scrollToTarget`.

### 14.5 Font conversion (done, reproducible)

```
python3 -m venv ftenv && ftenv/bin/pip install fonttools brotli
fonttools varLib.instancer FunnelDisplay.woff2 wght=600 --update-name-table -o tmp.ttf
python3 -c "from fontTools.ttLib import TTFont; f=TTFont('tmp.ttf'); f.flavor=None; f.save('FunnelDisplay-600.ttf')"
# same for Inter wght=400 (and 500), JetBrainsMono wght=400; then pyftsubset to Latin + punctuation
```

The outputs already exist in `scratchpad/fontreal/` (`scratchpad/tools/real-ttf.py`). Noto Sans Bengali stays WOFF2 for the DOM preloader and canvas text (`FontFace`).

### 14.6 Compatibility during migration

`journey.stops`, `journey.chapters`, `live.chapterT` and `sampleCamera()` keep their shapes. Old ids (`start`, `project-0..3`, `skills`, `about`, `finale`) are aliased to the new shot ids until every consumer moves to `useShot`. This lets phase 1 ship without rewriting all scenes.

---

## 15. Phases

| Phase | Scope | Exit criteria | Estimate |
|---|---|---|---|
| **1. Clean cut** (foundation) | Real `content.ts`; `brand.ts`; fonts in `public/`; `shots.ts` + `timeline.ts` (DOM measurement gone); `framing.ts` (lens shift gone); new `cameraPath` (arc length, orbit, Hermite) + `damp3` follower + Snap + rack focus; Spine (sr-only, data heights); minimal HUD + progress line; **all glass removed**; temporary plain Tier B titles per shot; `?director` panel. | No `.card`, `<Html>` or `backdrop-filter` in the journey. Camprofile script on the new path: speed rises and falls monotonically per move, peak spread ≤ 1.5x, no velocity kink at hold boundaries. Scroll ≈ 12.2 vh. 820x1180 tablet frames correctly. | 5–6 days |
| **2. Type and choreography** | Text kit (WorldText, EditorialText, glyph reveal, slots, pocket, Pill3D, prism, curved text); the composition state machine (settle-gated, exit); all 10 compositions with real copy; theme ink; preloader re-skin; curtain; palette; cursor; live caption; contrast gate. | Text visible only inside holds. Contrast ≥ 4.5:1 body / 3:1 display at 5 viewports. Fast scroll-through shows no text. Reduced-motion run passes. | 5–6 days |
| **3. Projects and inspect** | Screen shader + real screenshots + recede; building re-skins; secondary props + pins; inspect pose blending (gallery, problem/built/result, chips, notes, Live/Code); case file clip-path handoff; history and gesture exits; texture streaming policy. | Every project inspectable by mouse, touch and keyboard; Back exits; low-tier texture memory ≤ 20 MB. | 5 days |
| **4. Chapters and finale** | Stack (usage nodes, SDF tags, rim text, scrubbed traces, marquee, branch inspect with service code chips); About (objects, portrait, terminal REPL, captions, plaques); Experience bridge (laser line, posts, education markers, inner snaps); Contact (terminal brief handoff, countdown, liftoff, success and fallback, `api/contact.ts` or endpoint); day-night re-key; grain; EMON. sign. | Full story playable end to end. Brief send works against a test endpoint, and mailto fallback works. | 5–6 days |
| **5. Mobile, a11y and performance hardening** | T/S presets tuned per shot; hit meshes; swipe in inspect; low preset; captions bar; text size; prefers-contrast; FlatSite on portfolio3 tokens; Playwright suite (shots at 390/820/1366/1440/1920, contrast sampling, timing assertions, axe on Spine + FlatSite); real-device fps passes; cleanup (delete `demoScreen` if unused, dead CSS). | 60 fps desktop and ≥ 45 fps low-tier phones on real devices; axe clean; draw calls ≤ base + 30. | 4 days |

**Total: about 24–27 dev days** for one experienced R3F developer. If phases 4 and 5 are trimmed (no branch code chips, no REPL), about 20.

---

## 16. Risks, honestly

1. **In-world legibility is the main design risk.** 10 shots × 3 aspect classes × 6 lighting states is many compositions to tune. Mitigations:
   - the `?director` panel;
   - the Playwright contrast gate;
   - theme ink and legibility pockets;
   - the captions-bar escape hatch.

   Expect a few iterations per shot.
2. **Tier B can look pasted on if overused.** It is never occluded or fogged. Keep it to the 10 compositions, anchor it in world space so it parallaxes, and keep every detail diegetic (Tier A).
3. **Inspect versus scroll on touch, especially iOS Safari:**
   - Lenis stop/start;
   - rubber-banding;
   - wheel-to-exit thresholds;
   - Back-button state;
   - focus restore.

   This is fiddly and needs real-device QA.
4. **Shorter scroll plus snap could feel rushed or sticky to some visitors.** It is proximity, not mandatory, snap, and the weights are data. Plan a playtest pass to tune them.
5. **Mobile GPU memory and WebGL context loss** with screenshots and canvas textures. Mitigations: active ± 1 policy, 768px textures on low tier, a context-loss handler that falls back to 2D.
6. **troika specifics:**
   - it suspends at mount (needs per-chapter Suspense);
   - no WOFF2;
   - no Indic shaping (Bengali on canvas);
   - no `tnum` (fixed digit slots);
   - CDN fallback fetches for missing glyphs (sanitise strings);
   - SDF shimmer in motion (text only in holds).

   All are known and verified, but each is a trap if forgotten.
7. **The framing solver replaces hand-tuned camera positions.** First results may frame worse than today's tuned shots until the presets are dialled in.
8. **Hud specifics:**
   - it must stay at `renderPriority ≥ 2`;
   - no AA on Hud geometry (keep it SDF only);
   - `toneMapped={false}` required.

   If the composer changes later, this ordering must be re-checked.
9. **Content truth:**
   - stats are self-reported (excluded by default);
   - SUA is under NDA (no code link);
   - the BOE/GKEC footballer artwork (use gkec3 and boe2 only);
   - `*.emon.pro` live URLs could not be verified from the sandbox;
   - the "Esports Arena" name and subtitle are new copy;
   - the fictional About captions are removed;
   - the anime avatar is unconfirmed (not used).
10. **The contact backend:** the site is a static Vite build, so it needs the Vercel function port (with `RESEND_API_KEY`) or a form endpoint. Otherwise it falls back to mailto.
11. **Effort and scope:** this rewrites most of the presentation layer (roughly a third of `src` is touched). Phase 1 alone already fixes the user's complaint (no cards, smooth camera), so the work can ship incrementally.
12. **Verification limits here:** this sandbox renders with SwiftShader, so fps numbers must be confirmed on real hardware before calling phase 5 done.

### Open questions for the owner
1. Merge GKEC and BOE into one "Esports Arena" (name OK)?
2. Show the headline stats (100+ / 8+ / 90+ / 99%)? Default: no.
3. Keep decorative cat, coffee and guitar meshes without captions, or remove them?
4. Contact delivery: Vercel function with Resend, or a Formspree-style endpoint?
5. Should "Floating Island City" (this site) appear anywhere? Default: only in the terminal `projects` output and the 2D site.
6. What is the production URL for the 3D site (`siteUrl`, Open Graph)?

---

## 17. Verification plan

- **Playwright** (extend `scratchpad/tools/audit.cjs`):
  - shoot every shot's `shown` state plus 3 mid-travel frames per move at 390x844, 820x1180, 1366x657, 1440x900 and 1920x1080;
  - assert there is no DOM element with `backdrop-filter`, and that no visible DOM except the HUD and progress line covers more than 3% of the viewport;
  - sample the background luminance behind each slot for contrast;
  - check that Tier B text alpha is 0 outside the hold ranges.
- **Camera profile** (`tools/camprofile.mjs` on the new `cameraPath`):
  - speed per move rises and falls monotonically;
  - peak spread ≤ 1.5x;
  - velocity continuous at holds;
  - total scroll ≈ 12.2 vh.
- **Accessibility:**
  - axe on Spine and FlatSite;
  - keyboard-only run (Tab through all shots, inspect, case file, brief);
  - VoiceOver/NVDA spot-check of the live captions;
  - reduced-motion and `prefers-contrast` runs.
- **Performance:**
  - `?debug` draw calls per shot against the §13 budget;
  - real-device fps on a mid Android and an iPhone;
  - GPU texture memory via `renderer.info`.
