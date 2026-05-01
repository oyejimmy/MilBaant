import { useRef } from 'react'
import { Layer, Group, Circle, Image as KonvaImage, Text } from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import type { BedAssignment } from '@/lib/types'
import { BED_W, C } from './layout'

const AVATAR_R = 24   // radius
const AVATAR_D = AVATAR_R * 2

/* ─── Single avatar ───────────────────────────────────────────────────────── */

interface AvatarProps {
  assignment: BedAssignment
  x: number   // bed x
  y: number   // bed y
  isAdmin: boolean
  onDragEnd?: (userId: string, x: number, y: number) => void
}

function Avatar({ assignment, x, y, isAdmin, onDragEnd }: AvatarProps) {
  const name = assignment.profile?.full_name ?? 'User'
  const seed = encodeURIComponent(name)
  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`

  const [img] = useImage(avatarUrl, 'anonymous')
  const groupRef = useRef<Konva.Group>(null)

  // Center avatar horizontally in bed, position near top
  const cx = x + BED_W / 2
  const cy = y + 36

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    if (onDragEnd) {
      onDragEnd(assignment.user_id, e.target.x(), e.target.y())
    }
  }

  return (
    <Group
      ref={groupRef}
      x={cx}
      y={cy}
      draggable={isAdmin}
      onDragEnd={handleDragEnd}
      onMouseEnter={(e) => {
        const stage = e.target.getStage()
        if (stage && isAdmin) stage.container().style.cursor = 'grab'
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'default'
      }}
    >
      {/* White border circle */}
      <Circle
        radius={AVATAR_R + 2}
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={1.5}
      />

      {/* Avatar image clipped to circle */}
      {img ? (
        <KonvaImage
          image={img}
          x={-AVATAR_R}
          y={-AVATAR_R}
          width={AVATAR_D}
          height={AVATAR_D}
          cornerRadius={AVATAR_R}
        />
      ) : (
        /* Fallback initials */
        <>
          <Circle radius={AVATAR_R} fill={C.accent} />
          <Text
            x={-AVATAR_R}
            y={-8}
            width={AVATAR_D}
            text={name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            fontSize={12}
            fill="#fff"
            align="center"
            fontStyle="bold"
          />
        </>
      )}

      {/* Admin crown badge */}
      {assignment.profile?.role === 'admin' && (
        <Text
          x={AVATAR_R - 8}
          y={-AVATAR_R - 14}
          text="👑"
          fontSize={12}
        />
      )}

      {/* Name label */}
      <Text
        x={-50}
        y={AVATAR_R + 4}
        width={100}
        text={name.split(' ')[0]}   // first name only to save space
        fontSize={9}
        fill={C.textPrimary}
        align="center"
      />
    </Group>
  )
}

/* ─── Layer ───────────────────────────────────────────────────────────────── */

interface BedPosition {
  bedId: number
  x: number
  y: number
}

interface Props {
  assignments: BedAssignment[]
  bedPositions: BedPosition[]
  isAdmin: boolean
  onAvatarDragEnd: (userId: string, dropX: number, dropY: number) => void
}

export function UsersLayer({ assignments, bedPositions, isAdmin, onAvatarDragEnd }: Props) {
  const posMap = new Map(bedPositions.map((b) => [b.bedId, b]))

  return (
    <Layer>
      {assignments.map((a) => {
        const pos = posMap.get(a.bed_id)
        if (!pos) return null
        return (
          <Avatar
            key={a.user_id}
            assignment={a}
            x={pos.x}
            y={pos.y}
            isAdmin={isAdmin}
            onDragEnd={onAvatarDragEnd}
          />
        )
      })}
    </Layer>
  )
}
