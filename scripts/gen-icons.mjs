import { PNG } from 'pngjs';
import { writeFileSync } from 'fs';

function lerp(a, b, t) { return a + (b - a) * t; }

// Brand gradient: #7c5cff -> #00d3a7 (135deg)
const C1 = [0x7c, 0x5c, 0xff];
const C2 = [0x00, 0xd3, 0xa7];

function makeIcon(size, padding = 0) {
  const png = new PNG({ width: size, height: size });
  const r = size - padding * 2;
  const radius = r * 0.22; // rounded square

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Gradient direction: top-left to bottom-right
      const t = ((x - padding) + (y - padding)) / (2 * r);
      const tt = Math.max(0, Math.min(1, t));
      const cr = Math.round(lerp(C1[0], C2[0], tt));
      const cg = Math.round(lerp(C1[1], C2[1], tt));
      const cb = Math.round(lerp(C1[2], C2[2], tt));

      // Inside rounded square mask
      const lx = x - padding, ly = y - padding;
      let inside = lx >= 0 && lx < r && ly >= 0 && ly < r;
      if (inside) {
        // Round corners
        const cxs = [radius, r - radius];
        const cys = [radius, r - radius];
        for (const cx of cxs) for (const cy of cys) {
          const inCorner =
            (cx === radius ? lx < cx : lx > cx) &&
            (cy === radius ? ly < cy : ly > cy);
          if (inCorner) {
            const dx = lx - cx, dy = ly - cy;
            if (dx * dx + dy * dy > radius * radius) inside = false;
          }
        }
      }

      png.data[idx] = inside ? cr : 0;
      png.data[idx + 1] = inside ? cg : 0;
      png.data[idx + 2] = inside ? cb : 0;
      png.data[idx + 3] = inside ? 255 : 0;
    }
  }
  return PNG.sync.write(png);
}

const sizes = [
  ['public/icon-192.png', 192, 0],
  ['public/icon-512.png', 512, 0],
  ['public/apple-touch-icon.png', 180, 0],
  ['public/favicon-32.png', 32, 0],
];

for (const [path, size, padding] of sizes) {
  writeFileSync(path, makeIcon(size, padding));
  console.log('wrote', path);
}
