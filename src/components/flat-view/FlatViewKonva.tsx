import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Group, Circle, Text, Rect } from 'react-konva'
import { Button, Typography } from 'antd'
import {
  CompressOutlined,
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import type Konva from 'konva'
import { useProfiles } from '@/hooks/useProfiles'
import { useWindowSize } from '@/hooks/useWindowSize'
import { FloorPlanLayer } from './FloorPlanLayer'
import {
  C, CONTENT_W, CONTENT_H,
  R1_BED_A, R1_BED_B, R2_BED_A, R2_BED_B, R3_BED_A, R3_BED_B,
  BED_W, BED_H,
} from './layout'

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const Wrapper = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: ${C.bgDark};
  border: 1px solid rgba(144,159,250,0.18);
  user-select: none;
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--card-border);
  flex-wrap: wrap;
`

const ZoomLabel = styled.span`
  font-size: 0.78rem;
  color: var(--text-muted);
  min-width: 40px;
  text-align: center;
`

const TooltipBox = styled.div`
  position: absolute;
  z-index: 500;
  background: rgba(20,23,40,0.95);
  border: 1px solid rgba(144,159,250,0.4);
  border-radius: 8px;
  padding: 8px 12px;
  pointer-events: none;
  font-size: 0.8rem;
  color: #f0f2f8;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
`

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 500px;
  background: ${C.bgDark};
  border-radius: 12px;
`

/* ─── Cartoon avatar colors ───────────────────────────────────────────────── */

const AVATAR_COLORS = [
  { body: '#ff6b6b', hat: '#c0392b', skin: '#ffd3b6' },
  { body: '#4ecdc4', hat: '#1abc9c', skin: '#ffe0bd' },
  { body: '#a29bfe', hat: '#6c5ce7', skin: '#ffd3b6' },
  { body: '#fd79a8', hat: '#e84393', skin: '#ffe0bd' },
  { body: '#fdcb6e', hat: '#e17055', skin: '#ffd3b6' },
  { body: '#55efc4', hat: '#00b894', skin: '#ffe0bd' },
]

/* ─── Cartoon character drawn with Konva shapes ───────────────────────────── */

interface CartoonProps {
  x: number
  y: number
  name: string
  colorIdx: number
  onHover: (name: string, x: number, y: number) => void
  onLeave: () => void
}

function CartoonCharacter({ x, y, name, colorIdx, onHover, onLeave }: CartoonProps) {
  const col = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length]
  const groupRef = useRef<Konva.Group>(null)

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable
      onMouseEnter={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'grab'
        const pos = groupRef.current?.getAbsolutePosition()
        onHover(name, pos?.x ?? x, pos?.y ?? y)
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'default'
        onLeave()
      }}
      onDragStart={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'grabbing'
      }}
      onDragEnd={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'grab'
      }}
    >
      {/* Shadow */}
      <Circle x={0} y={38} radiusX={16} radiusY={5}
        fill="rgba(0,0,0,0.25)" />

      {/* Body */}
      <Rect x={-14} y={14} width={28} height={24}
        fill={col.body} cornerRadius={6} />

      {/* Arms */}
      <Rect x={-22} y={16} width={10} height={16}
        fill={col.body} cornerRadius={4} />
      <Rect x={12} y={16} width={10} height={16}
        fill={col.body} cornerRadius={4} />

      {/* Legs */}
      <Rect x={-12} y={36} width={10} height={14}
        fill={col.hat} cornerRadius={3} />
      <Rect x={2} y={36} width={10} height={14}
        fill={col.hat} cornerRadius={3} />

      {/* Head */}
      <Circle x={0} y={4} radius={13} fill={col.skin} />

      {/* Hat */}
      <Rect x={-13} y={-8} width={26} height={8}
        fill={col.hat} cornerRadius={2} />
      <Rect x={-8} y={-18} width={16} height={12}
        fill={col.hat} cornerRadius={3} />

      {/* Eyes */}
      <Circle x={-5} y={2} radius={2.5} fill="#2d3436" />
      <Circle x={5} y={2} radius={2.5} fill="#2d3436" />
      <Circle x={-4} y={1} radius={1} fill="#fff" />
      <Circle x={6} y={1} radius={1} fill="#fff" />

      {/* Smile */}
      <Text x={-6} y={8} text="‿" fontSize={10} fill="#2d3436" />

      {/* Name tag */}
      <Rect x={-24} y={52} width={48} height={14}
        fill="rgba(0,0,0,0.5)" cornerRadius={3} />
      <Text x={-24} y={54} width={48}
        text={name.split(' ')[0]}
        fontSize={9} fill="#fff" align="center" />
    </Group>
  )
}

/* ─── Default positions for 6 characters ─────────────────────────────────── */

function getDefaultPositions() {
  return [
    { x: R1_BED_A.x + BED_W / 2, y: R1_BED_A.y + BED_H / 2 - 10 },
    { x: R1_BED_B.x + BED_W / 2, y: R1_BED_B.y + BED_H / 2 - 10 },
    { x: R2_BED_A.x + BED_W / 2, y: R2_BED_A.y + BED_H / 2 - 10 },
    { x: R2_BED_B.x + BED_W / 2, y: R2_BED_B.y + BED_H / 2 - 10 },
    { x: R3_BED_A.x + BED_W / 2, y: R3_BED_A.y + BED_H / 2 - 10 },
    { x: R3_BED_B.x + BED_W / 2, y: R3_BED_B.y + BED_H / 2 - 10 },
  ]
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export default function FlatViewKonva() {
  const windowSize = useWindowSize()
  const profilesQuery = useProfiles()
  const profiles = profilesQuery.data ?? []

  const stageW = Math.min(windowSize.width - 48, 1000)
  const stageH = Math.min(windowSize.height - 220, 620)

  const [scale, setScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const stageRef = useRef<Konva.Stage>(null)

  const [positions] = useState(getDefaultPositions)
  const [tooltip, setTooltip] = useState<{ name: string; sx: number; sy: number } | null>(null)

  useEffect(() => {
    const fit = Math.min(stageW / CONTENT_W, stageH / CONTENT_H, 1)
    setScale(Math.max(0.45, fit))
    setStagePos({ x: 0, y: 0 })
  }, [stageW, stageH])

  function handleZoomIn() { setScale((s) => Math.min(2, +(s + 0.1).toFixed(1))) }
  function handleZoomOut() { setScale((s) => Math.max(0.4, +(s - 0.1).toFixed(1))) }
  function handleFit() {
    const fit = Math.min(stageW / CONTENT_W, stageH / CONTENT_H, 1)
    setScale(Math.max(0.45, fit))
    setStagePos({ x: 0, y: 0 })
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault()
    const delta = e.evt.deltaY > 0 ? -0.1 : 0.1
    setScale((s) => Math.min(2, Math.max(0.4, +(s + delta).toFixed(1))))
  }

  function handleHover(name: string, ax: number, ay: number) {
    // ax/ay are absolute stage coords — convert to container-relative
    const container = stageRef.current?.container().getBoundingClientRect()
    if (!container) return
    setTooltip({ name, sx: ax - container.left, sy: ay - container.top - 80 })
  }

  // Get names — use profiles if available, else fallback names
  const FALLBACK = ['Yasir', 'Haris', 'Sajid', 'Raza', 'Jamil', 'Ateeb']
  const names = Array.from({ length: 6 }, (_, i) =>
    profiles[i]?.full_name ?? FALLBACK[i]
  )

  if (profilesQuery.isLoading) {
    return (
      <LoadingOverlay>
        <LoadingOutlined style={{ fontSize: 48, color: '#909ffa' }} spin />
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading flat view...</span>
      </LoadingOverlay>
    )
  }

  return (
    <>
      <Controls>
        <Button size="small" icon={<MinusOutlined />} onClick={handleZoomOut} />
        <ZoomLabel>{Math.round(scale * 100)}%</ZoomLabel>
        <Button size="small" icon={<PlusOutlined />} onClick={handleZoomIn} />
        <Button size="small" icon={<CompressOutlined />} onClick={handleFit}>Fit</Button>
        <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: 8 }}>
          Drag characters to move them · Scroll to zoom · Drag canvas to pan
        </Typography.Text>
      </Controls>

      <Wrapper style={{ height: stageH }}>
        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          scaleX={scale}
          scaleY={scale}
          x={stagePos.x}
          y={stagePos.y}
          draggable
          onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
          onWheel={handleWheel}
          style={{ background: C.bgDark }}
        >
          <FloorPlanLayer />

          <Layer>
            {names.map((name, i) => (
              <CartoonCharacter
                key={i}
                x={positions[i]?.x ?? 100}
                y={positions[i]?.y ?? 100}
                name={name}
                colorIdx={i}
                onHover={handleHover}
                onLeave={() => setTooltip(null)}
              />
            ))}
          </Layer>
        </Stage>

        {tooltip && (
          <TooltipBox style={{ left: tooltip.sx, top: tooltip.sy }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{tooltip.name}</div>
            <div style={{ color: 'rgba(144,159,250,0.8)', fontSize: 11, marginTop: 2 }}>
              Drag to move
            </div>
          </TooltipBox>
        )}
      </Wrapper>
    </>
  )
}
