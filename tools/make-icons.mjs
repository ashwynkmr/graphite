// Draws the Graphite icon (a graphite "G" ring on warm paper) as PNGs with no dependencies.
// Run: npm run icons. Output goes to public/ and is committed.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const PAPER = [0xf6, 0xf1, 0xe7];
const GRAPHITE = [0x2a, 0x2a, 0x2d];
const INK = [0x2c, 0x4a, 0x7c];

// Colour of the mark at (x, y) in unit square, y down. Returns colour or null.
function mark(x, y, scale) {
  const cx = 0.5;
  const cy = 0.5;
  const R = 0.27 * scale;
  const t = 0.075 * scale;
  const dx = x - cx;
  const dy = cy - y; // y up for angles
  const r = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
  const onRing = Math.abs(r - R) <= t / 2 && !(ang > 0 && ang < 52);
  const onBar = Math.abs(dy) <= t / 2 && dx >= 0.02 * scale && dx <= R + t / 2;
  if (onRing || onBar) return GRAPHITE;
  // Ink-blue underline, like a single ruled line under the letter.
  const ly = cy + R + t * 1.9;
  if (Math.abs(y - ly) <= t * 0.28 && Math.abs(dx) <= R * 0.9) return INK;
  return null;
}

function render(size, scale) {
  const ss = 4; // 4x4 supersampling for smooth edges
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let rr = 0, gg = 0, bb = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const c = mark((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size, scale) ?? PAPER;
          rr += c[0]; gg += c[1]; bb += c[2];
        }
      }
      const n = ss * ss;
      const o = py * (size * 3 + 1) + 1 + px * 3;
      raw[o] = Math.round(rr / n);
      raw[o + 1] = Math.round(gg / n);
      raw[o + 2] = Math.round(bb / n);
    }
  }
  return png(size, size, raw);
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(w, h, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync('public/icon-192.png', render(192, 1));
writeFileSync('public/icon-512.png', render(512, 1));
writeFileSync('public/icon-512-maskable.png', render(512, 0.78)); // inside the 80% safe zone
writeFileSync('public/apple-touch-icon.png', render(180, 0.92));
console.log('icons written to public/');
