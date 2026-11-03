import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { profile, highlights } from '../data.js'
import { reducedMotion, scrollToId } from '../lib.js'
import Magnetic from './Magnetic.jsx'

const HeroScene = lazy(() => import('./HeroScene.jsx'))

function useTypewriter(text, speed = 42, startDelay = 900) {
  const [out, setOut] = useState(reducedMotion ? text : '')
  useEffect(() => {
    if (reducedMotion) return
    let i = 0
    let timer
    const start = setTimeout(function step() {
      i++
      setOut(text.slice(0, i))
      if (i < text.length) timer = setTimeout(step, speed + Math.random() * 40)
    }, startDelay)
    return () => {
      clearTimeout(start)
      clearTimeout(timer)
    }
  }, [text, speed, startDelay])
  return out
}

export default function Hero({ onTerminal }) {
  const root = useRef(null)
  const typed = useTypewriter(profile.tagline)

  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.from('.hero-name .ch', {
        yPercent: 110,
        rotate: 8,
        opacity: 0,
        stagger: 0.035,
        duration: 1.2,
        ease: 'expo.out',
        delay: 0.15,
      })
      gsap.from('.hero-fade', { y: 24, opacity: 0, stagger: 0.12, duration: 1, ease: 'power3.out', delay: 0.6 })
      // Parallax out as you scroll away
      gsap.to('.hero-inner', {
        yPercent: -18,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const split = (word) =>
    [...word].map((c, i) => (
      <span className="ch" key={i}>
        {c}
      </span>
    ))

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero-canvas" aria-hidden="true">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </div>
      <div className="hero-inner">
        <p className="eyebrow hero-fade">
          <span className="dot-live" /> IT @ VIT · Class of {profile.grad}
        </p>
        <h1 className="hero-name" aria-label={profile.name}>
          <span className="line">{split(profile.first)}</span>
          <span className="line outline">{split(profile.last)}</span>
        </h1>
        <p className="hero-role hero-fade">{profile.role}</p>
        <p className="hero-type mono" aria-label={profile.tagline}>
          <span className="prompt">&gt;</span> {typed}
          <span className="caret" />
        </p>
        <div className="hero-cta hero-fade">
          <Magnetic>
            <button className="btn btn-primary" onClick={() => scrollToId('projects')}>
              See my work <span aria-hidden>↓</span>
            </button>
          </Magnetic>
          <Magnetic>
            <button className="btn btn-ghost mono" onClick={onTerminal}>
              <span aria-hidden>&gt;_</span> open terminal
            </button>
          </Magnetic>
        </div>
        <ul className="hero-stats hero-fade">
          {highlights.map((h) => (
            <li key={h.k}>
              <span className="k mono">{h.k}</span>
              <span className="v">{h.v}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="scroll-hint mono" aria-hidden="true">
        <span>scroll</span>
        <i />
      </div>
      <p className="hint-key mono hero-fade" aria-hidden="true">
        press <kbd>`</kbd> anywhere
      </p>
    </section>
  )
}
