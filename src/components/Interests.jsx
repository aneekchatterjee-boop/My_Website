import { interests } from '../data.js'
import Magnetic from './Magnetic.jsx'

export default function Interests() {
  return (
    <section className="section" id="interests">
      <header className="section-head">
        <span className="section-num mono">04 — Interests</span>
        <h2 className="reveal">
          What keeps me <em className="grad">curious.</em>
        </h2>
      </header>
      <div className="interests">
        {interests.map((it, i) => (
          <Magnetic key={it.title} strength={0.12}>
            <div className="int-card glass reveal" data-delay={i * 0.1} data-hover>
              <span className="int-glyph mono grad">{it.glyph}</span>
              <h3>{it.title}</h3>
              <p className="muted">{it.text}</p>
              <span className="int-num mono">0{i + 1}</span>
            </div>
          </Magnetic>
        ))}
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              Python ✦ Flask ✦ Node.js ✦ WebSockets ✦ React ✦ TypeScript ✦ SQLite ✦ Three.js ✦ Unity ✦ C# ✦ Machine
              Learning ✦&nbsp;
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
