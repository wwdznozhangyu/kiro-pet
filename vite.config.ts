import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Two renderer entry points: the pet window and the word-card window.
// Output goes to dist/renderer and is loaded by Electron via file:// in production.
export default defineConfig({
  root: 'src',
  base: './',
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        pet: resolve(__dirname, 'src/pet/index.html'),
        card: resolve(__dirname, 'src/card/index.html')
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
