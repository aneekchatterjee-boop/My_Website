# Aneek Chatterjee — Portfolio

Personal portfolio built with **React + Vite**, **Three.js** (React Three Fiber), **GSAP** + **Lenis** for scroll animation.

Features a morphing 3D particle hero, bento-grid about section, stacked project cards with in-browser interactive demos
(Fraudinate risk scoring, SyncPad CRDT sync, Ephemera Web Crypto encryption), a scroll-drawn timeline and a hidden
terminal (press <kbd>`</kbd>).

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Edit content

All text, skills, projects and links live in [`src/data.js`](src/data.js).

## Deploy

Import this repo on [Vercel](https://vercel.com/new) — the Vite preset is detected automatically
(build `npm run build`, output `dist`). Every push to `main` redeploys.
