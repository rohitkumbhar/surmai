import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {VitePWA} from 'vite-plugin-pwa'


// https://vitejs.dev/config/
export default defineConfig(() => {

  // @ts-ignore
  const routeMatchCallback = ({request}) => {
    console.log("match callback request", request)
    return true
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
          icons: [
            { src: "/icons/fish-2.svg", type: "image/svg" }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: routeMatchCallback,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'trips-cache',
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
