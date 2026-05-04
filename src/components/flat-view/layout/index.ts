/* ─── Canvas layout matching the actual flat floor plan ──────────────────── */

export const SCALE = 1          // base scale multiplier
export const PAD   = 30         // outer padding

// Overall canvas
export const CONTENT_W = 960
export const CONTENT_H = 900

// Left wing (Room 2 + washroom + lounge + dining + workspace)
export const LEFT_X   = PAD
export const LEFT_W   = 420

// Right wing (Room 1 + Room 3 + kitchen)
export const RIGHT_X  = LEFT_X + LEFT_W + 60
export const RIGHT_W  = CONTENT_W - RIGHT_X - PAD

// ── Room 2 (top-left) ──────────────────────────────────────────────────────
export const R2_X = LEFT_X
export const R2_Y = PAD + 60          // below washroom
export const R2_W = LEFT_W
export const R2_H = 200

// Washroom above Room 2
export const WC2_X = LEFT_X
export const WC2_Y = PAD
export const WC2_W = LEFT_W
export const WC2_H = 55

// Beds in Room 2 (stacked vertically on left side)
export const BED_W = 160
export const BED_H = 70
export const R2_BED_A = { x: R2_X + 20, y: R2_Y + 50 }
export const R2_BED_B = { x: R2_X + 20, y: R2_Y + 130 }

// ── TV Lounge (below Room 2) ───────────────────────────────────────────────
export const LOUNGE_X = LEFT_X
export const LOUNGE_Y = R2_Y + R2_H + 20
export const LOUNGE_W = LEFT_W
export const LOUNGE_H = 200

// ── Dining Table ──────────────────────────────────────────────────────────
export const DINING_X = LEFT_X
export const DINING_Y = LOUNGE_Y + LOUNGE_H + 20
export const DINING_W = LEFT_W - 20
export const DINING_H = 70

// ── Workspace ─────────────────────────────────────────────────────────────
export const WORK_X = LEFT_X
export const WORK_Y = DINING_Y + DINING_H + 20
export const WORK_W = 140
export const WORK_H = 60

// ── Room 1 (top-right) ────────────────────────────────────────────────────
export const R1_X = RIGHT_X
export const R1_Y = PAD
export const R1_W = RIGHT_W
export const R1_H = 220

// Beds in Room 1 (side by side at top)
export const R1_BED_A = { x: R1_X + 20,  y: R1_Y + 20 }
export const R1_BED_B = { x: R1_X + 200, y: R1_Y + 20 }

// Washroom 1 (arc door, top-right of Room 1)
export const WC1A_X = R1_X + R1_W - 130
export const WC1A_Y = R1_Y + 100
export const WC1A_W = 130
export const WC1A_H = 120

// Washroom 2 (small, below WC1A)
export const WC1B_X = R1_X + R1_W - 130
export const WC1B_Y = WC1A_Y + WC1A_H
export const WC1B_W = 130
export const WC1B_H = 60

// ── Room 3 (below Room 1) ─────────────────────────────────────────────────
export const R3_X = RIGHT_X
export const R3_Y = R1_Y + R1_H + 20
export const R3_W = RIGHT_W
export const R3_H = 200

// Beds in Room 3
export const R3_BED_A = { x: R3_X + 20,  y: R3_Y + 60 }
export const R3_BED_B = { x: R3_X + 220, y: R3_Y + 80 }

// ── Kitchen (bottom-right, arc door) ──────────────────────────────────────
export const KITCHEN_X = RIGHT_X
export const KITCHEN_Y = R3_Y + R3_H + 20
export const KITCHEN_W = RIGHT_W
export const KITCHEN_H = CONTENT_H - KITCHEN_Y - PAD

// ── Colors ────────────────────────────────────────────────────────────────
export const C = {
  wall:          '#1e2330',
  wallStroke:    '#909ffa',
  roomFill:      'rgba(144,159,250,0.06)',
  roomStroke:    'rgba(144,159,250,0.35)',
  wcFill:        'rgba(100,200,255,0.08)',
  wcStroke:      'rgba(100,200,255,0.4)',
  bedFill:       'rgba(255,255,255,0.08)',
  bedOccupied:   'rgba(144,159,250,0.28)',
  bedHover:      'rgba(144,159,250,0.45)',
  bedStroke:     'rgba(144,159,250,0.5)',
  commonFill:    'rgba(255,255,255,0.04)',
  commonStroke:  'rgba(255,255,255,0.18)',
  textPrimary:   '#f0f2f8',
  textMuted:     'rgba(240,242,248,0.5)',
  bgDark:        '#141720',
  accent:        '#909ffa',
  door:          '#faad14',
}

// All bed positions for drag-snap
export interface BedSlot {
  id: string   // 'r1a' | 'r1b' | 'r2a' | 'r2b' | 'r3a' | 'r3b'
  x: number
  y: number
  label: string
  roomName: string
}

export function getBedSlots(): BedSlot[] {
  return [
    { id: 'r1a', x: R1_BED_A.x, y: R1_BED_A.y, label: 'Bed A', roomName: 'Room 1' },
    { id: 'r1b', x: R1_BED_B.x, y: R1_BED_B.y, label: 'Bed B', roomName: 'Room 1' },
    { id: 'r2a', x: R2_BED_A.x, y: R2_BED_A.y, label: 'Bed A', roomName: 'Room 2' },
    { id: 'r2b', x: R2_BED_B.x, y: R2_BED_B.y, label: 'Bed B', roomName: 'Room 2' },
    { id: 'r3a', x: R3_BED_A.x, y: R3_BED_A.y, label: 'Bed A', roomName: 'Room 3' },
    { id: 'r3b', x: R3_BED_B.x, y: R3_BED_B.y, label: 'Bed B', roomName: 'Room 3' },
  ]
}

// Legacy exports so existing hooks don't break
export const CANVAS_PAD = PAD
export const ROOM_W = 260
export const ROOM_H = 190
export const ROOM_GAP = 24
export const WASHROOM_H = 55
export const WASHROOM_W = 70
export const CORRIDOR_H = 28
export const COMMON_H = 160
export const TOTAL_ROOMS = 3

export function getRoomLayouts() { return [] }
export function getCommonLayouts() { return [] }
