import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { projects } from '../data.js'
import { finePointer, reducedMotion } from '../lib.js'
import Magnetic from './Magnetic.jsx'
import FraudDemo from './demos/FraudDemo.jsx'
import SyncDemo from './demos/SyncDemo.jsx'
import EphemeraDemo from './demos/EphemeraDemo.jsx'

const demos = { fraudinate: FraudDemo, syncpad: SyncDemo, ephemera: EphemeraDemo }

export default function Projects() {
  const root = useRef(null)

  useEffect(() => {
    if (reducedMotion) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1000px)', () => {
      const cards = gsap.utils.toArray('.p-card')
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return
        gsap.to(card.querySelector('.p-card-inner'), {
          scale: 0.92,
          opacity: 0.35,
          filter: 'blur(2px)',
          ease: 'none',
          scrollTrigger: {
            trigger: cards[i + 1],
            start: 'top bottom',
            end: 'top 12%',
            scrub: true,
          },
        })
      })
    })
    return () => mm.revert()
  }, [])

  // Hover: 3D tilt toward the cursor + an accent spotlight that follows it.
  // Tilt is softened over the demo panel so its controls stay easy to use.
  useEffect(() => {
    if (!finePointer || reducedMotion) return
    const cards = [...root.current.querySelectorAll('.p-card')]
    const off = cards.map((card) => {
      const move = (e) => {
        const r = card.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        const k = e.target.closest('.p-demo') ? 0.3 : 1
        card.style.setProperty('--mx', `${px * 100}%`)
        card.style.setProperty('--my', `${py * 100}%`)
        card.style.setProperty('--rx', `${(0.5 - py) * 5 * k}deg`)
        card.style.setProperty('--ry', `${(px - 0.5) * 7 * k}deg`)
      }
      const enter = () => card.classList.add('hovering')
      const leave = () => {
        card.classList.remove('hovering')
        card.style.setProperty('--rx', '0deg')
        card.style.setProperty('--ry', '0deg')
      }
      card.addEventListener('pointermove', move)
      card.addEventListener('pointerenter', enter)
      card.addEventListener('pointerleave', leave)
      return () => {
        card.removeEventListener('pointermove', move)
        card.removeEventListener('pointerenter', enter)
        card.removeEventListener('pointerleave', leave)
      }
    })
    return () => off.forEach((f) => f())
  }, [])

  return (
    <section className="section" id="projects" ref={root}>
      <header className="section-head">
        <span className="section-num mono">02 — Selected work</span>
        <h2 className="reveal">
          Things I’ve <em className="grad">built.</em>
        </h2>
        <p className="muted reveal section-sub">
          Each project below has a small interactive demo that runs right here in your browser. They show how each
          system works; the full apps live in the repos.
        </p>
      </header>

      <div className="p-stack">
        {projects.map((p) => {
          const Demo = demos[p.id]
          return (
            <article className="p-card" key={p.id} style={{ '--accent': p.accent }} id={`p-${p.id}`}>
              <div className="p-tilt">
                <div className="p-card-inner glass">
                  <span className="p-glow" aria-hidden="true" />
                  <div className="p-info">
                    <div className="p-top mono">
                      <span className="p-index">{p.index}</span>
                      <span className="p-kicker">{p.kicker}</span>
                    </div>
                    <h3 className="p-name">{p.name}</h3>
                    <p className="p-desc">{p.description}</p>

                    <ol className="p-pipe mono" aria-label="Pipeline">
                      {p.pipeline.map((s, i) => (
                        <li key={s}>
                          <span>{s}</span>
                          {i < p.pipeline.length - 1 && <i aria-hidden="true">→</i>}
                        </li>
                      ))}
                    </ol>

                    <ul className="chips small">
                      {p.stack.map((s) => (
                        <li className="chip" key={s}>
                          {s}
                        </li>
                      ))}
                    </ul>

                    {p.team && <p className="p-team muted">{p.team}</p>}

                    <div className="p-links">
                      <Magnetic>
                        <a className="btn btn-accent" href={p.repo} target="_blank" rel="noreferrer">
                          View code <span aria-hidden>↗</span>
                        </a>
                      </Magnetic>
                    </div>
                  </div>

                  <div className="p-demo">
                    <div className="demo-bar mono">
                      <span className="lights" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span>{p.name.toLowerCase()} — interactive demo</span>
                      <span className="demo-tag">in-browser</span>
                    </div>
                    <div className="demo-body">
                      <Demo />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
