import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Custom plugin to copy manifest to dist
function copyManifestPlugin() {
  return {
    name: 'copy-manifest-plugin',
    closeBundle() {
      const publicDir = resolve(__dirname, 'public');
      const distDir = resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      // Copy manifest.json
      if (fs.existsSync(resolve(publicDir, 'manifest.json'))) {
        fs.copyFileSync(
          resolve(publicDir, 'manifest.json'),
          resolve(distDir, 'manifest.json')
        );
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyManifestPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        backgroundWorker: resolve(__dirname, 'src/background/backgroundWorker.js'),
        contentScript: resolve(__dirname, 'src/content/contentScript.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'backgroundWorker') return 'src/background/backgroundWorker.js';
          if (chunkInfo.name === 'contentScript') return 'src/content/contentScript.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
