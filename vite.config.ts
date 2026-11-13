/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @ts-expect-error types
  const routeMatchCallback: RouteMatchCallback = ({ request }) => {
    if (request?.url.includes('realtime')) {
      return false;
    }

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
          maximumFileSizeToCacheInBytes: 4194304,
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
        // Imports inside src/ and the tests that reach into it are written
        // '@src/...' rather than walking up with '../../..'.
        '@src': fileURLToPath(new URL('./src', import.meta.url)),
        ...(mode === 'development' && {
          // See https://github.com/mantinedev/ui.mantine.dev/issues/113
          '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        }),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.PLAYWRIGHT_TEST_BACKEND || 'http://localhost:9090',
          changeOrigin: false,
        },
        '/site-settings.json': {
          target: process.env.PLAYWRIGHT_TEST_BACKEND || 'http://localhost:9090',
          changeOrigin: false,
        },
      },
    },
    // The e2e suite serves a build rather than the dev server, so that the
    // browsers are not waiting on modules being compiled on demand.
    preview: {
      proxy: {
        '/api': {
          target: process.env.PLAYWRIGHT_TEST_BACKEND || 'http://localhost:9090',
          changeOrigin: false,
        },
        '/site-settings.json': {
          target: process.env.PLAYWRIGHT_TEST_BACKEND || 'http://localhost:9090',
          changeOrigin: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'tests/e2e/**'],
      include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
      setupFiles: 'vitest.setup.ts',
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.d.ts', 'src/types/**', 'src/main.tsx'],
        reporter: ['text-summary', 'html', 'lcov', 'json-summary'],
        reportsDirectory: 'coverage',
        // Minimum coverage. Raise these as coverage improves, never lower them.
        thresholds: {
          statements: 20,
          branches: 18,
          functions: 14,
          lines: 20,
        },
      },
    },
  };
});
