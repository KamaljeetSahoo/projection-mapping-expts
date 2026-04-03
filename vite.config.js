import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/projection-mapping-expts/' : '/',
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        art: resolve(__dirname, 'experiments/art/index.html'),
        visualizer: resolve(__dirname, 'experiments/visualizer/index.html'),
        dashboard: resolve(__dirname, 'experiments/dashboard/index.html'),
        geometry: resolve(__dirname, 'experiments/geometry/index.html'),
        motion: resolve(__dirname, 'experiments/motion/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
}));
