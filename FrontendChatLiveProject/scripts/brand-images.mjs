import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const INK = [5, 5, 6]
const ORANGE_LIGHT = [255, 138, 51]
const ORANGE = [255, 106, 0]
const ORANGE_DEEP = [194, 74, 0]
const WHITE = [255, 255, 255]

function canvas(width, height) {
  return { width, height, data: new Float32Array(width * height * 4) }
}

function blend(target, x, y, color, alpha) {
  if (alpha <= 0 || x < 0 || y < 0 || x >= target.width || y >= target.height) return

  const a = Math.min(1, alpha)
  const i = (y * target.width + x) * 4
  const d = target.data

  d[i] = d[i] * (1 - a) + color[0] * a
  d[i + 1] = d[i + 1] * (1 - a) + color[1] * a
  d[i + 2] = d[i + 2] * (1 - a) + color[2] * a
  d[i + 3] = d[i + 3] * (1 - a) + 255 * a
}

function fill(target, color) {
  for (let y = 0; y < target.height; y++) {
    for (let x = 0; x < target.width; x++) blend(target, x, y, color, 1)
  }
}

function mix(a, b, t) {
  const k = Math.max(0, Math.min(1, t))
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

function glow(target, cx, cy, radius, color, strength) {
  for (let y = 0; y < target.height; y++) {
    for (let x = 0; x < target.width; x++) {
      const d = Math.hypot(x - cx, y - cy) / radius
      if (d >= 1) continue
      const t = (1 - d) * (1 - d)
      blend(target, x, y, color, t * strength)
    }
  }
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const length = dx * dx + dy * dy
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length))
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t))
}

function stroke(target, points, width, color, alpha = 1) {
  const half = width / 2
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const [x, y] of points) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  const x0 = Math.max(0, Math.floor(minX - half - 2))
  const y0 = Math.max(0, Math.floor(minY - half - 2))
  const x1 = Math.min(target.width - 1, Math.ceil(maxX + half + 2))
  const y1 = Math.min(target.height - 1, Math.ceil(maxY + half + 2))

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let best = Infinity
      for (let i = 0; i < points.length - 1; i++) {
        const [ax, ay] = points[i]
        const [bx, by] = points[i + 1]
        best = Math.min(best, distanceToSegment(x + 0.5, y + 0.5, ax, ay, bx, by))
        if (best === 0) break
      }
      const coverage = Math.max(0, Math.min(1, half + 0.5 - best))
      if (coverage > 0) blend(target, x, y, color, coverage * alpha)
    }
  }
}

function arc(cx, cy, radius, fromDeg, toDeg, steps = 96) {
  const points = []
  for (let i = 0; i <= steps; i++) {
    const angle = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius])
  }
  return points
}

function ellipse(cx, cy, rx, ry, steps = 96) {
  const points = []
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry])
  }
  return points
}

function logo(target, cx, cy, size) {
  const unit = size / 48
  const radius = 20.5 * unit

  const bubbleY = cy - 1.5 * unit
  const tailX = cx - 15 * unit
  const tailY = cy + 20 * unit

  const x0 = Math.max(0, Math.floor(cx - radius - 2))
  const y0 = Math.max(0, Math.floor(bubbleY - radius - 2))
  const x1 = Math.min(target.width - 1, Math.ceil(cx + radius + 2))
  const y1 = Math.min(target.height - 1, Math.ceil(tailY + 2))

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const px = x + 0.5
      const py = y + 0.5

      let coverage = Math.max(0, Math.min(1, radius + 0.5 - Math.hypot(px - cx, py - bubbleY)))

      if (coverage < 1) {
        const tip = distanceToSegment(px, py, cx - 6 * unit, bubbleY + 15 * unit, tailX, tailY)
        const taper = 5.5 * unit * (1 - Math.min(1, Math.hypot(px - tailX, py - tailY) / (12 * unit)))
        coverage = Math.max(coverage, Math.max(0, Math.min(1, taper + 0.5 - tip)))
      }

      if (coverage <= 0) continue

      const t = (px - (cx - radius) + (py - (bubbleY - radius))) / (radius * 4)
      const color = t < 0.55 ? mix(ORANGE_LIGHT, ORANGE, t / 0.55) : mix(ORANGE, ORANGE_DEEP, (t - 0.55) / 0.45)

      blend(target, x, y, color, coverage)
    }
  }

  const globeR = 9.5 * unit
  const lineWidth = 2 * unit
  stroke(target, arc(cx, bubbleY, globeR, 0, 360), lineWidth, WHITE, 0.95)
  stroke(target, [[cx - globeR, bubbleY], [cx + globeR, bubbleY]], lineWidth, WHITE, 0.9)
  stroke(target, ellipse(cx, bubbleY, 4.4 * unit, globeR), lineWidth, WHITE, 0.9)

  const dotR = 3.4 * unit
  const dx = cx + 11.5 * unit
  const dy = bubbleY - 10 * unit
  for (let y = Math.floor(dy - dotR - 2); y <= Math.ceil(dy + dotR + 2); y++) {
    for (let x = Math.floor(dx - dotR - 2); x <= Math.ceil(dx + dotR + 2); x++) {
      const coverage = Math.max(0, Math.min(1, dotR + 0.5 - Math.hypot(x + 0.5 - dx, y + 0.5 - dy)))
      if (coverage > 0) blend(target, x, y, WHITE, coverage)
    }
  }
}

const GLYPHS = {
  C: { advance: 0.98, parts: [arc(0.52, 0.5, 0.42, 52, 308)] },
  h: {
    advance: 0.94,
    parts: [
      [[0.13, 1.04], [0.13, 0]],
      arc(0.45, 0.46, 0.32, 180, 0),
      [[0.77, 0.46], [0.77, 0]],
    ],
  },
  a: {
    advance: 0.94,
    parts: [arc(0.45, 0.36, 0.33, 0, 360), [[0.78, 0.69], [0.78, 0]]],
  },
  t: {
    advance: 0.64,
    parts: [
      [[0.36, 1.0], [0.36, 0.17]],
      arc(0.53, 0.17, 0.17, 180, 250),
      [[0.06, 0.72], [0.64, 0.72]],
    ],
  },
  L: { advance: 0.82, parts: [[[0.14, 1.0], [0.14, 0], [0.78, 0]]] },
  i: {
    advance: 0.32,
    parts: [[[0.16, 0.72], [0.16, 0]], arc(0.16, 0.93, 0.005, 0, 360, 8)],
  },
  v: { advance: 0.86, parts: [[[0.05, 0.72], [0.43, 0], [0.81, 0.72]]] },
  e: {
    advance: 0.92,
    parts: [arc(0.46, 0.36, 0.33, 0, 318), [[0.13, 0.36], [0.79, 0.36]]],
  },
}

function wordWidth(word, tracking) {
  let width = 0
  for (const letter of word) width += GLYPHS[letter].advance + tracking
  return width - tracking
}

function word(target, text, x, baseline, size, weight, color, tracking = 0.06) {
  let pen = x

  for (const letter of text) {
    const glyph = GLYPHS[letter]

    for (const part of glyph.parts) {
      const points = part.map(([gx, gy]) => [pen + gx * size, baseline - gy * size])
      stroke(target, points.length > 1 ? points : [points[0], points[0]], weight * size, color)
    }

    pen += (glyph.advance + tracking) * size
  }
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)

  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))

  return Buffer.concat([length, body, crc])
}

function writePng(file, source) {
  const width = source.width / 2
  const height = source.height / 2

  const raw = Buffer.alloc(height * (width * 4 + 1))
  let at = 0

  for (let y = 0; y < height; y++) {
    raw[at++] = 0
    for (let x = 0; x < width; x++) {
      for (let channel = 0; channel < 4; channel++) {
        const sum =
          source.data[((y * 2) * source.width + x * 2) * 4 + channel] +
          source.data[((y * 2) * source.width + x * 2 + 1) * 4 + channel] +
          source.data[((y * 2 + 1) * source.width + x * 2) * 4 + channel] +
          source.data[((y * 2 + 1) * source.width + x * 2 + 1) * 4 + channel]
        raw[at++] = Math.max(0, Math.min(255, Math.round(sum / 4)))
      }
    }
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  header[10] = 0
  header[11] = 0
  header[12] = 0

  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  )

  return { width, height }
}

function socialCard() {
  const scale = 2
  const width = 1200 * scale
  const height = 630 * scale
  const target = canvas(width, height)

  fill(target, INK)
  glow(target, width * 0.5, height * 0.3, width * 0.55, [255, 106, 0], 0.22)
  glow(target, width * 0.12, height * 0.95, width * 0.4, [90, 60, 200], 0.1)

  logo(target, width / 2, height * 0.33, 210 * scale)

  const size = 96 * scale
  const tracking = 0.06
  const baseline = height * 0.78
  const start = (width - wordWidth('ChatLive', tracking) * size) / 2
  word(target, 'Chat', start, baseline, size, 0.115, WHITE, tracking)
  word(
    target,
    'Live',
    start + (wordWidth('Chat', tracking) + tracking) * size,
    baseline,
    size,
    0.115,
    ORANGE_LIGHT,
    tracking,
  )

  const ruleWidth = 150 * scale
  stroke(
    target,
    [
      [width / 2 - ruleWidth, height * 0.875],
      [width / 2 + ruleWidth, height * 0.875],
    ],
    5 * scale,
    ORANGE,
    0.9,
  )

  return target
}

function appIcon(size) {
  const scale = 2
  const target = canvas(size * scale, size * scale)

  fill(target, INK)
  glow(target, (size * scale) / 2, (size * scale) / 2, size * scale * 0.7, ORANGE, 0.2)
  logo(target, (size * scale) / 2, (size * scale) / 2, size * scale * 0.78)

  return target
}

for (const [name, target] of [
  ['og-image.png', socialCard()],
  ['apple-touch-icon.png', appIcon(180)],
  ['icon-512.png', appIcon(512)],
]) {
  const { width, height } = writePng(join(PUBLIC, name), target)
  console.log(`public/${name}  ${width}x${height}`)
}
