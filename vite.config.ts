/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Currency Rates',
        short_name: 'Rates',
        description: 'Fast, ad-free currency converter that works offline',
        lang: 'en',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1c1d24',
        background_color: '#1c1d24',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Rates are stored in localStorage by the app itself; the service worker
        // only precaches the app shell and never intercepts rate requests.
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
        // Flags are fetched lazily and cached on first use instead of being precached.
        runtimeCaching: [
          {
            urlPattern: /\/flags\/[a-z]{2}\.svg$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'flags',
              expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
