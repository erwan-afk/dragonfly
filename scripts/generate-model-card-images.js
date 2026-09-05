// One-off build script: generates AVIF/WebP responsive variants (320/640/960px)
// plus a compressed JPEG fallback for the homepage "popular models" cards.
// Run with: node scripts/generate-model-card-images.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_DIR = path.join(__dirname, '..', 'public', 'models');
const OUTPUT_DIR = path.join(SOURCE_DIR, 'optimized');
const WIDTHS = [320, 640, 960];
const MODELS = ['df25', 'df28', 'df32', 'df920'];

async function generateVariants(key) {
  const srcPath = path.join(SOURCE_DIR, `${key}.jpg`);
  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️  Skipping ${key}: ${srcPath} not found`);
    return;
  }

  const meta = await sharp(srcPath).metadata();
  console.log(`\n${key}.jpg — source ${meta.width}x${meta.height}`);

  for (const width of WIDTHS) {
    const height = Math.round((width * (meta.height || 1)) / (meta.width || 1));

    const avifPath = path.join(OUTPUT_DIR, `${key}-${width}.avif`);
    await sharp(srcPath).resize({ width }).avif({ quality: 55 }).toFile(avifPath);

    const webpPath = path.join(OUTPUT_DIR, `${key}-${width}.webp`);
    await sharp(srcPath).resize({ width }).webp({ quality: 70 }).toFile(webpPath);

    console.log(`  ${width}w -> avif/webp (${height}h)`);
  }

  // JPEG fallback for browsers without AVIF/WebP support, at the largest
  // breakpoint only — this replaces the original multi-MB source as the
  // <img> fallback src.
  const jpgPath = path.join(OUTPUT_DIR, `${key}-960.jpg`);
  await sharp(srcPath)
    .resize({ width: 960 })
    .jpeg({ quality: 72, mozjpeg: true })
    .toFile(jpgPath);

  const fallbackHeight = Math.round((960 * (meta.height || 1)) / (meta.width || 1));
  console.log(`  960w -> jpg fallback (${fallbackHeight}h)`);

  return {
    key,
    width: meta.width,
    height: meta.height,
    fallbackHeight
  };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const results = [];
  for (const key of MODELS) {
    const r = await generateVariants(key);
    if (r) results.push(r);
  }

  console.log('\nIntrinsic aspect ratios (for width/height attributes):');
  for (const r of results) {
    console.log(
      `  ${r.key}: ${r.width}x${r.height} (960w -> ${r.fallbackHeight}h)`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
