/**
 * ─────────────────────────────────────────────────────────────
 *  EVERYTHING YOU NEED TO PERSONALISE LIVES IN THIS FILE.
 *  Name, projects, skills, about stories, shard facts, links.
 *  The 3D city, the 2D mode, the SEO tags and the <noscript>
 *  fallback are all generated from it.
 *
 *  Fields marked TODO are placeholders — swap them for yours.
 *  Empty strings ('') hide the matching button/link.
 * ─────────────────────────────────────────────────────────────
 */

export type DemoStyle = 'dashboard' | 'code' | 'chat' | 'shop' | 'game'
export type BuildingStyle = 'tower' | 'dome' | 'studio' | 'factory'
export type AboutModel = 'computer' | 'books' | 'gamepad' | 'coffee' | 'plant' | 'guitar' | 'cat'

export interface Project {
  id: string
  title: string
  tagline: string
  description: string
  year: string
  role: string
  tech: string[]
  liveUrl: string
  codeUrl: string
  /** Set to a URL that allows iframing to run the live site inside the building screen modal. */
  embedUrl: string
  accent: string
  demo: DemoStyle
  building: BuildingStyle
}

export interface SkillGroup {
  name: string
  color: string
  skills: { name: string; level: number }[]
}

export interface AboutItem {
  id: string
  model: AboutModel
  title: string
  text: string
}

export interface Shard {
  id: string
  title: string
  text: string
}

export const profile = {
  name: 'Emon',
  /** Shown as voxel letters on the island hill — keep it short (A–Z, 0–9). */
  sign: 'EMON',
  title: 'Creative Frontend Developer', // TODO: your field
  location: 'Bangladesh', // TODO
  intro:
    'I build fast, playful and accessible web experiences — from clean product UIs to real-time 3D worlds like this one.',
  availability: 'Open to freelance & full-time roles',
  email: 'hello@example.com', // TODO: your email (used by the contact terminal)
  /**
   * Optional: a Formspree / Getform / Basin endpoint. When set, the terminal POSTs
   * JSON {name, email, message}. When empty, it falls back to opening a mailto: link.
   */
  formEndpoint: '',
  resumeUrl: '', // TODO: e.g. '/resume.pdf' (drop the file into /public)
  siteUrl: 'https://city-3d-portfolio.vercel.app', // TODO: your deployed URL (used for Open Graph)
  socials: [
    { label: 'GitHub', url: 'https://github.com/maremon7415' },
    { label: 'LinkedIn', url: '' }, // TODO
    { label: 'X / Twitter', url: '' }, // TODO
  ],
}

export const projects: Project[] = [
  {
    id: 'island-city',
    title: 'Floating Island City',
    tagline: 'This site — a portfolio you can fly through',
    description:
      'A scroll-driven 3D journey that turns into a game. Procedural low-poly world, day-night cycle, Rapier physics, procedural WebAudio and a full accessible 2D fallback — with zero downloaded 3D assets.',
    year: '2026',
    role: 'Design · 3D · Development',
    tech: ['React Three Fiber', 'GSAP', 'Lenis', 'Rapier', 'TypeScript'],
    liveUrl: '',
    codeUrl: 'https://github.com/maremon7415/city-3d-portfolio',
    embedUrl: '',
    accent: '#7cc4ff',
    demo: 'game',
    building: 'tower',
  },
  {
    id: 'orbit',
    title: 'Orbit Analytics', // TODO: sample project
    tagline: 'Real-time dashboard for product metrics',
    description:
      'Streaming charts, saved views and a keyboard-first command palette. Built to stay at 60fps while rendering thousands of live data points.',
    year: '2025',
    role: 'Frontend lead',
    tech: ['React', 'TypeScript', 'D3', 'WebSockets'],
    liveUrl: '',
    codeUrl: 'https://github.com/maremon7415',
    embedUrl: '',
    accent: '#ffb547',
    demo: 'dashboard',
    building: 'dome',
  },
  {
    id: 'chatterbox',
    title: 'Chatterbox', // TODO: sample project
    tagline: 'Realtime chat with presence & reactions',
    description:
      'Rooms, typing indicators, optimistic updates and offline support. Focused on micro-interactions that make conversation feel alive.',
    year: '2025',
    role: 'Full-stack',
    tech: ['Next.js', 'Node', 'Socket.IO', 'PostgreSQL'],
    liveUrl: '',
    codeUrl: 'https://github.com/maremon7415',
    embedUrl: '',
    accent: '#ff7aa8',
    demo: 'chat',
    building: 'studio',
  },
  {
    id: 'pixel-market',
    title: 'Pixel Market', // TODO: sample project
    tagline: 'Headless storefront with buttery checkout',
    description:
      'A storefront with instant search, animated cart and a three-step checkout. Lighthouse 100 on performance and accessibility.',
    year: '2024',
    role: 'Frontend',
    tech: ['React', 'Tailwind', 'Stripe', 'Vite'],
    liveUrl: '',
    codeUrl: 'https://github.com/maremon7415',
    embedUrl: '',
    accent: '#8be28b',
    demo: 'shop',
    building: 'factory',
  },
]

export const skillGroups: SkillGroup[] = [
  {
    name: 'Frontend',
    color: '#7cc4ff',
    skills: [
      { name: 'React', level: 0.95 },
      { name: 'TypeScript', level: 0.9 },
      { name: 'Next.js', level: 0.8 },
      { name: 'CSS / Tailwind', level: 0.9 },
    ],
  },
  {
    name: 'Creative / 3D',
    color: '#ff9f6b',
    skills: [
      { name: 'Three.js', level: 0.85 },
      { name: 'R3F', level: 0.85 },
      { name: 'GSAP', level: 0.85 },
      { name: 'GLSL', level: 0.6 },
    ],
  },
  {
    name: 'Backend',
    color: '#9be38f',
    skills: [
      { name: 'Node.js', level: 0.75 },
      { name: 'PostgreSQL', level: 0.65 },
      { name: 'REST / GraphQL', level: 0.75 },
    ],
  },
  {
    name: 'Tooling',
    color: '#c9a7ff',
    skills: [
      { name: 'Git', level: 0.9 },
      { name: 'Vite', level: 0.85 },
      { name: 'Figma', level: 0.7 },
      { name: 'Testing', level: 0.7 },
    ],
  },
]

export const aboutItems: AboutItem[] = [
  {
    id: 'desk',
    model: 'computer',
    title: 'The desk',
    text: 'Where ideas become prototypes. Two monitors, one too many browser tabs, and a terminal that never closes.',
  },
  {
    id: 'books',
    model: 'books',
    title: 'Always learning',
    text: 'Shaders, systems design, typography — the shelf grows faster than I can read it, and that is the point.',
  },
  {
    id: 'gamepad',
    model: 'gamepad',
    title: 'Player one',
    text: 'Games taught me feedback loops and game feel. This whole site is basically me making a tiny game.',
  },
  {
    id: 'coffee',
    model: 'coffee',
    title: 'Fuel',
    text: 'Tea or coffee depending on how hard the bug is fighting back.',
  },
  {
    id: 'plant',
    model: 'plant',
    title: 'Slow & steady',
    text: 'Keeping a plant alive is good practice for maintaining long-running projects: a little care, every day.',
  },
  {
    id: 'cat',
    model: 'cat',
    title: 'Senior reviewer',
    text: 'Walks across the keyboard during every deploy. Has never once approved a PR. Very good cat.',
  },
]

/** Play Mode collectibles — one fact, skill or mini-story each. */
export const shards: Shard[] = [
  { id: 's1', title: 'Origin story', text: 'My first website was a fan page with a spinning GIF and a guestbook. I was hooked.' },
  { id: 's2', title: 'Favourite stack', text: 'TypeScript + React for products, Three.js when it is time to have fun.' },
  { id: 's3', title: 'Performance nerd', text: 'This city runs on instancing, merged geometry and zero downloaded models.' },
  { id: 's4', title: 'Accessibility', text: 'Every project ships with keyboard navigation and reduced-motion support.' },
  { id: 's5', title: 'Design eye', text: 'I sketch interfaces on paper before opening Figma. Bad ideas die cheaper there.' },
  { id: 's6', title: 'Night owl', text: 'Most of this island was built after midnight. That explains the night chapter.' },
  { id: 's7', title: 'Team player', text: 'Code review is my favourite meeting. Clear PRs, kind comments, fast merges.' },
  { id: 's8', title: 'Shader curious', text: 'The sky, waterfall and stars here are tiny hand-written shaders.' },
  { id: 's9', title: 'Game feel', text: 'Ease-out on everything. Camera damping is a love language.' },
  { id: 's10', title: 'Lifelong learner', text: 'Currently learning: WebGPU and procedural animation.' },
  { id: 's11', title: 'Off the keyboard', text: 'Football, long walks and too many open-world games.' },
  { id: 's12', title: 'What is next?', text: 'Maybe your product. Fly to the rocket and send me a message.' },
]

export const playCopy = {
  rewardTitle: 'Island 100% complete',
  rewardText:
    'You found every shard. Thanks for exploring this far — you clearly have the patience of a great teammate. Secret code for my inbox: “SKYLINE”. Mention it and I will know you played.',
}

export const chapters = [
  { id: 'intro', label: 'Takeoff' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'about', label: 'About' },
  { id: 'finale', label: 'Contact' },
] as const

export type ChapterId = (typeof chapters)[number]['id']
