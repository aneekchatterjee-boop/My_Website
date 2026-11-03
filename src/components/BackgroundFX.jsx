import { useEffect, useRef } from 'react'
import { reducedMotion } from '../lib.js'

/*
 * Ambient background, independent of the cursor:
 *  - a slow-drifting constellation of nodes linked by faint gradient lines,
 *    with "data packets" occasionally travelling along a link
 *  - comets that streak along the page's 80px grid lines
 */
const GRID = 80

const hexToRgb = (h) => {
  const m = h.trim().replace('#', '')
  const n = parseInt(m.length === 3 ? [...m].map((c) => c + c).join('') : m, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export default function BackgroundFX() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let w = 0
    let h = 0
    let dpr = 1
    let nodes = []
    let packets = []
    let comets = []
    let colors = [[167, 139, 250], [34, 211, 238], [244, 114, 182]]
    let raf = 0
    let last = performance.now()
    let colorClock = 0
    let lastW = 0

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement)
      colors = ['--a1', '--a2', '--a3'].map((v) => hexToRgb(cs.getPropertyValue(v) || '#ffffff'))
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Mobile URL-bar show/hide only changes height: keep the existing nodes
      if (nodes.length && Math.abs(w - lastW) < 2) return
      lastW = w
      const count = Math.round(Math.min(90, Math.max(28, (w * h) / 22000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.4 + 0.6,
        c: Math.floor(Math.random() * 3),
        phase: Math.random() * Math.PI * 2,
      }))
      packets = []
      comets = []
    }

    const LINK = () => Math.min(170, Math.max(110, w / 9))

    const spawnComet = () => {
      const horizontal = Math.random() < 0.5
      const dir = Math.random() < 0.5 ? 1 : -1
      const speed = 0.25 + Math.random() * 0.3 // px per ms
      if (horizontal) {
        const y = Math.floor(Math.random() * (h / GRID)) * GRID
        comets.push({ x: dir > 0 ? -200 : w + 200, y, dx: dir * speed, dy: 0, len: 140 + Math.random() * 120, c: Math.floor(Math.random() * 3) })
      } else {
        const x = Math.floor(Math.random() * (w / GRID)) * GRID
        comets.push({ x, y: dir > 0 ? -200 : h + 200, dx: 0, dy: dir * speed, len: 140 + Math.random() * 120, c: Math.floor(Math.random() * 3) })
      }
    }

    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

    const draw = (now) => {
      const dt = Math.min(50, now - last)
      last = now
      colorClock += dt
      if (colorClock > 1000) {
        colorClock = 0
        readColors()
      }
      ctx.clearRect(0, 0, w, h)
      const link = LINK()
      const t = now / 1000

      // move nodes, wrap softly around the edges
      for (const n of nodes) {
        n.x += n.vx * dt * 0.2
        n.y += n.vy * dt * 0.2
        if (n.x < -20) n.x = w + 20
        if (n.x > w + 20) n.x = -20
        if (n.y < -20) n.y = h + 20
        if (n.y > h + 20) n.y = -20
      }

      // links
      ctx.lineWidth = 1
      const pairs = []
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < link * link) {
            const k = 1 - Math.sqrt(d2) / link
            const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
            g.addColorStop(0, rgba(colors[a.c], k * 0.3))
            g.addColorStop(1, rgba(colors[b.c], k * 0.3))
            ctx.strokeStyle = g
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
            if (k > 0.35) pairs.push([a, b])
          }
        }
      }

      // nodes with a gentle twinkle
      for (const n of nodes) {
        const tw = 0.55 + 0.45 * Math.sin(t * 1.3 + n.phase)
        ctx.fillStyle = rgba(colors[n.c], 0.35 + tw * 0.45)
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * (0.8 + tw * 0.4), 0, Math.PI * 2)
        ctx.fill()
      }

      // data packets travelling along links
      if (!reducedMotion && pairs.length && packets.length < 6 && Math.random() < dt / 700) {
        const [a, b] = pairs[Math.floor(Math.random() * pairs.length)]
        packets.push({ a, b, p: 0, c: a.c, speed: 0.0006 + Math.random() * 0.0006 })
      }
      packets = packets.filter((pk) => {
        pk.p += pk.speed * dt
        if (pk.p >= 1) return false
        const x = pk.a.x + (pk.b.x - pk.a.x) * pk.p
        const y = pk.a.y + (pk.b.y - pk.a.y) * pk.p
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10)
        glow.addColorStop(0, rgba(colors[pk.c], 0.9))
        glow.addColorStop(1, rgba(colors[pk.c], 0))
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, 10, 0, Math.PI * 2)
        ctx.fill()
        return true
      })

      // comets along grid lines
      if (!reducedMotion && comets.length < 3 && Math.random() < dt / 2600) spawnComet()
      comets = comets.filter((c) => {
        c.x += c.dx * dt
        c.y += c.dy * dt
        const tx = c.x - Math.sign(c.dx) * c.len
        const ty = c.y - Math.sign(c.dy) * c.len
        const g = ctx.createLinearGradient(tx, ty, c.x, c.y)
        g.addColorStop(0, rgba(colors[c.c], 0))
        g.addColorStop(1, rgba(colors[c.c], 0.55))
        ctx.strokeStyle = g
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(c.x, c.y)
        ctx.stroke()
        ctx.fillStyle = rgba(colors[c.c], 0.9)
        ctx.beginPath()
        ctx.arc(c.x, c.y, 1.6, 0, Math.PI * 2)
        ctx.fill()
        return c.x > -400 && c.x < w + 400 && c.y > -400 && c.y < h + 400
      })

      if (!reducedMotion) raf = requestAnimationFrame(draw)
    }

    const onVis = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(draw)
      }
    }

    readColors()
    resize()
    raf = requestAnimationFrame(draw) // with reduced motion this paints one static frame
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas className="bg-fx" ref={ref} aria-hidden="true" />
}
