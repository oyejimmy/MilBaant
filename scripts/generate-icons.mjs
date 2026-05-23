/**
 * Generates PNG icons for the MilBaant PWA.
 * Renders the M-house logo on a violet→indigo→blue gradient.
 * Pure Node.js — no external deps.
 *
 * Run: node scripts/generate-icons.mjs
 */

import { writeFileSync } from 'node:fs'
import zlib from 'node:zlib'

// ── PNG encoder ───────────────────────────────────────────────────────────────

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

function u32be(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b }

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data)
  return Buffer.concat([u32be(d.length), t, d, u32be(crc32(Buffer.concat([t, d])))])
}

// ── Colour helpers ────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t }

function blendOver(dst, src) {
  const a = src[3] / 255, ia = 1 - a
  return [
    Math.round(src[0] * a + dst[0] * ia),
    Math.round(src[1] * a + dst[1] * ia),
    Math.round(src[2] * a + dst[2] * ia),
    Math.min(255, dst[3] + Math.round(src[3] * (1 - dst[3] / 255))),
  ]
}

// ── Renderer ──────────────────────────────────────────────────────────────────

function makePng(size) {
  const pixels = new Uint8Array(size * size * 4)
  const s = size / 512   // scale factor — all design coords are on 512×512 grid

  // Background: #5b21b6 rgb(91,33,182) → #1d4ed8 rgb(29,78,216) diagonal
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (size * 2)
      const idx = (y * size + x) * 4
      pixels[idx]     = Math.round(lerp(91,  29,  t))
      pixels[idx + 1] = Math.round(lerp(33,  78,  t))
      pixels[idx + 2] = Math.round(lerp(182, 216, t))
      pixels[idx + 3] = 255
    }
  }

  // Rounded rect mask (rx = 110/512 ≈ 21.5 %)
  const radius = Math.round(size * 0.215)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inCorner = (x < radius || x >= size - radius) && (y < radius || y >= size - radius)
      if (!inCorner) continue
      const cx = x < radius ? radius : size - radius - 1
      const cy = y < radius ? radius : size - radius - 1
      const dist = Math.hypot(x - cx, y - cy)
      const idx = (y * size + x) * 4
      if (dist > radius) {
        pixels[idx + 3] = 0
      } else if (dist > radius - 1.5) {
        pixels[idx + 3] = Math.round((radius - dist) * 255 / 1.5)
      }
    }
  }

  // ── Pixel helpers ──────────────────────────────────────────────────────────

  function setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const idx = (y * size + x) * 4
    const blended = blendOver(
      [pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]],
      [r, g, b, a]
    )
    pixels[idx] = blended[0]; pixels[idx+1] = blended[1]
    pixels[idx+2] = blended[2]; pixels[idx+3] = blended[3]
  }

  function fillCircle(cx, cy, r2, R, G, B, a = 255) {
    for (let py = Math.floor(cy - r2); py <= Math.ceil(cy + r2); py++) {
      for (let px = Math.floor(cx - r2); px <= Math.ceil(cx + r2); px++) {
        const d = Math.hypot(px - cx, py - cy)
        if (d <= r2) {
          const aa = d > r2 - 1.5 ? Math.round((r2 - d) / 1.5 * a) : a
          setPixel(px, py, R, G, B, aa)
        }
      }
    }
  }

  function drawLine(x1, y1, x2, y2, R, G, B, a = 255, w = 1) {
    const steps = Math.ceil(Math.max(Math.abs(x2-x1), Math.abs(y2-y1)) * 2)
    if (steps === 0) return
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = lerp(x1, x2, t), py = lerp(y1, y2, t)
      for (let dy = -w; dy <= w; dy++) {
        for (let dx = -w; dx <= w; dx++) {
          const d = Math.hypot(dx, dy)
          if (d <= w) {
            const aa = d > w - 1 ? Math.round((w - d) * a) : a
            setPixel(Math.round(px + dx), Math.round(py + dy), R, G, B, aa)
          }
        }
      }
    }
  }

  // Scanline polygon fill; colorFn(px,py) → [R,G,B,A]
  function fillPolygon(points, colorFn) {
    const ys = points.map(p => p[1])
    const minY = Math.floor(Math.min(...ys))
    const maxY = Math.ceil(Math.max(...ys))
    const n = points.length
    for (let py = minY; py <= maxY; py++) {
      const xs = []
      for (let i = 0; i < n; i++) {
        const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % n]
        if ((y1 <= py && y2 > py) || (y2 <= py && y1 > py))
          xs.push(x1 + (py - y1) / (y2 - y1) * (x2 - x1))
      }
      xs.sort((a, b) => a - b)
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = xs[i], x1 = xs[i + 1]
        for (let px = Math.floor(x0); px <= Math.ceil(x1); px++) {
          const edge = Math.min(px - x0, x1 - px)
          const col = colorFn(px, py)
          const aa = edge < 1.2 ? Math.max(0, Math.round(edge / 1.2 * col[3])) : col[3]
          setPixel(px, py, col[0], col[1], col[2], aa)
        }
      }
    }
  }

  function sc(v) { return v * s }

  // ── Top shine ──────────────────────────────────────────────────────────────
  for (let y = 0; y < size * 0.65; y++) {
    const a = Math.round((1 - y / (size * 0.65)) * 46)
    for (let x = 0; x < size; x++) setPixel(x, y, 255, 255, 255, a)
  }

  // Background colour at a point (with shine pre-applied) — used for cutout
  function bgAt(px, py) {
    const t = (px + py) / (size * 2)
    let r = Math.round(lerp(91, 29, t))
    let g = Math.round(lerp(33, 78, t))
    let b = Math.round(lerp(182, 216, t))
    if (py < size * 0.65) {
      const sa = (1 - py / (size * 0.65)) * (46 / 255)
      r = Math.round(r * (1 - sa) + 255 * sa)
      g = Math.round(g * (1 - sa) + 255 * sa)
      b = Math.round(b * (1 - sa) + 255 * sa)
    }
    return [r, g, b, 255]
  }

  // ── M outer polygon (white→lavender gradient top-to-bottom) ───────────────
  const mTop = sc(85), mBot = sc(358)
  fillPolygon(
    [[sc(108),mBot],[sc(108),sc(150)],[sc(256),sc(85)],[sc(404),sc(150)],[sc(404),mBot]],
    (_px, py) => {
      const t = (py - mTop) / (mBot - mTop)
      return [Math.round(lerp(255,199,t)), Math.round(lerp(255,215,t)), Math.round(lerp(255,254,t)), 248]
    }
  )

  // ── M inner cutout (restore background so the V is transparent) ───────────
  fillPolygon(
    [[sc(154),mBot],[sc(358),mBot],[sc(358),sc(222)],[sc(256),sc(166)],[sc(154),sc(222)]],
    (px, py) => bgAt(px, py)
  )

  // ── Left diagonal highlight ────────────────────────────────────────────────
  drawLine(sc(110), sc(152), sc(256), sc(87), 255, 255, 255, 97, sc(1.8))

  // ── Bezier arc connecting dots (quadratic: (182,422) ctrl(256,409) (330,422)) ──
  let prevX = sc(182), prevY = sc(422)
  for (let ti = 1; ti <= 40; ti++) {
    const t = ti / 40
    const bx = (1-t)*(1-t)*sc(182) + 2*(1-t)*t*sc(256) + t*t*sc(330)
    const by = (1-t)*(1-t)*sc(422) + 2*(1-t)*t*sc(409) + t*t*sc(422)
    const fade = Math.round(Math.sin(t * Math.PI) * 160)
    drawLine(prevX, prevY, bx, by, 103, 232, 249, fade, sc(1.3))
    prevX = bx; prevY = by
  }

  // ── Three flatmate dots ────────────────────────────────────────────────────
  fillCircle(sc(182), sc(426), sc(15), 165, 243, 252, 220)   // left  – light cyan
  fillCircle(sc(256), sc(421), sc(19), 103, 232, 249, 248)   // centre – bright cyan
  fillCircle(sc(330), sc(426), sc(15), 129, 140, 248, 220)   // right – periwinkle

  // ── Sparkle top-right ─────────────────────────────────────────────────────
  const [spx, spy, spr] = [sc(422), sc(76), sc(9)]
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    drawLine(spx, spy, spx + Math.cos(angle) * spr, spy + Math.sin(angle) * spr,
      255, 255, 255, 110, sc(2))
  }

  // ── Build PNG ─────────────────────────────────────────────────────────────
  const scanlines = []
  for (let y = 0; y < size; y++) {
    scanlines.push(0)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      scanlines.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3])
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(scanlines), { level: 9 })
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = chunk('IHDR', Buffer.concat([u32be(size), u32be(size), Buffer.from([8, 6, 0, 0, 0])]))
  return Buffer.concat([sig, ihdr, chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

// ── Generate all sizes ────────────────────────────────────────────────────────

const icons = [
  { file: 'public/pwa-icon.png',         size: 512 },
  { file: 'public/pwa-512.png',          size: 512 },
  { file: 'public/pwa-192.png',          size: 192 },
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/favicon-32.png',       size: 32  },
  { file: 'public/favicon-16.png',       size: 16  },
]

for (const { file, size } of icons) {
  process.stdout.write(`Generating ${file} (${size}×${size})… `)
  const png = makePng(size)
  writeFileSync(file, png)
  console.log(`✓  ${png.length} bytes`)
}
console.log('\nAll icons generated.')
