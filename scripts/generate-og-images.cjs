const path = require('path');
const sharp = require('sharp');

// OG Image dimensions: 1200x630
const WIDTH = 1200;
const HEIGHT = 630;

const pages = [
  {
    name: 'og-image',
    title: 'FixPic',
    subtitle: 'Free Online Image Tools',
    gradient: ['#667eea', '#764ba2']
  },
  {
    name: 'og-remove-transparency',
    title: 'Remove Fake Transparency',
    subtitle: 'Convert AI checkerboard to real transparent',
    gradient: ['#11998e', '#38ef7d']
  },
  {
    name: 'og-compress',
    title: 'Compress and Convert',
    subtitle: 'Reduce image size, convert to WebP, PNG, JPEG',
    gradient: ['#ee0979', '#ff6a00']
  },
  {
    name: 'og-resize',
    title: 'Resize Images',
    subtitle: 'Adjust dimensions, maintain aspect ratio',
    gradient: ['#4776E6', '#8E54E9']
  }
];

function generateSVG(page) {
  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${page.gradient[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${page.gradient[1]};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- Pattern overlay -->
  <pattern id="pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
    <circle cx="30" cy="30" r="2" fill="white" fill-opacity="0.1"/>
  </pattern>
  <rect width="100%" height="100%" fill="url(#pattern)"/>

  <!-- Logo Icon -->
  <rect x="550" y="120" width="100" height="100" rx="20" fill="white" fill-opacity="0.2"/>
  <text x="600" y="195" font-family="Arial, sans-serif" font-size="60" font-weight="bold" text-anchor="middle" fill="white">F</text>

  <!-- Title -->
  <text x="600" y="320" font-family="Arial, sans-serif" font-size="64" font-weight="bold" text-anchor="middle" fill="white">${page.title}</text>

  <!-- Subtitle -->
  <text x="600" y="400" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" fill="white" fill-opacity="0.9">${page.subtitle}</text>

  <!-- Brand -->
  <text x="600" y="540" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white" fill-opacity="0.7">fix-pic.com | Free - Private - Fast</text>
</svg>`;
}

async function generateImages() {
  const outputDir = path.join(__dirname, '../public');

  for (const page of pages) {
    const svg = generateSVG(page);
    const svgBuffer = Buffer.from(svg);

    // Convert SVG to PNG
    const pngPath = path.join(outputDir, `${page.name}.png`);
    await sharp(svgBuffer)
      .resize(WIDTH, HEIGHT)
      .png()
      .toFile(pngPath);

    console.log(`Generated: ${page.name}.png`);
  }

  console.log('\nAll OG images generated!');
}

generateImages().catch(console.error);
