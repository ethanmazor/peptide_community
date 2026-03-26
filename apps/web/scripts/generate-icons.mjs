/**
 * Generates solid-color PNG icons for the PWA manifest.
 * Pure Node.js — no extra dependencies.
 * Run: node scripts/generate-icons.mjs
 *
 * Replace with a proper icon tool (e.g. @vite-pwa/assets-generator) when you
 * have a real logo. For now this produces clean teal squares that satisfy PWA
 * install requirements on iOS and Chrome.
 */

import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dir, '../public')
mkdirSync(publicDir, { recursive: true })

// CRC32 table (PNG chunk integrity)
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
  crcTable[i] = c
}
function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff]
  return ((crc ^ 0xffffffff) >>> 0)
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const t = Buffer.from(type)
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcVal])
}

/** Generate an RGBA PNG of `size×size` pixels using `fillFn(x, y) → [r,g,b,a]` */
function makePNG(size, fillFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // RGBA
  // bytes 10-12: compression=0, filter=0, interlace=0

  // Raw scanlines: 1 filter byte + 4 bytes/pixel per row
  const raw = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0 // filter type: None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = fillFn(x, y, size)
      const off = y * (1 + size * 4) + 1 + x * 4
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = a
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ─── Icon design ─────────────────────────────────────────────────────────────
// Teal background (#1D9E75) with a small inset rounded rect (white) for visual
// depth. Simple, recognisable, on-brand.

const TEAL   = [0x1d, 0x9e, 0x75, 255]
const WHITE  = [0xff, 0xff, 0xff, 255]
const TRANSP = [0x1d, 0x9e, 0x75,   0]

function iconFill(x, y, size) {
  const pad = Math.round(size * 0.18)
  const r   = Math.round(size * 0.14)   // corner radius of inner rect
  const ix = x - pad, iy = y - pad
  const iw = size - pad * 2, ih = size - pad * 2
  // Inside the inset rounded rect?
  if (ix >= 0 && iy >= 0 && ix < iw && iy < ih) {
    // Corner circles
    const corners = [[0,0],[iw-1,0],[0,ih-1],[iw-1,ih-1]]
    for (const [cx, cy] of corners) {
      const dx = ix - cx, dy = iy - cy
      const dist = Math.sqrt(dx*dx + dy*dy)
      if (Math.abs(ix - cx) < r && Math.abs(iy - cy) < r && dist > r) return TEAL
    }
    return WHITE
  }
  return TEAL
}

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 48,  name: 'favicon-48.png' },
]

for (const { size, name } of sizes) {
  const buf = makePNG(size, iconFill)
  const dest = join(publicDir, name)
  writeFileSync(dest, buf)
  console.log(`✓ ${name} (${size}×${size})`)
}

console.log('\nIcons written to apps/web/public/')
