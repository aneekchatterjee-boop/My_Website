import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { reducedMotion } from '../lib.js'

const COUNT = typeof window !== 'undefined' && window.innerWidth < 768 ? 2600 : 5200

// Target shapes the particle cloud morphs between
function sphere(n) {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const r = 2.1
    a[i * 3] = r * Math.cos(theta) * Math.sin(phi)
    a[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
    a[i * 3 + 2] = r * Math.cos(phi)
  }
  return a
}
function torusKnot(n) {
  const a = new Float32Array(n * 3)
  const p = 2, q = 3
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    const r = 1.35 + 0.55 * Math.cos(q * t)
    const ring = (i * 2.399963) % (Math.PI * 2)
    const tube = 0.28
    const cx = r * Math.cos(p * t)
    const cy = r * Math.sin(p * t)
    const cz = 0.55 * Math.sin(q * t)
    a[i * 3] = cx + tube * Math.cos(ring) * Math.cos(p * t)
    a[i * 3 + 1] = cy + tube * Math.cos(ring) * Math.sin(p * t)
    a[i * 3 + 2] = cz + tube * Math.sin(ring)
  }
  return a
}
function galaxy(n) {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const arm = i % 3
    const d = Math.pow(Math.random(), 0.7) * 2.8
    const ang = d * 1.6 + (arm * Math.PI * 2) / 3
    const spread = 0.22 * (1 - d / 3.2) + 0.05
    a[i * 3] = Math.cos(ang) * d + (Math.random() - 0.5) * spread * 2
    a[i * 3 + 1] = (Math.random() - 0.5) * spread
    a[i * 3 + 2] = Math.sin(ang) * d + (Math.random() - 0.5) * spread * 2
  }
  return a
}

function helix(n) {
  // DNA double helix: two strands plus connecting base-pair rungs
  const a = new Float32Array(n * 3)
  const H = 4.4, R = 0.95, TURNS = 2.2, RUNGS = 26
  for (let i = 0; i < n; i++) {
    const kind = i % 4
    let x, y, z
    if (kind < 3) {
      const t = Math.random()
      const ang = t * Math.PI * 2 * TURNS + (kind % 2) * Math.PI
      const j = 0.06
      x = Math.cos(ang) * R + (Math.random() - 0.5) * j
      z = Math.sin(ang) * R + (Math.random() - 0.5) * j
      y = (t - 0.5) * H + (Math.random() - 0.5) * j
    } else {
      const k = Math.floor(Math.random() * RUNGS)
      const t = (k + 0.5) / RUNGS
      const ang = t * Math.PI * 2 * TURNS
      const u = Math.random() * 2 - 1
      x = Math.cos(ang) * R * u
      z = Math.sin(ang) * R * u
      y = (t - 0.5) * H + (Math.random() - 0.5) * 0.03
    }
    a[i * 3] = x
    a[i * 3 + 1] = y
    a[i * 3 + 2] = z
  }
  return a
}
function cubeGrid(n) {
  const a = new Float32Array(n * 3)
  const side = Math.ceil(Math.cbrt(n))
  const size = 3
  const step = size / (side - 1)
  // Spread the n points evenly across the side³ lattice slots
  const total = side * side * side
  for (let i = 0; i < n; i++) {
    const slot = Math.floor((i * total) / n)
    const x = slot % side
    const y = Math.floor(slot / side) % side
    const z = Math.floor(slot / (side * side))
    a[i * 3] = x * step - size / 2
    a[i * 3 + 1] = y * step - size / 2
    a[i * 3 + 2] = z * step - size / 2
  }
  return a
}
function initials(n, text = 'AC') {
  // Rasterise the text to an offscreen canvas and sample its filled pixels
  const W = 520, Hc = 260
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = Hc
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '800 220px "Space Grotesk", system-ui, sans-serif'
  ctx.fillText(text, W / 2, Hc / 2 + 8)
  const data = ctx.getImageData(0, 0, W, Hc).data
  const pts = []
  for (let y = 0; y < Hc; y += 2)
    for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) pts.push(x, y)
  const a = new Float32Array(n * 3)
  const count = pts.length / 2
  const scale = 4.6 / W
  for (let i = 0; i < n; i++) {
    const k = count ? Math.floor(Math.random() * count) * 2 : 0
    a[i * 3] = (pts[k] - W / 2) * scale + (Math.random() - 0.5) * 0.02
    a[i * 3 + 1] = -(pts[k + 1] - Hc / 2) * scale + (Math.random() - 0.5) * 0.02
    a[i * 3 + 2] = (Math.random() - 0.5) * 0.35
  }
  return a
}

function Particles() {
  const { size } = useThree()
  // Sit the cloud to the right of the headline on wide screens
  const baseX = size.width > 1000 ? 1.9 : size.width > 700 ? 1.2 : 0
  const baseY = size.width > 700 ? 0 : 0.9
  const ref = useRef()
  const group = useRef()
  // Order the cloud morphs through; 'ac' faces the camera instead of spinning
  const names = ['sphere', 'knot', 'galaxy', 'helix', 'cube', 'ac']
  const shapes = useMemo(
    () => [sphere(COUNT), torusKnot(COUNT), galaxy(COUNT), helix(COUNT), cubeGrid(COUNT), initials(COUNT)],
    [],
  )
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(shapes[0])
    const colors = new Float32Array(COUNT * 3)
    const c1 = new THREE.Color('#a78bfa')
    const c2 = new THREE.Color('#22d3ee')
    const c3 = new THREE.Color('#f472b6')
    const c = new THREE.Color()
    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT
      if (t < 0.5) c.copy(c1).lerp(c2, t * 2)
      else c.copy(c2).lerp(c3, (t - 0.5) * 2)
      colors.set([c.r, c.g, c.b], i * 3)
    }
    return { positions, colors }
  }, [shapes])

  const state = useRef({ shape: 0, last: 0 })

  useFrame(({ clock, pointer }, delta) => {
    const t = clock.elapsedTime
    const s = state.current
    if (!reducedMotion && t - s.last > 6) {
      s.shape = (s.shape + 1) % shapes.length
      s.last = t
    }
    const target = shapes[s.shape]
    const pos = ref.current.geometry.attributes.position
    const arr = pos.array
    const k = Math.min(1, delta * 2.2)
    for (let i = 0; i < arr.length; i++) arr[i] += (target[i] - arr[i]) * k
    pos.needsUpdate = true

    const g = group.current
    if (names[s.shape] === 'ac') {
      const front = Math.round(g.rotation.y / (Math.PI * 2)) * Math.PI * 2
      g.rotation.y += (front - g.rotation.y) * Math.min(1, delta * 2.5)
    } else if (!reducedMotion) {
      g.rotation.y += delta * (names[s.shape] === 'helix' ? 0.35 : 0.12)
    }
    g.rotation.x += (pointer.y * 0.35 - g.rotation.x) * 0.05
    g.rotation.z += (-pointer.x * 0.25 - g.rotation.z) * 0.05
    g.position.x += (baseX + pointer.x * 0.4 - g.position.x) * 0.04
    g.position.y += (baseY - g.position.y) * 0.04
  })

  return (
    <group ref={group}>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.028}
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 50 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
    >
      <Particles />
    </Canvas>
  )
}
