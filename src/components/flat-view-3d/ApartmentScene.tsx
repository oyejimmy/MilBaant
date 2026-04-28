/**
 * ApartmentScene — realistic apartment interior.
 *
 * Layout (left column: Room2 / Room3 / Kitchen, right column: Room1 / Lounge):
 *
 *   X+  Left col      Hallway    Right col  X-
 *   ┌──────────────┐  │     │  ┌──────────────┐
 *   │   Room 2     │  │     │  │   Room 1     │  Z1 (top)
 *   ├──────────────┤  │     │  ├──────────────┤
 *   │   Room 3     │  │     │  │   Lounge     │  Z2 (mid)
 *   ├──────────────┤  │     │  └──────────────┘
 *   │   Kitchen    │  │     │                    Z3 (bot)
 *   └──────────────┘
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Html } from '@react-three/drei'
import * as THREE from 'three'
import { ROOM_COLORS, LAYOUT } from './sceneConfig'

const { LX, RX, Z1, Z2, Z3, RW, RD, WH } = LAYOUT
const T  = 0.14   // wall thickness
const DW = 1.05   // door width
const DH = 2.25   // door height

// ── Shared materials (created once) ───────────────────────────────────────
const WOOD_DARK  = new THREE.MeshStandardMaterial({ color: '#6b4a18', roughness: 0.45, metalness: 0.05 })
const WOOD_MED   = new THREE.MeshStandardMaterial({ color: '#a07830', roughness: 0.40, metalness: 0.05 })
const WOOD_LIGHT = new THREE.MeshStandardMaterial({ color: '#c8a050', roughness: 0.35, metalness: 0.06 })
const GOLD_MAT   = new THREE.MeshStandardMaterial({ color: '#d4a820', roughness: 0.18, metalness: 0.85 })
const CHROME_MAT = new THREE.MeshStandardMaterial({ color: '#c8d0d8', roughness: 0.12, metalness: 0.90 })
const GLASS_MAT  = new THREE.MeshStandardMaterial({ color: '#a8c8e8', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35 })

// ── Exported BedMesh ───────────────────────────────────────────────────────
export function BedMesh({ color, accentColor }: { color: string; accentColor: string }) {
  const mattressMat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.03 }), [color])
  const accentMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.38, metalness: 0.08 }), [accentColor])
  return (
    <group>
      {/* Frame base */}
      <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[1.62, 0.16, 2.28]} />
        <primitive object={accentMat} />
      </mesh>
      {/* Mattress */}
      <RoundedBox args={[1.52, 0.28, 2.18]} radius={0.07} smoothness={4} position={[0, 0.28, 0]} castShadow receiveShadow>
        <primitive object={mattressMat} />
      </RoundedBox>
      {/* Headboard */}
      <RoundedBox args={[1.64, 0.72, 0.14]} radius={0.06} smoothness={4} position={[0, 0.56, -1.1]} castShadow>
        <primitive object={accentMat} />
      </RoundedBox>
      {/* Headboard panel inset */}
      <mesh position={[0, 0.56, -1.04]}>
        <boxGeometry args={[1.3, 0.5, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
      </mesh>
      {/* Pillows */}
      <RoundedBox args={[0.54, 0.12, 0.38]} radius={0.05} smoothness={4} position={[-0.34, 0.44, -0.78]} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.7} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[0.54, 0.12, 0.38]} radius={0.05} smoothness={4} position={[0.34, 0.44, -0.78]} castShadow>
        <meshStandardMaterial color="#f0e8ff" roughness={0.7} metalness={0} />
      </RoundedBox>
      {/* Blanket fold */}
      <RoundedBox args={[1.48, 0.08, 0.9]} radius={0.04} smoothness={4} position={[0, 0.38, 0.55]} castShadow>
        <meshStandardMaterial color={accentColor} roughness={0.65} metalness={0} />
      </RoundedBox>
      {/* Legs */}
      {([-0.68, 0.68] as number[]).flatMap((x) =>
        ([-1.02, 1.02] as number[]).map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.04, z]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.18, 8]} />
            <primitive object={accentMat} />
          </mesh>
        ))
      )}
    </group>
  )
}

// ── Door (standalone, placed in wall opening) ─────────────────────────────
function Door({ position, rotation = 0, color = '#c8a050' }: {
  position: [number,number,number]; rotation?: number; color?: string
}) {
  const doorMat  = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.04 }), [color])
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Outer frame */}
      <mesh castShadow position={[0, DH/2, 0]}>
        <boxGeometry args={[DW + 0.14, DH + 0.1, 0.06]} />
        <primitive object={WOOD_DARK} />
      </mesh>
      {/* Door panel */}
      <mesh castShadow position={[0, DH/2, 0.04]}>
        <boxGeometry args={[DW - 0.04, DH - 0.04, 0.05]} />
        <primitive object={doorMat} />
      </mesh>
      {/* Upper raised panel */}
      <mesh position={[0, DH * 0.72, 0.07]}>
        <boxGeometry args={[DW * 0.72, DH * 0.32, 0.02]} />
        <primitive object={WOOD_LIGHT} />
      </mesh>
      {/* Lower raised panel */}
      <mesh position={[0, DH * 0.28, 0.07]}>
        <boxGeometry args={[DW * 0.72, DH * 0.38, 0.02]} />
        <primitive object={WOOD_LIGHT} />
      </mesh>
      {/* Knob */}
      <mesh position={[DW * 0.38, DH * 0.46, 0.1]} castShadow>
        <sphereGeometry args={[0.048, 10, 10]} />
        <primitive object={GOLD_MAT} />
      </mesh>
      {/* Knob back plate */}
      <mesh position={[DW * 0.38, DH * 0.46, 0.08]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 8]} />
        <primitive object={GOLD_MAT} />
      </mesh>
      {/* Hinges */}
      {([DH * 0.18, DH * 0.82] as number[]).map((y) => (
        <mesh key={y} position={[-DW * 0.44, y, 0.06]} castShadow>
          <boxGeometry args={[0.06, 0.12, 0.04]} />
          <primitive object={CHROME_MAT} />
        </mesh>
      ))}
    </group>
  )
}

// ── Window ────────────────────────────────────────────────────────────────
function Window({ position, rotation = 0 }: { position: [number,number,number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[1.1, 1.2, 0.1]} />
        <primitive object={WOOD_DARK} />
      </mesh>
      {/* Glass panes (2×2) */}
      {([-0.25, 0.25] as number[]).flatMap((x) =>
        ([-0.25, 0.25] as number[]).map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, 0.04]}>
            <boxGeometry args={[0.44, 0.5, 0.02]} />
            <primitive object={GLASS_MAT} />
          </mesh>
        ))
      )}
      {/* Cross divider */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[1.0, 0.04, 0.02]} />
        <primitive object={WOOD_DARK} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.04, 1.1, 0.02]} />
        <primitive object={WOOD_DARK} />
      </mesh>
      {/* Sill */}
      <mesh position={[0, -0.65, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.06, 0.18]} />
        <primitive object={WOOD_MED} />
      </mesh>
    </group>
  )
}

// ── Wall clock ────────────────────────────────────────────────────────────
function WallClock({ position, rotation }: { position: [number,number,number]; rotation?: [number,number,number] }) {
  const hourRef   = useRef<THREE.Mesh>(null)
  const minuteRef = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const now = new Date()
    const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds()
    if (hourRef.current)   hourRef.current.rotation.z   = -(h * 30 + m * 0.5) * (Math.PI / 180)
    if (minuteRef.current) minuteRef.current.rotation.z = -(m * 6 + s * 0.1)  * (Math.PI / 180)
  })
  return (
    <group position={position} rotation={rotation ?? [0, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 32]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.3, 0.032, 8, 32]} />
        <primitive object={WOOD_DARK} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.sin(a) * 0.23, 0.025, Math.cos(a) * 0.23]}>
            <boxGeometry args={[0.025, 0.025, i % 3 === 0 ? 0.065 : 0.04]} />
            <meshStandardMaterial color="#2d2010" roughness={0.4} metalness={0} />
          </mesh>
        )
      })}
      <mesh ref={hourRef} position={[0, 0.03, 0]}>
        <boxGeometry args={[0.024, 0.024, 0.15]} />
        <meshStandardMaterial color="#1a1008" roughness={0.4} metalness={0} />
      </mesh>
      <mesh ref={minuteRef} position={[0, 0.04, 0]}>
        <boxGeometry args={[0.016, 0.016, 0.22]} />
        <meshStandardMaterial color="#2d2010" roughness={0.4} metalness={0} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.04, 8]} />
        <primitive object={GOLD_MAT} />
      </mesh>
    </group>
  )
}

// ── Room box with proper walls, door cutout, window, trim ─────────────────
interface RoomBoxProps {
  cx: number; cz: number; w: number; d: number
  colors: { wall: string; floor: string; accent: string; name: string }
  doorOffset?: number   // X offset of door centre on front wall
  windowSide?: 'left' | 'right' | 'back' | 'none'
}

function RoomBox({ cx, cz, w, d, colors, doorOffset = 0, windowSide = 'back' }: RoomBoxProps) {
  const h = WH
  const wallMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: colors.wall, roughness: 0.58, metalness: 0 }), [colors.wall])
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: colors.floor, roughness: 0.80, metalness: 0 }), [colors.floor])
  const ceilMat  = new THREE.MeshStandardMaterial({ color: '#f8f6f2', roughness: 0.88, metalness: 0 })
  const trimMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f0ece4', roughness: 0.5, metalness: 0 }), [])

  // Front wall: split around door opening
  const leftW  = w / 2 + doorOffset - DW / 2
  const rightW = w / 2 - doorOffset - DW / 2
  const topH   = h - DH

  return (
    <group position={[cx, 0, cz]}>
      {/* ── Floor ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[w, d]} />
        <primitive object={floorMat} />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <primitive object={ceilMat} />
      </mesh>

      {/* ── Back wall ── */}
      <mesh castShadow receiveShadow position={[0, h/2, -d/2]}>
        <boxGeometry args={[w, h, T]} />
        <primitive object={wallMat} />
      </mesh>

      {/* ── Left wall ── */}
      <mesh castShadow receiveShadow position={[-w/2, h/2, 0]}>
        <boxGeometry args={[T, h, d]} />
        <primitive object={wallMat} />
      </mesh>

      {/* ── Right wall ── */}
      <mesh castShadow receiveShadow position={[w/2, h/2, 0]}>
        <boxGeometry args={[T, h, d]} />
        <primitive object={wallMat} />
      </mesh>

      {/* ── Front wall — left of door ── */}
      <mesh castShadow receiveShadow position={[-(rightW/2 + DW/2), h/2, d/2]}>
        <boxGeometry args={[leftW, h, T]} />
        <primitive object={wallMat} />
      </mesh>

      {/* ── Front wall — right of door ── */}
      <mesh castShadow receiveShadow position={[(leftW/2 + DW/2), h/2, d/2]}>
        <boxGeometry args={[rightW, h, T]} />
        <primitive object={wallMat} />
      </mesh>

      {/* ── Front wall — above door ── */}
      <mesh castShadow receiveShadow position={[doorOffset, DH + topH/2, d/2]}>
        <boxGeometry args={[DW, topH, T]} />
        <primitive object={wallMat} />
      </mesh>

      {/* ── Door ── */}
      <Door position={[doorOffset, 0, d/2 - T/2]} color={colors.accent} />

      {/* ── Window on back wall ── */}
      {windowSide === 'back' && (
        <Window position={[0, h * 0.55, -d/2 + T/2 + 0.01]} />
      )}
      {windowSide === 'left' && (
        <Window position={[-w/2 + T/2 + 0.01, h * 0.55, 0]} rotation={Math.PI / 2} />
      )}
      {windowSide === 'right' && (
        <Window position={[w/2 - T/2 - 0.01, h * 0.55, 0]} rotation={-Math.PI / 2} />
      )}

      {/* ── Skirting boards ── */}
      {/* Back */}
      <mesh receiveShadow position={[0, 0.065, -d/2 + T/2]}>
        <boxGeometry args={[w - T*2, 0.13, 0.06]} />
        <primitive object={trimMat} />
      </mesh>
      {/* Left */}
      <mesh receiveShadow position={[-w/2 + T/2, 0.065, 0]}>
        <boxGeometry args={[0.06, 0.13, d - T*2]} />
        <primitive object={trimMat} />
      </mesh>
      {/* Right */}
      <mesh receiveShadow position={[w/2 - T/2, 0.065, 0]}>
        <boxGeometry args={[0.06, 0.13, d - T*2]} />
        <primitive object={trimMat} />
      </mesh>

      {/* ── Ceiling cornice ── */}
      <mesh position={[0, h - 0.06, -d/2 + T/2]}>
        <boxGeometry args={[w - T*2, 0.1, 0.08]} />
        <primitive object={trimMat} />
      </mesh>
      <mesh position={[-w/2 + T/2, h - 0.06, 0]}>
        <boxGeometry args={[0.08, 0.1, d - T*2]} />
        <primitive object={trimMat} />
      </mesh>
      <mesh position={[w/2 - T/2, h - 0.06, 0]}>
        <boxGeometry args={[0.08, 0.1, d - T*2]} />
        <primitive object={trimMat} />
      </mesh>

      {/* ── Ceiling light fixture ── */}
      <mesh position={[0, h - 0.02, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 16]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, h - 0.1, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.14, 16, 1, true]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.4} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, h - 0.18, 0]} intensity={0.5} color="#fff8e8" distance={6} />

      {/* ── Room label ── */}
      <Html position={[0, h + 0.28, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{
          background: 'rgba(20,23,40,0.84)', color: '#f0f2f8',
          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
          border: `1px solid ${colors.accent}`, whiteSpace: 'nowrap', letterSpacing: '0.04em',
        }}>{colors.name}</div>
      </Html>
    </group>
  )
}

// ── TV ────────────────────────────────────────────────────────────────────
function TV({ position, rotation = 0 }: { position: [number,number,number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.65, 0.95, 0.07]} />
        <meshStandardMaterial color="#111111" roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[1.52, 0.84, 0.01]} />
        <meshStandardMaterial color="#0a1428" roughness={0.08} metalness={0.2} emissive="#0a1428" emissiveIntensity={0.4} />
      </mesh>
      <mesh castShadow position={[0, -0.56, 0.04]}>
        <boxGeometry args={[0.08, 0.18, 0.06]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.66, 0.12]}>
        <boxGeometry args={[0.52, 0.04, 0.24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  )
}

function TVStand({ position }: { position: [number,number,number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.85, 0.52, 0.48]} radius={0.04} smoothness={4} position={[0, 0.26, 0]} castShadow receiveShadow>
        <primitive object={WOOD_DARK} />
      </RoundedBox>
      <mesh position={[0, 0.26, 0.245]}>
        <boxGeometry args={[1.75, 0.44, 0.02]} />
        <meshStandardMaterial color="#8a6020" roughness={0.38} metalness={0.05} />
      </mesh>
      {([-0.46, 0.46] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.26, 0.26]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <primitive object={GOLD_MAT} />
        </mesh>
      ))}
    </group>
  )
}

// ── Sofa ──────────────────────────────────────────────────────────────────
function Sofa({ position, rotation = 0 }: { position: [number,number,number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[2.85, 0.32, 0.98]} radius={0.08} smoothness={4} position={[0, 0.16, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#6a5898" roughness={0.62} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[2.85, 0.65, 0.22]} radius={0.08} smoothness={4} position={[0, 0.64, -0.38]} castShadow>
        <meshStandardMaterial color="#5a4888" roughness={0.62} metalness={0} />
      </RoundedBox>
      {([-1.28, 1.28] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.24, 0.52, 0.98]} radius={0.07} smoothness={4} position={[x, 0.42, 0]} castShadow>
          <meshStandardMaterial color="#5a4888" roughness={0.62} metalness={0} />
        </RoundedBox>
      ))}
      {([-0.72, 0, 0.72] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.74, 0.22, 0.74]} radius={0.06} smoothness={4} position={[x, 0.43, 0.06]} castShadow>
          <meshStandardMaterial color="#8070b8" roughness={0.68} metalness={0} />
        </RoundedBox>
      ))}
      {([-1.12, 1.12] as number[]).flatMap((x) => ([-0.36, 0.36] as number[]).map((z) => (
        <mesh key={`${x}-${z}`} position={[x, -0.02, z]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.12, 8]} />
          <primitive object={WOOD_DARK} />
        </mesh>
      )))}
    </group>
  )
}

// ── Coffee Table ──────────────────────────────────────────────────────────
function CoffeeTable({ position }: { position: [number,number,number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.25, 0.07, 0.72]} radius={0.04} smoothness={4} position={[0, 0.4, 0]} castShadow receiveShadow>
        <primitive object={WOOD_LIGHT} />
      </RoundedBox>
      <RoundedBox args={[1.05, 0.05, 0.58]} radius={0.03} smoothness={4} position={[0, 0.2, 0]} castShadow receiveShadow>
        <primitive object={WOOD_MED} />
      </RoundedBox>
      {([-0.46, 0.46] as number[]).flatMap((x) => ([-0.26, 0.26] as number[]).map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.2, z]} castShadow>
          <cylinderGeometry args={[0.038, 0.038, 0.4, 8]} />
          <primitive object={WOOD_DARK} />
        </mesh>
      )))}
      <mesh position={[0.22, 0.45, 0.12]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.24, 0.04, 0.17]} />
        <meshStandardMaterial color="#c84040" roughness={0.5} metalness={0} />
      </mesh>
    </group>
  )
}

// ── Kitchen Counter ───────────────────────────────────────────────────────
function KitchenCounter({ position, w = 2.4 }: { position: [number,number,number]; w?: number }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.46, 0]}>
        <boxGeometry args={[w, 0.92, 0.65]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.42} metalness={0.05} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.94, 0]}>
        <boxGeometry args={[w + 0.04, 0.06, 0.68]} />
        <meshStandardMaterial color="#c0b8a8" roughness={0.22} metalness={0.22} />
      </mesh>
      {([-w/4, w/4] as number[]).map((x) => (
        <group key={x}>
          <mesh position={[x, 0.46, 0.335]}>
            <boxGeometry args={[w/2 - 0.07, 0.84, 0.02]} />
            <meshStandardMaterial color="#f0e8d8" roughness={0.38} metalness={0} />
          </mesh>
          <mesh position={[x + 0.14, 0.46, 0.35]}>
            <sphereGeometry args={[0.026, 8, 8]} />
            <primitive object={GOLD_MAT} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.97, -0.06]}>
        <boxGeometry args={[0.58, 0.06, 0.44]} />
        <primitive object={CHROME_MAT} />
      </mesh>
      <mesh position={[0, 0.94, -0.06]}>
        <boxGeometry args={[0.5, 0.09, 0.38]} />
        <meshStandardMaterial color="#7090a0" roughness={0.14} metalness={0.65} />
      </mesh>
      <mesh position={[0, 1.1, -0.2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.2, 8]} />
        <primitive object={CHROME_MAT} />
      </mesh>
      <mesh position={[0, 1.2, -0.2]} rotation={[0.6, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.12, 8]} />
        <primitive object={CHROME_MAT} />
      </mesh>
    </group>
  )
}

function Stove({ position }: { position: [number,number,number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.46, 0]}>
        <boxGeometry args={[0.72, 0.92, 0.65]} />
        <meshStandardMaterial color="#d0c8c0" roughness={0.28} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.94, 0]}>
        <boxGeometry args={[0.72, 0.04, 0.65]} />
        <meshStandardMaterial color="#1e1e1e" roughness={0.18} metalness={0.45} />
      </mesh>
      {([-0.17, 0.17] as number[]).flatMap((x) => ([-0.14, 0.14] as number[]).map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.97, z]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
          <meshStandardMaterial color="#111111" roughness={0.28} metalness={0.5} />
        </mesh>
      )))}
      <mesh position={[0, 0.3, 0.34]}>
        <boxGeometry args={[0.64, 0.46, 0.02]} />
        <meshStandardMaterial color="#1e1e1e" roughness={0.18} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.44, 0.36]}>
        <cylinderGeometry args={[0.015, 0.015, 0.52, 8]} />
        <primitive object={CHROME_MAT} />
      </mesh>
      {([-0.24, -0.08, 0.08, 0.24] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.78, 0.36]}>
          <cylinderGeometry args={[0.03, 0.03, 0.04, 8]} />
          <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Refrigerator({ position }: { position: [number,number,number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.74, 1.86, 0.7]} radius={0.04} smoothness={4} position={[0, 0.93, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e8e8e8" roughness={0.22} metalness={0.32} />
      </RoundedBox>
      <mesh position={[0, 1.55, 0.36]}>
        <boxGeometry args={[0.7, 0.58, 0.02]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.18} metalness={0.32} />
      </mesh>
      <mesh position={[0, 0.74, 0.36]}>
        <boxGeometry args={[0.7, 1.12, 0.02]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.18} metalness={0.32} />
      </mesh>
      {([1.42, 0.64] as number[]).map((y) => (
        <mesh key={y} position={[0.28, y, 0.4]}>
          <cylinderGeometry args={[0.018, 0.018, 0.4, 8]} />
          <primitive object={CHROME_MAT} />
        </mesh>
      ))}
      <mesh position={[0, 1.24, 0.37]}>
        <boxGeometry args={[0.7, 0.025, 0.01]} />
        <meshStandardMaterial color="#b8b8b8" roughness={0.3} metalness={0.45} />
      </mesh>
    </group>
  )
}

function Wardrobe({ position, rotation = 0 }: { position: [number,number,number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[1.45, 2.15, 0.58]} radius={0.03} smoothness={4} position={[0, 1.075, 0]} castShadow receiveShadow>
        <primitive object={WOOD_DARK} />
      </RoundedBox>
      {([-0.35, 0.35] as number[]).map((x) => (
        <group key={x}>
          <mesh position={[x, 1.075, 0.3]}>
            <boxGeometry args={[0.66, 2.05, 0.02]} />
            <primitive object={WOOD_MED} />
          </mesh>
          <mesh position={[x, 1.075, 0.31]}>
            <boxGeometry args={[0.52, 0.88, 0.01]} />
            <primitive object={WOOD_LIGHT} />
          </mesh>
          <mesh position={[x + (x > 0 ? -0.2 : 0.2), 1.075, 0.32]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <primitive object={GOLD_MAT} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.18, 0]}>
        <boxGeometry args={[1.45, 0.06, 0.58]} />
        <primitive object={WOOD_DARK} />
      </mesh>
    </group>
  )
}

function BedsideTable({ position }: { position: [number,number,number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.48, 0.58, 0.42]} radius={0.03} smoothness={4} position={[0, 0.29, 0]} castShadow receiveShadow>
        <primitive object={WOOD_MED} />
      </RoundedBox>
      <RoundedBox args={[0.52, 0.04, 0.46]} radius={0.02} smoothness={4} position={[0, 0.6, 0]} castShadow receiveShadow>
        <primitive object={WOOD_LIGHT} />
      </RoundedBox>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <coneGeometry args={[0.15, 0.22, 12, 1, true]} />
        <meshStandardMaterial color="#f5e8c0" roughness={0.5} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 0.85, 0]} intensity={0.35} color="#ffe8a0" distance={2.2} />
    </group>
  )
}

function DiningSet({ position }: { position: [number,number,number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.65, 0.07, 0.92]} radius={0.04} smoothness={4} position={[0, 0.78, 0]} castShadow receiveShadow>
        <primitive object={WOOD_LIGHT} />
      </RoundedBox>
      {([-0.72, 0.72] as number[]).flatMap((x) => ([-0.36, 0.36] as number[]).map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.39, z]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.78, 8]} />
          <primitive object={WOOD_DARK} />
        </mesh>
      )))}
      {([-0.56, 0.56] as number[]).map((x) => (
        <group key={x} position={[x, 0, 0.72]}>
          <mesh castShadow receiveShadow position={[0, 0.46, 0]}>
            <boxGeometry args={[0.44, 0.05, 0.44]} />
            <primitive object={WOOD_MED} />
          </mesh>
          <mesh castShadow position={[0, 0.74, -0.19]}>
            <boxGeometry args={[0.44, 0.52, 0.05]} />
            <primitive object={WOOD_DARK} />
          </mesh>
          {([-0.17, 0.17] as number[]).flatMap((lx) => ([-0.17, 0.17] as number[]).map((lz) => (
            <mesh key={`${lx}-${lz}`} position={[lx, 0.23, lz]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.46, 6]} />
              <primitive object={WOOD_DARK} />
            </mesh>
          )))}
        </group>
      ))}
    </group>
  )
}

function Plant({ position, scale = 1 }: { position: [number,number,number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.13, 0.3, 10]} />
        <meshStandardMaterial color="#b84030" roughness={0.6} metalness={0} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 10]} />
        <meshStandardMaterial color="#3a2010" roughness={0.9} metalness={0} />
      </mesh>
      {([[0,0.52,0],[-.13,.42,.08],[.13,.44,-.06],[.06,.4,.13]] as [number,number,number][]).map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[0.18 - i * 0.02, 8, 8]} />
          <meshStandardMaterial color={i === 0 ? '#4a9a4a' : '#357a35'} roughness={0.7} metalness={0} />
        </mesh>
      ))}
    </group>
  )
}

function Rug({ position, size, color }: { position: [number,number,number]; size: [number,number]; color: string }) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.004, position[2]]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.92} metalness={0} />
    </mesh>
  )
}

function DustMotes() {
  const ref = useRef<THREE.Points>(null)
  const positionsRef = useRef<Float32Array | null>(null)
  const speedsRef = useRef<Float32Array | null>(null)

  const positions = useMemo(() => {
    const n = 60
    const pos = new Float32Array(n * 3)
    const spd = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = Math.random() * 3.0
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
      spd[i] = 0.002 + Math.random() * 0.004
    }
    positionsRef.current = pos
    speedsRef.current = spd
    return pos
  }, [])

  useFrame((_, dt) => {
    if (!ref.current || !speedsRef.current) return
    const a = ref.current.geometry.attributes.position as THREE.BufferAttribute
    const spd = speedsRef.current
    for (let i = 0; i < 60; i++) {
      a.array[i * 3 + 1] = ((a.array[i * 3 + 1] as number) + spd[i] * dt * 60) % 3.0
    }
    a.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#fffde7" transparent opacity={0.42} sizeAttenuation />
    </points>
  )
}

// ── Main ApartmentScene ───────────────────────────────────────────────────
export function ApartmentScene() {
  return (
    <group>
      {/* Base floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#c8c2b8" roughness={0.9} metalness={0} />
      </mesh>

      {/* Hallway floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, (Z1+Z3)/2]}>
        <planeGeometry args={[LAYOUT.HW, Math.abs(Z3-Z1)+RD+0.5]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.85} metalness={0} />
      </mesh>

      {/* ══ LEFT COLUMN ══ */}

      {/* Room 2 — mint (top) */}
      <RoomBox cx={LX} cz={Z1} w={RW} d={RD} colors={ROOM_COLORS.room2} doorOffset={-0.9} windowSide="back" />
      <Wardrobe position={[LX + RW/2 - 0.38, 0, Z1 - RD/2 + 0.34]} rotation={Math.PI} />
      <BedsideTable position={[LX - 0.08, 0, Z1 - RD/2 + 0.58]} />
      <BedsideTable position={[LX + 1.92, 0, Z1 - RD/2 + 0.58]} />
      <WallClock position={[LX, WH * 0.72, Z1 - RD/2 + T + 0.01]} />
      <Plant position={[LX - RW/2 + 0.38, 0, Z1 + RD/2 - 0.48]} />

      {/* Room 3 — peach (middle) */}
      <RoomBox cx={LX} cz={Z2} w={RW} d={RD} colors={ROOM_COLORS.room3} doorOffset={-0.9} windowSide="back" />
      <Wardrobe position={[LX + RW/2 - 0.38, 0, Z2 - RD/2 + 0.34]} rotation={Math.PI} />
      <BedsideTable position={[LX - 0.08, 0, Z2 - RD/2 + 0.58]} />
      <BedsideTable position={[LX + 1.92, 0, Z2 - RD/2 + 0.58]} />
      <WallClock position={[LX, WH * 0.72, Z2 - RD/2 + T + 0.01]} />
      <Plant position={[LX - RW/2 + 0.38, 0, Z2 + RD/2 - 0.48]} />

      {/* Kitchen — yellow (bottom) */}
      <RoomBox cx={LX} cz={Z3} w={RW} d={RD} colors={ROOM_COLORS.kitchen} doorOffset={0.9} windowSide="left" />
      <KitchenCounter position={[LX - 0.5, 0, Z3 - RD/2 + 0.38]} w={2.2} />
      <Stove          position={[LX + 1.6, 0, Z3 - RD/2 + 0.38]} />
      <Refrigerator   position={[LX - RW/2 + 0.42, 0, Z3 - RD/2 + 0.4]} />
      <group position={[LX + RW/2 - 0.38, 0, Z3]} rotation={[0, Math.PI/2, 0]}>
        <KitchenCounter position={[0, 0, 0]} w={RD - 0.7} />
      </group>
      <DiningSet position={[LX - 0.4, 0, Z3 + 1.3]} />
      <WallClock position={[LX, WH * 0.72, Z3 - RD/2 + T + 0.01]} />
      <Rug position={[LX - 0.4, 0, Z3 + 1.3]} size={[2.2, 1.5]} color="#e8c870" />

      {/* ══ RIGHT COLUMN ══ */}

      {/* Room 1 — sky blue (top) */}
      <RoomBox cx={RX} cz={Z1} w={RW} d={RD} colors={ROOM_COLORS.room1} doorOffset={0.9} windowSide="back" />
      <Wardrobe position={[RX - RW/2 + 0.38, 0, Z1 - RD/2 + 0.34]} rotation={Math.PI} />
      <BedsideTable position={[RX - 1.92, 0, Z1 - RD/2 + 0.58]} />
      <BedsideTable position={[RX + 0.08, 0, Z1 - RD/2 + 0.58]} />
      <WallClock position={[RX, WH * 0.72, Z1 - RD/2 + T + 0.01]} />
      <Plant position={[RX + RW/2 - 0.38, 0, Z1 + RD/2 - 0.48]} />

      {/* Lounge — lavender (bottom) */}
      <RoomBox cx={RX} cz={Z2} w={RW} d={RD} colors={ROOM_COLORS.lounge} doorOffset={0.9} windowSide="right" />
      <TVStand position={[RX, 0, Z2 - RD/2 + 0.3]} />
      <TV      position={[RX, 1.06, Z2 - RD/2 + 0.3]} />
      <Sofa    position={[RX, 0, Z2 + 1.05]} rotation={Math.PI} />
      <CoffeeTable position={[RX, 0, Z2 + 0.12]} />
      <WallClock position={[RX, WH * 0.72, Z2 - RD/2 + T + 0.01]} />
      <Rug position={[RX, 0, Z2 + 0.55]} size={[3.1, 2.3]} color="#b8a0d8" />
      <Plant position={[RX - RW/2 + 0.38, 0, Z2 + RD/2 - 0.48]} />
      <Plant position={[RX + RW/2 - 0.38, 0, Z2 + RD/2 - 0.48]} />

      {/* ── Hallway walls ── */}
      <mesh castShadow receiveShadow position={[-LAYOUT.HW/2, WH/2, (Z1+Z2)/2]}>
        <boxGeometry args={[T, WH, RD*2+0.5]} />
        <meshStandardMaterial color={ROOM_COLORS.hallway.wall} roughness={0.55} metalness={0} />
      </mesh>
      <mesh castShadow receiveShadow position={[LAYOUT.HW/2, WH/2, (Z1+Z2)/2]}>
        <boxGeometry args={[T, WH, RD*2+0.5]} />
        <meshStandardMaterial color={ROOM_COLORS.hallway.wall} roughness={0.55} metalness={0} />
      </mesh>

      <DustMotes />
    </group>
  )
}
