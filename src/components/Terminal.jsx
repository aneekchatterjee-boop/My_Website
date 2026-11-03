import { useEffect, useRef, useState } from 'react'
import { profile, projects, skills, journey, interests } from '../data.js'
import { scrollToId } from '../lib.js'

const BANNER = [
  { t: 'sys', v: 'aneek-os v2.0 — type `help` to see what you can do' },
]

const HELP = [
  ['help', 'list commands'],
  ['whoami', 'who is this guy'],
  ['ls', 'list sections'],
  ['projects', 'what I’ve built'],
  ['open <name>', 'jump to a project demo'],
  ['skills', 'my toolbox'],
  ['journey', 'how I got here'],
  ['interests', 'what I’m into'],
  ['contact', 'say hello'],
  ['github', 'open my GitHub'],
  ['email', 'copy my email'],
  ['theme', 'shuffle accent colours'],
  ['clear', 'clear screen'],
  ['exit', 'close terminal (or Esc)'],
]

const ACCENTS = [
  ['#a78bfa', '#22d3ee', '#f472b6'],
  ['#34d399', '#22d3ee', '#a3e635'],
  ['#fb923c', '#f472b6', '#facc15'],
  ['#60a5fa', '#a78bfa', '#2dd4bf'],
]

export default function Terminal({ open, onClose }) {
  const [lines, setLines] = useState(BANNER)
  const [input, setInput] = useState('')
  const [hist, setHist] = useState([])
  const [hi, setHi] = useState(-1)
  const inputRef = useRef(null)
  const bodyRef = useRef(null)
  const themeIdx = useRef(0)

  useEffect(() => {
    if (!open) return
    // Retry a few frames: the dialog fades in and may not accept focus on the first tick
    const ids = [30, 120, 320].map((t) => setTimeout(() => inputRef.current?.focus({ preventScroll: true }), t))
    return () => ids.forEach(clearTimeout)
  }, [open])
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines])

  const print = (...ls) => setLines((l) => [...l, ...ls])
  const go = (id) => {
    onClose()
    setTimeout(() => scrollToId(id), 120)
  }

  const run = (raw) => {
    const cmd = raw.trim()
    print({ t: 'in', v: cmd })
    if (!cmd) return
    setHist((h) => [cmd, ...h].slice(0, 30))
    const [c, ...args] = cmd.split(/\s+/)
    const arg = args.join(' ').toLowerCase()
    switch (c.toLowerCase()) {
      case 'help':
        print(...HELP.map(([k, d]) => ({ t: 'kv', k, v: d })))
        break
      case 'whoami':
        print(
          { t: 'out', v: `${profile.name} — ${profile.role}` },
          { t: 'out', v: `${profile.school} — ${profile.degree}, class of ${profile.grad}` },
          { t: 'dim', v: profile.tagline },
        )
        break
      case 'ls':
        print({ t: 'out', v: 'about/  projects/  journey/  interests/  contact/' })
        break
      case 'cd':
        if (['about', 'projects', 'journey', 'interests', 'contact'].includes(arg.replace(/\/$/, ''))) go(arg.replace(/\/$/, ''))
        else print({ t: 'err', v: `cd: no such section: ${arg || '(empty)'}` })
        break
      case 'projects':
        projects.forEach((p) => print({ t: 'kv', k: p.name.toLowerCase(), v: p.kicker }))
        print({ t: 'dim', v: 'tip: `open fraudinate` to jump to its live demo' })
        break
      case 'open': {
        const p = projects.find((x) => x.id === arg || x.name.toLowerCase() === arg)
        if (p) go(`p-${p.id}`)
        else print({ t: 'err', v: `open: unknown project "${arg}". try: ${projects.map((x) => x.id).join(', ')}` })
        break
      }
      case 'skills':
        skills.forEach((s) => print({ t: 'kv', k: s.group.toLowerCase(), v: s.items.join(', ') }))
        break
      case 'journey':
        journey.forEach((j) => print({ t: 'kv', k: j.phase.toLowerCase(), v: `${j.title} — ${j.text}` }))
        break
      case 'interests':
        interests.forEach((i) => print({ t: 'kv', k: i.glyph, v: i.title }))
        break
      case 'contact':
        go('contact')
        break
      case 'github':
        window.open(profile.github, '_blank', 'noopener')
        print({ t: 'out', v: `opening ${profile.github}` })
        break
      case 'email':
        navigator.clipboard?.writeText(profile.email).catch(() => {})
        print({ t: 'out', v: `${profile.email} — copied to clipboard` })
        break
      case 'theme': {
        themeIdx.current = (themeIdx.current + 1) % ACCENTS.length
        const [a, b, c2] = ACCENTS[themeIdx.current]
        const r = document.documentElement.style
        r.setProperty('--a1', a)
        r.setProperty('--a2', b)
        r.setProperty('--a3', c2)
        print({ t: 'out', v: `accent → ${a} ${b} ${c2}` })
        break
      }
      case 'clear':
        setLines([])
        break
      case 'exit':
      case 'quit':
        onClose()
        break
      case 'sudo':
        print({ t: 'err', v: 'nice try. this incident will be reported. 🙂' })
        break
      case 'rm':
        print({ t: 'err', v: 'rm: permission denied — the portfolio stays.' })
        break
      case 'hello':
      case 'hi':
        print({ t: 'out', v: 'hey! 👋 type `contact` if you want to talk.' })
        break
      default:
        print({ t: 'err', v: `command not found: ${c}. type \`help\`` })
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter') {
      run(input)
      setInput('')
      setHi(-1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const n = Math.min(hist.length - 1, hi + 1)
      if (n >= 0) {
        setHi(n)
        setInput(hist[n])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const n = hi - 1
      setHi(n)
      setInput(n >= 0 ? hist[n] : '')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const m = HELP.map(([k]) => k.split(' ')[0]).find((k) => k.startsWith(input))
      if (m && input) setInput(m)
    }
  }

  return (
    <div className={`term-wrap ${open ? 'open' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()} aria-hidden={!open}>
      <div className="term glass" role="dialog" aria-label="Terminal" aria-modal="true">
        <div className="term-bar mono">
          <span className="lights">
            <i onClick={onClose} />
            <i />
            <i />
          </span>
          <span>guest@aneek: ~</span>
          <button onClick={onClose} aria-label="Close terminal">esc</button>
        </div>
        <div className="term-body mono" ref={bodyRef} onClick={() => inputRef.current?.focus()} data-lenis-prevent>
          {lines.map((l, i) =>
            l.t === 'in' ? (
              <p key={i}>
                <span className="p1">guest@aneek</span>:<span className="p2">~</span>$ {l.v}
              </p>
            ) : l.t === 'kv' ? (
              <p key={i} className="kv">
                <span className="k">{l.k}</span>
                <span className="v">{l.v}</span>
              </p>
            ) : (
              <p key={i} className={l.t}>
                {l.v}
              </p>
            ),
          )}
          <p className="input-line">
            <span className="p1">guest@aneek</span>:<span className="p2">~</span>$&nbsp;
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Terminal input"
              tabIndex={open ? 0 : -1}
            />
          </p>
        </div>
      </div>
    </div>
  )
}
