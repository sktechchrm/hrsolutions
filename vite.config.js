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

        // The site deploys to https://sktechchrm.github.io/hrsolutions/
        // so the SPA fallback must point at that path, matching `base`
        // below and the start_url/scope in public/manifest*.json.
navigateFallback: '/hrsolutions/index.html',

navigateFallbackDenylist: [
  /^\/hrsolutions\/api\//,
  /\.html$/,      // relay.html, privacy.html, privacy-policy.html
  /\.json$/,      // all manifest-*.json files
],

        cleanupOutdatedCaches: true,
      },

      manifest: false,
    }),
  ],

  base: '/hrsolutions/',

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