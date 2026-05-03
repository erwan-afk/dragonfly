import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const srcPath = path.resolve(__dirname, '..', 'public', 'logo-4-2.svg');
  const outPath = path.resolve(__dirname, '..', 'public', 'logo-white.png');

  const raw = fs.readFileSync(srcPath, 'utf-8');

  // Replace all black fills with white
  const whitened = raw.replace(/rgb\(0%,\s*0%,\s*0%\)/g, 'rgb(100%,100%,100%)');

  // High-res render: viewBox is 81x37. Render at 4x the display size for retina-sharp.
  const displayWidth = 130;
  const renderWidth = displayWidth * 4; // 520px

  await sharp(Buffer.from(whitened))
    .resize({ width: renderWidth })
    .png()
    .toFile(outPath);

  console.log(`✅ White logo written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
