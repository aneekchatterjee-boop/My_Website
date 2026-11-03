import { useEffect, useMemo, useRef, useState } from 'react'

const presets = {
  normal: { label: 'Coffee run', amount: 240, hour: 9, newDevice: false, foreignIp: false, velocity: 1, linked: false },
  spree: { label: 'Midnight spree', amount: 38000, hour: 2, newDevice: false, foreignIp: false, velocity: 9, linked: false },
  takeover: { label: 'Account takeover', amount: 92000, hour: 3, newDevice: true, foreignIp: true, velocity: 4, linked: true },
}

const STAGES = ['Ingest', 'Rule scoring', 'Graph traversal', 'Risk fusion']

function score(tx) {
  const rules = []
  if (tx.amount > 20000) rules.push(['High amount', Math.min(30, Math.round((tx.amount / 100000) * 30) + 8)])
  if (tx.hour < 6) rules.push(['Unusual hour', 15])
  if (tx.velocity > 4) rules.push(['High velocity', Math.min(25, tx.velocity * 2.5)])
  if (tx.newDevice) rules.push(['New device', 15])
  if (tx.foreignIp) rules.push(['Foreign IP', 15])
  const rule = Math.min(100, rules.reduce((a, [, v]) => a + v, 0))

  let graph = 0
  const edges = []
  if (tx.linked) {
    graph += 65
    edges.push('Device shared with flagged account')
  }
  if (tx.newDevice && tx.foreignIp) {
    graph += 20
    edges.push('New device + foreign IP cluster')
  }
  graph = Math.min(100, graph)
  const fused = Math.round(Math.min(100, rule * 0.55 + graph * 0.45 + (rule > 40 && graph > 40 ? 12 : 0)))
  const verdict = fused >= 65 ? 'block' : fused >= 35 ? 'review' : 'clear'
  return { rules, rule: Math.round(rule), graph, edges, fused, verdict }
}

function Graph({ tx, lit }) {
  const red = 'var(--danger)'
  const ok = 'rgba(255,255,255,.22)'
  const n = {
    acc: [125, 92],
    dev: [45, 30],
    ip: [205, 30],
    mer: [175, 165],
    flag: [45, 160],
  }
  const edge = (a, b, bad, show = true) =>
    show && (
      <line
        x1={n[a][0]} y1={n[a][1]} x2={n[b][0]} y2={n[b][1]}
        stroke={lit && bad ? red : ok}
        strokeWidth={lit && bad ? 2.2 : 1.2}
        strokeDasharray={bad ? '4 4' : '0'}
        className={lit && bad ? 'edge-hot' : ''}
      />
    )
  const node = (k, label, bad) => (
    <g key={k} transform={`translate(${n[k][0]} ${n[k][1]})`}>
      <circle r={k === 'acc' ? 17 : 12} fill={lit && bad ? 'rgba(248,113,113,.18)' : 'rgba(255,255,255,.05)'} stroke={lit && bad ? red : 'rgba(255,255,255,.35)'} />
      <text y={k === 'acc' ? 33 : 27} textAnchor="middle">{label}</text>
    </g>
  )
  return (
    <svg viewBox="-10 0 270 200" className="fraud-graph" role="img" aria-label="Entity graph for this transaction">
      {edge('acc', 'dev', tx.newDevice)}
      {edge('acc', 'ip', tx.foreignIp)}
      {edge('acc', 'mer', tx.amount > 20000)}
      {edge('dev', 'flag', true, tx.linked)}
      {node('acc', 'account', tx.linked)}
      {node('dev', tx.newDevice ? 'new device' : 'device', tx.newDevice)}
      {node('ip', tx.foreignIp ? 'foreign IP' : 'IP', tx.foreignIp)}
      {node('mer', 'merchant', tx.amount > 20000)}
      {tx.linked && node('flag', 'flagged acct', true)}
    </svg>
  )
}

export default function FraudDemo() {
  const [tx, setTx] = useState(presets.takeover)
  const [stage, setStage] = useState(-1)
  const [shown, setShown] = useState(0)
  const result = useMemo(() => score(tx), [tx])
  const timers = useRef([])

  const run = () => {
    timers.current.forEach(clearTimeout)
    setStage(0)
    setShown(0)
    timers.current = STAGES.map((_, i) => setTimeout(() => setStage(i + 1), (i + 1) * 520))
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  // Re-run whenever inputs change, for an instant "live" feel
  useEffect(() => {
    run()
  }, [tx]) // eslint-disable-line react-hooks/exhaustive-deps

  // Count the gauge up once fusion completes
  useEffect(() => {
    if (stage < STAGES.length) return
    let raf
    const start = performance.now()
    const tick = (t) => {
      const k = Math.min(1, (t - start) / 700)
      setShown(Math.round(result.fused * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stage, result.fused])

  const set = (k) => (e) =>
    setTx((t) => ({ ...t, label: 'Custom', [k]: e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value) }))

  const done = stage >= STAGES.length
  const C = 2 * Math.PI * 42

  return (
    <div className="fraud">
      <div className="presets">
        {Object.entries(presets).map(([k, p]) => (
          <button key={k} className={`pill ${tx.label === p.label ? 'on' : ''}`} onClick={() => setTx(p)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="fraud-grid">
        <div className="fraud-controls">
          <label>
            <span>Amount <b className="mono">₹{tx.amount.toLocaleString('en-IN')}</b></span>
            <input type="range" min="50" max="100000" step="50" value={tx.amount} onChange={set('amount')} />
          </label>
          <label>
            <span>Hour <b className="mono">{String(tx.hour).padStart(2, '0')}:00</b></span>
            <input type="range" min="0" max="23" value={tx.hour} onChange={set('hour')} />
          </label>
          <label>
            <span>Txns in last hour <b className="mono">{tx.velocity}</b></span>
            <input type="range" min="0" max="12" value={tx.velocity} onChange={set('velocity')} />
          </label>
          <div className="toggles">
            <label className="tog"><input type="checkbox" checked={tx.newDevice} onChange={set('newDevice')} /><i />New device</label>
            <label className="tog"><input type="checkbox" checked={tx.foreignIp} onChange={set('foreignIp')} /><i />Foreign IP</label>
            <label className="tog"><input type="checkbox" checked={tx.linked} onChange={set('linked')} /><i />Linked to flagged acct</label>
          </div>
        </div>

        <div className="fraud-out">
          <ol className="stages mono">
            {STAGES.map((s, i) => (
              <li key={s} className={stage > i ? 'done' : stage === i ? 'run' : ''}>
                <span className="b" />
                {s}
              </li>
            ))}
          </ol>
          <div className="fraud-viz">
            <Graph tx={tx} lit={stage >= 3} />
            <div className={`gauge v-${done ? result.verdict : 'idle'}`}>
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" className="track" />
                <circle cx="50" cy="50" r="42" className="bar" strokeDasharray={C} strokeDashoffset={C - (C * shown) / 100} />
              </svg>
              <div className="gauge-c">
                <b className="mono">{shown}</b>
                <span className="mono">{done ? result.verdict : 'scoring…'}</span>
              </div>
            </div>
          </div>
          <ul className="reasons mono">
            {done && result.rules.length + result.edges.length === 0 && <li className="ok">No risk signals — looks normal</li>}
            {done && result.rules.map(([r, v]) => <li key={r}>+{Math.round(v)} {r}</li>)}
            {done && result.edges.map((e) => <li key={e} className="g">graph: {e}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
