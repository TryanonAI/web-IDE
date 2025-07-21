import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// polyfill plugins

export default defineConfig({
  plugins: [react(), tailwindcss(), nodePolyfills({
    globals: {
      Buffer: true,
      // global: true,
      // process: true,
    },
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
