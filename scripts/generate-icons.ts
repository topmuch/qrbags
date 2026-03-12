import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = join(process.cwd(), 'public', 'icons');

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon
const createSvgIcon = (size: number, bgColor = '#080c1a', accentColor = '#b8860b') => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${accentColor}"/>
      <stop offset="100%" style="stop-color:#d4af37"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="${bgColor}"/>

  <!-- QR Code Style Pattern -->
  <g transform="translate(${size * 0.15}, ${size * 0.15})">
    <!-- Top Left Corner -->
    <rect x="0" y="0" width="${size * 0.25}" height="${size * 0.25}" rx="${size * 0.03}" fill="url(#gold)"/>
    <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.15}" height="${size * 0.15}" rx="${size * 0.02}" fill="${bgColor}"/>
    <rect x="${size * 0.08}" y="${size * 0.08}" width="${size * 0.09}" height="${size * 0.09}" fill="url(#gold)"/>

    <!-- Top Right Corner -->
    <rect x="${size * 0.45}" y="0" width="${size * 0.25}" height="${size * 0.25}" rx="${size * 0.03}" fill="url(#gold)"/>
    <rect x="${size * 0.50}" y="${size * 0.05}" width="${size * 0.15}" height="${size * 0.15}" rx="${size * 0.02}" fill="${bgColor}"/>
    <rect x="${size * 0.53}" y="${size * 0.08}" width="${size * 0.09}" height="${size * 0.09}" fill="url(#gold)"/>

    <!-- Bottom Left Corner -->
    <rect x="0" y="${size * 0.45}" width="${size * 0.25}" height="${size * 0.25}" rx="${size * 0.03}" fill="url(#gold)"/>
    <rect x="${size * 0.05}" y="${size * 0.50}" width="${size * 0.15}" height="${size * 0.15}" rx="${size * 0.02}" fill="${bgColor}"/>
    <rect x="${size * 0.08}" y="${size * 0.53}" width="${size * 0.09}" height="${size * 0.09}" fill="url(#gold)"/>

    <!-- Center Pattern -->
    <rect x="${size * 0.30}" y="${size * 0.30}" width="${size * 0.10}" height="${size * 0.10}" fill="url(#gold)"/>
    <rect x="${size * 0.45}" y="${size * 0.30}" width="${size * 0.10}" height="${size * 0.10}" fill="url(#gold)"/>
    <rect x="${size * 0.30}" y="${size * 0.45}" width="${size * 0.10}" height="${size * 0.10}" fill="url(#gold)"/>
    <rect x="${size * 0.45}" y="${size * 0.45}" width="${size * 0.10}" height="${size * 0.10}" fill="url(#gold)"/>
  </g>
</svg>
`;

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const svg = createSvgIcon(size);
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);

    try {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon-${size}x${size}.png:`, error);
    }
  }

  // Generate maskable icon
  const maskableSize = 512;
  const maskableSvg = `
<svg width="${maskableSize}" height="${maskableSize}" viewBox="0 0 ${maskableSize} ${maskableSize}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${maskableSize}" height="${maskableSize}" fill="#080c1a"/>
  <g transform="translate(50, 50)">
    <rect x="50" y="50" width="120" height="120" rx="15" fill="#b8860b"/>
    <rect x="70" y="70" width="80" height="80" rx="10" fill="#080c1a"/>
    <rect x="85" y="85" width="50" height="50" fill="#b8860b"/>

    <rect x="300" y="50" width="120" height="120" rx="15" fill="#b8860b"/>
    <rect x="320" y="70" width="80" height="80" rx="10" fill="#080c1a"/>
    <rect x="335" y="85" width="50" height="50" fill="#b8860b"/>

    <rect x="50" y="300" width="120" height="120" rx="15" fill="#b8860b"/>
    <rect x="70" y="320" width="80" height="80" rx="10" fill="#080c1a"/>
    <rect x="85" y="335" width="50" height="50" fill="#b8860b"/>

    <rect x="230" y="230" width="50" height="50" fill="#b8860b"/>
    <rect x="300" y="300" width="80" height="80" fill="#b8860b"/>
  </g>
</svg>
  `;

  try {
    await sharp(Buffer.from(maskableSvg))
      .png()
      .toFile(join(iconsDir, 'maskable-icon-512x512.png'));
    console.log('✓ Generated maskable-icon-512x512.png');
  } catch (error) {
    console.error('✗ Failed to generate maskable icon:', error);
  }

  // Generate favicon
  try {
    await sharp(Buffer.from(createSvgIcon(32)))
      .png()
      .toFile(join(process.cwd(), 'public', 'favicon.png'));
    console.log('✓ Generated favicon.png');
  } catch (error) {
    console.error('✗ Failed to generate favicon:', error);
  }

  console.log('\n✅ All icons generated successfully!');
}

generateIcons();
