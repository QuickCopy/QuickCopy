// Simple script to create placeholder PWA icons
// Run with: node generate-icons.js

import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🎨 Generating PWA placeholder icons...');

// Create a simple colored square as placeholder
const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

sizes.forEach(({ name, size }) => {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#4F46E5"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.4}" 
            fill="white" text-anchor="middle" dominant-baseline="middle">Q</text>
    </svg>
  `;
  
  writeFileSync(`public/${name.replace('.png', '.svg')}`, svg);
  console.log(`✓ Created public/${name.replace('.png', '.svg')}`);
});

console.log('\n✅ Placeholder SVG icons created!');
console.log('\n⚠️  Note: For production, convert these to PNG using:');
console.log('   - Online tool: https://realfavicongenerator.net/');
console.log('   - Or use ImageMagick: magick convert file.svg file.png');
