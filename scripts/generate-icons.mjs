// Renders the app icons into public/icons as PNG files using only Node
// built-ins (zlib for deflate). Runs on `npm install` (postinstall), so local
// dev and Docker builds always have the icons without committing binaries.
//
// The artwork is drawn procedurally: a rounded dark tile, two accent arcs
// with arrowheads ("exchange"), and a white currency-like glyph in the centre.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'public', 'icons')

const BG = [0x1c, 0x1d, 0x24]
const ACCENT = [0x4b, 0x5b, 0xff]
const WHITE = [0xff, 0xff, 0xff]

/** Supersampling factor for anti-aliased edges. */
const SS = 4

// ---------- geometry helpers (all in unit coordinates, 0..1) ----------

function inRoundedSquare(x, y, radius) {
  const cx = Math.min(Math.max(x, radius), 1 - radius)
  const cy = Math.min(Math.max(y, radius), 1 - radius)
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
}

function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r)
  const cy = Math.min(Math.max(y, y0 + r), y1 - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2
}

function angleOf(x, y, cx, cy) {
  let a = (Math.atan2(y - cy, x - cx) * 180) / Math.PI
  if (a < 0) a += 360
  return a
}

function inArc(x, y, cx, cy, r, width, start, end) {
  const d = Math.hypot(x - cx, y - cy)
  if (d < r - width / 2 || d > r + width / 2) return false
  const a = angleOf(x, y, cx, cy)
  return start <= end ? a >= start && a <= end : a >= start || a <= end
}

function inTriangle(px, py, [ax, ay], [bx, by], [cx, cy]) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by)
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy)
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

function arrowHead(cx, cy, r, endDeg, size) {
  const a = (endDeg * Math.PI) / 180
  const px = cx + r * Math.cos(a)
  const py = cy + r * Math.sin(a)
  const tx = -Math.sin(a)
  const ty = Math.cos(a)
  const nx = Math.cos(a)
  const ny = Math.sin(a)
  return [
    [px + tx * size, py + ty * size],
    [px + nx * size * 0.6, py + ny * size * 0.6],
    [px - nx * size * 0.6, py - ny * size * 0.6],
  ]
}

// ---------- the artwork ----------

/**
 * Returns the colour at unit coordinates (x, y), or null for transparent.
 * `inset` shrinks the artwork for maskable icons (safe zone).
 */
function makeShader({ maskable }) {
  const inset = maskable ? 0.1 : 0
  const scale = 1 - 2 * inset
  const r = 0.34 * scale
  const w = 0.08 * scale
  const heads = [
    arrowHead(0.5, 0.5, r, 335, 0.13 * scale),
    arrowHead(0.5, 0.5, r, 155, 0.13 * scale),
  ]
  const bw = 0.07 * scale

  return (x, y) => {
    if (!maskable && !inRoundedSquare(x, y, 0.22)) return null

    if (
      inRoundedRect(
        x,
        y,
        0.5 - bw / 2,
        0.5 - 0.17 * scale,
        0.5 + bw / 2,
        0.5 + 0.17 * scale,
        bw / 2,
      ) ||
      inRoundedRect(
        x,
        y,
        0.5 - 0.12 * scale,
        0.5 - 0.105 * scale - bw / 2,
        0.5 + 0.12 * scale,
        0.5 - 0.105 * scale + bw / 2,
        bw / 2,
      ) ||
      inRoundedRect(
        x,
        y,
        0.5 - 0.12 * scale,
        0.5 + 0.105 * scale - bw / 2,
        0.5 + 0.12 * scale,
        0.5 + 0.105 * scale + bw / 2,
        bw / 2,
      )
    ) {
      return WHITE
    }

    if (
      inArc(x, y, 0.5, 0.5, r, w, 200, 335) ||
      inArc(x, y, 0.5, 0.5, r, w, 20, 155) ||
      heads.some((tri) => inTriangle(x, y, ...tri))
    ) {
      return ACCENT
    }

    return BG
  }
}

// ---------- rasteriser ----------

function render(size, options) {
  const shade = makeShader(options)
  const pixels = Buffer.alloc(size * size * 4)
  const samples = SS * SS
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const x = (px + (sx + 0.5) / SS) / size
          const y = (py + (sy + 0.5) / SS) / size
          const c = shade(x, y)
          if (c) {
            r += c[0]
            g += c[1]
            b += c[2]
            a += 1
          }
        }
      }
      const i = (py * size + px) * 4
      if (a > 0) {
        pixels[i] = Math.round(r / a)
        pixels[i + 1] = Math.round(g / a)
        pixels[i + 2] = Math.round(b / a)
        pixels[i + 3] = Math.round((a / samples) * 255)
      }
    }
  }
  return pixels
}

// ---------- minimal PNG encoder ----------

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // colour type: RGBA
  header[10] = 0 // compression
  header[11] = 0 // filter
  header[12] = 0 // interlace

  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0 // filter type: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- main ----------

const icons = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: true },
  { name: 'favicon.png', size: 64, maskable: false },
]

mkdirSync(outDir, { recursive: true })
for (const { name, size, maskable } of icons) {
  writeFileSync(join(outDir, name), encodePng(size, render(size, { maskable })))
}
console.log(`Generated ${icons.length} icons into public/icons`)
