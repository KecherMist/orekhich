import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages раздаёт сайт из подпапки /<repo>/ — базовый путь подставляет CI (VITE_BASE).
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8090' },
  },
  build: { outDir: 'dist', sourcemap: false },
});
