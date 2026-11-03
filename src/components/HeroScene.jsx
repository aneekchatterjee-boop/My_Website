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

function Particles() {
  const { size } = useThree()
  // Sit the cloud to the right of the headline on wide screens
  const baseX = size.width > 1000 ? 1.9 : size.width > 700 ? 1.2 : 0
  const baseY = size.width > 700 ? 0 : 0.9
  const ref = useRef()
  const group = useRef()
  const shapes = useMemo(() => [sphere(COUNT), torusKnot(COUNT), galaxy(COUNT)], [])
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
    g.rotation.y += reducedMotion ? 0 : delta * 0.12
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
