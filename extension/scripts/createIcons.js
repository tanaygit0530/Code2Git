import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard valid 1x1 pixel PNG binary buffer
const pngBase64 = 'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const buffer = Buffer.from(pngBase64, 'base64');

const publicIconsDir = path.join(__dirname, '../public/icons');
const distIconsDir = path.join(__dirname, '../dist/icons');

[publicIconsDir, distIconsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

['icon16.png', 'icon48.png', 'icon128.png'].forEach(file => {
  fs.writeFileSync(path.join(publicIconsDir, file), buffer);
  fs.writeFileSync(path.join(distIconsDir, file), buffer);
});

console.log('✅ Created valid PNG icons successfully.');
