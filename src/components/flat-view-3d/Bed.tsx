/**
 * Bed — interactive 3D bed mesh.
 * Highlights on hover, pulses when unassigned, shows occupant name via Html overlay.
 * Clicking opens the assignment modal (admin only).
 */
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { BedMesh } from './ApartmentScene'
import { ROOM_COLORS } from './sceneConfig'
import type { BedConfig } from './sceneConfig'

interface BedProps {
  config: BedConfig
  occupantName: string | null
  isAdmin: boolean
  onClick: () => void
}

export function Bed({ config, occupantName, isAdmin, onClick }: BedProps) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const pulseRef = useRef(0)

  const roomColors = ROOM_COLORS[config.room]
  const isOccupied = Boolean(occupantName)

  // Pulse glow when unassigned
  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (!isOccupied) {
      pulseRef.current += delta * 1.8
      const s = 1 + Math.sin(pulseRef.current) * 0.025
      groupRef.current.scale.setScalar(s)
    } else {
      groupRef.current.scale.setScalar(1)
    }
  })

  // Bed color: accent when hovered, muted when occupied, white when empty
  const mattressColor = hovered
    ? roomColors.accent
    : isOccupied
    ? roomColors.wall
    : '#f5f5f5'

  return (
    <group
      ref={groupRef}
      position={config.position}
      rotation={[0, config.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation()
        if (isAdmin) onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = isAdmin ? 'pointer' : 'default'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      <BedMesh color={mattressColor} accentColor={roomColors.accent} />

      {/* Hover / occupant label */}
      {(hovered || isOccupied) && (
        <Html
          position={[0, 1.1, 0]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div style={{
            background: isOccupied ? 'rgba(20,23,40,0.88)' : 'rgba(144,159,250,0.92)',
            color: '#f0f2f8',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 8,
            border: `1px solid ${roomColors.accent}`,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {isOccupied ? (
              <>
                <span style={{ opacity: 0.7, fontSize: 10 }}>{config.label} · </span>
                {occupantName}
              </>
            ) : (
              <>
                {config.label}
                {isAdmin && (
                  <span style={{ opacity: 0.8, fontSize: 10, marginLeft: 4 }}>· click to assign</span>
                )}
              </>
            )}
          </div>
        </Html>
      )}

      {/* Unassigned indicator ring */}
      {!isOccupied && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 0.95, 32]} />
          <meshStandardMaterial
            color={roomColors.accent}
            transparent
            opacity={hovered ? 0.9 : 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}
