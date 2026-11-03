import { useState } from 'react'
import { profile } from '../data.js'
import Magnetic from './Magnetic.jsx'

export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (!f.name.trim()) err.name = 'required'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) err.email = 'enter a valid email'
    if (f.message.trim().length < 10) err.message = 'at least 10 characters'
    setErrors(err)
    if (Object.keys(err).length) return
    const body = `${f.message}\n\n— ${f.name} (${f.email})`
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
      f.subject || `Hello from ${f.name}`,
    )}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="section contact" id="contact">
      <header className="section-head">
        <span className="section-num mono">05 — Contact</span>
        <h2 className="reveal big">
          Let’s build <br />
          <em className="grad">something.</em>
        </h2>
      </header>

      <div className="contact-grid">
        <div className="contact-side reveal">
          <p className="lead">Have an idea, a project, or just want to talk code? My inbox is open.</p>
          <Magnetic>
            <button className="email-big mono" onClick={copy} data-hover>
              {profile.email}
              <span className="copy-tag">{copied ? 'copied ✓' : 'click to copy'}</span>
            </button>
          </Magnetic>
          <div className="socials">
            <Magnetic>
              <a className="btn btn-ghost" href={profile.github} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
            </Magnetic>
            <Magnetic>
              <a className="btn btn-ghost" href={`mailto:${profile.email}`}>
                Email ↗
              </a>
            </Magnetic>
          </div>
        </div>

        <form className="contact-form glass reveal" onSubmit={submit} noValidate data-delay="0.1">
          {sent ? (
            <div className="sent mono">
              <p>
                <span className="prompt">$</span> message --send
              </p>
              <p className="ok">✓ opening your mail app with the message ready</p>
              <p className="muted">Thanks, {f.name.split(' ')[0]}. I’ll get back to you soon.</p>
              <button type="button" className="btn btn-ghost" onClick={() => setSent(false)}>
                ↺ write another
              </button>
            </div>
          ) : (
            <>
              <div className="row2">
                <Field label="name" error={errors.name}>
                  <input value={f.name} onChange={set('name')} autoComplete="name" />
                </Field>
                <Field label="email" error={errors.email}>
                  <input type="email" value={f.email} onChange={set('email')} autoComplete="email" />
                </Field>
              </div>
              <Field label="subject">
                <input value={f.subject} onChange={set('subject')} />
              </Field>
              <Field label="message" error={errors.message}>
                <textarea rows={5} value={f.message} onChange={set('message')} />
              </Field>
              <Magnetic>
                <button className="btn btn-primary" type="submit">
                  Send message →
                </button>
              </Magnetic>
            </>
          )}
        </form>
      </div>
    </section>
  )
}

function Field({ label, error, children }) {
  return (
    <label className={`f ${error ? 'bad' : ''}`}>
      <span className="mono">
        {label}
        {error && <em> · {error}</em>}
      </span>
      {children}
    </label>
  )
}
