import React, { memo } from 'react'
import { Layer, Rect, Text, Group } from 'react-konva'
import type { BedAssignment } from '@/lib/types'
import { getRoomLayouts, BED_W, BED_H, C } from './layout'

interface BedRect {
  bedId: number
  x: number
  y: number
  label: string
  occupied: boolean
  hovered: boolean
}

interface Props {
  bedRects: BedRect[]
  onBedMouseEnter: (bedId: number, x: number, y: number) => void
  onBedMouseLeave: () => void
  onBedClick: (bedId: number, x: number, y: number) => void
  isAdmin: boolean
}

export const FurnitureLayer = memo(function FurnitureLayer({
  bedRects,
  onBedMouseEnter,
  onBedMouseLeave,
  onBedClick,
  isAdmin,
}: Props) {
  return (
    <Layer>
      {bedRects.map((bed) => {
        const fill = bed.hovered
          ? C.bedHover
          : bed.occupied
          ? C.bedOccupied
          : C.bedEmpty

        return (
          <Group
            key={bed.bedId}
            x={bed.x}
            y={bed.y}
            onMouseEnter={(e) => {
              const stage = e.target.getStage()
              if (stage) stage.container().style.cursor = isAdmin ? 'pointer' : 'default'
              onBedMouseEnter(bed.bedId, bed.x, bed.y)
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage()
              if (stage) stage.container().style.cursor = 'default'
              onBedMouseLeave()
            }}
            onClick={() => {
              if (isAdmin) onBedClick(bed.bedId, bed.x, bed.y)
            }}
          >
            {/* Bed frame */}
            <Rect
              width={BED_W}
              height={BED_H}
              fill={fill}
              stroke={C.bedStroke}
              strokeWidth={1.5}
              cornerRadius={6}
            />
            {/* Pillow */}
            <Rect
              x={8}
              y={8}
              width={BED_W - 16}
              height={22}
              fill="rgba(255,255,255,0.08)"
              cornerRadius={4}
            />
            {/* Mattress lines */}
            <Rect
              x={8}
              y={38}
              width={BED_W - 16}
              height={BED_H - 50}
              fill="rgba(255,255,255,0.04)"
              cornerRadius={3}
            />
            {/* Bed icon */}
            <Text
              x={0}
              y={44}
              width={BED_W}
              text="🛏️"
              fontSize={22}
              align="center"
            />
            {/* Label */}
            <Text
              x={0}
              y={BED_H - 22}
              width={BED_W}
              text={bed.label}
              fontSize={10}
              fill={C.textMuted}
              align="center"
            />
          </Group>
        )
      })}
    </Layer>
  )
})
