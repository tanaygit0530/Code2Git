import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

function copyManifestPlugin() {
  return {
    name: 'copy-manifest-plugin',
    closeBundle() {
      const publicDir = resolve(__dirname, 'public');
      const distDir = resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

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
        // Prevent code splitting for content scripts
        manualChunks(id) {
          if (id.includes('contentScript') || id.includes('submissionDetector') || id.includes('leetcodeAdapter')) {
            return 'contentScriptBundle';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
