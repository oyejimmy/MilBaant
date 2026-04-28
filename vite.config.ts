import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Explicitly include R3F packages so Vite pre-bundles them on first start.
    // Without this, newly installed packages can cause 504 "Outdated Optimize Dep" errors.
    include: [
      '@react-three/fiber',
      '@react-three/drei',
      'three',
    ],
  },
})
