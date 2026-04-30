import { useRef, useMemo, Component, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'
import styled, { keyframes, css } from 'styled-components'

/* ══════════════════════════════════════════════════════════════════════════
   CSS SHELL
══════════════════════════════════════════════════════════════════════════ */

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`
const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-7px); }
`

const dotPulse = keyframes`
  0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
  40%            { transform: scale(1);   opacity: 1; }
`

const Overlay = styled.div<{ $hiding: boolean }>`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  background: var(--app-bg);
  z-index: 9999;
  animation: ${fadeIn} 0.25s ease forwards;
  ${p => p.$hiding && css`
    animation: ${fadeOut} 0.4s ease forwards;
    pointer-events: none;
  `}
`

const CanvasWrap = styled.div`
  width: 260px;
  height: 260px;

  @media (max-width: 480px) {
    width: 200px;
    height: 200px;
  }
`

const Dots = styled.div`
  display: flex;
  gap: 7px;
  margin-top: 4px;
`
const Dot = styled.div<{ $delay: number }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary, #4096ff);
  animation: ${dotPulse} 1.3s ease-in-out ${p => p.$delay}s infinite;
  [data-theme="dark"] & { background: #49a5ea; }
`

/* ══════════════════════════════════════════════════════════════════════════
   DETECT THEME
══════════════════════════════════════════════════════════════════════════ */

function isDark() {
  return document.documentElement.dataset.theme === 'dark'
}

/* ══════════════════════════════════════════════════════════════════════════
   PARTICLE RING
   — N small spheres orbiting on a tilted torus path, each with a phase
     offset so they form a flowing ribbon of light
══════════════════════════════════════════════════════════════════════════ */

const PARTICLE_COUNT = 48

function ParticleRing() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dark = isDark()

  // Pre-compute per-particle data
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      phase:  (i / PARTICLE_COUNT) * Math.PI * 2,
      speed:  0.55 + (i % 3) * 0.08,
      radius: 1.15 + Math.sin(i * 1.3) * 0.12,
      yOff:   Math.sin(i * 0.9) * 0.18,
      scale:  0.045 + Math.abs(Math.sin(i * 0.7)) * 0.03,
    }))
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const mesh = meshRef.current
    if (!mesh) return

    particles.forEach((p, i) => {
      const angle = p.phase + t * p.speed
      const x = Math.cos(angle) * p.radius
      const z = Math.sin(angle) * p.radius
      const y = p.yOff + Math.sin(angle * 2) * 0.08

      dummy.position.set(x, y, z)
      dummy.scale.setScalar(p.scale * (0.85 + 0.15 * Math.sin(t * 2 + p.phase)))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      // Colour cycles: blue → cyan → indigo
      const hue = 0.58 + 0.08 * Math.sin(t * 0.4 + p.phase)
      const sat = dark ? 0.9 : 0.85
      const lit = dark ? 0.65 : 0.55
      color.setHSL(hue, sat, lit)
      mesh.setColorAt(i, color)
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        roughness={0.1}
        metalness={0.6}
        toneMapped={false}
      />
    </instancedMesh>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   OUTER RING TORUS
   — thin glowing torus that the particles orbit along
══════════════════════════════════════════════════════════════════════════ */

function OrbitRing() {
  const ref = useRef<THREE.Mesh>(null)
  const dark = isDark()

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.getElapsedTime() * 0.2
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.15) * 0.15
  })

  return (
    <mesh ref={ref}>
      <torusGeometry args={[1.15, 0.012, 16, 120]} />
      <meshStandardMaterial
        color={dark ? '#49a5ea' : '#4096ff'}
        emissive={dark ? '#1260e8' : '#1677ff'}
        emissiveIntensity={1.2}
        roughness={0.1}
        metalness={0.5}
        transparent
        opacity={0.55}
      />
    </mesh>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   CENTER CUBE
   — rounded box with glass-like transmission material, floats and rotates
══════════════════════════════════════════════════════════════════════════ */

function CenterCube() {
  const ref = useRef<THREE.Mesh>(null)
  const dark = isDark()

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.rotation.y = t * 0.6
    ref.current.rotation.x = Math.sin(t * 0.4) * 0.3
  })

  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.4}>
      <mesh ref={ref} castShadow>
        {/* rounded box via sphere-mapped box */}
        <boxGeometry args={[0.72, 0.72, 0.72]} />
        <MeshTransmissionMaterial
          backside
          samples={6}
          thickness={0.4}
          roughness={0.02}
          transmission={0.96}
          ior={1.5}
          chromaticAberration={0.04}
          color={dark ? '#1a3a6e' : '#c8deff'}
          distortionScale={0.2}
          temporalDistortion={0.1}
        />
      </mesh>
    </Float>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   INNER GLOW SPHERE
   — soft emissive sphere inside the cube for the "M" glow effect
══════════════════════════════════════════════════════════════════════════ */

function GlowCore() {
  const ref = useRef<THREE.Mesh>(null)
  const dark = isDark()

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 1.4 + Math.sin(clock.getElapsedTime() * 1.8) * 0.5
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.28, 32, 32]} />
      <meshStandardMaterial
        color={dark ? '#49a5ea' : '#4096ff'}
        emissive={dark ? '#49a5ea' : '#1677ff'}
        emissiveIntensity={1.8}
        roughness={0}
        metalness={0}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   FLOATING SATELLITES
   — 3 small tetrahedra orbiting at different inclinations
══════════════════════════════════════════════════════════════════════════ */

interface SatelliteProps {
  radius: number
  speed: number
  inclination: number
  phase: number
  color: string
  size: number
}

function Satellite({ radius, speed, inclination, phase, color, size }: SatelliteProps) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const angle = phase + t * speed
    ref.current.position.x = Math.cos(angle) * radius
    ref.current.position.y = Math.sin(angle * 0.7) * Math.sin(inclination) * radius * 0.5
    ref.current.position.z = Math.sin(angle) * radius
    ref.current.rotation.x = t * 1.2
    ref.current.rotation.z = t * 0.8
  })

  return (
    <mesh ref={ref}>
      <tetrahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.7}
      />
    </mesh>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   SCENE
══════════════════════════════════════════════════════════════════════════ */

function Scene() {
  const dark = isDark()

  return (
    <>
      {/* Lighting — no external HDR, pure programmatic lights */}
      <ambientLight intensity={dark ? 0.5 : 0.7} />
      <pointLight position={[3, 3, 3]}    intensity={dark ? 3 : 2}   color={dark ? '#49a5ea' : '#4096ff'} />
      <pointLight position={[-3, -2, -3]} intensity={dark ? 1.5 : 1} color={dark ? '#a78bfa' : '#9c27b0'} />
      <pointLight position={[0, 4, 0]}    intensity={dark ? 1 : 0.6} color="#ffffff" />
      <pointLight position={[2, -3, 2]}   intensity={dark ? 0.8 : 0.5} color={dark ? '#34d399' : '#52c41a'} />

      {/* Orbit ring + particles */}
      <OrbitRing />
      <ParticleRing />

      {/* Center glass cube + glow */}
      <CenterCube />
      <GlowCore />

      {/* Satellites */}
      <Satellite radius={1.7} speed={0.9}  inclination={0.8} phase={0}    color={dark ? '#49a5ea' : '#4096ff'} size={0.09} />
      <Satellite radius={1.6} speed={-0.7} inclination={1.2} phase={2.1}  color={dark ? '#a78bfa' : '#9c27b0'} size={0.07} />
      <Satellite radius={1.8} speed={0.5}  inclination={0.4} phase={4.2}  color={dark ? '#34d399' : '#52c41a'} size={0.08} />
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ERROR BOUNDARY — catches WebGL context loss / HDR fetch failures
   and shows a simple CSS fallback so the screen is never white
══════════════════════════════════════════════════════════════════════════ */

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

/* ── CSS-only fallback (shown if WebGL fails) ── */
const CSSFallback = styled.div`
  width: 260px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 480px) { width: 200px; height: 200px; }
`

const CSSBadge = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 22px;
  background: linear-gradient(145deg, #2d7aff 0%, #1260e8 60%, #0840b8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  box-shadow: 0 8px 24px rgba(18,96,232,0.4);
  animation: ${float} 2.8s ease-in-out infinite;
`

/* ══════════════════════════════════════════════════════════════════════════
   EXPORTED COMPONENT
══════════════════════════════════════════════════════════════════════════ */

interface BrandLoaderProps {
  hiding?: boolean
}

export function BrandLoader({ hiding = false }: BrandLoaderProps) {
  return (
    <Overlay $hiding={hiding}>
      <CanvasWrap>
        <CanvasErrorBoundary
          fallback={
            <CSSFallback>
              <CSSBadge>M</CSSBadge>
            </CSSFallback>
          }
        >
          <Canvas
            camera={{ position: [0, 0, 3.8], fov: 42 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              failIfMajorPerformanceCaveat: false,
            }}
            style={{ background: 'transparent' }}
            dpr={Math.min(window.devicePixelRatio, 2)}
          >
            <Scene />
          </Canvas>
        </CanvasErrorBoundary>
      </CanvasWrap>

      <Dots>
        <Dot $delay={0} />
        <Dot $delay={0.18} />
        <Dot $delay={0.36} />
      </Dots>
    </Overlay>
  )
}
