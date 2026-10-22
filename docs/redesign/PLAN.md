# Floating Island City v2: the redesign plan

**Short version (Banglish)**
- Tumi je "2 ta weird card" er kotha bolecho: (1) baam pashe boro frosted-glass content card (phone e nicher bottom sheet), ar (2) About ghore glass tooltip, je same text abar dekhay. Ei duita shoho 3D view theke shob glass box baad jabe.
- Notun idea: puro scroll hobe 11 shot er ekta choto film. Camera cholar shomoy screen e kono lekha thakbe na. Camera thamle oi shot er khali akash ba dewal e portfolio3 er font e (Funnel Display, vermilion accent) headline ta letter by letter uthe ashbe, ar ekta patla vermilion line diye building ba object er sathe jora thakbe. Baki shob kichu (screenshot, metric, skill, experience, services) thakbe island er jinish er gaye: building er screen, LED band, tree er tag, workshop er object, bridge er plaque, departures board, rocket er countdown.
- Shob content real, portfolio3 theke: Md. Emon Miah, 8 ta project (tar moddhe 4 ta building), 3 ta job ar 2 ta degree, 44 ta tool, 8 ta service, contact form. Fake testimonial, banano skill level ar emoji baad. Portfolio3 er prottek ta lekhar ekta jayga thik kora ache (section 2 er table).
- Kichu jinish DOM e thakbe, kintu shudhu tumi chaile khulbe: Index (⌘K), case study, brief form. Eta tomar approval lagbe (proshno 7). Na bolle shob 3D te kora jabe, tar ekta alternative o ache.
- Camera smooth hobe. Stop gulo ar DOM card theke mapa hobe na, data theke ashbe. Notun speed curve e hothat thama ar dour thakbe na. Scroll 18.9 screen theke kome ~12.5 screen hobe.
- **Kivabe dekhbe:** kaj hobe `v2` branch e. Prottek phase shesh e ekta Vercel preview link pathabo, `main` (live site) P5 porjonto badlabe na.
- **P0 (~2 din):** card, tooltip, pill ar lens shift chole jabe, tomar asol nam, project ar screenshot boshbe, simple 3D title thakbe. Tarpor P1–P5. Puro kaj ~6–6.5 shoptaho.
- Shesh e 10 ta proshno ache, Banglish e. Prottek tar ekta default ache. Uttor dao, ba shudhu **"go"** likho, tahole default gulo diye P0 shuru korbo.

---

## 1. Diagnosis: what is wrong today

**The 2 weird cards**
- **Card 1 (certain):** the big frosted-glass content card (`.card` in `src/ui/Journey.tsx`). It is pinned left on desktop, becomes a bottom sheet on phones, and is on screen at 7 of 8 stops.
  - It covers 13–22% of a 1440 screen.
  - At 1920 it covers only 8–13% and looks lost.
  - On a 390 px phone it covers 36–51%, which squeezes the 3D into a band about 300 px tall.
- **Card 2 (most likely):** the About tooltip (`.about-tip`, a drei `<Html>` in `AboutWorkshop.tsx`). It is a second glass box beside Card 1 that repeats the same list item. On phones the sheet and the tooltip stack as two dark boxes.
  - Two other candidates have the same root cause: the "browser window" billboard on posts at project 1, and the project modal, which repeats the text a third time.
- **Root cause:** the content is HTML pasted over the canvas. It is never lit, fogged or colour-graded, so it looks stuck on rather than part of the world.

**Other presentation problems**
- **Layout bugs:**
  - At 1366×657 (and 1280×720) the About card runs 51 px under the nav.
  - At 820×1180 the card sits on top of the subject. The JS lens shift (`setViewOffset`) switches on aspect ratio while the CSS switches at 640 px width.
- **Hero:**
  - Text contrast over the pale dawn sky is 1.3–1.7:1. WCAG needs 4.5:1.
  - The ghost "Play Mode" button is nearly invisible.
  - The voxel EMON sign never gets a proper shot.
- **Skill labels:** DOM pills of 4–12 px that overlap and show through the tree. They repeat the card's meter list, and the levels in that list are made up.
- **Everything is said 3 times:**
  - the chapter name appears in the card kicker, the nav pill and the progress rail;
  - each project appears on the building screen, in the card and in the modal.
  - The sound-off icon reads as "....".
- **Placeholder identity:**
  - 3 of 4 projects are fake, the email is hello@example.com and the role reads "Creative Frontend Developer".
  - The about objects (coffee, cat, guitar) are invented.
  - The site shows 27 emoji, and its navy/cyan palette has nothing to do with Emon's brand.
- **Cost:** a `backdrop-filter` blur sits over a canvas that redraws every frame.

**Smoothness problems (measured)**
- **Long scroll:** the journey is 18.9 screen heights (about 16,100 px at 900 p, or about 180 wheel notches), and only 28% of that is holds.
- **Stop-and-surge camera:**
  - The cubic easing leaves about 1.2 vh of almost-frozen camera around every stop, followed by a burst.
  - Speed hits zero at every hold edge.
  - Peak speeds differ 3–5× between moves: project hops run at 46 u/vh, the about→finale move at 178.
- **The intro flyover lurches** (104 → 91 → 221 u/vh), because the spline is sampled per waypoint instead of by distance.
- **Text and camera are out of sync:**
  - Cards follow the scroll instantly while the camera lags, so a card is on screen during 73% of camera travel.
  - Ghost cards linger at 4–5% opacity.
  - On phones the sheet sweeps across the building it describes.
- **Navigation:**
  - Jumps always take 2.2 s, however far they go.
  - Stops are re-measured when fonts load, so their timing can shift after the page has loaded.

---

## 2. The new concept

**"Director's cut, annotated."** The scroll becomes a short film of 11 composed shots, each with one subject.

- **In flight:** while the camera moves there are no words. Only the world moves (the B-roll).
- **On settle:** once the camera has really stopped, one small headline group rises letter by letter into the empty sky or plain wall of the frame.
  - The group is a mono eyebrow, a Funnel Display title ending in an accent period, and one line.
  - A vermilion anchor dot and a thin leader line tie it to its subject, like a callout on an engineering drawing.
- **Everything else lives on objects the island physically has:**
  - real portfolio3 screenshots on facade screens;
  - metrics on LED bands built into each building;
  - skill tags on the circuit tree;
  - captions on real objects in the workshop;
  - milestone plaques on the bridge;
  - a split-flap departures board for services;
  - a countdown ring on the launch pad.
- **No glass, no plates, no boxes over the scene.**
- **Long reading stays in the DOM, on request only:** the Index, the case study and the brief form open only when the visitor asks for them. The case study and the brief grow out of the 3D screen they belong to. This needs your sign-off (question 7), and an all-3D alternative is described there.

### Copy rules (enforced by `scripts/check-strings.mjs`)

- **What counts as a word:** a whitespace-separated token that contains at least one letter.
  - "full-time" and "UTC+6" count as one word each.
  - Pure numbers, dates, ordinals and separators do not count: "3", "2024", "(05)", "01 / 04", "·".
- **Headline group cap:** counts the eyebrow, the title and the line. The prism slot counts at its longest word.
  - Desktop (wide): at most 24 words.
  - Phones (tall) and the compact tier: at most 18 words.
  - The check runs on every shot, for every layout tier, using that tier's copy variant.
- **Counted separately, with their own caps:**
  - action pills: 3 words or fewer each, and exactly one primary action per shot;
  - decorative rings and badges: 4 words or fewer;
  - world labels: 6 words or fewer each;
  - inspect captions: 16 words or fewer.
- **Copy variants:** each shot stores `copy.wide`, `copy.tall` (phones) and `copy.tiny` (eyebrow and title only).
  - Shots 2, 9 and 11 need a shorter phone line. Those phone variants are new wording, so they are part of the copy you approve (question 9).

### Chapters and shots (real portfolio3 content)

Word counts are given as (desktop / phone).

**Chapter 01 Hello. Shot 1 "Title" (dawn, hold 0.5 vh), 17 / 14 words**
- **Preloader (DOM, inline in `index.html`):**
  - The greetings are Hello → হ্যালো → স্বাগতম, at 0.4 s each with a minimum of 1.2 s in total. A 000% counter shows real loading progress.
  - From the very first paint, a bottom row reads "Md. Emon Miah · Full-stack software engineer · Open to full-time & contract roles · Dhaka". Next to it are an "Email me" link and "Skip to the 2D version". This row passes the 10-second rule before any JS or 3D has loaded (section 6).
  - When loading completes, the preloader lifts with a curved expo.inOut edge over 0.8 s. There is no Enter click and sound is off by default (question 8).
  - The lift runs at the same time as a shortened takeoff out of the cloud sea: 2.4 s on a first visit (today 3.4 s) and 1.6 s for returning visitors, who also skip the greetings.
- **Frame:** a locked-off wide shot. Warm-dark sky, a vermilion rising sun, the island lower right.
- **Headline:**
  - eyebrow "Open to full-time & contract roles · Dhaka, Bangladesh (UTC+6)" (phones: "Open to full-time & contract roles");
  - mega "Md. Emon / *Miah.*";
  - "Full-stack engineer building" plus a rotating-word slot (AI voice agents / payment-ready storefronts / realtime platforms / motion-rich interfaces);
  - one 3D pill, "See my work";
  - a curved "SCROLL TO FLY •" badge.
  - The reveal arms at 80% of the takeoff, when the camera has almost stopped. The title is readable about 2.5 s after the preloader starts lifting.
- **World:**
  - rooftop name signs on the 4 featured buildings;
  - the voxel "EMON." sign gains an accent period and chase lights during the flyover.
- **The HUD (DOM) shows** "Emon Miah · Full-stack engineer", an "Open to work" chip with a green dot, and Contact.

**Chapter 02 Selected work. Shot 2 "Work slate" (morning, hold 0.5 vh), 19 / 15 words**
- **Frame:** a high three-quarter overview. The buildings rise in sequence.
- **Headline:**
  - "(02) Selected work";
  - "Products that / ship and *scale.*";
  - desktop: "Live products across EdTech, digital commerce, AI voice, esports and offline-first apps."
  - phone variant: "EdTech, commerce, AI voice, esports and offline-first apps."
- **World:** 8 pins, each showing a name and one metric that belongs to that project.
  - San Uni Academy (Adaptive HLS)
  - Hasibul Gaming Point (10,000+ monthly users)
  - Dent-Assist AI (< 450 ms voice)
  - Esports Arena (GKEC + BOE). This pin carries no metric, because the two projects' numbers must not merge.
  - Bismillah Agro, shown as farm terraces (99 Web Vitals), with a Bangla sign drawn on a canvas
  - Quran Web App, shown as a quiet, respectful lantern pavilion (offline PWA, < 150 ms audio)
  - Chit-Chat, shown as a radio mast (< 80 ms)
  - "This site" (question 4)
- **Pins:** a featured pin flies the camera to its building, and any other pin opens that project's case study. Phones show 4 pins plus "+4 more", which opens the Index filtered to Work.

**Shots 3–6: the 4 featured buildings (day, hold 0.6 vh each, orbit-arc hops around the plaza)**
- **Same for every building:**
  - The facade screen sits flush in the wall, with no billboard posts.
  - The screen boots when the camera settles and shows real screenshots: a de-zoom, then crossfades every 2.2 s. It stops after 2 cycles (4.4 s, inside WCAG's 5 s limit).
  - The screen recedes when the camera leaves and shows an idle `[ > _` screensaver in flight.
- **Same headline shape:** eyebrow, title and the verbatim subtitle, plus pills (not counted).
  - The 3 metrics roll up on the building's own LED band (2 on phones).
  - Each band is a digit odometer, so the numbers are never re-typed (section 6 budget).
- **3 San Uni Academy (12 words):**
  - A lecture tower with a video wall, plus a coin-stream prop that splits into vendor wallets (the ledger).
  - Eyebrow "01 / 04 · EdTech & LMS · 2025–26". Subtitle "Multi-vendor LMS, merchandise marketplace & HLS video pipeline".
  - Band: Adaptive HLS · Stripe + SSLCommerz · GPT-4o-mini.
  - Pills: Case study and Live. A "Client NDA" chip replaces the code link.
  - Screens: sua1, sua_vendor, sua_financials. Arrival: a dive.
- **4 Hasibul Gaming Point (14 words):**
  - A neon arcade kiosk. Telegram paper-plane drones leave it every 3 s, showing the delivery metric.
  - Eyebrow "02 / 04 · E-commerce · 2024–25". Subtitle "High-traffic digital marketplace, ZiniPay gateway & Telegram bot command center".
  - Band: 10,000+ monthly users · < 3.2 s checkout · Instant code delivery.
  - Arrival: a low arc from the left.
- **5 Dent-Assist AI (11 words):**
  - A clinic dome with a voice-waveform ring and a padlocked calendar slot (the PostgreSQL slot locks).
  - Eyebrow "03 / 04 · AI & Voice · 2025".
  - Band: < 450 ms voice latency · Automated booking · Prisma / PostgreSQL.
  - Code link: the dent_assis repo. Arrival: a high arc from the right.
- **6 Esports Arena (GKEC Esports + BOE Gaming Club, 12 words):**
  - A small stadium bowl with a bracket hologram.
  - Eyebrow "04 / 04 · Community · 2024–25". Line "Two live platforms: GKEC Esports and BOE Gaming Club."
  - **Each metric is labelled with its source:**
    - the east stand's LED reads "GKEC · 2,400+ players" and "GKEC · 99.9% uptime";
    - the west stand's LED reads "BOE · 500 signups/min" and "BOE · 94% cache hits".
    - Phones show one metric per stand.
  - Textures: gkec3 and boe2 only, because the other art shows real footballers.
  - Inspect gives a choice of 2 case studies, GKEC or BOE, each with its own metrics. Arrival: a crane down over the rim.

**Chapter 03 Stack. Shot 7 (golden hour, hold 0.8 vh), 17 / 17 words**
- **Frame:** a low swoop onto the circuit tree. The lamp post that blocks it today moves out of the sightline.
- **Headline:** "(03) Stack" · "Tools I reach *for.*" · "Everything here has been used in production work, not just a tutorial."
- **Branches and nodes:**
  - 5 branches, one per real group: Frontend & interactive UI · Backend & distributed systems · Data modeling & fintech · AI agents & fintech gateways · Cloud, video & infrastructure. The group names curve around the platform rim.
  - 44 nodes, each sized by how many projects used that tool (React 8, Tailwind 8, Next.js 7, TypeScript 6, Node.js 5, MongoDB 4 …).
- **Tags:**
  - Depth-tested tags of 12 px or more on the top 16 nodes (8 on phones).
  - On hover, focus or tap, a tag flips to "Shipped in 7 projects" and its circuit trace lights up in accent. The back face is laid out ahead of time.
  - Three.js & R3F is tagged "you're inside it".
- **Marquee ring:** carries portfolio3's two core-stack rows. It runs for 4.5 s, then stops, and it also pauses on hover and with Pause motion.
- **Removed:** the invented levels and the meter list.

**Chapter 04 About. Shot 8 (sunset interior, hold 0.9 vh), 17 / 17 words**
- **Frame:** a lateral track into the cutaway workshop.
- **Headline:** "(04) About", plus scrub text of portfolio3's lead: "A full-stack engineer from Dhaka who likes backends that stay correct and interfaces that feel alive." Each word lights from 0.16 to full opacity as you scroll through the hold.
- **Real objects, each numbered, each carrying its own text:**
  - developer.jpg in a frame, with a clip reveal and a vermilion rim glow. Its caption is "I'm Emon, a full-stack engineer in Dhaka."
  - A desk monitor running the `emon@dhaka: ~` shell: `whoami`, `cat stack.txt`, `./now.sh`, plus `ls ~/repos`, which lists the 9 featured public repos. Each repo line is focusable and opens GitHub in a new tab.
  - A bookshelf whose spines are the 6 engineering notes.
  - A headset or robot for "Agentic AI".
  - A gamepad and TV for "Player one".
  - A trophy for "Competitive coding".
  - A globe for "Three languages", with বাংলা drawn on a canvas.
  - A plant for "Ship small, learn fast", plus 2 posters for the other principles and a "27 public repos" plaque. Inspecting the plaque runs `ls ~/repos` on the monitor.
- **Interaction:** a tap, click or Enter dollies the camera to an object and writes its caption (16 words or fewer) beside it. ◀ ▶ (drawn as meshes) step through the objects. One object at a time, no auto-cycle.
- **Note spines:** clicking a spine slides the book out and shows its caption: title, "2 min" and the tag. A "Read note" pill opens `emon.pro/notes/<slug>` in a new tab by default. If the 3D site replaces emon.pro (question 6), the note opens in an in-site Note sheet at `#/notes/<slug>` instead, rendered from portfolio3's `content/notes/*.md`.
- **Easter egg:** the cat's egg moves to the monitor. Clicking it 5 times runs `sudo rm -rf /`, which answers with portfolio3's verbatim "Permission denied: nice try, but this portfolio is protected and resilient!". A saved `cat` egg is migrated to `sudo`, so returning players keep their count of 4.
- **Removed:** the coffee, cat and guitar, the hint bulbs, all 7 HTML tooltips and the DOM list.

**Chapter 05 Experience. Shot 9 "The journey so far" (dusk, one hold 0.8 vh), 19 / 13 words**
- **Frame:** the camera parks side-on to the rope bridge, so its posts read left to right as a timeline. It is one hold, with no micro-stops and no reading in motion.
- **Headline:**
  - "(05) Experience" · "The journey *so far.*";
  - desktop: "3 roles since 2024, from Laravel internships to leading front-end modernisation and shipping my own products."
  - phone variant: "3 roles since 2024, from Laravel intern to independent engineer."
- **5 plaques on new posts, each with a lantern:**
  - Diploma in CSE · Habiganj Polytechnic · 2020–24
  - Full-stack intern · IBCSX PRIMEx · 2024 (Laravel)
  - Front-end developer · Lilium Info Tech · 2024–25 (LCP −35%)
  - B.Sc. CST · Bangladesh University · 2024–28
  - Full-stack engineer · Independent · 2025–now
- **Inspecting a plaque** dollies to it and flips it. The back shows that role's top 2 bullets as captions, for example Lilium: "Refactored legacy interfaces to the Next.js App Router, improving LCP by 35%." and "Built an atomic Tailwind component library with designers, cutting layout errors by 25%."
  - ◀ ▶ moves between plaques.
  - "All details" opens Index → Experience, which has every bullet and each role's stack.
- **Progress:** an accent rope light along the handrail fills with hold progress, and each lantern lights as the rope light reaches it.
- **Phones:** the camera looks down the bridge from above, so the posts stack from top to bottom.

**Chapter 06 Work with me. Shot 10 "Departures" (nightfall, hold 0.7 vh), 18 / 18 words**
- **Subject:** a split-flap departures board at the foot of the launch islet: SDF text over flap tiles, with no canvas.
- **Headline:** "(06) Work with me" · "One engineer. / The whole *product.*" · "From the first schema to the last pixel of motion."
- **Board pages:**
  - Page 1, "PICK YOUR FORMAT": Full-time roles and Contract & project work, both marked BOARDING.
  - Pages 2–3: the 8 services, each with its proof project.
    - 01 Full-stack web apps & monorepos → San Uni Academy
    - 02 Fintech ledgers & split payouts → San Uni Academy
    - 03 Video streaming & media pipelines → San Uni Academy
    - 04 AI voice agents & automation → Dent-Assist
    - 05 Payments & digital goods → Hasibul
    - 06 Realtime platforms & community systems → Esports Arena (BOE)
    - 07 E2E testing & accessibility audits → San Uni Academy
    - 08 Cloud infrastructure & DevOps → San Uni Academy
  - Page 4, "WHAT EVERY BUILD INCLUDES": the 4 engineering standards. Strict End-to-End Type Safety · Core Web Vitals & Motion · Financial & Webhook Idempotency · Production Runbooks & DevOps.
- **Paging:** manual, with ◀ ▶ meshes. If the visitor is idle for 2.5 s, the board flips once by itself and then stops. It also pauses on hover, on focus and with Pause motion.
- **Rows:**
  - Focusing or tapping a row writes the row's detail on the board's bottom detail strip:
    - for a service, its summary (for example "Multi-tenant platforms, portals, storefronts and internal admin consoles, built end to end.");
    - for a format, its 3 points;
    - for a standard, its first clause.
  - The detail strip has two pills: "See proof" flies to the project, and "Details" opens that item in the Index.
  - The full service detail, its points, its tools and its code snippet are DOM monospace in the Index and the 2D site.

**Shot 11 "Launch" (night #0a0908, end hold 0.7 vh), 20 / 13 words**
- **Frame:** a crane onto the launch islet. A low hero angle on the rocket, the moon behind, a vermilion city glow.
- **Headline:**
  - "(Contact) Dhaka · UTC+6" (phones: "(Contact)");
  - "Let's build something / worth *shipping.*";
  - desktop: "Tell me what you're building. A few lines is enough to start." Phones: "A few lines is enough to start."
  - pill: "Start a brief".
- **Console screen:**
  - maremon15@gmail.com, as selectable mono text with Copy;
  - WhatsApp +880 1785 892074;
  - LinkedIn emon15;
  - GitHub maremon7415;
  - and a bottom line, "© 2026 Md. Emon Miah".
  - Facebook and the full legal line ("© {year} Md. Emon Miah. Designed & built in Dhaka.") are in the Index footer, the spine and the 2D site.
- **Pad ring:** outline numerals 04 03 02 01, labelled Understand / Design / Build / Ship & tune. Inspecting a numeral writes that step's verbatim description, for example "We start with the core problem, user journey and constraints before any technology is chosen."
- **Brief flow:**
  1. "Start a brief" moves the camera onto the console.
  2. The DOM 3-step brief grows out of the console screen: "What do you need?", "Tell me about it" and "Who am I talking to?". It has a honeypot field.
  3. The form posts to `/api/contact`.
  4. **On 2xx:** a DOM message plus an aria-live announcement, then the countdown fills and the rocket lifts off.
  5. **On 422:** the field errors appear inline.
  6. **On 429:** "Too many messages. Try again in 10 minutes.", with the mailto shown as well.
  7. **On any other status** (503, 404/405 on static hosts and `vite preview`, 5xx) **or a network error:** the pre-filled mailto plus "Copy brief".
- **After launch:** "Fly the island yourself" opens Play Mode.

### Where every piece of portfolio3 content lives

| Content | In 3D | DOM (Index · spine · 2D) |
|---|---|---|
| Name, role, city, availability | Shot 1 headline · HUD | Preloader row · HUD · Index top · spine h1 |
| Hero pitch ("I turn ideas into fast, secure products…") | — (too long for a headline) | Index top · spine · 2D · meta description |
| Short bio | Portrait caption (first sentence) | Index About · spine · 2D |
| 3-paragraph story | — | Index About → Story · spine · 2D |
| Principles (3), interests (3), "Right now" (3) | Workshop objects and posters | Index About · 2D |
| 8 projects | 4 buildings, 3 props, 1 pin · screens · LED bands | Case-study sheets · Index Work · 2D |
| Case-study body (problem/solution/outcome, architecture, highlights) | Inspect gallery captions | Case-study sheet (synthesised parts wait for your approval, question 9) |
| Experience: 3 roles with all bullets and stacks, 2 degrees, languages | Bridge plaques; back faces show the top 2 bullets | Index Experience · 2D |
| 44 tools with usage | Circuit tree nodes and tags | Index Stack · 2D |
| 8 services: summary, detail, points, tools, code snippet | Board rows and detail strip (summary) | Index Services (expandable items, snippet in mono) · 2D |
| 2 engagement formats with their points | Board page 1 and its detail strip | Index Services · 2D |
| 4 engineering standards | Board page 4 | Index Services → Standards · 2D |
| Process: 4 steps with descriptions | Pad ring numerals and captions | Index Services → Process · 2D |
| GitHub stats and the 9 featured repos | "27 public repos" plaque and `ls ~/repos` on the monitor | Index Open source (links) · 2D |
| 6 notes | Bookshelf spines | Index Notes · link out, or Note sheet (question 6) |
| 6 FAQs | — | Index Quick answers · 2D |
| Contact channels | Launch console | Index top · Brief · 2D |
| Footer legal line | Console bottom line (short form) | Index footer · spine · 2D |
| 404 copy ("Lost in space.") | — | Unknown deep links and `public/404.html` |
| Testimonials (all 5 are placeholders), counters (100+ / 8+ / 99%) | Hidden | Hidden until confirmed (question 4) |

**Scroll length:** about 12.5 vh in total (today 18.9), which is about 10,500 px instead of about 16,100 at 900 p. About 58% of it is holds (today 28%).

---

## 3. What replaces every overlay surface

| Today | New |
|---|---|
| Hero block (`.hero-card`, Journey.tsx) | Shot 1 headline group in 3D type: kicker, mega name, rotating-word slot, one 3D pill, curved scroll badge. The DOM h1 lives only in the hidden screen-reader spine. |
| **Card 1:** left glass content card (`.card`: ProjectCard, SkillsCard, AboutCard, FinaleCard) and the mobile bottom sheet | One headline group per shot in the frame's empty sky or wall, tied to its subject by an anchor dot and a leader line. Details sit on world carriers: screens, LED bands, tags, plaques, the board, the console. |
| **Card 2:** About tooltip (`.about-tip` Html), About list, hint bulbs | Numbered pins on real objects. Inspect dollies the camera to the object and writes a caption of 16 words or fewer beside it. Hidden spine buttons mirror keyboard focus onto the pins. |
| Billboard on posts and the fake drawDemo browser screens | Facade screens flush in the wall, showing real portfolio3 screenshots through a rounded-corner shader (boot, de-zoom, crossfade, recede). |
| Project modal (ProjectModal.tsx) | **DOM, on request.** Inspect frames the screen, then a case-study sheet grows from the screen's rectangle. Solid surface, hairlines, no glass. Deep link `#/work/<slug>`. |
| Skill DOM pills and meter list | Depth-tested SDF tags of 12 px or more on nodes sized by real usage. They flip to "Shipped in N projects". Group names curve around the rim. |
| Nav chapter pill | Removed. Each chapter is named once, in the shot's eyebrow. The Index has a Chapters group. |
| Progress rail | A 2 px accent progress line on the top edge, with 6 focusable chapter ticks. |
| Nav "◆ Emon", "....", 2D, "Play 🎮" | **DOM HUD frame**, a bare frame with no background and no blur: `[ > _` logo + "Emon Miah · Full-stack engineer" · "Open to work" chip · Index ⌘K · Contact · Pause motion · labelled speaker · 2D · Play · live Dhaka clock with a green dot. On phones: logo, name, chip, Menu and Contact; the rest is inside Menu. |
| Contact terminal modal (ContactTerminal.tsx) | Launch console → **DOM brief, on request**, using portfolio3 copy → the rocket launch confirms the send. mailto fallback. |
| Play Mode HUD (PlayHud.tsx, glass, 7 emoji) | Restyled onto portfolio3 tokens: solid `--surface` (bg-2 at 0.92 alpha), hairline, no blur. The emoji become inline SVG icons. |
| Toasts | **DOM:** portfolio3's solid toast pill, for confirmations only, plus aria-live. |
| Inline loader | **DOM:** portfolio3's bilingual preloader, driven by real progress, lifting automatically into the takeoff. |
| — | **DOM, on request:** the Index (⌘K), the caption bar (off by default) and the focus chip (keyboard focus only). The accent curtain is used only for far jumps. |
| About 600 lines of glass, sticky and sheet CSS | Deleted. `--glass*` is replaced by portfolio3's `--surface` and `--hairline` tokens, so the shared `.icon-btn`, `.pill-btn`, `.stat`, `.ring-timer`, `.prompt` and `.help-card` keep a background. |

---

## 4. Camera and text choreography

**Timeline as data**
- **Shot records:** `src/journey/shots.ts` holds 11 records. Each one has:
  - an id plus its old alias;
  - the chapter, hold length in vh, day phase and ink;
  - a subject sphere, wide and tall end poses, drift, and arrival via-points;
  - the copy variants, carriers and inspect targets.
- **Timeline:** `src/journey/timeline.ts` turns the records into scroll ranges in svh. It fills the existing `journey.stops`, `journey.chapters` and `version` Maps, so building rise, the skills and about scenes, the Play preload, audio and the easter eggs keep working.
- **Stable progress:**
  - The spine's sections are sized in CSS `svh`.
  - `svhPx` is read from a hidden `height:100svh` probe on resize only.
  - Scroll position in timeline units is `u = scrollY / svhPx`, in vh.
  - When the iOS or Android address bar hides, the viewport grows from svh to lvh and the maximum reachable scroll shrinks by up to about 0.15 vh. The final hold therefore runs 0.25 vh past its centre, so the end pose is always reachable.
  - Legacy 0..1 progress is `u / u_finalCentre`, clamped.
  - Font loading and the address bar can no longer move a stop.
  - The journey no longer uses ScrollTrigger, so `ignoreMobileResize` plays no part. It stays only if FlatSite keeps its ScrollTrigger reveals.
- **Hard-coded constants:** `stop.start - 0.06` in ProjectsDistrict, `progress < 0.02` in JourneyCamera and `progress*30` in Landmarks become helpers based on vh or phase, because the total scroll shrinks by about 35%.

**Path and speed**
- **One spline:** a single centripetal Catmull-Rom spline. Orbit hops and crane moves are via-points on it, not separate segment types.
  - Position is sampled by arc length.
  - The look target is evaluated at the same parameter, so the two never drift apart.
- **Travel length** comes from perceived motion: distance relative to the target plus the change in view angle, clamped to 0.35–1.2 vh. The intro flyover is about 1.0 vh.
- **Speed profile:** a C1 trapezoid.
  - Smoothstep acceleration over the first and last 22% of each move, with a closed-form cruise speed.
  - Start and end speeds equal the neighbouring holds' drift.
  - Peak/mean is about 1.28 (today about 3). There are no dead zones and no kink at hold edges.
- **CI gates** (`scripts/qa/camprofile.mjs`):
  - peak/mean ≤ 1.35;
  - near-zero zone ≤ 6% at each end of a move;
  - velocity jump at a hold edge ≤ 5%;
  - peak spread between moves ≤ 1.5×.
- **One smoothing stage:**
  - Lenis lerp 0.1, plus a maath `damp3` critically damped spring: about 0.22–0.25 s for position and 0.26–0.30 s for the look target.
  - Pointer parallax is applied after the spring, during holds only. On shots that carry text it is limited to ±0.35 / ±0.2 units.
- **Snap (`lenis/snap`):**
  - Proximity mode at hold centres: threshold 25–30%, 0.7 s, ease-out quart, `debounce: 150` (the default is 500 ms).
  - Targets are zero-height hold-centre markers in the spine, registered with `snap.addElement(marker, { align: 'center' })`. Lenis re-measures them through its own ResizeObserver, so resize and rotation are handled. If that proves unreliable on iOS, P1 falls back to the removers returned by `add(px)` and rebuilds them on resize and orientation change, debounced by 150 ms.
  - Snap is off during inspect, sheets, the Index, Play Mode and reduced motion, and it can be turned off on touch if playtests find it grabby.
- **Cinematic layer:**
  - Rack focus: TiltShift blur 0.09 in flight and 0 at holds, set through a ref. The effect stays mounted.
  - FOV breathes by +3° at peak speed.
  - Bank is at most 2.5°, and only on the two long swoops.

**Framing (replaces the lens shift)**
- **Delete:** `setViewOffset` and the portrait pull-back in `JourneyCamera.tsx` L42–52, and `clearViewOffset` in PlayMode L137.
- **Framing solver:** `framing.ts` fits each subject sphere into its zone, using `min(vfov, hfov)` for distance.
  - An aim offset puts the subject at its screen point.
  - An optional horizon pitch makes the text zone fall on sky or plain wall.
  - The text zone and the subject zone never overlap.
- **Inputs:** the aspect, the CSS viewport height and the safe-area insets (section 6).
- **Aspect blending:** poses are solved at wide and tall reference aspects and blended continuously with `smoothstep(0.75, 1.15, aspect)`. Resizing or rotating never jumps, and the 820×1180 and 1366×657 bugs disappear.
- **Height tiers:** applied on top of the aspect blend (section 6).
- **Overlap guard** (unit test, pure math):
  - It sweeps aspect 0.5–2.4 in steps of 0.05, at CSS heights 320 / 450 / 700 / 1000.
  - For every shot it checks 7 pose samples: hold start (drift `pos`), centre, hold end (`pos2`), and the 4 parallax corners.
  - Wherever the projected text bounds intersect the projected subject sphere, the test fails.
- **Sightlines:** `layout.ts` computes sightline exclusions from every solved pose at module load. The lamp posts stop blocking the Stack and About shots, and the town never depends on the live aspect (Play Mode notes in section 7).

**Two text tiers**
- **Headline group (one per shot):**
  - It renders in drei `<Hud renderPriority={2}>` after the post stack, with `toneMapped={false}`, so portfolio3's hexes come out exact.
  - It uses the main camera. Its anchor sits on a camera-facing plane through the subject's centre, so the hold drift and the parallax move text and subject together.
  - The relative slide that remains must stay under 12 px at 1440, measured at the 7 pose samples.
  - Everything in it is SDF: troika text, SDF pills, SDF ribbon leader lines and a disc anchor dot. The Hud pass has no antialiasing (the Canvas uses `antialias:false`), so it holds no geometry.
  - The rotating word is a slot of 4 laid-out troika Texts behind a `clipRect` window, sliding vertically with the masked rise. Since there is no prism geometry, nothing in the Hud aliases.
  - The whole Hud group gets `visible=false` outside journey mode, so Play Mode never shows headlines.
- **World text (everything else):**
  - troika in the main scene, so it is lit, fogged and hidden behind geometry.
  - Colours are pre-compensated for ACES (accent linear 1.142 / .036 / .020).
  - Body luminance stays at or below 0.75, under the existing 0.82 bloom threshold, so the bloom is not re-tuned globally.
  - Fog is off on the active shot's carriers.
- **Legibility, in this order:**
  1. The composition puts text on sky or wall.
  2. One ink per chapter: cream at dawn, dusk and night, #12100d on the cream day. It is fixed at reveal and never changes while being read.
  3. A troika outline halo in the opposite ink.
  4. Only where the contrast gate still fails: a faint feathered pocket (alpha ≤ 0.25, no visible edge, desktop only).
  5. Dense numbers live on carriers that are dark by construction: LED bands, screens, the board.
  - Solid plates appear only under `prefers-contrast: more`.
- **Contrast gate:** it samples the pixels behind each text block at the same 7 pose samples and at every test viewport.

**Reveal grammar (settle-gated, `src/journey/phase.ts`)**
- **States:** idle → arming (inside the hold) → revealing → shown → exiting.
- **Speed measure:**
  - `phase.ts` computes its own raw speed every frame, `v = |Δ lenis.animatedScroll| / dt / svhPx` in vh/s, with dt clamped to 1/240–1/20 s.
  - It does not use `lenis.velocity`, which is px per frame and so depends on the frame rate, or `live.velocity`, which is clamped to 0..1.
- **Settle:**
  - Settle means: inside the hold, `v < 0.03 vh/s` (about 27 px/s at 900 p), and spring residual < 0.12 units, held for 120 ms.
  - A fast scroll-through never reveals anything, so there are no ghosts.
- **Reduced motion:** there is no Lenis. Settle fires on the native `scrollend` event, or after 150 ms without a scroll event where `scrollend` is missing.
- **Exit:** leaving the hold range, or `v > 1.5 vh/s`.
- **Beats** on the house ease `cubic-bezier(0.22,1,0.36,1)`:
  - **85% of the arrival (or of a snap):** the anchor dot pulses and the screen warms up.
  - **0 ms (settled):** the leader line draws over 450 ms.
  - **120 ms:** the eyebrow types on. A shader reveals glyphs by index while a cursor-block mesh sweeps across. There is no text re-layout.
  - **200 ms:** the title rises glyph by glyph from a 112% mask (28 ms per character, 1.1 s). This is a GPU shader on `aTroikaGlyphBounds`, already verified.
  - **420 ms:** the line rises word by word (38 ms per word).
  - **560 ms:** the LED odometers roll to their values.
  - **700 ms:** the pill springs in.
  - **0–4.4 s:** the screen de-zooms from 1.25 to 1, then crossfades every 2.2 s and stops after 2 cycles.
  - The title is readable at about 0.6 s and the group is complete at about 1.4 s.
- **Latency budget, from when the wheel or finger stops to a readable title:**
  - stopped inside a hold: about 0.12 + 0.6 = 0.75 s;
  - snap needed: 0.15 debounce + 0.7 snap + 0.12 settle + 0.6 reveal ≈ 1.6 s. The dot and line arm at 85% of the snap, so the response is felt earlier.
  - CI gate: ≤ 1.7 s, measured from app performance marks.
- **Exit beats:**
  - The beats reverse over 0.35–0.45 s, power2.in, rising.
  - The line retracts to the dot, then the group is set to `visible=false`.
  - Screens recede (scale .93, brightness .5).
- **Scrubbed instead of triggered:** the About words, the stack traces and the bridge rope light.
- **Mid-flight:** zero words. The B-roll does the work: EMON. chase lights, buildings rising, paper-plane drones, the waveform ring, sun raking the plaza, lanterns waking, stars and floodlights.

**Inspect, jumps, deep links**
- **Inspect:**
  - Triggered by click, tap or Enter on a screen, object, node, plaque, board row, pad numeral or the console.
  - The camera blends into a pose fitted to the object's bounds: 1.2 s expo.inOut in, 1.0 s power3.inOut out. Lenis and snap pause.
  - Each inspect adds one history entry. Back, Esc or a scroll of more than 120 px exits.
  - Inside inspect: a short in-world gallery with captions, ◀ ▶ meshes or swipe, and a "Case study" pill.
- **DOM handoff:**
  - Once the inspect blend passes 0.7, the sheet starts clipped to the screen's projected rectangle and expands with expo.inOut.
  - While a sheet is open the canvas renders on demand.
  - Framing re-solves are frozen while a sheet is open, so a phone keyboard opening in the Brief cannot reframe the scene. One re-solve runs when the sheet closes.
  - Focus is trapped inside the sheet and restored afterwards.
- **Jumps:**
  - Within a chapter: a scroll lasting `clamp(0.6 + 0.35·Δvh, 0.8, 1.8)` s on ease 0.65,0,0.2,1.
  - Further: portfolio3's accent-and-background curtain names the destination, the camera cuts underneath, and the scene reveals in 0.85 s.
- **Deep links:**
  - Routes: `#/work/<slug>` (opens the case study), `#/stack`, `#/about`, `#/experience`, `#/services`, `#/contact`, plus `#/notes/<slug>` if question 6 says "replace".
  - They skip the takeoff and cut straight to the shot. `pushState` means Back closes the sheet.
  - An unknown slug lands on the Work slate with a toast quoting portfolio3's copy: "Lost in space. bash: no such route."
  - Unknown paths get a static `public/404.html` with the same copy and a link home.

---

## 5. Brand carry-over from portfolio3

**Colour**
- **Tokens:**
  - Dark: bg #0a0908 / #11100e / #191714, text #f2eee6 / #bfb9ac / #877f72.
  - Accent #ff4a2e, accent-2 #ff8a4c, ok #2ee59d.
  - Cream theme: #efebe3, with ink #12100d and accent #e8381b.
  - 1 px hairlines; radii 22 / 32 / 999 px.
  - New `--surface` (bg-2 at 0.92 alpha) and `--hairline` replace `--glass*`.
- **`src/brand.ts`** holds the sRGB values plus pre-compensated linear values for world text.
- **`dayNight.ts` re-keyed (question 1):**
  - Dawn becomes a warm-dark sky with a vermilion rising sun. This fixes the hero contrast and ships in P1, using the default answer.
  - Then a cream day, golden hour and sunset (P4).
  - Night becomes #0a0908 with a vermilion city glow (P4).
  - Cyan becomes vermilion. The low-poly models stay.
- **Grain:** a postprocessing Noise effect at about .07, high tier only.

**Type and fonts**
- **Roles:**
  - Funnel Display 600 for display: mega size, line height .84, tracking −0.058em, an accent word and a closing period.
  - Inter 400/500 for body.
  - JetBrains Mono, uppercase with +0.1em tracking, for eyebrows, with "(Label)" in accent brackets.
- **3D font conversion:**
  - troika cannot read WOFF2, and with a variable font it renders the default instance, which for Funnel is Light 300.
  - So static TTFs are baked with `fonttools varLib.instancer` (wght=600 and so on), saved with `flavor=None`, and subset to Latin plus the punctuation in use with `pyftsubset`.
  - The bake step is `scripts/fonts/bake.py`. It is a dev-time Python script, and its outputs are committed, so CI needs no Python.
  - It also writes `src/text/coverage.json`, the real cmap of every baked font.
  - These files already exist in `scratchpad/fontreal`: Funnel 600 is 13.8 KB gz, Inter 400 31.4 KB gz (about 16 KB once subset), JetBrains Mono 400 27.7 KB gz.
  - A build check asserts that each file starts with `00 01 00 00`. The earlier `fontprobe` files are WOFF2 inside, and troika rejects them.
- **3D components are built on troika directly, not on drei `<Text>`.** drei 10.7.9's `Text.d.ts` does not declare `curveRadius`, `colorRanges`, `textIndent`, `unicodeFontsURL` or `gpuAccelerateSDF`. They work at runtime, but they fail this repo's strict `tsc -b`.
  - `src/text/TroikaText.tsx` registers troika's `Text` with R3F `extend` and adds a `ThreeElements` augmentation.
  - troika ships its own `dist/types`, but its setters are typed `any`, so the wrapper declares a strict prop interface of its own.
  - WorldText, HeadlineGroup and the CurvedText kit all use this wrapper.
- **Loading:** `preloadFont` runs during the preloader with one global charset. There is no per-instance `characters` prop.
- **DOM fonts:**
  - The DOM keeps portfolio3's WOFF2 variable fonts (OFL).
  - The `@fontsource` Bricolage, Inter and JetBrains Mono packages are removed.
  - The preloader's Funnel Display WOFF2 (17 KB) is `<link rel=preload>`ed.
- **Bengali never goes into troika** (verified: হ্যালো breaks). It is drawn only in the DOM or on a CanvasTexture: the preloader, the globe tag and the Bismillah sign.
  - The subset is made with `pyftsubset NotoSansBengali.ttf --text-file=bn-strings.txt --layout-features='*' --flavor=woff2`. `bn-strings.txt` holds every Bengali string used, so GSUB and GPOS survive and conjuncts and reph (্য, স্ব, ল্লা) shape correctly.
  - A P1 test compares a Chromium screenshot of হ্যালো and স্বাগতম in the subset against the full font, pixel for pixel.
  - The subset (estimated 10–15 KB) is inlined as base64 in `index.html`'s critical style, so the ~300 ms preloader paint does not wait on the network.
  - The greetings start after `document.fonts.load('600 1em "Noto Sans Bengali"', 'হ্যালো স্বাগতম')` resolves, capped at 400 ms. If it times out, the Bengali greetings are skipped.
  - Canvas draws await `FontFace.load()` and redraw once on `loadingdone`.
- **Glyph coverage, not a blocklist:**
  - `check-strings.mjs` checks every codepoint of every 3D string against `coverage.json` for the font that string renders in.
  - The baked fonts lack ◀ ▶ ← → ↗ ≤ ✓ ✕ ⌘ (verified with fontTools). So those are drawn as meshes or written in ASCII, for example "< 450 ms", and ⌘K appears only in the DOM.
  - Zero emoji site-wide.
- **No CDN fallback fonts:**
  - troika 0.52.5's bundled unicode-font-resolver fetches from cdn.jsdelivr.net for any codepoint the fonts lack. When a custom `unicodeFontsURL` fails, it retries that default CDN (verified in `troika-three-text.esm.js`), so a dead URL alone does not stop the request.
  - The real guards are:
    1. the coverage check above, which makes fallback unreachable;
    2. a CSP `connect-src 'self'` in `vercel.json`, which blob workers inherit;
    3. a Playwright check that fails on any off-origin request.

**Signature moves, translated**

- **Masked rise-in** (112%, 28 ms per character / 38 ms per word, 1.1–1.4 s): becomes the GPU glyph reveal.
- **Rotating-word slot:** a clipRect slot of laid-out SDF words inside the Hud.
- **Scrub text** (.16 → 1): the About lead.
- **Bilingual preloader** with a 000% counter and a curved lift: flows straight into a shorter takeoff.
- **Accent curtain:** used only for far jumps, the 2D switch and entering Play Mode.
- **Terminal identity:**
  - the `[ > _` logo, extruded from its SVG paths for the voxel sign and the console;
  - the `emon@dhaka: ~` shell on the workshop monitor and the launch console;
  - ⌘K, which opens the Index.
- **Live Dhaka clock** with a green ping: in the HUD, as DOM.
- **Laser line:** becomes the accent circuit traces and the bridge rope light.
- **Velocity marquee and circular badge:** become the stack marquee ring and the SCROLL TO FLY ring.
- **Labelled cursor and magnetic CTA:** a DOM cursor driven by R3F hover (fine pointers only), plus an accent edge-light on interactive meshes.
- **Voice:** confident and engineering-literal, with short accent payoff lines and no emoji.

---

## 6. Mobile, accessibility, performance

**Layout tiers and test viewports**
- **Aspect** chooses the poses: wide (≥ 1.15), blended (0.75–1.15) or tall (≤ 0.75).
- **CSS height** (after safe areas) chooses the type and copy tier:
  - **Regular (≥ 600 px):** body 15 px, labels at least 12 px, titles 28–32 px on phones, mega about 64 px. Desktop scales up from there.
  - **Compact (380–599 px).** Covers short laptops and 1440×900 at 200% zoom (720×450 CSS px).
    - Sizes: titles 22–26 px, mega 44 px, body 14 px, labels still 12 px or more.
    - Copy and carriers: the `copy.tall` variant, 2 metrics, half the tags.
    - HUD: the compact HUD.
  - **Tiny (< 380 px).** Covers landscape phones, for example 844×390 with about 320–360 px usable.
    - Text: `copy.tiny` (eyebrow and title only), mega 36 px, 1 metric, 6 tags.
    - Layout: the CTA at the right edge, mid-height, within thumb reach. The subject gets at least 50% of the frame.
- **Type sizes** are set in CSS px through `worldPerPx = 2·d·tan(fov/2)/viewportH`, so they follow browser zoom.
- **Test viewports (10):**
  - phones: 390×844, 844×390;
  - tablets and the blend zone: 820×1180, 1024×1024, 1180×820;
  - laptops and desktops: 1366×657, 720×450 (200% zoom), 1440×900, 1920×1080, 2560×1080.
  - The overlap unit test (section 4) also covers the full aspect and height sweep.

**Safe areas**
- `index.html` uses `viewport-fit=cover`, so the canvas sits under the notch, the Dynamic Island and the landscape side insets.
- `:root` defines `--sai-t/r/b/l: env(safe-area-inset-*, 0px)`.
- A hidden fixed probe padded with those variables is read with `getComputedStyle` on resize, `orientationchange` and `visualViewport` resize, never per frame.
- The insets go into `framing.ts`:
  - the headline top band starts at `max(60px, inset-top + 44px)`;
  - landscape side insets narrow the text zone;
  - the thumb-zone CTA sits at `inset-bottom + 16px`.
- The HUD uses `env()` directly in its CSS.
- Tests emulate a notch by overriding the `--sai-*` variables.

**Mobile (390×844 and portrait tablets)**
- **Framing:**
  - Tall poses blend continuously.
  - The subject sits in the lower ~55% of the frame, and the headline in the top band with 16 px gutters.
  - The one CTA sits in the thumb zone above the safe area.
- **Copy:** at most 18 counted words per headline group (phone variants for Shots 2, 9 and 11), 2 metrics per project, 4 board rows per page.
- **Input:**
  - No bottom sheet, no nested scroll, no pinch or orbit.
  - Taps only. Nothing depends on hover.
  - Invisible hit meshes of at least 44–48 CSS px.
  - The existing drag guard (`e.delta > 8`) stays. Swiping in inspect changes the screenshot or the object.
- **Compact HUD:** logo, name, "Open to work" chip, Menu and Contact, with 44 px hit areas and the 2 px progress line. Sound, Pause motion, 2D and Play are inside Menu. No bottom bar.
- **Sheets** open full screen and use native DOM inputs, so the keyboard, Bangla IME and autofill all work.

**Accessibility**
- **Spine:** `Journey.tsx` becomes `Spine.tsx`.
  - It is generated from `content.ts` and visually hidden with a clip, never `display:none` or `aria-hidden`.
  - It holds more than the 3D shows: the h1 name, h2 chapters, h3 projects, metrics as `dl`, real links and buttons, and the full legal line.
  - Its section heights come from the timeline. The canvas stays `aria-hidden`.
- **Focus mirroring:**
  - Every 3D control has a twin in the spine.
  - Focusing the twin scrolls to the shot, draws a 3D accent focus ring, and shows a solid DOM focus chip with the label.
  - Enter and Space act like a click.
- **Announcements:** one polite aria-live caption on settle, debounced 400 ms and gated on speed, for example "Work, 1 of 4: San Uni Academy. Case study available."
- **Keyboard:**
  - Tab follows the story. The native scroll keys are untouched.
  - ⌘K / Ctrl+K or the visible "Index" button opens the Index.
  - The single-key shortcuts J, K, / and P (pause) can be switched off, and they are ignored inside inputs.
  - Esc closes. ← → work only inside inspect.
- **Index** (DOM, on request; question 7):
  - portfolio3's palette style: solid bg-2, radius 22, hairline. A full-screen sheet on phones.
  - Searchable and focus-trapped. Items expand in place.
  - Top: name, role, Dhaka, availability, the hero pitch, email, LinkedIn, GitHub.
  - Groups:
    - Work: all 8 projects, each with Fly there / Case study.
    - Chapters.
    - Experience: roles with all bullets and stacks, education, languages.
    - About: story, principles, interests, right now.
    - Stack: 44 tools with usage.
    - Services: 8 services with summary, detail, points, tools and code snippet; 2 formats; 4 standards; the process.
    - Open source: 9 repos.
    - Notes: 6.
    - Quick answers: 6 FAQs.
  - Actions: copy email, brief, WhatsApp, 2D, Play, sound, Pause motion, text size, caption bar, shortcuts on/off.
  - Footer: the legal line and Facebook.
- **Reading aids:**
  - **Caption bar:** a solid strip mirroring the active shot's text, toggled from the Index.
  - **Text size:** 1× / 1.25× / 1.5×. It re-lays the text behind a 250 ms fade, which is the only runtime re-layout.
    - At 1.5× on a phone that is already in the tall layout, the fallback runs in this order:
      1. switch to the compact copy and type tier;
      2. drop the line;
      3. if the title still overflows, keep eyebrow and title in 3D and switch the caption bar on automatically. The caption bar uses the native text size.
    - Tested at 390×844 at 1.5×.
- **`prefers-contrast: more`:** solid plates behind text, a solid HUD, underlined accent words, the caption bar on, and no blur or fog on text.
- **Moving content (WCAG 2.2.2):**
  - **Pause motion** is a global toggle: a HUD button with `aria-pressed`, an Index action, and the P shortcut. It is on by default under reduced motion, and the choice is remembered in localStorage (wrapped in try/catch).
  - It freezes screen crossfades, the word slot, the marquee, board paging, drones, the waveform, chase lights, cloud and water shader time, and the hold drift and parallax.
  - Scroll-driven camera motion continues, because the user drives it.
  - Independently, every piece of motion that carries information stops on its own within 5 s:
    - crossfades 4.4 s;
    - word slot: 3 swaps at 1.4 s, ending on the first word;
    - marquee 4.5 s;
    - board: one auto-flip.
- **Reduced motion:**
  - No preloader animation, takeoff or curtain.
  - Cuts between shots with a 180 ms sky-colour fade.
  - Opacity-only text, no autoplay of any kind, odometers at their final values.
  - Lenis off and CSS scroll-snap on the hold markers. Settle comes from `scrollend` or a 150 ms debounce.
- **Confirmations** always appear as a visible DOM toast plus aria-live.
- **10-second rule, as two gates:**
  - **Gate A (DOM, in CI):** with no scroll and no click, name, role, Dhaka, availability and a Contact link are readable within 2.5 s of navigation.
    - Profile: the Lighthouse mobile throttle (1.6 Mbps down, 750 kbps up, 150 ms RTT).
    - The inline preloader row delivers this without the JS bundle, and the HUD carries the same line after the lift.
  - **Gate B (3D):** the Shot 1 title, and on desktop the 4 rooftop project names, are readable within 10 s of navigation.
    - Profile: 10 Mbps, 40 ms RTT.
    - Schedule: load (about 1.3 s for the 1.6 MB pre-frame budget plus round trips) + 0.4–1.2 s preloader minimum + about 2.5 s from lift to readable title ≈ 4.5–5 s.
    - CI checks the bytes before the first frame and the scheduled timeline using app marks. SwiftShader wall-clock time is not meaningful, so the real check happens on devices in P5.
  - Any case study is at most 2 interactions away.
- **2D FlatSite:**
  - Rebuilt on portfolio3 tokens with all the content.
  - Switches on automatically on WebGL failure or context loss, with `?mode=2d`, or with Save-Data.
  - Offered after a sustained frame rate under 30 fps.
  - It is the skip-link target, and the preloader has a "Skip to the 2D version" link.
- **SEO:** JSON-LD Person, all copy in the DOM, and the existing `<noscript>` (built by `vite.config.ts`) updated with the full new content. The canonical URL, og:url and JSON-LD `url`/`sameAs` follow question 6.

**Performance budget**
- **Baseline** (measured in SwiftShader, so draw counts are valid but fps is not):
  - 1440 on the high tier: 89–163 draw calls, 62–72k triangles.
  - 390 on the low tier: 42–98 draw calls, 29–38k triangles.
- **Desktop (high tier):**
  - 60 fps on a mid-range iGPU (Iris Xe / M1) at DPR ≤ 1.75.
  - At most baseline + 30 draw calls at any hold, and never more than 190 calls. At most 85k triangles.
  - At most 40 visible text blocks.
  - About 45–52 MB of screenshot textures at 1024 px.
- **Phone (low tier):**
  - At least 45 fps on iPhone 12 / Snapdragon 7-class hardware at DPR ≤ 1.25.
  - At most 120 draw calls, 45k triangles and 20 text blocks.
  - 768 px screenshots, keeping only the active project ±1 in memory (about 12–19 MB).
  - At most 2 live CanvasTextures, redrawn at 15 fps or less and only while visible.
  - No shadows, TiltShift or grain.
- **Carrier budgets (calls / visible text blocks):**
  - **Headline group:** eyebrow, title (accent word through colorRanges in the same Text), line, pill text + pill mesh, dot + leader as one mesh → ≤ 6 calls / 4 blocks. The word slot adds 2 blocks during a swap.
  - **LED band:**
    - Digits: one InstancedMesh odometer per band, sampling a 0–9 strip atlas drawn once from JetBrains Mono after `FontFace.load`. The roll is a per-instance uv offset.
    - Labels: units and labels such as "+", "ms" and "monthly users" are one troika Text per metric.
    - Totals: ≤ 4 calls / 3 blocks per building.
    - In the work slate the bands are dark and their labels hidden.
  - **Split-flap board:**
    - Tiles: tile backs are one InstancedMesh.
    - Rows: each row is one troika Text with a per-glyph flip shader (`aTroikaGlyphBounds` plus glyph index, rotating each glyph about its midline). All 4 pages are laid out at preload.
    - Flips: during a flip the outgoing and incoming row Texts are both visible.
    - Totals: ≤ 11 calls / ≤ 11 blocks (header, 4 rows ×2, detail strip). The board is hidden outside Shots 10–11.
  - **Pad ring and console:** the pad ring is one curved Text for the numerals and one for the labels, and the console is one multi-line Text plus a pill → 5 calls in total.
  - **Finale:** 163 calls today + headline 6 + board 11 + ring and console 5 = 185. Before the board is added, P4 merges the launch-islet's static props (target −20). The CI budget gate runs at every hold.
  - **Worst text-block counts:**
    - Stack: 3 + 16 tags + 5 rim names + 2 marquee rows = 26 on desktop. Phones: 3 + 8 + 5 + 2 = 18.
    - Work slate: 3 + 8 pins + 4 rooftop signs = 15.
- **Quality model, with nothing remounted at runtime:**
  - **At Canvas creation:** the tier (high/low) is chosen once by `quality.ts`. It fixes MSAA (`multisampling` 4 / 0), which effects are mounted (TiltShift2 and Noise on high only, mounted whatever the mode) and whether shadows start on.
  - **The `degrade` ladder:** a new store field from 0 to 5. `PerformanceMonitor.onDecline` (`Experience.tsx` L105) raises it by one step instead of calling `setQuality('low')`, and it never steps back. Steps 1–4 change settings in place:
    1. Noise opacity 0;
    2. TiltShift blur 0 and blendFunction SKIP;
    3. DPR 1.75 → 1.25 (high) or 1.25 → 1.0 (low);
    4. the texture set drops 1024 → 768, streamed during the next flight move;
    5. shadows off. This is the only step that recompiles materials, so it runs at most once, during a flight move, never during a hold or reveal.
  - **Play Mode:** sets the TiltShift blur to 0 instead of unmounting it as today.
- **Network:**
  - About +46 KB gz of client JS (troika 41.5, maath 1.1, lenis/snap 2, CustomEase). `resend` runs only in the serverless function.
  - About 55–70 KB gz of 3D fonts, plus about 12 KB of inlined Bengali.
  - About 1 MB of WebP textures, streamed per chapter when idle.
  - At most 1.6 MB before the first frame.
  - The preloader paints in under 300 ms. It is inline HTML, CSS and fonts.
- **No-jank rules:**
  - No DOM reads in the frame loop, and no React state changes per frame. Reveals are uniforms.
  - `html[data-shot]` and `html[data-phase]` change only on phase changes.
  - No `backdrop-filter` anywhere, including the restyled PlayHud.
  - Every troika layout and every text state is laid out in the worker during the preloader: word-slot words, board pages, tag back faces, captions, "Copied". The only exception is a text-size change.
  - Every text group is mounted at opacity 0 at SceneReady, compiled with `gl.compileAsync` on the main scene and the separate Hud scene, then toggled by visibility. Nothing is lazy-mounted.
  - Each chapter's text sits in its own Suspense.
  - Post effects are never mounted or unmounted at runtime (see the quality model).
  - `frameloop='demand'` while a sheet or the Index is open.
- **What pays for the new text:** the blur goes, the 21 drei Html elements that write styles every frame go, the ScrollTrigger reveal handlers and DOM re-measuring go, and so do the 24 fps drawDemo canvas uploads on 4 buildings.
- **Real-device gate (P5):**
  - **Who runs it:** SwiftShader cannot measure fps, so Emon runs the gate on his own laptop and phone(s) (question 10).
  - **How:** he opens the preview with `?perf=1&tour=1`. The page flies all 11 shots in about 70 s and then shows a result panel to screenshot and send back: median fps, 1% low, tier, degrade step, draw calls and GPU string.
  - **Optional:** BrowserStack Live or LambdaTest real devices, an iPhone 12 and a Galaxy A54-class phone, if Emon has an account or a trial.
  - **If it fails:**
    1. Lower that GPU class's starting tier (matched on the `WEBGL_debug_renderer_info` string).
    2. On low, cut town trees and houses by 40% and use 512 px textures.
    3. If a device is still under 45 fps, the automatic 2D offer must work on it. That becomes the ship condition for that device class.

---

## 7. Engineering plan for this codebase

**Architecture:** `content.ts` (real data) → `journey/shots.ts` → `journey/timeline.ts`. The timeline feeds:
- `systems/scroll.ts`: ranges, Lenis, snap, jumps, deep links;
- `journey/framing.ts` → `systems/cameraPath.ts` → `JourneyCamera`: damp3 and inspect;
- `ui/Spine.tsx`: section heights and snap markers;
- the Hud headline layer;
- the world carriers in each scene.

**Delivery: one branch plus preview deploys, no `?v2=1` flag**
- The work happens on a `v2` branch of `maremon7415/city-3d-portfolio`, with a draft PR to `main`.
- v1's machinery is deleted as it is replaced: `measure()`, the `[data-stop]` lookups, the lens shift and the old `content.ts` fields. That cannot coexist with v1 behind a flag without keeping both code paths, so there is no flag.
- **Previews:** every phase ends with a push. If the repo is connected to Vercel (`vercel.json` already exists), each push gets a preview URL automatically. If not, Emon connects it once: Vercel → Add New Project → import the repo (question 6).
- **Fallback:** a screen recording and a screenshot contact sheet per phase, posted here.
- `main` keeps v1 live until P5 merges.

**Added**
- **Brand and journey core:**
  - `src/brand.ts`, `src/styles/tokens.css`;
  - `src/journey/{shots,timeline,framing,phase,inspect,deeplink,safeArea}.ts`.
- **Text system:**
  - `src/text/{fonts,charset,glyphReveal,canvasText,coverage.json}`;
  - `src/text/{TroikaText,WorldText,HeadlineGroup}.tsx`;
  - `src/text/kit/{AnchorDot,LeaderLine,Pill3D,WordSlot,CurvedText,Pin,FocusRing,LedOdometer,SplitFlap,MeshArrow}.tsx`.
- **Scenes:**
  - `src/scenes/projects/{screenMaterial.ts, Secondary.tsx, props/*, buildings/arena.ts}`;
  - `src/scenes/experience/BridgeTimeline.tsx` (5 posts, plaques, lanterns, rope light);
  - `src/scenes/finale/{DeparturesBoard,LaunchConsole,CountdownRing}.tsx`;
  - `src/scenes/about/{PortraitFrame,Bookshelf,ShellMonitor}.tsx` and `objects/*`.
- **UI:**
  - `src/ui/{Frame,Index,CaseStudy,NoteSheet,Brief,Curtain,Cursor,FocusChip,CaptionBar,Spine,PerfTour}.tsx` and `src/ui/clipHandoff.ts`;
  - `src/ui/DirectorPanel.tsx` is loaded only through `import.meta.env.DEV && import()`, so it is tree-shaken from production. A build check greps `dist/` for its name.
- **Contact API:** `api/contact.ts`, a port of portfolio3's Resend route using Vercel's Web-standard `export async function POST(req: Request)`.
  - It validates input (422), checks the honeypot `hp`, rate-limits to 4 messages per 10 minutes per IP (429, best effort per instance), sends an auto-reply, and returns 503 when no key is set.
  - Env vars: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
  - A small Vite plugin, `scripts/vite-api.ts`, serves `/api/contact` from the same handler in `vite` dev and `vite preview`. So `npm run dev` and the Playwright runs on :4173 exercise the real code without `vercel dev`, with `CONTACT_MOCK=1` for tests.
- **Scripts (build):**
  - `scripts/assets.mjs`: WebP at 1024 and 768 px, plus the portrait at 768 px.
  - `scripts/check-fonts.mjs`: TTF magic bytes.
  - `scripts/check-strings.mjs`: cmap coverage, no emoji, no Bengali in troika strings, and the word caps per tier.
  - `scripts/check-links.mjs`: hides "Live" buttons whose URL is dead. It runs in CI only, because it needs the network.
  - `scripts/fonts/bake.py`: dev only; its outputs are committed.
  - `scripts/freeze-town.mjs`: run once (see Play Mode below).
- **Scripts (QA, moved from scratchpad):**
  - `scripts/qa/camprofile.mjs`, `audit.mjs`, `perfbase.mjs`, `overlap.test.ts` (pure framing math);
  - `scripts/qa/walk.mjs`: the scripted story walk;
  - `scripts/qa/budgets.mjs`.
- **Readiness hooks:**
  - `html[data-ready="1"]` is set once SceneReady fires and the preloader has lifted.
  - `html[data-shot]` and `html[data-phase]` are set for tests.
  - These replace `#ld-actions.on` and `#ld-enter`, which the auto-lift removes and which every current tool and `scripts/og-image.mjs` wait for.
- **CI:** `.github/workflows/ci.yml` runs `npm ci` → `npx playwright install chromium` → typecheck → build → `vite preview` → Playwright with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- **Assets:**
  - `public/fonts/*` (TTF, WOFF2, OFL.txt), `public/projects/{1024,768}/*.webp`, `public/developer-768.webp`;
  - `public/404.html`;
  - a new `favicon.svg` and `apple-touch-icon.png` with the `[ > _` logo.

**Changed**
- **`content.ts`:** all real portfolio3 data.
  - New project fields: slug, subtitle, metrics (each with a `source` for the arena), screens, privateLabel, highlights, architecture, problem/solution/outcome (marked `synthesised: true`), noteUrl, accent.
  - 5 stack groups with usage counts and no levels.
  - Experience with bullets, education, languages, services (summary, detail, points, tools, snippet), formats, standards, process, FAQ, notes, repos, story, pitch, legal line.
  - Copy variants per shot. Real about objects and 12 real shards.
  - 6 chapters. No emoji, no X.
- **Every importer of `content.ts` has to change** for the build to pass after the schema switch in P1:
  - `vite.config.ts`: the portfolioHtml plugin reads `profile`, `projects` (`p.tagline`, `p.tech`), `skillGroups` (`g.skills[].name`) and `aboutItems` (`a.title`, `a.text`) to build the title, meta and the existing `<noscript>`.
  - `ui/FlatSite.tsx`, `ui/PlayHud.tsx` (shards), `ui/Journey.tsx` (→ Spine), `ui/Nav.tsx` (→ Frame), `ui/ProjectModal.tsx` and `ui/ContactTerminal.tsx` (both removed).
  - Scenes: `scenes/projects/{ProjectsDistrict.tsx, demoScreen.ts}`, `scenes/skills/SkillsGarden.tsx`, `scenes/about/AboutWorkshop.tsx`, `scenes/intro/Landmarks.tsx`, `scenes/play/PlayMode.tsx`.
  - Systems: `systems/{scroll.ts, layout.ts}` and `state/store.ts`.
- **`systems/scroll.ts`:** delete `measure()`, the `[data-stop]` lookups and the `fonts.ready` refresh. Add svh progress, Lenis lerp .1, lenis/snap on spine markers, and `scrollToShot`.
- **`systems/cameraPath.ts`:** one spline from the solved poses plus via-points, with arc length and the C1 trapezoid. The `sampleCamera` signature is kept.
- **`scenes/JourneyCamera.tsx`:**
  - Remove: the lens shift and the pull-back.
  - Add: damp3, FOV breathing, bank, hold weight, the inspect blend and reduced-motion cuts.
  - The takeoff becomes 2.4 s on a first visit and 1.6 s for returning visitors.
- **`environment/Effects.tsx`:** the mount set is fixed at creation. TiltShift2 and Noise are mounted on high whatever the mode. The TiltShift blur and Noise opacity are driven by refs, and the bloom threshold is unchanged.
- **`state/store.ts` and `scenes/Experience.tsx`:**
  - Store: the `degrade` ladder; shot, inspect, focus3d, sheet, indexOpen, textScale, captions and pauseMotion state; and the `cat` → `sudo` egg migration.
  - `onDecline` raises `degrade`.
  - `Experience.tsx` also gets: per-chapter Suspense, the compile warm-up, the Hud layer and on-demand frames.
- **`systems/dayNight.ts`:** brand palettes and ink per chapter. The dawn key changes in P1 and the rest in P4.
- **`ProjectsDistrict.tsx`:** real screenshot screens, the building identities and LED bands, no billboard posts, and building rise driven by phase. `demoScreen.ts` shrinks to the idle screensaver.
- **`SkillsGarden.tsx` and `AboutWorkshop.tsx`:** rebuilt with no drei Html. The `cat` egg moves to the monitor.
- **`Landmarks.tsx`:**
  - Today `Bridge()` has only 4 posts, at t=0 and t=1 on each side of a span about 14.5 units long that sags 1.2 units.
  - **Bridge sockets:** 5 new posts on the camera side at t = .1 / .3 / .5 / .7 / .9, set on the sag curve, each carrying a plaque that faces the Shot 9 pose and a lantern.
  - Also: the EMON. period and chase lights.
- **Other scenes:**
  - `Finale.tsx`: board, console, countdown, launch on send, merged static props.
  - `Town.tsx` / `layout.ts`: frozen town data, exclusions, new plots, colliders.
  - `PlayMode.tsx`: drop `clearViewOffset`, use the real shards, hide the Hud, no emoji.
- **`ui/PlayHud.tsx` + its CSS:**
  - Restyled onto `--surface` / `--hairline`: `.icon-btn` (L180), `.pill-btn` (L203), `.stat` (L1085), `.ring-timer` (L1113), `.prompt` (L1138), `.help-card` (L1158).
  - Its emoji (🏁 🐞 🚀 🥚 ⚡ and others) become inline SVG icons.
  - `EGG_TOTAL` stays 4: duck, sudo, konami, console.
- **`systems/eggs.ts`:** the console message is rewritten in brand colours with no emoji, and so is the `island.secret()` reply.
- **App and UI:**
  - `FlatSite.tsx`: portfolio3 tokens and all the content.
  - `Toasts.tsx`: the portfolio3 pill.
  - `loader.ts` and `index.html`:
    - the inline preloader with the identity row, the inlined Bengali subset and the Funnel preload;
    - `theme-color` and the `html` background become `#0a0908` (today `#151c40`);
    - JSON-LD.
- **`global.css`:** delete `.card`, `.hero-card`, `.chapters`, `.progress-rail`, `.skill-label`, `.about-tip` and the sticky and mobile-sheet rules (about 600 of 1,555 lines). `--glass*` becomes `--surface`, as described above.
- **Config:**
  - `tsconfig.json`: `include` gains `"api"`.
  - `vercel.json`: a CSP (`connect-src 'self'`, `worker-src 'self' blob:`, a hash for the inline preloader script) and cache headers for `/fonts` and `/projects`.
  - `package.json`: `prebuild` runs `check-fonts` and `check-strings`. New `test` and `qa` scripts.
- **`scripts/og-image.mjs`:** waits for `html[data-ready]`, loads `#/` with `?hud=0`, and drops the old `.nav` and `.journey .card` selectors.
- **`README.md`:** rewritten for v2.

**Removed**
- `Journey.tsx` (becomes `Spine.tsx`), `Nav.tsx` (becomes `Frame.tsx`).
- `ProjectModal.tsx` and `Modal.tsx` (become `CaseStudy.tsx`), `ContactTerminal.tsx` (becomes `Brief.tsx`).
- `useReveal` and the journey ScrollTriggers, the `chapter===2/3` mount gates, and the fixed 2.2 s scroll-to.
- Every drei Html in the journey.

**Play Mode knock-on work**
- **Colliders:** `buildColliders()` in `layout.ts`, used by `WorldColliders` in `PlayMode.tsx`, gains:
  - the arena bowl, the terraces, the pavilion and the mast;
  - the 5 bridge posts (today the bridge has no collider);
  - the departures board, the console and the countdown ring.
- **Frozen town:**
  - `generateTown()` draws from `mulberry32(42)` inside a rejection loop, so any change to `EXCLUSIONS` reshuffles every later house and tree.
  - `scripts/freeze-town.mjs` writes today's town to `src/systems/town.data.ts` once.
  - After that, new exclusions only remove items, and new plots are added by hand.
- **Spot tests:** a unit test asserts:
  - no house, tree or new structure lies within 2.5 units of any `SHARD_SPOTS`, `BUG_SPOTS`, `SPAWN` or `RUBBER_DUCK` point;
  - every `RING_COURSE` ring has at least 3 units of clearance from every collider.
- **Eggs:** the cat egg is relocated, not lost (section 2).
- **HUD:** headlines are hidden in Play Mode, and PlayHud is restyled.

**Packages**
- **Add as direct dependencies:** `troika-three-text@^0.52.4` and `maath@^0.10.8` (both already arrive through drei), plus `resend@^6.32.0` (used only by `api/`).
- **Add as dev dependencies:** `playwright` and `@playwright/test`. `sharp` is optional, since the pre-sized assets can be committed instead.
- **Already installed:** `lenis/snap` and `gsap/CustomEase`.
- **Remove:** `@fontsource-variable/bricolage-grotesque`, `/inter` and `/jetbrains-mono`.
- **Do not add:** `@react-three/uikit` (377 KB gz), `@react-three/a11y` (unmaintained), `@theatre/r3f`, MSDF toolchains, camera-controls, or the Vercel CLI as a dependency.

**Content migration**
- **`content.ts`:** generated from `scratchpad/analysis/content.json` (extracted from portfolio3's `lib/*.ts`), then edited by hand.
- **Copy from `/home/user/portfolio3/public`:**
  - `assets/projects/*.webp`, resized. The arena uses only gkec3 and boe2. The anime avatar `image.webp` is skipped unless you approve it (question 4).
  - `assets/developer.jpg`, as a 768 px WebP.
  - `app/fonts/*.woff2` plus the OFL licence.
  - The logo's SVG paths.
  - `content/notes/*.md`, only if question 6 says "replace".
- **Leave out:** testimonials, the unconfirmed counters, the invented skill levels and the invented about objects.

---

## 8. Phases

Every phase ends with a push to `v2`, a preview URL (or a recording), and a short list of what to look at.

**Which question blocks which phase (and the default used if you don't answer)**

| Question | Blocks | Default |
|---|---|---|
| Q1 Look | P1 dawn key, P2 contrast gate, P4 brand pass | portfolio3 palette |
| Q2 Featured set | P0/P1 project slots, P3 buildings | SUA, Hasibul, Dent-Assist, Esports Arena; SUA as "Client NDA" |
| Q3 Play Mode | P4/P5 Play work | keep it |
| Q4 Content | nothing (it decides what is shown) | counters hidden, no testimonials, no résumé button, link check decides Live buttons, avatar not used, "This site" pin kept |
| Q5 Contact | P4 Brief | Vercel + Resend to maremon15@gmail.com; mailto until the key is set |
| Q6 Domain and Vercel | P2/P5 canonical, og:url, JSON-LD, notes links; previews | 3d.emon.pro with its own canonical, `sameAs` emon.pro, notes link to emon.pro |
| Q7 DOM surfaces | P2 Index and case study, P4 Brief | approved, DOM on request |
| Q8 Auto-enter, sound off | P2 preloader | yes |
| Q9 Copy approval | ship (P5) | until approved, sheets show only verbatim portfolio3 fields |
| Q10 Test devices | P5 sign-off | your own laptop and phone |

**P0 Quick win (about 2 days): the complaint fixed**
- **Real content in today's schema shape.** Old fields get real values and new fields are added as optional, so nothing else breaks yet.
  - Real name, role, email and links.
  - The 4 real featured projects in the slots.
  - The 5 real stack groups, with levels dropped and the meter list removed.
  - About objects mapped onto existing models: desk → shell monitor, books → notes, gamepad, plant.
  - `vite.config.ts` updated alongside, with no emoji in visible strings.
- **Removed:**
  - Card 1 (`.card` and the sheet) and Card 2 (`.about-tip`, the About list, the hint bulbs);
  - the skill Html pills and the billboard posts;
  - the lens shift (`setViewOffset` and the pull-back);
  - the coffee, cat and guitar (hidden), with the cat egg moved to the monitor.
- **Added:**
  - one plain troika title and line per stop, hand-placed in the top band of the frame;
  - real screenshots as static textures on the existing screens;
  - the 5 stack group names as plain world labels.
- **Temporary:** the old `[data-stop]` panels stay as visually-hidden spine elements, so the old `scroll.ts` measuring keeps working until P1.
- **You see:** no boxes, your real name, work and screenshots, simple titles. The old stop-and-surge camera is still there, and nothing is animated yet.

**P1 Camera, timeline and foundations (about 6 days)**
- **Build:**
  - the final `content.ts` schema, with every importer listed in section 7 updated;
  - `brand.ts`, the font pipeline (`bake.py`, `coverage.json`, the Bengali subset and its shaping test) and the asset script;
  - `shots.ts` and `timeline.ts` (svh progress, final-hold padding, snap markers);
  - `framing.ts` with aspect blending, height tiers and safe areas, plus the overlap unit test;
  - the new camera path with damp3, snap and rack focus;
  - the quality model (`degrade` ladder, effects with nothing remounted);
  - the hidden spine;
  - the DOM HUD frame with the identity line and "Open to work", plus the progress line;
  - the dawn palette fix, using Q1's default.
- **Infrastructure:**
  - `scripts/qa/*`, Playwright as a dev dependency, `.github/workflows/ci.yml`;
  - the `data-ready` / `data-shot` / `data-phase` hooks;
  - the dev-only `?director` panel;
  - the preview deploy.
- **Done when:**
  - The camprofile gates pass and the scroll is about 12.5 vh.
  - The overlap test passes across the full aspect and height sweep.
  - The zero-card and no-`backdrop-filter` tests pass at all 10 viewports.
  - 820×1180, 1366×657, 1024×1024 and 844×390 frame correctly.
  - CI is green.
- **You see:** the smooth camera and correct framing on every screen shape.
  - Stack and About still have only P0's plain labels. Their real carriers arrive in P4.

**P2 Type and choreography (about 6 days)**
- **Text kit:** typed `TroikaText`, the Hud headline group, glyph reveal, the typewriter eyebrow, the word slot, anchor dot and leader line, the 3D pill, curved text, the halo and mesh arrows.
- **Behaviour:**
  - `phase.ts` with the vh/s thresholds, the reduced-motion settle and the exits;
  - all 11 headline groups with copy variants per tier and ink per chapter;
  - the Pause motion toggle.
- **Surfaces:**
  - the inline preloader (identity row, Bengali subset, real progress, auto-lift into the shortened takeoff);
  - the curtain, the Index with every group, deep links and the 404;
  - the case-study sheet with the clip handoff;
  - aria-live, the focus chip and the focus ring;
  - `check-strings` (cmap coverage and word caps) in prebuild.
- **Done when:**
  - A fast scroll-through shows no text.
  - Contrast is at least 4.5:1 for body and 3:1 for display text at all 10 viewports, at the 7 pose samples. This runs against Q1's palette; if Q1 = "keep pastel", the dawn ink and halo are re-tuned to meet the same gate.
  - Gate A passes, and Gate B's schedule check passes.
  - Stop-to-readable latency is ≤ 1.7 s.
  - The word caps pass per tier.
  - No off-origin requests are made.
- **You see:** portfolio3's brand inside the 3D. The big name rises letter by letter, titles are tied to their buildings, and the Index is the fast lane.

**P3 The work district (5–6 days)**
- **Screens:** the full shader: boot, de-zoom, crossfade (stops after 4.4 s), recede, screensaver.
- **Buildings:**
  - San Uni Academy: video wall and ledger coins.
  - Hasibul: arcade and drones.
  - Dent-Assist: dome and waveform ring.
  - Esports Arena: the bowl, with GKEC and BOE stands, each with its own labelled LED.
  - LED odometer bands on all four.
- **Work slate:** 8 pins, with "+4 more" opening Index → Work, plus the terraces, the pavilion and the mast.
- **Also:** colliders for the new geometry, and the frozen-town and spot tests.
- **Inspect:** the gallery, plus texture streaming.
- **Done when:**
  - Every project can be inspected by mouse, touch and keyboard.
  - Any case study is at most 2 interactions away.
  - Low-tier texture memory stays at or below 20 MB.
  - Draw-call and text-block budgets pass at every work hold.
- **You see:** four buildings, each telling its project's story, with every number credited to the right project.

**P4 Stack, About, Experience, Work with me, Launch (6–7 days)**
- **Stack:** the circuit tree with 5 groups, 44 usage-sized nodes, flip tags with pre-laid back faces, rim names, traces and the marquee ring.
- **About:**
  - the workshop with real objects and captions, the portrait, and the scrub lead;
  - the shell monitor with `ls ~/repos` and the sudo egg;
  - the notes bookshelf (link-out, or the Note sheet if Q6 says "replace");
  - the Bengali globe tag.
- **Experience:** the bridge sockets as their own task.
  - 5 new posts on the sag curve, with plaques, lanterns, back-face bullets and colliders.
  - Framing check: side-on at 1440 and 1024×1024, top-down at 390×844, plus the tiny tier at 844×390.
- **Work with me:** the departures board.
  - One Text per row, a flip shader over instanced tiles, all 4 pages pre-laid, the detail strip, manual paging and a single auto-flip.
- **Launch:**
  - the console and the countdown ring, with the finale's static props merged first;
  - the Brief sheet, `api/contact.ts` with the Vite dev and preview plugin, and `resend`;
  - the fallbacks for any non-2xx or network error, with separate handling for 422 and 429;
  - the rocket on send.
- **Brand pass:** the rest of the day/night re-key, the EMON. sign and grain.
- **Play Mode:** the PlayHud restyle onto tokens, SVG icons, and the Hud hidden in Play.
- **Done when:**
  - `scripts/qa/walk.mjs` passes at 5 viewports (390×844, 844×390, 1024×1024, 1440×900, 1920×1080). For each one it:
    - scrolls to all 11 shots, waits for `data-phase="shown"` and screenshots each;
    - inspects every carrier, then opens and closes every sheet;
    - submits the brief against the mock API;
    - fails on any console error.
  - It writes a contact sheet.
  - A real brief reaches a test inbox through the preview deploy, and the mailto fallback works with no key and on `vite preview`.
  - The finale stays at or under 190 calls.
- **You see:** the whole new site.

**P5 Mobile, accessibility, performance, then ship (about 5 days)**
- **Mobile:** tune the tall and tiny poses for each shot, and add the hit meshes.
- **Accessibility:**
  - text size with its fallback ladder, prefers-contrast, the caption bar and the reduced-motion pass;
  - FlatSite on portfolio3 tokens, and context loss falling back to 2D.
- **Performance:** the compile warm-up including the Hud scene, and the `?perf=1&tour=1` panel.
- **Testing:**
  - the full Playwright suite in CI: shots, zero-card, contrast, overlap, Gates A and B, camera profile, budgets, latency, off-origin requests and a keyboard walk;
  - axe, VoiceOver and NVDA;
  - Emon's device run (question 10).
- **Branding cleanup:** regenerate `public/og-image.jpg` with the new brand through the updated `og-image.mjs`, the README, favicons, and the console egg text.
- **Ship:** delete the legacy code and CSS, approve the copy (Q9), then merge `v2` into `main`.
- **Done when:**
  - Your device run shows 60 fps on the laptop and at least 45 fps on the phone, or the fallback rule in section 6 holds for that device class.
  - axe is clean, the budgets are met and CI is green.

**Total:** about 30–32 dev-days (about 6–6.5 weeks). P0 alone (about 2 days) already fixes the complaint.

---

## 9. Risks and mitigations

- **Boxless text over a changing 3D background** (11 shots × aspect ratios × heights × lighting):
  - Composition puts text on sky or wall, with one ink per chapter, a halo, and a faint pocket only as a fallback.
  - Numbers go on LED bands.
  - The automated contrast gate is sampled at drift ends and parallax corners. The `?director` panel and the caption bar back it up.
  - Expect to hand-tune about half of the tall poses and most of the tiny ones.
- **Hud headlines are never hidden by the world**, so they could look pasted on or cover the subject:
  - one group per shot, tied with a leader line and anchored on the subject plane;
  - the overlap test across the full aspect and height sweep;
  - every detail kept in the world.
- **Drift back towards "cards in WebGL"** (plates, word counts): the no-box test, the per-tier word-cap check and before/after contact sheets.
- **Brand colour shifts from ACES, HueSat and bloom:**
  - Headlines bypass the post stack.
  - World colours are pre-compensated and checked by pixel sampling.
  - The bloom is left as it is.
- **troika traps:** WOFF2, the default variable instance, Bengali, no tabular figures, CDN fallback fonts (which ignore a dead `unicodeFontsURL`), blanking under Suspense, the colorRanges key-0 rule, and drei's missing types.
  - Font, coverage and string build checks, plus the CSP.
  - Suspense per chapter.
  - Canvas for Bengali.
  - An odometer atlas for digits.
  - Our own typed troika wrapper.
- **Hitches from quality changes:** the mount set is fixed at creation and the ladder works in place. Only the shadows step recompiles, at most once, during a flight move.
- **Snap feeling grabby on trackpads or touch:** proximity mode only, a 150 ms debounce, tunable, and switchable off on touch and under reduced motion. Playtest it.
- **Inspect versus scroll on iOS Safari, and the address bar:** svh sections, final-hold padding, snap markers re-measured by Lenis, and one history entry per inspect. Real-device QA happens in P5.
- **Phone GPU memory and context loss:**
  - 768 px textures for the active project ±1, and at most 2 canvases.
  - Context loss falls back to 2D.
  - fps can only be measured on real devices, which Emon does with the tour panel.
- **The palette re-key changes the pastel feel:**
  - The palettes are data.
  - Only the dawn key changes in P1, so the hero contrast is fixed early. The rest waits for Q1 and P4.
  - The day palette gets A/B-tested with you.
- **Play Mode regressions:**
  - The frozen town data.
  - The collider list.
  - The spot and ring clearance tests.
  - The egg relocation, with migration of saved eggs.
- **Scope creep in props and buildings:** about half a day per prop, reusing `systems/geometry.ts`, and built only after the camera and text core.
- **Contact needs a backend:**
  - Vercel with a Resend key, otherwise the mailto fallback, which now triggers on any failure.
  - The rate limit is best effort per instance.
- **Content truth:**
  - The problem/solution/outcome copy and the phone variants are synthesised and need your approval (Q9).
  - The unverified `*.emon.pro` links are hidden by the link check if they are dead.
  - San Uni Academy is under NDA, and the GKEC role names are inconsistent.
  - The arena metrics are labelled with their source.
- **Auto-enter removes the click that unlocked audio:** sound is off by default, and the HUD sound toggle provides the gesture.

## Open questions for you

Shob gulor uttor ekshathe ek line e dite paro, jemon: `1 haan · 2 haan · 5 Resend, maremon15 · 6 3d.emon.pro, Vercel connected · 10 laptop + Redmi Note 12`. Je proshner uttor dibe na, tar default dhore nibo (section 8 er table). Shudhu **"go"** likhle shob default diye P0 shuru hobe.

1. **Look (rong):** island ki portfolio3 er palette e jabe (vermilion dawn → cream day → warm-black night), low-poly model same rekhe? Naki ajker pastel rong thakbe, shudhu font ar accent nibo? *(Move the island to portfolio3's palette, or keep the pastels?)* Default: portfolio3 palette.
2. **Featured projects:** building e ei 4 ta thik ache? San Uni Academy, Hasibul Gaming Point, Dent-Assist AI, ar GKEC + BOE mile ekta "Esports Arena" (prottek metric e project er nam thakbe). San Uni Academy ke "Client NDA" (shudhu live site, code link nai) dekhano thik ache? Default: haan.
3. **Play Mode:** launch er pore drone mode (HUD button ar "Fly the island yourself") rakhbo? Default: rakhbo.
4. **Content confirm:**
   - 100+ projects, 8+ clients, 99% satisfaction dekhabo? Default: na.
   - Asol testimonial ache? portfolio3 er 5 ta placeholder. Default: nai.
   - Résumé PDF ache? Default: nai, button o thakbe na.
   - dent-assist, bismillah-agro, holy-quran (`.emon.pro`) ar Chit-Chat er host ki live? Default: link check je ta dead pabe, oi "Live" button lukano thakbe.
   - Anime avatar (`image.webp`) ta ki tumi? Use korbo, jemon Play Mode er pilot hishebe? Default: na.
   - Work slate e "This site" pin thakbe, ei repo te link kore? Default: haan.
5. **Contact backend:** Vercel + Resend key? Mail kon inbox e jabe: maremon15@gmail.com naki dev@emon.pro? Na hole form service ba shudhu mailto. Default: Vercel + Resend, maremon15@gmail.com. Key na deya porjonto mailto.
6. **Domain ar Vercel:** ei 3D site ki emon.pro ke replace korbe (2D fallback shoho), naki 3d.emon.pro te thakbe ar emon.pro same thakbe? Repo ta ki Vercel e connected? Na thakle ekbar connect koro (Vercel → Add New Project → import `maremon7415/city-3d-portfolio`), tahole prottek phase er preview link automatic ashbe. Default: 3d.emon.pro, ar notes emon.pro te link korbe.
7. **DOM surface approval:** egulo 3D noy, kintu screen e ashbe shudhu tumi chaile:
   - Index (⌘K);
   - case-study sheet;
   - brief form (keyboard, Bangla IME ar autofill er jonno form DOM e thaka dorkar);
   - caption bar (default off);
   - keyboard focus chip;
   - confirmation toast;
   - preloader;
   - far jump er curtain;
   - upore patla HUD frame (logo, clock, button, kono box chara).

   Eta thik ache? Na hole all-3D alternative:
   - case study hobe building screen er in-world gallery ar caption, sathe "Read on emon.pro" link;
   - brief er bodole console e email, WhatsApp ar mailto;
   - Index er bodole ekta 3D chapter map.
   - Ete detail kom thakbe ar accessibility kichuta durbol hobe.

   Default: haan, DOM on request.
8. **Auto-enter:** "Enter the city" click chara loading shesh holei site nije nije khulbe, ar sound default off thakbe (HUD theke on kora jabe). Thik ache? Default: haan.
9. **Copy approval:** case study er problem/solution/outcome lekha portfolio3 er lekha theke banano. Phone er 3 ta choto line o notun (Shot 2, 9, 11). Ship er age tumi ekbar pore approve korbe? Default: approve na kora porjonto shudhu portfolio3 er verbatim lekha dekhabo.
10. **Test device:** P5 e asol fps test tomar device e hobe (`?perf=1&tour=1` link khule ~70 second, tarpor result er screenshot pathabe). Tomar kache kon laptop ar kon phone ache? BrowserStack account ache? Default: tomar nijer laptop ar phone.
