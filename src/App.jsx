import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Projects from './components/Projects.jsx'
import Journey from './components/Journey.jsx'
import Interests from './components/Interests.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import Terminal from './components/Terminal.jsx'
import Cursor from './components/Cursor.jsx'
import BackgroundFX from './components/BackgroundFX.jsx'
import { reducedMotion, setLenis, getLenis } from './lib.js'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const [termOpen, setTermOpen] = useState(false)

  // Smooth scroll wired into GSAP's ticker
  useEffect(() => {
    if (reducedMotion) return
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    setLenis(lenis)
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  // Generic reveal-on-scroll for anything tagged .reveal
  useEffect(() => {
    if (reducedMotion) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'))
      return
    }
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 48, opacity: 0, filter: 'blur(8px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 1.1,
            ease: 'expo.out',
            delay: Number(el.dataset.delay || 0),
            scrollTrigger: { trigger: el, start: 'top 88%' },
          },
        )
      })
    })
    return () => ctx.revert()
  }, [])

  // Terminal hotkey: backtick
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase()
      const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable
      if (e.key === '`' && !typing) {
        e.preventDefault()
        setTermOpen((o) => !o)
      } else if (e.key === 'Escape') setTermOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const l = getLenis()
    if (!l) return
    if (termOpen) l.stop()
    else l.start()
  }, [termOpen])

  return (
    <>
      <div className="bg-aurora" aria-hidden="true" />
      <BackgroundFX />
      <div className="bg-grain" aria-hidden="true" />
      <Cursor />
      <Nav onTerminal={() => setTermOpen(true)} />
      <main>
        <Hero onTerminal={() => setTermOpen(true)} />
        <About />
        <Projects />
        <Journey />
        <Interests />
        <Contact />
      </main>
      <Footer />
      <Terminal open={termOpen} onClose={() => setTermOpen(false)} />
    </>
  )
}
