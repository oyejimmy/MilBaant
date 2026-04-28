/**
 * Avatar3D — draggable cartoon character.
 *
 * Drag behaviour:
 *  - On pointerdown: lock pointer capture, disable OrbitControls
 *  - On pointermove: raycast against the floor plane (y=0) and move avatar
 *  - On pointerup: release, re-enable OrbitControls
 *
 * The avatar floats slightly above the floor when dragged (y = 0.6)
 * and snaps back to bed height when released.
 */
import { useRef, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { AVATAR_PALETTE } from './sceneConfig'

interface Avatar3DProps {
  name: string
  colorIndex: number
  bedPosition: [number, number, number]
  bedRotation: number
  isCurrentUser?: boolean
}

// Floor plane for raycasting during drag
const FLOOR_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

export function Avatar3D({
  name,
  colorIndex,
  bedPosition,
  bedRotation,
  isCurrentUser = false,
}: Avatar3DProps) {
  const groupRef  = useRef<THREE.Group>(null)
  const ringRef   = useRef<THREE.Mesh>(null)
  const bobRef    = useRef(Math.random() * Math.PI * 2)

  const [hovered,  setHovered]  = useState(false)
  const [dragging, setDragging] = useState(false)

  // Current world position (mutable, updated every frame during drag)
  const posRef = useRef(new THREE.Vector3(...bedPosition).setY(0.3))

  const { camera, gl, controls } = useThree()
  const palette   = AVATAR_PALETTE[colorIndex % AVATAR_PALETTE.length]
  const firstName = name.split(' ')[0]

  // ── Drag handlers ──────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: THREE.Event) => {
    const pe = e as unknown as PointerEvent & THREE.Event
    e.stopPropagation()
    ;(gl.domElement as HTMLCanvasElement).setPointerCapture(pe.pointerId)
    // Disable orbit controls while dragging
    if (controls) (controls as unknown as { enabled: boolean }).enabled = false
    setDragging(true)
    document.body.style.cursor = 'grabbing'
  }, [gl, controls])

  const onPointerUp = useCallback((e: THREE.Event) => {
    const pe = e as unknown as PointerEvent & THREE.Event
    ;(gl.domElement as HTMLCanvasElement).releasePointerCapture(pe.pointerId)
    if (controls) (controls as unknown as { enabled: boolean }).enabled = true
    setDragging(false)
    document.body.style.cursor = hovered ? 'grab' : 'default'
  }, [gl, controls, hovered])

  const onPointerMove = useCallback((e: THREE.Event) => {
    if (!dragging) return
    e.stopPropagation()
    const me = e as unknown as { ray: THREE.Ray }
    const target = new THREE.Vector3()
    me.ray.intersectPlane(FLOOR_PLANE, target)
    if (target) {
      posRef.current.set(target.x, 0.3, target.z)
    }
  }, [dragging])

  // ── Animation ──────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!groupRef.current) return
    bobRef.current += delta * 1.3

    if (dragging) {
      // Hover above floor while dragging
      const floatY = 0.6 + Math.sin(bobRef.current * 3) * 0.04
      groupRef.current.position.lerp(
        new THREE.Vector3(posRef.current.x, floatY, posRef.current.z),
        0.25,
      )
    } else {
      // Idle bob on bed
      const bobY = bedPosition[1] + 0.3 + Math.sin(bobRef.current) * 0.04
      groupRef.current.position.lerp(
        new THREE.Vector3(bedPosition[0], bobY, bedPosition[2] + 0.35),
        0.1,
      )
    }

    // Scale on hover
    const targetScale = hovered && !dragging ? 1.12 : dragging ? 1.06 : 1.0
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.14,
    )

    // Spin current-user ring
    if (ringRef.current) ringRef.current.rotation.y += delta * 1.2
  })

  return (
    <group
      ref={groupRef}
      rotation={[0, bedRotation + Math.PI, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'grab' }}
      onPointerOut={() => { setHovered(false); if (!dragging) document.body.style.cursor = 'default' }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    >
      {/* Current-user gold ring */}
      {isCurrentUser && (
        <mesh ref={ringRef} position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.045, 8, 32]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.9} roughness={0.2} metalness={0.5} />
        </mesh>
      )}

      {/* Drag shadow (bigger when dragging) */}
      <mesh position={[0, -0.29, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[dragging ? 0.32 : 0.22, 16]} />
        <meshStandardMaterial color="#000000" transparent opacity={dragging ? 0.25 : 0.14} />
      </mesh>

      {/* ── Shoes ── */}
      {([-0.1, 0.1] as number[]).map((x) => (
        <mesh key={x} position={[x, -0.27, 0.05]} castShadow>
          <boxGeometry args={[0.1, 0.06, 0.2]} />
          <meshStandardMaterial color="#1a1008" roughness={0.5} metalness={0} />
        </mesh>
      ))}

      {/* ── Trousers ── */}
      {([-0.1, 0.1] as number[]).map((x) => (
        <mesh key={x} position={[x, -0.13, 0]} castShadow>
          <boxGeometry args={[0.11, 0.26, 0.12]} />
          <meshStandardMaterial color="#2a2a4a" roughness={0.55} metalness={0} />
        </mesh>
      ))}

      {/* ── Belt ── */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.34, 0.05, 0.24]} />
        <meshStandardMaterial color="#3a2808" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* ── Shirt / body ── */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.34, 0.28, 0.24]} />
        <meshStandardMaterial color={palette.body} roughness={0.45} metalness={0.05} />
      </mesh>

      {/* ── Collar ── */}
      <mesh position={[0, 0.28, 0.11]} castShadow>
        <boxGeometry args={[0.15, 0.07, 0.04]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.5} metalness={0} />
      </mesh>

      {/* ── Arms ── */}
      {([-0.25, 0.25] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.1, 0]} castShadow>
          <boxGeometry args={[0.12, 0.3, 0.13]} />
          <meshStandardMaterial color={palette.body} roughness={0.45} metalness={0.05} />
        </mesh>
      ))}

      {/* ── Hands ── */}
      {([-0.25, 0.25] as number[]).map((x) => (
        <mesh key={x} position={[x, -0.07, 0]} castShadow>
          <sphereGeometry args={[0.072, 8, 8]} />
          <meshStandardMaterial color={palette.head} roughness={0.5} metalness={0} />
        </mesh>
      ))}

      {/* ── Neck ── */}
      <mesh position={[0, 0.33, 0]} castShadow>
        <cylinderGeometry args={[0.072, 0.072, 0.1, 8]} />
        <meshStandardMaterial color={palette.head} roughness={0.5} metalness={0} />
      </mesh>

      {/* ── Head ── */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={palette.head} roughness={0.42} metalness={0} />
      </mesh>

      {/* ── Hair ── */}
      <mesh position={[0, 0.64, 0]} castShadow>
        <sphereGeometry args={[0.225, 16, 16]} />
        <meshStandardMaterial color={palette.hat} roughness={0.5} metalness={0} />
      </mesh>
      {/* Hair front cutout (skin showing) */}
      <mesh position={[0, 0.52, 0.2]}>
        <sphereGeometry args={[0.19, 10, 10]} />
        <meshStandardMaterial color={palette.head} roughness={0.42} metalness={0} />
      </mesh>

      {/* ── Eyes ── */}
      {([-0.085, 0.085] as number[]).map((x) => (
        <group key={x} position={[x, 0.54, 0.2]}>
          {/* White */}
          <mesh castShadow>
            <sphereGeometry args={[0.04, 10, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0} />
          </mesh>
          {/* Iris */}
          <mesh position={[0, 0, 0.02]}>
            <sphereGeometry args={[0.025, 10, 10]} />
            <meshStandardMaterial color="#1a1008" roughness={0.2} metalness={0} />
          </mesh>
          {/* Shine */}
          <mesh position={[0.01, 0.01, 0.04]}>
            <sphereGeometry args={[0.009, 6, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0} />
          </mesh>
        </group>
      ))}

      {/* ── Eyebrows ── */}
      {([-0.085, 0.085] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.61, 0.2]} rotation={[0, 0, x > 0 ? -0.22 : 0.22]} castShadow>
          <boxGeometry args={[0.075, 0.018, 0.01]} />
          <meshStandardMaterial color={palette.hat} roughness={0.4} metalness={0} />
        </mesh>
      ))}

      {/* ── Smile ── */}
      <mesh position={[0, 0.46, 0.21]} rotation={[0, 0, Math.PI]} castShadow>
        <torusGeometry args={[0.058, 0.013, 6, 14, Math.PI]} />
        <meshStandardMaterial color="#c05040" roughness={0.3} metalness={0} />
      </mesh>

      {/* ── Ears ── */}
      {([-0.22, 0.22] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.52, 0]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={palette.head} roughness={0.5} metalness={0} />
        </mesh>
      ))}

      {/* ── Name tag ── */}
      <Html position={[0, 1.06, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{
          background: isCurrentUser
            ? 'rgba(255,215,0,0.96)'
            : dragging
            ? 'rgba(144,159,250,0.96)'
            : hovered
            ? 'rgba(100,120,240,0.95)'
            : 'rgba(20,23,40,0.86)',
          color: isCurrentUser ? '#1a1008' : '#f0f2f8',
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 6,
          border: isCurrentUser
            ? '1px solid #c8a000'
            : dragging
            ? '1px solid #909ffa'
            : '1px solid rgba(144,159,250,0.4)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.03em',
          boxShadow: dragging ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
          transition: 'background 0.15s',
        }}>
          {isCurrentUser ? `★ ${firstName}` : dragging ? `✦ ${firstName}` : firstName}
        </div>
      </Html>
    </group>
  )
}
