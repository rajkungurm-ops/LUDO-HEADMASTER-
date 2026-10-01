import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const svgPath = path.join(publicDir, 'icon.svg');

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // Apple touch icon 180x180 PNG
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Maskable 512x512 PNG with generous 15% safe padding
  await sharp(svgBuffer)
    .resize(430, 430)
    .extend({
      top: 41,
      bottom: 41,
      left: 41,
      right: 41,
      background: { r: 11, g: 23, b: 54, alpha: 1 },
    })
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // Favicon 64x64 PNG
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated favicon.ico');

  // Screenshot preview 640x360 for store install banner
  await sharp(svgBuffer)
    .resize(320, 320)
    .extend({
      top: 40,
      bottom: 40,
      left: 160,
      right: 160,
      background: { r: 10, g: 45, b: 100, alpha: 1 },
    })
    .png()
    .toFile(path.join(publicDir, 'pwa-screenshot.png'));
  console.log('Generated pwa-screenshot.png');
}

generate().catch(console.error);
