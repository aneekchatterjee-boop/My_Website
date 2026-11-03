import { useEffect, useRef } from 'react'
import { about, profile, skills } from '../data.js'
import { finePointer, reducedMotion } from '../lib.js'

// 3D tilt + spotlight that tracks the cursor across a tile
function Tile({ className = '', children, delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !finePointer || reducedMotion) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      el.style.setProperty('--mx', `${px * 100}%`)
      el.style.setProperty('--my', `${py * 100}%`)
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg)`
    }
    const leave = () => (el.style.transform = '')
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])
  return (
    <div className={`tile glass reveal ${className}`} ref={ref} data-delay={delay}>
      {children}
    </div>
  )
}

export default function About() {
  return (
    <section className="section" id="about">
      <header className="section-head">
        <span className="section-num mono">01 — About</span>
        <h2 className="reveal">
          Building from <em className="grad">first principles.</em>
        </h2>
      </header>

      <div className="bento">
        <Tile className="t-lead">
          <p className="lead">{about.lead}</p>
          <p className="muted">{about.body}</p>
        </Tile>

        <Tile className="t-edu" delay={0.08}>
          <span className="tile-label mono">education</span>
          <h3>{profile.school}</h3>
          <p className="muted">{profile.degree}</p>
          <p className="big-num grad">’{profile.grad.slice(2)}</p>
          <span className="tile-foot mono">expected graduation</span>
        </Tile>

        <Tile className="t-values" delay={0.12}>
          <span className="tile-label mono">core values</span>
          <ul className="values">
            {about.values.map((v, i) => (
              <li key={v}>
                <span className="mono">0{i + 1}</span>
                {v}
              </li>
            ))}
          </ul>
        </Tile>

        <Tile className="t-code" delay={0.16}>
          <span className="tile-label mono">aneek.py</span>
          <pre className="code mono">
            <code>
              <span className="c-k">class</span> <span className="c-f">Aneek</span>:{'\n'}
              {'  '}stack = [<span className="c-s">"Python"</span>, <span className="c-s">"Node"</span>, <span className="c-s">"React"</span>]{'\n'}
              {'  '}focus = <span className="c-s">"backend + AI/ML"</span>{'\n\n'}
              {'  '}<span className="c-k">def</span> <span className="c-f">build</span>(self, idea):{'\n'}
              {'    '}<span className="c-k">return</span> ship(test(idea)){'\n'}
            </code>
          </pre>
        </Tile>

        {skills.map((s, i) => (
          <Tile key={s.group} className="t-skill" delay={0.05 * i}>
            <span className="tile-label mono">{s.group}</span>
            <ul className="chips">
              {s.items.map((it) => (
                <li key={it} className={it === 'Python' ? 'chip hot' : 'chip'}>
                  {it}
                </li>
              ))}
            </ul>
          </Tile>
        ))}
      </div>
    </section>
  )
}
