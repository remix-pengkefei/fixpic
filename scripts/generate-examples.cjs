const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '../public/examples');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateExamples() {
  console.log('Generating example images...\n');

  // 1. Remove Fake Transparency Example
  // Create a checkerboard pattern SVG (fake transparency)
  const checkerboardSvg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="checker" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#cccccc"/>
          <rect x="10" width="10" height="10" fill="#ffffff"/>
          <rect y="10" width="10" height="10" fill="#ffffff"/>
          <rect x="10" y="10" width="10" height="10" fill="#cccccc"/>
        </pattern>
      </defs>
      <rect width="400" height="300" fill="url(#checker)"/>
      <!-- Simple icon shape -->
      <circle cx="200" cy="130" r="60" fill="#4F46E5"/>
      <rect x="140" y="180" width="120" height="80" rx="10" fill="#4F46E5"/>
    </svg>
  `;

  // Before: with fake checkerboard background
  await sharp(Buffer.from(checkerboardSvg))
    .png()
    .toFile(path.join(outputDir, 'transparency-before.png'));
  console.log('✓ Created transparency-before.png');

  // After: with real transparency (just the shape)
  const transparentSvg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="130" r="60" fill="#4F46E5"/>
      <rect x="140" y="180" width="120" height="80" rx="10" fill="#4F46E5"/>
    </svg>
  `;

  await sharp(Buffer.from(transparentSvg))
    .png()
    .toFile(path.join(outputDir, 'transparency-after.png'));
  console.log('✓ Created transparency-after.png');

  // 2. Compress Example
  // Create a colorful image for compression demo
  const compressSvg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#grad1)"/>
      <circle cx="600" cy="150" r="200" fill="url(#grad2)" opacity="0.7"/>
      <circle cx="200" cy="450" r="180" fill="#ffecd2" opacity="0.6"/>
      <rect x="300" y="200" width="200" height="200" rx="20" fill="white" opacity="0.3"/>
      <text x="400" y="320" font-family="Arial" font-size="48" fill="white" text-anchor="middle">Photo</text>
    </svg>
  `;

  // Before: high quality PNG
  await sharp(Buffer.from(compressSvg))
    .png({ quality: 100, compressionLevel: 0 })
    .toFile(path.join(outputDir, 'compress-before.png'));

  const beforeStats = fs.statSync(path.join(outputDir, 'compress-before.png'));
  console.log(`✓ Created compress-before.png (${(beforeStats.size / 1024).toFixed(1)} KB)`);

  // After: compressed WebP
  await sharp(Buffer.from(compressSvg))
    .webp({ quality: 80 })
    .toFile(path.join(outputDir, 'compress-after.webp'));

  const afterStats = fs.statSync(path.join(outputDir, 'compress-after.webp'));
  console.log(`✓ Created compress-after.webp (${(afterStats.size / 1024).toFixed(1)} KB)`);

  // 3. Resize Example
  // Create a sample image for resize demo
  const resizeSvg = `
    <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E0F6FF;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#skyGrad)"/>
      <!-- Sun -->
      <circle cx="900" cy="150" r="80" fill="#FFD700"/>
      <!-- Mountains -->
      <polygon points="0,800 300,400 600,800" fill="#6B8E23"/>
      <polygon points="400,800 700,350 1000,800" fill="#556B2F"/>
      <polygon points="800,800 1050,450 1200,600 1200,800" fill="#6B8E23"/>
      <!-- Ground -->
      <rect x="0" y="650" width="1200" height="150" fill="#228B22"/>
      <!-- Size indicator -->
      <text x="600" y="750" font-family="Arial" font-size="36" fill="white" text-anchor="middle">1200 x 800</text>
    </svg>
  `;

  // Before: original size
  await sharp(Buffer.from(resizeSvg))
    .png()
    .toFile(path.join(outputDir, 'resize-before.png'));
  console.log('✓ Created resize-before.png (1200x800)');

  // After: resized
  const resizedSvg = `
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skyGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E0F6FF;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#skyGrad2)"/>
      <!-- Sun -->
      <circle cx="450" cy="75" r="40" fill="#FFD700"/>
      <!-- Mountains -->
      <polygon points="0,400 150,200 300,400" fill="#6B8E23"/>
      <polygon points="200,400 350,175 500,400" fill="#556B2F"/>
      <polygon points="400,400 525,225 600,300 600,400" fill="#6B8E23"/>
      <!-- Ground -->
      <rect x="0" y="325" width="600" height="75" fill="#228B22"/>
      <!-- Size indicator -->
      <text x="300" y="375" font-family="Arial" font-size="24" fill="white" text-anchor="middle">600 x 400</text>
    </svg>
  `;

  await sharp(Buffer.from(resizedSvg))
    .png()
    .toFile(path.join(outputDir, 'resize-after.png'));
  console.log('✓ Created resize-after.png (600x400)');

  console.log('\n✨ All example images generated successfully!');
  console.log(`Output directory: ${outputDir}`);
}

generateExamples().catch(console.error);
