import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { journey } from '../data.js'
import { reducedMotion } from '../lib.js'

export default function Journey() {
  const root = useRef(null)
  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.tl-fill',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true },
        },
      )
      gsap.utils.toArray('.tl-item').forEach((el) => {
        ScrollTriggerToggle(el)
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section className="section" id="journey" ref={root}>
      <header className="section-head">
        <span className="section-num mono">03 — Journey</span>
        <h2 className="reveal">
          How I got <em className="grad">here.</em>
        </h2>
      </header>
      <ol className="timeline">
        <span className="tl-line" aria-hidden="true">
          <span className="tl-fill" />
        </span>
        {journey.map((j) => (
          <li className={`tl-item ${j.current ? 'current' : ''}`} key={j.title}>
            <span className="tl-node" aria-hidden="true" />
            <div className="tl-card glass">
              <span className="mono tl-phase">{j.phase}</span>
              <h3>{j.title}</h3>
              <p className="muted">{j.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// Light each node up as the fill line reaches it
function ScrollTriggerToggle(el) {
  gsap.from(el.querySelector('.tl-card'), {
    x: 60,
    opacity: 0,
    duration: 1,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 70%',
      onEnter: () => el.classList.add('lit'),
      onLeaveBack: () => el.classList.remove('lit'),
    },
  })
}
