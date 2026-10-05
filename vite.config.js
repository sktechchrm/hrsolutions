import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,ttf}'
        ],

        // Was '/hrsolutions/index.html' — a leftover from an earlier
        // project/folder name. The site actually deploys under
        // /calculator/ (see package.json "homepage" and public/manifest*
        // start_url/scope), so the old path never matched and offline
        // SPA-routing fallback silently did nothing.
        navigateFallback: '/calculator/index.html',

        navigateFallbackDenylist: [
          /^\/calculator\/api\//
        ],

        cleanupOutdatedCaches: true,
      },

      manifest: false,
    }),
  ],

  base: './',

  publicDir: 'public',

  build: {
    target: 'es2015',
    cssTarget: 'chrome61',
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild',
    cssMinify: true,

    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})