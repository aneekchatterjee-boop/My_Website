import { profile } from '../data.js'
import { scrollToId } from '../lib.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-big" aria-hidden="true">
        ANEEK<span className="grad">.</span>
      </div>
      <div className="footer-row mono">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span className="muted">Designed with curiosity. Built through learning.</span>
        <button onClick={() => scrollToId('top')}>back to top ↑</button>
      </div>
    </footer>
  )
}
