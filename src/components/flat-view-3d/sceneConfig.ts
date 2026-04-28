/**
 * Scene configuration — room layout, colors, bed positions.
 *
 * Floor plan (top-down, Z- = back wall, Z+ = front/camera):
 *
 *   Left column (X+)          Right column (X-)
 *   ┌──────────────┐           ┌──────────────┐
 *   │   Room 2     │  hallway  │   Room 1     │
 *   │   (mint)     │           │  (sky blue)  │
 *   ├──────────────┤           ├──────────────┤
 *   │   Room 3     │           │   Lounge     │
 *   │   (peach)    │           │  (lavender)  │
 *   ├──────────────┤           └──────────────┘
 *   │   Kitchen    │
 *   │   (yellow)   │
 *   └──────────────┘
 *
 * Units: 1 unit ≈ 1 metre
 */

export const ROOM_COLORS = {
  room1:   { wall: '#c9dff5', floor: '#e8f4fd', accent: '#5b9bd5', name: 'Room 1'  },
  room2:   { wall: '#c5e1c5', floor: '#e0f2e0', accent: '#5aaa5a', name: 'Room 2'  },
  room3:   { wall: '#f5c6d0', floor: '#fde8ec', accent: '#e05070', name: 'Room 3'  },
  lounge:  { wall: '#d8c8ee', floor: '#ede0f8', accent: '#8855cc', name: 'Lounge'  },
  kitchen: { wall: '#f5e8b0', floor: '#fdf5d0', accent: '#c8a020', name: 'Kitchen' },
  hallway: { wall: '#ddd8cc', floor: '#ece8e0', accent: '#aaa090', name: 'Hallway' },
} as const

// ── Layout ─────────────────────────────────────────────────────────────────
export const RW  = 5.2   // room width
export const RD  = 4.8   // room depth
export const HW  = 1.2   // hallway width
export const WH  = 3.0   // wall height

// Left column centre X
export const LX  =  (RW + HW) / 2   // +3.2
// Right column centre X
export const RX  = -(RW + HW) / 2   // -3.2

// Row Z centres (top row = most negative Z)
export const Z1  = -(RD + 0.1)      // Room 2 / Room 1  top row
export const Z2  =  0.1             // Room 3 / Lounge   middle row
export const Z3  =  RD + 0.3        // Kitchen           bottom row (left only)

export const LAYOUT = { LX, RX, Z1, Z2, Z3, RW, RD, HW, WH } as const

// ── Bed configs ────────────────────────────────────────────────────────────
export interface BedConfig {
  key: string
  position: [number, number, number]
  rotation: number
  room: keyof typeof ROOM_COLORS
  label: string
}

const BS = 0.95   // bed side offset from room centre
const BZ = -1.5   // bed Z offset toward back wall

export const BED_CONFIGS: BedConfig[] = [
  { key: 'r1a', position: [RX - BS, 0, Z1 + BZ], rotation: 0, room: 'room1', label: 'Bed A' },
  { key: 'r1b', position: [RX + BS, 0, Z1 + BZ], rotation: 0, room: 'room1', label: 'Bed B' },
  { key: 'r2a', position: [LX - BS, 0, Z1 + BZ], rotation: 0, room: 'room2', label: 'Bed A' },
  { key: 'r2b', position: [LX + BS, 0, Z1 + BZ], rotation: 0, room: 'room2', label: 'Bed B' },
  { key: 'r3a', position: [LX - BS, 0, Z2 + BZ], rotation: 0, room: 'room3', label: 'Bed A' },
  { key: 'r3b', position: [LX + BS, 0, Z2 + BZ], rotation: 0, room: 'room3', label: 'Bed B' },
]

// ── Avatar palette ─────────────────────────────────────────────────────────
export const AVATAR_PALETTE = [
  { body: '#e05555', head: '#ffd3b6', hat: '#a02020', shirt: '#e05555' },
  { body: '#30b8b0', head: '#ffe0bd', hat: '#158880', shirt: '#30b8b0' },
  { body: '#8878f0', head: '#ffd3b6', hat: '#5040c0', shirt: '#8878f0' },
  { body: '#e060a0', head: '#ffe0bd', hat: '#a02070', shirt: '#e060a0' },
  { body: '#e8a030', head: '#ffd3b6', hat: '#b07010', shirt: '#e8a030' },
  { body: '#40c890', head: '#ffe0bd', hat: '#208860', shirt: '#40c890' },
]

// ── Camera ─────────────────────────────────────────────────────────────────
export const CAMERA_DEFAULT: [number, number, number] = [0, 12, 16]
export const CAMERA_TARGET:  [number, number, number] = [0, 0, 1]
