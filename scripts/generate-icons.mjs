/**
 * Generates PNG icons for PWA home screen using only Node.js built-ins.
 * Renders a house icon on a rich blue gradient background.
 *
 * Run: node scripts/generate-icons.mjs
 */

import { writeFileSync } from 'node:fs'
import zlib from 'node:zlib'

// ── PNG encoder (pure Node.js, no deps) ──────────────────────────────────────

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[i] = c
    }
    return t
  })()
  let crc = 0xffffffff
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function u32be(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n)
  return b
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const crc = crc32(Buffer.concat([t, d]))
  return Buffer.concat([u32be(d.length), t, d, u32be(crc)])
}

// ── Color helpers ─────────────────────────────────────────────────────────────

/** Linear interpolation between two values */
function lerp(a, b, t) { return a + (b - a) * t }

/** Blend src (with alpha) over dst (RGBA arrays) */
function blendOver(dst, src) {
  const a = src[3] / 255
  const ia = 1 - a
  return [
    Math.round(src[0] * a + dst[0] * ia),
    Math.round(src[1] * a + dst[1] * ia),
    Math.round(src[2] * a + dst[2] * ia),
    Math.min(255, dst[3] + Math.round(src[3] * (1 - dst[3] / 255))),
  ]
}

/** Distance from point to line segment (for anti-aliased lines) */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - x1, py - y1)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

// ── Renderer ──────────────────────────────────────────────────────────────────

function makePng(size) {
  const pixels = new Uint8Array(size * size * 4)

  const s = size / 512  // scale factor

  // ── Background gradient (top-left dark blue → bottom-right bright blue) ──
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (size * 2)
      const r = Math.round(lerp(26,  28,  t))   // #1a → #1c
      const g = Math.round(lerp(58,  142, t))   // #3a → #8e
      const b = Math.round(lerp(110, 229, t))   // #6e → #e5
      const idx = (y * size + x) * 4
      pixels[idx]     = r
      pixels[idx + 1] = g
      pixels[idx + 2] = b
      pixels[idx + 3] = 255
    }
  }

  // ── Rounded rectangle mask (corner radius = size * 0.225) ──
  const radius = Math.round(size * 0.225)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x < radius ? radius : x >= size - radius ? size - radius - 1 : x
      const cy = y < radius ? radius : y >= size - radius ? size - radius - 1 : y
      const inCorner = (x < radius || x >= size - radius) && (y < radius || y >= size - radius)
      if (inCorner) {
        const dist = Math.hypot(x - cx, y - cy)
        if (dist > radius) {
          pixels[(y * size + x) * 4 + 3] = 0
        } else if (dist > radius - 1.5) {
          // Anti-alias edge
          const alpha = Math.round((radius - dist) * 255 / 1.5)
          pixels[(y * size + x) * 4 + 3] = alpha
        }
      }
    }
  }

  // ── Helper: set pixel with alpha blending ──
  function setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const idx = (y * size + x) * 4
    const dst = [pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]]
    const blended = blendOver(dst, [r, g, b, a])
    pixels[idx]     = blended[0]
    pixels[idx + 1] = blended[1]
    pixels[idx + 2] = blended[2]
    pixels[idx + 3] = blended[3]
  }

  // ── Helper: fill rectangle ──
  function fillRect(x, y, w, h, r, g, b, a = 255, cornerR = 0) {
    for (let py = Math.floor(y); py < Math.ceil(y + h); py++) {
      for (let px = Math.floor(x); px < Math.ceil(x + w); px++) {
        if (px < 0 || px >= size || py < 0 || py >= size) continue
        // Rounded corners
        if (cornerR > 0) {
          const inTL = px < x + cornerR && py < y + cornerR
          const inTR = px >= x + w - cornerR && py < y + cornerR
          const inBL = px < x + cornerR && py >= y + h - cornerR
          const inBR = px >= x + w - cornerR && py >= y + h - cornerR
          if (inTL || inTR || inBL || inBR) {
            const cx = inTL || inBL ? x + cornerR : x + w - cornerR
            const cy = inTL || inTR ? y + cornerR : y + h - cornerR
            const dist = Math.hypot(px - cx, py - cy)
            if (dist > cornerR) continue
            if (dist > cornerR - 1.5) {
              const aa = Math.round((cornerR - dist) / 1.5 * a)
              setPixel(px, py, r, g, b, aa)
              continue
            }
          }
        }
        setPixel(px, py, r, g, b, a)
      }
    }
  }

  // ── Helper: fill triangle (polygon) ──
  function fillTriangle(x1, y1, x2, y2, x3, y3, r, g, b, a = 255) {
    const minY = Math.floor(Math.min(y1, y2, y3))
    const maxY = Math.ceil(Math.max(y1, y2, y3))
    for (let py = minY; py <= maxY; py++) {
      // Scanline intersections
      const intersections = []
      const edges = [[x1,y1,x2,y2],[x2,y2,x3,y3],[x3,y3,x1,y1]]
      for (const [ex1,ey1,ex2,ey2] of edges) {
        if ((ey1 <= py && ey2 > py) || (ey2 <= py && ey1 > py)) {
          const t = (py - ey1) / (ey2 - ey1)
          intersections.push(ex1 + t * (ex2 - ex1))
        }
      }
      if (intersections.length < 2) continue
      intersections.sort((a, b) => a - b)
      for (let px = Math.floor(intersections[0]); px <= Math.ceil(intersections[1]); px++) {
        // Anti-alias edges
        const edgeDist = Math.min(
          distToSegment(px, py, x1, y1, x2, y2),
          distToSegment(px, py, x2, y2, x3, y3),
          distToSegment(px, py, x3, y3, x1, y1)
        )
        const aa = edgeDist < 1.2 ? Math.round(edgeDist / 1.2 * a) : a
        setPixel(px, py, r, g, b, aa)
      }
    }
  }

  // ── Helper: draw anti-aliased line ──
  function drawLine(x1, y1, x2, y2, r, g, b, a = 255, width = 1) {
    const steps = Math.ceil(Math.max(Math.abs(x2-x1), Math.abs(y2-y1)) * 2)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = lerp(x1, x2, t)
      const py = lerp(y1, y2, t)
      // Draw a small circle at each point for width
      for (let dy = -width; dy <= width; dy++) {
        for (let dx = -width; dx <= width; dx++) {
          const dist = Math.hypot(dx, dy)
          if (dist <= width) {
            const aa = dist > width - 1 ? Math.round((width - dist) * a) : a
            setPixel(Math.round(px + dx), Math.round(py + dy), r, g, b, aa)
          }
        }
      }
    }
  }

  // ── Helper: fill circle ──
  function fillCircle(cx, cy, r2, red, g2, b2, a = 255) {
    for (let py = Math.floor(cy - r2); py <= Math.ceil(cy + r2); py++) {
      for (let px = Math.floor(cx - r2); px <= Math.ceil(cx + r2); px++) {
        const dist = Math.hypot(px - cx, py - cy)
        if (dist <= r2) {
          const aa = dist > r2 - 1.5 ? Math.round((r2 - dist) / 1.5 * a) : a
          setPixel(px, py, red, g2, b2, aa)
        }
      }
    }
  }

  // ── Helper: fill ellipse ──
  function fillEllipse(cx, cy, rx, ry, red, g2, b2, a = 255) {
    for (let py = Math.floor(cy - ry); py <= Math.ceil(cy + ry); py++) {
      for (let px = Math.floor(cx - rx); px <= Math.ceil(cx + rx); px++) {
        const d = (px - cx) ** 2 / rx ** 2 + (py - cy) ** 2 / ry ** 2
        if (d <= 1) {
          const edgeDist = (1 - Math.sqrt(d)) * Math.min(rx, ry)
          const aa = edgeDist < 1.5 ? Math.round(edgeDist / 1.5 * a) : a
          setPixel(px, py, red, g2, b2, aa)
        }
      }
    }
  }

  // ── Scale coordinates from 512-base ──
  function sc(v) { return v * s }

  // ── Top shine overlay ──
  for (let y = 0; y < size * 0.55; y++) {
    const t = y / (size * 0.55)
    const a = Math.round((1 - t) * 30)  // max 30/255 opacity
    for (let x = 0; x < size; x++) {
      setPixel(x, y, 255, 255, 255, a)
    }
  }

  // ── Chimney (behind roof) ──
  fillRect(sc(310), sc(118), sc(32), sc(62), 220, 235, 248, 230, sc(5))

  // ── Roof (triangle) — white/light blue ──
  fillTriangle(sc(256), sc(88), sc(406), sc(228), sc(106), sc(228), 255, 255, 255, 245)

  // ── Roof ridge highlight ──
  fillTriangle(sc(256), sc(88), sc(406), sc(228), sc(386), sc(228), 255, 255, 255, 45)
  fillTriangle(sc(256), sc(88), sc(126), sc(228), sc(106), sc(228), 255, 255, 255, 45)

  // ── House body ──
  fillRect(sc(138), sc(226), sc(236), sc(188), 240, 248, 255, 242, sc(8))

  // ── Left window ──
  fillRect(sc(158), sc(256), sc(68), sc(58), 100, 190, 240, 210, sc(10))
  // Window glare
  fillRect(sc(162), sc(260), sc(26), sc(22), 255, 255, 255, 65, sc(4))
  // Window frame
  drawLine(sc(192), sc(258), sc(192), sc(312), 255, 255, 255, 180, sc(1.2))
  drawLine(sc(160), sc(285), sc(224), sc(285), 255, 255, 255, 180, sc(1.2))

  // ── Right window ──
  fillRect(sc(286), sc(256), sc(68), sc(58), 100, 190, 240, 210, sc(10))
  // Window glare
  fillRect(sc(290), sc(260), sc(26), sc(22), 255, 255, 255, 65, sc(4))
  // Window frame
  drawLine(sc(320), sc(258), sc(320), sc(312), 255, 255, 255, 180, sc(1.2))
  drawLine(sc(288), sc(285), sc(352), sc(285), 255, 255, 255, 180, sc(1.2))

  // ── Door ──
  fillRect(sc(218), sc(332), sc(76), sc(82), 10, 60, 120, 220, sc(38))
  // Door panel
  fillRect(sc(228), sc(344), sc(56), sc(36), 255, 255, 255, 20, sc(6))
  // Door knob (gold)
  fillCircle(sc(284), sc(374), sc(7), 255, 200, 70, 230)
  fillCircle(sc(284), sc(374), sc(4), 255, 220, 100, 200)

  // ── House base shadow line ──
  fillRect(sc(138), sc(410), sc(236), sc(6), 0, 40, 90, 40, sc(3))

  // ── Chimney smoke dots ──
  fillCircle(sc(326), sc(104), sc(7),  255, 255, 255, 90)
  fillCircle(sc(336), sc(88),  sc(5),  255, 255, 255, 65)
  fillCircle(sc(320), sc(76),  sc(4),  255, 255, 255, 45)

  // ── Three flatmate person silhouettes at bottom ──
  // Left person
  fillCircle(sc(196), sc(448), sc(9),  255, 255, 255, 140)
  fillEllipse(sc(196), sc(468), sc(13), sc(8), 255, 255, 255, 115)

  // Center person (slightly larger)
  fillCircle(sc(256), sc(445), sc(11), 255, 255, 255, 180)
  fillEllipse(sc(256), sc(467), sc(15), sc(9), 255, 255, 255, 155)

  // Right person
  fillCircle(sc(316), sc(448), sc(9),  255, 255, 255, 140)
  fillEllipse(sc(316), sc(468), sc(13), sc(8), 255, 255, 255, 115)

  // ── Build PNG ──
  const scanlines = []
  for (let y = 0; y < size; y++) {
    scanlines.push(0) // filter type None
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      scanlines.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3])
    }
  }

  const raw = Buffer.from(scanlines)
  const compressed = zlib.deflateSync(raw, { level: 9 })

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = chunk('IHDR', Buffer.concat([
    u32be(size), u32be(size),
    Buffer.from([8, 6, 0, 0, 0]) // 8-bit RGBA
  ]))
  const idat = chunk('IDAT', compressed)
  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdr, idat, iend])
}

// ── Generate all required sizes ───────────────────────────────────────────────

const icons = [
  { file: 'public/pwa-icon.png',         size: 512 },
  { file: 'public/pwa-192.png',          size: 192 },
  { file: 'public/pwa-512.png',          size: 512 },
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/favicon-32.png',       size: 32  },
  { file: 'public/favicon-16.png',       size: 16  },
]

for (const { file, size } of icons) {
  console.log(`Generating ${file} (${size}×${size})…`)
  const png = makePng(size)
  writeFileSync(file, png)
  console.log(`  ✓ ${file} (${png.length} bytes)`)
}

console.log('\nAll icons generated successfully.')
