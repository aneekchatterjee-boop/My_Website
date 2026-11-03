# Aneek Chatterjee — Portfolio

**Live:** [aneek-chatterjee.vercel.app](https://aneek-chatterjee.vercel.app/)

[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-000?logo=vercel)](https://aneek-chatterjee.vercel.app/)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000?logo=threedotjs)
![GSAP](https://img.shields.io/badge/GSAP-88ce02?logo=greensock&logoColor=black)

My personal portfolio — IT student at VIT, building backend systems, real-time apps and secure tools.

## Highlights

- **3D particle hero** — a cloud of ~5,000 particles that morphs between a sphere, torus knot, galaxy, DNA helix, cube
  grid and my initials, reacting to the mouse.
- **Interactive project demos** that run right in the browser:
  - **Fraudinate** — tweak a transaction and watch rule scoring, entity-graph analysis and risk fusion produce a verdict.
  - **SyncPad** — two live editors kept in sync by a small CRDT; take one offline, edit both, reconnect and they merge.
  - **Ephemera** — real AES-256-GCM encryption with a PBKDF2 passkey-derived key via the Web Crypto API, one-time
    self-destructing links.
- **Ambient background** — drifting constellation with travelling data packets and comets along the grid.
- **Motion** — Lenis smooth scroll, GSAP scroll-triggered reveals, stacked project cards with 3D hover tilt, a
  self-drawing journey timeline, magnetic buttons and a custom cursor.
- **Hidden terminal** — press <kbd>`</kbd> anywhere and type `help`.
- Responsive, and respects `prefers-reduced-motion`.

## Tech stack

React 19 · Vite · Three.js / React Three Fiber · GSAP + ScrollTrigger · Lenis · plain CSS · Vercel

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Project structure

```
src/
├── data.js              # all text, skills, projects and links — edit content here
├── App.jsx              # layout, smooth scroll, reveal animations, terminal hotkey
├── styles.css
└── components/
    ├── HeroScene.jsx    # 3D morphing particle cloud
    ├── BackgroundFX.jsx # ambient constellation + grid comets
    ├── Projects.jsx     # stacked project cards + hover effects
    ├── Terminal.jsx     # hidden terminal
    └── demos/           # Fraudinate, SyncPad and Ephemera demos
```

## Deployment

Hosted on **Vercel** and connected to this repo — every push to `main` automatically rebuilds and deploys the live
site (Vite preset: build `npm run build`, output `dist`).

## Contact

[aneekchatterjee4@gmail.com](mailto:aneekchatterjee4@gmail.com) · [GitHub](https://github.com/aneekchatterjee-boop)
