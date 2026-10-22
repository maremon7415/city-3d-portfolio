# Proposal: "Annotated Island" — a recruiter-first hybrid

Angle: keep the flying island as the hero, but make the portfolio *read* like a well-labelled technical drawing. Every word becomes an annotation pinned to the 3D thing it describes. A text-only HUD and a fast index give a recruiter name, role, projects and contact in under 10 seconds, without scrolling.

Inputs used (all on disk):
- `analysis/content.md` + `content.json` (real portfolio3 content)
- `analysis/design-language.md` (brand, fonts, motion, ACES/bloom maths)
- `analysis/overlay-audit.md` (what is wrong today, with measurements)
- `analysis/3d-presentation-research.md` (verified troika/drei/camera techniques)
- The current code in `/home/user/city-3d-portfolio/src` (read for this proposal)
- New baseline measured for this proposal: `analysis/perfbase-1440-high.json`, `analysis/perfbase-390-low.json` (draw calls and triangles per stop, from the `?debug` overlay)

Path shorthand: `SH` = `<analysis-sandbox>/shots`.

---

## 0. TL;DR

1. **The complaint, fixed at the root.** Every frosted-glass box leaves the 3D view: the left content card, the About tooltip, the skill pills, the meter list, the progress rail, the glass nav pill and the dome's "billboard on posts". There is nothing with a background box on screen during the flight.
2. **What replaces them: the label rig.** At each stop there is:
   - a small anchor dot on the object (building screen, tree node, wall rail, rocket);
   - a thin vermilion leader line;
   - brand typography floating in clear sky beside it: eyebrow, title, one line, 3 metrics, 1–2 buttons.

   There is no plate behind the text. It is rendered in WebGL (troika SDF), anchored in world space so it parallaxes with the camera, revealed glyph by glyph only after the camera has settled, and gone before the camera moves again.
3. **Recruiter fast lane: the 10-second guarantee.**
   - A light, text-only HUD: name, `Index ⌘K`, `Contact`, sound, `2D`, a live Dhaka clock with availability, and a chapter scrubber line at the bottom.
   - A full-screen typographic **Index** that lists all 8 projects, experience, the stack, contact actions and notes.
   - **Deep links** (`#/work/san-uni-academy`).
   - Within 10 s of first paint, with zero scrolling: name, role, location, availability, the 4 featured project names and a Contact button are on screen. The whole portfolio is one tap away.
4. **Real content from portfolio3.** Md. Emon Miah, Full-Stack Software Engineer, Dhaka.
   - 4 featured buildings: **San Uni Academy, Dent-Assist AI, Hasibul Gaming Point, Esports Arena** (GKEC + BOE merged).
   - 3 secondary island props: Bismillah Agro terraces, Quran pavilion, Chit-Chat mast.
   - Real screenshots on the building screens.
   - Honest stack: usage counts replace the invented proficiency meters.
   - A real experience timeline and real About objects.
   - The fictional testimonials, coffee, cat caption and guitar are dropped.
5. **Chapters (5) and stops (10):**
   - 00 Hello
   - 01 Work: an "at a glance" overview, then the 4 buildings
   - 02 Stack
   - 03 Experience: the career rail and the About objects
   - 04 Contact

   Scroll length drops from **18.9 vh to ~11.5 vh** (−36%). Holds are 54% of the scroll instead of 28%.
6. **Smoothness:**
   - The timeline becomes **data**, so stops are no longer measured from DOM card heights.
   - A **framing solver** replaces the `setViewOffset` lens-shift hack and the portrait pull-back.
   - **Arc-length** path sampling with a **C1 speed profile** removes the stop-and-surge feel and the dead zones.
   - One **critically damped spring** follows the path (no double smoothing), with **proximity snap** to hold centres.
   - A reveal/exit **phase machine** shows text only while the camera is still.
7. **Long reading stays DOM, but only on request.**
   - "Case study" expands the building's screen into an editorial sheet through a clip-path handoff from the 3D screen's rectangle.
   - "Start a brief" opens portfolio3's 3-step wizard from the rocket console.
   - The 2D site is rebuilt on portfolio3's tokens.
8. **Effort:** 5 phases, about **20–24 developer-days** for P1–P4 (23–28 with the optional polish phase) for one experienced R3F developer. No new heavy packages: declare `troika-three-text` and `maath` (already transitive), and use `lenis/snap` and gsap `CustomEase` (already installed). Drop the 3 `@fontsource` packages.

### Short summary in Banglish (user-er jonno)

> 3D mode theke sob glass card (left-er boro card, About tooltip, skill pill, nav pill) puropuri soriye dibo. Tar bodole proti stop-e object-er gaye ekta chhoto dot, ekta patla orange line, ar pashe akashe sundor typography: project-er naam, ek line, 3-ta number, "Case study" button. Kono box nai. Camera thamle lekha ashe, camera chollei lekha chole jay, tai smooth lage.
>
> Recruiter-ra 10 second-er moddhe naam, role, Dhaka, "open to full-time & contract", 4-ta project-er naam ar Contact button dekhte pabe. Upore ekta halka HUD, ⌘K Index (sob 8 project, experience, stack, contact ek jaygay), ar shareable link thakbe. portfolio3 theke sob real content (SUA, Dent-Assist, Hasibul, Esports Arena, experience, stack) ashbe, brand-o (warm black + vermilion, Funnel Display font). Scroll 18.9 theke 11.5 screen-e kombe. Camera-r jhaanki-jhaanki thamano/doure jaowa thik korbo. Lomba case study porte chaile building-er screen theke page-ta khule jabe. Mobile, keyboard, screen reader ar 2D mode sob cover kora ache.

---

## 1. Diagnosis (why the current design fails a recruiter)

From `overlay-audit.md`, plus the code read for this proposal:

- **Card #1** is the left glass card (`.card` in `src/ui/Journey.tsx`). It covers 13–22% of a 1440 screen and **36–51% of a phone**. It hits the nav at 1366×657 and sits on the subject at 820×1180 (`SH/audit-1366-about.png`, `SH/audit-820-contact.png`).
- **Card #2** is the About tooltip (`.about-tip`, drei `<Html>`): a second glass box repeating the list text (`SH/audit-1440-about-hover.png`).
- The dome building's free-standing billboard on posts (`domeSpec` in `ProjectsDistrict.tsx`) reads as a second dark card at project-1.
- **Recruiter cost.** The things a recruiter scans for are either fake or missing: role "Creative Frontend Developer", 3 placeholder projects out of 4, `hello@example.com`, no experience, invented skill levels. Text also arrives before the camera (the cards follow scroll instantly while the camera lags behind `damp(3.6)` plus Lenis). Hero text contrast is 1.3–1.7:1. Reaching "Contact" takes about 180 wheel notches, or one nav click that rips through the whole island in a fixed 2.2 s.
- **Smoothness cost.** Holds are only 0.43 vh per project, while a card is on screen during 73% of camera travel. Cubic easing tails leave about 1.2 vh of near-frozen camera around each stop, followed by a burst. The intro flyover speed lurches 104 → 91 → 221 u/vh (`camprofile-1440.txt`).

The root cause is architectural. **Text is laid out by the DOM and the camera is fitted to the DOM.** Camera stops come from panel heights (`scroll.ts measure()`), and the lens shift (`JourneyCamera.tsx` L42-49) exists only to dodge the card. The fix is to invert that: the **timeline and camera become data, and the text is laid out from the camera.**

---

## 2. Concept and governing rules

**The idea.** The island is an annotated model. Content does not float in front of the world. It is *attached* to it, the way callouts are attached to parts in an engineering drawing: an anchor point on the object, a leader line, a label. This keeps the 3D wow, because the camera still flies and the labels parallax and draw themselves on. It also gives the legibility of a well-set editorial page. Brand typography sits on clear sky, sized in CSS pixels, with exact brand colours.

Rules. Each one is testable, and §16 says how.

| # | Rule | Test |
|---|---|---|
| R1 | **No background box during the journey.** No `backdrop-filter`, no glass, no card plates. The only boxes are surfaces the user invokes: the Index, the case-study sheet and the brief. | Playwright: no element with `backdrop-filter` or a non-transparent background intersects the canvas at any stop. |
| R2 | **10-second guarantee.** Within 10 s of navigation start, with no scroll and no click, the screen shows name, role, location, availability, the 4 featured project names (desktop/tablet) and a Contact control. Every project is reachable in one tap. | A debug hook reports when each item is revealed; asserted at 1440×900 and 390×844 on throttled 4G. |
| R3 | **Every text block is anchored** to the 3D thing it describes (leader line or physical carrier) and shows only while the camera is settled at its stop. | The phase machine state is checked in screenshots; zero text is visible mid-travel. |
| R4 | **≤ 25 words of running text per stop** (≤ 20 on phones), plus at most 6 short labels or metrics. **Exactly one primary action per stop**, which opens the full story. | A word count over the content config fails the build. |
| R5 | **Nothing exists only in WebGL.** The DOM spine plus the 2D site contain every word and every action. Both are keyboard and screen-reader reachable. | axe on the spine; a keyboard walk-through script. |
| R6 | **Legibility floor.** ≥ 12 CSS px on screen. Contrast ≥ 4.5:1 for body text and ≥ 3:1 for display text against the actual pixels behind the block. | Pixel sampling behind the projected label bounds at 5 viewports. |

---

## 3. The recruiter path

### 3.1 The first 10 seconds (broadband desktop, no interaction)

| t | What happens |
|---|---|
| 0.0–0.3 s | The inline preloader paints: warm black, "Md. Emon Miah / Portfolio © 2026", Hello → হ্যালো → স্বাগতম (DOM, Noto Sans Bengali), `000%` counter driven by **real** load progress, "Skip to the 2D version" link. |
| ~2.5 s | Assets ready. Minimum greeting time is 1.6 s. **Auto-lift:** there is no "Enter" click, and sound is off by default with a toggle in the HUD. The curved expo.inOut lift (1.05 s) reveals the takeoff already under way. |
| +0.3 s | The HUD fades in. Top: prompt-logo mark, **Md. Emon Miah**, `Index ⌘K`, **Contact**. Bottom: `● Open to full-time & contract roles · Dhaka 14:32 UTC+6` and the chapter scrubber. |
| +1.0 s | At takeoff 35% (the takeoff is shortened from 3.4 s to 2.4 s), the name reveals per glyph: **"Md. Emon / *Miah.*"**. Then "Full-stack engineer building *AI voice agents*", with the rotating word slot. |
| +2.2 s | **"(Selected work) San Uni Academy · Dent-Assist AI · Hasibul Gaming Point · Esports Arena"** draws in as 4 clickable 3D links, plus two 3D buttons: **See my work** and **Let's talk**. |
| ≈ 5–6.5 s total | **R2 satisfied.** On slow 4G (about 6 s load) it is about 9 s. On phones the 4 project names are replaced by the HUD `Index` and the "See my work" button, which counts as one tap away. |

### 3.2 Three ways to read the same portfolio

1. **Fly (scroll).** 10 snapped stops, about 115 wheel notches (180 today) or 10–14 swipes. One annotation at a time.
2. **Jump (Index ⌘K, scrubber, deep links).**
   - Any project, chapter or action is reachable in 2 interactions.
   - Deep links: `#/work`, `#/work/<slug>`, `#/stack`, `#/experience`, `#/contact`. They cut straight to the stop (no takeoff) and open the sheet if a slug is given, so recruiters can paste a link into an ATS note or a Slack thread.
3. **Read (2D).** The `2D` button in the HUD and in the preloader leads to a fast portfolio3-styled page with everything on it. It is also the automatic fallback (WebGL failure, `?mode=2d`, Save-Data, or a sustained low frame rate on the first stop, offered with a toast).

---

## 4. What replaces each current overlay surface

| Current surface (file) | Replacement | Layer |
|---|---|---|
| **Hero block** (`Hero` in `Journey.tsx`, `.hero-card` in `global.css`) | **3D name** "Md. Emon / *Miah.*" in Funnel 600. Per-glyph masked rise chained to the takeoff, with an accent second line and a closing period. **Role line** with the rotating-word slot (`clipRect` window). **Selected-work line** of 4 clickable project names (desktop/tablet). **Two 3D buttons** (SDF pills): "See my work" and "Let's talk". Availability and clock move to the HUD. The DOM `<h1>` stays, sr-only, in the spine. Contrast is fixed by the re-keyed dawn palette (§10): cream on a warm dark sky, ≥ 10:1. | Tier B (annotation, exact colours) + DOM HUD |
| **Left glass card — Card #1** (`ProjectCard`, `SkillsCard`, `AboutCard`, `FinaleCard`; `.card`) | **Label rig per stop** (§8): anchor dot on the object → leader line → plateless type block. The block holds an eyebrow `(Work) 01 / 04 · EdTech & LMS · 2025–26`, a title, one line, a 3-metric row and 1–2 3D buttons. It shows only when the camera has settled and leaves in ≤ 350 ms when travel starts. It sits in the composition's text zone (left on wide screens, top band on portrait) and never covers the subject. | Tier B, anchored in world space |
| **Glass nav chapter pill** (`Nav.tsx`, `.chapters`) | **Chapter scrubber**: a bottom line of mono labels `Hello · Work · Stack · Experience · Contact` over a 2px accent progress line. Click to jump (distance-scaled glide, or a curtain for far jumps). On phones it collapses to `02 / 05 WORK` plus the line. The top bar keeps only the name, Index, Contact, sound and 2D. Transparent over a soft gradient scrim; no pill box, no blur. | DOM HUD |
| **Progress rail** (`.progress-rail`) | Removed. Merged into the scrubber line. | — |
| **Skill pills** (drei `<Html>` in `SkillsGarden.tsx`) | **SDF node tags** (`Billboard` + `ScreenSizer` + `<Text>`). They are depth-tested (the trunk occludes them), always ≥ 12 px, and show the *usage count* (`Next.js · 7`). Only the top 10 by usage show by default; a focused group shows all of its tags. Group names run around the platform rim as curved ring text. The meter bars and the duplicate card list are removed. | Tier A (diegetic) |
| **About tooltip — Card #2 — and the About list** (`AboutWorkshop.tsx` `<Html>`, `AboutCard` list) | **Object pins**: 1–3-word titles floating at real objects ("Right now", "Still studying", "Agentic AI"…). Focusing a pin (hover, tap or keyboard) expands **one** caption (≤ 16 words) into the stop's text zone, joined to the object by a leader line, and the camera micro-dollies 4% toward it. It never shows as a tooltip box over the object. The list becomes sr-only spine buttons that mirror focus onto the pins. | Tier B + Tier A |
| **Project modal** (`ProjectModal.tsx`, `Modal.tsx`) | **Case-study sheet**, a DOM editorial page with no glass. It opens on request through a **screen-to-DOM clip handoff**: it starts clipped to the building screen's projected rectangle and expands to a right-hand sheet (60% wide) while the camera frames the building in the remaining 40%. On phones it opens full screen. It contains the real problem/solution/outcome, a captioned screenshot gallery, 4 metrics, stack, architecture, highlights, the related engineering note, live and code links (or "Client NDA"), and previous/next (the camera moves behind the sheet). Each sheet has its own deep link. The fake `drawDemo` canvas and the iframe are removed (sanuniacademy.com and hasibulgamepoint.com refuse framing anyway). | DOM, on request |
| **Toasts** (`Toasts.tsx`) | portfolio3 toast pill: solid `--bg-2`, 1px hairline, no blur, bottom-centre above the scrubber. In the journey it is used only for confirmations ("Email copied", "Link copied") and errors. Easter-egg toasts keep the same style. | DOM |
| **Dome billboard on posts** (`domeSpec`) | Removed. Screens are part of building facades and show real screenshots through a rounded-corner shader. | Tier A |
| **About hint bulbs; "Tip: click the building"** | Removed. On desktop a labelled cursor ("View", "Open", "Launch", "Copy") appears on hover over interactive meshes. On touch, anchor dots pulse once on arrival. | DOM cursor |
| **Inline loader** (`index.html`) | portfolio3 preloader (bilingual greetings, `000%`, accent bar, curved lift), driven by real progress, with auto-lift. | DOM |
| **Contact terminal modal** (`ContactTerminal.tsx`) | **Brief sheet**: portfolio3's 3-step wizard (What do you need? / Tell me about it / Who am I talking to?). It is launched by the rocket, with a clip handoff from the console screen, which types `whoami` in JetBrains Mono. Same layout rules as the case-study sheet. | DOM, on request |

---

## 5. Chapters, stops and scroll budget

Travel lengths are generated from the path's *perceived motion* (§9.3). The numbers below are the target outputs. "Words" counts running text in 3D at that stop, excluding pins and metric labels.

| # | Stop id | Chapter (scrubber) | Carrier in 3D | Words | Hold (vh) | Travel in (vh) | Day phase | Ink theme |
|---|---|---|---|---|---|---|---|---|
| 1 | `hello` | 00 Hello | Sky over the island, dawn sun disc | 23 | 0.50 | — | 0.00 dawn | dark (cream ink) |
| 2 | `work-index` | 01 Work | High overview; 8 pins on buildings and props; voxel "EMON." sign as a landmark | 12 + pins | 0.70 | 0.90 | 0.18 | light (black ink) |
| 3 | `work-sua` | 01 Work | San Uni Academy tower + screen | 19 | 0.60 | 0.70 | 0.26 | light |
| 4 | `work-dent` | 01 Work | Dent-Assist clinic + screen | 18 | 0.60 | 0.45 | 0.32 | light |
| 5 | `work-hasibul` | 01 Work | Hasibul arcade + screen | 20 | 0.60 | 0.45 | 0.38 | light |
| 6 | `work-arena` | 01 Work | Esports Arena + screen | 18 | 0.60 | 0.45 | 0.44 | light |
| 7 | `stack` | 02 Stack | Circuit tree, node tags, rim ring text | 16 | 0.80 | 0.60 | 0.58 golden | light* |
| 8 | `experience` | 03 Experience | Brass rail with 3 role nodes on the workshop wall | 14 + 3 rows | 0.70 | 0.60 | 0.74 dusk | dark |
| 9 | `about` | 03 Experience | Workshop objects + portrait frame | 17 + pins | 0.60 | 0.30 | 0.78 | dark |
| 10 | `contact` | 04 Contact | Launch pad, rocket, console screen | 22 | 0.50 (end) | 0.85 | 1.00 night | dark |

`*` Theme is per stop data. It is verified by the automated contrast test and flipped if a stop fails.

**Totals:** holds 6.2 vh + travel 5.3 vh = **11.5 vh** of scroll (≈ 10,350 px at 900p, against 16,110 px today). Holds are 54% of the scroll (28% today). Projects get a 0.60 vh hold (0.43 today). Text is never visible outside a hold.

**Why this chapter list (recruiter order).** Who → what he built → with what → where he worked → how to reach him.
- **Services** don't get a stop. The 8 services, 2 engagement formats, 4 standards, 4 process steps and 6 FAQs live in the **Index** ("Services", "Quick answers") and the 2D site. "Full-time role / Contract project" become the brief's first step.
- **Notes** (6 posts) appear as the "Related note" in each case-study sheet and in the Index.
- **Testimonials** are dropped (all 5 are fictional placeholders in portfolio3).
- The self-reported counters (100+ / 8+ / 90+ / 99%) are **not** shown in 3D unless the owner confirms them (§17).

---

## 6. Chapter treatments

Each block lists desktop (1440×900, text zone left), portrait (390×844, text zone top band), the content (verbatim from portfolio3 unless marked), interactions and Tier A carriers.

### 6.1 00 Hello (takeoff)

- **Frame.** The existing intro composition (island from below-side, waterfall), re-lit as the "rising sun": a breathing vermilion sun disc behind the island, warm dark sky, cream clouds. The text zone is the left 40% on desktop and the top band on portrait. On portrait the island sits in the lower 55%.
- **Content:**
  - Name: `Md. Emon` / `Miah.` (line 2 in accent). Funnel 600, 130 px desktop (`clamp(64, min(9vw, 17vh), 168)`), 64 px portrait, line-height 0.84, letter-spacing −0.058em.
  - Role: `Full-stack engineer building` + slot `AI voice agents → payment-ready storefronts → realtime platforms → motion-rich interfaces`. Inter 500, 24 px / 17 px. The slot word is in accent and rotates 0.9 s expo.inOut every 2.6 s. Under reduced motion it shows a static first phrase.
  - Selected-work line (desktop/tablet): mono eyebrow `(Selected work)` + `San Uni Academy · Dent-Assist AI · Hasibul Gaming Point · Esports Arena`. Inter 15 px, underline sweep on hover. Each name flies to its building.
  - Buttons: **See my work** (filled cream, the primary) and **Let's talk** (hairline).
- **Interaction.** Clicking a name triggers a distance-scaled glide; Hello → building is a far jump, so it uses the curtain. "Let's talk" jumps to `contact`. The HUD Contact button opens the brief directly.
- **Tier A.** The voxel `EMON.` sign gets an accent period block. It is framed later, in `work-index`, so the name never appears twice in one frame.

### 6.2 01 Work — "at a glance" (overview index shot)

The recruiter's map. It reuses today's `overview` waypoint (`[2,30,18]`, see `cameraPath.ts`) and turns it into a hold.

- **Title rig** (text zone): eyebrow `(Selected work) 8 projects`; title `Products that *ship* and *scale.*`; line `Live products across EdTech, digital commerce, AI voice, esports and offline-first apps.` (portfolio3 lead, trimmed to 12 words); button **All projects** (opens Index → Work).
- **Pins** (desktop: 8; portrait: 4 featured + a "+4 more" pin). Each pin has an anchor dot, a short leader and a name + 1 metric. Featured pins fly to their building; secondary pins open their case-study sheet.

  | Pin | Label |
  |---|---|
  | San Uni Academy | `San Uni Academy — LMS + split payouts` |
  | Dent-Assist AI | `Dent-Assist AI — < 450 ms voice` |
  | Hasibul Gaming Point | `Hasibul Gaming Point — 10,000+ users / mo` |
  | Esports Arena | `Esports Arena — 2,400+ players` |
  | Bismillah Agro (farm terraces) | `Bismillah Agro — 99 Web Vitals` |
  | Quran Web App (pavilion) | `Quran Web App — offline PWA` |
  | Chit-Chat (radio mast) | `Chit-Chat — < 80 ms` |
  | This island | `This site — R3F · Rapier · open code` |

- **New Tier A props** (cheap, built with the existing `systems/geometry.ts` builder):
  - Terraced plots with instanced crop rows and a Bangla signboard drawn on a `CanvasTexture` (`বিসমিল্লাহ এগ্রো`, rendered with browser shaping because troika cannot shape Bengali).
  - An octagonal pavilion with a soft lantern, presented respectfully, with no scripture text in 3D.
  - A thin radio mast with 3 slowly orbiting speech-bubble planes.
  - Positions go into `layout.ts DISTRICTS` with exclusions.

### 6.3 01 Work — the 4 featured buildings

Each building gets **real screenshots** on its screen through a rounded-corner shader. The shader de-zooms 1.25 → 1 on arrival and crossfades every 3.5 s while holding (no autoplay under reduced motion). Building styles map to the existing specs (`tower`, `studio`, `factory`, `dome` without posts). Optional signature props come in Phase 5.

| Stop | Eyebrow | Title | Line (subtitle) | Metrics (number · label) | Buttons | Screens (textures) |
|---|---|---|---|---|---|---|
| `work-sua` | `(Work) 01 / 04 · EdTech & LMS · 2025–26` | `San Uni Academy.` | `Multi-vendor LMS, merchandise marketplace & HLS video pipeline` | `Adaptive HLS · video` · `Stripe + SSLCommerz · split payouts` · `GPT-4o-mini · AI tutor`; mono badge `Client NDA · private code` | **Case study** · Live site | sua1 → sua_vendor → sua_financials |
| `work-dent` | `(Work) 02 / 04 · AI & Voice · 2025` | `Dent-Assist AI.` | `Conversational AI voice booking & clinic management engine` | `< 450 ms · voice latency` · `0 · double-bookings` · `Vapi + Postgres · slot locks` | **Case study** · Code · Live* | dent_assist1 → dent_assist2 |
| `work-hasibul` | `(Work) 03 / 04 · E-commerce · 2024–25` | `Hasibul Gaming Point.` | `High-traffic digital marketplace, ZiniPay gateway & Telegram bot command center` | `10,000+ · monthly users` · `< 3.2 s · checkout` · `< 3 s · code delivery` | **Case study** · Live site · Code | game_point1 → game_point3 → game_point2 |
| `work-arena` | `(Work) 04 / 04 · Esports · 2024–25` | `Esports Arena.` | `Tournament platforms for GKEC Esports and BOE Gaming Club.` (synthesised, factual) | `2,400+ · players (GKEC)` · `500 / min · signups (BOE)` · `99.9% · uptime (GKEC)` | **Case studies** (sheet with GKEC and BOE sections) · 2 live links | gkec3 → boe2 (no footballer artwork) |

`*` The `*.emon.pro` live links could not be verified from the sandbox. A build-time link check hides a "Live" button whose URL fails.

- **Leader line.** From the screen's top-outer corner, an elbow line runs to the label block's baseline.
- **Clicking the screen** opens the case study, so the screen *is* the primary button. The labelled cursor reads "View".
- **Building rise** is driven by the timeline phase (`arriving`), no longer by `journey.stops` (`ProjectsDistrict.tsx` L175).

### 6.4 02 Stack (circuit tree, honest data)

- **Title rig:** eyebrow `(Stack) 5 groups · 44 tools`; title `Tools I reach for.`; line `Everything here has been used in production work, not just a tutorial.` (verbatim, 12 words); button **All 44 tools** (opens Index → Stack, with every tool's note and the projects it shipped in).
- **Nodes.** The 5 portfolio3 groups become 5 branches. There is one node per tool in the curated 20-item "core stack" (`techMarquee` rows A+B). Node size is the usage count from `content.json`. The top of the ranking is React 8, Tailwind 8, Next.js 7, TypeScript 6, Node.js 5, MongoDB 4, then PostgreSQL, Express, Mongoose, Zustand and Cloudinary at 3 each.
- **Labels.** The top-10 tags are always visible during the hold. Hover, tap or focus on a branch shows that group's tags. A focused node expands to the projects it shipped in, e.g. `Next.js — SUA · Hasibul · Dent-Assist · GKEC · BOE · Bismillah · Quran` (mono 12 px).
- **Ring text** on the platform rim: `FRONTEND • BACKEND • DATA • AI & PAYMENTS • CLOUD •` (troika `curveRadius`).
- **Traces.** Circuit traces are recoloured to the accent and light up as the "laser line" signature move, driven by hold progress. The multi-colour cyan/green/purple scheme goes.
- **Composition.** The lamp post in front of the tree (`SH/audit-1440-skills.png`) is removed by generalising the sightline exclusions in `layout.ts` to every stop.

### 6.5 03 Experience — the career rail

- **Carrier.** A brass rail with 3 glowing nodes mounted on the workshop's left wall (Tier A geometry). The camera frames the wall at dusk.
- **Title rig:** eyebrow `(Experience) 3 roles since 2024`; title `The journey so far.`; button **Full experience** (a sheet with every bullet and stack). A **Résumé** button appears if the owner supplies one.
- **Three annotation rows**, each leader-lined to its node:

  | Date | Role | Organisation | Extra |
  |---|---|---|---|
  | `2025 — now` | Full-Stack Engineer | Independent (Dhaka · Remote) | — |
  | `2024 — 25` | Front-End Developer | Lilium Info Tech | chip `LCP −35%` |
  | `2024 · 3 mo` | Full-Stack Developer Intern | IBCSX PRIMEx | — |

  An education line sits underneath: `B.Sc. CST, Bangladesh University (2024–28) · Diploma in CSE, Habiganj Polytechnic (2020–24)`.
- **Layout.** Portrait stacks the 3 rows vertically in the top band, with leaders dropping to the rail. The label rig supports per-layout-class row layouts.

### 6.6 03 Experience — About (the workshop objects)

- **Scrub-lit display line** (portfolio3 signature #5): `A full-stack engineer from Dhaka who likes backends that stay correct and interfaces that feel alive.` (17 words). Funnel 600, 34 px / 24 px. Words light from 0.16 to 1 opacity with hold progress, using one troika mesh and a glyph-bounds shader.
- **Real objects replace the fiction.** The coffee, guitar and the cat's "Senior reviewer" caption are dropped. The cat can stay as an unlabelled prop if the owner wants.

  | Pin | Object | Caption (≤ 16 words, from portfolio3) |
  |---|---|---|
  | **Right now** | computer | `Independent full-stack engineer: storefronts, esports platforms and AI voice booking on Next.js 16.` |
  | **Still studying** | books | `B.Sc. in Computer Science & Technology, Bangladesh University, 2024–2028.` |
  | **Agentic AI** | headset/robot | `Using AI agents to design, refine and secure real systems.` |
  | **Player one** | gamepad | `Gaming & anime: the reason half my projects have a leaderboard.` |
  | **Competitive coding** | trophy | `Algorithms keep the problem-solving muscle honest.` |
  | **Three languages** | globe | `বাংলা (native), English (professional), Hindi (conversational).` Rendered as a `CanvasTexture` because of the Bengali. |
  | **Ship small, learn fast** | plant | `Small releases people can use beat big reveals nobody asked for.` |
  | **Portrait** | frame on the wall | `developer.jpg` with the clip reveal and a vermilion rim glow. |

- **Interaction.** No auto-cycling: skimmers stay in control. Hover, tap or keyboard focus on a pin opens its caption. Only one caption shows at a time, so there is never a second box.
- **Composition.** The lamp post occluding the room is removed by the same exclusion fix.

### 6.7 04 Contact (launch pad)

- **Title rig:**
  - eyebrow `(Contact) Dhaka · UTC+6`
  - title `Let's build something *worth shipping.*`
  - line `Open to full-time & contract roles. Frontend or full-stack, remote or on-site.` (verbatim)
  - **the email as text**, `maremon15@gmail.com` (JetBrains Mono 18 px), with a **Copy** button
  - primary **Start a brief** (launches the rocket, then opens the brief sheet from the console screen)
  - a link row: `LinkedIn · GitHub · WhatsApp`
  - tertiary text link `Or fly the island yourself →` (Play Mode)
- **Arrows.** Arrow glyphs are drawn as tiny meshes (no brand font has → or ↗; a glyph would trigger troika's CDN fallback fetch).
- **Tier A.** The console screen (CanvasTexture, JBM) types portfolio3's terminal script (`whoami` / `cat stack.txt` / `./now.sh`) when the camera settles. It is night: bloom gives the accent a free glow.

### 6.8 Case-study sheet (DOM, on request)

Opened from the building screen, the Index, a pin or a deep link. Desktop: a right sheet 60% wide (min 720 px), edge-to-edge height, warm black, a hairline left border, no radius, no blur. It reads as a page, not a floating card. Phone: full screen. Sections:
1. Hero screenshot (the same texture, so the handoff is seamless).
2. Eyebrow, title, subtitle.
3. 4 metrics.
4. Problem, solution and outcome.
5. Captioned gallery (lazy).
6. Stack chips.
7. Architecture bullets.
8. Highlights.
9. Related note (e.g. Hasibul → "Idempotent payment webhooks", linked to emon.pro/notes).
10. Live, code or NDA.
11. "Open full case study on emon.pro ↗".
12. Previous and next.

While the sheet is open:
- Lenis and snap are stopped.
- The canvas switches to `frameloop="demand"` after the expand animation, so the GPU is idle.
- Back and Esc close the sheet (history API).

### 6.9 Index (⌘K, `/`, or the HUD "Index" button)

portfolio3's command palette, extended into the recruiter's fast lane. It is a full-screen typographic overlay (88% warm-black backdrop, no blur) with big Funnel rows, like portfolio3's menu.
- **Top line:** `Md. Emon Miah — Full-Stack Software Engineer, Dhaka (UTC+6). Open to full-time & contract roles.` plus email, LinkedIn and GitHub.
- **Groups:**
  - Work: 8 projects, each with one line, a metric, "Fly there" and "Case study".
  - Chapters.
  - Experience.
  - Stack: 44 tools with their notes and the projects they shipped in.
  - Services: 8 services and 2 formats.
  - Quick answers: the 6 FAQs.
  - Notes: 6.
  - Actions: copy email, start a brief, WhatsApp, call, 2D, Play, sound, text size.
- **Search:** "Jump to a project, tool or action…". Empty state: "Nothing matches "x". Try "work", "Prisma" or "contact"".

This replaces the menu overlay, the hover-preview index and the FAQ.

### 6.10 Play Mode tie-in

- No layout changes.
- The 12 shards use the real facts from `content.md` §13.
- `PlayMode.tsx` L137 `clearViewOffset()` becomes unnecessary, because the lens shift is gone.
- Emojis are removed from the Play HUD copy.

---

## 7. Content map: portfolio3 → world

| portfolio3 content | Where it lives | Layer | Fallback / deep version |
|---|---|---|---|
| Name, role, location, availability, clock | Hello name + role line; HUD top and bottom | Tier B + DOM | Spine `<h1>`, 2D hero |
| 4 rotating phrases, pitch | Hello slot; the pitch goes to the 2D hero and the Index top line | Tier B | 2D |
| Portrait `developer.jpg` | Workshop wall frame (resized to 768×1024) | Tier A | 2D about |
| Logo (prompt mark) | HUD, favicon; accent period on the voxel `EMON.` | DOM + Tier A | — |
| 8 projects | 4 buildings + 3 props + "this island" pin | Tier A + B | Case-study sheets, Index, 2D |
| 31 screenshots | Building screens (featured: 2–3 each); full galleries in the sheets | Tier A | Sheet |
| Problem / solution / outcome (synthesised) | Sheets only (owner approval needed, §17) | DOM | — |
| Stack: 5 groups, 44 tools, notes, usage | Circuit tree (20 nodes, usage-sized); Index → Stack (all 44) | Tier A + DOM | 2D |
| Experience (3 roles), education | Career rail; "Full experience" sheet | Tier A + B | 2D |
| Languages, interests, principles, "right now" | Workshop pins and captions | Tier A + B | 2D about |
| Short bio / lead | About scrub line | Tier B | 2D |
| Services (8), formats (2), standards (4), process (4), FAQ (6) | Index groups; formats as brief step 1 | DOM | 2D |
| Notes (6) | "Related note" in sheets; Index → Notes (link out) | DOM | — |
| GitHub stats (27 public repos) and 9 featured repos | Index → Work footer "27 public repos on GitHub ↗"; "This site" pin | DOM | 2D |
| Contact channels, brief copy, API | Contact stop (email as text), brief sheet, `api/contact.ts` | Tier B + DOM | mailto fallback |
| Bengali (হ্যালো, স্বাগতম, বাংলা, বিসমিল্লাহ এগ্রো) | Preloader (DOM); farm sign and globe caption (CanvasTexture) | DOM + canvas | — |
| Testimonials (5, fictional) | **Dropped** | — | — |
| Counters 100+ / 8+ / 90+ / 99% | **Not shown** unless confirmed | — | 2D if confirmed |
| Anime avatar `image.webp` | Unused, pending owner (could become the Play Mode pilot) | — | — |

**`src/content.ts` migration.** Field-by-field mapping from `content.md` §13.
- New fields:
  - `profile`: `fullName`, `role`, `city`, `tz`, `availabilityLong`, `phone`, `whatsapp`; socials are GitHub, LinkedIn, Facebook and WhatsApp, with X dropped.
  - projects: `slug`, `subtitle`, `category`, `featured`, `metrics3`, `metrics`, `screenshots[{src,w,h,caption,label}]`, `problem`, `solution`, `outcome`, `architecture`, `highlights`, `privateLabel`, `note`, `prop`.
  - top-level: `experience[]`, `education[]`, `languages[]`, `aboutObjects[]`, `stackGroups[]` (tools with `usedIn`), `services[]`, `faq[]`, `notes[]`.
- **Dropped:** `level`, emoji copy.

---

## 8. The annotation system (label rig)

### 8.1 Anatomy

```
  ● ── anchor (Tier A world point: screen corner / node / rail node / object)
   ╲
    ╲  leader line: 1.5 px, accent, elbow at 40% of its length, drawn on 0→1
     ╲_______
             │ (WORK) 01 / 04 · EDTECH & LMS · 2025–26        ← mono 12–13 px, fg-3 + accent parens
             │ San Uni Academy.                                ← Funnel 600, 44 px / 30 px, period in accent
             │ Multi-vendor LMS, merchandise marketplace & …   ← Inter 17 px / 15 px, fg-2, max 2 lines
             │ Adaptive HLS   Stripe + SSLCommerz   GPT-4o-mini ← Funnel 28 px / 22 px numbers or terms
             │ VIDEO          SPLIT PAYOUTS         AI TUTOR    ← mono 12 px labels
             │ ( Case study )  Live site ↗                      ← SDF pill 44 px tall + text button
```

- **No plate.** Legibility comes from:
  1. slot placement against sky or plain wall;
  2. ink chosen per stop theme (light theme: ink `#12100d`, accent `#e8381b`; dark theme: cream `#f2eee6`, accent `#ff4a2e`);
  3. a troika outline halo (`outlineWidth 3%`, `outlineBlur 35%`, opacity .3, in the opposite ink);
  4. under `prefers-contrast: more` only, a solid SDF rounded plate at 92%.
- **Tier B.** The rig renders inside drei `<Hud renderPriority={2}>`, after the EffectComposer (priority 1, verified in `@react-three/postprocessing`).
  - It uses the main camera, so world coordinates parallax correctly.
  - `toneMapped={false}` gives exact brand hex values.
  - It is never blurred by TiltShift, never blooms and never fogs.
  - It is never occluded, so the composition solver must keep it off the subject (§8.3).
- **Anti-aliasing in the Hud.** The default framebuffer has `antialias:false`, so the Hud uses only SDF primitives: troika text, SDF rounded-rect pills, and an **SDF ribbon line** (a quad with `fwidth` edge AA, about 30 lines of shader) rather than `Line2`.
- **Tier A** (main scene, lit, fogged, occluded): building screens, node tags, ring text, rail nodes, pins' anchor dots, the console, the farm sign. Colours use the pre-compensated linear values from `design-language.md` §6 (accent `setRGB(1.142, .036, .020)`). Body luminance stays below the bloom threshold of .82.

### 8.2 Sizing (CSS px → world)

`worldPerPx = 2·d·tan(fov/2) / viewportCssHeight` at slot distance `d`. It is recomputed on resize, so browser zoom scales the text (an accessibility win). The type scale lives in one table per layout class:

| Element | wide (aspect ≥ 1.25) | square (0.8–1.25) | tall (< 0.8) |
|---|---|---|---|
| Hero name | `clamp(64, min(9vw,17vh), 168)` | 96 | 64 |
| Title | 44 | 38 | 30 |
| Line | 17 | 16 | 15 |
| Metric number | 28 | 26 | 22 |
| Mono eyebrow / labels | 13 / 12 | 12 / 12 | 12 / 12 |
| Button height / label | 44 / 15 | 44 / 15 | 48 / 15 |
| Max text width | min(560, 0.38·W) | min(520, 0.8·W) | W − 32 |

A text-size multiplier (1 / 1.25 / 1.5, set in the Index) scales all of these, and the slots reflow.

### 8.3 Placement: stop-anchored slots inside composition zones

Each layout class has one **composition preset**: a *text zone*, a *subject zone* and a *button band*, all in NDC.

| Class | Text zone | Subject zone | Button band |
|---|---|---|---|
| wide | x −0.92…−0.18, y −0.6…0.62 | x −0.1…0.9 | inside the text zone |
| square | top 34% | lower 62% | bottom band above the HUD |
| tall | top band (below the 56 px HUD) to 38% | 40%–86% | 87%–93% |

- **Anchoring.** The rig's block is unprojected from its slot through the **stop's solved camera pose** (not the live camera), at distance `d` (closer than the subject). It is oriented to the stop camera's quaternion with up to 8° of yaw toward the subject. This is the research's `placeSlot()`, without the view offset.
- **Behaviour.** The text exists in world space, so during the last 15% of arrival and the hold drift it has real parallax. It lands exactly in its zone on every aspect ratio.
- **Overlap guard (debug and CI).** Project the subject's bounding sphere and the rig's text bounds; fail if they intersect. Raycast from the stop camera to the 4 corners of the text bounds; warn if world geometry crosses a Tier A label.

### 8.4 Components (new files, §14)

- `WorldText`: brand presets, px sizing, theme ink, `FrontSide`, `depthWrite:false`, `renderOrder`, reveal material.
- `glyphReveal`: the verified `onBeforeCompile` shader ordered by `aTroikaGlyphBounds` (not `aTroikaGlyphIndex`, which is an atlas index). `colorRanges` always includes key 0.
- `LeaderLine`: SDF ribbon, `uDraw` 0→1.
- `Button3D`: SDF pill, label, invisible hit mesh ≥ 44 px, focus ring (2 px accent outline), labelled cursor, ARIA mirror id.
- `Pin`: anchor dot, short leader and label; expands on focus.
- `LabelRig`: composes the above from a `LabelSpec` in the timeline and runs the reveal timeline (§9.5).
- `AnnotationLayer`: the `<Hud renderPriority={2}>` root. It mounts the active and adjacent chapters' rigs, each in its own `<Suspense fallback={null}>` (drei `<Text>` suspends on mount; a late mount without local Suspense blanks the Canvas, as verified in the research).

---

## 9. Camera and text choreography

### 9.1 The timeline is data (replaces DOM-measured stops)

```ts
// src/journey/timeline.ts (sketch)
export type LayoutClass = 'wide' | 'square' | 'tall'
export interface Framing {
  subject: { center: V3; radius: number }            // bounding sphere that must be fully visible
  view: { azimuth: number; elevation: number }       // degrees; direction subject → camera
  drift?: { azimuth?: number; elevation?: number; dolly?: number } // Ken-Burns over the hold
  zones?: Partial<Record<LayoutClass, CompositionZones>> // per-stop override of the preset
}
export interface StopDef {
  id: StopId; chapter: ChapterId
  hold: number                 // vh of scroll at rest
  day: number                  // 0 dawn … 1 night (drives dayNight.ts)
  theme: 'light' | 'dark'      // annotation ink + HUD tokens
  framing: Framing
  label?: LabelSpec            // eyebrow/title/line/metrics/buttons/anchor, per layout class rows
  via?: { pos: V3; target: V3 }[] // optional waypoints shaping the travel INTO this stop
}
export const STOPS: StopDef[] = [ /* the 10 stops of §5 */ ]
```

- **Scroll ranges** are computed from data: cumulative `travelIn + hold`, normalised. The DOM is not read. `journey.stops` and `journey.chapters` keep their shape, so consumers barely change, but are filled from data.
- **The spine** (`Journey.tsx`, rewritten as `Spine.tsx`) renders one `<section data-stop>` per stop. Its height is `(hold + travelOut) × 100svh`, set from the same data. Its content is sr-only and absolutely positioned, so **fonts can no longer move the stops**. That removes the `document.fonts.ready → refreshScroll` re-measure.
- **Progress normalisation.** `p = scrollY / (totalVh × svhPx)` against a stable `svh` reference, plus `ScrollTrigger.config({ ignoreMobileResize: true })`. The mobile address bar then cannot shift the camera.

### 9.2 Framing solver (replaces `setViewOffset` and the portrait pull-back)

For each stop and layout class, given subject sphere `(c, r)`, view direction `v̂`, vertical fov `φ`, aspect `a` and subject zone `Z = [x0,x1]×[y0,y1]`:
- Half-extents of the zone in tangent space: `hy = (y1−y0)/2 · tan(φ/2)` and `hx = (x1−x0)/2 · tan(φ/2) · a`.
- `dist = r / sin(atan(min(hx, hy)))`. Camera position: `pos = c + v̂·dist`.
- **Aim offset:** the zone centre `(zx, zy)` must project onto `c`. Shift the look target by `−zx·tan(φ/2)·a·dist` along the camera's right axis and `−zy·tan(φ/2)·dist` along its up axis. One fixed-point iteration makes it exact.
- **The hold drift pose** comes from `drift` (azimuth, elevation, dolly), so the Ken Burns move is also composition-safe.
- **When it runs:** on resize (debounced 150 ms), on an orientation change, or a layout-class change. The output feeds `cameraPath.build()`.

Effects:
- The always-on lens shift goes away, and with it the mismatched JS/CSS breakpoints (the tablet bug).
- `PlayMode.clearViewOffset()` is no longer needed.
- drei `Html`'s view-offset bug becomes irrelevant.
- The Hud inherits a plain camera.
- FOV rules stay (45 / 52 / 58 by aspect).

**Sightline exclusions.** `layout.ts` currently keeps only the project cameras' sightlines clear, so lamp posts block the skills and about shots. Instead, compute exclusions from the solved poses of **every** stop for both `wide` and `tall` reference aspects at module load.

### 9.3 Path: arc length and a C1 speed profile (no stop-and-surge)

- **Control points:** the solved `pos`/`target` per stop (hold start and hold end), plus `via` waypoints. Centripetal Catmull-Rom as today.
- **Arc-length sampling:** precompute `posCurve.getLengths(512)` and map distance to `u` with `getUtoTmapping`. This fixes the 104 → 91 → 221 u/vh lurch, which comes from index-space `u`.
- **Speed profile, defined as speed per vh of scroll** and C1 by construction:
  - Hold: constant drift speed `v_h` (about 4–6 u/vh; the camera never fully stops).
  - Travel of length `L` over `T` vh: `v(u) = v_h + (v_pk − v_h)·sin²(πu)`, with `v_pk = (L/T − v_h)·2 + v_h`, so that `∫v = L`.
  - The speed equals `v_h` at both ends and its derivative is 0. That means no velocity kink at hold boundaries, and no 0.35–0.4 vh dead tails like `easeInOutCubic` leaves.
- **Travel length from perceived motion.** `M = L / max(8, meanTargetDistance) + Δθ` (radians of view-direction change), then `T = clamp(0.30 + 0.35·M, 0.35, 1.0)` vh. Project hops come out at about 0.45 vh and the intro and finale swoops are capped at 1.0 vh. Peak-to-mean speed is always ≤ 2 (today the peaks vary 3–5× between moves).
- **The day phase** is sampled along the same parameter, so the light changes smoothly with motion.

### 9.4 Follower, input and snap

- **One smoothing stage.** Lenis `lerp 0.1` (from .085, `wheelMultiplier .9`) plus a `maath/easing damp3` critically damped spring: smooth time 0.22 s for position and 0.26 s for the look target (slightly lazier, so the view does not swing). This replaces `cam.position.lerp(pos, damp(3.6))`, which has no ease-in and lurches on a wheel flick.
- **Pointer parallax** (±0.9 / ±0.5 u) is applied *after* the spring as its own small offset, so it never distorts the path. It is off under reduced motion and during inspect.
- **Proximity snap** (`lenis/snap`, already installed) to every hold centre: `type: 'proximity'`, `distanceThreshold: '25%'`, `duration: 0.9`, easing `1−(1−t)^4`, `debounce: 220`. It is disabled while dragging the scrubber, in Play Mode and while a sheet is open. On the reduced-motion path (no Lenis), CSS `scroll-snap-type: y proximity` on the spine sections gives native snapping.
- **Keyboard:** `↓`/`J` = next stop, `↑`/`K` = previous stop (calls `scrollToStop`). PageUp/PageDown and Space stay native.

### 9.5 The phase machine and the reveal timeline

Phase per stop: `before → arriving (last 15% of travel in) → settling → holding → leaving (first 10% of travel out, or a velocity spike) → after`.

**Settle condition** (it triggers the reveal): the phase is `holding` AND `|lenis.velocity| < 0.25` AND the spring residual `|cam − pose| < 0.12 u`, *or* 120 ms after the snap completes. Reveals are **triggered and timed** (consistent whatever the scroll speed), not scrubbed. The exception is the About line, which is scrub-lit by design.

| t (ms after settle) | Element | Motion | Ease | Duration |
|---|---|---|---|---|
| −(arriving 85%) | Anchor dot | Fades in with one pulse ring: an anticipation cue showing where to look | spring `0.34,1.56,0.64,1` | 400 |
| 0 | Leader line | Draws from the anchor to the label (`uDraw` 0→1) | em `0.22,1,0.36,1` | 450 |
| 120 | Eyebrow | Mono decode: 3 scramble ticks at 35 ms, then settles | linear | 300 |
| 200 | Title | Per-glyph masked rise from 112% + fade, ordered by x and line (28 ms per char-equivalent) | em | 1100 |
| 420 | Line | Per-word rise (38 ms per word) | em | 900 |
| 560 | Metrics | Numbers count up in JetBrains Mono digits with fixed slots (troika ignores `tnum`; this avoids width jitter); labels fade | power3.out | 900 |
| 700 | Buttons | Scale .92→1 + fade | spring | 500 |
| 900 | Screen | Slideshow starts (crossfade every 3.5 s); the screen de-zoom started on arrival | sine | 600 |

- **Readability.** The title is readable at about 600 ms after settle and the full rig is complete at about 1.4 s.
- **Exit:** `uReveal 1→0` in reverse order over 320 ms `power2.in`, rising 20% and fading; the line retracts to its anchor in 250 ms. After that the rig is `visible=false`, which costs no draw calls.
- **Re-entry** (scrolling back) re-runs the reveal once it is settled again.
- **Fly-through** (scrolling past fast): the settle condition is never met, so nothing reveals, nothing flickers, and the aria-live caption stays quiet.

### 9.6 What happens mid-travel (explicit)

- **Text:** none. No Tier B text is visible. Tier A objects (screens, ring text, tags) remain because they are part of the world.
- **Rack focus:** TiltShift blur ramps 0 → .09 during travel (miniature look) and back to 0 at holds, so annotations and screenshots are always sharp. This means keeping a ref to `TiltShift2` in `Effects.tsx`.
- **FOV breathing:** +3° at peak speed, springed. A subtle bank of at most 1.5° only on the two long swoops, because recruiter-first wants calm.
- **HUD:** the scrubber line moves. The chapter label rolls (200 ms) at the travel midpoint between chapters.
- **Anticipation:** the next stop's anchor dot appears at 85% of the travel.
- **The world** carries the motion: day/night palette, birds, clouds, wind audio scaled by velocity (existing `audio.setWind`).

### 9.7 Jumps, inspect and deep links

- **Near jump** (≤ 1 chapter away): Lenis `scrollTo`, duration `clamp(0.5 + 0.18·Δvh, 0.7, 1.6)` s, `expo.inOut`. Labels are suppressed by the velocity gate. This replaces the fixed 2.2 s.
- **Far jump** (> 1 chapter, or from the Index):
  - The portfolio3 **curtain**: accent panel, then the bg panel 0.09 s later, 0.72 s expo.inOut with a curved arc and the destination word plus index ("Esports Arena", "04").
  - While the screen is covered, the camera is cut (progress set immediately, spring reset).
  - Reveal 0.85 s. The label then reveals as usual.
  - A recruiter reaches any project in about 1.6 s with no rip through the island.
- **Inspect** (case study, brief): pose blending inside `JourneyCamera` (`live.inspectW` 0→1, 0.9 s expo.inOut). The inspect pose comes from the framing solver with a "sheet" zone (the left 40% on desktop). There is no second controller, which is the classic source of jitter. The **clip handoff** happens at `inspectW > 0.7`: the screen plane's 4 corners are projected to CSS px, and the sheet mounts with `clip-path: inset(…)` equal to that rectangle, animating to its final rectangle over 0.8 s expo.inOut. Closing runs the reverse.
- **Deep links:** `#/work/<slug>` etc. On load the takeoff is skipped, the camera cuts to the stop and the sheet opens. `pushState` is used on sheet open, so Back closes it.

### 9.8 Smoothness guarantees (no jank)

1. **No DOM reads in the frame loop.** Scroll length is static per layout class.
2. **No React re-renders per frame.** The stop index and theme change only at boundaries (store with an equality check). The scrubber line is a CSS `transform: scaleX()` written once per frame from the GSAP ticker; this is composited and triggers no layout.
3. **All troika layouts are computed during preload** in the worker, with characters from the content. The 3 TTF faces are preloaded through `preloadFont` and fed into the loader progress. A reveal never triggers a re-layout. On resize, the new layout is ready before the swap.
4. **Shader warm-up:** all rigs are mounted `visible` at `fillOpacity 0` during `SceneReady`, then `gl.compileAsync`. `gl.compile` only walks visible objects, as the research verified in r186.
5. **Texture warm-up:** `useTexture.preload` + `initTexture` for the next chapter on `requestIdleCallback`. Screenshots are resized to 1024 px (desktop) and 768 px (low tier).
6. **No `backdrop-filter` anywhere in the journey.** The HUD uses CSS gradient scrims, which are plain alpha compositing.
7. **The canvas freezes** (`frameloop="demand"`) under sheets and the Index.
8. **Fonts and the address bar can no longer move stops** (§9.1).

---

## 10. Brand carried into 3D

| portfolio3 move | In the island |
|---|---|
| Warm black + vermilion "rising sun" + cream light theme | Re-key `dayNight.ts` PALETTES: **dawn** = warm dark sky (`#191714` top), vermilion/orange horizon glow (`#ff4a2e` → `#ff8a4c`), a breathing sun disc; **day** = cream fog and sky (`#efebe3` / `#e7e2d7`, not blue); **night** = `#0a0908` → `#191714` with a faint vermilion city glow. The scroll walks the brand's light theme into its dark theme, and annotations and HUD flip ink with it (`theme` per stop). The cyan `#7ff3ff` crystal and focus colours become accent. |
| Grain (.07) | postprocessing `Noise` (overlay ≈ .06), high tier only. No DOM SVG grain over the canvas. |
| Funnel Display 600 mega type, accent line, closing period | Hero name, titles ("San Uni Academy.", "Tools I reach for.", "Let's build something *worth shipping.*"), metric numbers. `letterSpacing −0.058/−0.05`, `lineHeight .84/.9`. |
| Inter for reading, JetBrains Mono uppercase eyebrows, `(Label)` with accent parens, zero-padded indices | Rig lines and buttons; eyebrows `(Work) 01 / 04`; metric labels; HUD. |
| Masked rise-in reveals, 28 ms/char, 38 ms/word, house ease | `glyphReveal` shader, `CustomEase.create('em','0.22,1,0.36,1')`. Reveals are gated on settle, the 3D equivalent of portfolio3's "ready" gate. |
| Terminal identity | Console screen on the launch pad typing `whoami` / `cat stack.txt` / `./now.sh`; `⌘K` Index; prompt logo. |
| Bilingual preloader, `000%`, curved lift | DOM preloader, real progress, the lift flowing into the takeoff. |
| Accent + bg curtain | Far jumps only. |
| Live Dhaka clock + green ping | HUD bottom-left (DOM, so the `#2ee59d` ping keeps its exact colour; ACES would shift it). |
| Scrub text | About line. |
| Rotating-word slot | Hero role line. |
| Labelled cursor, magnetic | Desktop: labels on 3D hover ("View", "Open", "Launch", "Copy"); magnetic on the HUD Contact button. |
| Laser line | Skills circuit traces in accent; the career rail glows node by node. |
| Voice | Copy taken verbatim from portfolio3. **Zero emoji**: icons are meshes in 3D and inline SVG in the DOM (the current site has 27 emoji). |

**Fonts.**
- **3D:** static TTF instances (troika rejects WOFF2 and renders a variable font's default instance, which for Funnel is Light 300).
  - `FunnelDisplay-600.ttf` (13.8 KB gz), `Inter-400.ttf` and `Inter-500.ttf`, `JetBrainsMono-400.ttf`. Already produced in `scratchpad/fontreal/` with `flavor=None`; the first 4 bytes are checked to be `00 01 00 00`.
  - Subset Inter and JBM to Latin plus the punctuation in use with `pyftsubset … --layout-features='*'`, about halving them.
- **DOM:** the original portfolio3 WOFF2 variable files with `@font-face`.
  - Subset Noto Sans Bengali to the glyphs actually used (`--text="হ্যালো স্বাগতম বাংলা বিসমিল্লাহ এগ্রো"`, keeping the GSUB features), from 108 KB to a few KB.
- **Remove** `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`.

---

## 11. Mobile (390×844 portrait, and other sizes)

**HUD.**
- Top bar: 56 px + `env(safe-area-inset-top)`: the logo mark + "Emon Miah" (Funnel 17 px), then `Index` and **Contact** on the right (36 px visual, 44 px hit area).
- Bottom bar: 48 px + safe area: the 2px progress line, `02 / 05 WORK`, and the sound icon.
- The availability line moves under the hero role.

**Frame per stop** (tall preset: text in the top band, subject in the middle-lower area, buttons above the bottom HUD):

| Stop | Top band | Subject | Buttons (48 px) |
|---|---|---|---|
| Hello | Name 64 px, two lines; role 17 px with slot; `● Open to full-time & contract roles` 13 px | Island lower 55% | **See my work** · Let's talk |
| Work index | `Products that ship and scale.` 30 px; `8 projects · tap a building` mono 12 | Island from above; 4 pins (names only) + "+4 more" | All projects |
| Project | Eyebrow 12, title 30, subtitle 15 px (≤ 2 lines), 3 metrics (22 px numbers, ~119 px columns; "10,000+" ≈ 75 px wide) | Building with screen; leader line rises from the screen top to the metric row | **Case study** · Live |
| Stack | Title 30 + line | Tree; 6 top tags; tap a branch to focus its group | All 44 tools |
| Experience | Title; 3 stacked rows (date / role / org) | Rail on the wall; leaders drop to the nodes | Full experience |
| About | Scrub line 24 px; the focused caption replaces it while a pin is focused | Room with pins (titles) | — |
| Contact | Title 34 px; email mono 15 px + Copy | Rocket and pad | **Start a brief** · LinkedIn · GitHub · WhatsApp (44 px each) |

**Input and scroll.**
- Taps, not hovers. Invisible hit meshes ≥ 44×44 CSS px around buttons and pins. The existing `e.delta > 8` drag guard stays.
- No pinch or orbit in the journey.
- Lenis touch + proximity snap, so one swipe usually moves one stop. Total scroll ≈ 11.5 × 844 ≈ 9,700 px.

**Word caps.** ≤ 20 running words per stop. The Work index shows 4 pins instead of 8.

**Low tier** (`detectQuality` already selects it for coarse + small screens):
- DPR ≤ 1.25, no shadows, no TiltShift (rack focus is moot).
- 768 px screenshots; only the active and next project's textures are resident.
- `useTexture.clear` for chapters behind.
- Canvas textures redraw at ≤ 15 fps and only while on screen.

**Landscape phone (844×390)** is classed `wide-short`: wide zones with the `square` type scale, and the hero name capped at 56 px. **Tablet (820×1180)** is `tall`, which fixes today's mid-screen card bug because zones and solver come from the same data.

**Verification.** Re-shoot `SH/audit-390-*` with the existing Playwright tools, assert R6, and assert no overlap between the text zone and the projected subject sphere.

---

## 12. Accessibility

1. **DOM spine** (`Spine.tsx`).
   - Every stop is a `<section aria-labelledby>` with real headings (one `h1` for the name, `h2` per chapter, `h3` per project).
   - It contains *more* than the 3D shows: the full summary, metrics, and links for case study, live and code.
   - The content is visually hidden (sr-only clip), never `display:none` or `aria-hidden`.
   - The canvas stays `aria-hidden` (as today).
2. **Focus mirroring.**
   - On `focusin` inside a section, call `scrollToStop`. A near jump is a glide, a far jump a cut.
   - Set `focus3d` to the element's `data-target`. The matching `Button3D` or `Pin` shows a 2 px accent focus ring and lifts slightly.
   - A small **focus chip** appears bottom-centre, showing the focused control's label, so sighted keyboard users see what has focus. This is the only DOM that appears, and only on keyboard focus.
   - Enter and Space run the same action as clicking the mesh.
3. **Live caption.** One `aria-live="polite"` region, updated on settle (debounced 400 ms, velocity-gated). For example: "Work, 1 of 4: San Uni Academy. Multi-vendor LMS. Case study available."
4. **Keyboard map:**
   - `↓`/`J` and `↑`/`K` between stops; `⌘K` or `/` for the Index; Esc closes sheets.
   - Tab order: HUD → spine (stop order) → footer links.
   - Sheets and the Index trap focus and restore it to the invoking control.
   - `/` is ignored while a text input is focused.
5. **Reduced motion.**
   - No takeoff (the visitor starts at Hello), no curtain.
   - Stop changes are **cuts** with a 180 ms sky-colour crossfade.
   - Text uses opacity fades only, with no glyph motion.
   - No slideshow autoplay (manual arrows in sheets), no FOV breathing, bank or parallax, no `Float`.
   - Lenis off plus CSS scroll-snap. The rotating word is static. Counters show final values.
6. **Contrast and size.**
   - `prefers-contrast: more` forces SDF plates behind all Tier B text and a solid HUD background.
   - Text-size multiplier (1 / 1.25 / 1.5) in the Index; px-based sizing also follows browser zoom.
   - The automated pixel test enforces R6.
7. **Caption mode.** An Index setting, "Show text bar", adds a plain full-width bottom caption strip mirroring the active stop's text, for visitors who cannot read in-world type.
8. **2D mode** (`FlatSite.tsx`, rebuilt on portfolio3 tokens and structure).
   - It is the complete alternative and the target of the "Skip to content" link.
   - It is the automatic fallback on WebGL failure (existing `SceneBoundary`), on `?mode=2d` and on Save-Data. It is *offered* after 3 s under 30 fps on the first stop.
   - It keeps portfolio3's light/dark toggle.
9. **SEO and no-JS.** All copy lives in the spine and the 2D DOM. Add JSON-LD `Person` (name, jobTitle, address Dhaka, sameAs socials), a real `<noscript>` and the OG image (`npm run og` exists).
10. **Skip `@react-three/a11y`.** Its last release was in 2022 and it depends on zustand 3; the spine does the same job.

---

## 13. Performance budget

**Baseline measured for this proposal** (production build, `?debug` RenderInfo, SwiftShader; draw counts are reliable, fps is not). `calls` includes post-processing passes, because the overlay accumulates across the composer.

| Stop | 1440×900 high: calls / tris / tex | 390×844 low: calls / tris / tex |
|---|---|---|
| start | 138 / 69.2k / 19 | 88 / 35.2k / 12 |
| project-0..3 | 125–138 / 64.6–68.8k / 20–23 | 65–76 / 31.0–32.6k / 14–17 |
| skills | 89 / 61.8k / 23 (+15 DOM pills) | 42 / 28.8k / 17 (+15) |
| about | 103 / 62.1k / 23 (+6 DOM tips) | 53 / 29.2k / 17 (+6) |
| finale | 163 / 72.4k / 23 | 98 / 37.5k / 17 |

**Budget:**

| Item | Desktop (high) | Phone (low) |
|---|---|---|
| Target frame rate | 60 fps on an integrated GPU (Iris Xe / M1) at DPR ≤ 1.75 | ≥ 50 fps on a mid phone (iPhone 12 / Snapdragon 7-series) at DPR ≤ 1.25 |
| GPU frame time | ≤ 10 ms | ≤ 16 ms |
| Annotation draw calls added | ≤ 30 per stop (1 rig ≈ 14: eyebrow, title, line, 6 metric texts, line, 2 pills + labels; overview pins 8×2) | ≤ 20 |
| Peak draw calls | ≤ 190 | ≤ 120 |
| Triangles | ≤ 85k (secondary props ≤ 6k) | ≤ 45k |
| Screenshot textures resident | ≤ 10 × 1024 px (≈ 3.7 MB each ≈ 37 MB) | ≤ 4 × 768 px (≈ 2.1 MB each) |
| GPU memory | ≤ 350 MB | ≤ 180 MB |
| JS gz, initial | index ≤ 130 KB; three/drei chunk 243 → ≈ 290 KB with troika (+41.5 KB), maath (+1.1 KB), snap (+2 KB) | same |
| Fonts | 3D TTF ≈ 55–70 KB gz (subset); DOM WOFF2 ≈ 110 KB + Bengali subset ≈ 5 KB | same |
| Time to first 3D frame | ≤ 2.5 s on a fast connection | ≤ 4 s on 4G (preloader paints < 300 ms) |
| Transfer before the first frame | ≤ 1.6 MB (screenshots load on idle, after the hero) | ≤ 1.3 MB |
| Main-thread work per frame | ≤ 2 ms (no DOM reads, 1 transform write) | ≤ 4 ms |

**Savings that pay for the new layer:**
- No `backdrop-filter` re-blur under 3 surfaces every frame.
- No per-frame `<Html>` style writes (15 skill pills + 6 tips).
- No 24 fps `drawDemo` canvas uploads on 4 buildings; static screenshots upload once.
- `visible=false` for every rig outside its stop.
- `frameloop="demand"` under sheets.

`PerformanceMonitor` keeps stepping quality down. A new step-down order:
1. grain;
2. TiltShift;
3. shadow map size;
4. DPR;
5. texture size.

---

## 14. Engineering plan for this codebase

### 14.1 Architecture after the change

```
content.ts (real data) ──► journey/timeline.ts (STOPS, CHAPTERS, LabelSpecs)
                                │
          layout class + size ──┤──► journey/framing.ts  (solved poses per stop)
                                │            │
                                │            ▼
                                │    systems/cameraPath.ts (arc-length, C1 speed) ──► scenes/JourneyCamera.tsx (damp3, inspect blend)
                                │
                                ├──► systems/scroll.ts (ranges from data, Lenis+Snap, jumps, deep links) ──► live.progress / stopIndex / phase
                                │
                                ├──► ui/Spine.tsx (sr-only sections, heights from data, focus mirroring, aria-live)
                                │
                                └──► annotations/AnnotationLayer.tsx (<Hud renderPriority=2>) ── LabelRig / Pin / Button3D / LeaderLine / WorldText
DOM chrome: ui/Hud.tsx (top+bottom bars, scrubber) · ui/Index.tsx (⌘K) · ui/CaseStudy.tsx · ui/Brief.tsx · ui/Toasts.tsx · ui/FlatSite.tsx
```

### 14.2 New files

| File | Purpose |
|---|---|
| `src/brand.ts`, `src/styles/tokens.css` | portfolio3 tokens (colours, ACES-compensated linear values, type scale, eases, staggers) shared by the DOM and 3D. |
| `src/journey/timeline.ts` | `STOPS`, `CHAPTERS`, `LabelSpec`s, holds, day, theme, framing. |
| `src/journey/layoutClass.ts` | Aspect classes, composition zones, the px type scale. |
| `src/journey/framing.ts` | `solveStopPose(stop, fov, aspect, class)`, sightline-exclusion export. |
| `src/journey/phase.ts` | `stopPhase()`, settle detection, `useStopPhase(id)`. |
| `src/text/fonts.ts` | `FONTS`, `preloadFonts()` → loader progress. |
| `src/text/WorldText.tsx`, `src/text/glyphReveal.ts` | Text presets and the verified per-glyph reveal shader. |
| `src/text/canvasText.ts` | CanvasTexture text for Bengali and the console. |
| `src/annotations/{AnnotationLayer,LabelRig,LeaderLine,Pin,Button3D,FocusRing}.tsx` | The annotation system. |
| `src/scenes/projects/screenMaterial.ts` | Rounded-corner, crossfade and de-zoom screen shader. |
| `src/scenes/props/Secondary.tsx` | Farm terraces (+ Bangla sign), pavilion, chat mast. |
| `src/scenes/about/CareerRail.tsx`, `src/scenes/about/PortraitFrame.tsx` | Experience rail; portrait. |
| `src/ui/Hud.tsx`, `src/ui/Scrubber.tsx`, `src/ui/Index.tsx`, `src/ui/CaseStudy.tsx`, `src/ui/Brief.tsx`, `src/ui/FocusChip.tsx`, `src/ui/Curtain.tsx`, `src/ui/clipHandoff.ts` | DOM chrome and the on-request sheets. |
| `src/systems/deeplink.ts` | Hash routes ↔ stops and sheets. |
| `api/contact.ts` | Vercel function porting portfolio3 `app/api/contact/route.ts` 1:1: Resend, honeypot `hp`, 4 messages per 10 min per IP, auto-reply, env `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`. It returns 503 without a key, and the client falls back to `mailto:`. `profile.formEndpoint` stays as an alternative for other hosts. |
| `public/fonts/*`, `public/assets/projects/*.webp` (1024 and 768 variants), `public/assets/developer-768.jpg` | Assets. A one-off `scripts/prepare-assets.mjs` resizes them; the outputs are committed. |

### 14.3 Changed files

| File | Change |
|---|---|
| `src/content.ts` | Real portfolio3 data and the new schema (§7); remove `level`, emoji, X/Twitter, fictional About and shards. |
| `src/systems/scroll.ts` | `measure()` computes ranges from `STOPS`, not DOM rects; stable `svh` normalisation; `ignoreMobileResize`; Lenis `lerp .1` + Snap; distance-scaled `scrollToStop`; far-jump curtain hook; `stopIndex` and `theme` to the store at boundaries only. |
| `src/systems/cameraPath.ts` | `KEYFRAMES` replaced by solved stop poses and `via` points; arc-length sampling; the §9.3 speed profile; `day` per stop. |
| `src/scenes/JourneyCamera.tsx` | **Remove `setViewOffset` and the portrait pull-back** (L42-52); `damp3` springs; parallax after the spring; FOV breathing; inspect pose blend; reduced-motion cuts; 2.4 s takeoff chained to the preloader lift. |
| `src/systems/dayNight.ts` | Re-keyed palettes (dawn / cream day / warm night). |
| `src/scenes/environment/Effects.tsx` | `TiltShift2` ref for rack focus; `Noise` grain (high only); the stack itself is unchanged. |
| `src/scenes/projects/ProjectsDistrict.tsx` | Screenshot screens through `screenMaterial`; rise driven by phase (not `journey.stops`); remove the dome billboard posts; screen click → inspect + case study; labelled cursor. `demoScreen.ts` is deleted. |
| `src/scenes/skills/SkillsGarden.tsx` | Drop `<Html>`; SDF tags (Billboard + ScreenSizer); usage-sized nodes for 20 tools; accent traces; ring text. |
| `src/scenes/about/AboutWorkshop.tsx` | Drop `<Html>` tooltips and hint bulbs; real objects; pins; rail and portrait mounts. |
| `src/scenes/finale/Finale.tsx` | Console types the terminal script; rocket → brief handoff; cyan window → accent. |
| `src/scenes/intro/Landmarks.tsx` | Accent period block on `EMON.`. |
| `src/scenes/world/Town.tsx`, `src/systems/layout.ts` | Featured slots from `featured` projects; `DISTRICTS` entries for the 3 props; exclusions from all solved stop poses (fixes the lamp posts). |
| `src/scenes/Experience.tsx` | Mount `AnnotationLayer`; `SceneReady` warms text and rigs (`compileAsync`); `frameloop` switches to `demand` under sheets. |
| `src/scenes/play/PlayMode.tsx` | Remove `clearViewOffset`; real shards; no emoji. |
| `src/state/store.ts` | Add `stopIndex`, `theme`, `focus3d`, `inspect`, `sheet`, `indexOpen`, `textScale`; replace `hoveredAbout`/`pinnedAbout` with `focusAbout`. |
| `src/App.tsx` | Auto-enter; mount Hud, Index, CaseStudy, Brief, Curtain and deep links; Play chunk preload keyed to the `experience` chapter. |
| `src/ui/Journey.tsx` | Becomes `Spine.tsx` (no visible cards, no `useReveal`). |
| `src/ui/FlatSite.tsx` | Rebuilt with the portfolio3 structure and tokens from the same content. |
| `src/styles/global.css` | Delete `.card`, `--glass*`, `.hero-card`, `.chapters`, `.progress-rail`, `.skill-label`, `.about-tip` and the mobile bottom sheet; add HUD, Index, sheet and toast styles from portfolio3 `ui.css`/`chrome.css`. |
| `index.html` | portfolio3 preloader, auto-lift, JSON-LD, `theme-color #0a0908`. |
| `package.json` | Deps below. |

**Deleted:** `src/ui/Nav.tsx` (→ Hud), `src/ui/ProjectModal.tsx` (→ CaseStudy), `src/ui/ContactTerminal.tsx` (→ Brief; the terminal look survives in the console), `src/scenes/projects/demoScreen.ts`, and every `@react-three/drei` `Html` import in the journey.

### 14.4 Packages

- **Add as direct dependencies** (already transitive through drei, so no new download): `troika-three-text@^0.52.4` (for `preloadFont`; 41.5 KB gz enters the build when `<Text>` is first used) and `maath@^0.10.8` (`easing.damp3`, 1.1 KB gz).
- **Use what is installed:** `lenis/snap` (2 KB gz) and `gsap/CustomEase` (free in gsap 3.15).
- **Remove:** the 3 `@fontsource-variable/*` packages.
- **Avoid:** `@react-three/uikit` (377 KB gz measured), `@react-three/a11y` (stale), `@theatre/r3f` (inactive), `three-msdf-text-utils` (needs offline atlases).
- **Optional dev dependency:** `sharp` for `prepare-assets.mjs`. Committing pre-sized outputs avoids it.

### 14.5 Font conversion (reproducible; already done in the scratchpad)

```bash
python3 -m venv ftenv && ftenv/bin/pip install fonttools brotli
for spec in "FunnelDisplay wght=600" "Inter wght=400" "Inter wght=500" "JetBrainsMono wght=400"; do
  set -- $spec
  ftenv/bin/fonttools varLib.instancer ../portfolio3/app/fonts/$1.woff2 $2 --update-name-table -o /tmp/$1-${2#wght=}.woff2
  ftenv/bin/python -c "from fontTools.ttLib import TTFont;f=TTFont('/tmp/$1-${2#wght=}.woff2');f.flavor=None;f.save('public/fonts/$1-${2#wght=}.ttf')"
done
# subset Latin + used punctuation, keep layout features (kerning/ligatures)
ftenv/bin/pyftsubset public/fonts/Inter-400.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+00B7,U+2212" --layout-features='*' --output-file=public/fonts/Inter-400.ttf
# DOM Bengali: subset to the glyphs actually used, keep GSUB for conjuncts
ftenv/bin/pyftsubset ../portfolio3/app/fonts/NotoSansBengali.woff2 --text="হ্যালো স্বাগতম বাংলা বিসমিল্লাহ এগ্রো" --layout-features='*' --flavor=woff2 --output-file=public/fonts/NotoSansBengali-sub.woff2
head -c4 public/fonts/*.ttf | xxd   # every TTF must start 00 01 00 00 (troika rejects wOF2)
```

**Content guard.** A build-time check fails if any 3D string contains → ↗ ✕, an emoji or Bengali (troika would fetch CDN fallback fonts or mis-shape the text).

### 14.6 Migration safety

- The `?legacy` URL flag keeps today's cards until Phase 2 ships, so nothing is broken mid-way.
- `journey.stops` and `journey.chapters` keep their `Map<string, Range>` shape (filled from data), so Play Mode, audio and egg code keep working.
- `live.chapterT` is retained for the skills lighting and similar consumers.

---

## 15. Phases and effort (one experienced R3F developer)

| Phase | Scope | Effort | Exit criteria |
|---|---|---|---|
| **P1 — Truth and foundations** | Port the content into `content.ts` (real profile, 8 projects, experience, stack, about, shards); brand tokens; fonts (TTF + WOFF2, subsets); `timeline.ts`, `framing.ts`, arc-length + C1 path, `damp3`, snap, stable `svh`; **remove `setViewOffset`**; Spine with data heights; screenshot screens; dome posts removed; lamp-post exclusions. Temporary text: the a11y caption bar (permanent feature, built early). | 5–6 d | New 10-stop flight; **no glass cards**; real screenshots; camprofile shows no dead zones (speed ≥ `v_h` everywhere, peak/mean ≤ 2); 11.5 vh total. |
| **P2 — Annotation system and recruiter lane** | `WorldText`, `glyphReveal`, `LeaderLine`, `Button3D`, `Pin`, `LabelRig`, `AnnotationLayer` (Hud), phase machine and reveal timeline; Hello, 4 project and Contact rigs; HUD + scrubber; Index ⌘K; case-study sheet with clip handoff; deep links; curtain jumps; auto-enter preloader. | 6–7 d | **R1, R2, R3 pass** at 1440 and 390; a recruiter reaches any project's case study in ≤ 2 interactions. |
| **P3 — Remaining chapters** | Work-index overview + 3 secondary props (Bangla sign canvas); Stack tree rework (usage nodes, SDF tags, ring text, accent traces); Workshop: career rail, real objects + pins, portrait, scrub line; console terminal; day/night re-key; Brief sheet + `api/contact.ts`. | 5–6 d | All 10 stops final; R4 word caps enforced by the build check. |
| **P4 — Mobile, accessibility, performance** | Per-stop `tall`/`square`/`wide-short` tuning; hit areas; focus mirroring, focus chip, aria-live; reduced-motion cuts; contrast mode; text scale; 2D rebuild; texture residency, compile warm-up, `frameloop` demand; Playwright suite (§16) at 5 viewports; real-device frame-time pass on one mid Android and one iPhone. | 4–5 d | R5 and R6 pass; perf budget met on real devices; axe clean on the spine and 2D. |
| **P5 — Polish (optional)** | Per-project building re-skins (SUA video wall, clinic tooth sign + waveform ring, neon arcade, stadium bowl); velocity ring marquee; labelled cursor and magnetic; grain; OG image and JSON-LD; Play Mode avatar if approved. | 3–4 d | Art review against `SH/` before/after contact sheets. |

**Total ≈ 23–28 days** (20–24 without P5). The highest-value cut: P1 + P2 alone already fix the complaint and give recruiters the fast lane, about 2.5 weeks.

---

## 16. Verification plan (extend `scratchpad/tools`)

1. `audit.cjs` → `audit2.cjs`:
   - Shoot each stop's settle frame at 1440×900, 1920×1080, 1366×657, 820×1180 and 390×844, plus the 6-frame p0→p1 filmstrip.
   - Assert R1: no `backdrop-filter`, and no opaque DOM boxes over the canvas.
   - Assert zero Tier B text visible mid-travel, read from a `window.__annotations` debug hook.
2. **R2 timer:** a debug hook timestamps the reveal of the name, role, availability, 4 project names and Contact. Assert ≤ 10 s from `navigationStart` with Playwright network throttling (Fast 4G).
3. **R6 contrast:** read the projected bounds of each rig from the hook, sample the frame pixels behind them (with text hidden for one frame via a debug toggle), and compute WCAG contrast against the rig's ink.
4. **Camera profile:** re-run `camprofile.mjs` against the new `cameraPath.ts`. Assert min speed ≥ `v_h`, no speed discontinuity at hold boundaries, and peak/mean ≤ 2 per travel.
5. **Overlap guard:** the projected subject sphere must not intersect the text bounds (all stops × all layout classes).
6. **Draw calls:** `perfbase.cjs` per stop must stay within the §13 budget.
7. **Accessibility:** axe on the Spine and 2D; a scripted keyboard walk (Tab through every stop, Enter on every button) verifies scroll-to-stop and focus rings; reduced-motion run (`emulateMedia`) verifies cuts and static text.

---

## 17. Risks and honest trade-offs

1. **The annotation layer could become "cards drawn in WebGL".** That happens if plates creep back or word counts grow. *Mitigation:* R1 and R4 are enforced by tests and the build check. Every block is anchored by a leader line. Design reviews use before/after contact sheets.
2. **Legibility without plates over changing 3D backgrounds** is the hardest visual problem. *Mitigation:* slot choice against sky or wall, ink per stop theme, outline halo, automated contrast test per viewport, plates only under `prefers-contrast`. Some stops will need hand-tuning of slot or camera angle.
3. **Tier B annotations are never occluded** (the Hud clears depth). If the composition is wrong, text can sit over the subject. *Mitigation:* the solver keeps zones disjoint, plus the overlap guard in CI.
4. **The palette re-key changes the island's character** from pastel blue sky to warm cream and black. The owner may prefer the current look. *Mitigation:* palettes are data; ship the dawn hero fix first and A/B the day palette.
5. **Snap can feel like scroll-jacking** to trackpad users. *Mitigation:* proximity mode with a 25% threshold and an easy opt-out (Index → Settings), off under reduced motion.
6. **Framing-solver edge cases** (21:9 monitors, 844×390 landscape phones, split-screen tablets). *Mitigation:* the `wide-short` class, clamps on distance and fov, and a test matrix of 5+ viewports.
7. **Auto-enter removes the "Enter with sound" choice.** Sound stays off by default and the HUD toggle is one click. Some visitors liked the gate. *Mitigation:* keep a sessionStorage flag so returning visitors skip the greetings.
8. **Bengali cannot go through troika** (verified). It is limited to the DOM and canvas textures, which is more code paths to maintain.
9. **Content truth needs the owner.**
   - The problem/solution/outcome copy was synthesised by the analysis stage from existing text.
   - "0 double-bookings" and the "Esports Arena" merge are presentational choices.
   - The counters are self-reported.
   - The `*.emon.pro` live links are unverified.
   - The GKEC role names are inconsistent between sections.
   - Nothing ships without sign-off; a link check hides dead "Live" buttons.
10. **Contact backend.** A static Vite host needs `api/contact.ts` (Vercel) or a form endpoint. `CONTACT_TO_EMAIL` differs between portfolio3's `.env.example` (`dev@emon.pro`) and its code (`maremon15@gmail.com`).
11. **Effort.** About 4–5 weeks is a real investment. The custom accessibility spine needs real screen-reader QA (VoiceOver iOS/macOS, NVDA); automated tests do not cover it.
12. **SwiftShader limits verification.** Frame rate and GPU memory must be measured on real devices in P4. CI checks only draw calls, contrast and composition.
13. **SEO duplication** with emon.pro. Decide which domain is canonical (§18).

---

## 18. Open questions for the owner

1. Confirm the 4 featured projects and the **GKEC + BOE → "Esports Arena"** merge (or feature GKEC alone and move BOE to a pin).
2. Is there (or can there be) a **résumé PDF**? It is the single biggest recruiter win still missing; it would get a HUD and Index slot.
3. Show the self-reported counters (100+ projects, 8+ clients, 90+ contributions, 99% satisfaction)? This proposal leaves them out of 3D.
4. Approve the synthesised problem/solution/outcome copy and the metric triplets in §6.3.
5. Keep the cat as an unlabelled prop? Use the anime avatar (`image.webp`) as the Play Mode pilot?
6. Deployment: will the 3D site replace emon.pro, or live at a subdomain (canonical tag)? Which contact path: Resend function or Formspree? Which `CONTACT_TO_EMAIL`?
7. Is the warm cream/black re-key of the island's sky wanted, or only for the dawn hero and night finale?
