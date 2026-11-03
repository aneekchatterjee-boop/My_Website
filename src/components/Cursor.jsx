import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { finePointer, reducedMotion } from '../lib.js'

// Dot + trailing ring cursor, plus a soft glow that follows the pointer
export default function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const glow = useRef(null)

  useEffect(() => {
    if (!finePointer) return
    document.documentElement.classList.add('has-cursor')
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08 })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.08 })
    const rx = gsap.quickTo(ring.current, 'x', { duration: reducedMotion ? 0.1 : 0.45, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: reducedMotion ? 0.1 : 0.45, ease: 'power3' })
    const gx = gsap.quickTo(glow.current, 'x', { duration: 1.2, ease: 'power3' })
    const gy = gsap.quickTo(glow.current, 'y', { duration: 1.2, ease: 'power3' })

    const move = (e) => {
      dx(e.clientX); dy(e.clientY)
      rx(e.clientX); ry(e.clientY)
      gx(e.clientX); gy(e.clientY)
    }
    const over = (e) => {
      const hot = e.target.closest('a, button, input, textarea, select, label, [data-hover]')
      ring.current.classList.toggle('hot', !!hot)
    }
    const down = () => ring.current.classList.add('down')
    const up = () => ring.current.classList.remove('down')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerover', over)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  if (!finePointer) return null
  return (
    <>
      <div className="cursor-glow" ref={glow} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true" />
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
    </>
  )
}
