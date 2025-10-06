/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults, defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @ts-expect-error types
  const routeMatchCallback: RouteMatchCallback = ({ request }) => {
    return request?.url.includes('api') || request?.url.includes('pdf.worker');
  };
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        minify: false,
        devOptions: {
          enabled: true,
        },
        manifest: {
          theme_color: '#6b7a99',
          icons: [
            {
              src: 'icons/pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: 'screenshots/desktop_home.jpg',
              sizes: '1303x569',
              type: 'image/jpeg',
              form_factor: 'wide',
              label: 'Application',
            },
            {
              src: 'screenshots/mobile_home.jpg',
              sizes: '379x597',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Application',
            },
          ],
        },
        workbox: {
          // Don't return index.html for any API calls
          navigateFallbackDenylist: [/^\/api/],

          runtimeCaching: [
            {
              urlPattern: routeMatchCallback,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'surmai-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        ...(mode === 'development' && {
          // See https://github.com/mantinedev/ui.mantine.dev/issues/113
          '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        }),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'tests/e2e/**'],
      include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
      setupFiles: 'vitest.setup.ts',
    },
  };
});
