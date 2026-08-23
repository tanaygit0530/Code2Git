const fs = require('fs');
const path = require('path');

// Simple valid 1x1 green PNG base64 decoded
const base64Png = 'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const iconBuffer = Buffer.from(base64Png, 'base64');

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

['icon16.png', 'icon48.png', 'icon128.png'].forEach(filename => {
  fs.writeFileSync(path.join(iconsDir, filename), iconBuffer);
});

console.log('Extension icons created successfully.');
