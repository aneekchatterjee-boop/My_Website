import { useEffect, useRef, useState } from 'react'

const enc = new TextEncoder()
const dec = new TextDecoder()
const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const hex = (buf, n = 64) =>
  [...new Uint8Array(buf).slice(0, n)].map((b) => b.toString(16).padStart(2, '0')).join(' ')
const rand = (n) => crypto.getRandomValues(new Uint8Array(n))
const ITER = 150000
const MAX = 5 * 1024 * 1024

// Key = PBKDF2(passkey ⊕ link secret). The link secret lives in the URL #fragment,
// so the server never sees either half of the key.
async function deriveKey(passkey, linkSecret, salt) {
  const material = await crypto.subtle.importKey('raw', enc.encode(`${passkey}.${b64u(linkSecret)}`), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

const fmtSize = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`)

export default function EphemeraDemo() {
  const [mode, setMode] = useState('text')
  const [text, setText] = useState('Meet at 6. The slides are in the shared drive.')
  const [file, setFile] = useState(null)
  const [pass, setPass] = useState('')
  const [ttl, setTtl] = useState(60)
  const [phase, setPhase] = useState('compose') // compose | working | sent | opened | burned
  const [steps, setSteps] = useState([])
  const [vault, setVault] = useState(null)
  const [left, setLeft] = useState(0)
  const [guess, setGuess] = useState('')
  const [err, setErr] = useState('')
  const [out, setOut] = useState(null)
  const fileRef = useRef(null)

  const supported = typeof crypto !== 'undefined' && !!crypto.subtle

  useEffect(() => {
    if (phase !== 'sent') return
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id)
          setVault(null)
          setPhase('burned')
          setOut(null)
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => () => out?.url && URL.revokeObjectURL(out.url), [out])

  const step = (s) => setSteps((x) => [...x, s])

  const send = async () => {
    setErr('')
    if (pass.length < 4) return setErr('Use a passkey of at least 4 characters.')
    let bytes, name, type
    if (mode === 'text') {
      if (!text.trim()) return setErr('Write a message first.')
      bytes = enc.encode(text)
      name = null
      type = 'text/plain'
    } else {
      if (!file) return setErr('Choose a file first.')
      if (file.size > MAX) return setErr('Demo limit is 5 MB.')
      bytes = new Uint8Array(await file.arrayBuffer())
      name = file.name
      type = file.type || 'application/octet-stream'
    }
    setPhase('working')
    setSteps([])
    const salt = rand(16)
    const iv = rand(12)
    const linkSecret = rand(16)
    const t0 = performance.now()
    const key = await deriveKey(pass, linkSecret, salt)
    step(`derived AES-256 key · PBKDF2-SHA256 × ${ITER.toLocaleString()} · ${Math.round(performance.now() - t0)} ms`)
    await new Promise((r) => setTimeout(r, 350))
    const t1 = performance.now()
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes)
    step(`encrypted ${fmtSize(bytes.length)} · AES-GCM · ${Math.max(1, Math.round(performance.now() - t1))} ms`)
    await new Promise((r) => setTimeout(r, 350))
    step('“uploaded” ciphertext only — no key, no passkey')
    await new Promise((r) => setTimeout(r, 350))
    const id = b64u(rand(6))
    setVault({ id, salt, iv, cipher, linkSecret, name, type, plainSize: bytes.length })
    setLeft(ttl)
    setGuess('')
    setPhase('sent')
  }

  const open = async () => {
    setErr('')
    try {
      const key = await deriveKey(guess, vault.linkSecret, vault.salt)
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: vault.iv }, key, vault.cipher)
      if (vault.name) {
        const url = URL.createObjectURL(new Blob([plain], { type: vault.type }))
        setOut({ file: vault.name, url })
      } else setOut({ text: dec.decode(plain) })
      setVault(null) // one-time: wipe the "server" copy
      setPhase('opened')
    } catch {
      setErr('Decryption failed — wrong passkey (GCM auth tag rejected).')
    }
  }

  const reset = () => {
    setPhase('compose')
    setVault(null)
    setOut(null)
    setErr('')
    setSteps([])
  }

  if (!supported)
    return <p className="muted">Your browser doesn’t expose the Web Crypto API here (it needs HTTPS).</p>

  const R = 20
  const C = 2 * Math.PI * R

  return (
    <div className="eph">
      {(phase === 'compose' || phase === 'working') && (
        <div className="eph-compose">
          <div className="seg mono" role="tablist">
            <button role="tab" aria-selected={mode === 'text'} className={mode === 'text' ? 'on' : ''} onClick={() => setMode('text')}>
              message
            </button>
            <button role="tab" aria-selected={mode === 'file'} className={mode === 'file' ? 'on' : ''} onClick={() => setMode('file')}>
              file
            </button>
          </div>
          {mode === 'text' ? (
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} aria-label="Secret message" />
          ) : (
            <button
              className="drop"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                setFile(e.dataTransfer.files[0] || null)
              }}
            >
              <input ref={fileRef} type="file" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
              {file ? (
                <span className="mono">
                  {file.name} · {fmtSize(file.size)}
                </span>
              ) : (
                <span>Drop a file or click to choose (stays on your device)</span>
              )}
            </button>
          )}
          <div className="eph-row">
            <label className="field">
              <span className="mono">passkey</span>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="share this separately" />
            </label>
            <label className="field narrow">
              <span className="mono">self-destruct</span>
              <select value={ttl} onChange={(e) => setTtl(Number(e.target.value))}>
                <option value={30}>30 s</option>
                <option value={60}>60 s</option>
                <option value={120}>2 min</option>
              </select>
            </label>
          </div>
          {err && <p className="err mono">{err}</p>}
          <button className="btn btn-accent wide" onClick={send} disabled={phase === 'working'}>
            {phase === 'working' ? 'Encrypting…' : 'Encrypt & create link'}
          </button>
          {steps.length > 0 && (
            <ul className="steps mono">
              {steps.map((s) => (
                <li key={s}>✓ {s}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {phase === 'sent' && vault && (
        <div className="eph-sent">
          <div className="link-row">
            <div className="link mono" title="The part after # never leaves the browser">
              <span className="host">…/d/{vault.id}</span>
              <span className="frag">#{b64u(vault.linkSecret)}</span>
            </div>
            <div className="ttl" aria-label={`${left} seconds left`}>
              <svg viewBox="0 0 48 48">
                <circle cx="24" cy="24" r={R} className="track" />
                <circle cx="24" cy="24" r={R} className="bar" strokeDasharray={C} strokeDashoffset={C - (C * left) / ttl} />
              </svg>
              <b className="mono">{left}</b>
            </div>
          </div>
          <div className="server-view">
            <span className="tile-label mono">what the server stores</span>
            <code className="cipher mono">{hex(vault.cipher)}…</code>
            <span className="mono meta">
              {fmtSize(vault.cipher.byteLength)} ciphertext · iv + salt · <b>no key</b>
            </span>
          </div>
          <div className="eph-row end">
            <label className="field">
              <span className="mono">recipient: enter passkey</span>
              <input
                type="password"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && open()}
                placeholder="try a wrong one first"
              />
            </label>
            <button className="btn btn-accent" onClick={open}>
              Open once
            </button>
          </div>
          {err && <p className="err mono">{err}</p>}
        </div>
      )}

      {phase === 'opened' && out && (
        <div className="eph-done">
          <span className="tile-label mono">decrypted · server copy destroyed</span>
          {out.text ? (
            <blockquote>{out.text}</blockquote>
          ) : (
            <a className="btn btn-ghost" href={out.url} download={out.file}>
              Download {out.file}
            </a>
          )}
          <p className="muted small">The link is now dead. Opening it again would return 404.</p>
          <button className="btn btn-ghost mono" onClick={reset}>
            ↺ send another
          </button>
        </div>
      )}

      {phase === 'burned' && (
        <div className="eph-done burned">
          <span className="burn" aria-hidden="true">
            ✕
          </span>
          <p>Link expired. The ciphertext was wiped before anyone opened it.</p>
          <button className="btn btn-ghost mono" onClick={reset}>
            ↺ try again
          </button>
        </div>
      )}
    </div>
  )
}
