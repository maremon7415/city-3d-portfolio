# Overlay audit — "Floating Island City" journey (3D) mode

Scope: everything drawn **on top of / inside** the 3D canvas in journey mode (not Play Mode HUD, not the 2D FlatSite).
Build audited: production preview at http://localhost:4173 (commit a5541de). Software (SwiftShader) rendering, so
frame-rate impressions come from code + measured curves, not from the screenshots' fps.

All paths below are absolute. `SH` = `<analysis-sandbox>/shots`
`AN` = `<analysis-sandbox>/analysis`

---

## 0. TL;DR

1. **The "2 weird cards" problem.** The page shows its content in **flat, dark, frosted-glass HTML boxes** sitting over the 3D scene.
   **Card #1:** the big content card (`.card`). It is pinned on the left on desktop and becomes a bottom sheet on mobile.
   **Card #2:** a second glass box that appears in the same frame and repeats the same content:
   - the About tooltip (`.about-tip`, drei `<Html>`) next to the About card;
   - in the projects chapter, the building's flat "browser-window" billboard repeats the project card's identity;
   - the Project modal repeats it a third time.

   See section 3 for the full reasoning. The robust conclusion: **no glass boxes should remain over the scene.** The content card, the tooltip, the skill pills, the meter list, and the progress rail all go or become in-world 3D.
2. **How much they cover.** The content card covers 13–22% of the screen on desktop (1440×900) and **36–51% on phones** (390×844). At 1366×657 (a typical laptop browser) the About card **runs into the nav by 51px**: the brand "Emon" sits on top of the card's kicker. On a portrait tablet (820×1180) the desktop card sits **in the middle of the screen, on top of the subject**, because the JS lens-shift breakpoint (aspect ratio) and the CSS breakpoint (640px width) disagree.
3. **Text and camera are out of sync.**
   - Cards are tied to scroll position; the camera is eased, damped and lagging.
   - A card is fully visible for ~0.99 vh of scroll, but the camera holds for only 0.43 vh at each project. As a result, **73% of all camera travel happens with a card on screen.**
   - The outgoing card slides up **under the nav at ~98% opacity**.
   - "Ghost" cards stay visible at 4–5% opacity during flights.
   - On mobile, the outgoing bottom sheet slides up **across the entire screen at full opacity, covering the building it describes**.
4. **The camera rhythm is "stop-and-surge".**
   - The journey is **18.9 viewport-heights** of scroll (≈16,100 px at 900p, ≈180 wheel notches).
   - Each travel uses easeInOutCubic, which leaves ≈0.35–0.4 vh of near-zero motion at both ends. Each project stop therefore feels like ~1.2 vh of nearly frozen camera, then a burst.
   - The intro flyover has a **non-monotonic speed lurch** (104 → 91 → **221** u/vh) because the Catmull-Rom curve is sampled uniformly across uneven waypoints.
   - There is a velocity kink at every hold boundary (the drift runs at ~5 u/vh, then the travel restarts from 0).
5. **Hero text contrast is too low.** The hero text over the pale dawn sky measures **1.3–1.7 : 1** (WCAG AA needs 4.5). The ghost "Jump into Play Mode" button is close to invisible.
6. **Coupling a redesign must untangle.** Camera stops are **measured from DOM panel heights**. The lens shift (`setViewOffset`) is tuned to the card's position. `inert`/pointer-events and the reveal are driven by per-panel ScrollTriggers. Chapters are measured from `[data-chapter]` sections. Building rise, skills lighting, label and tooltip mounting, and nav highlighting all read those measurements (section 7).

---

## 1. Screenshot index (new, this audit)

The Playwright script is `<analysis-sandbox>/tools/audit.cjs`. It scrolls to the middle of each stop's hold range, waits 4.2 s, then saves the screenshot plus DOM metrics.
Raw metrics are in `AN/audit-{1440,390,1920,1366,820}.json`. Camera profiles are in `AN/camprofile-1440.txt` and `AN/camprofile-390.txt`.

| View | 1440×900 | 390×844 | 1920×1080 | 1366×657 (laptop) | 820×1180 (tablet) |
|---|---|---|---|---|---|
| hero | `SH/audit-1440-hero.png` | `SH/audit-390-hero.png` | `SH/audit-1920-hero.png` | `SH/audit-1366-hero.png` | `SH/audit-820-hero.png` |
| project-0..3 | `SH/audit-1440-project-{0..3}.png` | `SH/audit-390-project-{0..3}.png` | `SH/audit-1920-project-{0..3}.png` | `SH/audit-1366-project-{0..3}.png` | `SH/audit-820-project-{0..3}.png` |
| skills | `SH/audit-1440-skills.png` | `SH/audit-390-skills.png` | `SH/audit-1920-skills.png` | `SH/audit-1366-skills.png` | `SH/audit-820-skills.png` |
| about | `SH/audit-1440-about.png` | `SH/audit-390-about.png` | `SH/audit-1920-about.png` | `SH/audit-1366-about.png` (card hits nav) | `SH/audit-820-about.png` |
| about + hovered/tapped item | `SH/audit-1440-about-hover.png` (2 cards) | `SH/audit-390-about-tap.png` (2 cards) | – | – | – |
| finale | `SH/audit-1440-finale.png` | `SH/audit-390-finale.png` | `SH/audit-1920-finale.png` | `SH/audit-1366-finale.png` | `SH/audit-820-finale.png` |
| mid-travel | `SH/audit-1440-travel-{hero-p0,p0-p1,p3-skills,skills-about}.png` | `SH/audit-390-travel-*.png` | `SH/audit-1920-travel-*.png` | `SH/audit-1366-travel-*.png` | `SH/audit-820-travel-*.png` |
| transition filmstrip p0→p1 (0/20/40/60/80/100% of travel) | `SH/audit-1440-strip-p0p1-{0,20,40,60,80,100}.png` + sheet `SH/audit-1440-strip-p0p1-contact.png` | `SH/audit-390-strip-p0p1-*.png` + sheet `SH/audit-390-strip-contact.png` | – | – | – |
| contact sheets | – | `SH/audit-390-stops-contact.png` | – | – | `SH/audit-820-contact.png` |

Older shots (1280×720) are still useful:
- `SH/d-s-about.png`: the About card is taller than the viewport and slides under the nav.
- `SH/modal-1280-project.png`: the modal is open while the project card sits half under the nav.
- `SH/mobile-390-about.png`: two cards at once.

---

## 2. Inventory of every overlay surface

### 2.1 Hero text block (`Hero` in `src/ui/Journey.tsx` L35-80, `.hero-card` in `global.css` L510-633)
- **What it shows:** the availability kicker, a giant gradient name "Emon" (72–168px), the title, a 2-line intro, two buttons ("Start the journey", "Jump into Play Mode"), and a "Scroll to fly" mouse hint. There is no glass background (transparent `.card` variant). It is sticky at `top:52vh` with translate −50%.
- **Problems:**
  - **Contrast.** It is white/cream text over a pale peach dawn sky and clouds. Measured background behind the text is about rgb(221–243, 187–213, 163–189), which gives **1.3–1.7 : 1** against `#fff6ee`. The text-shadow does not rescue it. The ghost button is nearly invisible (`SH/audit-1440-hero.png`).
  - **Wasted 3D signal.** The world already spells the name in voxel letters on the hill (`src/scenes/intro/Landmarks.tsx`). That sign is never framed at the hero; in the mid-travel shot it is **hidden behind the nav pill** (`SH/audit-1440-travel-hero-p0.png`). The HTML name and the 3D name duplicate each other.
  - **Mobile.** The hero block fills ~44% of the screen and the kicker collides with the island's glowing tip and waterfall (`SH/audit-390-hero.png`).
  - **Choreography.** The entrance is CSS transitions with hard-coded 1.2–2.8 s delays, hand-synced to the 3.4 s takeoff in `JourneyCamera.tsx` (`session.enteredAt`). It is fragile: two clocks.
  - **Fade-out.** It fades out at 0.80–1.25 vh while the camera has already started rising (the hold ends at 0.54 vh).

### 2.2 Left glass content card — CARD #1 (`ProjectCard`/`SkillsCard`/`AboutCard`/`FinaleCard` in `Journey.tsx`; `.card` in `global.css` L429-455)
- **What it shows:** a 440px dark translucent box (`--glass rgba(16,20,48,.72)` + `backdrop-filter: blur(18px) saturate(1.3)`, radius 22, big shadow). It is `position: sticky; top:50vh; translateY(-50%)`, and opacity/translate come from a `--reveal` CSS variable.
  - Project: kicker ("CHAPTER 02 · PROJECTS DISTRICT — PROJECT 1/4 · 2026", which wraps to 2 lines), title, tagline, description, tech tags, role, "Open live demo" + "Code" buttons, and a "Tip: click the building" hint.
  - Skills: 4 groups × 4 skills with **proficiency meter bars**.
  - About: an intro plus a 6-item button list (each with a clamped 1-line story).
  - Finale: a CTA, 2 buttons and socials.
- **Screen coverage measured** (share of the viewport, visible part of the card):

  | viewport | hero | p0 | p1–p3 | skills | about | finale |
  |---|---|---|---|---|---|---|
  | 1440×900 | 19.6% | 16.4% | 13.7% | 15.3% | 21.5% | 13.2% |
  | 1920×1080 | 12.2% | 10.2% | 8.6% | 9.5% | 13.4% | 8.3% |
  | 1366×657 | 28.3% | 23.6% | 19.8% | 22.1% | **31.0%** | 19.1% |
  | 820×1180 | – | 21.3% | 17.8% | 19.9% | 28.1% | – |
  | 390×844 | **44.4%** | **49.6%** | 36–39% | **47.3%** | **51.4%** | 39.4% |

- **Problems:**
  - **Boxy 2D UI on a 3D world.** A dark rectangle frosts and blurs whatever 3D is behind it: rooftops, trees, the island edge. Busy blurred geometry behind body text hurts readability, and it reads like "a website card pasted over a game". The scene's left ~35% (desktop) is permanently spent on the card.
  - **Covers the subject on several layouts:**
    - **Portrait tablet (820×1180):** the card sits at mid-screen over the Orbit billboard, the skills trunk and the About room (`SH/audit-820-contact.png`). Cause: CSS uses the desktop left card for any width > 640px, while `JourneyCamera` only shifts the lens sideways when `aspect > 1.1`. At aspect 0.69 the shift goes **up** (the mobile rule), so the subject sits behind the card.
    - **Phones:** the bottom sheet takes 36–51% of the screen (max-height 56vh). The 3D view is squeezed into a ~280–330px band between the nav and the sheet (`SH/audit-390-stops-contact.png`).
  - **Collides with the nav on short viewports:**
    - At 1366×657, the About card (632px tall at 900p, ~587px here) overflows. The card top lands under the 64px nav: **51px of overlap**, with the brand "Emon" printed over the "CHAPTER 04" kicker (`SH/audit-1366-about.png`). Project-0 also overlaps by 15px.
    - The same happens at 1280×720 (`SH/d-s-about.png`).
    - Cause: `top:50vh` + `translateY(-50%)` has no `max-height` or nav clearance on desktop.
  - **Sticky-scroll jank.** The card is in normal flow until its top reaches 50vh, then sticks abruptly. Later it is pushed up by its panel's bottom edge and scrolls away linearly with the page. Neither motion relates to the camera's eased path (section 5).
  - **Duplicated information:**
    - The chapter is shown three times: the card kicker "Chapter 0X", the nav pill highlight, and the right progress rail.
    - The project identity is shown three times: the building screen, the card, the modal.
    - The skills list repeats the 3D skill labels.
    - The About list repeats the About tooltips.
  - **Meters.** The "proficiency %" bars are a portfolio anti-pattern. On mobile they are hidden and replaced by chips, so the two layouts show different content.
  - **Nested scroll on mobile.** The card has `max-height:56vh; overflow:auto` **inside** a Lenis-driven page with no `data-lenis-prevent`. The About and Skills sheets need an inner scroll on a phone (the About list is cut at "Slow & steady", `SH/audit-390-about.png`), which fights the page scroll that drives the camera.
  - **Performance.** `backdrop-filter: blur(18px) saturate()` over a WebGL canvas that redraws every frame forces a full re-blur of the card area every frame. That is costly on phones and adds jank. `will-change` is permanently on.
  - **Inconsistent size.** The card is a fixed 440px. It looks lost at 1920 (8–13% coverage, huge empty right side) and cramped at 1366×657.

### 2.3 Top nav (`src/ui/Nav.tsx`, `.nav`/`.chapters`/`.nav-actions` in `global.css` L290-396)
- **What it shows:** the brand "◆ Emon" (left); a centered **glass chapter pill** with 5 items (01 Takeoff … 05 Contact; labels collapse to numbers only at ≤900px; hidden at ≤640px); and on the right three pills: a sound toggle, "2D", and "Play 🎮".
- **Problems:**
  - It is the same glass vocabulary as the card, so it is a second permanent dark rounded box. Its center position sits right where the sky composition and the voxel name sign are (`SH/audit-1440-travel-hero-p0.png`).
  - The sound-off icon (4 short bars) reads as "…." — an ellipsis/"more" menu — so it is not recognizable as sound (visible in every shot).
  - Three different pill styles side by side (dark circle, dark pill, peach pill).
  - At ≤900px the chapter pill shows bare "01 02 03 04 05" (`SH/audit-820-contact.png`), which carries no meaning.
  - Chapter clicks call `scrollToChapter`, a Lenis `scrollTo` with a fixed duration of 2.2 s **regardless of distance**. Takeoff → Contact crosses ~17 vh in 2.2 s. The camera rips through the whole path (~400 world units) and every card in between flashes its reveal on the way.

### 2.4 Right progress rail (`.progress-rail` in Nav.tsx L81-85, css L377-396)
- Five 4×22px bars, fixed at the right edge and vertically centered. It duplicates the nav pill and gives no labels.
- It overlaps 3D content (for example the project-0 tower screen in `SH/audit-1440-travel-p0-p1.png`) and is hidden on mobile. Low value, visual noise.

### 2.5 Skill label pills (drei `<Html>` in `src/scenes/skills/SkillsGarden.tsx` L178-194, `.skill-label` css L674-687)
- **What it shows:** 16 DOM pills, mounted only while `chapter === 2`. Opacity is driven per frame from `live.chapterT.skills`.
- **Problems:**
  - **Unreadable sizes.** `distanceFactor={7}` scales the font with depth. At 1440 the labels range from ~6px ("GLSL", "R3F", "Node.js") to 12px. On phones they are 4–6px (`SH/audit-1440-skills.png`, `SH/audit-390-skills.png`).
  - **They overlap each other** ("GLSL" behind "CSS / Tailwind").
  - **They ignore depth.** DOM pills are never occluded by the trunk or branches, so the 3D illusion breaks.
  - **Mount/unmount pop** at chapter boundaries (the `chapter === 2` gate).
  - **Duplicates** the skills list in the card right next to them.

### 2.6 About tooltips + About list — CARD #2 candidate (drei `<Html>` in `src/scenes/about/AboutWorkshop.tsx` L108-185, `.about-tip` css L730-760; list in `AboutCard`)
- **What it shows:** 7 tooltips, all mounted during chapter 3. Each is a 220px glass box (`--glass-strong`, shadow, radius 14) that appears when the matching 3D object **or** the matching list item is hovered, focused or pinned.
- **Problems:**
  - **This is literally a second card next to the first, showing the same words.** The list item says "Player one — Games taught me…", and the tooltip floating over the couch says the same in full. See `SH/audit-1440-about-hover.png` (desktop) and `SH/audit-390-about-tap.png` / `SH/mobile-390-about.png` (phone: bottom sheet + tooltip, two dark boxes stacked).
  - The tooltip is boxy glass anchored over geometry: it covers the couch and the door.
  - `distanceFactor={9}` makes its text ~7px on phones (unreadable).
  - On touch devices hover is sticky. In the 390 shot the "The desk" tooltip is on because the last tap position sits under the list. That is partly a test artifact, but real phones will do the same after any tap.
  - The pulsing "hint" bulbs over each object add more UI-in-world noise.

### 2.7 Project modal (`src/ui/ProjectModal.tsx`, `src/ui/Modal.tsx`, `.modal`/`.pm` css L794-878)
- **What it shows:** a 980px glass card over a blurred scene: an animated canvas demo (or iframe) on the left, and on the right the **same text as the left card** (kicker, title, tagline, description, tags), links, and previous/next arrows. It opens from the card button or by clicking the building.
- **Problems:**
  - It is a third rendering of the same project content, again as a flat glass card. The demo canvas is the same art already on the building screen.
  - The scene behind it stays scroll-linked. In `SH/modal-1280-project.png` the project card is half scrolled under the nav behind the modal.
  - Pop-in with overshoot (`cubic-bezier(.34,1.56,.64,1)`) feels like a web dialog, not part of the world.
  - It is not a design problem on its own (a modal is fine for deep detail), but it adds to the "cards everywhere" impression.

### 2.8 Toasts (`src/ui/Toasts.tsx`, css L1002-1064)
- Glass toasts, bottom-right on desktop and top:120px on mobile (over the 3D). In journey mode they fire for easter eggs (console egg, Konami code, cat clicks) and the 3D crash fallback.
- Same glass box language. Minor, and they auto-dismiss after 5.2 s. If the redesign moves to in-world/diegetic UI, toasts should match (smaller, no blur).

### 2.9 In-world flat "browser-window" screens on buildings (`src/scenes/projects/ProjectsDistrict.tsx` L226-231, `demoScreen.ts`)
- These are not HTML. Each project building carries a flat plane textured with a fake browser UI ("orbit.app", "LIVE" dot, cards and charts).
- At project-1 it is a **free-standing billboard on two posts** that reads exactly like a dark UI card stuck into the world (`SH/audit-1440-project-1.png`, `SH/audit-1920-project-1.png`, `SH/audit-390-project-1.png`). Paired with the HTML card on the left, the viewer sees **two dark rectangles describing the same project**.
- The screens are the right *idea* (content in 3D). Their execution is a generic dark dashboard and not the real project screenshot, and the text on them is unreadable (tiny canvas text).

### 2.10 Non-overlay composition issues seen in the same shots (worth fixing in the same pass)
- **Occluders in the hero shots:** a town lamp post stands in the foreground of the About room, cutting through the cat and rug (`SH/audit-1440-about.png`, `SH/audit-1366-about.png`, `SH/audit-390-about.png`), and another stands in front of the skills tree (`SH/audit-1440-skills.png`).
- **Daytime project stops are hazy and washed out** (strong fog/tilt-shift). The left card's frosted glass makes this worse.
- **Mid-travel at p0→p1:** the camera skims the project-0 tower so its screen fills the right edge (`SH/audit-1440-travel-p0-p1.png`).

---

## 3. Which are the "2 weird cards"? (explicit verdict)

The user's words: *"3d mode ew amra wired 2 cards rekhe disi screen a jeita khrp dekhcche"* — "in 3D mode we've placed 2 weird cards on screen that look bad".

**Most likely pair:**

1. **Card #1 = the big glass content card** (`.card` in `Journey.tsx`). It is certain.
   - It is the only large, card-shaped element on screen at every non-hero stop: 4 projects, skills, about, finale. That is 7 of 8 stops.
   - It is a dark frosted rectangle covering 13–22% (desktop) to 36–51% (phone) of the scene.
   - It is visibly "2D website UI" in a "3D world", the exact contrast the user complains about ("sobkisu 3d element a … dekhate hobe").
2. **Card #2 = the second glass box that shows up next to Card #1 with the same content.** The clearest instance is the **About tooltip** (`.about-tip`, drei `<Html>`):
   - When any object or list item is hovered or tapped, a second dark glass card pops up in the room. It repeats the list item's text right beside the big card (`SH/audit-1440-about-hover.png`; on a phone, `SH/audit-390-about-tap.png` shows two dark boxes stacked).
   - It is the only place where two HTML *cards* are literally on screen at the same time, and it is the weirdest-looking: a small glass box floating over the couch, with tiny text on phones.

**Runner-up readings for Card #2, all with the same root cause:**
- **(b) The building's flat browser billboard.** At project stops the viewer sees the HTML card on the left plus a dark UI-card billboard in the world (most obvious at project-1, where it stands on posts). That is two "cards" for one project. This is what a user would see first, since projects come first.
- **(c) The project modal.** After clicking "Open live demo" or a building, a second, bigger card shows the same text again while the first card still sits behind it (`SH/modal-1280-project.png`).
- **(d) The center nav chapter pill.** It is the only other permanent glass box. It is less likely, because users call it a menu or navbar, not a card.

**Practical conclusion:** whichever pair the user meant, the fix is the same. **Remove every frosted-glass box from the 3D view**:
- the content card;
- the tooltips;
- the skill DOM pills and meter list;
- the progress rail.

Show the content as **3D-native elements**: text and panels in world space that the camera frames, screens with the real project screenshots, and labels that respect depth. Keep only a minimal, transparent HUD (brand, chapter dots/labels, sound, 2D, Play). The modal can stay for deep detail, but it should feel like zooming into the building screen, not like a web dialog.

---

## 4. Measured scroll and reveal timeline (1440×900; mobile uses the same vh ratios)

From `AN/camprofile-1440.txt`. The script `tools/camprofile.mjs` runs the **real** `src/systems/cameraPath.ts` through Vite SSR with the DOM-measured stop ranges.

- **Scroll length:** 18.9 vh of document (max scroll 17.9 vh ≈ 16,110 px at 900p, 15,122 px at 844p). With Lenis `wheelMultiplier 0.9` that is ~180 wheel notches, or ~25–30 long swipes on a phone.
- **Holds vs travel:** holds total 5.1 vh (28%); travel totals 12.8 vh (72%).

| stop | card fade-in | camera hold | card fade-out | card fully visible *outside* the hold |
|---|---|---|---|---|
| start (hero) | always on | 0.00–0.54 | 0.80–1.25 | 0.27 vh |
| project-0 | 2.44–2.90 | 3.16–3.59 | 3.89–4.32 | 0.55 vh |
| project-1..3 | 4.54–5.00 / 6.63–7.11 / 8.73–9.21 | 0.43 vh each | +0.73 vh after the hold start | 0.55 vh |
| skills | 10.93–11.59 | 11.61–12.89 | 12.98–13.57 | 0.10 vh |
| about | 13.98–14.64 | 14.65–15.95 | 16.03–16.62 | 0.10 vh |
| finale | 16.92–17.36 | 17.65–17.90 (end) | never (beyond max) | 0.67 vh |

- **Project stops:** the camera parks for only **0.43 vh (~390 px, ~4 wheel notches)**, but the card is fully visible for **0.99 vh**, more than twice as long.
- **Across the whole journey:** **a card is visible during 73% of all camera travel** (9.34 of 12.8 vh). Only 3.45 vh of flight is "clean".

---

## 5. Smoothness audit

### 5.1 Camera curve (speed in world units per vh of scroll; `AN/camprofile-1440.txt` + `tools/camcurve.mjs`)
- **Intro flyover (hero → project-0, 2.62 vh, 130 world units):**
  - Speed: 0 → 19 (1.0) → 104 (1.5) → **91 (1.6, dip)** → 121 (1.8) → **221 (1.9, spike)** → 88 (2.1) → 21 (2.4) → ~0 (2.9–3.15).
  - The curve runs through waypoints rise/overview/approach with uniform Catmull-Rom parameterization (`u = (j+local)/(n-1)`, not arc length), so speed **lurches** between waypoints even though the travel is "eased".
  - The last ~0.75 vh (2.4–3.15) barely moves while the project-0 card fades in: a dead zone.
- **Project hops (1.66 vh, ~18–20 u):**
  - A bell curve with a 46 u/vh peak.
  - **Near-zero speed (≤4 u/vh) for ~0.35–0.4 vh at both ends** (cubic ease tails).
  - Add the 0.43 vh hold (drift ~5 u/vh) and **each project stop is ~1.2 vh of nearly static camera followed by a short burst.** The result is a stop-and-surge feel and many "dead" wheel notches.
- **Hold boundaries:** the hold drift runs at ~5 u/vh (projects) to ~13–16 u/vh (finale and hero). Travel easing then starts from 0, so velocity jumps from drift speed to 0 and back up. `damp(3.6)` softens it but does not remove it.
- **Big moves:**
  - Project-3 → skills: 34 u, peak 118.
  - About → finale: 69 u, peak 178, a fast swoop across the bridge to the launch islet.
  - These peaks are 3–5× the project hops. The pacing is uneven.
- **Camera lag:** the camera follows the target through `damp(3.6, dt)` (time constant ≈0.28 s) on top of Lenis smoothing (lerp 0.085). DOM cards have neither, so **the text always arrives before the camera.**
- **Pointer parallax** (±0.9 / ±0.5 units) is applied to the *target* position before damping. During holds the camera slowly drifts with the mouse; that is fine.

### 5.2 Text appearing and disappearing vs camera (filmstrips `SH/audit-1440-strip-p0p1-contact.png`, `SH/audit-390-strip-contact.png`)
- **0% (hold end):** the card is fully visible; the camera is about to leave.
- **20%:** the camera has **barely moved** (ease-in tail), but the card has already un-stuck and scrolled up at **98% opacity, overlapping the nav by 64px** (the brand prints over the card text).
  - **Mobile:** the bottom sheet slides all the way to the top, at full opacity, **covering the tower it describes** (`SH/audit-390-strip-p0p1-20.png`).
- **40%:** the outgoing card is a 5%-opacity ghost behind the nav (mobile: a ghost block covering 28% of the screen).
- **60%:** the incoming card is a 4%-opacity ghost rising from the bottom ("Orbit Analytics" faintly over the grass). Ghost text over busy 3D looks like a rendering glitch.
- **80%:** the incoming card is at 92% opacity, but the camera is still flying in.
- **100% (hold start):** the camera arrives; the card has been readable for a while.

**Net effect:** the text is not choreographed with the camera. It slides like a normal web page (sticky + linear scroll) while the 3D eases. The two motion systems fight each other, which is the opposite of "smooth".

### 5.3 Other jank sources
- **Fonts.** Fonts landing re-measure every stop (`document.fonts.ready → refreshScroll`), so the camera path can shift after load.
- **Resize.** Any resize or address-bar collapse on mobile changes `innerHeight`. The DOM panels are in vh, so all stops move (ScrollTrigger refresh → `journey.version++` → path rebuild).
- **backdrop-filter.** The blur on the card, nav pill and toasts sits over a constantly redrawn WebGL canvas, which costs GPU on phones.
- **Mount/unmount pops.** Skill labels mount and unmount at chapter boundaries (`chapter === 2`). The About tooltips mount for `chapter === 3`.
- **Nav jumps.** They use a fixed 2.2 s duration whatever the distance (section 2.3).

---

## 6. What the screenshots say per stop (desktop 1440 unless noted)
- **hero** (`SH/audit-1440-hero.png`): nice island composition. The text has low contrast, the ghost button is near invisible, and the 3D name sign is not used.
- **project-0** (`SH/audit-1440-project-0.png`): the card covers the left 35%, plus a second rectangle (the tower screen) in the world. The kicker wraps.
- **project-1** (`SH/audit-1440-project-1.png`, `SH/audit-1920-project-1.png`): the billboard and the card read as two dark cards. On tablet the card covers the billboard (`SH/audit-820-project-1.png`).
- **project-2/3** (`SH/audit-1440-project-2.png`, `-3.png`): the same layout repeats, which gets monotonous. The building screens are small, with generic fake UI.
- **skills** (`SH/audit-1440-skills.png`): the meter list in the card plus tiny overlapping DOM pills on the tree (duplicate information). A lamp post stands in front of the tree.
- **about** (`SH/audit-1440-about.png`, `-about-hover.png`): the tallest card (70% of vh). With hover, a second glass card appears in the room. A lamp post stands in front of the cat. At 1366×657 the card collides with the nav.
- **finale** (`SH/audit-1440-finale.png`): the card is acceptable because the night sky is calm, but it is still a box. The rocket and terminal are good 3D CTAs, yet the CTA buttons live in HTML.
- **mobile** (`SH/audit-390-stops-contact.png`): every stop is "3D in the top 40%, glass sheet in the bottom 50%". The About and Skills sheets need an inner scroll.
- **mid-travel** (`SH/audit-1440-travel-*.png`): no text (good), but the frame is still lens-shifted for a card that isn't there.

---

## 7. Engineering coupling any redesign must untangle

1. **Camera stops are measured from the DOM** (`src/systems/scroll.ts` `measure()`).
   - Every `[data-stop]` panel's top and height, in vh, defines a hold range `[anchor ± hold]` in scroll progress.
   - Panel heights come from CSS (`.panel` 135vh, `--hero` 150vh, `--tall` 230vh, `--end` 120vh; `.travel` 75vh, `--long` 170vh). Card height matters only through the panel (min-height).
   - `cameraPath.ts` `build()` reads `journey.stops` and spaces the non-panel waypoints evenly in the gaps.
   - **If the HTML panels are removed, scroll length and stop timing disappear with them.** They need an explicit timeline instead: a data-driven config of stop weights / hold lengths and a single spacer element, or a GSAP master timeline.
2. **Chapters are measured from `[data-chapter]` sections** → `journey.chapters` → `live.chapterT[id]` (0..1) and `useStore.chapter` (index). Consumers:
   - the Nav highlight and progress rail;
   - `SkillsGarden` (node lighting stagger and label opacity from `chapterT.skills`; labels gated by `chapter === 2`);
   - `AboutWorkshop` (tooltips mounted and hint bulbs visible for `chapter === 3`);
   - `App.tsx` (pre-loads the PlayMode chunk at `chapter >= 3`).
3. **Building rise depends on DOM stops** (`ProjectsDistrict.tsx` L175-176: `live.progress > stop.start - 0.06`).
4. **The lens-shift hack** (`JourneyCamera.tsx` L42-49).
   - `setViewOffset` shifts the projection −14% of the width (aspect > 1.1) or +17% of the height (aspect < 0.85). This parks the subject beside or above the card.
   - It is always on, even when no card is visible. Its breakpoints (aspect) **do not match** the CSS breakpoints (640px width), which causes the tablet bug.
   - PlayMode clears it (`PlayMode.tsx` L137 `clearViewOffset()`), and JourneyCamera re-applies it each frame. The portrait pull-back (`aspect < 1` → ×(1 + (1/aspect − 1)·0.42)) is also tuned for a bottom sheet.
   - A 3D-native layout should remove the offset, or animate it per stop from data.
5. **Reveal ScrollTriggers** (`Journey.tsx` `useReveal`).
   - There is one ScrollTrigger per panel (`top bottom` → `bottom top`). Each writes the `--reveal` CSS variable, toggles `pointer-events` (> 0.5) and `inert` (< 0.05) on `.card`.
   - The hero is special-cased (`isFirst` → always 1 until fade-out).
   - Accessibility (focus order, inert) currently rides on this. Any 3D text must keep a real-DOM a11y layer: an sr-only or 2D mirror. `FlatSite` already exists and reads the same `content.ts`.
6. **Sticky positioning plus CSS transform:** `.card { position: sticky; top:50vh; transform: translateY(-50%…) }`. The mobile variant (`bottom`, `max-height:56vh`, `overflow:auto`) is a separate CSS-only layout, and a reduced-motion override exists (`global.css` L1525-1543).
7. **Shared hover state between DOM and 3D:** `hoveredAbout` and `pinnedAbout` in zustand are written by both the DOM list buttons and the 3D objects, and read by the tooltip. Removing the list means the 3D objects need their own focus and keyboard path.
8. **Scroll-to navigation** uses DOM: `scrollToChapter` finds the first `[data-stop]` in `[data-chapter=id]` and calls `scrollToStop` (the middle of the hold) via Lenis, a fixed 2.2 s. The "Start the journey" button uses it too.
9. **Hero entrance timing:** CSS transition delays (1.2–2.8 s) are hand-matched to the 3.4 s takeoff in `JourneyCamera` (`session.enteredAt`) and to `lockScroll(!entered)` in `App.tsx`.
10. **Modal flow:** `openProject(id)` is called from the card button and from building clicks. The modal locks overflow via `html.modal-open`, and the Lenis wheel is blocked with `data-lenis-prevent` on the backdrop.
11. **Day/night is tied to keyframe `day` values**, so the progress-to-time-of-day mapping also follows the DOM-measured stops.
12. **Reduced-motion path:** no Lenis, native scroll → `onProgress`; camera damping 14. The CSS overrides assume the card exists.

---

## 8. Constraints and opportunities for the redesign (input for the planning stage)

- **Content into world space.** Replace the left card with world-space content at each stop:
  - drei `<Text>` or `<Text3D>`/SDF text, or real-screenshot screens on the buildings (portfolio3 has `public/assets/projects/*` screenshots);
  - an in-world sign or billboard with title and tagline;
  - 3D buttons ("Open project", "Code") as clickable meshes, plus a DOM/sr-only mirror for accessibility.
  - The camera then *frames* the text, so text and camera move as one system and the lens shift is no longer needed.
- **Explicit timeline.** Define the journey as data (stops with `holdWeight` / `travelWeight`) and generate scroll length from it, instead of DOM panels. Shorten it: ~10–12 vh total instead of 18.9. Give project holds ≥ 0.8 vh, and keep the text fully visible **only inside the hold** (the fade ends where the hold begins).
- **Camera path.** Re-parameterize by arc length, for example `CatmullRomCurve3.getPointAt` / `getUtoTmapping`. Ease each travel with a gentler curve (easeInOutSine or quint with a capped peak) so speed is monotonic up and then down. Blend the hold drift velocity into the travel (no 5 → 0 kink).
- **Text choreography.** Animate text in 3D from the same progress value as the camera (e.g. letters or lines rising, opacity tied to *hold-local* progress, plus slight parallax depth). Use no `backdrop-filter`; use solid contrast plates or an emissive panel material if needed.
- **Skills.** Make labels 3D text sprites that respect depth and use a constant screen size (billboarded `Text` with `sizeAttenuation` off, or a fixed-size scale computed from distance). Drop the meter bars, and drop the duplicate list.
- **About.** Make the in-room objects carry their own 3D captions (one at a time, camera-dolly focus on the object). Drop the HTML list and the glass tooltips. Remove the lamp post occluding the room.
- **Nav.** Make it a minimal, transparent HUD. Use a clear sound icon. Chapter labels can live as world signage or as a slim progress line. Drop the separate progress rail. Nav jumps should use a duration that scales with distance, or teleport-plus-fade for far jumps.
- **Mobile.** Put the text in 3D above or below the subject (camera framing per aspect from data), with no 50% bottom sheet. Keep a "Read as 2D" escape hatch (FlatSite).
- **Hero.** Frame the existing voxel name sign plus an in-world title, or keep minimal DOM text on a guaranteed-contrast scrim. Fix the 1.3–1.7 : 1 contrast.
- **Keep:** Lenis, ScrollTrigger (as a scrubber only), the modal for deep detail (restyled as "zoom into the screen"), the 2D FlatSite, the reduced-motion path, and the PlayMode hand-off (`clearViewOffset`).
