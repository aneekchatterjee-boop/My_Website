import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * A tiny RGA-style CRDT so two editors converge no matter the order edits arrive.
 * Each character has a unique id [lamport, site] and remembers the character it
 * was inserted after. Deletes leave tombstones.
 */
const cmp = (a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]

class Replica {
  constructor(site) {
    this.site = site
    this.clock = 0
    this.chars = []
  }
  text() {
    let s = ''
    for (const c of this.chars) if (!c.del) s += c.ch
    return s
  }
  visible() {
    return this.chars.filter((c) => !c.del)
  }
  indexOf(id) {
    return this.chars.findIndex((c) => same(c.id, id))
  }
  integrate(op) {
    if (op.t === 'ins') {
      if (this.indexOf(op.id) !== -1) return
      this.clock = Math.max(this.clock, op.id[0])
      let i = op.origin ? this.indexOf(op.origin) + 1 : 0
      while (i < this.chars.length && cmp(this.chars[i].id, op.id) > 0) i++
      this.chars.splice(i, 0, { id: op.id, ch: op.ch, del: false })
    } else {
      const i = this.indexOf(op.id)
      if (i !== -1) this.chars[i].del = true
    }
  }
  // Turn a textarea change into CRDT ops
  localChange(next) {
    const prev = this.text()
    let p = 0
    while (p < prev.length && p < next.length && prev[p] === next[p]) p++
    let s = 0
    while (s < prev.length - p && s < next.length - p && prev[prev.length - 1 - s] === next[next.length - 1 - s]) s++
    const vis = this.visible()
    const ops = []
    for (let i = p; i < prev.length - s; i++) ops.push({ t: 'del', id: vis[i].id })
    ops.forEach((o) => this.integrate(o))
    let origin = p > 0 ? vis[p - 1].id : null
    for (const ch of next.slice(p, next.length - s)) {
      const op = { t: 'ins', id: [++this.clock, this.site], ch, origin }
      this.integrate(op)
      ops.push(op)
      origin = op.id
    }
    return ops
  }
}

const SEED = 'Shared notes ✦\nType in either pane, then try going offline.'
const LATENCY = 320

function Pane({ name, color, text, online, onToggle, onChange, taRef, queued }) {
  return (
    <div className={`sync-pane ${online ? '' : 'off'}`} style={{ '--c': color }}>
      <div className="sync-head mono">
        <span className="who">
          <i className="avatar">{name[0]}</i>
          {name}
        </span>
        <button className={`net ${online ? 'on' : ''}`} onClick={onToggle} aria-pressed={!online}>
          <span className="hb" />
          {online ? 'online' : 'offline'}
        </button>
      </div>
      <textarea
        ref={taRef}
        value={text}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${name}'s editor`}
      />
      <div className="sync-foot mono">{queued > 0 ? `${queued} edit${queued > 1 ? 's' : ''} queued` : 'in sync'}</div>
    </div>
  )
}

export default function SyncDemo() {
  const reps = useRef(null)
  if (!reps.current) {
    const a = new Replica('a')
    const b = new Replica('b')
    a.localChange(SEED).forEach((op) => b.integrate(op))
    reps.current = { a, b }
  }
  const pending = useRef({ ab: [], ba: [] })
  const [online, setOnline] = useState({ a: true, b: true })
  const onlineRef = useRef(online)
  onlineRef.current = online
  const [, force] = useState(0)
  const taA = useRef(null)
  const taB = useRef(null)
  const [log, setLog] = useState([])

  const push = (msg) => setLog((l) => [msg, ...l].slice(0, 3))

  // Apply ops to a replica while keeping that user's caret in place
  const applyRemote = useCallback((who, ops) => {
    const rep = reps.current[who]
    const ta = who === 'a' ? taA.current : taB.current
    const focused = ta && document.activeElement === ta
    let anchor = null
    if (focused) {
      const vis = rep.visible()
      const pos = ta.selectionStart
      anchor = pos > 0 ? vis[pos - 1]?.id : null
    }
    ops.forEach((o) => rep.integrate(o))
    force((n) => n + 1)
    if (focused) {
      requestAnimationFrame(() => {
        const vis = rep.visible()
        const idx = anchor ? vis.findIndex((c) => same(c.id, anchor)) + 1 : 0
        ta.setSelectionRange(idx, idx)
      })
    }
  }, [])

  const flush = useCallback(() => {
    const { a, b } = onlineRef.current
    if (!a || !b) return
    const ab = pending.current.ab.splice(0)
    const ba = pending.current.ba.splice(0)
    if (ab.length || ba.length) {
      setTimeout(() => {
        if (ab.length) applyRemote('b', ab)
        if (ba.length) applyRemote('a', ba)
        if (ab.length && ba.length) push('merged concurrent edits ✓')
      }, LATENCY)
    }
  }, [applyRemote])

  const change = (who) => (val) => {
    const ops = reps.current[who].localChange(val)
    pending.current[who === 'a' ? 'ab' : 'ba'].push(...ops)
    force((n) => n + 1)
    flush()
  }

  const toggle = (who) => () => {
    setOnline((o) => {
      const next = { ...o, [who]: !o[who] }
      onlineRef.current = next
      push(`${who === 'a' ? 'Riya' : 'Kabir'} ${next[who] ? 'reconnected — replaying queue' : 'went offline'}`)
      return next
    })
    setTimeout(flush, 0)
  }

  // Heartbeat: periodically retry delivery
  useEffect(() => {
    const id = setInterval(flush, 1200)
    return () => clearInterval(id)
  }, [flush])

  const ta = reps.current.a.text()
  const tb = reps.current.b.text()
  const synced = ta === tb && !pending.current.ab.length && !pending.current.ba.length

  return (
    <div className="sync">
      <div className="sync-panes">
        <Pane
          name="Riya"
          color="#22d3ee"
          text={ta}
          online={online.a}
          onToggle={toggle('a')}
          onChange={change('a')}
          taRef={taA}
          queued={online.a && online.b ? 0 : pending.current.ab.length}
        />
        <div className={`sync-wire ${online.a && online.b ? 'live' : ''}`} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <Pane
          name="Kabir"
          color="#f472b6"
          text={tb}
          online={online.b}
          onToggle={toggle('b')}
          onChange={change('b')}
          taRef={taB}
          queued={online.a && online.b ? 0 : pending.current.ba.length}
        />
      </div>
      <div className="sync-status mono">
        <span className={synced ? 'ok' : 'warn'}>{synced ? '● documents identical' : '◐ diverged — waiting to sync'}</span>
        <span className="log">{log[0] || 'tip: take one user offline, edit both, reconnect'}</span>
      </div>
    </div>
  )
}
