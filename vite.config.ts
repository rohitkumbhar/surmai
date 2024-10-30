import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {VitePWA} from 'vite-plugin-pwa'


// https://vitejs.dev/config/
export default defineConfig(() => {

  // @ts-expect-error types
  const routeMatchCallback: RouteMatchCallback = ({request}) => {
    return request?.url.includes("api") || request?.url.includes("pdf.worker");
  }
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        minify: false,
        devOptions: {
          enabled: true
        },
        manifest: {
          theme_color: '#6b7a99',
          icons: [
            {
              src: "icons/pwa-64x64.png",
              sizes: "64x64",
              type: "image/png"
            },
            {
              src: "icons/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "icons/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png"
            },
            {
              src: "icons/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ],
          screenshots: [
            {

              src: "screenshots/wide.jpg",
              sizes: "1303x569",
              type: "image/jpeg",
              form_factor: "wide",
              label: "Application"
            },
            {

              src: "screenshots/mobile.jpg",
              sizes: "379x597",
              type: "image/jpeg",
              form_factor: "narrow",
              label: "Application"
            }
          ]
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
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
  }
})
