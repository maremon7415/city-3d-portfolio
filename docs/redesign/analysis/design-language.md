# portfolio3 design and motion language, and how it carries into the 3D site

Source analysed: `/home/user/portfolio3` (Next.js 16, GSAP, Lenis, Tailwind 4). Target: `/home/user/city-3d-portfolio` (Vite, R3F 9, drei 10, troika-three-text 0.52.5, postprocessing 6).
Everything below comes from reading the source files named in each section. Numbers are copied from the code, not estimated. Font facts were checked with fontTools 4.67. Tone-mapping numbers were computed from three.js' `ACESFilmicToneMapping` formula (script: `scratchpad/aces.py`).

---

## 0. Summary

**The brand:** "Md. Emon Miah, full-stack engineer, Dhaka." It uses a warm-black background (`#0a0908`) with a vermilion "rising sun" accent (`#ff4a2e`). The README says the accent was pulled from the rim light in the portrait. Headings are huge, tightly tracked **Funnel Display 600** with an accent-coloured second line and a closing period ("Md. Emon / *Miah.*", "EMON."). The developer side shows as a terminal: the logo is a `[ > _` prompt, plus the `emon@dhaka: ~` shell, mono uppercase eyebrows, `(Label)` markers with accent brackets, and a ⌘K palette. Motion uses one ease (`cubic-bezier(0.22,1,0.36,1)`) plus `expo.inOut` for big wipes. Text reveals slide up out of masks. It uses no emojis; icons are lucide line icons.

**How far the 3D site is from that brand.** The current 3D site breaks it on almost every axis:

| Axis | portfolio3 brand | city-3d-portfolio today |
|---|---|---|
| Background | warm black `#0a0908`, cream light theme `#efebe3` | navy `#151c40` |
| Accent | vermilion `#ff4a2e` / `#ff8a4c` | peach `#ffb48c`, sun `#ffd36b`, cyan `#7ff3ff` focus rings |
| Display font | Funnel Display 600, tracking -0.05em, leading 0.84–0.96 | Bricolage Grotesque (fontsource), -0.02em |
| Logo | terminal-prompt mark (bracket + `>` + blinking cursor) | `◆` |
| Role / location | "Full-Stack Software Engineer", "Dhaka, Bangladesh (UTC+6)" | "Creative Frontend Developer", "Bangladesh" |
| Availability | "Open to full-time & contract roles" | "Open to freelance & full-time roles" |
| Emoji | 0 in UI code | 27 occurrences (🎮 🚀 👋 🏝 🐛 ✨ …) |
| Text surfaces | type sits straight on the page; cards are thin 1px-line tiles | big frosted navy glass cards over the canvas (the "2 weird cards") |

**What should carry over:**
1. Palette and grain.
2. Funnel Display mega-type with an accent line and a closing period.
3. The masked rise-in reveal and its ease.
4. The Hello → হ্যালো → স্বাগতম preloader with the 000% counter and the curved lift.
5. The terminal identity: logo, in-world shell, palette.
6. The live Dhaka clock with its green ping dot.
7. Scrub text.
8. A cursor that labels interactive objects.
9. The accent+bg curtain for discontinuous jumps.

**Hard technical constraints the next stage must plan for:**
- troika needs ttf/otf/woff. **All four brand fonts are WOFF2 variable fonts.** Funnel Display's *default* instance is **Light 300**. troika renders the default instance, so you have to bake static instances (exact commands in §2.3).
- troika has **no Indic shaping**, so the Bengali greetings will mis-render as SDF text.
- The site applies **ACES to the whole frame, after a bloom pass with threshold 0.82**. Brand colours come out shifted, and plain cream text blooms (§6).

---

## 1. Colour tokens (`styles/tokens.css`)

Dark is the default. Light is opt-in through `data-theme="light"`, saved in `localStorage['em-theme']` and set before first paint by the BOOT script in `app/layout.tsx`.

| Token | Dark (default) | Light | Use |
|---|---|---|---|
| `--bg` | `#0a0908` | `#efebe3` | page |
| `--bg-2` | `#11100e` | `#e7e2d7` | panels, cards, terminal, palette |
| `--bg-3` | `#191714` | `#ddd7ca` | image wells |
| `--fg` | `#f2eee6` (warm cream) | `#12100d` | text, solid button fill, active palette row |
| `--fg-2` | `#bfb9ac` | `#48443c` | body/lead |
| `--fg-3` | `#877f72` | `#7a7366` | eyebrows, meta |
| `--line` | `rgb(242 238 230 / .11)` | `rgb(18 16 13 / .13)` | hairlines |
| `--line-2` | `rgb(242 238 230 / .24)` | `rgb(18 16 13 / .30)` | borders on buttons/chips |
| `--card` / `--card-hover` | `rgb(255 255 255 / .028 / .055)` | `rgb(18 16 13 / .035 / .07)` | barely-there tiles |
| `--accent` | **`#ff4a2e`** vermilion | `#e8381b` | the only loud colour |
| `--accent-2` | `#ff8a4c` | `#ff6a3d` | cursor block in logo, warm secondary |
| `--on-accent` | `#0a0908` | `#fff7ee` | text on accent |
| `--ok` | `#2ee59d` | `#0b9d62` | "available" ping dot, terminal ok lines |
| `--glow` | `rgb(255 74 46 / .34)` | `rgb(232 56 27 / .28)` | spotlight, laser-line glow, portrait halo |
| `--grain-opacity` | .07 | .09 | film grain |
| `--shadow` | `0 30px 80px -30px rgb(0 0 0/.7)` | `0 30px 70px -30px rgb(40 25 10/.35)` | floating panels |

Code-syntax colours (`styles/ui.css .code`): keyword = accent, string `#7fd6a2`, function `#e9c46a`, number `#8ab4ff`, comment fg-3 italic. Terminal traffic lights are `#ff5f57 #febc2e #28c840`. The error line is `#ff5f57`.

**Character:** monochrome warm neutrals (cream on near-black, no blue anywhere) plus a single hot accent, used sparingly: accented words, parentheses, the prompt chevron, the dot, the progress bar, hover fills. Colour does the emphasis instead of italics.

---

## 2. Type system

### 2.1 Families and roles (`styles/type.css`, `app/layout.tsx`)
The README describes the roles as: "Funnel Display for voice, Inter for reading, JetBrains Mono for the developer in me."

| Class | Family / weight | Size (CSS) | Leading | Tracking |
|---|---|---|---|---|
| `.t-mega` | Funnel Display 600 | `clamp(3.6rem, 13.2vw, 15.5rem)` | .84 | -0.058em |
| hero name override | ″ | `clamp(4.4rem, min(12.2vw, 22vh), 14rem)` | .84 | -0.058em |
| `.t-display` | Funnel 600 | `clamp(2.9rem, 8.4vw, 10rem)` | .90 | -0.05em |
| `.t-h1` | Funnel 600 | `clamp(2.4rem, 6vw, 6.6rem)` | .96 | -0.042em |
| `.t-h2` | Funnel 600 | `clamp(1.9rem, 3.9vw, 4.2rem)` | 1.02 | -0.036em |
| `.t-h3` | Funnel 600 | `clamp(1.3rem, 2.1vw, 2.15rem)` | 1.10 | -0.028em |
| `.t-lead` | Inter | `clamp(1.08rem, 1.45vw, 1.5rem)`, colour fg-2 | 1.5 | -0.012em |
| `.t-body` | Inter | 1rem, fg-2 | 1.7 | 0 |
| `.t-eyebrow` | JetBrains Mono | .75rem UPPERCASE, fg-3 | 1.4 | +0.1em |
| `.label` "(Label)" | JetBrains Mono | .78rem UPPERCASE, fg-3, **accent `(` `)`** | – | +0.08em |
| footer mark "EMON." | Funnel **700** | `clamp(7rem, 33vw, 46rem)` | .74 | -0.07em |
| preloader counter | Funnel 600, tabular | `clamp(5rem, 15vw, 15rem)` | .8 | -0.06em; `%` in accent |
| Bengali | Noto Sans Bengali 600 | used in preloader greetings | – | -0.01em |

**Conventions:**
- In `Words`/`Chars` (`components/ui/Words.tsx`), `*word*` paints a word in the accent and `\n` breaks the line. Display lines end with a period: "Miah.", "*ship* and *scale.*", "*worth* *shipping.*", "Lost in *space.*", "EMON.".
- Indices are zero-padded: "01 / 07", "00 Home … 06 Contact".
- Outline numerals (`-webkit-text-stroke: 1.5px fg-3`, transparent fill) fill with accent on hover (process steps, marquee row B).

### 2.2 The actual font files (`/home/user/portfolio3/app/fonts`), checked with fontTools

| File | Size | Format | Variable axis (min/default/max) | cmap | Notes |
|---|---|---|---|---|---|
| `FunnelDisplay.woff2` | 17.7 KB | **WOFF2**, glyf | wght 300 / **300** / 800, name "Funnel Display Light" | 217 (Basic Latin + Latin-1 + 4 Latin-Ext-A) | GSUB: ccmp frac liga locl pnum tnum. OFL licence file included |
| `Inter.woff2` | 48.3 KB | **WOFF2**, glyf | wght 100 / 400 / 900 | 230 | calt ccmp dnom frac locl numr pnum tnum |
| `JetBrainsMono.woff2` | 40.4 KB | **WOFF2**, glyf | wght 100 / 400 / 800 | 229 | calt ccmp frac locl |
| `NotoSansBengali.woff2` | 107.7 KB | **WOFF2**, glyf | wght 100 / 400 / 900 | 123 (96 Bengali) | abvs akhn blwf blws cjct half init locl nukt pres pstf psts rclt rlig rphf vatu |

**Coverage gaps:**
- None of the four has `→` (U+2192) or `↗` (U+2197). Inter and JetBrains Mono have only `↑` and `↓`.
- All three Latin fonts have `· — › • ©`.
- portfolio3 draws arrows as lucide SVG icons, never as glyphs.
- If 3D strings contain → ↗ ✕ or emoji, troika's built-in **unicode-font-resolver fetches fallback fonts from `cdn.jsdelivr.net`** at runtime. That causes pop-in, a network dependency, and the wrong typeface.

### 2.3 Consequences for troika-three-text (drei `<Text>`)
- `node_modules/troika-three-text/README.md` line 150 says: ".woff (.woff2 is _not_ supported)". Supported formats are .ttf, .otf and .woff.
- troika's Typr does not apply variation axes, so you get the **default instance**. For Funnel Display that is **Light 300**, not the brand's 600. You must bake static instances.
- I verified this pipeline in the scratchpad. Output is in `scratchpad/fontprobe/`:
  ```
  python3 -m venv ftenv && ftenv/bin/pip install fonttools brotli
  fonttools varLib.instancer app/fonts/FunnelDisplay.woff2 wght=600 --update-name-table -o FunnelDisplay-600.ttf
  fonttools varLib.instancer app/fonts/FunnelDisplay.woff2 wght=700 -o FunnelDisplay-700.ttf   # only if the EMON. mark is SDF text
  fonttools varLib.instancer app/fonts/Inter.woff2 wght=400 -o Inter-400.ttf     # (500 for button labels if needed)
  fonttools varLib.instancer app/fonts/JetBrainsMono.woff2 wght=400 -o JetBrainsMono-400.ttf
  ```
  Results:

  | File | TTF | WOFF (zlib) |
  |---|---|---|
  | FunnelDisplay-600 | 10.7 KB | 14.1 KB |
  | Inter-400 | 23.7 KB | 31.5 KB |
  | JetBrainsMono-400 | 21.2 KB | 27.9 KB |

  At these sizes, plain **TTF is smaller than WOFF**, and the host gzips or brotlis it anyway. Ship TTFs in `public/fonts/`.
- Add `--update-name-table` so the internal name does not still say "Light". This is cosmetic only.
- The DOM layer (nav, palette, preloader, 2D mode) can keep the original WOFF2 variable files through `@font-face`. Drop `@fontsource-variable/bricolage-grotesque`.
- **Bengali in troika will break.** I read troika's shaper. It applies only `/^(rlig|liga|mset|isol|init|fina|medi|half|pres|blws|ccmp)$/` plus Arabic joining, and has no Indic reordering.
  - "হ্যালো" needs ya-phala (`pstf`) and the two-part vowel ো, which needs the pre-base ে moved in front of the consonant.
  - "স্বাগতম" needs the ba-phala conjunct.
  - So keep Bengali in the **DOM preloader**. If it must appear in-world, draw it to a `CanvasTexture` with the browser's HarfBuzz shaping (`FontFace` load of NotoSansBengali.woff2, then `ctx.fillText`).
- **Tabular figures:** troika does not apply `tnum`, and Funnel digits are proportional, so a counting number will jitter in width. For counters, anchor them right or centre in a fixed box, or render the digits in JetBrains Mono, or lay out fixed digit slots.
- **Preloading:** load fonts through troika `preloadFont({font, characters})` or drei `<Text characters=…>` (it suspends) and feed that into the existing loader progress, so no glyphs pop in after "Enter".
- **troika knobs that map to brand typography:**
  - `letterSpacing` is in em, so use `-0.058` for mega and `-0.05` for display.
  - `lineHeight` is a multiple, so use `0.84` and `0.9`.
  - `colorRanges` handles the `*accent*` words.
  - `fillOpacity: 0` plus `strokeWidth` / `strokeColor` gives the outline numerals and marquee row.
  - `outlineWidth` / `outlineBlur` give legibility halos.
  - `curveRadius` handles the circular badge text.
  - `clipRect` gives the masked rise-in.
  - `maxWidth` handles wrapping.
  - The derived-material attribute `aTroikaGlyphIndex` (present in the bundle) allows per-glyph reveal shaders.

### 2.4 Sizing 3D type the way the CSS clamps work
Convert the CSS clamp into world units at the text's camera distance `d`:
`worldPerPx = 2·d·tan(fov/2) / innerHeight`.
Then for example: hero name `fontSize = clamp(70.4, min(0.122·innerWidth, 0.22·innerHeight), 224) px × worldPerPx`. Recompute on resize. This reproduces the brand's responsive scale on 390 px phones and 1280+ desktops without a separate mobile layout.

---

## 3. Space, shape, chrome (`tokens.css`, `base.css`, `ui.css`, `chrome.css`)

- **Layout:** gutter `clamp(20px, 4.2vw, 68px)`; max width 1560; header 78px; section padding `clamp(88px, 13vw, 220px)`. Very generous whitespace, editorial grid (1.5fr / .8fr hero split).
- **Radii:**
  - 22px (`--radius`): cards, terminal, palette
  - 32px (`--radius-lg`): project cards, testimonial cards
  - 30px: portrait
  - 999px: every button, chip and nav pill
  - 12px: palette rows
  - 6px: kbd
  - logo mark 0.9rem
- **Borders:** 1px hairlines everywhere (`--line` / `--line-2`). Surfaces are near-transparent (`--card` 2.8% white), *not* frosted. Blur is used only on fixed chrome: header when scrolled (18px saturate 1.4), nav (14px), palette backdrop (14px), floating chips (16px).
- **Buttons (`.btn`):**
  - 3.4rem-tall pill with a 1px line-2 border.
  - On hover a fill **rises from the bottom with a curved top edge** (`border-radius: 50% 50% 0 0 / 120% 120% 0 0` → 0, 0.65s ease) and the arrow icon nudges (2px, -2px).
  - Variants: `--solid` (fg bg, accent fill on hover) and `--accent` (accent bg, fg fill).
  - `.orb-btn` is a 150–230px vermilion circle ("Start a project"). The fill rises and the arrow rotates 45°.
- **Chips:** 2rem pill, mono .74rem. Hover inverts colours and lifts 2px.
- **Dot:** `.dot--ok` green with a 2.2s ping ring out to 9px.
- **Kbd:** 1.5rem mono key caps.
- **Header:** logo left. The nav is a pill group whose **fg-coloured pill slides under the hovered link** (0.55s expo.out). The tools area holds the Dhaka clock, a "Search ⌘K" pill, a theme icon button that rotates 18°, and a "Menu" pill with a two-line icon that morphs into an X. The header hides on scroll down past 260px.
- **Logo** (`components/nav/Header.tsx`, `app/icon.svg`), 48-unit SVG:
  - a "[" bracket path in fg (stroke 3.2)
  - a `>` chevron in accent (stroke 3)
  - a 5×3 cursor block in accent-2 blinking `1.1s steps(1)`
  - On hover it rotates -8° and scales 1.06 with the spring ease.
  - The favicon is the same mark on a dark tile with an accent-tinted gradient border.
- **Grain:** fixed SVG fractal-noise layer (`baseFrequency .85`, 2 octaves), `mix-blend-mode: overlay`, opacity .07 dark / .09 light.
- **Progress:** 2px accent bar at the top, `scaleX = scroll progress`.

---

## 4. Motion system

### 4.1 Tokens
- `--ease: cubic-bezier(0.22, 1, 0.36, 1)` is the house ease, used for nearly every CSS transition. It is close to `expo.out`/`power4.out`. GSAP 3.13+ ships CustomEase for free and the 3D site has gsap 3.15, so use `CustomEase.create('em', '0.22,1,0.36,1')`.
- `--ease-io: cubic-bezier(0.65, 0, 0.35, 1)`. Big wipes use GSAP **`expo.inOut`**: preloader lift, curtain, menu clip, rotating words.
- `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` is for small "toy" overshoots (logo, icon buttons, timeline dots).
- Magnetic uses `elastic.out(1, 0.45)`.
- **Durations:**
  - reveals 1.1–1.4s, image clip 1.4s with inner de-zoom 1.8s
  - hovers 0.4–0.7s
  - curtain 0.72s cover / 0.85s reveal
  - preloader ≈4.1s total
- **Staggers:** words 38ms, chars 28ms, list children 90ms, menu rows 50ms.
- **Distances:** reveal translate 44px (up), 36px (stagger), 112% in masks (words/chars), 115% (roll, menu rows, curtain word).
- **Gate:** nothing animates unseen. `lib/ready.ts` holds a global "ready" gate that opens only after the preloader or curtain lift. RevealObserver and Counter wait for `whenReady`.
- **Reduced motion:** `prefers-reduced-motion` disables Lenis, the curtain and all reveals.
- **Lenis:** `lerp .085, wheelMultiplier .95, touchMultiplier 1.35`, driven by the GSAP ticker with `lagSmoothing(0)`. The 3D site already uses `lerp .085, wheel .9, touch 1.4`, so it is effectively aligned already.

### 4.2 Signature interactions (source → exact behaviour)

| # | Move | Source | Behaviour |
|---|---|---|---|
| 1 | **Preloader** | `components/motion/Preloader.tsx`, `motion.css .preloader` | Once per session (`sessionStorage em-intro`; skipped with a hash or reduced motion). Top row: "Md. Emon Miah / Portfolio © 2026". Centre greetings "Hello." → "হ্যালো." → "স্বাগতম." (accent dot after each); each comes in from yPercent 45 + blur 10px (0.5s power3.out) and leaves to -45 + blur 8px (0.32s power2.in), at 0.2 + i·0.62s. Bottom: giant "000%" counter (Funnel, accent %) 0→100 over 2.5s power2.inOut; eyebrow "Booting the experience"; 3px accent bar scaleX 0→1 in sync. Outro at 2.85s: content fades, then at 3.05s the bg slides up 100% (1.05s expo.inOut) while a 14vw **curved lower edge** unfolds, so the page is revealed under an arc. Ready gate opens at 3.5s. 8s failsafe. |
| 2 | **Curtain page transition** | `providers/TransitionProvider.tsx`, `motion.css .curtain` | Two stacked panels: **accent** first, then **bg** 0.09s later. Each slides up 100→0 (0.72s expo.inOut) with a curved top arc flattening. The destination word (Funnel display, `clamp(3rem,10vw,9.5rem)`) rises from 115% (0.75s expo.out) with a mono accent index ("01", "Case study"). Route swaps while covered. Reveal: word exits up, panels leave upward (0.85s expo.inOut) with curved bottom arcs. Never strands the user (6s timeout). |
| 3 | **Mega name and kinetic letters** | `home/Hero.tsx`, `ui/Words.tsx (Chars)`, `chrome.css .kinetic` | "Md. Emon / *Miah.*": per-char masks, chars rise 112%→0, 28ms stagger, 1.1s ease. After the reveal, the hovered char lifts 5% and skews -6° into accent; its neighbours lift 2.2% and tint 55%. |
| 4 | **Word reveal** | `Words.tsx`, `motion.css [data-reveal]` | Words slide up from 112% inside overflow masks, 38ms stagger. Other variants: up / fade / scale / **clip** (inset from bottom, image inner de-zooms 1.25→1) / line (scaleX) / stagger. Triggered at "top 93%", gated by ready. |
| 5 | **Scrub text** | `home/ScrubText.tsx` | About story at t-h1 size; each word goes from 0.16 → 1 opacity, scrubbed (`stagger .12, scrub .6`, start top 80%, end bottom 55%). |
| 6 | **Terminal** | `home/Terminal.tsx`, `home.css .term`, `app/not-found.tsx` | `emon@dhaka: ~ (interactive shell)` with traffic lights. Types `whoami` / `cat stack.txt` / `./now.sh`: commands at 0.06 s/char, outputs `min(len·0.012, 0.7)s`, pauses 0.3/0.1s, starting on scroll-in. Then it becomes a REPL: help, whoami, projects, skills, now, github, contact, clear, with an easter-egg `sudo` → "Permission denied: nice try, but this portfolio is protected and resilient!". Quick-command chips. The 404 page is also a terminal. The footer labels the palette opener "Terminal". |
| 7 | **Command palette** | `nav/CommandPalette.tsx`, `chrome.css .palette` | ⌘/Ctrl+K or `/`; Esc closes; ↑↓/Enter. Groups: Pages, Projects, Notes, Actions (copy email + toast, theme, start brief), Elsewhere (mail, GitHub, LinkedIn, Facebook, WhatsApp, call). Panel rises 26px and scales .965→1 (0.7s ease) over a 14px-blur backdrop. Active row is fully inverted (fg bg). Copy: placeholder "Jump to a page, project or action…"; empty state "Nothing matches “x”. Try “work”, “theme” or a technology like “Prisma”." |
| 8 | **Live Dhaka clock** | `hooks/useDhakaTime.ts`, `footer/LiveClock.tsx`, header, menu | `Intl` with `Asia/Dhaka`, 24h. Header shows "● Dhaka **HH:MM**"; hero chip and footer show "● Dhaka, Bangladesh · **HH:MM:SS** UTC+6" with the green ping dot. Paired everywhere with "Open to full-time & contract roles". |
| 9 | **Custom cursor** | `motion/Cursor.tsx`, `motion.css .cursor` | 8px accent dot (0.12s follow) plus 46px ring (0.55s lag, 1px fg at .4). States: link (ring ×1.5, accent tint, dot shrinks); **label** (`data-cursor="View|Explore|Go|Scroll|Stack|Close"`: ring ×2.3 solid accent with a tiny mono label); text caret; hide; pressed ×0.75. Fine pointers only. |
| 10 | **Magnetic** | `ui/Magnetic.tsx` | Inside 0.75 × the element's max side, the element follows the pointer by 0.35 (orb 0.28) with `elastic.out(1,.45)` over 0.9s. Used on primary CTAs only. |
| 11 | **Pointer depth parallax and tilt** | `home/HeroStage.tsx`, `motion/Interactions.tsx` | `[data-depth]` layers (orb -0.5, grid .25, portrait .35, chips .7–1.1) offset by `n·depth·60px` (1.2s power3.out). `[data-tilt=7]` tilts the portrait (perspective 1000). `.spot` puts a 420px radial `--glow` under the pointer. |
| 12 | **Rotating words** | `home/RotatingWords.tsx` | "Full-stack engineer building [AI voice agents → payment-ready storefronts → realtime platforms → motion-rich interfaces]": a vertical slot machine, 0.9s expo.inOut every 2.6s, in accent. |
| 13 | **Stacked project cards** | `home/StackedCards.tsx`, `home.css .pcard` | Sticky cards at `top: header + 12 + i·24px`. As the next card arrives, the previous one recedes (scale .93, brightness .5, scrubbed). Card layout: 16:11 image + body with "01 / 07", year, category eyebrow, t-h1 title, stack chips, and a "Case study ↗" row whose icon rotates 45° into accent. |
| 14 | **Hover-preview index** | `home/WorkIndex.tsx` | Big t-h2 rows. On hover the others dim to .28, the row shifts right and turns accent. A 360px screenshot follows the pointer, rotating with horizontal velocity (±9°). |
| 15 | **Velocity marquee** | `motion/Marquee.tsx`, `home/TechMarquee.tsx` | Two opposite rows of stack names at 9rem Funnel (row B outlined), separated by a spinning 4-point star (14s). Scroll velocity boosts speed (`1 + min(|v|/350, 7)`) and eases back over 1.2s; hover slows it to .25×. |
| 16 | **Circular text badge** | `home/ScrollCue.tsx` | 116px disc with "SELECTED WORK • …" on a circular path spinning 20s, arrow in the middle; hover fills accent. |
| 17 | **Hero orb** | `home.css .hero__orb` | Blurred radial vermilion "sun" breathing (9s, scale 1→1.08, opacity .45→.62), a dashed ring spinning 80s, an inner solid ring, an 84px grid masked by an ellipse. |
| 18 | **Counters** | `ui/Counter.tsx`, `home/About.tsx` | 100+ / 8+ / 90+ / 99% count up 0→n over 2s power3.out once, at t-display size. |
| 19 | **Laser line** | `ui/ScrubFill.tsx`, `home.css .timeline` | Accent rail fills with scroll (scrub .5) and has a glow; timeline dots spring ×1.35 on hover. |
| 20 | **Small details** | `ui/Roll.tsx`, `ui.css`, `UIProvider.tsx`, `footer` | Text roll on hover (label up 115%, duplicate in); underline sweep; circular-reveal theme switch (View Transitions, 1000ms); toast pill; footer giant "EMON." with accent period; menu overlay clip-wipe (0.8s expo.inOut) with 8rem words that shift and turn accent on hover. |

---

## 5. Copy voice and tone

- **Confident, concrete, engineering-literal.** Real nouns and numbers: "Bunny Stream HLS", "amountCents integer safety", "Stripe Connect Express split payouts", "Sub-second LCP, zero CLS". No fluff adjectives except the occasional "unforgettable".
- **Short display lines with a period, accent on the payoff word:**
  - "Products that *ship* and *scale.*"
  - "Let's build something *worth* *shipping.*"
  - "Lost in *space.*"
- **Friendly, plain CTAs:** "See my work", "Let's talk", "Start a project", "Take me home", "The full story", "or send a short brief", "Scroll to explore".
- **Developer-in-joke humour,** used sparingly and in text, never emoji:
  - "nice try, but this portfolio is protected and resilient!"
  - "bash: no such route. It may have moved, or never existed."
  - "The reason half my projects have a leaderboard."
- **Place and identity:** "Designed & built in Dhaka.", UTC+6 clock, Bengali greetings, "emon@dhaka".
- **Section labels** are parenthesised mono eyebrows: "(Selected work)", "(About)", "(Next chapter)", "(Everyday tools & engineering stack)".
- **Pitch** (Hero): "I turn ideas into fast, secure products: Next.js and Node on the surface, PostgreSQL and MongoDB underneath, and just enough motion to make them unforgettable."
- **Story** (About scrub): "I'm Emon, a full-stack engineer in Dhaka. I build fast, secure Next.js products, from payment-automated storefronts to AI voice booking agents, and I care as much about how they feel as how they run."
- **Honesty flags:**
  - portfolio3's `testimonials-data.ts` is flagged in its README as "**currently fictional placeholders**". Do not port it as real.
  - The stats (100+ / 8+ / 90+ / 99% satisfaction) are self-reported. Carry them over only if the user confirms.

**Contrast with the 3D copy.** The 3D site's copy is game-flavoured and emoji-heavy: "Jump into Play Mode 🎮", "Launch contact rocket 🚀", "ready. say hello 👋", "/dev/null island … 🐛". The playful *ideas* fit the brand's humour; the emoji do not. Replace them with lucide-style line icons drawn as SVG in the DOM or as small meshes in 3D, and with mono text glyphs like `[ ]`, `>`, `_`.

---

## 6. Rendering realities in the 3D site that affect brand fidelity

`src/scenes/environment/Effects.tsx` runs this stack, in order:
Bloom (`luminanceThreshold .82`, smoothing .25) → TiltShift (high quality) → **ToneMapping ACES_FILMIC** → HueSaturation (+0.08…0.1, driven by `env`) → BrightnessContrast (+.01 / +.07) → Vignette (.28 / .5).

This is a full-frame pass, so a material's `toneMapped=false` does nothing here. I computed three.js' ACES formula at exposure 1, before HueSat/contrast/vignette (`scratchpad/aces.py`):

| Brand hex fed as material colour | Renders as | Linear input that renders exactly the brand hex |
|---|---|---|
| accent `#ff4a2e` | `#f75a33` (more orange, darker) | `Color().setRGB(1.142, 0.036, 0.020)` (linear, >1) |
| accent-2 `#ff8a4c` | `#eea15c` | `setRGB(1.448, 0.142, 0.044)` |
| cream `#f2eee6` | `#dedddb` (greyed) | `setRGB(1.987, 1.586, 1.060)`; luminance ≈1.6 means it **will bloom** |
| fg-3 `#877f72` | `#948c7c` | `setRGB(0.202, 0.179, 0.146)` |
| bg `#0a0908` | `#010100` (warmth crushed to black) | – (do not rely on near-black for warmth; tint fog/sky instead) |
| ok `#2ee59d` | `#83dbb3` | not reachable (best `#3dc29c`), so use a DOM dot or accept the shift |

Plain `#f2eee6` text (linear lum ≈ .86) is already above the bloom threshold of .82, so **cream SDF text in the main scene glows faintly today**.

**Recommendation: render text in two tiers.**
- **Tier A, "diegetic" signage** in the main scene: labels on buildings, numbers on monoliths, in-world screens. Tone mapping is acceptable because the text is lit by the world. Use the pre-compensated colours above and keep body-text luminance under the bloom threshold, for example cream at about lum .75. Raise bloom only on purpose (accent glows, the screen cursor).
- **Tier B, "editorial" typography:** hero name, scrub story, chapter titles, CTAs that float in front.
  - Render it **after** the composer in a second scene: drei `<Hud renderPriority={2}>`, which inherits the main camera, with `toneMapped={false}` on the text materials (see §10 for why).
  - It then shows exact brand hexes, stays crisp, and does not bloom or vignette. Place it in empty sky regions per camera stop.
  - Verify colours with Playwright pixel sampling on the existing harness (`scratchpad/tools/*.cjs`).

**Grain:** do not lay the DOM SVG grain with `mix-blend-mode` over a constantly repainting canvas. Use postprocessing `Noise` (`BlendFunction.OVERLAY`, opacity ≈ .07, `premultiply`) on medium/high quality only.

---

## 7. Signature moves, ranked (what makes it feel like Emon)

1. **Warm-black + vermilion "rising sun" palette with grain.** It is the strongest single identifier.
2. **Funnel Display mega-type:** -0.05em tracking, accent second line, closing period ("Md. Emon / *Miah.*", "EMON.").
3. **Masked rise-in reveals** on the house ease, char/word staggers, gated by a ready signal.
4. **Terminal identity:** prompt logo, `emon@dhaka: ~` shell with typing and REPL, mono eyebrows, `(Label)`, ⌘K palette.
5. **Bilingual preloader:** Hello → হ্যালো → স্বাগতম, 000% counter, accent bar, curved lift.
6. **Accent + bg curtain** naming the destination with an index.
7. **Live Dhaka clock and green "available" ping.**
8. **Scrub text** (words light up with scroll).
9. **Labelled cursor and magnetic CTAs** (secondary; desktop-only polish).
10. **Rotating-word slot machine, velocity marquee with outline row, spinning circular badge, counters, laser line.** These are supporting motifs.

---

## 8. Translation table, brand move to 3D

Legend: **3D** = becomes a 3D element; **DOM** = stays HTML (fast, accessible); **Adapt**; **Drop**.

| Move | Decision | Concrete translation in city-3d-portfolio |
|---|---|---|
| Palette | **3D + DOM** | Re-key `src/systems/dayNight.ts` PALETTES so the scroll walks through the brand's two themes. **Dawn/intro = "rising sun"**: sun disc and horizon in accent/accent-2 (`#ff4a2e`/`#ff8a4c`) over warm-dark sky. **Day = light theme**: fog/sky toward cream `#efebe3`/`#e7e2d7` (warm, not blue). **Night/finale = dark theme**: sky `#0a0908`→`#191714` with a faint vermilion city glow, stars cream `#f2eee6` (not navy `#151c40`). Replace cyan `crystalMat` and the `#7ff3ff` focus ring with accent. Window glow stays warm. DOM chrome tokens become the portfolio3 tokens verbatim; `theme-color` → `#0a0908`. |
| Fonts | **3D + DOM** | DOM: copy the 4 WOFF2 files plus OFL into `public/fonts`, use `@font-face` with the same family names, remove Bricolage. 3D: static TTF instances (§2.3) at Funnel 600, Inter 400, JBM 400, preloaded into the loader progress. Sanitize 3D strings: no → ↗ ✕ or emoji (draw icons as meshes or SVG). |
| Hero name "Md. Emon / *Miah.*" | **3D (Tier B)** | Giant SDF text in the sky at takeoff. One troika `Text` per glyph (≈13), each with a `clipRect` mask rising from 112% (28ms stagger, 1.1s, house ease), triggered when the preloader lift completes. Line 2 in accent via `colorRanges`. Size it with the §2.4 formula. Optional desktop hover: raycast a glyph, lift it 5%, skew, accent (kinetic). It should drift with the camera parallax, not sit as a flat DOM `<h1>` (keep the DOM h1 sr-only). |
| Kicker + clock | **DOM (small) + 3D (optional)** | Keep "● Open to full-time & contract roles · Dhaka (UTC+6) HH:MM" as a small mono pill in the nav, real Dhaka time. Optional: clock hands on a town tower driven by `Intl` Asia/Dhaka, a cheap and charming in-world callback. |
| Rotating words | **3D** | Slot-machine drum: a 4-faced prism next to "Full-stack engineer building", each face an SDF phrase in accent, rotating 90° (0.9s expo.inOut) every 2.6s. |
| Preloader | **DOM, re-skinned** | Rewrite the inline `index.html` loader to portfolio3's: warm black, top row (name / Portfolio © year), greetings sequence in DOM (Bengali with Noto Sans Bengali, which troika cannot shape), giant `000%` counter driven by **real** load progress (`loader.set`), 3px accent bar, "Booting the experience" eyebrow. Keep the existing Enter gate for audio, restyled as `.btn` pills (no 🔊), plus the "Skip to 2D" link. Outro: expo.inOut curved lift **straight into the takeoff camera move**. Drop the SVG voxel-island loader art. |
| Curtain | **DOM, adapted** | Use only for **discontinuous jumps**: nav/palette jump across more than one chapter, entering/leaving Play Mode, opening 2D mode, opening a case study. It hides the camera teleport, which beats a 2.2s Lenis glide through the whole island. Accent + bg panels with curved arcs and the destination word ("Projects", index "02"). Continuous scroll never uses it. |
| Scrub text | **3D (Tier B)** | About story as large SDF text in clear sky/wall space at the about stop. One troika mesh with a derived material: uniform `uProgress` from the stop's scroll progress, per-glyph opacity `0.16 → 1` computed from `aTroikaGlyphIndex / glyphCount` (word-aligned). Single draw call. sr-only DOM twin. |
| Terminal | **3D** | In-world monitor on the workshop desk and/or the finale console (one already draws "> CONTACT" on a canvas). Render a `CanvasTexture` in JetBrains Mono (canvas can use the WOFF2 via `FontFace`), styled like `.term` (traffic lights, `emon@dhaka: ~`, accent `$`). Replays the exact intro script and timing when the camera arrives. Clicking it focuses a hidden DOM `<input>` mirrored onto the texture, which keeps it accessible and gives mobile a keyboard. Same commands as portfolio3; `contact` can trigger the rocket. The contact modal becomes this terminal style (it already is, minus emoji). |
| Command palette | **DOM** | The fast, accessible escape hatch, and the right home for dense info that the "weird cards" try to hold. ⌘K / `/`, styling verbatim from `chrome.css .palette`. Groups: **Chapters** (fly-to), **Projects** (fly-to building + open), **Actions** (copy email + toast, sound on/off, 2D mode, Play mode, launch rocket), **Elsewhere** (GitHub, LinkedIn, Facebook, WhatsApp, call). Must stop Lenis and suspend Play-mode keys while open, and ignore `/` while the terminal input is focused. Add a "Search ⌘K" pill in the nav. |
| Logo | **DOM + 3D** | Replace `◆` with the prompt mark (SVG from `app/icon.svg`) in nav and favicon. In-world: the voxel `EMON` sign gains a vermilion **period block** ("EMON."), the footer-mark signature at almost no cost. Optional extruded prompt-mark landmark. |
| Section labels | **3D + DOM** | "(Selected work) 02 / 05" style: mono uppercase eyebrows with accent parentheses, both on in-world signage and in the nav. Replaces "Chapter 02 · Projects district — ". |
| Stacked cards | **Adapt → 3D** | Projects are buildings with screens. As the camera leaves project n for n+1, n's screen recedes (scale .93, brightness .5, scrubbed), the card-stack feel done physically. Screens show real portfolio3 screenshots (`public/assets/projects/*.webp`, e.g. `sua1.webp`), crossfading through `screenshots[]`. Card anatomy becomes in-world signage near each building: "01 / 07" accent index, year, category eyebrow, title in Funnel 600, 3–4 stack chips as small rounded slabs, "Case study" opening the modal (case-study and lightbox stay DOM). |
| Hover-preview index | **Drop in 3D** | Replaced by building billboards. The full index lives in the palette and the 2D mode. |
| Marquee | **3D** | Curved LED ticker ring around the skills tree trunk or a tower (troika `curveRadius`). Row A filled cream, row B outlined (`fillOpacity 0` + `strokeWidth`), 4-point accent stars spinning. Speed boosted by Lenis `velocity` with the same clamp-and-relax formula. |
| Circular badge | **3D** | Curved text ring "SCROLL TO FLY • SCROLL TO FLY •" around the hero focus, or "LAUNCH • CONTACT •" around the rocket pad, spinning 20s. |
| Orb / sun | **3D** | The dawn sun is the breathing vermilion orb (scale/opacity breathe 9s). Dashed orbit ring(s) around the island (`LineDashedMaterial`, 80s/rev). The grid motif can be a faint masked grid on the launch-pad floor. |
| Laser line | **3D (already half there)** | The skills circuit traces "powering on" are this move. Restyle them to accent with the glow colour (`--glow`) and drop the multi-colour cyan/green/purple scheme. Experience could be a power line with role nodes lighting up. |
| Counters | **3D (Tier A)** | Four slim monoliths/shelves in the workshop with SDF numbers counting up over 2s on arrival. Use JBM digits or fixed slots to avoid width jitter. Only if the user confirms the stats. |
| Outline numerals (process 01–04) | **3D** | troika stroke-only numerals that fill accent as each step is reached (if a Process/Services stop is added). |
| Portrait | **3D** | `developer.jpg` as a framed in-world portrait (about workshop wall or hero billboard) with the "clip" reveal as a shader (bottom-up inset, inner de-zoom 1.25→1) and a vermilion rim-glow edge echoing the photo's rim light. |
| Cursor | **DOM, adapted** | Keep dot + ring, driven by R3F `onPointerOver/Out` on interactive meshes with labels: building "View", rocket "Launch", desk monitor "Type", about objects "Open", screens "Play". This fixes the missing hover affordance in the canvas. Fine pointers only. |
| Magnetic / tilt | **Adapt** | DOM: Magnetic on the few remaining CTAs. 3D: interactive screens/objects tilt toward the pointer up to 7° (the `data-tilt` value) with power3.out, plus a subtle pointer parallax on the camera (the `data-depth` idea). |
| Buttons, chips, toast, kbd | **DOM** | Port `.btn` (curved rising fill), `.chip`, `.dot--ok`, `.kbd`, `.toast` verbatim for nav, palette, modals, 2D mode. |
| Progress | **DOM** | 2px accent top bar (scaleX = journey progress). Restyle or replace the dashed right rail. |
| Grain | **Adapt** | postprocessing `Noise` overlay ≈ .07, medium/high quality only. |
| Theme switch | **Drop in 3D, keep in 2D** | The scroll *is* the theme (dawn → day-cream → night-black). The circular-reveal light/dark toggle stays only in FlatSite (2D), which should reuse portfolio3's CSS tokens wholesale. |
| Glass cards | **Drop** | The big frosted navy cards (`src/ui/Journey.tsx` + `.card`) are the opposite of the brand's type-on-black editorial look. Keep the `[data-stop]` panels for scroll measurement and a11y (visually hidden semantic content), since `systems/scroll.ts` and `cameraPath.ts` depend on them. Move visible copy into Tier A/B 3D text; dense detail goes to modals, the palette and 2D mode. |
| Menu overlay | **Drop** | The 5-chapter nav pill plus palette covers it. Optional on mobile only. |
| Testimonials, FAQ | **Drop from 3D** | Testimonials are fictional in portfolio3. FAQ belongs in 2D mode or the palette. |
| Emoji | **Drop** | Use lucide-style SVG in DOM, small meshes in 3D, and mono glyphs (`[ ]`, `>`, `_`). This also avoids troika's CDN fallback-font fetches. |

---

## 9. Proposed shared brand module (for the implementation stage)

Create `src/brand.ts` so DOM and 3D read one source:
```ts
export const brand = {
  color: { bg:'#0a0908', bg2:'#11100e', bg3:'#191714', fg:'#f2eee6', fg2:'#bfb9ac', fg3:'#877f72',
           accent:'#ff4a2e', accent2:'#ff8a4c', ok:'#2ee59d', lightBg:'#efebe3', lightBg2:'#e7e2d7' },
  // linear inputs that survive the ACES pass (Tier A only; Tier B uses the hex directly)
  aces: { accent:[1.142,0.036,0.020], accent2:[1.448,0.142,0.044], fg3:[0.202,0.179,0.146] },
  font: { display:'/fonts/FunnelDisplay-600.ttf', sans:'/fonts/Inter-400.ttf', mono:'/fonts/JetBrainsMono-400.ttf' },
  type: { mega:{ letterSpacing:-0.058, lineHeight:0.84 }, display:{ letterSpacing:-0.05, lineHeight:0.9 },
          h1:{ letterSpacing:-0.042, lineHeight:0.96 }, eyebrow:{ letterSpacing:0.1 } },
  ease: { em:'0.22,1,0.36,1', io:'expo.inOut', spring:'0.34,1.56,0.64,1', magnetic:'elastic.out(1,0.45)' },
  stagger: { char:0.028, word:0.038, item:0.09 }, dur: { reveal:1.1, clip:1.4, hover:0.55, curtainIn:0.72, curtainOut:0.85 },
} as const
```
CSS mirrors these as the portfolio3 custom properties (copy `styles/tokens.css` and the relevant `ui.css`/`chrome.css` blocks).

---

## 10. Risks and open checks for the next stage

- **Tier-B Hud layering (checked in source):**
  - `@react-three/postprocessing` EffectComposer runs at `renderPriority = 1` (dist/index.js:365/448).
  - drei `Hud` (core/Hud.js) with `renderPriority={2}` runs afterwards: `autoClear=false; clearDepth(); gl.render(hudScene, camera)`. Its portal **inherits the main camera**, including the `setViewOffset` lens shift, so no camera copy is needed unless you add a camera inside it.
  - Two catches:
    - (a) `clearDepth()` means Tier-B text is never occluded by the world.
    - (b) The `<Canvas>` in `src/scenes/Experience.tsx` is not `flat`, so R3F's default `gl.toneMapping = ACESFilmicToneMapping` applies to this direct-to-screen pass. Tier-B text materials must set `toneMapped={false}` (drei `<Text material-toneMapped={false}>` or a custom material) to show exact brand hexes.
- **troika per-glyph shader:** `aTroikaGlyphIndex` exists in the 0.52.5 bundle. Build the reveal via `createDerivedMaterial` or troika's `material` prop and test on SwiftShader.
- **Font pop-in:** gate "Enter" on `preloadFont` for all 3D strings (pass the exact `characters`).
- **Mobile:** Tier-B type must use the §2.4 sizing and `maxWidth`. Verify at 390×844 with the existing Playwright harness, where the bottom-sheet card currently covers half the scene.
- **Reduced motion:** keep portfolio3's contract. No preloader animation, no curtain, reveals jump to the final state, scrub text fully lit, Lenis off (the 3D site already disables Lenis when reduced).
- **Content truth:** port role, location, availability, email and projects from portfolio3 `lib/site.ts` and `lib/projects-data.ts`. Do not port fictional testimonials. Confirm the stats with the user.
