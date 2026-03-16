import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'tsgarmy.fc | OG x TSG',
        short_name: 'TSG Army',
        description: 'Official OG x TSG Free Fire MAX rosters, schedule, achievements, and updates',
        theme_color: '#1a0802',
        background_color: '#030201',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/ogtsglogo1.webp', sizes: '192x192', type: 'image/webp', purpose: 'any maskable' },
          { src: '/ogtsglogo1.webp', sizes: '512x512', type: 'image/webp', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,svg}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/api\/(players|schedules|achievements)/,
            handler: 'NetworkFirst',
            options: { cacheName: 'tsgarmy-api', expiration: { maxAgeSeconds: 300 } },
          },
          {
            urlPattern: /\/uploads\//,
            handler: 'CacheFirst',
            options: { cacheName: 'tsgarmy-uploads', expiration: { maxEntries: 50, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
})
