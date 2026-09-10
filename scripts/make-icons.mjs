// Generates the PWA icon set into public/ with no image dependencies.
//
//   npm run build:icons
//
// A flat, opaque Poké-Ball mark on the app's dark ground — safe as both a
// regular and a maskable icon (the ball sits well inside the mask safe zone).

import { writeFile } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [14, 16, 20] // #0e1014
const ACCENT = [255, 90, 95] // #ff5a5f
const LIGHT = [232, 234, 240] // #e8eaf0

// ── minimal PNG encoder (8-bit RGBA, no filter) ────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++)
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'latin1')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  // 10,11,12 = 0 (compression, filter, interlace)

  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── the mark ──────────────────────────────────────────────
function render(size) {
  const buf = Buffer.alloc(size * size * 4)
  const c = size / 2
  const R = size * 0.34
  const band = size * 0.055
  const btnOuter = size * 0.12
  const btnInner = size * 0.06
  const SS = [0.17, 0.5, 0.83] // 3×3 supersample

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0
      let g = 0
      let b = 0
      for (const sy of SS) {
        for (const sx of SS) {
          const dx = px + sx - c
          const dy = py + sy - c
          const d = Math.hypot(dx, dy)
          let col = BG
          if (d <= R) {
            col = dy < 0 ? ACCENT : LIGHT
            if (Math.abs(dy) <= band) col = BG
            if (d <= btnOuter) col = LIGHT
            if (d <= btnInner) col = BG
          }
          r += col[0]
          g += col[1]
          b += col[2]
        }
      }
      const i = (py * size + px) * 4
      buf[i] = Math.round(r / 9)
      buf[i + 1] = Math.round(g / 9)
      buf[i + 2] = Math.round(b / 9)
      buf[i + 3] = 255
    }
  }
  return encodePNG(size, buf)
}

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#0e1014"/>
  <g>
    <circle cx="50" cy="50" r="34" fill="#e8eaf0"/>
    <path d="M16 50a34 34 0 0 1 68 0Z" fill="#ff5a5f"/>
    <rect x="16" y="45.5" width="68" height="9" fill="#0e1014"/>
    <circle cx="50" cy="50" r="12" fill="#e8eaf0"/>
    <circle cx="50" cy="50" r="6" fill="#0e1014"/>
  </g>
</svg>
`

async function main() {
  const targets = [
    ['pwa-192.png', 192],
    ['pwa-512.png', 512],
    ['pwa-maskable-512.png', 512],
    ['apple-touch-icon.png', 180],
  ]
  for (const [name, size] of targets) {
    await writeFile(join(PUBLIC, name), render(size))
    console.log(`  wrote public/${name} (${size}×${size})`)
  }
  await writeFile(join(PUBLIC, 'favicon.svg'), FAVICON_SVG)
  console.log('  wrote public/favicon.svg')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
