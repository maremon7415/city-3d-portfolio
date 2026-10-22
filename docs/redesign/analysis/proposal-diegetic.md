# Proposal: "Island as Interface" (diegetic-first redesign)

Author role: senior creative developer and art director. Target: `/home/user/city-3d-portfolio` (Vite, React 19, R3F 9, drei 10.7.9, three r186, GSAP 3.15, Lenis 1.3.27). Real content and brand come from `/home/user/portfolio3`.

Inputs (all on disk):
- `analysis/content.md` and `content.json`: real content.
- `analysis/design-language.md`: brand, fonts and the ACES findings.
- `analysis/overlay-audit.md`: the 2 weird cards, measured problems and coupling.
- `analysis/3d-presentation-research.md`: troika, slots, reveal shader, camera and accessibility research.

All paths are absolute unless written `src/...`, which is relative to `/home/user/city-3d-portfolio`.

---

## 0. TL;DR

**The complaint.** "We put 2 weird cards on screen in 3D mode." These are the frosted navy glass content card (`.card`, `src/ui/Journey.tsx`) and the second glass box that repeats it: the About tooltip (`.about-tip`, drei `<Html>`). By extension, the flat billboard on posts and the project modal read the same way. They are 2D web UI pasted over a 3D world. On phones they cover 36–51% of the screen, they run into the nav at 1366×657, and they sit on top of the subject on tablets.

**The idea.** The island already has a story: it is a floating town full of things Emon built. So every word of content becomes something the town physically owns:
- a smart sign;
- a building's facade screen;
- an LED ring;
- a museum plaque;
- a painted wall;
- a split-flap departure board;
- a terminal.

All of these come from one designed **wayfinding sign family** in portfolio3's brand: warm black #0a0908/#11100e plates, cream Funnel Display / Inter / JetBrains Mono type, a single vermilion #ff4a2e accent, and 1px hairlines.

Carriers are grounded: on posts, on walls, on objects, or on small **sign-islets**. A sign-islet is a floating rock carrying a sign. In this world floating is native, so a sign can sit exactly where the composition needs it on any screen and still belong to the world.

Signs are physical and always present. Their displays **power on** only when the camera settles at a stop and **power off** as it leaves. That gives zero half-read text during flight.

**What stays DOM.** In 3D mode no DOM element carries content on screen. The DOM keeps four jobs:
1. **The frame:** logo, three bare text controls, and the 2px accent progress line. No boxes.
2. **On-request deep views:** the case-study sheet, which grows out of the 3D screen, the ⌘K palette, and the simple contact-form fallback.
3. **The preloader and the curtain.**
4. **An invisible but focusable semantic spine** for screen readers and keyboard users. The 2D site stays the full alternative.

**Content.** All real content from portfolio3: identity, 4 featured buildings (San Uni Academy, Hasibul Gaming Point, Dent-Assist AI, Esports Arena = GKEC + BOE), 3 project props, 44 tools with real usage counts, the bio, principles, notes, the experience timeline, services, formats and process, and contact. There are 6 chapters and 14 camera stops in **about 13.4 viewport heights of scroll**, 29% shorter than today's 18.9.

**Smoothness.** Stops come from data instead of DOM measurement. The camera path is parameterised by arc length with a C1 speed profile, which removes the stop-and-surge feel and the 0.35 vh dead zones. Other camera changes:
- one critically damped spring instead of double smoothing;
- Lenis snap at hold centres;
- no lens-shift hack: per-aspect poses replace it;
- rack focus, FOV breathing and a slight bank.

Text reveals per glyph on the GPU (1.1 s, `0.22,1,0.36,1`) only after the camera settles, and exits fast. Nothing is measured from the DOM, so fonts and resizes cannot move the camera path.

**Cost.** About 22–26 developer-days for one experienced R3F developer, in 5 phases. New runtime JS is about 46 KB gz (troika, maath, lenis/snap, CustomEase), plus about 60–74 KB of fonts. The draw-call budget is +45 per stop on desktop and +25 on phones over the measured baselines.

---

## 1. Verdict and governing rules

### 1.1 What the user saw

| Surface | Why it reads as a "weird card" | Measured |
|---|---|---|
| `.card` content card (Card #1) | Dark frosted rectangle over a sunny low-poly world, on screen at 7 of 8 stops. | 13–22% of the screen at 1440, **36–51% at 390**. Overlaps the nav by 51px at 1366×657. Covers the subject at 820×1180. |
| `.about-tip` tooltip (Card #2) | A second glass box in the same frame repeating the list item's text. | 7px text on phones. Two dark boxes stacked on mobile (`shots/audit-390-about-tap.png`). |
| Project billboard on posts, project modal | More dark rectangles saying the same thing as the card. | Project info shown 3 times, chapter shown 3 times. |

### 1.2 Rules this proposal enforces (testable)

1. **R1, nothing floats unless the world lets it.** Every content glyph sits on a carrier that has a physical mount: posts to the ground, a wall, an object, a building facade, or a sign-islet rock. No bare text planes and no DOM boxes over the canvas.
2. **R2, read only when still.** Small text (under 40 px on screen) is shown only while the camera is settled at a hold. During flight, carriers are visible objects with dark or idle displays. The only flight-time type is chapter totems (3 words or fewer, 48 px or larger on screen, like highway signs).
3. **R3, one fact, one place.** Each piece of content appears once in 3D. Duplicates live only in the DOM spine, the palette and 2D mode.
4. **R4, legible by construction.** Text sizes are set in CSS px and converted to world units at the hold distance (12 px floor, 15 px body on phones). Contrast is cream on warm black (≈15:1) on every plate, which ends the 1.3:1 hero problem.
5. **R5, data, not DOM.** Scroll length, stop ranges, chapters, poses and carrier slots are generated from one data file. The DOM never decides where the camera is.
6. **R6, zero emoji, zero fake data.** No invented skill levels, no fictional testimonials, and self-reported stats only if Emon confirms them.

---

## 2. The sign family: the island's design system in 3D

Every carrier is one of eight components. They share materials, motion and the brand, so the island reads as one designed town rather than a collection of labels.

| Carrier | Looks like | Holds | Mount | Reveal grammar |
|---|---|---|---|---|
| **Plate** (`SignPlate`) | Matte warm-black e-ink/enamel display, 4–8 cm thick, rounded 22/32 px-equivalent corners, 1px cream hairline, a thin LED **status strip** along the bottom edge. | Eyebrow, title, subtitle, metric tiles, keycaps | ground (2 posts), float (sign-islet), wall | Display warms up on arrival (emissive 0→1), glyphs rise from 112% on settle, status strip types in. |
| **Keycap** (`Keycap`) | A 3D pill key (999px radius), cream or accent, label in Inter 500. | CTAs | attached to plates, terminal, boards | Press-down travel plus spring. On hover the **curved fill rises from the bottom** (portfolio3 `.btn` signature, done in the shader). |
| **Screen** (`ProjectScreen`) | Display set flush into a building facade (never on free-standing posts). | Real portfolio3 screenshots | building wall | Boot wipe, de-zoom 1.25→1 (1.8 s), 3.5 s crossfade slideshow. Recedes (scale .93, brightness .5) when the camera leaves, the stacked-cards move done physically. |
| **Totem** (`Totem`) | Tall vertical wayfinding pylon at each chapter entrance. | "(02) Selected work" | ground | Always on, readable in flight (large type). |
| **Ticker** (`LedTicker`) | Curved LED band (troika `curveRadius`). | Marquee rows, ring labels, "SCROLL TO FLY •" badge | wraps around trunk, platform or islet | Scrolls; speed boosted by scroll velocity (portfolio3 marquee formula). |
| **Plaque** (`Plaque`) | Small cream/brass plate or engraved object surface. | Object captions | attached | Shown during that object's inspect (also visible at the hold if 15 px or larger). |
| **Board** (`SplitFlap`) | Split-flap departure board (CanvasTexture, JBM). | Services, formats, process | launch building wall | Flaps cascade per character (canvas redraw only while flipping). |
| **Terminal** (`WorldTerminal`) | CRT/monitor screen (CanvasTexture, JBM, `emon@dhaka: ~`). | Shell intro script, REPL, contact brief | desk, launch console | Types out (portfolio3 timings). A hidden DOM `<input>` mirrors keystrokes, which also brings up the mobile keyboard. |
| **Mural** (`ScrubMural`) | Large lettering painted on the workshop's back wall. | Bio story | wall | Scrub text: each word goes from 0.16 to 1 opacity with scroll (one troika mesh, one uniform). |

**Shared material rules:**
- Plates use a custom rounded-rect SDF shader (no stencil, no extra geometry): fill #11100e, a hairline whose 1px width comes from `fwidth`, and the status-strip LEDs.
- Text materials use the GPU glyph-reveal `onBeforeCompile` from research §5.3: one uniform per block and one shared program.
- Display surfaces use pre-compensated linear colours so they survive the full-frame ACES pass (`design-language.md` §6). Accent text is fed as (1.142, .036, .020).
- Bloom threshold is raised to 1.1 and night emissives (windows, beacons) are pushed above 1.5. Cream type then never blooms by accident, and accent glyphs glow only at night, on purpose.
- Carriers use `FrontSide`, `depthWrite:false` and an explicit `renderOrder`. The active stop's text turns fog off, so it stays crisp in hazy daylight.

**Mounts.** Solved per stop, per aspect, at resize; see §6.4.
- **ground**: two posts down to y=0. The island top is flat at y=0, and `insideIsland()` already exists in `src/systems/layout.ts`.
- **float**: a sign-islet. A small rock reuses the islet generator in `src/scenes/world/Island.tsx` at radius 0.8–1.4, with a grass cap and sometimes a lamp. It has a gentle bob. It **drifts up into place on arrival and sinks away on leave**, which also guarantees the flight path never passes through it.
- **wall**: on a building or room wall.
- **attached**: a child of an object, such as a book spine, a trophy plate or the globe.

---

## 3. Chapters, stops and scroll budget

There are 6 chapters and 14 stops, about 13.4 vh in total versus 18.9 today (holds 7.25 vh + computed travel 6.1 vh). Holds take about 54% of the scroll, up from 28%. Holds are not static: the camera drifts slowly (Ken Burns), so the frame stays alive.

| # | Chapter (totem) | Stop id | Kind | Hold (vh) | Travel in (vh)* | Day phase | Main carriers |
|---|---|---|---|---|---|---|---|
| 01 | Takeoff | `start` | hold | 0.70 | — (time-based 3.4 s takeoff) | 0.00 dawn, vermilion sun | Title sign-islet, rotating-word drum, "SCROLL TO FLY" ring, clock tower |
| 02 | (02) Selected work | `project-0` San Uni Academy | hold | 0.75 | 1.30 (flyover past the voxel "EMON." on the hill) | 0.20 | Facade video-wall screen, monument plate, coin-split prop |
| | | `project-1` Hasibul Gaming Point | hold | 0.75 | 0.50 | 0.26 | Screen, plate, paper-plane drones (<3 s loop) |
| | | `project-2` Dent-Assist AI | hold | 0.75 | 0.50 | 0.32 | Screen, plate, voice-waveform ring, padlocked calendar |
| | | `project-3` Esports Arena (GKEC + BOE) | hold | 0.75 | 0.50 | 0.38 | Screen, plate, bracket hologram |
| | | `more-work` | micro | 0.30 | 0.35 | 0.42 | Fingerpost: Bismillah Agro / Quran Web App / Chit-Chat / All work |
| 03 | (03) Stack | `stack` | hold | 0.80 | 0.65 | 0.50 golden | Circuit tree: 5 branches, 44 usage-sized nodes, tags, ring labels, 2 LED tickers, plinth |
| 04 | (04) About | `about` | hold | 0.90 | 0.50 | 0.62 | Workshop: mural (scrub bio), portrait, 3 principle posters, monitor terminal, inspectable objects, notes bookshelf |
| 05 | (05) The journey so far | `exp-0` … `exp-4` | 5 × micro | 5 × 0.15 | 0.40 + 4 × 0.24 | 0.72→0.86 sunset | Milestone signs on the rope bridge, lanterns, accent rope-light progress |
| 06 | (06) Launch | `launch` | end | 0.80 | 0.45 | 1.00 night | Gantry banner, process countdown stages, departure board, launch terminal (brief), contact plate, rocket |

*Travel length is **computed, not authored**: `travelVh = clamp(0.115·√arcLength, 0.12 (micro) or 0.35, 1.4)`, measured on the wide poses. Perceived speed is therefore even across moves. Today's peaks vary 3–5×; under this rule they vary at most about 2.6×. Today the intro lurches to 221 u/vh; under this rule it peaks at about 130.

**Dropped from 3D:**
- Fictional testimonials (never used).
- Self-reported stats (only if confirmed).
- FAQ and engineering standards (2D, palette and spine only). Optional stretch: standards as a "pre-flight checklist" clipboard at the launch console.
- The invented about objects (coffee, cat, guitar).
- Skill proficiency meters.

---

## 4. Chapter treatments

Composition diagrams: `W` = wide (16:9 desktop), `T` = tall (390×844). `[S]` = subject, `▭` = carrier.

### 4.1 (01) Takeoff: hero

**Carriers:**
- **Title sign-islet.**
  - A 2×1.3 m warm-black plate on a small floating rock with grass and a tiny lamp, at the start pose's left slot. It bobs gently.
  - The plate carries:
    - Eyebrow (JBM 13px, uppercase, fg-3): `(FULL-STACK ENGINEER) · DHAKA 14:32 UTC+6`. A green *ok* lamp mesh glows next to it. The minutes are live from `Intl` Asia/Dhaka; troika re-lays out once a minute.
    - Mega (Funnel 600, `-0.058em`, lh .84): `Md. Emon` / `Miah.`, with "Miah." in accent via `colorRanges` (key 0 included). 72–140 px desktop, 44–64 px phone.
    - Role line (Inter): `building` plus a **physical 4-face prism drum** set into the plate. Faces: AI voice agents / payment-ready storefronts / realtime platforms / motion-rich interfaces. It rotates 90° every 2.6 s with expo.inOut; this is portfolio3's slot machine made real.
    - Pitch (Inter 17px, wide only, verbatim, 27 words).
    - **Keycaps**: "See my work" (flies to project-0), "Play mode".
    - **Status strip**: `Open to full-time & contract roles`.
- **"SCROLL TO FLY • SCROLL TO FLY •"** curved LED ticker ring orbiting the islet's rock, 20 s per revolution. It replaces the DOM mouse hint.
- **Clock tower** in the plaza (new small landmark, or a restyled existing house). Its hands follow Asia/Dhaka time. It is seen in the flyover and used later for diegetic notifications.
- **Voxel "EMON." sign** on the north mound gains an accent period block (the footer wordmark). It is framed in the flyover between takeoff and project-0, not at the hero, so the name is not duplicated.
- **Palette:** dawn is re-keyed to the "rising sun": a vermilion sun disc and horizon over warm dark (#191714→#ff8a4c), with no navy.

**Choreography:**
- The DOM preloader (Hello → হ্যালো → স্বাগতম, a 000% counter driven by **real** loader progress, accent bar) lifts with portfolio3's curved expo.inOut edge directly into the takeoff rise.
- The title islet's glyph reveal is **chained to the takeoff clock** (`session.enteredAt`) and starts at 70% of the rise. This replaces the hand-synced CSS delays of 1.2–2.8 s (one clock instead of two).

```
W  ┌──────────────────────────────────────────────┐   T ┌──────────────┐
   │  ▭ title islet          ☀ (vermilion)        │     │ ▭ title islet │
   │  Md. Emon               ┌───────────┐        │     │ Md. Emon      │
   │  Miah.                  │ [S] island│        │     │ Miah.         │
   │  building [drum]        │  + falls  │        │     │ building[drum]│
   │  [See my work][Play]    └───────────┘        │     │ [Work] [Play] │
   │  ~ SCROLL TO FLY ring                        │     │   [S] island  │
   └──────────────────────────────────────────────┘     │   (lower 55%) │
                                                        └──────────────┘
```

Word count: wide about 40, tall 14 (no pitch).

### 4.2 (02) Selected work: four buildings

Building mapping (existing `BuildingStyle` specs restyled in the brand palette, accent per project from `content.json`):

| Slot | Project | Building | Diegetic story prop (6 draw calls or fewer, instanced) | Screen textures (1024 px WebP) |
|---|---|---|---|---|
| 0 | **San Uni Academy** (EdTech & LMS, 2025–26, NDA) | tower = lecture tower with a facade **video wall** | Coin stream splitting into 3 vendor wallets (append-only `amountCents` ledger) | `sua1`, `sua_vendor`, `sua_financials` (+ `sua_player` on the video wall) |
| 1 | **Hasibul Gaming Point** (E-commerce, 2024–25) | studio = neon arcade kiosk | Telegram paper-plane drones leave the kiosk every **3 s**, the metric made visible | `game_point1`, `game_point3`, `game_point2` |
| 2 | **Dent-Assist AI** (AI & Voice, 2025) | dome = clinic with a tooth sign | Pulsing voice-waveform ring, a phone handset, a padlock that snaps shut on a calendar slot | `dent_assist1`, `dent_assist2`, `dent_assist3` |
| 3 | **Esports Arena** = GKEC Esports + BOE Gaming Club (2024–25) | factory spec replaced by a small stadium bowl | Rotating bracket hologram (line segments), two canvas-drawn squad-poster boards (no player likeness) | `gkec3`, `boe2` + one procedural bracket slide. **Not** `gkec_hero`, `boe_hero`, `boe1`, `boe3`, `gkec1` or `gkec2`, which show real-footballer likeness. |

**Monument plate per project** (ground mount at the building's forecourt, yawed to face the stop camera within 8°):
- **Eyebrow** (JBM): `01 / 04 · EDTECH & LMS · 2025–26`
- **Title** (Funnel 600, 40px): `San Uni Academy`
- **Subtitle** (Inter, one line): verbatim from portfolio3, for example "Multi-vendor LMS, merchandise marketplace & HLS video pipeline".
- **3 metric tiles** (small split-flap tiles; numbers count up in JBM digits, so troika's missing `tnum` causes no width jitter).
  - Hasibul: `10,000+ monthly users` / `< 3.2 s checkout` / `Instant delivery`.
  - Dent-Assist: `< 450 ms voice` / `Zero double-bookings` / `Prisma / PG`.
  - Esports: `2,400+ players` / `99.9% uptime` / `500 signups/min`.
  - SUA (no numbers exist): `Adaptive HLS` / `Stripe + SSLCommerz` / `BullMQ / Redis`.
- **Keycaps**:
  - `Case study`
  - `Live site`
  - `Code`, or the mono label `CLIENT NDA` for SUA
  - The arena has `GKEC case study` and `BOE case study`.
- **Status strip**: `sanuniacademy.com · live`. This is also where "Copied" and shard messages appear.

```
W  ┌───────────────────────────────────────────────┐  T ┌──────────────┐
   │                      ┌──────────┐             │    │ ▭ plate      │
   │  ▭ plate (forecourt) │ facade   │  building   │    │ 01/04 · LMS  │
   │  01/04 · EDTECH·2025 │ SCREEN   │  [S]        │    │ San Uni Acad.│
   │  San Uni Academy     │ (shots)  │  + prop     │    │ 2 metrics    │
   │  ▢▢▢ metrics         └──────────┘             │    │ [Case][Live] │
   │  [Case study][Live]                           │    │  [S] building│
   └───────────────────────────────────────────────┘    │  + SCREEN    │
                                                        └──────────────┘
```

On tall screens: plate = eyebrow, title, subtitle, **2** metrics and 2 keycaps (about 22 words). Tapping the screen also opens the case study.

**Case study (DOM on request only, and it looks like zooming into the screen):**
1. The `Case study` keycap or a click on the screen starts an inspect blend: the camera frames the screen at 80% fill over 1.2 s expo.inOut.
2. At blend 0.85, the screen's four corners are projected to CSS px.
3. `CaseStudy.tsx` mounts with `clip-path: inset(...)` equal to that rectangle, then animates to `inset(0)` over 0.9 s expo.inOut. The screenshot is the sheet's hero image, so the 3D screen visibly *becomes* the page.
4. The sheet holds:
   - problem / solution / outcome, 4 metrics, stack, architecture, highlights;
   - a captioned gallery (all 31 screenshots across projects);
   - live / code / NDA;
   - the related note link (emon.pro/notes/...).
5. The sheet uses portfolio3 tokens: #0a0908 at .94, hairlines, no blur, no navy glass.
6. Prev/next swap the content and move the scroll to that project's hold behind the sheet, so closing lands on the right building.
7. Close reverses the clip, then the camera blend.

**`more-work` micro-stop:** a wooden-and-enamel **fingerpost** at the district's exit with 4 arms:
- `Bismillah Agro →` points to new **farm terraces** on the island's south-east edge, with a Bangla signboard "বিসমিল্লাহ এগ্রো" as a CanvasTexture (troika cannot shape Bengali; verified).
- `Quran Web App →` points to a quiet lantern **pavilion**, with no playful text, rendered respectfully.
- `Chit-Chat →` points to a small radio tower with speech bubbles.
- `All work · ⌘K`.

Each arm is a keycap that opens that project's case-study sheet. The props are seen during the flyover and in Play Mode.

### 4.3 (03) Stack: circuit tree, honest data

- **5 branches = 5 portfolio3 stack groups:**

  | Group | Tools |
  |---|---|
  | Frontend & interactive UI | 11 |
  | Backend & distributed systems | 9 |
  | Data modeling & fintech | 7 |
  | AI agents & fintech gateways | 7 |
  | Cloud, video & infrastructure | 10 |

  44 nodes in total. Today there are 4 groups with invented levels.
- **Node size and glow = number of shipped projects using the tool**, from `content.json` usage. For example React 8, Tailwind 8, Next.js 7, TypeScript 6. The meter list is gone. "Three.js & R3F" has 0 listed projects, so its tag reads `Three.js & R3F — you're inside it`.
- **Node tags**: enamel tags hanging from the 16 most-used nodes (8 on phones), using `Billboard lockX lockZ` plus a constant screen size of at least 12px. They are depth-tested and occluded by the trunk. They replace the 4–12 px DOM pills.
  - Hover, focus or tap a node and its tag **flips** (split-flap) to `Shipped in 7 projects`.
  - The circuit trace from that node to the rim lights in accent: portfolio3's laser line, restyled from cyan/green/purple to accent and glow.
- **Ring labels**: the 5 group names curve around the platform rim at each branch's base (troika `curveRadius`).
- **2 LED tickers** around the trunk: portfolio3 marquee row A (filled cream) and row B (outlined, `fillOpacity 0` + stroke). Speed is boosted by Lenis velocity.
- **Plinth label** (museum-style, front of the platform): `(03) Tools I reach for.` / `Everything here has shipped in production work, not just a tutorial.`
- **Fix:** move the lamp post out of the sightline (it currently stands in front of the tree). Add a `LAMPS` exclusion for the stop camera's frustum.

### 4.4 (04) About: the workshop owns its words

The room is restocked with **real** objects. Each object carries its own text on its own surface: an engraving, a spine, a screen or a tag. There are no tooltips.

| Object | Carries (verbatim from portfolio3) | Carrier |
|---|---|---|
| **Back wall mural** | Wide: "I'm Emon, a full-stack engineer in Dhaka. I build fast, secure Next.js products, from payment-automated storefronts to AI voice booking agents, and I care as much about how they feel as how they run." Tall: "A full-stack engineer from Dhaka who likes backends that stay correct and interfaces that feel alive." | `ScrubMural`: scrub text 0.16→1 per word with scroll (signature move #8) |
| **Portrait frame** | `developer.jpg` (1024 px) with a name plaque `Md. Emon Miah · Dhaka` | drei `Image`, clip-reveal shader (bottom-up inset, de-zoom 1.25→1) and a vermilion rim-glow edge that echoes the photo's rim light |
| **Desk + monitor** | `emon@dhaka: ~` shell: `whoami` / `cat stack.txt` / `./now.sh`, then a REPL with help, projects, skills, now, github, contact and the `sudo` joke | `WorldTerminal` (CanvasTexture + hidden input). Click to type. |
| **3 framed posters** | "Ship small, learn fast." / "Type everything, trust nothing." / "Motion with a reason." Each has its one-line explanation on inspect. | Poster plates, Funnel with an accent period |
| **Bookshelf = Notes** | 6 spines = the 6 engineering notes, for example "Idempotent payment webhooks". Inspect slides a book out to show title, date and project; Enter opens emon.pro/notes/... | attached spines |
| **Desk robot** (orange, a nod to Dent-Assist's mascot) | "Agentic AI: using AI agents to design, refine and secure real systems." | small display in its chest |
| **Couch + TV + gamepad** | TV shows a mini leaderboard: "Gaming & anime — the reason half my projects have a leaderboard." | canvas screen |
| **Trophy** | "Competitive coding — algorithms keep the problem-solving muscle honest." | engraved plate |
| **Globe** | 3 hanging tags: `বাংলা · Native` (CanvasTexture), `English · Professional`, `Hindi · Conversational` | attached tags |

**Hold view:** the mural, the portrait and the poster titles are readable. Interactive objects get a faint accent edge-light, and the cursor ring shows the label "Open" on fine pointers.

**Inspect (tap or click or Enter on an object):**
- The camera blends to a pose computed from that object's bounds (1.2 s expo.inOut).
- The object's own text reveals.
- `◀ ▶` keycaps on the shelf edge cycle through the objects; this is the phone path.
- Esc, the `Back` keycap or a scroll attempt returns to the hold.

**Removed:** coffee, cat, guitar, the hint bulbs, the 7 `<Html>` tooltips, the DOM about list, and the lamp post that occludes the room.

```
W ┌───────────────────────────────────────────────┐ T ┌──────────────┐
  │  MURAL (scrub): I'm Emon, a full-stack …      │   │ MURAL (3–4   │
  │  [portrait]  [poster][poster][poster]         │   │ lines, scrub)│
  │      desk+monitor   shelf(notes)  globe       │   │ [portrait]   │
  │  couch+TV    robot   trophy                   │   │  room [S]    │
  └───────────────────────────────────────────────┘   │ ◀ object ▶  │
                                                      └──────────────┘
```

### 4.5 (05) The journey so far: the bridge is the timeline

The about→finale swoop is today the fastest move: 69 u with a 178 u/vh peak. It becomes a slow walk along the rope bridge with **5 micro-stops**, one per milestone. Each milestone is a **road-sign plate on a bridge post**, facing the oncoming camera, with a lantern that lights as you arrive:

| Stop | Eyebrow | Title | Line |
|---|---|---|---|
| exp-0 | `2020 — 2024` | Diploma in CSE | Habiganj Polytechnic Institute |
| exp-1 | `2024 · 3 MONTHS` | Full-Stack Developer Intern | IBCSX PRIMEx · Laravel, MySQL |
| exp-2 | `2024 — 2025` | Front-End Developer | Lilium Info Tech · LCP improved 35% |
| exp-3 | `2024 — 2028` | B.Sc. Computer Science & Technology | Bangladesh University · in progress |
| exp-4 | `2025 — NOW` | Full-Stack Engineer, Independent | Voice agents, payment storefronts, esports platforms |

- An **accent rope light** along the handrail fills with chapter progress. This is the laser line (signature move #19).
- The sky goes from sunset to dusk across the 5 stops.
- Each sign gets a 0.15 vh hold plus snap, and about 0.24 vh of travel between signs; about 10 words each.
- Totem at the bridge head: `(05) The journey so far.`

### 4.6 (06) Launch: contact plus services as a launch sequence

- **Gantry banner** (Funnel, large): `Let's build something` / `worth shipping.` (accent). This is the portfolio3 footer line.
- **Process as countdown:** 4 illuminated stages up the gantry, `T-4 UNDERSTAND`, `T-3 DESIGN`, `T-2 BUILD`, `T-1 SHIP & TUNE`. They light in sequence, scrubbed across the hold. On inspect, each stage shows its one-line description.
- **Departure board** (split-flap, on the launch control hut):
  - Page 1, `PICK YOUR FORMAT`: `Full-time roles · Frontend or full-stack · BOARDING` and `Contract & project work · MVPs, AI, payments · BOARDING`.
  - Pages 2–3, `SERVICES`: 8 rows such as `01 FULL-STACK WEB APPS → SAN UNI ACADEMY` and `04 AI VOICE AGENTS → DENT-ASSIST`. The board pages every 5 s (manual ◀ ▶ under reduced motion).
  - Clicking a row flies to the matching building (curtain jump).
- **Launch terminal** (existing console, upgraded): `emon@dhaka:~$ ./brief`.
  - This is portfolio3's 3-step brief, run as a terminal dialogue. Real hidden `<input>`/`<textarea>` elements with labels are mirrored onto the canvas:
    1. need (5 options)
    2. "Tell me about it" plus timeline
    3. name, email, company
  - Send POSTs to `/api/contact`.
  - **On success the rocket launches.** The existing launch animation becomes the "message sent" confirmation, which fixes the current "Launch contact rocket 🚀" button.
  - Fallback: if the API returns 503 or is not deployed, a pre-filled `mailto:` opens.
  - `Prefer a simple form?` opens the DOM `ContactTerminal` sheet.
- **Contact plate** on the console side: `maremon15@gmail.com` · `WhatsApp +880 1785 892074` · `GitHub` · `LinkedIn` · `Facebook`. Each row is a hit target that opens the link.
- **Keycaps:** `Start a brief`, `Copy email` (flips to `Copied`), `Play mode`.
- **Status strip:** `DHAKA 21:04 UTC+6 · REPLIES BY EMAIL`.
- Night palette: sky #0a0908→#191714 with a faint vermilion city glow, cream stars, warm floodlights.

---

## 5. What replaces each current overlay surface

| Current surface (file) | Fate | Replacement |
|---|---|---|
| **Hero block** (`Hero` in `src/ui/Journey.tsx`, `.hero-card`) | Removed | Title sign-islet (§4.1): mega name, drum, keycaps, status strip, "SCROLL TO FLY" ticker. Availability = status strip plus the green lamp. Dhaka clock = eyebrow plus the clock tower. The DOM `<h1>` stays in the sr-only spine. |
| **Left glass card**: `ProjectCard`, `SkillsCard`, `AboutCard`, `FinaleCard` (`.card`) | Removed, with about 600 lines of CSS | Project monument plates plus facade screens; stack plinth, tags and rings; workshop mural, posters and objects; bridge signs; gantry, board and terminal (§4). |
| **Nav chapter pill** (`src/ui/Nav.tsx .chapters`) | Removed | Chapter **totems** in the world, seen in flight. Navigation moves to the ⌘K palette (Chapters group), number keys `1–6` and `J/K` for next/prev stop. |
| **Progress rail** (`.progress-rail`) | Removed | A **2px accent progress line** across the top edge (portfolio3 signature) with 6 hairline chapter ticks. |
| **Brand "◆ Emon"** + sound/2D/Play pills | Restyled to bare text | The prompt logo `[ > _` + "Emon Miah", top-left. Top-right: `Menu ⌘K` · `2D` · `Sound off` · `Play`, as mono text with a hairline underline on hover. No backgrounds or blur. Colour flips with `live.night` (ink by day, cream by night) for contrast. The sound state is spelled out, which fixes the "...." icon. |
| **Skill pills** (`<Html>` in `src/scenes/skills/SkillsGarden.tsx`) | Removed | SDF node tags (depth-tested, 12px or larger, usage counts), curved group rings, LED tickers (§4.3). |
| **About tooltips + list** (`<Html>` in `src/scenes/about/AboutWorkshop.tsx`, `AboutCard` list) | Removed | Each object carries its own text; inspect dolly; `◀ ▶` keycaps; mural, posters, portrait (§4.4). |
| **Hint bulbs** (About) | Removed | Accent edge-light on interactive meshes plus the labelled cursor ring ("Open", "View", "Type", "Launch"). |
| **Project modal** (`src/ui/ProjectModal.tsx`, `Modal.tsx`) | Rebuilt as `CaseStudy.tsx` | On request only. It grows out of the 3D screen with a clip-path handoff (§4.2), uses portfolio3 styling, and holds the real case-study content. |
| **Building billboard on posts** (dome spec, `ProjectsDistrict.tsx`) | Removed | The screen sits flush in the facade. Text moves to the forecourt plate. |
| **Toasts** (`src/ui/Toasts.tsx`) in journey mode | Replaced | **Diegetic status lines**: messages run on the active stop's plate status strip and the clock-tower LED band ("maremon15@gmail.com copied", easter eggs), plus a sr-only `aria-live`. Play Mode toasts stay in PlayHud (restyled later). The WebGL-crash toast stays, because it fires in 2D mode. |
| **"Tip: click the building"**, "Scroll to fly" mouse hint | Removed | Cursor label "View" plus a screen boot animation; the "SCROLL TO FLY" ticker ring. |
| **Loader** (`index.html`, `src/ui/loader.ts`) | Re-skinned (DOM) | portfolio3 preloader: name / "Portfolio © 2026", the Hello → হ্যালো → স্বাগতম greetings in DOM (Noto Sans Bengali), a 000% counter driven by real progress, an accent bar, Enter / Enter with sound / Skip to 2D as `.btn` pills, and a curved expo.inOut lift into the takeoff. |

**DOM that remains in 3D mode:** the frame (logo, 4 text controls, progress line), the custom cursor (fine pointers), and transient on-request layers: ⌘K palette, case-study sheet, contact-form fallback, and the curtain for far jumps. Plus the invisible spine.

---

## 6. Camera and text choreography

### 6.1 Timeline from data (replaces DOM-measured stops)

`src/content/journey.ts` holds `StopDef[]`:

```ts
interface Pose { pos: V3; target: V3 }
interface StopDef {
  id: string; chapter: ChapterId; kind: 'hold' | 'micro' | 'end'
  hold: number                                  // vh of scroll
  pose: { wide: Pose; tall?: Pose }             // tall omitted → auto-framed from subject sphere
  drift: { wide: Pose; tall?: Pose }            // pose at the end of the hold (Ken Burns)
  subject: { center: V3; radius: number }
  day: number
  carriers: CarrierDef[]
}
interface CarrierDef {
  id: string; type: 'plate'|'totem'|'screen'|'ticker'|'plaque'|'board'|'terminal'|'mural'
  mount: 'ground'|'float'|'wall'|'attached'
  slot?: { wide: [x: number, y: number]; tall: [x: number, y: number]; distance: number; yaw?: number; widthPx: number }
  attach?: string
  content: { wide: CarrierContent; tall?: CarrierContent }   // tall = shorter copy (≤25 words/stop)
  target?: string                                            // id shared with the spine control & focus ring
}
```

`src/systems/timeline.ts`:
- **Builds:** travel vh from the wide-pose arc lengths (§3 formula), then the hold and travel ranges in progress space.
- **Writes the same `journey.stops` / `journey.chapters` Maps and `journey.version`.** Consumers keep working unchanged: building rise in `ProjectsDistrict.tsx` L175, `SkillsGarden`, `AboutWorkshop`, the Play preload in `App.tsx`.
- **Scroll length:** the spine sections take `height: calc(<vh> * 100svh)`, plus one `100lvh` tail.
- **Progress:** computed as `scrollY / (totalVh × svhPx)`, where `svhPx` is measured once from a `100svh` probe. The mobile address bar therefore never moves a stop.
- **Drops** `document.fonts.ready → refreshScroll` and the `[data-stop]` measurement in `measure()`.
- **Sets** `ScrollTrigger.config({ ignoreMobileResize: true })`.

### 6.2 Camera path: arc-length plus a C1 speed profile (no stop-and-surge)

`src/systems/cameraPath.ts` is rewritten.

1. **Poses per aspect:** `w = smoothstep(0.75, 1.15, aspect)`, then `pose = mix(tall, wide, w)`. It is continuous, so the 820×1180 tablet gets a correct blended framing; today's JS aspect and CSS width breakpoints disagree.
   - A missing `tall` pose is auto-framed: distance `d = r / sin(min(vfov, hfov)/2) · 1.1` along the wide view direction.
   - The aim point is raised by `0.22 × visibleHeight(d)`, so the subject sits in the lower 55% and the top band is free for carriers.
   - **This removes `setViewOffset` and the `1 + (1/aspect − 1)·0.42` pull-back entirely.** Play Mode's `clearViewOffset()` becomes a harmless no-op.
2. **Curves:** centripetal Catmull-Rom over hold-start, hold-end and waypoint poses (as today), with `arcLengthDivisions = 4000`. The position is sampled **by distance** (`getUtoTmapping`). The target curve is evaluated at the same index-space parameter as the position, so they never drift apart.
3. **Speed profile per travel run.** In a run of Δp progress and arc length L, between hold A (drift speed `va`) and hold B (`vb`), with x ∈ [0, 1] and acceleration fraction a = 0.22:
   ```
   S(t) = 3t² − 2t³                                   // C1 smoothstep
   v(x) = va + (vc − va)·S(x/a)           x < a
        = vc                              a ≤ x ≤ 1−a
        = vc + (vb − vc)·S((x−1+a)/a)     x > 1−a
   vc  = (L/Δp − a·(va+vb)/2) / (1 − a)               // closed form so ∫v = L
   s(x) is the analytic integral (∫S = t³ − t⁴/2).
   ```
   - Velocity is continuous into and out of holds: no 5→0 kink.
   - Peak to mean is 1.28. Today's easeInOutCubic peaks at 3× its mean, before the index-space lurches are added on top.
   - The "near-zero motion" zone (under 10% of peak) shrinks from about 16% of the run at each end to about 4.3% at each end. That removes the 1.2 vh frozen-then-burst feeling the audit measured.
   - Holds move at constant `va = L_hold/Δp_hold` along the pose→drift segment.
4. **One smoothing stage.** Lenis `lerp 0.1` plus a `maath/easing` `damp3` critically damped spring: position 0.25 s, look target 0.30 s (slightly lazier so the view never swings). Pointer parallax (±0.6 u) is applied after the spring.
5. **Snap:** `lenis/snap`, `type: 'proximity'`, `distanceThreshold: '30%'`, `duration: 0.9`, `easing: 1−(1−t)^4`, `debounce: 260`, with points at hold centres (micro-stops included). Snap stops during inspect, the case study, the palette and Play Mode. On touch it is tested and may be disabled if it fights momentum (risk §11).
6. **Premium micro-motion** (off under reduced motion):
   - FOV breathing +3° at cruise speed, springed; `updateProjectionMatrix` only on a change of 0.01° or more.
   - Bank up to 2.5° from lateral acceleration.
   - **Rack focus:** TiltShift2 blur goes from 0.09 to 0 as `holdWeight` goes to 1, so arrival feels like a focus pull and text and screens are never blurred.
7. **Takeoff:** keeps the time-based 3.4 s rise, but everything keys off `session.enteredAt` (the title reveal at 70%).

### 6.3 Phases and the text grammar

`src/systems/phase.ts` gives `stopPhase(id)` → `before | arriving | holding | leaving | after`, plus `t`, `holdWeight` and `settled`.

- `settled` means holding **and** the spring's camera speed has stayed below 0.8 u/s for 120 ms.

| Beat | Trigger | What moves | Timing / ease |
|---|---|---|---|
| **Approach** | `arriving`, last 25% of travel | Sign-islets drift up into place (float mount); plate displays warm (emissive 0.15→0.6); screens leave "recede" (scale .93→1, brightness .5→1) | Scrubbed with progress |
| **Power-on** | `settled` | Glyphs per block rise from 112% with scale .55→1 and fade. Order is left-to-right, then top-to-bottom, from `aTroikaGlyphBounds` (never `aTroikaGlyphIndex`). | 1.1 s, CustomEase `em` = `0.22,1,0.36,1`, about 28 ms per char-equivalent |
| **Stagger inside a carrier** | — | eyebrow 0 → title +0.08 → subtitle +0.20 → metrics +0.30 (counters count 0→n over 1.2 s, JBM digits) → keycaps +0.45 (scale .9→1) → status strip +0.6 (types at 30 ms/char) | — |
| **Screens** | `settled` | Boot wipe, de-zoom 1.25→1, then slideshow crossfade every 3.5 s | 1.8 s `em`; slideshow paused under reduced motion |
| **Scrub text** | `holding` | Mural words 0.16→1 opacity with hold `t` | Scrubbed |
| **Leave** | `leaving`, or scrolling more than 15% out of the hold | Glyphs exit up and fade (mirrored order); displays dim; islets sink; screens recede (scale .93, brightness .5) | 0.45 s `power2.in` |
| **Fly-through without settling** | Velocity stays high | No power-on at all. Displays stay idle (the `[ > _` logo screensaver on screens). | Never shows half-revealed text |
| **Reverse into a hold** | `settled` again | Re-trigger power-on | Same |

**Mid-travel, the frame is clean:**
- the previous stop's text is off;
- the next stop's carriers are visible as world objects with idle displays;
- chapter totems read at speed;
- the world stays alive (birds, prop loops, tickers).

Nothing jumps, because no element is in normal document flow.

### 6.4 Carrier placement solver (stop-anchored slots, grounded)

`src/systems/slots.ts` extends research §3.2:
1. **Solve the slot.** For each carrier with a `slot`, take the stop's hold-centre pose at the current aspect (no view offset). Unproject the NDC slot at `distance`. This gives position, the stop camera quaternion and an optional yaw toward the subject (8° or less).
2. **Size from CSS px.** `worldPerPx = 2·d·tan(fov/2)/innerHeight`, then `fontSize = px × worldPerPx × textScale`. Plate width = `min(widthPx, 0.86·innerWidth)` × worldPerPx. Browser zoom and the text-size setting are honoured automatically.
3. **Ground it.**
   - `ground` mount: if the point is `insideIsland()`, extend posts to y=0.
   - Otherwise fall back to a `float` sign-islet.
   - `wall` and `attached` use authored anchors (not slots) plus the same px sizing.
4. **Clear the path.**
   - Sample the camera path over the incoming and outgoing travel. If the carrier's bounding sphere intersects the camera (±1 u), push it out along its view ray and scale the font proportionally so the on-screen px stay the same.
   - A `?debug` overlay draws slots, bounds, the 12px floor and sightline raycasts to the plate's 4 corners. Any mesh crossing a corner is flagged.
5. **When to re-solve.** On resize (debounced 150 ms), on orientation change, on a text-size change and on a content swap (case-study prev/next).
   - Solving is cheap: 14 stops, about 30 carriers.
   - troika re-layout happens only when `maxWidth` crosses a breakpoint, to avoid worker churn.

### 6.5 Jumps, inspect and reduced motion

- **Nav jumps (palette, number keys, keycaps):**
  - Adjacent stops: Lenis `scrollTo` with `duration = clamp(0.6 + 0.35·Δvh, 0.8, 1.8)` and CustomEase `cam` (`0.65,0,0.2,1`).
  - Jumps across more than one chapter: the **curtain**. It is portfolio3's accent-then-bg panels with a curved arc, the destination word plus an index ("Launch", "06"), 0.72 s cover. Behind it: immediate scroll, `session` snaps the camera, then a 0.85 s reveal.
  - This fixes the current 2.2 s rip through the whole island that flashes every card.
- **Inspect** (case study, about objects, terminals, board):
  - Pose blending inside `JourneyCamera`; there is never a second controller.
  - `inspectW` is tweened 0→1 over 1.2 s `expo.inOut`. The pose comes from object bounds (fit-to-box with padding, aspect-aware).
  - `lenis.stop()` + `snap.stop()`.
  - Exit with Esc, the Back keycap or a wheel/touch-move attempt, over 1.1 s `power3.inOut`.
  - On phones with the keyboard open (terminal), framing uses `visualViewport` so the screen sits above the keyboard.
- **Reduced motion:**
  - Lenis is already off.
  - On a stop change: a **cut**. The canvas crossfades through the sky colour in 180 ms and the camera jumps to the pose.
  - Glyph reveals become 200 ms opacity fades.
  - No drum rotation (first phrase shown; all 4 in the spine), no slideshow autoplay (manual ◀ ▶), no bobbing, no FOV breathing, bank or parallax, no ticker motion, and the mural is fully lit.
  - The curtain is skipped.

---

## 7. Brand carried into 3D

| portfolio3 move | 3D translation |
|---|---|
| Palette #0a0908 / #f2eee6 / #ff4a2e / #ff8a4c, grain .07 | `src/systems/dayNight.ts` re-keyed: dawn = vermilion rising sun, day = cream light theme (#efebe3 fog and sky, warm not blue), night = warm black #0a0908→#191714 with a vermilion city glow. Cyan `crystalMat` and the `#7ff3ff` focus rings become accent. postprocessing `Noise` (OVERLAY, .07) on high tier. Plates #11100e; compensated accent linear (1.142, .036, .020). |
| Funnel 600 mega, `*accent*` word, closing period | Title islet "Md. Emon / Miah.", gantry banner "worth shipping.", posters "Ship small, learn fast." (`colorRanges` with key 0). |
| Inter for reading, JBM uppercase eyebrows with `(Label)` and accent parens | All plates: eyebrows `(02) SELECTED WORK`, `01 / 04`, mono metric digits. |
| Masked rise-in, 28 ms/char, 1.1–1.4 s, house ease, ready gate | GPU glyph reveal from 112%, gated on `settled` (the 3D "ready gate"). |
| Terminal identity `[ > _`, `emon@dhaka: ~`, REPL with the sudo joke, ⌘K | Workshop monitor terminal, launch terminal brief, the `[ > _` screensaver on idle screens, an optional extruded prompt mark on the launch tower, ⌘K palette (DOM). |
| Bilingual preloader + 000% counter + curved lift | DOM preloader driven by real progress, lifting into the takeoff. |
| Accent+bg curtain naming the destination | Far jumps only. |
| Live Dhaka clock + green ping | Title-islet eyebrow, clock tower hands, launch status strip. |
| Scrub text | Workshop mural. |
| Labelled cursor + magnetic | DOM cursor dot plus ring labelled by R3F hover ("View", "Open", "Type", "Launch"); keycaps lean toward the pointer up to 7°. |
| Rotating-word slot machine | Physical prism drum. |
| Velocity marquee (outline row), circular badge | LED tickers around the trunk; "SCROLL TO FLY" ring. |
| Stacked cards recede (scale .93, brightness .5) | Facade screens recede as the camera leaves. |
| Laser line | Accent circuit traces (stack), bridge rope light (journey). |
| Footer "EMON." | Voxel sign gains the accent period block. |
| Zero emoji | All 27 emoji removed. String lint blocks emoji, → ↗ ✕ and Bengali in troika strings, so troika's jsDelivr fallback font fetch can never fire. |

**Fonts:**
- 3D: real static TTFs from `scratchpad/fontreal/` → `public/fonts/`.
  - FunnelDisplay-600 (13.8 KB gz)
  - Inter-400 (31.4 KB gz; about half after a Latin subset with `pyftsubset`)
  - Inter-500 for keycaps (optional)
  - JetBrainsMono-400 (27.7 KB gz)
  - Check every file's first 4 bytes are `00 01 00 00`: the earlier `fontprobe` files are WOFF2 inside and troika rejects them.
  - Preloaded in the loader with `preloadFont({font, characters})`, using the charset of all journey strings (computed at build time).
- DOM: portfolio3's WOFF2 variable files plus `OFL.txt` through `@font-face`. Canvas textures (terminal, board, Bengali) load them through `FontFace` first.
- Drop `@fontsource-variable/bricolage-grotesque`, `/inter` and `/jetbrains-mono`.

**Render tier:** this proposal deliberately uses **no drei `<Hud>`**. All type is Tier A (in-world, lit, fogged, occluded), with compensated colours and a re-keyed bloom threshold. That is the purest version of the diegetic idea. It also avoids the "Hud = HTML card again" trap the research warned about.

---

## 8. Mobile (390×844 portrait, and tablets)

- **Framing:** tall poses (authored or auto from the subject sphere). The subject sits in the lower 55%; carriers go to the top band, ndc y 0.45–0.9, mostly `float` sign-islets because the top band is sky. This replaces the 36–51% bottom sheet. The 3D view gets the full screen.
- **Copy:** `content.tall` variants, 25 words or fewer per stop.
  - Projects: eyebrow, title, subtitle, 2 metrics, 2 keycaps.
  - Hero: no pitch.
  - About: short lead on the mural.
  - Stack: 8 tags.
  - Board: 4 rows per page.
- **Type floor:** body 15px, eyebrow 11–12px, title 28–32px, mega 44–64px. All in CSS px, so zoom is honoured.
- **Touch:**
  - Taps only; no hover-dependent info.
  - Every keycap, object and node gets an **invisible hit mesh of at least 44×44 CSS px** (sized from `worldPerPx`), with `meshBounds` raycasting.
  - The existing `e.delta > 8` drag guard is kept.
  - No pinch or orbit; vertical swipe = scroll + proximity snap.
- **Inner scroll removed:** nothing needs nested scrolling (the About/Skills sheets did).
- **Keyboard on the terminal:** hidden input focus brings up the keyboard; the inspect pose uses `visualViewport` height; a "simple form" fallback is always present.
- **Budget (low tier):**
  - DPR 1.25 or less, no shadows, no TiltShift, no Noise (all existing low-tier rules).
  - Screenshots at **768 px**, active and next project only (`useTexture.clear` for the rest).
  - Canvas textures redraw at 15 fps or less, only when on screen and in their chapter.
  - Only the active chapter's text meshes are `visible`.
- **Tablet (820×1180) and short laptop (1366×657):** the continuous aspect blend plus px-sized slots means no breakpoint mismatch and no nav collision. The nav is bare text with no box, and no carrier is placed under the top 72px.

---

## 9. Accessibility

1. **The semantic spine.** `src/ui/Journey.tsx` becomes `src/ui/Spine.tsx`.
   - Same chapter and stop order, full semantic content: `h1` name, `h2` per chapter, project `article`s with metrics lists and links, the about lists, the timeline `ol`, services `dl`, contact links.
   - Section heights come from the timeline data.
   - Content is visually hidden with an `.sr-only` clip. **No `display:none`, no `aria-hidden`.**
   - Every 3D control has a spine twin that shares `data-target`.
2. **Focus mirroring.** `focusin` on a spine control:
   - scrolls to its stop (0.8 s, or a cut under reduced motion);
   - sets `store.focus3d`, which draws a **3D focus ring** (accent outline quad plus a 4% lift) on the matching keycap, object or node;
   - shows a plain-text **focus caption** at the bottom ("Case study, San Uni Academy. Press Enter.") with a text shadow and no box.
   - Enter or Space runs the same action as the mesh click.
3. **Keyboard:**
   - Tab follows journey order.
   - `J`/`K` go to the next/prev stop; `1–6` jump to chapters; `⌘K` or `/` opens the palette.
   - Esc exits inspect or closes sheets.
   - Typing in a terminal input suspends the shortcuts (portfolio3 rule).
   - The canvas stays `aria-hidden`.
4. **Live captions.** One `aria-live="polite"` region, updated on `settled` at a new stop, debounced 400 ms, never during fast flight. Example: "Selected work, 1 of 4: San Uni Academy. Multi-vendor LMS. Case study and Live site available."
5. **Reduced motion:** see §6.5. It follows portfolio3's contract: no preloader animation, no curtain, reveals jump to their final state.
6. **Contrast and size.**
   - Plates are about 15:1, cream on #11100e.
   - `prefers-contrast: more`: 2px plate hairline, Inter 500, accent words gain an underline (colour is not the only cue), TiltShift off, fog off on carriers.
   - The palette action "Text size 1× / 1.25× / 1.5×" feeds `textScale`; slots re-solve and switch to the tall layout if the width overflows.
7. **2D mode.** `FlatSite` is re-skinned with portfolio3 tokens. It is the complete read-along: services, FAQ, standards, notes, the full project list. It also stays the WebGL-crash fallback and the "Skip to content" target. It reads the same `content.ts`.
8. **SEO / no-JS:** all content is in the spine and FlatSite DOM. `<noscript>` is generated from `content.ts` as today.
9. **Not adopted:** `@react-three/a11y` (last release 2022, zustand 3). The spine does the job.

---

## 10. Performance budget

Baseline measured in this session with `?debug` RenderInfo (`scratchpad/tools/perfbase.cjs`, SwiftShader; calls include composer passes):

| Stop | 1440×900 high: calls / tris / tex | 390×844 low: calls / tris / tex |
|---|---|---|
| start | 138 / 69.2k / 19 | 88 / 35.2k / 12 |
| project-0..3 | 125–138 / 64.6–68.8k / 20–23 | 65–76 / 31.0–32.6k / 14–17 |
| skills | 89 / 61.8k / 23 (+15 DOM pills) | 42 / 28.8k / 17 |
| about | 103 / 62.1k / 23 (+6 DOM tips) | 54 / 29.2k / 17 |
| finale | 163 / 72.4k / 23 | 98 / 37.5k / 17 |

**Budget for the redesign:**

| Item | Desktop high | Phone low |
|---|---|---|
| Added draw calls at any stop (text + plates + props) | +45 or fewer (stop total 210 or fewer) | +25 or fewer (total 125 or fewer) |
| Visible troika blocks | 40 or fewer (active chapter only, others `visible=false`) | 20 or fewer |
| Added triangles | +15k or fewer (props are instanced, low poly) | +8k or fewer |
| Screenshot textures (GPU) | 4 projects × 3 at 1024 px ≈ 45 MB | active + next at 768 px ≈ 12 MB |
| Canvas textures live | 3 or fewer (terminal, board, one prop), redraw 15–30 fps only when visible | 2 or fewer at 15 fps or less |
| New JS (gz) | troika 41.5 + maath 1.1 + lenis/snap 2.0 + CustomEase ≈ 46 KB, all in the lazy `Experience` chunk | same |
| Fonts (gz) | Funnel 13.8 + Inter about 16 (subset) + JBM 27.7 ≈ 58 KB, preloaded in the loader | same |
| Frame target | 60 fps on a mid laptop iGPU | 30 fps floor (PerformanceMonitor steps down) on mid Android |

**Wins that pay for the text:**
- Removing `backdrop-filter` blur from the card, nav and toasts over a canvas that redraws every frame.
- Removing 21 drei `<Html>` elements that write styles every frame.
- Removing ScrollTrigger reveal handlers.
- Removing DOM measurement on fonts and resizes.
- The **demo canvas redraw** (24 fps per building) is replaced by static screenshots plus a crossfade uniform.

**No hitches:**
- Fonts are preloaded and strings laid out during the loader.
- All text materials are compiled in `SceneReady`: carriers are mounted visible at `fillOpacity 0`, because `gl.compile` only walks visible objects. Alternatively use `gl.compileAsync`.
- `useTexture.preload` for the next chapter on idle (it calls `gl.initTexture`).
- Each chapter's text is wrapped in its own `<Suspense fallback={null}>`, so a late `<Text>` can never blank the canvas.

---

## 11. Engineering plan for this codebase

### 11.1 Files

**New:**
- `src/brand.ts`: tokens, compensated linear colours, font URLs, eases (`em`, `cam`), stagger and durations.
- `src/content/journey.ts`: StopDef data (poses, holds, carriers, copy variants).
- `src/systems/timeline.ts`: data → scroll length, `journey.stops` / `journey.chapters`, travel vh from arc length.
- `src/systems/phase.ts`: `stopPhase`, `holdWeight`, `settled`, `useStopPhase`.
- `src/systems/slots.ts`: carrier placement solver, mounts, path clearance, `?debug` overlay.
- `src/scenes/text/fonts.ts`, `WorldText.tsx` (px sizing, compensated colour, FrontSide, renderOrder, reveal material), `glyphReveal.ts`, `charset.ts` (build-time charset).
- `src/scenes/sign/SignPlate.tsx` (SDF plate shader + status strip), `Keycap.tsx`, `Totem.tsx`, `LedTicker.tsx`, `Plaque.tsx`, `SplitFlap.ts`, `WorldTerminal.tsx` (CanvasTexture + hidden input bridge), `ScrubMural.tsx`, `SignIslet.tsx`, `FocusRing.tsx`, `CanvasLabel.ts` (Bengali).
- `src/scenes/intro/TitleIslet.tsx` (drum, ring), `src/scenes/world/ClockTower.tsx`.
- `src/scenes/projects/ProjectScreen.ts` (screenshot shader: rounded, de-zoom, crossfade, recede, idle logo), `ProjectPlate.tsx`, `props/{LedgerCoins,PaperPlanes,VoiceRing,BracketHolo}.tsx`, `MoreWork.tsx` (fingerpost, farm terraces, pavilion, radio tower), `buildings/arena.ts`.
- `src/scenes/journey/BridgeMilestones.tsx` (signs, lanterns, rope light).
- `src/scenes/finale/{DepartureBoard,GantryStages,LaunchTerminal,ContactPlate}.tsx`.
- `src/ui/Spine.tsx`, `Chrome.tsx` (logo, text controls, progress line), `Palette.tsx` (⌘K), `Curtain.tsx`, `Cursor.tsx`, `CaseStudy.tsx`, `FocusCaption.tsx`.
- `api/contact.ts`: Vercel function porting portfolio3 `app/api/contact/route.ts`. Validation, honeypot `hp`, 4 messages per 10 min per IP (best effort per instance), Resend via plain `fetch` (no SDK dependency), auto-reply, 503 → mailto fallback. Env vars: `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (default maremon15@gmail.com), `CONTACT_FROM_EMAIL`.
- `scripts/assets.mjs`: copies the chosen portfolio3 screenshots and `developer.jpg`, resizes them to 1024 and 768 WebP, writes a manifest.
- `scripts/check-strings.mjs`: fails the build if a troika string contains code points outside the TTF cmaps (emoji, → ↗, Bengali).

**Rewritten or changed:**
- `src/content.ts`: real data (`content.md` §13 mapping). The project type gains `subtitle`, `metrics[]`, `screens[]`, `caseStudy`, `privateLabel`, `highlights`, `problem/solution/outcome` and `noteUrl`. `skillGroups` become 5 groups with `projects[]` (usage) and no `level`. About objects and shards use the real 8 and 12. `chapters` grows to 6. All emoji removed.
- `src/systems/scroll.ts`: Lenis lerp 0.1, snap, and `scrollToStop` from timeline data. `measure()` and the DOM lookups in `scrollToChapter` are removed. `onProgress` uses the svh-based progress.
- `src/systems/cameraPath.ts`: per-aspect poses, arc-length sampling, speed profile, micro-stops.
- `src/scenes/JourneyCamera.tsx`: **`setViewOffset` deleted**, the portrait pull-back deleted, `damp3` spring, FOV breathing, bank, inspect blending, reduced-motion cuts. Takeoff is unchanged in feel.
- `src/scenes/environment/Effects.tsx`: TiltShift rack focus (ref plus `holdWeight`), bloom threshold 1.1, Noise grain on high tier.
- `src/systems/dayNight.ts`: brand palettes; night emissives above 1.5.
- `src/scenes/projects/ProjectsDistrict.tsx`: screens use screenshots; the billboard posts are removed; restyle; the plate and props are mounted; the click opens the inspect → case study. Rise keeps reading `journey.stops`.
- `src/scenes/projects/demoScreen.ts`: reduced to the idle `[ > _` screensaver, or deleted.
- `src/scenes/skills/SkillsGarden.tsx`: 5 groups and 44 usage-sized nodes; delete `<Html>`; add tags, rings and tickers.
- `src/scenes/about/AboutWorkshop.tsx`: new objects; delete the `<Html>` tooltips and hint bulbs; mural, portrait, posters, terminal, inspect.
- `src/scenes/intro/Landmarks.tsx`: "EMON." accent period block; the bridge gains post sockets for the milestone signs.
- `src/scenes/finale/Finale.tsx`: terminal → `LaunchTerminal`; launch is triggered on brief success.
- `src/scenes/world/Town.tsx` / `layout.ts`: exclusions for the new stop sightlines (the lamp posts at stack and about), the farm terraces, pavilion and radio-tower plots, and the clock tower.
- `src/scenes/Experience.tsx`: per-chapter `<Suspense>`; SceneReady compiles the text.
- `src/App.tsx`: wiring for the Spine, Chrome, Palette, CaseStudy and Curtain. `Journey`, `Nav` and `ProjectModal` are retired; the Play preload stays on `chapter >= 3`.
- `src/ui/FlatSite.tsx`: real content plus portfolio3 tokens.
- `src/ui/ContactTerminal.tsx`: kept as the simple-form fallback; posts to `/api/contact`.
- `src/ui/Toasts.tsx`: journey-mode messages route to the diegetic status line and aria-live.
- `index.html` + `src/ui/loader.ts`: portfolio3 preloader.
- `src/styles/global.css`: delete `.card`, `.hero-card`, `.skill-label`, `.about-tip`, `.chapters`, `.progress-rail`, the glass tokens and the mobile sheet rules (about 600 of 1555 lines). Import the portfolio3 tokens and the `.btn` / `.chip` / `.kbd` / `.palette` / `.curtain` blocks.
- `src/scenes/play/PlayMode.tsx`: float carriers sink when entering Play Mode; ground signs, screens and boards stay as world features. `clearViewOffset()` is harmless.

### 11.2 Packages

| Action | Package | Why |
|---|---|---|
| Add (direct dependency) | `troika-three-text@^0.52.4` | Already transitive through drei; direct import for `preloadFont`. 41.5 KB gz. |
| Add (direct dependency) | `maath@^0.10.8` | `damp3` spring, 1.1 KB gz. |
| Use (already installed) | `lenis/snap`, `gsap/CustomEase` | Snap at holds; `em` / `cam` eases. |
| Remove | `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono` | Replaced by portfolio3 fonts. |
| Dev only (optional) | `sharp` | For `scripts/assets.mjs`, or run it once and commit the outputs. |
| Offline tooling | `fonttools` (python venv, already in `scratchpad/ftenv`) | Static TTF instances (already produced in `scratchpad/fontreal`). |
| Avoid | `@react-three/uikit` (377 KB gz), `@react-three/a11y`, `@theatre/r3f`, `three-msdf-text-utils`, `camera-controls` (not needed; pose blending covers inspect) | — |

### 11.3 Assets

- `public/fonts/`: FunnelDisplay-600.ttf, Inter-400.ttf (subset), Inter-500.ttf (optional), JetBrainsMono-400.ttf, plus the 4 portfolio3 WOFF2 files and `OFL.txt`.
- `public/shots/`: 15 screenshots × 2 sizes.
  - sua1, sua_vendor, sua_financials, sua_player
  - game_point1–3
  - dent_assist1–3
  - gkec3, boe2
  - bismillah_agro1, quran1, chitchat_preview
  - Plus all 31 at 1280 px for the case-study gallery, lazy-loaded from DOM `<img>`. They are not textures.
- `public/assets/developer.webp` (1024 px).

### 11.4 Verification (extend the existing Playwright tools in `scratchpad/tools`)

- **Re-shoot** every stop at 1440×900, 390×844, 1920×1080, 1366×657 and 820×1180, including mid-travel and the about inspect.
- **Zero-card assertion:**
  - in journey mode, no element matches `.card`, `.about-tip` or `.skill-label`;
  - no DOM element with a non-transparent background or `backdrop-filter` covers more than 1% of the viewport, except during palette, case study, curtain and form;
  - no `<Html>` in the canvas tree.
- **Legibility:** pixel-sample sign text against its plate, contrast 7:1 or better; every glyph block 12 CSS px or larger at its hold (from `worldPerPx`).
- **Camera:** extend `tools/camprofile.mjs` against the new `cameraPath.ts`. Per run: peak/mean 1.35 or less, near-zero zone 6% or less at each end, and a velocity jump at hold boundaries of 5% or less.
- **Perf:** `perfbase.cjs` per stop must stay within the §10 budget.
- **Accessibility:** axe on the spine (portfolio3 already runs `@axe-core/playwright`), plus a Tab walk that asserts the 3D focus ring follows focus.

---

## 12. Phases and effort (one experienced R3F developer)

1. **Phase 1, foundation and kit (5 days).**
   - Port the real content into `content.ts` and add `brand.ts`. Fonts pipeline. Asset script.
   - `timeline.ts` + `journey.ts` (stops as data; the `journey.*` API kept). Spine with sr-only content.
   - Camera rewrite: per-aspect poses, arc length, speed profile, damp3, snap, rack focus, **lens shift removed**.
   - Text kit: `WorldText`, glyph reveal, `SignPlate`, `Keycap`, `SignIslet`, `FocusRing`, phase hook, slot solver plus the `?debug` overlay.
   - Development happens behind `?v2=1`, with the old cards kept only for side-by-side comparison.
2. **Phase 2, Takeoff and Selected work (6 days).**
   - Preloader re-skin; dayNight brand palettes; title islet with drum and ticker; clock tower; "EMON." period.
   - Screenshot screen shader; 4 restyled buildings (new arena spec); monument plates with metric tiles and keycaps; 4 story props.
   - Case-study inspect → clip-path sheet; `more-work` fingerpost with the farm, pavilion and radio tower; ⌘K palette and curtain.
3. **Phase 3, Stack and About (5 days).**
   - Circuit tree with 5 groups, 44 usage nodes, tags with flip, rings, tickers and plinth; `<Html>` deleted.
   - Workshop: new objects, mural scrub, portrait, posters, monitor terminal with REPL, notes bookshelf, globe with the Bengali canvas tag, inspect cycling; tooltips, list and bulbs deleted; lamp-post sightlines fixed.
4. **Phase 4, Journey so far and Launch (4 days).**
   - Bridge milestones (5 micro-stops, lanterns, rope light).
   - Gantry banner and countdown stages, split-flap board (services and formats), launch terminal brief with hidden inputs, `api/contact.ts`, rocket-on-send, contact plate.
   - Diegetic status lines replace journey toasts. Remove the old Journey, Nav, ProjectModal and CSS. Emoji purge.
5. **Phase 5, mobile, accessibility and performance hardening (4–6 days).**
   - Tall-pose and slot tuning at 5 viewports; hit targets; keyboard on the terminal.
   - Reduced-motion cuts; prefers-contrast; text size; aria-live; focus caption; axe.
   - Playwright regression suite (§11.4); low-tier budgets on a real phone; FlatSite re-skin with real content.
   - Ship.

**Total: about 24 days (range 22–26).** The site should ship only at the end of Phase 5. A half-diegetic, half-card build would look worse than either.

---

## 13. Risks and honest trade-offs

1. **In-world type legibility across aspect ratios is the hardest part.** The slot solver gets most stops right automatically, but expect hand-tuned `tall` poses and slots at about half the stops. Mitigation: the `?debug` overlay, px-based sizing, the 12px floor, and Playwright legibility checks.
2. **Information density.** A diegetic stop carries 25–40 words. Depth (architecture, highlights, 31 screenshots, services detail, FAQ) needs the on-request case-study sheet, the palette and 2D mode. The sheet *is* a DOM surface; it only appears when asked and emerges from the 3D screen. Someone could still call it "a card". It cannot be avoided for long-form reading, accessibility and find-in-page.
3. **Discoverability of 3D controls.** Without boxes, visitors may miss what is clickable. Mitigation: keycaps that look unmistakably like keys, the labelled cursor, edge-light, a power-on animation that draws the eye, a spine twin for every control, and the palette.
4. **troika limits.**
   - No Bengali shaping (verified). Bengali goes to canvas textures only.
   - No `tnum` (counters use JBM fixed digits).
   - `colorRanges` needs key 0.
   - Suspense can blank the canvas if a chapter is not isolated.
   - Missing glyphs trigger CDN fallback fonts. The string lint prevents this.
5. **Colour fidelity through post.** ACES plus HueSat plus contrast shift the brand hexes. Compensated colours and the bloom re-key help, but in-world colour will never be pixel-exact (case-study sheets are exact). Verify with pixel sampling.
6. **Snap on touch and trackpads** can feel grabby. Proximity mode with a 30% threshold, a debounce, and the option to disable on `pointer: coarse` after device testing.
7. **Performance on low-end phones.** SwiftShader numbers are directional only. Real-device testing is required in Phase 5. Fallbacks: fewer tags, no tickers, 768 px textures, `PerformanceMonitor` step-down, 2D mode.
8. **Terminal typing on mobile:** keyboard, viewport resize and WebGL canvas resizing can jank. `ignoreMobileResize`, `visualViewport` framing and the always-present simple-form fallback.
9. **Invisible spine and screen readers.** Scroll-synced invisible content must be tested with VoiceOver and NVDA. Focus visibility relies on the 3D ring plus the caption. If either fails, the "Read in 2D" path must be prominent.
10. **Content truth.**
    - Self-reported stats are excluded until confirmed. Testimonials are fictional and never used.
    - The `*.emon.pro` live links (Dent-Assist, Bismillah, Quran) and the Chit-Chat host could not be verified from the sandbox.
    - GKEC/BOE art shows real footballers (textures restricted to gkec3 and boe2).
    - SUA is under NDA (no code link).
    - Merging GKEC and BOE into one arena is an editorial call to confirm.
11. **Contact backend.** The static Vite build needs a host with functions (Vercel) and a Resend key, or it falls back to mailto. Rate limiting is best effort per serverless instance.
12. **Scope creep.** Props, buildings and the about room tempt endless modelling. Cap each prop at about half a day and keep the low-poly vocabulary already in `systems/geometry.ts`.
13. **Scroll length.** Six chapters in about 13.4 vh is shorter than today, but the bridge's 5 micro-stops could feel slow to some visitors. Tunable in data (micro hold 0.12–0.2 vh). The palette and number keys allow skipping.

---

## 14. Open questions for Emon

1. Merge GKEC and BOE into one "Esports Arena" building, or feature 4 different projects?
2. Show the self-reported stats (100+ projects, 8+ clients, 90+ contributions, 99% satisfaction), or leave them out (recommended)?
3. Are dent-assist.emon.pro, bismillah-agro.emon.pro, holy-quran.emon.pro and the Chit-Chat host live?
4. Deploy on Vercel with Resend for the contact brief (needs `RESEND_API_KEY` and a verified sender), or mailto only? Which address: maremon15@gmail.com or dev@emon.pro?
5. A résumé PDF to add? Use the anime avatar (`image.webp`) as a Play Mode pilot?
6. The final domain for the 3D site (Open Graph and canonical)?

---

## 15. Short summary in Banglish (for the user)

- Shob glass card (boro left card, About tooltip, skill pill, nav pill, progress rail) puro bad. Ekhon prottek ta lekha island er bhitore kono physical jinish er upore thakbe:
  - building er screen e asol project screenshot
  - building er shamne sign-board
  - workshop er deyale lekha
  - bookshelf er boi = notes
  - bridge e timeline sign
  - launch pad e departure board ar terminal
- Camera thamle tobei lekha "power on" hobe (smooth rise), camera chole gele lekha off. Flying er shomoy kono adha-pora lekha thakbe na.
- portfolio3 er asol content (San Uni Academy, Hasibul, Dent-Assist, Esports Arena, 44 ta tool er asol usage, experience, services, contact) ar brand (warm black + vermilion, Funnel Display / Inter / JetBrains Mono) use hobe.
- Scroll ~13.4 screen (ekhon 18.9), camera stop-and-surge na kore smooth cholbe. Mobile e text upore, building niche; kono bottom sheet nai.
- Moto 5 phase, ~24 din er kaj.
