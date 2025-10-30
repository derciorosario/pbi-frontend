import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import babel from "@rollup/plugin-babel";
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      babelHelpers: "bundled",
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      include: ["src/**/*"],
    }),
    VitePWA({
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 // 4 MB
      },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: '54Links',
        short_name: '54Links',
        description: '54Links - Exciting Technologies',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      }
    })
  ],
  build: {
    target: ["es2015"], // Ensure compatibility with older browsers
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})


