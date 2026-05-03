import fs from 'fs';
import path from 'path';

/**
 * Generate a BIMI-compliant SVG (SVG Tiny 1.2 with PS profile).
 * Spec: https://bimigroup.org/svg-tiny-ps-faqs/
 *
 * Constraints:
 * - SVG Tiny 1.2, baseProfile="tiny-ps"
 * - Square (1:1)
 * - No <style>, no scripts, no external refs, no xlink
 * - Must include <title>
 * - File size ≤ 32 KB
 */

async function main() {
  const srcSvg = fs.readFileSync(
    path.resolve(__dirname, '..', 'public', 'logo-4-2.svg'),
    'utf-8'
  );

  // Extract path data from the existing logo, replace black fills with white
  // The original logo is viewBox="0 0 81 37" — wordmark "DRAGONFLY TRIMARANS"
  const pathRegex = /<path\s+style="[^"]*"\s+d="([^"]+)"\s*\/>/g;
  const paths: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pathRegex.exec(srcSvg)) !== null) {
    paths.push(match[1]);
  }

  if (paths.length === 0) {
    throw new Error('No paths found in source SVG');
  }

  // Build a 512x512 BIMI-compliant SVG.
  // The original logo is 81 wide × 37 tall (aspect ~2.19:1).
  // To fit it in a 512×512 square with padding, scale and center it.
  // Target logo width = 380px (with 66px padding each side).
  // Scale factor = 380 / 81 ≈ 4.69
  // Logo height after scale = 37 × 4.69 ≈ 174px
  // Vertical center = (512 - 174) / 2 = 169
  const scale = 380 / 81;
  const tx = (512 - 81 * scale) / 2;
  const ty = (512 - 37 * scale) / 2;

  const bimiSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 512 512">
  <title>Dragonfly Trimarans</title>
  <rect width="512" height="512" fill="#235B68"/>
  <g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(4)})" fill="#FDFDFD">
${paths.map((d) => `    <path d="${d}"/>`).join('\n')}
  </g>
</svg>
`;

  const outPath = path.resolve(__dirname, '..', 'public', 'bimi-logo.svg');
  fs.writeFileSync(outPath, bimiSvg, 'utf-8');

  const sizeKb = (Buffer.byteLength(bimiSvg, 'utf-8') / 1024).toFixed(1);
  console.log(`✅ BIMI SVG written to ${outPath}`);
  console.log(`   Size: ${sizeKb} KB (must be ≤ 32 KB)`);
  console.log(`   Paths: ${paths.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
