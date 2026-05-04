import { memo } from 'react'
import { Layer, Rect, Text, Group } from 'react-konva'
import { CONTENT_W, CONTENT_H, C } from '../layout'

interface Props {
  totalBeds: number
  assignedBeds: number
}

export const OverlayLayer = memo(function OverlayLayer({ totalBeds, assignedBeds }: Props) {
  const panelW = 160
  const panelH = 64
  const panelX = CONTENT_W - panelW - 20
  const panelY = CONTENT_H - panelH - 20
  const pct = totalBeds > 0 ? assignedBeds / totalBeds : 0
  const barW = panelW - 24
  const filledW = Math.round(barW * pct)
  const barColor = pct >= 0.8 ? '#52c41a' : pct >= 0.5 ? '#faad14' : C.accent

  return (
    <Layer>
      <Group x={panelX} y={panelY}>
        {/* Panel bg */}
        <Rect
          width={panelW}
          height={panelH}
          fill="rgba(20,23,40,0.82)"
          stroke="rgba(144,159,250,0.25)"
          strokeWidth={1}
          cornerRadius={8}
        />
        {/* Title */}
        <Text
          x={12}
          y={10}
          text="OCCUPANCY"
          fontSize={8}
          fill={C.textMuted}
          letterSpacing={1.5}
        />
        {/* Count */}
        <Text
          x={12}
          y={22}
          text={`${assignedBeds} / ${totalBeds} beds`}
          fontSize={13}
          fill={C.textPrimary}
          fontStyle="bold"
        />
        {/* Bar track */}
        <Rect
          x={12}
          y={46}
          width={barW}
          height={6}
          fill="rgba(255,255,255,0.1)"
          cornerRadius={3}
        />
        {/* Bar fill */}
        {filledW > 0 && (
          <Rect
            x={12}
            y={46}
            width={filledW}
            height={6}
            fill={barColor}
            cornerRadius={3}
          />
        )}
      </Group>
    </Layer>
  )
})
