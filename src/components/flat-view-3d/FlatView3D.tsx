/**
 * FlatView3D — main entry point for the 3D apartment view.
 *
 * Architecture:
 *  - Canvas (R3F) renders the 3D scene
 *  - ApartmentScene draws static geometry (rooms, furniture, plants)
 *  - Bed components are interactive — admins click to open AssignModal
 *  - Avatar3D components sit on their assigned beds with idle bob animation
 *  - AssignModal (Ant Design) handles the actual DB mutation
 *
 * Data flow:
 *  useBeds()           → list of DB beds (id, label, room_id, room.name)
 *  useBedAssignments() → current assignments (bed_id → user_id + profile)
 *  useProfiles()       → all flatmates (for the assign dropdown)
 *  useAssignBed()      → mutation to save changes
 *  useAuth()           → isAdmin flag
 */
import { Suspense, useMemo, useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { Alert, App, Button, Skeleton, Typography } from 'antd'
import { CompressOutlined, InfoCircleOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { useAuth } from '@/hooks/useAuth'
import { useProfiles } from '@/hooks/useProfiles'
import { useBeds, useBedAssignments, useAssignBed } from '@/hooks/useFlatLayout'

import { ApartmentScene } from './ApartmentScene'
import { Bed } from './Bed'
import { Avatar3D } from './Avatar3D'
import { AssignModal } from './AssignModal'
import { BED_CONFIGS, CAMERA_DEFAULT, CAMERA_TARGET } from './sceneConfig'
import type { BedConfig } from './sceneConfig'
import type { BedAssignment, Profile } from '@/lib/types'

// ── Styled wrappers ────────────────────────────────────────────────────────
const SceneWrapper = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(144, 159, 250, 0.18);
  background: #1a1f35;
  min-height: 680px;
`

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--card-border);
  flex-wrap: wrap;
`

const WebGLFallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
  padding: 32px;
  text-align: center;
`

// ── WebGL support check ────────────────────────────────────────────────────
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

// ── Loading skeleton ───────────────────────────────────────────────────────
function SceneSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <Skeleton.Image active style={{ width: '100%', height: 520, borderRadius: 8 }} />
    </div>
  )
}

// ── Inner scene (needs to be inside Canvas) ────────────────────────────────
interface SceneProps {
  isAdmin: boolean
  currentUserId: string | null
  assignments: BedAssignment[]
  profiles: Profile[]
  onBedClick: (bed: BedConfig) => void
  bedKeyToId: Map<string, number>
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

function Scene({ isAdmin, currentUserId, assignments, profiles, onBedClick, bedKeyToId, controlsRef }: SceneProps) {
  const assignmentByBedId = useMemo(
    () => new Map(assignments.map((a) => [a.bed_id, a])),
    [assignments],
  )
  const assignmentByKey = useMemo(() => {
    const m = new Map<string, BedAssignment>()
    for (const [key, id] of bedKeyToId) {
      const a = assignmentByBedId.get(id)
      if (a) m.set(key, a)
    }
    return m
  }, [assignmentByBedId, bedKeyToId])
  const userColorIndex = useMemo(
    () => new Map(profiles.map((p, i) => [p.id, i])),
    [profiles],
  )

  return (
    <>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.5} color="#fff8f0" />
      <hemisphereLight args={['#ffe8c0', '#b0c8e8', 0.55]} />
      <directionalLight
        position={[10, 14, 8]} intensity={1.5} color="#fff8e8" castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5} shadow-camera-far={50}
        shadow-camera-left={-16} shadow-camera-right={16}
        shadow-camera-top={16}  shadow-camera-bottom={-16}
      />
      <directionalLight position={[-8, 10, -6]} intensity={0.4} color="#d0e8ff" />
      {/* Per-room ceiling lights */}
      <pointLight position={[3.2,  2.6, -4.8]} intensity={0.7} color="#c5e1c5" distance={7} />
      <pointLight position={[3.2,  2.6,  0.1]} intensity={0.6} color="#f5c6d0" distance={7} />
      <pointLight position={[3.2,  2.6,  4.8]} intensity={0.6} color="#f5e8b0" distance={7} />
      <pointLight position={[-3.2, 2.6, -4.8]} intensity={0.7} color="#c9dff5" distance={7} />
      <pointLight position={[-3.2, 2.6,  0.1]} intensity={0.6} color="#d8c8ee" distance={7} />

      {/* ── Contact shadows ── */}
      <ContactShadows position={[0, 0.01, 0]} opacity={0.3} scale={22} blur={2.5} far={4} color="#141720" />

      {/* ── Apartment ── */}
      <ApartmentScene />

      {/* ── Interactive beds ── */}
      {BED_CONFIGS.map((bedConfig) => {
        const assignment = assignmentByKey.get(bedConfig.key)
        return (
          <Bed
            key={bedConfig.key}
            config={bedConfig}
            occupantName={assignment?.profile?.full_name ?? null}
            isAdmin={isAdmin}
            onClick={() => onBedClick(bedConfig)}
          />
        )
      })}

      {/* ── Avatars ── */}
      {BED_CONFIGS.map((bedConfig) => {
        const assignment = assignmentByKey.get(bedConfig.key)
        if (!assignment?.profile) return null
        const colorIdx = userColorIndex.get(assignment.user_id) ?? 0
        return (
          <Avatar3D
            key={`avatar-${assignment.user_id}`}
            name={assignment.profile.full_name}
            colorIndex={colorIdx}
            bedPosition={bedConfig.position}
            bedRotation={bedConfig.rotation}
            isCurrentUser={assignment.user_id === currentUserId}
          />
        )
      })}

      {/* ── Camera controls ── */}
      <OrbitControls
        ref={controlsRef}
        target={CAMERA_TARGET}
        minDistance={5}
        maxDistance={28}
        maxPolarAngle={Math.PI / 2.05}
        enablePan enableZoom enableRotate
        dampingFactor={0.08} enableDamping
      />
    </>
  )
}

// ── Main exported component ────────────────────────────────────────────────
export default function FlatView3D() {
  const { isAdmin, userId: currentUserId } = useAuth()
  const { message } = App.useApp()
  const profilesQuery = useProfiles()
  const bedsQuery = useBeds()
  const assignmentsQuery = useBedAssignments()
  const assignBed = useAssignBed()

  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  // Modal state
  const [selectedBed, setSelectedBed] = useState<BedConfig | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const profiles = profilesQuery.data ?? []
  const beds = bedsQuery.data ?? []
  const assignments = assignmentsQuery.data ?? []

  // Build bedKey → DB bed id map by matching label + room name
  // BED_CONFIGS keys: r1a/r1b → Room 1 Bed A/B, r2a/r2b → Room 2, r3a/r3b → Room 3
  const bedKeyToId = useMemo(() => {
    const m = new Map<string, number>()
    const keyMeta: Record<string, { roomNum: number; label: string }> = {
      r1a: { roomNum: 1, label: 'Bed A' },
      r1b: { roomNum: 1, label: 'Bed B' },
      r2a: { roomNum: 2, label: 'Bed A' },
      r2b: { roomNum: 2, label: 'Bed B' },
      r3a: { roomNum: 3, label: 'Bed A' },
      r3b: { roomNum: 3, label: 'Bed B' },
    }
    for (const [key, meta] of Object.entries(keyMeta)) {
      const match = beds.find(
        (b) =>
          b.label === meta.label &&
          b.room?.name?.toLowerCase().includes(String(meta.roomNum)),
      )
      if (match) m.set(key, match.id)
    }
    return m
  }, [beds])

  // Unassigned profiles (not currently on any bed)
  const assignedUserIds = useMemo(
    () => new Set(assignments.map((a) => a.user_id)),
    [assignments],
  )
  const unassignedProfiles = useMemo(
    () => profiles.filter((p) => !assignedUserIds.has(p.id)),
    [profiles, assignedUserIds],
  )

  // Assignment for the currently selected bed
  const selectedAssignment = useMemo(() => {
    if (!selectedBed) return undefined
    const dbId = bedKeyToId.get(selectedBed.key)
    if (dbId === undefined) return undefined
    return assignments.find((a) => a.bed_id === dbId)
  }, [selectedBed, bedKeyToId, assignments])

  function handleBedClick(bed: BedConfig) {
    setSelectedBed(bed)
    setModalOpen(true)
  }

  function handleAssign(bedId: number, userId: string) {
    assignBed.mutate(
      { bedId, userId },
      {
        onSuccess: () => {
          void message.success('Bed assigned successfully')
          setModalOpen(false)
          setSelectedBed(null)
        },
        onError: (err) => void message.error(err.message),
      },
    )
  }

  function handleClear(bedId: number) {
    assignBed.mutate(
      { bedId, userId: null },
      {
        onSuccess: () => {
          void message.success('Bed cleared')
          setModalOpen(false)
          setSelectedBed(null)
        },
        onError: (err) => void message.error(err.message),
      },
    )
  }

  function handleResetCamera() {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  // WebGL fallback
  if (!isWebGLSupported()) {
    return (
      <WebGLFallback>
        <Alert
          type="warning"
          title="3D View Not Available"
          description="Your browser or device doesn't support WebGL. Please try a modern browser like Chrome or Firefox."
          showIcon
        />
      </WebGLFallback>
    )
  }

  const isLoading =
    profilesQuery.isLoading || bedsQuery.isLoading || assignmentsQuery.isLoading

  return (
    <>
      <ControlsBar>
        <Button
          size="small"
          icon={<CompressOutlined />}
          onClick={handleResetCamera}
        >
          Reset View
        </Button>
        <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          Drag to orbit · Scroll to zoom · Right-drag to pan
          {isAdmin && ' · Click a bed to assign'}
        </Typography.Text>
        {!isAdmin && (
          <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'auto' }}>
            Admin access required to assign beds
          </Typography.Text>
        )}
      </ControlsBar>

      <SceneWrapper>
        {isLoading ? (
          <SceneSkeleton />
        ) : (
          <Canvas
            camera={{ position: CAMERA_DEFAULT, fov: 52 }}
            shadows={{ type: 2 /* THREE.PCFShadowMap — PCFSoftShadowMap is deprecated in r169+ */ }}
            gl={{ antialias: true, alpha: false }}
            style={{ height: 680 }}
            dpr={[1, 1.5]}
          >
            <color attach="background" args={['#1a1f35']} />
            <fog attach="fog" args={['#1a1f35', 18, 30]} />

            <Suspense fallback={null}>
              <Scene
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                assignments={assignments}
                profiles={profiles}
                onBedClick={handleBedClick}
                bedKeyToId={bedKeyToId}
                controlsRef={controlsRef}
              />
            </Suspense>
          </Canvas>
        )}
      </SceneWrapper>

      {/* Assignment modal (outside Canvas — pure DOM) */}
      <AssignModal
        open={modalOpen}
        bed={selectedBed}
        assignment={selectedAssignment}
        unassignedProfiles={unassignedProfiles}
        saving={assignBed.isPending}
        onAssign={handleAssign}
        onClear={handleClear}
        onClose={() => setModalOpen(false)}
        bedKeyToId={bedKeyToId}
      />
    </>
  )
}
