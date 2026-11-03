import { useEffect, useState } from 'react'
import { scrollToId } from '../lib.js'

const links = [
  ['about', 'About'],
  ['projects', 'Work'],
  ['journey', 'Journey'],
  ['interests', 'Interests'],
  ['contact', 'Contact'],
]

export default function Nav({ onTerminal }) {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    links.forEach(([id]) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
    }
  }, [])

  const go = (id) => {
    setOpen(false)
    scrollToId(id)
  }

  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''} ${open ? 'open' : ''}`}>
      <button className="logo mono" onClick={() => go('top')} aria-label="Back to top">
        <span className="grad">AC</span>
        <span className="logo-sub">/ portfolio</span>
      </button>
      <nav aria-label="Primary">
        <ul>
          {links.map(([id, label], i) => (
            <li key={id}>
              <button className={active === id ? 'active' : ''} onClick={() => go(id)}>
                <span className="num mono">0{i + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="nav-right">
        <button className="term-btn mono" onClick={onTerminal} aria-label="Open terminal">
          &gt;_
        </button>
        <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
          <i />
          <i />
        </button>
      </div>
    </header>
  )
}
