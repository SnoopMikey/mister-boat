// Generate PWA icons from the Mister Boat mascot.
// Paints the mascot onto a colored background at the right size and padding for each target.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'assets');
const SRC = path.join(ASSETS, 'mister-boat-clean.png');

const targets = [
  { name: 'icon-192.png', size: 192, pad: 0.10, bg: '#F5EDDD' },
  { name: 'icon-512.png', size: 512, pad: 0.10, bg: '#F5EDDD' },
  { name: 'icon-maskable-512.png', size: 512, pad: 0.22, bg: '#0B2545' },
  { name: 'apple-touch-icon.png', size: 180, pad: 0.08, bg: '#F5EDDD' },
];

for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2));
  const mascot = await sharp(SRC).resize({ width: inner, height: inner, fit: 'inside' }).toBuffer();
  const meta = await sharp(mascot).metadata();
  const top = Math.round((t.size - meta.height) / 2);
  const left = Math.round((t.size - meta.width) / 2);
  await sharp({
    create: { width: t.size, height: t.size, channels: 4, background: t.bg },
  })
    .composite([{ input: mascot, top, left }])
    .png()
    .toFile(path.join(ASSETS, t.name));
  console.log('wrote', t.name);
}
