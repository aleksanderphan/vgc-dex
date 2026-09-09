import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'vgc-dex — Pokémon Champions VGC',
        short_name: 'VGC Dex',
        description:
          'Mobile-first Pokédex for Pokémon Champions VGC Doubles (Reg M-C): usage %, moves, items, Mega forms. Data is bundled — works offline.',
        lang: 'en',
        theme_color: '#0e1014',
        background_color: '#0e1014',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // The whole dataset is bundled into the JS, so the app is fully offline
        // once the shell is cached. Only the hotlinked PokéAPI sprites are
        // fetched at runtime — cache them opportunistically.
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://raw.githubusercontent.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'poke-sprites',
              expiration: {
                maxEntries: 800,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
