import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/math-dungeon-crawler/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        autotile: resolve(root, 'autotile.html'),
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
