/**
 * Generates PNG icons for PWA home screen using only Node.js built-ins.
 * Writes minimal valid PNG files with the MilBaant "M" logo on a blue background.
 *
 * Run: node scripts/generate-icons.mjs
 */

import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
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

/**
 * Render a square PNG with:
 *  - solid background color
 *  - a centered letter drawn as a simple bitmap font approximation
 *    (we use a filled rectangle approach — letter "M" as pixel art)
 */
function makePng(size, bgR, bgG, bgB, letter = 'M') {
  // Build raw RGBA pixel data
  const pixels = new Uint8Array(size * size * 4)

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4 + 0] = bgR
    pixels[i * 4 + 1] = bgG
    pixels[i * 4 + 2] = bgB
    pixels[i * 4 + 3] = 255
  }

  // Draw rounded rectangle mask (corner radius = size * 0.2)
  const r = Math.round(size * 0.2)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Check if pixel is outside rounded corners
      const inCornerTL = x < r && y < r && (x - r) ** 2 + (y - r) ** 2 > r * r
      const inCornerTR = x >= size - r && y < r && (x - (size - r - 1)) ** 2 + (y - r) ** 2 > r * r
      const inCornerBL = x < r && y >= size - r && (x - r) ** 2 + (y - (size - r - 1)) ** 2 > r * r
      const inCornerBR = x >= size - r && y >= size - r && (x - (size - r - 1)) ** 2 + (y - (size - r - 1)) ** 2 > r * r
      if (inCornerTL || inCornerTR || inCornerBL || inCornerBR) {
        pixels[(y * size + x) * 4 + 3] = 0 // transparent
      }
    }
  }

  // Draw letter "M" as white pixels using a scaled pixel-art grid
  // 5x7 pixel art for "M":
  const M_BITMAP = [
    [1,0,0,0,1],
    [1,1,0,1,1],
    [1,0,1,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ]

  const letterW = 5
  const letterH = 7
  const scale = Math.floor(size * 0.55 / letterW)
  const offX = Math.floor((size - letterW * scale) / 2)
  const offY = Math.floor((size - letterH * scale) / 2)

  for (let row = 0; row < letterH; row++) {
    for (let col = 0; col < letterW; col++) {
      if (M_BITMAP[row][col]) {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const px = offX + col * scale + dx
            const py = offY + row * scale + dy
            if (px >= 0 && px < size && py >= 0 && py < size) {
              const idx = (py * size + px) * 4
              pixels[idx + 0] = 255
              pixels[idx + 1] = 255
              pixels[idx + 2] = 255
              pixels[idx + 3] = 255
            }
          }
        }
      }
    }
  }

  // Build PNG scanlines (filter byte 0 = None per row)
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

// MilBaant brand blue: #1c8ee5 = rgb(28, 142, 229)
const R = 28, G = 142, B = 229

const icons = [
  { file: 'public/pwa-192.png',          size: 192 },
  { file: 'public/pwa-512.png',          size: 512 },
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/favicon-32.png',       size: 32  },
  { file: 'public/favicon-16.png',       size: 16  },
]

for (const { file, size } of icons) {
  const png = makePng(size, R, G, B)
  writeFileSync(file, png)
  console.log(`✓ ${file} (${size}×${size}, ${png.length} bytes)`)
}

console.log('\nAll icons generated successfully.')
