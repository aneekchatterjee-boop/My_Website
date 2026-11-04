import { useEffect, useRef } from 'react'
import { reducedMotion } from '../lib.js'

/*
 * Ambient background, independent of the cursor:
 * a line-art satellite drifts across the screen, slowly tumbling, and rebounds
 * off the edges of the viewport (each bounce sends out a ripple). It leaves a
 * faint orbit trail and pings radio waves from its dish. A sparse starfield
 * twinkles behind it.
 */
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
    let lastW = 0
    let stars = []
    let colors = [[167, 139, 250], [34, 211, 238], [244, 114, 182]]
    let raf = 0
    let last = performance.now()
    let colorClock = 0

    const sat = { x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, s: 1, R: 70 }
    let trail = []
    let ripples = []
    let waves = []
    let waveClock = 0

    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement)
      colors = ['--a1', '--a2', '--a3'].map((v) => hexToRgb(cs.getPropertyValue(v) || '#ffffff'))
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      sat.s = w < 640 ? 1 : w < 1100 ? 1.3 : 1.6
      sat.R = 66 * sat.s // collision radius (covers panels at any rotation)
      sat.x = Math.min(Math.max(sat.x || w * 0.3, sat.R), w - sat.R)
      sat.y = Math.min(Math.max(sat.y || h * 0.35, sat.R), h - sat.R)

      // Mobile URL-bar show/hide only changes height: keep the existing scene
      if (lastW && Math.abs(w - lastW) < 2) return
      lastW = w
      const speed = (w < 640 ? 0.045 : 0.06) // px per ms
      const dir = Math.random() * Math.PI * 2
      sat.vx = Math.cos(dir) * speed || speed
      sat.vy = Math.sin(dir) * speed || speed
      sat.va = 0.00018 * (Math.random() < 0.5 ? -1 : 1)
      trail = []
      const count = Math.round(Math.min(110, Math.max(40, (w * h) / 16000)))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.3,
        c: Math.floor(Math.random() * 3),
        phase: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.4,
      }))
    }

    // Satellite drawn in local coordinates, centred on the body
    const drawSatellite = (t) => {
      const [c1, c2, c3] = colors
      ctx.save()
      ctx.translate(sat.x, sat.y)
      ctx.rotate(sat.a)
      ctx.scale(sat.s, sat.s)
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      // soft halo
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 90)
      halo.addColorStop(0, rgba(c2, 0.22))
      halo.addColorStop(1, rgba(c2, 0))
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(0, 0, 90, 0, Math.PI * 2)
      ctx.fill()

      // struts
      ctx.strokeStyle = rgba(c2, 0.85)
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(-14, 0)
      ctx.lineTo(-22, 0)
      ctx.moveTo(14, 0)
      ctx.lineTo(22, 0)
      ctx.stroke()

      // solar panels with cell grid
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? -66 : 22
        const pw = 44
        const ph = 22
        const g = ctx.createLinearGradient(x0, -ph / 2, x0 + pw, ph / 2)
        g.addColorStop(0, rgba(c1, 0.38))
        g.addColorStop(1, rgba(c2, 0.24))
        ctx.fillStyle = g
        ctx.strokeStyle = rgba(c1, 1)
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.rect(x0, -ph / 2, pw, ph)
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = rgba(c1, 0.6)
        ctx.lineWidth = 0.9
        ctx.beginPath()
        for (let i = 1; i < 4; i++) {
          ctx.moveTo(x0 + (pw / 4) * i, -ph / 2)
          ctx.lineTo(x0 + (pw / 4) * i, ph / 2)
        }
        ctx.moveTo(x0, 0)
        ctx.lineTo(x0 + pw, 0)
        ctx.stroke()
        // glint sweeping across the panel
        const gx = x0 + ((t * 0.04 + (side > 0 ? 22 : 0)) % (pw + 30)) - 15
        if (gx > x0 && gx < x0 + pw) {
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(gx, -ph / 2)
          ctx.lineTo(Math.min(x0 + pw, gx + 6), ph / 2)
          ctx.stroke()
        }
      }

      // body
      const bg = ctx.createLinearGradient(-14, -18, 14, 18)
      bg.addColorStop(0, rgba(c1, 0.55))
      bg.addColorStop(1, rgba(c3, 0.4))
      ctx.fillStyle = '#0d0d16'
      ctx.strokeStyle = rgba(c2, 1)
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.roundRect(-14, -18, 28, 36, 5)
      ctx.fill()
      ctx.fillStyle = bg
      ctx.fill()
      ctx.stroke()
      ctx.strokeStyle = rgba(c2, 0.6)
      ctx.lineWidth = 0.9
      ctx.beginPath()
      ctx.moveTo(-14, -6)
      ctx.lineTo(14, -6)
      ctx.moveTo(-14, 6)
      ctx.lineTo(14, 6)
      ctx.stroke()

      // dish + antenna on top
      ctx.strokeStyle = rgba(c2, 1)
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(0, -18)
      ctx.lineTo(0, -24)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(0, -28, 12, 5, 0, Math.PI, 0)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, -28)
      ctx.lineTo(0, -38)
      ctx.stroke()

      // blinking beacon
      const blink = (Math.sin(t / 260) + 1) / 2
      const bc = ctx.createRadialGradient(0, -39, 0, 0, -39, 9)
      bc.addColorStop(0, rgba(c3, 0.9 * blink + 0.1))
      bc.addColorStop(1, rgba(c3, 0))
      ctx.fillStyle = bc
      ctx.beginPath()
      ctx.arc(0, -39, 9, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    const draw = (now) => {
      const dt = Math.min(50, now - last)
      last = now
      colorClock += dt
      if (colorClock > 1000) {
        colorClock = 0
        readColors()
      }
      ctx.clearRect(0, 0, w, h)
      const t = now

      // starfield
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin((t / 1000) * s.sp + s.phase)
        ctx.fillStyle = rgba(colors[s.c], 0.15 + tw * 0.5)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!reducedMotion) {
        // move + rebound off the viewport edges
        sat.x += sat.vx * dt
        sat.y += sat.vy * dt
        sat.a += sat.va * dt
        const hit = (x, y) => {
          ripples.push({ x, y, r: 0, life: 1 })
          sat.va = -sat.va * (0.8 + Math.random() * 0.5) // a knock changes the tumble
          if (Math.abs(sat.va) < 0.00008) sat.va = 0.00015 * Math.sign(sat.va || 1)
          if (Math.abs(sat.va) > 0.0005) sat.va = 0.0005 * Math.sign(sat.va)
        }
        if (sat.x < sat.R) {
          sat.x = sat.R
          sat.vx = Math.abs(sat.vx)
          hit(0, sat.y)
        } else if (sat.x > w - sat.R) {
          sat.x = w - sat.R
          sat.vx = -Math.abs(sat.vx)
          hit(w, sat.y)
        }
        if (sat.y < sat.R) {
          sat.y = sat.R
          sat.vy = Math.abs(sat.vy)
          hit(sat.x, 0)
        } else if (sat.y > h - sat.R) {
          sat.y = h - sat.R
          sat.vy = -Math.abs(sat.vy)
          hit(sat.x, h)
        }

        trail.push([sat.x, sat.y])
        if (trail.length > 260) trail.shift()

        // radio pings from the dish
        waveClock += dt
        if (waveClock > 2600) {
          waveClock = 0
          for (let i = 0; i < 3; i++) waves.push({ r: 0, delay: i * 220, a: sat.a })
        }
      }

      // dotted orbit trail, fading out behind the satellite
      for (let i = 0; i < trail.length; i += 4) {
        const k = i / trail.length
        ctx.fillStyle = rgba(colors[1], k * 0.7)
        ctx.beginPath()
        ctx.arc(trail[i][0], trail[i][1], 0.6 + k * 0.9, 0, Math.PI * 2)
        ctx.fill()
      }

      // bounce ripples
      ripples = ripples.filter((r) => {
        r.r += dt * 0.12
        r.life -= dt / 1400
        if (r.life <= 0) return false
        for (let i = 0; i < 2; i++) {
          const rr = r.r - i * 22
          if (rr <= 0) continue
          ctx.strokeStyle = rgba(colors[2], r.life * 0.75)
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(r.x, r.y, rr, 0, Math.PI * 2)
          ctx.stroke()
        }
        return true
      })

      // radio waves (arcs emitted "upward" from the dish in the satellite's frame)
      waves = waves.filter((wv) => {
        if (wv.delay > 0) {
          wv.delay -= dt
          return true
        }
        wv.r += dt * 0.07
        const life = 1 - wv.r / 110
        if (life <= 0) return false
        ctx.save()
        ctx.translate(sat.x, sat.y)
        ctx.rotate(sat.a)
        ctx.scale(sat.s, sat.s)
        ctx.strokeStyle = rgba(colors[1], life * 0.85)
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.arc(0, -40, 10 + wv.r, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55)
        ctx.stroke()
        ctx.restore()
        return true
      })

      drawSatellite(t)

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
    raf = requestAnimationFrame(draw) // with reduced motion this paints one still frame
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
