/**
 * 生成背景图素材
 * 运行: node scripts/generate-backgrounds.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../public/backgrounds');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============ 纯色背景 ============
const solidColors = [
  { name: 'white', color: '#FFFFFF', label: '纯白' },
  { name: 'light-gray', color: '#F5F5F5', label: '浅灰' },
  { name: 'gray', color: '#E0E0E0', label: '灰色' },
  { name: 'dark-gray', color: '#424242', label: '深灰' },
  { name: 'black', color: '#000000', label: '纯黑' },
  { name: 'cream', color: '#FFF8E7', label: '米白' },
  { name: 'light-pink', color: '#FFE4E6', label: '浅粉' },
  { name: 'light-blue', color: '#E0F2FE', label: '浅蓝' },
  { name: 'light-green', color: '#DCFCE7', label: '浅绿' },
  { name: 'light-yellow', color: '#FEF9C3', label: '浅黄' },
  { name: 'light-purple', color: '#F3E8FF', label: '浅紫' },
  { name: 'beige', color: '#F5F5DC', label: '米色' },
];

// ============ 渐变背景 ============
const gradients = [
  { name: 'gray-fade', colors: ['#FFFFFF', '#E5E5E5'], direction: '180', label: '灰白渐变' },
  { name: 'warm-fade', colors: ['#FFF7ED', '#FFEDD5'], direction: '180', label: '暖色渐变' },
  { name: 'cool-fade', colors: ['#F0F9FF', '#E0F2FE'], direction: '180', label: '冷色渐变' },
  { name: 'pink-fade', colors: ['#FFF1F2', '#FFE4E6'], direction: '180', label: '粉色渐变' },
  { name: 'green-fade', colors: ['#F0FDF4', '#DCFCE7'], direction: '180', label: '绿色渐变' },
  { name: 'purple-fade', colors: ['#FAF5FF', '#F3E8FF'], direction: '180', label: '紫色渐变' },
  { name: 'sunset', colors: ['#FEF3C7', '#FDE68A', '#FCD34D'], direction: '135', label: '日落' },
  { name: 'ocean', colors: ['#E0F2FE', '#BAE6FD', '#7DD3FC'], direction: '135', label: '海洋' },
  { name: 'rose', colors: ['#FFE4E6', '#FECDD3', '#FDA4AF'], direction: '135', label: '玫瑰' },
  { name: 'mint', colors: ['#D1FAE5', '#A7F3D0', '#6EE7B7'], direction: '135', label: '薄荷' },
  { name: 'radial-light', colors: ['#FFFFFF', '#F3F4F6'], direction: 'radial', label: '径向浅色' },
  { name: 'radial-warm', colors: ['#FFFBEB', '#FEF3C7'], direction: 'radial', label: '径向暖色' },
];

// ============ 图案背景 ============
const patterns = [
  { name: 'dots-light', type: 'dots', bg: '#FFFFFF', fg: '#E5E5E5', size: 20, label: '浅色波点' },
  { name: 'dots-gray', type: 'dots', bg: '#F5F5F5', fg: '#D4D4D4', size: 20, label: '灰色波点' },
  { name: 'grid-light', type: 'grid', bg: '#FFFFFF', fg: '#F0F0F0', size: 40, label: '浅色网格' },
  { name: 'grid-blue', type: 'grid', bg: '#F0F9FF', fg: '#BAE6FD', size: 40, label: '蓝色网格' },
  { name: 'stripes-light', type: 'stripes', bg: '#FFFFFF', fg: '#F5F5F5', size: 20, label: '浅色条纹' },
  { name: 'stripes-warm', type: 'stripes', bg: '#FFFBEB', fg: '#FEF3C7', size: 20, label: '暖色条纹' },
  { name: 'diagonal-light', type: 'diagonal', bg: '#FFFFFF', fg: '#F0F0F0', size: 15, label: '浅色斜纹' },
  { name: 'diagonal-pink', type: 'diagonal', bg: '#FFF1F2', fg: '#FFE4E6', size: 15, label: '粉色斜纹' },
];

// 生成纯色 SVG
function generateSolidSVG(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="${color}"/>
</svg>`;
}

// 生成渐变 SVG
function generateGradientSVG(colors, direction) {
  const id = 'grad' + Math.random().toString(36).substr(2, 9);

  if (direction === 'radial') {
    const stops = colors.map((color, i) =>
      `<stop offset="${i / (colors.length - 1) * 100}%" style="stop-color:${color}"/>`
    ).join('\n    ');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <radialGradient id="${id}" cx="50%" cy="50%" r="70%">
    ${stops}
    </radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#${id})"/>
</svg>`;
  }

  const angle = parseInt(direction);
  const rad = (angle - 90) * Math.PI / 180;
  const x1 = 50 - 50 * Math.cos(rad);
  const y1 = 50 - 50 * Math.sin(rad);
  const x2 = 50 + 50 * Math.cos(rad);
  const y2 = 50 + 50 * Math.sin(rad);

  const stops = colors.map((color, i) =>
    `<stop offset="${i / (colors.length - 1) * 100}%" style="stop-color:${color}"/>`
  ).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
    ${stops}
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#${id})"/>
</svg>`;
}

// 生成图案 SVG
function generatePatternSVG(type, bg, fg, size) {
  const patternId = 'pattern' + Math.random().toString(36).substr(2, 9);

  let patternContent = '';

  switch (type) {
    case 'dots':
      patternContent = `
    <pattern id="${patternId}" x="0" y="0" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <rect width="${size}" height="${size}" fill="${bg}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size/6}" fill="${fg}"/>
    </pattern>`;
      break;

    case 'grid':
      patternContent = `
    <pattern id="${patternId}" x="0" y="0" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <rect width="${size}" height="${size}" fill="${bg}"/>
      <path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${fg}" stroke-width="1"/>
    </pattern>`;
      break;

    case 'stripes':
      patternContent = `
    <pattern id="${patternId}" x="0" y="0" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <rect width="${size}" height="${size}" fill="${bg}"/>
      <rect x="0" y="0" width="${size/2}" height="${size}" fill="${fg}"/>
    </pattern>`;
      break;

    case 'diagonal':
      patternContent = `
    <pattern id="${patternId}" x="0" y="0" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="${size}" height="${size}" fill="${bg}"/>
      <rect x="0" y="0" width="${size/2}" height="${size}" fill="${fg}"/>
    </pattern>`;
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>${patternContent}
  </defs>
  <rect width="800" height="800" fill="url(#${patternId})"/>
</svg>`;
}

// 生成背景配置文件
function generateConfig() {
  const config = {
    solid: solidColors.map(s => ({
      id: s.name,
      label: s.label,
      color: s.color,
      file: `solid/${s.name}.svg`,
      type: 'solid'
    })),
    gradient: gradients.map(g => ({
      id: g.name,
      label: g.label,
      colors: g.colors,
      direction: g.direction,
      file: `gradient/${g.name}.svg`,
      type: 'gradient'
    })),
    pattern: patterns.map(p => ({
      id: p.name,
      label: p.label,
      file: `pattern/${p.name}.svg`,
      type: 'pattern'
    }))
  };

  return config;
}

// 主函数
function main() {
  console.log('开始生成背景图...\n');

  // 创建子目录
  ['solid', 'gradient', 'pattern'].forEach(dir => {
    const dirPath = path.join(OUTPUT_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  // 生成纯色背景
  console.log('生成纯色背景...');
  solidColors.forEach(({ name, color, label }) => {
    const svg = generateSolidSVG(color);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'solid', `${name}.svg`), svg);
    console.log(`  ✓ ${label} (${name})`);
  });

  // 生成渐变背景
  console.log('\n生成渐变背景...');
  gradients.forEach(({ name, colors, direction, label }) => {
    const svg = generateGradientSVG(colors, direction);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'gradient', `${name}.svg`), svg);
    console.log(`  ✓ ${label} (${name})`);
  });

  // 生成图案背景
  console.log('\n生成图案背景...');
  patterns.forEach(({ name, type, bg, fg, size, label }) => {
    const svg = generatePatternSVG(type, bg, fg, size);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'pattern', `${name}.svg`), svg);
    console.log(`  ✓ ${label} (${name})`);
  });

  // 生成配置文件
  console.log('\n生成配置文件...');
  const config = generateConfig();
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'config.json'),
    JSON.stringify(config, null, 2)
  );
  console.log('  ✓ config.json');

  console.log('\n✅ 完成! 共生成:');
  console.log(`   - ${solidColors.length} 个纯色背景`);
  console.log(`   - ${gradients.length} 个渐变背景`);
  console.log(`   - ${patterns.length} 个图案背景`);
  console.log(`   - 1 个配置文件`);
}

main();
