import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/projection-mapping-expts/' : '/';
  return {
    base,
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
          immersive: resolve(__dirname, 'experiments/immersive/index.html'),
          mapper: resolve(__dirname, 'experiments/mapper/index.html'),
        },
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: [
          'favicon.ico',
          'icon.svg',
          'apple-touch-icon-180x180.png',
        ],
        manifest: {
          name: 'Projection Lab',
          short_name: 'ProjLab',
          description: 'Interactive projection mapping experiments — drawing, generative art, motion & audio visuals.',
          theme_color: '#0a0a0a',
          background_color: '#0a0a0a',
          display: 'fullscreen',
          display_override: ['fullscreen', 'standalone'],
          orientation: 'any',
          scope: base,
          start_url: base,
          lang: 'en',
          handle_links: 'preferred',
          launch_handler: {
            client_mode: ['navigate-existing', 'auto'],
          },
          icons: [
            { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: [/^\/api/],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-cache',
                networkTimeoutSeconds: 3,
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === 'https://fonts.googleapis.com' ||
                url.origin === 'https://fonts.gstatic.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts' },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  };
});
