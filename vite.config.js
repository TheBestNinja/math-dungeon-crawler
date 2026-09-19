import { defineConfig } from 'vite';

export default defineConfig({
  base: '/math-dungeon-crawler/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    host: true,
  },
});
