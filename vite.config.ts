import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'pwa-icon.png',
        'pwa-icon.svg',
        'pwa-192.png',
        'pwa-512.png',
        'apple-touch-icon.png',
        'favicon-32.png',
        'favicon-16.png',
        'loader.gif',
      ],
      manifest: {
        name: 'MilBaant – Flatmate Expense Manager',
        short_name: 'MilBaant',
        description: 'Track flatmate expenses, rides, cook ledger, and contributions.',
        theme_color: '#1465a3',
        background_color: '#1465a3',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        id: '/',
        icons: [
          { src: '/favicon-32.png',  sizes: '32x32',   type: 'image/png',     purpose: 'any' },
          { src: '/pwa-192.png',     sizes: '192x192', type: 'image/png',     purpose: 'any' },
          { src: '/pwa-512.png',     sizes: '512x512', type: 'image/png',     purpose: 'any' },
          { src: '/pwa-512.png',     sizes: '512x512', type: 'image/png',     purpose: 'maskable' },
          { src: '/pwa-icon.svg',    sizes: 'any',     type: 'image/svg+xml', purpose: 'any' },
        ],
        screenshots: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'MilBaant Dashboard',
          },
        ],
        categories: ['finance', 'utilities'],
        lang: 'en',
        dir: 'ltr',
      },
      workbox: {
        // Cache all static assets (JS, CSS, fonts, images)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/rest\//, /^\/auth\//],

        // Increase precache size limit (three.js chunk is large)
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB

        runtimeCaching: [
          // ── Google Fonts ──────────────────────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Supabase REST API — NetworkFirst with offline fallback ────
          // Serves cached data when offline; updates cache when online.
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Supabase Storage (bill images, avatars, screenshots) ──────
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Don't pre-bundle heavy optional deps — keep them in their own lazy chunks
  optimizeDeps: {
    exclude: [],
  },

  build: {
    // Target modern mobile browsers — smaller output, no legacy polyfills
    target: ['es2020', 'chrome80', 'safari14'],
    chunkSizeWarningLimit: 1400,
    // Enable CSS code splitting so each page only loads its own styles
    cssCodeSplit: true,
    // Minify with esbuild (default) — fastest, good for mobile
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Use content hashes for long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          // React core — always needed, small and stable
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react'
          }
          // xlsx — heavy, only used for exports
          if (id.includes('node_modules/xlsx')) {
            return 'vendor-xlsx'
          }
          // html2canvas — only used for screenshots
          if (id.includes('node_modules/html2canvas')) {
            return 'vendor-html2canvas'
          }
          // Ant Design (icons + core together to avoid circular init errors)
          if (id.includes('node_modules/@ant-design/icons') ||
              id.includes('node_modules/antd') ||
              id.includes('node_modules/@ant-design/')) {
            return 'vendor-antd'
          }
          // Supabase client
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase'
          }
          // styled-components — used everywhere
          if (id.includes('node_modules/styled-components')) {
            return 'vendor-styled'
          }
          // TanStack Query
          if (id.includes('node_modules/@tanstack')) {
            return 'vendor-query'
          }
        },
      },
    },
  },
})
