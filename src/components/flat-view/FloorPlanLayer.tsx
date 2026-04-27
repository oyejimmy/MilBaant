import React, { memo } from 'react'
import { Layer, Rect, Text, Arc } from 'react-konva'
import {
  C, PAD, CONTENT_W, CONTENT_H,
  R2_X, R2_Y, R2_W, R2_H,
  WC2_X, WC2_Y, WC2_W, WC2_H,
  LOUNGE_X, LOUNGE_Y, LOUNGE_W, LOUNGE_H,
  DINING_X, DINING_Y, DINING_W, DINING_H,
  WORK_X, WORK_Y, WORK_W, WORK_H,
  R1_X, R1_Y, R1_W, R1_H,
  WC1A_X, WC1A_Y, WC1A_W, WC1A_H,
  WC1B_X, WC1B_Y, WC1B_W, WC1B_H,
  R3_X, R3_Y, R3_W, R3_H,
  KITCHEN_X, KITCHEN_Y, KITCHEN_W, KITCHEN_H,
  BED_W, BED_H,
  R1_BED_A, R1_BED_B, R2_BED_A, R2_BED_B, R3_BED_A, R3_BED_B,
} from './layout'

interface Props {
  roomNames?: string[]
}

export const FloorPlanLayer = memo(function FloorPlanLayer({ roomNames = [] }: Props) {
  const r1Name = roomNames[0] ?? 'Room 1'
  const r2Name = roomNames[1] ?? 'Room 2'
  const r3Name = roomNames[2] ?? 'Room 3'

  return (
    <Layer>
      {/* ── Outer boundary ── */}
      <Rect
        x={PAD / 2} y={PAD / 2}
        width={CONTENT_W - PAD} height={CONTENT_H - PAD}
        fill="transparent"
        stroke={C.wallStroke} strokeWidth={2.5}
        cornerRadius={4}
      />

      {/* ── Main Door gap (top center) ── */}
      <Rect x={CONTENT_W / 2 - 40} y={PAD / 2 - 1} width={80} height={4}
        fill={C.bgDark} />
      <Text x={CONTENT_W / 2 - 35} y={PAD / 2 + 6} text="Main Door"
        fontSize={11} fill={C.door} fontStyle="bold" />

      {/* ══════════════ LEFT WING ══════════════ */}

      {/* Washroom above Room 2 */}
      <Rect x={WC2_X} y={WC2_Y} width={WC2_W} height={WC2_H}
        fill={C.wcFill} stroke={C.wcStroke} strokeWidth={1.5} />
      <Text x={WC2_X} y={WC2_Y + 18} width={WC2_W}
        text="Washroom" fontSize={12} fill={C.textMuted} align="center" />

      {/* Room 2 */}
      <Rect x={R2_X} y={R2_Y} width={R2_W} height={R2_H}
        fill={C.roomFill} stroke={C.roomStroke} strokeWidth={1.5} />
      <Text x={R2_X} y={R2_Y + 10} width={R2_W}
        text={r2Name} fontSize={12} fill={C.textPrimary} align="center" fontStyle="bold" />

      {/* Room 2 door (right side) */}
      <Text x={R2_X + R2_W - 2} y={R2_Y + R2_H - 20}
        text="Door" fontSize={9} fill={C.door} />
      <Arc
        x={R2_X + R2_W} y={R2_Y + R2_H}
        innerRadius={0} outerRadius={30}
        angle={90} rotation={90}
        stroke={C.door} strokeWidth={1} fill="transparent"
      />

      {/* Beds in Room 2 */}
      <Rect x={R2_BED_A.x} y={R2_BED_A.y} width={BED_W} height={BED_H}
        fill={C.bedFill} stroke={C.bedStroke} strokeWidth={1.5} cornerRadius={4} />
      <Text x={R2_BED_A.x} y={R2_BED_A.y + BED_H / 2 - 7} width={BED_W}
        text="Bed" fontSize={11} fill={C.textMuted} align="center" />

      <Rect x={R2_BED_B.x} y={R2_BED_B.y} width={BED_W} height={BED_H}
        fill={C.bedFill} stroke={C.bedStroke} strokeWidth={1.5} cornerRadius={4} />
      <Text x={R2_BED_B.x} y={R2_BED_B.y + BED_H / 2 - 7} width={BED_W}
        text="Bed" fontSize={11} fill={C.textMuted} align="center" />

      {/* TV Lounge */}
      <Rect x={LOUNGE_X} y={LOUNGE_Y} width={LOUNGE_W} height={LOUNGE_H}
        fill={C.commonFill} stroke={C.commonStroke} strokeWidth={1.5} />
      <Text x={LOUNGE_X} y={LOUNGE_Y + 14} width={LOUNGE_W}
        text="TV Lounge" fontSize={12} fill={C.textMuted} align="center" />

      {/* TV */}
      <Rect x={LOUNGE_X + LOUNGE_W / 2 - 40} y={LOUNGE_Y + 36}
        width={80} height={22}
        fill="rgba(144,159,250,0.15)" stroke={C.accent} strokeWidth={1.5} cornerRadius={3} />
      <Text x={LOUNGE_X + LOUNGE_W / 2 - 40} y={LOUNGE_Y + 42}
        width={80} text="TV" fontSize={10} fill={C.accent} align="center" />

      {/* Sofas */}
      <Rect x={LOUNGE_X + 16} y={LOUNGE_Y + 80} width={55} height={90}
        fill="rgba(255,255,255,0.06)" stroke={C.commonStroke} strokeWidth={1} cornerRadius={4} />
      <Text x={LOUNGE_X + 16} y={LOUNGE_Y + 118} width={55}
        text="Sofa" fontSize={10} fill={C.textMuted} align="center" />

      <Rect x={LOUNGE_X + LOUNGE_W - 75} y={LOUNGE_Y + 80} width={55} height={90}
        fill="rgba(255,255,255,0.06)" stroke={C.commonStroke} strokeWidth={1} cornerRadius={4} />
      <Text x={LOUNGE_X + LOUNGE_W - 75} y={LOUNGE_Y + 118} width={55}
        text="Sofa" fontSize={10} fill={C.textMuted} align="center" />

      <Rect x={LOUNGE_X + LOUNGE_W / 2 - 35} y={LOUNGE_Y + 140} width={70} height={50}
        fill="rgba(255,255,255,0.06)" stroke={C.commonStroke} strokeWidth={1} cornerRadius={4} />
      <Text x={LOUNGE_X + LOUNGE_W / 2 - 35} y={LOUNGE_Y + 158} width={70}
        text="Sofa" fontSize={10} fill={C.textMuted} align="center" />

      {/* Dining Table */}
      <Rect x={DINING_X} y={DINING_Y} width={DINING_W} height={DINING_H}
        fill="rgba(255,255,255,0.05)" stroke={C.commonStroke} strokeWidth={1.5} cornerRadius={4} />
      <Text x={DINING_X} y={DINING_Y + DINING_H / 2 - 7} width={DINING_W}
        text="Dining Table" fontSize={11} fill={C.textMuted} align="center" />

      {/* Chairs around dining table */}
      {[0.15, 0.38, 0.62, 0.85].map((pct, i) => (
        <React.Fragment key={`chair-top-${i}`}>
          <Rect
            x={DINING_X + DINING_W * pct - 12} y={DINING_Y - 18}
            width={24} height={16}
            fill="rgba(255,255,255,0.08)" stroke={C.commonStroke} strokeWidth={1} cornerRadius={3}
          />
          <Rect
            x={DINING_X + DINING_W * pct - 12} y={DINING_Y + DINING_H + 2}
            width={24} height={16}
            fill="rgba(255,255,255,0.08)" stroke={C.commonStroke} strokeWidth={1} cornerRadius={3}
          />
        </React.Fragment>
      ))}
      {/* Right side chair */}
      <Rect x={DINING_X + DINING_W + 4} y={DINING_Y + DINING_H / 2 - 12}
        width={16} height={24}
        fill="rgba(255,255,255,0.08)" stroke={C.commonStroke} strokeWidth={1} cornerRadius={3} />

      {/* Workspace */}
      <Rect x={WORK_X} y={WORK_Y} width={WORK_W} height={WORK_H}
        fill="rgba(255,255,255,0.05)" stroke={C.commonStroke} strokeWidth={1.5} cornerRadius={4} />
      <Text x={WORK_X} y={WORK_Y + WORK_H / 2 - 7} width={WORK_W}
        text="Work space" fontSize={10} fill={C.textMuted} align="center" />

      {/* ══════════════ RIGHT WING ══════════════ */}

      {/* Room 1 */}
      <Rect x={R1_X} y={R1_Y} width={R1_W} height={R1_H}
        fill={C.roomFill} stroke={C.roomStroke} strokeWidth={1.5} />
      <Text x={R1_X + 10} y={R1_Y + R1_H - 30}
        text={r1Name} fontSize={12} fill={C.textPrimary} fontStyle="bold" />

      {/* Room 1 door (left side) */}
      <Text x={R1_X - 2} y={R1_Y + R1_H - 20}
        text="Door" fontSize={9} fill={C.door} />
      <Arc
        x={R1_X} y={R1_Y + R1_H}
        innerRadius={0} outerRadius={35}
        angle={90} rotation={180}
        stroke={C.door} strokeWidth={1} fill="transparent"
      />

      {/* Beds in Room 1 (side by side at top) */}
      <Rect x={R1_BED_A.x} y={R1_BED_A.y} width={BED_W} height={BED_H + 20}
        fill={C.bedFill} stroke={C.bedStroke} strokeWidth={1.5} cornerRadius={4} />
      <Text x={R1_BED_A.x} y={R1_BED_A.y + (BED_H + 20) / 2 - 7} width={BED_W}
        text="Bed" fontSize={11} fill={C.textMuted} align="center" />

      <Rect x={R1_BED_B.x} y={R1_BED_B.y} width={BED_W} height={BED_H + 20}
        fill={C.bedFill} stroke={C.bedStroke} strokeWidth={1.5} cornerRadius={4} />
      <Text x={R1_BED_B.x} y={R1_BED_B.y + (BED_H + 20) / 2 - 7} width={BED_W}
        text="Bed" fontSize={11} fill={C.textMuted} align="center" />

      {/* Washroom 1A (top-right of Room 1, arc door) */}
      <Rect x={WC1A_X} y={WC1A_Y} width={WC1A_W} height={WC1A_H}
        fill={C.wcFill} stroke={C.wcStroke} strokeWidth={1.5} />
      <Text x={WC1A_X} y={WC1A_Y + 14} width={WC1A_W}
        text="Washroom" fontSize={10} fill={C.textMuted} align="center" />
      {/* Arc door for washroom */}
      <Arc
        x={WC1A_X} y={WC1A_Y}
        innerRadius={0} outerRadius={40}
        angle={90} rotation={0}
        stroke={C.door} strokeWidth={1.5} fill="transparent"
      />

      {/* Washroom 1B */}
      <Rect x={WC1B_X} y={WC1B_Y} width={WC1B_W} height={WC1B_H}
        fill={C.wcFill} stroke={C.wcStroke} strokeWidth={1.5} />
      <Text x={WC1B_X} y={WC1B_Y + 20} width={WC1B_W}
        text="Washroom" fontSize={10} fill={C.textMuted} align="center" />

      {/* Room 3 */}
      <Rect x={R3_X} y={R3_Y} width={R3_W} height={R3_H}
        fill={C.roomFill} stroke={C.roomStroke} strokeWidth={1.5} />
      <Text x={R3_X + 10} y={R3_Y + R3_H - 30}
        text={r3Name} fontSize={12} fill={C.textPrimary} fontStyle="bold" />

      {/* Room 3 door */}
      <Text x={R3_X - 2} y={R3_Y + R3_H - 20}
        text="Door" fontSize={9} fill={C.door} />
      <Arc
        x={R3_X} y={R3_Y + R3_H}
        innerRadius={0} outerRadius={35}
        angle={90} rotation={180}
        stroke={C.door} strokeWidth={1} fill="transparent"
      />

      {/* Beds in Room 3 */}
      <Rect x={R3_BED_A.x} y={R3_BED_A.y} width={BED_W + 20} height={BED_H}
        fill={C.bedFill} stroke={C.bedStroke} strokeWidth={1.5} cornerRadius={4} />
      <Text x={R3_BED_A.x} y={R3_BED_A.y + BED_H / 2 - 7} width={BED_W + 20}
        text="Bed" fontSize={11} fill={C.textMuted} align="center" />

      <Rect x={R3_BED_B.x} y={R3_BED_B.y} width={BED_W - 20} height={BED_H + 20}
        fill={C.bedFill} stroke={C.bedStroke} strokeWidth={1.5} cornerRadius={4} />
      <Text x={R3_BED_B.x} y={R3_BED_B.y + (BED_H + 20) / 2 - 7} width={BED_W - 20}
        text="Bed" fontSize={11} fill={C.textMuted} align="center" />

      {/* Kitchen (arc door bottom-left) */}
      <Rect x={KITCHEN_X} y={KITCHEN_Y} width={KITCHEN_W} height={KITCHEN_H}
        fill={C.commonFill} stroke={C.commonStroke} strokeWidth={1.5} />
      <Text x={KITCHEN_X} y={KITCHEN_Y + KITCHEN_H / 2 - 7} width={KITCHEN_W}
        text="Kitchen" fontSize={13} fill={C.textMuted} align="center" />
      {/* Kitchen arc door */}
      <Arc
        x={KITCHEN_X} y={KITCHEN_Y}
        innerRadius={0} outerRadius={50}
        angle={90} rotation={270}
        stroke={C.door} strokeWidth={1.5} fill="transparent"
      />
    </Layer>
  )
})
