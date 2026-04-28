# 3D Flat View — Implementation Guide

## 🎨 Overview

A production-ready, interactive 3D apartment visualization built with **React Three Fiber**. Replaces the 2D Konva implementation with a warm, cartoon-style 3D scene featuring:

- **4 bedrooms** (sky blue, mint, peach, lavender) + lounge + kitchen
- **Low-poly cartoon avatars** with idle bob animations
- **Interactive beds** — click to assign flatmates (admin only)
- **Smooth camera controls** — orbit, zoom, pan
- **Warm lighting** — directional sun, ambient fill, room accent lights
- **Ambient effects** — floating dust motes, contact shadows
- **Responsive** — WebGL fallback for unsupported devices

---

## 📁 File Structure

```
src/components/flat-view-3d/
├── sceneConfig.ts        # Room colors, bed positions, avatar palette
├── ApartmentScene.tsx    # Static 3D geometry (rooms, furniture, plants)
├── Bed.tsx               # Interactive bed mesh with hover/pulse effects
├── Avatar3D.tsx          # Low-poly character with idle animation
├── AssignModal.tsx       # Ant Design modal for bed assignment
├── FlatView3D.tsx        # Main entry point (Canvas, data fetching, orchestration)
└── README.md             # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

Already installed:
```bash
npm install @react-three/fiber @react-three/drei three @types/three
```

### 2. Use the Component

The `FlatViewPage` component already imports and renders `FlatView3D`:

```tsx
import { Suspense, lazy } from 'react'
import { PageStack } from '@/components/Glass'

const FlatView3D = lazy(() => import('@/components/flat-view-3d/FlatView3D'))

export function FlatViewPage() {
  return (
    <PageStack>
      <Suspense fallback={<Loader />}>
        <FlatView3D />
      </Suspense>
    </PageStack>
  )
}
```

### 3. Run the App

```bash
npm run dev
```

Navigate to `/flat-view` to see the 3D apartment.

---

## 🎯 Key Features

### Interactive Beds
- **Hover**: Bed highlights with room accent color
- **Unassigned**: Pulsing glow animation + ring indicator
- **Occupied**: Shows flatmate name in floating label
- **Click (admin only)**: Opens assignment modal

### Cartoon Avatars
- **Low-poly design**: Box body, sphere head, cylinder hat
- **Idle animation**: Gentle bob up/down (random phase per avatar)
- **Hover**: Scales up 12%
- **Name tag**: Floating HTML label above head
- **Stable colors**: Each flatmate gets a consistent color from `AVATAR_PALETTE`

### Camera Controls (OrbitControls)
- **Orbit**: Left-drag to rotate around the apartment
- **Zoom**: Scroll wheel (min 4, max 22 units)
- **Pan**: Right-drag to move camera target
- **Reset**: Button in controls bar returns to default view
- **Damping**: Smooth, inertial movement

### Lighting
- **Directional sun**: Warm (#fff8e8) from upper-right, casts shadows
- **Fill light**: Cool (#d0e8ff) from left for depth
- **Ambient**: Warm (#fff5e0) base illumination
- **Point lights**: One per room (matches room accent color)
- **Environment**: HDR "apartment" preset for reflections

### Performance
- **Shadows**: 1024×1024 shadow map (balanced quality/performance)
- **DPR**: Capped at 1.5× for high-DPI displays
- **Fog**: Depth fade at 18–30 units (hides far geometry)
- **Suspense**: Lazy-loads Canvas and scene components
- **Memoization**: Stable maps for assignments, colors, positions

---

## 🗂️ Data Flow

```
useProfiles()       → all flatmates (for dropdown)
useBeds()           → DB beds (id, label, room_id, room.name)
useBedAssignments() → current assignments (bed_id → user_id + profile)
useAssignBed()      → mutation to save changes
useAuth()           → isAdmin flag

BED_CONFIGS (sceneConfig.ts)
  ↓
bedKeyToId map (matches 'r1a' → DB bed id via label + room name)
  ↓
assignmentByKey map (bedKey → BedAssignment)
  ↓
<Bed> components (show occupant, handle clicks)
<Avatar3D> components (render on assigned beds)
```

### Bed Key Mapping

The 3D scene uses keys like `r1a`, `r1b`, `r2a`, etc. These are mapped to DB bed IDs by:
1. Extracting room number and label from the key
2. Finding the DB bed where `label === 'Bed A'` and `room.name` contains the room number
3. Storing in `bedKeyToId` map

This allows the 3D scene to be independent of DB schema changes.

---

## 🎨 Customization

### Change Room Colors

Edit `sceneConfig.ts`:

```ts
export const ROOM_COLORS = {
  room1: { wall: '#b5d5f5', floor: '#d4eaf7', accent: '#7ab8e8', name: 'Room 1' },
  // ... add more rooms or change colors
}
```

### Add More Beds

1. Add to `BED_CONFIGS` in `sceneConfig.ts`:
   ```ts
   { key: 'r4a', position: [x, 0, z], rotation: 0, room: 'room4', label: 'Bed A' }
   ```
2. Update `bedKeyToId` logic in `FlatView3D.tsx` to match the new key to a DB bed

### Change Avatar Style

Edit `Avatar3D.tsx`:
- Adjust geometry sizes (e.g., head radius, body dimensions)
- Change materials (roughness, metalness, colors)
- Add accessories (glasses, backpack, etc.)

### Adjust Camera

Edit `sceneConfig.ts`:
```ts
export const CAMERA_DEFAULT: [number, number, number] = [0, 9, 12]  // [x, y, z]
export const CAMERA_TARGET: [number, number, number]  = [0, 0, -1]  // look-at point
```

Or in `FlatView3D.tsx`, change `OrbitControls` props:
```tsx
<OrbitControls
  minDistance={4}
  maxDistance={22}
  maxPolarAngle={Math.PI / 2.1}  // prevent going below floor
/>
```

### Add More Furniture

Edit `ApartmentScene.tsx`:
1. Create a new component (e.g., `Bookshelf`)
2. Use `RoundedBox` or primitive geometries
3. Add to the scene with `<Bookshelf position={[x, y, z]} />`

---

## 🐛 Troubleshooting

### "WebGL not supported" message
- User's browser/device doesn't support WebGL
- Fallback: Show an alert with instructions to upgrade browser
- Alternative: Render the old 2D Konva view as fallback (not implemented)

### Beds not clickable
- Check `isAdmin` flag — only admins can click beds
- Verify `onClick` handler is wired up in `<Bed>` component
- Check browser console for errors

### Avatars not showing
- Verify `useBedAssignments()` returns data
- Check `bedKeyToId` map is correctly matching DB beds
- Ensure `profile` is populated in the assignment (check Supabase query)

### Performance issues
- Reduce shadow map size: `shadow-mapSize={[512, 512]}`
- Lower DPR: `dpr={[1, 1]}`
- Disable fog: remove `<fog>` element
- Reduce dust mote count in `DustMotes` component

### TypeScript errors
- Ensure `@types/three` is installed
- Check `tsconfig.json` includes `"moduleResolution": "bundler"`
- Restart TypeScript server in your editor

---

## 🔧 Technical Details

### Why No Drag-and-Drop?

The 2D Konva version had draggable avatars. In 3D, drag-and-drop is:
- **Complex**: Requires raycasting, plane projection, collision detection
- **Unreliable**: Touch devices, mobile, different screen sizes
- **Overkill**: The modal UX is clearer and works everywhere

Instead, admins **click a bed → modal opens → select flatmate → assign**. This matches the existing `BedPopover` UX and is more accessible.

### Shadow Optimization

Shadows are expensive. We use:
- **1024×1024 map**: Good quality without killing performance
- **Tight shadow camera bounds**: Only covers the apartment area
- **ContactShadows**: Cheap, baked-looking shadows on the floor
- **Selective casting**: Only beds, avatars, and furniture cast shadows

### Material Choices

- **MeshStandardMaterial**: PBR (physically-based rendering) with roughness/metalness
- **Roughness 0.4–0.8**: Matte to slightly glossy (cartoon style)
- **Metalness 0–0.15**: Non-metallic (wood, fabric, skin)
- **No MeshToonMaterial**: Standard material with low metalness looks more natural

### Coordinate System

- **Y-up**: Y=0 is the floor, Y+ is up
- **Right-handed**: X+ is right, Z+ is toward camera
- **Units**: 1 unit ≈ 1 meter (beds are ~1.6×2.4 units)

---

## 📚 Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [Three.js Manual](https://threejs.org/manual/)
- [WebGL Fundamentals](https://webglfundamentals.org/)

---

## 🎉 What's Next?

Potential enhancements:
- **Animations**: Door open/close, avatar walk-in on assignment
- **Room details**: Wall art, windows with outside view, ceiling fans
- **Mobile optimization**: Simplified geometry, lower poly count
- **VR support**: Use `@react-three/xr` for immersive view
- **Day/night cycle**: Animate lighting based on time of day
- **Sound effects**: Ambient music, footsteps, door creaks

---

**Built with ❤️ using React Three Fiber**
