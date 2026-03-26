import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Include all assets under public/ in the precache manifest
      includeAssets: ['favicon-48.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Peptide Tracker',
        short_name: 'Peptides',
        description: 'Track your peptide protocols, doses, and progress.',
        theme_color: '#1D9E75',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache the app shell and all precacheable assets
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        // Runtime cache strategy for Supabase API calls
        runtimeCaching: [
          {
            // Supabase REST + Auth
            urlPattern: /^https:\/\/[a-z]+\.supabase\.co\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@peptide/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    },
  },
  server: {
    allowedHosts: ['eucalyptic-nonpunitive-lanette.ngrok-free.dev'],
  },
  build: {
    outDir: 'dist',
  },
  base: './',
})
