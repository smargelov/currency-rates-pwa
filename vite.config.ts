/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
          {
            // Generated per deployment from env vars; keep the last copy for offline.
            urlPattern: /\/donations\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'donations', networkTimeoutSeconds: 3 },
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
